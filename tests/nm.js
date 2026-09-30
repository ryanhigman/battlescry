const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const ctx = await b.newContext({viewport:{width:1440,height:900}}); const p = await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  for(const [n,H] of [['nomap','#np=Melle;Ace%20Aloro;GO2&ip=Melle:24;Ace%20Aloro:23;GO2:20&cs=Melle:74:105:19:;Ace%20Aloro:222:186:29:;GO2:7:7:15:1&ch=1'],['boot','#st=tariq:w2a99&ch=1'],['map','#g=12x10&o=c50&t=GO1|E5|M|r|0|&np=GO2&ip=GO1:8;GO2:4&ch=1'],['none','']]){
    await p.goto('http://localhost:8765/index.html?test=1&x='+n+H); await p.waitForTimeout(900);
    const r=await p.evaluate(()=>{const o={tab:S.tab,cmd:document.getElementById('cmd-text').innerText.slice(0,120),btnDis:document.getElementById('btn-copy').disabled};
      if(S.combatants.find(c=>c.name==='Melle')){placeUnplacedCombatant('Melle',1,2);renderAll();o.cmd2=document.getElementById('cmd-text').innerText;}return o;});
    console.log(n,JSON.stringify(r));
    if(n==='nomap')await p.screenshot({path:'shots/nomap.png'});
  }
  console.log(errs); await b.close();
})();
