// Scatter, off-map parking, tokens under fog, multi-select of unplaced combatants.
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const pg = await (await b.newContext({viewport:{width:1500,height:900}})).newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8765/index.html?test=1'); await pg.waitForTimeout(800);
  const r = await pg.evaluate(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
    const np=Array.from({length:8},(_,i)=>'G'+(i+1)).join(';');
    loadFromHashStr('g=14x12&o=c40&t=Melle|C6|M|b|0|;OG1|E5|L|r|0|&np='+np+'&ip=Melle:17;OG1:9'); await wait(150);
    document.querySelectorAll('.smart-modal-backdrop').forEach(x=>x.remove());
    S.tab='tokens';renderAll();await wait(50);
    const click=(name,mods)=>document.querySelector('#list-area [data-npname="'+name+'"]').dispatchEvent(new MouseEvent('click',Object.assign({bubbles:true},mods||{})));
    click('G1');await wait(30);click('G6',{shiftKey:true});await wait(50);
    out.shiftSel=[...(S.sel.np||[])].sort().join(',');out.panel=!!document.getElementById('ms-scatter-area');
    // scatter 6 into D2:H6 (5x5 with the Large ogre taking 4 cells and nothing else inside)
    document.getElementById('ms-scatter-range').value='D2:H6';document.getElementById('ms-scatter-go').click();await wait(100);
    const toks=()=>S.tokens.filter(t=>!t.hidden);
    const gs=toks().filter(t=>/^G\d/.test(t.name));
    const cells=new Set();let overlap=false,inside=true;
    toks().forEach(t=>{if(tokParked(t))return;const n=tokCubeCells(t);for(let i=0;i<n;i++)for(let j=0;j<n;j++){const k=(t.col+i)+','+(t.row+j);if(cells.has(k))overlap=true;cells.add(k);}});
    gs.forEach(t=>{if(t.col<3||t.col>7||t.row<1||t.row>5)inside=false;});
    out.scatter={placed:gs.length,overlap,inside,unplacedLeft:S.combatants.filter(c=>!c.placed&&/^G/.test(c.name)).length,sel:S.sel.type+':'+S.sel.ids.size};
    const before=gs.map(t=>t.name+fmtU(t.col,t.row)).sort().join(' ');
    popU();await wait(60);out.undo={toks:toks().length,unplaced:S.combatants.filter(c=>!c.placed&&/^G/.test(c.name)).length};
    redoU();await wait(60);
    // too small an area: 2 cells for the remaining two plus... select G7,G8 and scatter into a 1x1
    S.sel={type:'unplaced',ids:new Set(),name:'G7',np:new Set(['G7','G8'])};renderAll();await wait(30);
    doScatter({c1:12,r1:10,c2:12,r2:10});await wait(60);
    out.small={placed:toks().filter(t=>/^G[78]$/.test(t.name)).length,left:[...(S.sel.np||[])].length};
    // drag-a-box scatter: reselect two placed goblins and draw a box over K2:M4
    const two=toks().filter(t=>/^G[12]$/.test(t.name));S.sel={type:'token',ids:new Set(two.map(t=>t.id))};renderAll();await wait(30);
    document.getElementById('ms-scatter-area').click();await wait(30);
    const svg=document.getElementById('map-svg'),vp=document.getElementById('map-vp'),rc=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal,k=rc.width/vb.width,g=S.grid;
    const px=(c,r)=>({clientX:rc.left+(PAD+g.offsetX+c*g.cellSize)*k,clientY:rc.top+(PAD+g.offsetY+r*g.cellSize)*k,bubbles:true});
    svg.dispatchEvent(new MouseEvent('mousedown',px(10.2,1.2)));vp.dispatchEvent(new MouseEvent('mousemove',px(11.5,2.5)));vp.dispatchEvent(new MouseEvent('mousemove',px(12.8,3.8)));vp.dispatchEvent(new MouseEvent('mouseup',px(12.8,3.8)));await wait(100);
    out.box=two.map(t=>fmtU(t.col,t.row)).join(' ')+' pick='+!!S.scatterPick+' last='+(S._lastScatter?fmtU(S._lastScatter.c1,S._lastScatter.r1)+':'+fmtU(S._lastScatter.c2,S._lastScatter.r2):'');
    out.boxIn=two.every(t=>t.col>=10&&t.col<=12&&t.row>=1&&t.row<=3);
    out.reshuffleBtn=!!document.getElementById('ms-rescatter');
    // park: any size, exported cell is just past the corner
    const og=toks().find(t=>t.name==='OG1');S.sel={type:'token',ids:new Set([og.id])};renderAll();await wait(30);
    document.getElementById('p-park').click();await wait(60);
    out.park={parked:tokParked(og),cell:fmtU(og.col,og.row),drawn:!!document.querySelector('#map-svg [data-id="'+og.id+'"],#map-svg [data-tid="'+og.id+'"]'),cmd:decodeURIComponent(document.getElementById('cmd-text').textContent).match(/OG1\|[A-Z]+\d+/)?.[0]||''};
    // typed A0 parks too
    const me=toks().find(t=>t.name==='Melle');S.sel={type:'token',ids:new Set([me.id])};renderAll();await wait(30);
    const loc=document.getElementById('cb-loc');loc.value='A0';loc.dispatchEvent(new Event('change',{bubbles:true}));await wait(60);
    out.a0={parked:tokParked(me),cell:fmtU(me.col,me.row)};
    // fog: only D2:H6 revealed; tokens elsewhere are hidden on the map and in the list until revealed
    S.fowRegions=[{id:uid(),c1:3,r1:1,c2:7,r2:5}];S.revealFogTokens=false;clearSel();renderAll();await wait(60);
    const drawn=()=>document.querySelectorAll('#map-svg [data-tid]').length||document.querySelectorAll('#map-svg g.token,#map-svg [data-tok]').length;
    out.fog={inFog:fogTokenCount(),listRows:document.querySelectorAll('#list-area [data-tid]').length,note:(document.getElementById('list-area').textContent.match(/\d+ tokens? (is|are) under fog/)||[''])[0]};
    document.getElementById('fog-reveal-link').click();await wait(60);
    out.fogShown={reveal:S.revealFogTokens,listRows:document.querySelectorAll('#list-area [data-tid]').length};
    return out;});
  let fail=0; const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m); if(!c)fail++;};
  ok(r.shiftSel==='G1,G2,G3,G4,G5,G6'&&r.panel,'shift-click selects a range of unplaced combatants ('+r.shiftSel+')');
  ok(r.scatter.placed===6&&!r.scatter.overlap&&r.scatter.inside&&r.scatter.unplacedLeft===2,'scatter places all 6 inside the range with no overlap '+JSON.stringify(r.scatter));
  ok(r.undo.toks===2&&r.undo.unplaced===8,'one undo takes the whole batch back '+JSON.stringify(r.undo));
  ok(r.small.placed===1&&r.small.left===1,'area too small: places what fits, keeps the rest selected '+JSON.stringify(r.small));
  ok(r.boxIn&&/pick=false/.test(r.box)&&r.reshuffleBtn,'drag-a-box scatter lands inside the box: '+r.box);
  ok(r.park.parked&&r.park.cell==='P14'&&r.park.cmd==='OG1|P14','Move off map parks past the corner: '+JSON.stringify(r.park));
  ok(r.a0.parked&&r.a0.cell==='P14','typing A0 parks at the safe cell too: '+JSON.stringify(r.a0));
  ok(r.fog.inFog>0&&r.fog.note&&r.fogShown.reveal&&r.fogShown.listRows===r.fog.listRows+r.fog.inFog,'tokens under fog are hidden until shown '+JSON.stringify(r.fog)+' '+JSON.stringify(r.fogShown));
  ok(errs.length===0,'no page errors '+errs.join('; '));
  await b.close(); process.exit(fail?1:0);
})();
