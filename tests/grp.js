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
    out.panel=!!document.getElementById('ms-grp-go');out.panelText=(document.getElementById('tab-content').textContent.match(/\d+ tokens selected/)||[''])[0];
    document.getElementById('ms-grp').value='Goblins';document.getElementById('ms-grp-go').click();await wait(100);
    out.groups=S.tokens.filter(t=>!t.hidden).map(t=>t.name+':'+(t.group||'-')+':'+t.init).join(' ');
    out.cmd=decodeURIComponent(document.getElementById('cmd-text').textContent).slice(0,200);
    S.sel={type:'group',group:'Goblins',ids:new Set()};renderAll();await wait(50);
    out.selBtn=!!document.getElementById('cb-grp-select');document.getElementById('cb-grp-select').click();await wait(50);
    out.selAfter=S.sel.type+':'+S.sel.ids.size;
    // monster search: type part of a name, then press an option (mousedown must not blur the field)
    clearSel();S.addingCombatant={name:'',initStr:'',initBonus:'',ac:'',hp:'',size:'M',color:'#e63c3c',hideStats:false,note:'',location:'',group:'',tokenImage:''};renderSB();await wait(50);
    const f=document.getElementById('cb-srd');f.focus();f.value='gob';f.dispatchEvent(new Event('input',{bubbles:true}));await wait(50);
    const opt=document.querySelector('[data-srdpick="Goblin"]');
    const md=new MouseEvent('mousedown',{bubbles:true,cancelable:true});opt.dispatchEvent(md);out.mdPrevented=md.defaultPrevented;
    opt.click();await wait(50);
    out.srd=S.addingCombatant.mon&&S.addingCombatant.mon.srd;out.autoName=S.addingCombatant.name;
    return out;});
  let fail=0; const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m); if(!c)fail++;};
  ok(r.panel&&r.panelText==='2 tokens selected','multi-select panel shows ('+r.panelText+')');
  ok(/GO1:Goblins:12 GO2:Goblins:12 Melle:-:17/.test(r.groups),'grouping sets group and shared initiative: '+r.groups);
  ok(r.selBtn&&r.selAfter==='token:2','group "Select on map" selects its members ('+r.selAfter+')');
  ok(r.mdPrevented&&r.srd==='Goblin'&&r.autoName==='GO3','typing gob then picking Goblin works ('+r.srd+', '+r.autoName+')');
  ok(errs.length===0,'no page errors '+errs.join('; '));
  console.log('     export: '+r.cmd);
  await b.close(); process.exit(fail?1:0);
})();
