// File-name hints on pasted links: usable size, a size that needs a resized copy, and a map over 99 squares.
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fail=0; const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m); if(!c)fail=1;};
  const img=(f)=>({body:fs.readFileSync('maps/'+decodeURIComponent(f)),contentType:'image/jpeg',headers:{'access-control-allow-origin':'*'}});
  await p.route('**/testmaps/**',r=>r.fulfill(img(r.request().url().split('/testmaps/')[1])));
  await p.route('**bscry-proxy**',async r=>{const u=r.request().url();
    if(u.includes('/auth/me'))return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({valid:true,uid:'1',name:'t'})});
    const d=decodeURIComponent(u.split('url=')[1]||'');if(d.includes('/testmaps/'))return r.fulfill(img(d.split('/testmaps/')[1]));r.abort();});
  await p.goto('http://localhost:8765/index.html?test=1'); await p.waitForTimeout(500);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Got it'); if(b)b.click(); BSCRY_SESSION={token:'x.y',name:'t',uid:'1'};});
  const load=async(f)=>{await p.evaluate(()=>{document.querySelectorAll('.smart-modal-backdrop').forEach(e=>e.remove());S._uiBgOpen=true;renderSB();});
    await p.fill('#m-bgurl','http://localhost:8765/testmaps/'+f);await p.click('#m-bgupdate');await p.waitForTimeout(2500);
    return p.evaluate(()=>({txt:document.querySelector('#bscry-maploaded .smart-modal-body')?.innerText.replace(/\s+/g,' ')||'',g:[S.grid.cols,S.grid.rows,S.grid.cellSize],rehost:!!document.getElementById('bsml-rehost')}));};
  let r=await load('Tavern-22x17.jpg');
  ok(JSON.stringify(r.g)==='[22,17,50]'&&/file name gives the map size/.test(r.txt)&&!r.rehost,'usable size from the file name: '+JSON.stringify(r.g));
  r=await load('Cave%2060x48.jpg');
  ok(r.rehost&&/file name says it is 60 × 48 squares/.test(r.txt),'under-20px squares from the name: offers a resized copy');
  r=await load('Big-Map-100x140.jpg');
  ok(/100 × 140 squares/.test(r.txt)&&/at most 99/.test(r.txt)&&!r.rehost,'over 99 squares: explained, no false grid. '+r.txt.slice(0,90)+' ... '+JSON.stringify(r.g));
  ok(errs.length===0,'no page errors '+errs.join('|'));
  await b.close(); process.exit(fail);
})();
