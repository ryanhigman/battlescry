const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const ctx = await b.newContext({viewport:{width:1440,height:900}}); const p = await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8765/index.html?test=1#g=12x10&o=c50&np=Melle;Tariq;GO1;OG1&st=tariq:w2a99&ip=Melle:24;Tariq:9;GO1:16;OG1:10&cs=Melle:74:105:19:;Tariq:194:204:21:;GO1:7:7:15:1;OG1:68:68:11:1&ch=1'); await p.waitForTimeout(900);
  // real mouse drag from list
  const row=await p.locator('#list-area >> text=GO1').first().boundingBox();
  const vp=await p.locator('#map-svg').boundingBox();
  await p.mouse.move(row.x+20,row.y+row.height/2); await p.mouse.down(); await p.mouse.move(vp.x+300,vp.y+300,{steps:8}); await p.mouse.up(); await p.waitForTimeout(300);
  const r=await p.evaluate(()=>{placeUnplacedCombatant('Tariq',1,1);placeUnplacedCombatant('Melle',2,2);renderAll();return S.tokens.map(t=>[t.name,t.col,t.row,t.color,t.tokenImage]);});
  console.log(JSON.stringify(r));
  await p.evaluate(()=>document.querySelector('#tabs button[data-tab="overlays"]').click()); await p.waitForTimeout(200);
  await p.evaluate(()=>document.getElementById('btn-add-ov').click()); await p.waitForTimeout(200);
  await p.selectOption('#ao-targ','Melle'); await p.waitForTimeout(200);
  console.log('origin',await p.inputValue('#ao-c1'));
  await p.screenshot({path:'shots/lay.png'});
  console.log(errs); await b.close();
})();
