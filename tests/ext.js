// A printed grid that covers only part of the image (title banner on top): the map is the gridded part,
// the offset is kept whole, and the preview slides the picture so the grid still starts at A1.
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
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Got it'); if(b)b.click(); S._uiBgOpen=true; renderSB();});
  await p.fill('#m-bgurl','http://localhost:8765/testmaps/banner_g50.jpg'); await p.click('#m-bgupdate'); await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>{const g=S.grid,im=document.getElementById('map-img'),sv=document.getElementById('map-svg').getBoundingClientRect(),ir=im.getBoundingClientRect();
    const line=document.querySelector('#map-svg line');
    return{g:[g.cols,g.rows,g.cellSize,g.offsetX,g.offsetY],red:[gOX(),gOY()],opts:buildOptsStr(),txt:document.querySelector('#bscry-maploaded .smart-modal-body')?.innerText.replace(/\s+/g,' ')||'',
      imgTopRel:Math.round((ir.top-sv.top)/S.zoom),clip:im.style.clipPath,zoom:S.zoom,found:S.bgAnalysis.found&&S.bgAnalysis.found.kind};});
  ok(JSON.stringify(r.g)==='[24,18,50,0,300]','grid is the gridded part: '+JSON.stringify(r.g)+' ('+r.found+')');
  ok(/o0:300/.test(r.opts),'offset is exported whole: '+r.opts);
  ok(r.red[0]===0&&r.red[1]===0,'drawing uses the part of the offset under one square: '+JSON.stringify(r.red));
  ok(Math.abs(r.imgTopRel-(40-300))<=2||r.imgTopRel<-200,'picture is slid up so the banner sits outside the map (top '+r.imgTopRel+')');
  ok(/only covers part of this image/.test(r.txt),'notice explains it');
  await p.screenshot({path:'shots/ext.png'});
  ok(errs.length===0,'no page errors '+errs.join('|'));
  await b.close(); process.exit(fail);
})();
