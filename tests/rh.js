// A linked image too detailed for OTFBM: the notice offers a hosted, resized copy, and taking it re-hosts
// a smaller image through the normal upload steps.
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m); if(!c)fail=1;};
  const img=(f)=>({body:fs.readFileSync('maps/'+f),contentType:'image/jpeg',headers:{'access-control-allow-origin':'*'}});
  await p.route('**/testmaps/**',r=>r.fulfill(img(r.request().url().split('/testmaps/')[1])));
  await p.route('**bscry-proxy**',async r=>{const u=r.request().url();
    if(u.includes('/auth/me'))return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({valid:true,uid:'1',name:'t'})});
    const d=decodeURIComponent(u.split('url=')[1]||'');if(d.includes('/testmaps/'))return r.fulfill(img(d.split('/testmaps/')[1]));r.abort();});
  await p.goto('http://localhost:8765/index.html?test=1'); await p.waitForTimeout(500);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Got it'); if(b)b.click(); BSCRY_SESSION={token:'x.y',name:'t',uid:'1'}; setPromptDismissed('bscry-upload-ack-2',true);
    window._hosted=[];window.bscryHostBlob=function(blob,name,onDone){createImageBitmap(blob).then(bm=>{window._hosted.push({name:name,w:bm.width,h:bm.height,mb:blob.size/1048576});onDone('http://localhost:8765/testmaps/sm_1024.jpg');});};
    S._uiBgOpen=true; renderSB();});
  await p.fill('#m-bgurl','http://localhost:8765/testmaps/noise_2600.jpg'); await p.click('#m-bgupdate'); await p.waitForTimeout(2500);
  const n=await p.evaluate(()=>({txt:document.querySelector('#bscry-maploaded .smart-modal-body')?.innerText.replace(/\s+/g,' ')||'',btn:!!document.getElementById('bsml-rehost'),why:S.bgAnalysis&&S.bgAnalysis.rehost}));
  ok(n.btn&&/too detailed/.test(n.txt),'notice offers a resized copy: '+JSON.stringify(n.why));
  await p.click('#bsml-rehost'); await p.waitForTimeout(6000);
  const r=await p.evaluate(()=>({hosted:window._hosted,url:S.loadedUrl,err:[...document.querySelectorAll('.smart-modal-title')].map(e=>e.textContent).join('|')}));
  ok(r.hosted.length>=1&&r.hosted[0].w<2600&&/sm_1024/.test(r.url)&&!/Error/.test(r.err),'re-hosted smaller copy: '+JSON.stringify(r.hosted)+' '+r.err);
  // a small, plain image gets no such offer
  await p.evaluate(()=>{document.querySelectorAll('.smart-modal-backdrop').forEach(e=>e.remove());S._uiBgOpen=true;renderSB();});
  await p.fill('#m-bgurl','http://localhost:8765/testmaps/sm_256.jpg'); await p.click('#m-bgupdate'); await p.waitForTimeout(1500);
  ok(await p.evaluate(()=>!document.getElementById('bsml-rehost')&&!!document.getElementById('bscry-maploaded')&&!S.bgAnalysis.rehost),'no offer for an image that draws fine');
  ok(errs.length===0,'no page errors '+errs.join('|'));
  await b.close(); process.exit(fail);
})();
