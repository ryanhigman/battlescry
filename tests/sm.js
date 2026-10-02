// A small image with no grid: the notice appears, layouts never overhang the image or use negative
// offsets, and enhancing keeps the layout inside the picture (OTFBM only draws whole squares).
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  let fail=0,enh=0; const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m); if(!c)fail=1;};
  const img=(f)=>({body:fs.readFileSync('maps/'+f),contentType:'image/jpeg',headers:{'access-control-allow-origin':'*'}});
  await p.route('**/testmaps/**',r=>r.fulfill(img(r.request().url().split('/testmaps/')[1])));
  await p.route('**bscry-proxy**',async r=>{const u=r.request().url();
    if(u.includes('?enhance')){enh++;return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({enhanced:true,url:'http://localhost:8765/testmaps/sm_1024.jpg'})});}
    if(u.includes('/auth/me'))return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({valid:true,uid:'1',name:'t'})});
    const d=decodeURIComponent(u.split('url=')[1]||'');if(d.includes('/testmaps/'))return r.fulfill(img(d.split('/testmaps/')[1]));r.abort();});
  await p.goto('http://localhost:8765/index.html?test=1'); await p.waitForTimeout(500);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Got it'); if(b)b.click(); BSCRY_SESSION={token:'x.y',name:'t',uid:'1'}; S._uiBgOpen=true; renderSB();});
  await p.fill('#m-bgurl','http://localhost:8765/testmaps/sm_256.jpg'); await p.click('#m-bgupdate'); await p.waitForTimeout(1200);
  const note=await p.evaluate(()=>document.querySelector('#bscry-maploaded .smart-modal-body')?.innerText.replace(/\s+/g,' ')||'');
  ok(/No grid or floor tile pattern/.test(note)&&/small image/.test(note)&&/4 × 4 squares at 64px/.test(note),'notice: '+note.slice(0,260));
  await p.click('#bsml-pick'); await p.waitForTimeout(300);
  ok(await p.evaluate(()=>!document.getElementById('bscry-maploaded')&&document.activeElement&&document.activeElement.id==='m-gridpick'),'"Choose a different layout" closes the notice and focuses the layout list');
  const bad=await p.evaluate(()=>S.bgAnalysis.options.filter(o=>o.ox<0||o.oy<0||o.ox+o.gw*o.cs>256||o.oy+o.gh*o.cs>256).map(o=>o.cs+':'+o.gw+'x'+o.gh+'@'+o.ox));
  ok(bad.length===0,'no layout overhangs the image or has a negative offset '+JSON.stringify(bad));
  const val=await p.evaluate(()=>[...document.querySelectorAll('#m-gridpick option')].find(o=>/^25×25 squares/.test(o.textContent)).value);
  await p.selectOption('#m-gridpick',val); await p.waitForTimeout(1800);
  const r=await p.evaluate(()=>{const g=S.grid,im=document.getElementById('map-img');return{g:[g.cols,g.rows,g.cellSize,g.offsetX,g.offsetY],opts:buildOptsStr(),iw:Math.round(parseFloat(im.style.width)/S.zoom),clip:im.style.clipPath,z:S.zoom,modal:!!document.getElementById('bscry-maploaded')};});
  ok(JSON.stringify(r.g)==='[25,25,40,12,12]'&&/o12:12/.test(r.opts)&&!r.modal,'enhanced 4x: 25x25 at 40px, offset 12 '+JSON.stringify(r.g)+' '+r.opts);
  ok(r.iw===1024,'preview shows the image at its real size ('+r.iw+'px), clip '+r.clip);
  // one step: no Enhance button, the list still shows the same layouts, and going back restores the original
  const st=await p.evaluate(()=>({btn:!!document.getElementById('m-enhance'),sel:document.getElementById('m-gridpick').selectedOptions[0].textContent,n:document.querySelectorAll('#m-gridpick option').length,calls:window._enhCalls}));
  ok(!st.btn&&/25×25 squares at 40px/.test(st.sel)&&/enhanced 4x/.test(st.sel),'picked layout enhanced in one step: '+st.sel);
  const v64=await p.evaluate(()=>[...document.querySelectorAll('#m-gridpick option')].find(o=>/4×4 squares at 64px/.test(o.textContent)).value);
  await p.selectOption('#m-gridpick',v64); await p.waitForTimeout(400);
  ok(await p.evaluate(()=>/sm_256/.test(S.loadedUrl)&&S.grid.cellSize===64&&S.grid.cols===4),'picking a big-square layout goes back to the original image');
  await p.selectOption('#m-gridpick',val); await p.waitForTimeout(400);
  ok(enh===1&&await p.evaluate(()=>/sm_1024/.test(S.loadedUrl)&&S.grid.cellSize===40&&S.grid.offsetX===12),'re-picking reuses the enhanced image (enhance calls: '+enh+')');
  await p.evaluate(()=>popU()); await p.waitForTimeout(200);
  ok(await p.evaluate(()=>/sm_256/.test(S.loadedUrl)&&S.grid.cellSize===64),'undo returns to the previous layout and image');
  await p.evaluate(()=>redoU()); await p.waitForTimeout(200);
  ok(await p.evaluate(()=>/sm_1024/.test(S.loadedUrl)&&S.grid.cellSize===40),'redo brings the enhanced layout back');
  await p.evaluate(()=>{const e=document.getElementById('m-ox');e.value='-8';e.dispatchEvent(new Event('change',{bubbles:true}));});
  ok(await p.evaluate(()=>S.grid.offsetX)===0,'a negative offset typed in is refused');
  ok(await p.evaluate(()=>parseOpts('@c40o-8:-8').offsetX)===0,'a negative offset from an old link is read as 0');
  // an image that was already enhanced is never offered for enhancing again, even after a fresh load
  const fresh=async(f)=>{await p.evaluate(()=>{S._uiBgOpen=true;renderSB();});await p.fill('#m-bgurl','http://localhost:8765/testmaps/'+f);await p.click('#m-bgupdate');await p.waitForTimeout(1200);
    await p.evaluate(()=>{const b=document.getElementById('bsml-ok');if(b)b.click();});await p.waitForTimeout(150);
    return p.evaluate(()=>({small:S.bgAnalysis.options.filter(o=>o.cs<40).length,n:S.bgAnalysis.options.length,isEnh:S.bgAnalysis.isEnh,canEnh:S.bgAnalysis.canEnh,note:/already been enhanced/.test(document.getElementById('props-area').innerText),btn:!!document.getElementById('m-enhance')}));};
  let f=await fresh('sm_1024.jpg');
  ok(f.isEnh&&f.small===0&&f.n>0&&f.note&&!f.btn,'already-enhanced image: no layouts that need enhancing again '+JSON.stringify(f));
  f=await fresh('sm_2100.jpg');
  ok(!f.isEnh&&!f.canEnh&&f.small===0&&f.n>0,'image over 1920px: no layouts the enhancer would refuse '+JSON.stringify(f));
  // Remove background: no error popup, the removal is exported, and undo brings the image back
  p.once('dialog',d=>d.accept());
  await p.evaluate(()=>{origBgUrl=S.loadedUrl;S._uiBgOpen=true;renderSB();document.querySelectorAll('.smart-modal-backdrop').forEach(e=>e.remove());});
  await p.click('#m-bgremove'); await p.waitForTimeout(500);
  const rm=await p.evaluate(()=>({url:S.loadedUrl,err:[...document.querySelectorAll('.smart-modal-title')].map(e=>e.textContent).join('|'),cmd:(typeof buildApplyCommand==='function'?buildApplyCommand():(document.getElementById('cmd-text')||document.getElementById('cmd-out')||{}).textContent)||document.body.innerText.match(/!bscry apply[^\n]*/)?.[0]||''}));
  ok(rm.url===''&&!/Error/.test(rm.err),'remove background: no error popup ('+rm.err+')');
  ok(/Background:(%20| )none/.test(rm.cmd),'removal is sent to Discord: '+String(rm.cmd).slice(0,120));
  await p.evaluate(()=>popU()); await p.waitForTimeout(600);
  ok(await p.evaluate(()=>/sm_2100/.test(S.loadedUrl)&&document.getElementById('map-img').style.display!=='none'),'undo brings the background back');
  // file-name hints: squares are read from the name, pixel sizes and mismatched shapes are ignored
  const nh=await p.evaluate(()=>[bscryNameHint('Cliff Fort 100 x140.jpg',1920,2688),bscryNameHint('map_1920x2688.jpg',1920,2688),bscryNameHint('Tavern 22x17 night.png',1540,1190),bscryNameHint('Tavern 22x17.png',2000,1000),bscryNameHint('https://x.y/maps/Cave%2030x40.webp?v=2',1500,2000)].map(h=>h?h.cols+'x'+h.rows+'@'+h.cell.toFixed(1):'none'));
  ok(JSON.stringify(nh)==='["100x140@19.2","none","22x17@70.0","none","30x40@50.0"]','file-name hints '+JSON.stringify(nh));
  await p.screenshot({path:'shots/sm.png'});
  ok(errs.length===0,'no page errors '+errs.join('|'));
  await b.close(); process.exit(fail);
})();
