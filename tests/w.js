const { chromium, devices } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.PW_CHROME});
for(const [n,d] of [['p13',devices['iPhone 13']],['se',devices['iPhone SE']]]){const c=await b.newContext(d);const p=await c.newPage();await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(800);
const r=await p.evaluate(()=>{const m=document.querySelector('#welcome-modal .smart-modal');const g=[...m.querySelectorAll('button')].find(x=>x.textContent.trim()==='Got it').getBoundingClientRect();const mr=m.getBoundingClientRect();return {vh:innerHeight,modal:[mr.top|0,mr.bottom|0],gotIt:[g.top|0,g.bottom|0],scrollable:m.scrollHeight>m.clientHeight};});console.log(n,JSON.stringify(r));await p.screenshot({path:`shots/${n}-welcome-fixed.png`});await c.close();}
await b.close();})();
