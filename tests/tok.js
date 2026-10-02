// Token image upload: framing window, 320px JPEG output, size limits, and the URL fallback.
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let tokenCalls=[];
  await p.route('**bscry-proxy**',async r=>{const u=r.request().url();const H={'access-control-allow-origin':'*'};
    if(u.includes('/auth/me'))return r.fulfill({contentType:'application/json',headers:H,body:JSON.stringify({valid:true,uid:'1',name:'t'})});
    if(u.includes('?token=')){const src=decodeURIComponent(u.split('?token=')[1]);tokenCalls.push(src);
      return r.fulfill({contentType:'application/json',headers:H,body:JSON.stringify(src.includes('blocked.example')?{error:'OTFBM token API returned 502'}:{shortcode:'abc12'})});}
    if(u.includes('?url=')){ // our own fetch of a remote image: a 600x300 png made below
      return r.fulfill({contentType:'image/png',headers:H,body:Buffer.from(global.remotePng,'base64')});}
    r.abort();});
  await p.route('**token.otfbm.io/**',r=>r.abort());
  await p.goto('http://localhost:8765/index.html?test=1'); await p.waitForTimeout(500);
  global.remotePng=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=600;c.height=300;const x=c.getContext('2d');x.fillStyle='#d22';x.fillRect(0,0,200,300);x.fillStyle='#2a2';x.fillRect(200,0,200,300);x.fillStyle='#22d';x.fillRect(400,0,200,300);return c.toDataURL('image/png').split(',')[1];});
  await p.evaluate(()=>{const g=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Got it'); if(g)g.click();
    BSCRY_SESSION={token:'x.y',name:'t',uid:'1'}; try{localStorage.setItem('bscry-upload-ack-2','1');}catch(e){}
    window._hosted=[];
    window.bscryHostBlob=(blob,name,onDone)=>{createImageBitmap(blob).then(bm=>{const c=document.createElement('canvas');c.width=bm.width;c.height=bm.height;const x=c.getContext('2d');x.drawImage(bm,0,0);
      const px=(fx,fy)=>[...x.getImageData(Math.floor(bm.width*fx),Math.floor(bm.height*fy),1,1).data].slice(0,3);
      window._hosted.push({name:name,type:blob.type,bytes:blob.size,w:bm.width,h:bm.height,left:px(0.05,0.5),mid:px(0.5,0.5),right:px(0.95,0.5),corner:px(0.02,0.02)});onDone('https://cdn.example/u/x.jpg');});};
    window.mkFile=(w,h,kind,name)=>new Promise(res=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
      if(kind==='stripes'){['#d22','#2a2','#22d'].forEach((col,i)=>{x.fillStyle=col;if(w>=h)x.fillRect(i*w/3,0,w/3,h);else x.fillRect(0,i*h/3,w,h/3);});}
      else if(kind==='noise'){const d=x.createImageData(w,h);for(let i=0;i<d.data.length;i+=4){const v=(i*2654435761>>>8)&255;d.data[i]=v;d.data[i+1]=(v*7)&255;d.data[i+2]=(v*13)&255;d.data[i+3]=255;}x.putImageData(d,0,0);}
      else if(kind==='alpha'){x.fillStyle='#d22';x.beginPath();x.arc(w/2,h/2,w/4,0,7);x.fill();}
      c.toBlob(bl=>res(new File([bl],name||'t.png',{type:'image/png'})),'image/png');});
    window.st=document.createElement('div');document.body.appendChild(window.st);});
  let fail=0; const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m); if(!c)fail++;};
  const near=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<40);
  const RED=[221,34,34],GREEN=[34,170,34],BLUE=[34,34,221],WHITE=[255,255,255];
  const run=async(w,h,kind,act,name)=>{
    await p.evaluate(()=>{window._hosted=[];window._res=null;window.st.innerHTML='';});
    await p.evaluate(async([w,h,kind,name])=>{const f=await mkFile(w,h,kind,name);uploadImage(f,window.st,(u,ow,oh)=>{window._res=[u,ow,oh];},'token');},[w,h,kind,name]);
    await p.waitForTimeout(400);
    const has=await p.$('#tkc-use'); if(!has)return {modal:false,status:await p.evaluate(()=>window.st.textContent)};
    if(act)await act();
    await p.click('#tkc-use'); await p.waitForTimeout(500);
    return {modal:true,hosted:await p.evaluate(()=>window._hosted[0]),res:await p.evaluate(()=>window._res),status:await p.evaluate(()=>window.st.textContent)};};
  const drag=async(dx,dy)=>{const bx=await (await p.$('#tkc-view')).boundingBox();const x=bx.x+bx.width/2,y=bx.y+bx.height/2;await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx/2,y+dy/2);await p.mouse.move(x+dx,y+dy);await p.mouse.up();};
  let r=await run(1000,500,'stripes');
  ok(r.modal&&r.hosted&&r.hosted.w===320&&r.hosted.h===320&&r.hosted.type==='image/jpeg','wide 1000x500 -> 320x320 jpeg ('+(r.hosted&&r.hosted.bytes)+' bytes)');
  ok(r.hosted&&near(r.hosted.mid,GREEN)&&near(r.hosted.left,RED)&&near(r.hosted.right,BLUE),'default frame is the centre');
  r=await run(1000,500,'stripes',()=>drag(400,0));
  ok(r.hosted&&near(r.hosted.left,RED)&&near(r.hosted.mid,RED),'dragging right shows the left side, clamped at the edge');
  r=await run(600,1800,'stripes',async()=>{await p.evaluate(()=>{const z=document.getElementById('tkc-zoom');z.value='50';z.dispatchEvent(new Event('input'));});for(let i=0;i<8;i++)await drag(0,-120);});
  ok(r.hosted&&r.hosted.w===r.hosted.h&&near(r.hosted.mid,BLUE),'tall image: zoom + drag up reaches the bottom '+JSON.stringify(r.hosted));
  r=await run(64,64,'stripes');
  ok(r.hosted&&r.hosted.w===160,'small 64x64 -> 160x160');
  r=await run(30,30,'stripes');
  ok(/only 30/i.test(r.status)&&!r.hosted,'30x30 rejected: '+r.status.trim());
  await p.evaluate(()=>document.querySelectorAll('.smart-modal-backdrop,.modal-backdrop').forEach(e=>e.remove()));
  r=await run(800,800,'alpha');
  ok(r.hosted&&near(r.hosted.corner,WHITE)&&near(r.hosted.mid,RED),'transparent png flattened onto white');
  r=await run(4000,3000,'noise');
  ok(r.hosted&&r.hosted.w===320&&r.hosted.bytes<150*1024,'4000x3000 noisy photo -> 320px, '+(r.hosted&&Math.round(r.hosted.bytes/1024))+'KB');
  r=await run(500,500,'stripes',null,'anim.gif');
  ok(r.hosted&&r.hosted.w===320,'gif file name accepted');
  // cancel leaves nothing hosted
  await p.evaluate(()=>{window._hosted=[];});
  await p.evaluate(async()=>{const f=await mkFile(500,500,'stripes');uploadImage(f,window.st,()=>{},'token');}); await p.waitForTimeout(300);
  await p.click('#tkc-cancel'); await p.waitForTimeout(200);
  ok(await p.evaluate(()=>window._hosted.length===0&&!document.getElementById('tkc-use')),'cancel uploads nothing');
  // (DOM clicks below: the sidebar uses CSS zoom, which throws off Playwright's mouse coordinates)
  // URL that OTFBM cannot fetch: falls back to our fetch + framing
  await p.evaluate(()=>{pushU&&pushU();const id=uid();S.tokens.push({id:id,name:'Hero',col:2,row:2,size:'M',color:'#1d7cbc',height:0,tokenImage:'',originalCol:2,originalRow:2});S.sel={type:'token',ids:new Set([id])};S.tab='tokens';S.customizeOpen=true;window._hosted=[];renderAll();});
  await p.waitForTimeout(300);
  const hasInput=await p.$('#cb-img-input');
  if(hasInput){await p.evaluate(()=>{document.querySelectorAll('.smart-modal-backdrop').forEach(x=>x.remove());const i=document.getElementById('cb-img-input');i.value='https://blocked.example/art.png';document.getElementById('cb-img-apply').click();}); await p.waitForTimeout(800);
    ok(!!(await p.$('#tkc-use')),'blocked URL opens the framing window');
    if(await p.$('#tkc-use')){await p.click('#tkc-use'); await p.waitForTimeout(800);}
    const ti=await p.evaluate(()=>S.tokens.find(t=>t.name==='Hero').tokenImage);
    ok(ti==='abc12~'&&tokenCalls.length===2,'fallback hosted and tokenized: '+ti+' ('+tokenCalls.length+' token calls)');
    await p.evaluate(()=>{BSCRY_SESSION=null;const t=S.tokens.find(t=>t.name==='Hero');t.tokenImage='';renderAll();}); await p.waitForTimeout(200);
    await p.evaluate(()=>{document.querySelectorAll('.smart-modal-backdrop').forEach(x=>x.remove());const i=document.getElementById('cb-img-input');i.value='https://blocked.example/art.png';document.getElementById('cb-img-apply').click();}); await p.waitForTimeout(500);
    const msg=await p.evaluate(()=>document.getElementById('cb-img-info').textContent);
    ok(/Log in with Discord/.test(msg),'logged out: '+msg.trim().slice(0,70));
  } else ok(false,'token image input not found in the form');
  ok(errs.length===0,'no page errors '+errs.join('; '));
  await b.close(); process.exit(fail?1:0);
})();
