// Multi-select panel, grouping several tokens at once, group "Select on map", monster search pick.
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const pg = await b.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://localhost:8765/index.html?test=1'); await pg.waitForTimeout(800);
  const r = await pg.evaluate(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
    loadFromHashStr('g=12x12&o=c40&t=GO1|E4|S|r|0|;GO2|F4|S|r|0|;Melle|C6|M|b|0|&ip=GO1:12;GO2:9;Melle:17'); await wait(150);
    const ids=S.tokens.filter(t=>/^GO/.test(t.name)).map(t=>t.id);
    S.sel={type:'token',ids:new Set(ids)};S.tab='tokens';renderAll();await wait(50);
    out.panel=!!document.getElementById('ms-grp-go');out.panelText=(document.getElementById('tab-content').textContent.match(/\d+ selected/)||[''])[0];
    document.getElementById('ms-grp').value='Goblins';document.getElementById('ms-grp-go').click();await wait(100);
    out.groups=S.tokens.filter(t=>!t.hidden).map(t=>t.name+':'+(t.group||'-')+':'+t.init).join(' ');
    out.cmd=decodeURIComponent(document.getElementById('cmd-text').textContent).slice(0,200);
    S.sel={type:'group',group:'Goblins',ids:new Set()};renderAll();await wait(50);
    out.selBtn=!!document.getElementById('cb-grp-select');document.getElementById('cb-grp-select').click();await wait(50);
    out.selAfter=S.sel.type+':'+S.sel.ids.size;
    // add a token: only a name is required; stats are optional
    clearSel();S.addingCombatant={name:'',initStr:'',initBonus:'',ac:'',hp:'',size:'M',color:'#808080',hideStats:false,note:'',location:'',group:'',tokenImage:''};renderSB();await wait(50);
    out.noSrd=!document.getElementById('cb-srd');
    const nmEl=document.getElementById('cb-name');nmEl.value='Wall A';nmEl.dispatchEvent(new Event('input',{bubbles:true}));
    document.getElementById('cb-hpmax').value='50';document.getElementById('cb-ac').value='13';document.getElementById('cb-loc').value='H8';
    out.addEnabled=!document.getElementById('cb-submit').disabled;document.getElementById('cb-submit').click();await wait(80);
    out.addCmd=decodeURIComponent(document.getElementById('cmd-text').textContent);
    const st=captureCurrentMapState();out.savedTokens=st.tokens;
    // distances count squares: adjacent 5, straight 3 squares 15, 2 across + 4 up by the 5-10-5 rule 25
    const T=(c,r,sz,h)=>({col:c,row:r,size:sz||'M',height:h||0});S.diagRule='5105';
    out.dist=[tokGridDist(T(2,5),T(3,5)),tokGridDist(T(2,5),T(2,8)),tokGridDist(T(2,5),T(4,1)),tokGridDist(T(2,5),T(7,5,'L')),tokGridDist(T(2,5),T(2,5,'M',30))].join(',');
    S.diagRule='simple';out.distSimple=tokGridDist(T(2,5),T(4,1));
    // an unplaced member of a group is listed under its group folder
    clearSel();S.addingCombatant=null;loadFromHashStr('g=12x12&o=c40&t=GO1|E4|S|r|0|&np=GO2&ip=GO1:12;GO2:12&ig=Gobs:GO1,GO2');await wait(150);S.tab='tokens';renderAll();await wait(50);
    const rowsEl=[...document.querySelectorAll('#list-area [data-grpsel],#list-area [data-tid],#list-area [data-npname]')].map(e=>e.dataset.grpsel?('['+e.dataset.grpsel+']'):(e.dataset.npname||'tok')+(e.style.paddingLeft?'+':''));
    out.listOrder=rowsEl.join(' ');
    // hidden stats withheld by the alias (5th cs field): locked for this viewer, condition from the hint
    loadFromHashStr('g=12x12&o=c40&t=GO1|E4|S|r|0|;GO2|F4|S|r|0|&ip=GO1:12;GO2:12&cs=GO1::::1:b;GO2:7:7:15:1');await wait(150);
    const pick=async n=>{const id=S.tokens.find(t=>t.name===n).id;S.sel={type:'token',ids:new Set([id])};S.tab='tokens';renderAll();await wait(50);return {dis:document.getElementById('cb-hide').disabled,chk:document.getElementById('cb-hide').checked,cond:document.getElementById('cb-condition').textContent,statsShown:document.getElementById('cb-stats-wrap').style.display!=='none',hp:document.getElementById('cb-hpcur').value};};
    out.lockPlayer=await pick('GO1');out.lockHint=document.getElementById('cb-cond-wrap').textContent.replace(/\s+/g,' ').trim();out.lockDm=await pick('GO2');
    out.cmdLocked=document.getElementById('cmd-text').textContent.slice(0,40);
    loadFromHashStr('g=12x12&o=c40&t=GO1|E4|S|r|0|;Wall|F4|M|gy|0|;Melle|C6|M|b|0|&cs=Wall:50:50:13:&ck=GO1:m;Melle:p');await wait(150);
    const kindOf=async n=>{const id=S.tokens.find(t=>t.name===n).id;S.sel={type:'token',ids:new Set([id])};S.tab='tokens';renderAll();await wait(40);return (document.getElementById('cb-hpcur')?'fields':'none')+':'+(/managed in Avrae/.test(document.getElementById('props-area').textContent)?'note':'');};
    out.kinds=[await kindOf('GO1'),await kindOf('Melle'),await kindOf('Wall')].join(' ');
    out.savedKinds=captureCurrentMapState().tokens;
    // add form: picking a cell shows a preview and adds nothing until Add is pressed
    clearSel();document.getElementById('btn-add-cb')?.click();await wait(50);
    if(!S.addingCombatant){S.addingCombatant={name:'',initStr:'',initBonus:'',ac:'',hp:'',size:'M',color:'#e63c3c',hideStats:false,note:'',location:'',group:'',tokenImage:''};renderSB();await wait(50);}
    const nTok=()=>S.tokens.filter(t=>!t.hidden).length, ghost=()=>!!document.querySelector('#map-svg circle[stroke-dasharray="6 4"]');
    document.getElementById('cb-name').value='Boss';document.getElementById('cb-name').dispatchEvent(new Event('input',{bubbles:true}));
    S.coordPick='cb';const svg=document.getElementById('map-svg'),r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal,k=r.width/vb.width;
    const cx=r.left+(PAD+S.grid.offsetX+7.5*S.grid.cellSize)*k,cy=r.top+(PAD+S.grid.offsetY+6.5*S.grid.cellSize)*k;
    svg.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,clientX:cx,clientY:cy}));await wait(100);
    out.ghost1={ghost:ghost(),toks:nTok(),loc:document.getElementById('cb-loc')?.value,adding:!!S.addingCombatant,cmd:document.getElementById('cmd-text').textContent.slice(0,30)};
    document.getElementById('cb-cancel').click();await wait(80);
    out.ghostCancel={ghost:ghost(),toks:nTok(),adding:!!S.addingCombatant};
    out.pickers=[...document.querySelectorAll('.colors')].length;
    return out;});
  let fail=0; const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m); if(!c)fail++;};
  ok(r.panel&&r.panelText==='2 selected','multi-select panel shows ('+r.panelText+')');
  ok(/GO1:Goblins:12 GO2:Goblins:12 Melle:-:17/.test(r.groups),'grouping sets group and shared initiative: '+r.groups);
  ok(r.selBtn&&r.selAfter==='token:2','group "Select on map" selects its members ('+r.selAfter+')');
  ok(r.noSrd&&r.addEnabled&&/Wall A\|0\|13\|50/.test(r.addCmd),'Add Token needs only a name; stats ride along: '+(r.addCmd.match(/Wall A\|[^:;]*/)||[''])[0]);
  ok(/Wall A,H8,m,[a-z0-9]+,,,50,13,/.test(r.savedTokens)&&!/GO1/.test(r.savedTokens.replace(/Wall A[^^]*/,''))===false||/Wall A,H8,m/.test(r.savedTokens),'Save Battlemap carries custom tokens: '+r.savedTokens.slice(0,120));
  ok(r.dist==='5,15,25,25,25'&&r.distSimple===20,'token distances count squares: '+r.dist+' simple rule '+r.distSimple);
  ok(/\[Gobs\] tok\+ GO2\+/.test(r.listOrder),'unplaced group member sits under its folder: '+r.listOrder);
  ok(r.lockPlayer.dis&&r.lockPlayer.chk&&r.lockPlayer.cond==='Bloodied'&&!r.lockPlayer.statsShown&&r.lockPlayer.hp==='','withheld stats: locked, shows Bloodied, no numbers '+JSON.stringify(r.lockPlayer));
  ok(/!i opt GO1 -h/.test(r.lockHint),'locked stats explain how to unhide: '+r.lockHint.slice(0,120));
  ok(!r.lockDm.dis&&r.lockDm.cond==='Healthy'&&r.lockDm.hp==='7','controller still gets numbers and an unlocked box '+JSON.stringify(r.lockDm));
  ok(r.kinds==='none:note none:note fields:'&&/^Wall,F4/.test(r.savedKinds)&&!/GO1|Melle/.test(r.savedKinds),'monsters and characters show no stat fields and are not saved with the map: '+r.kinds+' | '+r.savedKinds);
  ok(r.ghost1.ghost&&r.ghost1.toks===3&&r.ghost1.loc==='H7'&&r.ghost1.adding&&/Nothing to send/.test(r.ghost1.cmd),'picking a cell previews only: '+JSON.stringify(r.ghost1));
  ok(!r.ghostCancel.ghost&&r.ghostCancel.toks===3&&!r.ghostCancel.adding,'cancel removes the preview and adds nothing');
  ok(errs.length===0,'no page errors '+errs.join('; '));
  console.log('     export: '+r.cmd);
  await b.close(); process.exit(fail?1:0);
})();
