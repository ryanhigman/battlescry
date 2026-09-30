const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  // serve maps from same origin
  await p.route('**/testmaps/**',r=>{const f=r.request().url().split('/testmaps/')[1];r.fulfill({body:fs.readFileSync('maps/'+f),contentType:'image/jpeg',headers:{'access-control-allow-origin':'*'}});});
  await p.route('**bscry-proxy**',r=>{const u=decodeURIComponent(r.request().url().split('url=')[1]||'');if(u.includes('/testmaps/')){const f=u.split('/testmaps/')[1];return r.fulfill({body:fs.readFileSync('maps/'+f),contentType:'image/jpeg',headers:{'access-control-allow-origin':'*'}});}r.abort();});
  for(const f of (process.argv[2]||'g70,g140,g113_6,g25,g64_off,none_2000,tiles35half,tiles50,g200').split(',')){
    await p.goto('http://localhost:8765/index.html?test=1&f='+f); await p.waitForTimeout(500);
    await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Got it'); if(b)b.click(); S._uiBgOpen=true; renderSB();});
    await p.fill('#m-bgurl','http://localhost:8765/testmaps/'+f+'.jpg'); await p.click('#m-bgupdate'); await p.waitForTimeout(1500);
    const dbg=await p.evaluate(()=>JSON.stringify({u:S.loadedUrl,a:S.bgAnalysis&&{w:S.bgAnalysis.w,err:S.bgAnalysis.error,n:(S.bgAnalysis.options||[]).length},tab:S.tab,pick:!!document.getElementById("m-gridpick")}));console.log(dbg);const r=await p.evaluate(()=>({grid:[S.grid.cols,S.grid.rows,S.grid.cellSize,S.grid.offsetX,S.grid.offsetY],opts:[...document.querySelectorAll('#m-gridpick option')].map(o=>(o.selected?'>> ':'   ')+o.textContent),note:(document.querySelector('#m-gridpick')?.nextElementSibling?.textContent)||''}));
    console.log('== '+f,JSON.stringify(r.grid)); console.log(r.opts.slice(0,6).join('\n')); console.log('   NOTE: '+r.note);
    if(f==='g140'||f==='tiles35half')await p.screenshot({path:'shots/pick-'+f+'.png'});
  }
  console.log(errs); await b.close();
})();
