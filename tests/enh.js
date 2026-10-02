const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  const img=(f)=>({body:fs.readFileSync('maps/'+f),contentType:'image/jpeg',headers:{'access-control-allow-origin':'*'}});
  let enhCalls=[];
  await p.route('**/testmaps/**',r=>r.fulfill(img(r.request().url().split('/testmaps/')[1])));
  await p.route('**bscry-proxy**',async r=>{const u=r.request().url();
    if(u.includes('?enhance')){const body=r.request().postData()||'';const ew=(body.match(/name="ew"\r\n\r\n(\d+)/)||[])[1],eh=(body.match(/name="eh"\r\n\r\n(\d+)/)||[])[1];enhCalls.push(ew+'x'+eh);
      return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(process.env.FAIL?{enhanced:false,reason:'resize unavailable (test)'}:{enhanced:true,url:'http://localhost:8765/testmaps/g50_1200x900.jpg'})});}
    if(u.includes('/auth/me'))return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({valid:true,uid:'1',name:'t'})});
    const d=decodeURIComponent(u.split('url=')[1]||'');if(d.includes('/testmaps/'))return r.fulfill(img(d.split('/testmaps/')[1]));r.abort();});
  await p.goto('http://localhost:8765/index.html?test=1'); await p.waitForTimeout(500);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Got it'); if(b)b.click(); BSCRY_SESSION={token:'x.y',name:'t',uid:'1'}; S._uiBgOpen=true; renderSB();});
  await p.fill('#m-bgurl','http://localhost:8765/testmaps/none_tiny.jpg'); await p.click('#m-bgupdate'); await p.waitForTimeout(1200);
  console.log('notice:',await p.evaluate(()=>document.querySelector('#bscry-maploaded .smart-modal-body')?.innerText.replace(/\s+/g,' ')));
  await p.click('#bsml-ok'); await p.waitForTimeout(200);
  const opts=await p.evaluate(()=>[...document.querySelectorAll('#m-gridpick option')].map(o=>o.textContent));
  console.log(opts.join('\n'));
  const val=await p.evaluate(()=>[...document.querySelectorAll('#m-gridpick option')].find(o=>/^30×20 squares/.test(o.textContent)).value);
  await p.selectOption('#m-gridpick',val); await p.waitForTimeout(300);
  await p.waitForTimeout(1800);
  console.log('btn gone:',await p.evaluate(()=>!document.getElementById('m-enhance')));
  console.log(JSON.stringify(await p.evaluate(()=>({url:S.loadedUrl,grid:[S.grid.cols,S.grid.rows,S.grid.cellSize],err:document.querySelector('.smart-modal')?.textContent?.slice(0,120)}))),'calls',enhCalls,errs);
  await b.close();
})();
