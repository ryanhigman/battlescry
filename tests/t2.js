const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const ctx = await b.newContext(); const pg = await ctx.newPage(); const errs=[];
  pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await pg.goto('http://localhost:8765/index.html'); 
  await pg.evaluate(()=>localStorage.setItem('mapDef',JSON.stringify({g:'22x17',o:'c72',bg:'https://cdn.battlescry.com/m/tc0335.jpg'})));
  for (const [label,hash] of [['noMapLink','#np=GO2;OG1&ip=GO2:12;OG1:10'],['mapLink','#g=22x17&o=c72&bg=https://cdn.battlescry.com/m/tc0335.jpg&np=GO2;OG1&ip=GO2:12;OG1:10']]) {
    const p2 = await ctx.newPage(); p2.on('pageerror',e=>errs.push(label+' PAGEERR '+e.message));
    await p2.goto('http://localhost:8765/index.html'+hash); await p2.waitForTimeout(1200);
    const r = await p2.evaluate(()=>{const c=()=>(document.getElementById('cmd-text').querySelector('div')||document.getElementById('cmd-text')).textContent; const before=c(); const mc=mapChanged(); placeUnplacedCombatant('GO2',2,2); renderAll(); return {mapChangedOnLoad:mc,before,after:c(),grid:[S.grid.cols,S.grid.rows,S.grid.cellSize,S.grid.fullCols,S.grid.fullRows]};});
    console.log(label, JSON.stringify(r,null,1)); await p2.close();
  }
  console.log(errs.join('\n')||'no page errors'); await b.close();
})();
