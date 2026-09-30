const { chromium, devices } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const H='#g=12x10&o=c50&t=GO1|E5|M|r|0|;OG1|H6|L|g|0|&np=GO2&ip=OG1:10;GO1:8;GO2:4&ch=1';
  const ctx = await b.newContext({viewport:{width:1440,height:900},permissions:['clipboard-read','clipboard-write']}); const p = await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8765/index.html?test=1'+H); await p.waitForTimeout(900);
  const r=await p.evaluate(async()=>{
    const out={};
    const t=placeUnplacedCombatant("GO2",1,1); out.placedInit=t.init;
    S.tokens[0].col=2; renderAll();
    out.cmd=document.getElementById('cmd-text').innerText; out.btn=document.getElementById('btn-copy').textContent;
    document.getElementById('btn-copy').click(); await new Promise(r=>setTimeout(r,200));
    out.btn2=document.getElementById('btn-copy').textContent; out.clip=await navigator.clipboard.readText(); out.status=document.getElementById('status-msg').textContent;
    return out;});
  console.log(JSON.stringify(r,null,1),errs);
  await b.close();
})();
