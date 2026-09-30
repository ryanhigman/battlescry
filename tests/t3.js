const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.PW_CHROME});const p=await b.newPage();
for(const q of ['','?test=1','','?test=0']){await p.goto('http://localhost:8765/index.html'+q+'#g=10x10&o=c40&t=GO1|C3|M|r|0|');await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{S.tokens.find(t=>t.name==='GO1').col=5;renderAll();const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return {test:BSCRY_TEST,prompt:e.defaultPrevented,ver:document.body.innerText.match(/v0\.1\.\d+/)[0]};});console.log(JSON.stringify(q),JSON.stringify(r));}
await b.close();})();
