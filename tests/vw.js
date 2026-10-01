// Map View: changing the view must not move or re-letter anything, and the export carries the real view.
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const pg = await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8765/index.html?test=1'); await pg.waitForTimeout(800);
  const r = await pg.evaluate(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
    const snapS=()=>({toks:S.tokens.filter(t=>!t.hidden).map(t=>t.name+'@'+fmtU(t.col,t.row)).join(' '),ov:S.overlays.map(o=>fmtU(o.coord.col,o.coord.row)).join(' '),walls:S.walls.map(w=>fmtU(w.start.col,w.start.row)+'-'+fmtU(w.end.col,w.end.row)).join(' '),fow:S.fowRegions.map(f=>fmtU(f.c1,f.r1)+':'+fmtU(f.c2,f.r2)).join(' '),obj:S.objects.map(o=>fmtU(o.col,o.row)).join(' '),view:S.grid.startCol+','+S.grid.startRow+' '+S.grid.cols+'x'+S.grid.rows+' full '+S.grid.fullCols+'x'+S.grid.fullRows,cmd:decodeURIComponent(document.getElementById('cmd-text').textContent)});
    const setView=async(a,z)=>{S.tab='map';S._uiMapViewOpen=true;renderSB();await wait(50);document.getElementById('vw-start').value=a;document.getElementById('vw-end').value=z;document.getElementById('vw-start').dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('btn-vw-update').onpointerdown({preventDefault(){}});await wait(200);};
    loadFromHashStr('g=12x12&o=c40&t=GO1|E4|M|r|0|;Melle|C6|M|b|0|&ov=c20rF6&w=c3c5&fw=d4:e5&ob=f7$tr'); await wait(150);
    out.before=snapS();
    await setView('C3','I8'); out.crop=snapS();
    // object drawn where its label says: F7 in a view starting at C3 is the 4th column, 5th row
    const og=[...document.querySelectorAll('#map-svg [data-objid]')][0];out.objBox=og?(()=>{const bb=og.getBBox();return Math.round(bb.x/40)+','+Math.round(bb.y/40);})():'none';
    popU(); await wait(100); out.undo=snapS();
    await setView('C3','I8'); await setView('B2','K11'); out.recrop=snapS();
    document.getElementById('btn-vw-reset').onpointerdown({preventDefault(){}}); await wait(200); out.reset=snapS();
    // a token moved while cropped exports its real cell
    await setView('C3','I8'); const t=S.tokens.find(x=>x.name==='Melle'); pushU(); t.col+=1; renderAll(); await wait(100); out.moved=snapS();
    // grid size edit on an uncropped map keeps Size in step
    loadFromHashStr('g=12x12&o=c40&t=GO1|E4|M|r|0|'); await wait(100); S.tab='map';renderSB();const mc=document.getElementById('m-cols');mc.value='20';mc.dispatchEvent(new Event('change',{bubbles:true}));await wait(100);out.cols20=snapS();
    return out;});
  let fail=0; const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m); if(!c)fail++;};
  const same=(a,b)=>a.toks===b.toks&&a.ov===b.ov&&a.walls===b.walls&&a.fow===b.fow&&a.obj===b.obj;
  ok(r.before.toks==='GO1@E4 Melle@C6'&&r.before.walls==='C3-C5'&&r.before.obj==='F7'&&r.before.fow==='D4:E5','loaded: '+JSON.stringify(r.before).slice(0,140));
  ok(same(r.before,r.crop)&&r.crop.view.startsWith('2,2 7x6'),'crop to C3:I8 keeps every label ('+r.crop.view+')');
  ok(/Nothing to send|View: c3:7x6/.test(r.crop.cmd)&&!/GO1\|/.test(r.crop.cmd)&&(!/Size/.test(r.crop.cmd)||/Size: 12x12/.test(r.crop.cmd)),'crop export: '+r.crop.cmd.slice(0,150));
  ok(r.objBox==='3,4','object drawn in its own cell (col,row from view corner = '+r.objBox+')');
  ok(same(r.before,r.undo)&&r.undo.view.startsWith('0,0 12x12')&&/Nothing to send/.test(r.undo.cmd),'undo restores view with nothing pending');
  ok(same(r.before,r.recrop)&&r.recrop.view.startsWith('1,1 10x10'),'second crop keeps labels ('+r.recrop.view+')');
  ok(same(r.before,r.reset)&&r.reset.view.startsWith('0,0 12x12'),'reset keeps labels');
  ok(/Melle\|D6/.test(r.moved.cmd)&&!/GO1\|/.test(r.moved.cmd),'move inside a cropped view exports D6 only: '+r.moved.cmd.slice(0,90));
  ok(/Size: 20x12/.test(r.cols20.cmd)&&/View: a1:20x12/.test(r.cols20.cmd),'columns 12 -> 20 exports Size 20x12: '+r.cols20.cmd.slice(0,120));
  ok(errs.length===0,'no page errors '+errs.join('; '));
  await b.close(); process.exit(fail?1:0);
})();
