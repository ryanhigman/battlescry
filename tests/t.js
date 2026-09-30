const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME || undefined});
  const pg = await b.newPage(); const errs=[];
  pg.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(1500);
  const r = await pg.evaluate(async()=>{
    const out={}; const modal=()=>{const m=[...document.querySelectorAll('div')].filter(d=>/⚠ Error/.test(d.textContent)&&d.children.length<6).pop();return m?m.textContent.slice(0,120):null;};
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    loadFromHashStr('g=22x16&o=c140&bg=https://example.com/x.jpg&t=GO1|C3|M|r|0|'); await wait(100);
    out.c140={cs:S.grid.cellSize,modal:modal()};
    document.querySelectorAll('button').forEach(b=>{if(b.textContent==='OK')b.click();});
    loadFromHashStr('g=22x17&o=c72&bg=https://example.com/x.jpg&t=GO1|C3|M|r|0|'); await wait(100);
    out.c72={cs:S.grid.cellSize,modal:modal()};
    // manual field
    S.tab='map';renderSB(); const el=document.getElementById('m-cell'); el.value='140'; el.dispatchEvent(new Event('change',{bubbles:true})); await wait(50);
    out.manual140={cs:S.grid.cellSize,cmd:document.getElementById('cmd-text').textContent.slice(0,160)};
    const el2=document.getElementById('m-cell'); el2.value='5'; el2.dispatchEvent(new Event('change',{bubbles:true})); await wait(50);
    out.manual5={cs:S.grid.cellSize};
    const el3=document.getElementById('m-cell'); el3.value='80'; el3.dispatchEvent(new Event('change',{bubbles:true})); await wait(50);
    out.manual80={cs:S.grid.cellSize,cmd:document.getElementById('cmd-text').textContent.slice(0,160)};
    // library guard
    loadTCMap({name:'x',w:22,h:16,cell:140,img:'m/tc0013.jpg'}); await wait(100); out.lib140={cs:S.grid.cellSize,cols:S.grid.cols};
    // mapDef fallback
    localStorage.setItem('mapDef',JSON.stringify({g:'22x17',o:'c72',bg:'https://example.com/x.jpg'})); S.loadedUrl='';
    loadFromHashStr('np=GO2;OG1&ip=GO2:12;OG1:10'); await wait(50);
    out.fallback={cols:S.grid.cols,rows:S.grid.rows,fc:S.grid.fullCols,fr:S.grid.fullRows};
    return out;});
  console.log(JSON.stringify(r,null,1)); console.log(errs.join('\n')||'no page errors');
  await b.close();
})();
