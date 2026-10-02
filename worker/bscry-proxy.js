// BattleScry CORS Proxy — Cloudflare Worker
// Routes:
//   ?url=<image_url>     -> proxy image with CORS headers
//   ?token=<image_url>   -> get OTFBM token shortcode
//   POST ?upload         -> upload image to imgbb, return permanent URL (legacy)
//   POST ?host           -> upload image to R2 (login required), return cdn URL
//   POST ?enhance        -> AI-upscale an image via Cloudflare Images, store in R2 (login required)
//   /auth/login          -> start Discord OAuth
//   /auth/callback       -> finish Discord OAuth, redirect with signed session
//   /auth/me             -> verify a session token, return {valid,uid,name}
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

var IMGBB_KEY = "REDACTED"; // legacy imgbb route; the real key lives only in the deployed Worker

// ===== Discord OAuth + sessions =====
var DISCORD_REDIRECT_URI = "https://bscry-proxy.rhigman.workers.dev/auth/callback";

function b64url(bytes) {
  var s = btoa(String.fromCharCode.apply(null, bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  var bin = atob(s);
  var out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function signSession(obj) {
  var enc = new TextEncoder();
  var payload = b64url(Array.from(enc.encode(JSON.stringify(obj))));
  var key = await crypto.subtle.importKey("raw", enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  var sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return payload + "." + b64url(Array.from(new Uint8Array(sig)));
}
async function verifySession(token) {
  try {
    if (!token || token.indexOf(".") < 0) return null;
    var parts = token.split(".");
    var payload = parts[0], sig = parts[1];
    var enc = new TextEncoder();
    var key = await crypto.subtle.importKey("raw", enc.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    var ok = await crypto.subtle.verify("HMAC", key, b64urlToBytes(sig), enc.encode(payload));
    if (!ok) return null;
    var obj = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)));
    if (!obj || !obj.uid) return null;
    if (obj.exp && Math.floor(Date.now() / 1000) > obj.exp) return null;
    return obj;
  } catch (e) { return null; }
}

function handleAuthLogin() {
  var state = crypto.randomUUID();
  var authUrl = "https://discord.com/oauth2/authorize?response_type=code" +
    "&client_id=" + encodeURIComponent(DISCORD_CLIENT_ID) +
    "&redirect_uri=" + encodeURIComponent(DISCORD_REDIRECT_URI) +
    "&scope=identify&state=" + encodeURIComponent(state);
  return new Response(null, {
    status: 302,
    headers: {
      "Location": authUrl,
      "Set-Cookie": "bscry_state=" + state + "; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax"
    }
  });
}

async function handleAuthCallback(request) {
  var url = new URL(request.url);
  var code = url.searchParams.get("code");
  var state = url.searchParams.get("state");
  var cookie = request.headers.get("Cookie") || "";
  var m = cookie.match(/(?:^|; )bscry_state=([^;]*)/);
  var saved = m ? m[1] : null;
  if (!code || !state || !saved || state !== saved) {
    return new Response("Login failed (state check). Try again.", { status: 400 });
  }
  var tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: DISCORD_REDIRECT_URI
    })
  });
  if (!tokenRes.ok) return new Response("Token exchange failed: " + tokenRes.status, { status: 502 });
  var token = await tokenRes.json();
  var meRes = await fetch("https://discord.com/api/users/@me", {
    headers: { "Authorization": "Bearer " + token.access_token }
  });
  if (!meRes.ok) return new Response("Could not read identity: " + meRes.status, { status: 502 });
  var me = await meRes.json();

  var sessionObj = {
    uid: me.id,
    name: me.username,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  };
  var session = await signSession(sessionObj);

  // If opened as a popup, hand the token to the app tab and close. Otherwise (popup blocked /
  // direct navigation) fall back to the full-page redirect the app also knows how to consume.
  var tok = JSON.stringify(session);
  var body = "<!doctype html><html><head><meta charset=utf-8><title>Signing in...</title></head>"
    + "<body style=\"font-family:sans-serif;background:#0d0c0a;color:#ddd;display:flex;align-items:center;justify-content:center;height:100vh;margin:0\">"
    + "<div>Signing you in...</div><script>(function(){var t=" + tok + ";"
    + "var origins=[\"https://battlescry.com\",\"https://www.battlescry.com\"];"
    + "if(window.opener&&!window.opener.closed){"
    + "try{origins.forEach(function(o){window.opener.postMessage({type:\"bscry_login\",token:t},o);});}catch(e){}"
    + "try{window.close();}catch(e){}"
    + "setTimeout(function(){location.href=\"https://battlescry.com/#login=\"+encodeURIComponent(t);},500);"
    + "}else{location.href=\"https://battlescry.com/#login=\"+encodeURIComponent(t);}})();<\/script></body></html>";
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Set-Cookie": "bscry_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
    }
  });
}

async function handleRequest(request) {
  var corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  var url = new URL(request.url);

  if (url.pathname === "/auth/login") return handleAuthLogin();
  if (url.pathname === "/auth/callback") return handleAuthCallback(request);
  if (url.pathname === "/auth/me") return handleAuthMe(request);

  var imageUrl = url.searchParams.get("url");
  var tokenUrl = url.searchParams.get("token");
  var isUpload = url.searchParams.has("upload");
  var isHost = url.searchParams.has("host");

  // === HOSTED UPLOAD ROUTE (R2, login required) ===
  if (isHost && request.method === "POST") {
    try {
      var form = await request.formData();
      var sess = await verifySession(form.get("session"));
      if (!sess) {
        return new Response(JSON.stringify({ error: "Login required" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      var f = form.get("file");
      if (!f) {
        return new Response(JSON.stringify({ error: "No file provided" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (f.size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "File too large (max 10MB)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      var buf = await f.arrayBuffer();
      var b = new Uint8Array(buf);
      var isJpeg = b.length > 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
      var isPng = b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
      if (!isJpeg && !isPng) {
        return new Response(JSON.stringify({ error: "Only JPEG or PNG accepted" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      var ext = isJpeg ? ".jpg" : ".png";
      var ctype = isJpeg ? "image/jpeg" : "image/png";
      // Token art is only needed until OTFBM has copied it, so it goes under tk/ (1 day expiry rule on the bucket).
      var key = (form.get("kind") === "token" ? "tk/" : "u/") + crypto.randomUUID().replace(/-/g, "") + ext;
      await MAPS_BUCKET.put(key, buf, {
        httpMetadata: { contentType: ctype },
        customMetadata: { uid: sess.uid, name: sess.name || "", ts: String(Date.now()) }
      });
      return new Response(JSON.stringify({ url: "https://cdn.battlescry.com/" + key, key: key }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Host upload failed: " + err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // === ENHANCE ROUTE (AI upscale via Cloudflare Images, login required) ===
  // POST ?enhance with form fields: session, src (https image URL), ew, eh (target size in px).
  // Fetches src through Cloudflare image resizing with upscale:"generate", stores the result in R2
  // under u/enh- (the prefix tells the site the image was already enhanced) and returns {url, enhanced:true}. On any failure returns {enhanced:false, reason}.
  if (url.searchParams.has("enhance") && request.method === "POST") {
    var jsonH = { ...corsHeaders, "Content-Type": "application/json" };
    try {
      var eform = await request.formData();
      var esess = await verifySession(eform.get("session"));
      if (!esess) return new Response(JSON.stringify({ error: "Login required" }), { status: 401, headers: jsonH });
      var esrc = String(eform.get("src") || "");
      var ew = parseInt(eform.get("ew") || "0", 10), eh = parseInt(eform.get("eh") || "0", 10);
      if (esrc.toLowerCase().indexOf("https://") !== 0 || !(ew >= 100 && eh >= 100 && ew <= 5000 && eh <= 5000)) {
        return new Response(JSON.stringify({ enhanced: false, reason: "bad request" }), { status: 400, headers: jsonH });
      }
      var day = new Date().toISOString().slice(0, 10);
      var capKey = "enh:" + esess.uid + ":" + day;
      var used = parseInt((await BSCRY_KV.get(capKey)) || "0", 10);
      if (used >= 25) return new Response(JSON.stringify({ enhanced: false, reason: "daily limit reached" }), { status: 429, headers: jsonH });
      var er = await fetch(esrc, { cf: { image: { width: ew, height: eh, fit: "cover", upscale: "generate", format: "jpeg", quality: 85 } } });
      var ect = er.headers.get("content-type") || "";
      var resized = er.headers.get("cf-resized") || "";
      if (!er.ok || ect.indexOf("image/") !== 0 || !resized) {
        return new Response(JSON.stringify({ enhanced: false, reason: "resize unavailable (" + er.status + (resized ? "" : ", not transformed") + ")" }), { status: 200, headers: jsonH });
      }
      var ebuf = await er.arrayBuffer();
      if (ebuf.byteLength > 10 * 1024 * 1024) return new Response(JSON.stringify({ enhanced: false, reason: "result too large" }), { status: 200, headers: jsonH });
      var ekey = "u/enh-" + crypto.randomUUID().replace(/-/g, "") + ".jpg";
      await MAPS_BUCKET.put(ekey, ebuf, {
        httpMetadata: { contentType: "image/jpeg" },
        customMetadata: { uid: esess.uid, name: esess.name || "", ts: String(Date.now()), enhancedFrom: esrc.slice(0, 200) }
      });
      await BSCRY_KV.put(capKey, String(used + 1), { expirationTtl: 172800 });
      return new Response(JSON.stringify({ url: "https://cdn.battlescry.com/" + ekey, key: ekey, enhanced: true, bytes: ebuf.byteLength, info: resized }), { status: 200, headers: jsonH });
    } catch (eerr) {
      return new Response(JSON.stringify({ enhanced: false, reason: "enhance failed: " + eerr.message }), { status: 200, headers: jsonH });
    }
  }

  // === UPLOAD ROUTE (imgbb, legacy) ===
  if (isUpload && request.method === "POST") {
    try {
      var incoming = await request.formData();
      var file = incoming.get("file");
      if (!file) {
        return new Response(JSON.stringify({ error: "No file provided" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      var name = file.name.toLowerCase();
      var validExts = [".jpg", ".jpeg", ".png", ".gif"];
      var hasValidExt = validExts.some(function(ext) { return name.endsWith(ext); });
      if (!hasValidExt) {
        return new Response(JSON.stringify({ error: "Only jpg, jpeg, png, gif supported. No webp." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (file.size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "File too large (max 10MB)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      var bytes = await file.arrayBuffer();
      var uint8 = new Uint8Array(bytes);
      var binary = "";
      for (var i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      var base64 = btoa(binary);

      var formData = new FormData();
      formData.append("key", IMGBB_KEY);
      formData.append("image", base64);
      formData.append("name", file.name.replace(/\.[^.]+$/, ""));

      var imgbbResponse = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: formData,
      });

      var result = await imgbbResponse.json();

      if (!result.success) {
        return new Response(JSON.stringify({ error: "imgbb upload failed: " + (result.error ? result.error.message : "unknown") }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        url: result.data.image.url,
        display_url: result.data.display_url,
        thumb_url: result.data.thumb.url,
        width: result.data.width,
        height: result.data.height,
        size: result.data.size,
        delete_url: result.data.delete_url,
        permanent: true
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Upload failed: " + err.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // === TOKEN SHORTCODE ROUTE ===
  if (tokenUrl) {
    try { new URL(tokenUrl); } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      var apiUrl = "https://6p5m9emkug.execute-api.us-west-2.amazonaws.com/prod/token/?url=" + encodeURIComponent(tokenUrl);
      var response = await fetch(apiUrl, {
        headers: { "User-Agent": "BattleScry-TokenProxy/1.0" },
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "OTFBM token API returned " + response.status }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      var html = await response.text();
      var shortcode = "";
      var bodyMatch = html.match(/<body[^>]*>([^<]+)<\/body>/i);
      if (bodyMatch) {
        shortcode = bodyMatch[1].trim();
      } else {
        var metaMatch = html.match(/content="Token short code -> ([^"]+)"/i);
        if (metaMatch) shortcode = metaMatch[1].trim();
      }

      if (!shortcode) {
        return new Response(JSON.stringify({ error: "Could not parse shortcode", raw: html.slice(0, 500) }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ shortcode: shortcode, url: tokenUrl }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Failed to get shortcode: " + err.message }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // === IMAGE PROXY ROUTE ===
  if (imageUrl) {
    try { new URL(imageUrl); } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["http:", "https:"].includes(new URL(imageUrl).protocol)) {
      return new Response(JSON.stringify({ error: "Only HTTP/HTTPS URLs allowed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      var response = await fetch(imageUrl, {
        headers: { "User-Agent": "BattleScry-ImageProxy/1.0" },
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "Upstream returned " + response.status }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      var contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        return new Response(JSON.stringify({ error: "URL did not return an image" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      var contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 20 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "Image too large (max 20MB)" }), {
          status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      var imageResponse = new Response(response.body, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": contentType, "Cache-Control": "public, max-age=3600" },
      });
      if (contentLength) imageResponse.headers.set("Content-Length", contentLength);
      return imageResponse;
    } catch (err) {
      return new Response(JSON.stringify({ error: "Failed to fetch image: " + err.message }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({
    error: "Missing parameter",
    usage: { image_proxy: "?url=<image_url>", token_shortcode: "?token=<image_url>", upload: "POST ?upload", host: "POST ?host (login required)" }
  }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}