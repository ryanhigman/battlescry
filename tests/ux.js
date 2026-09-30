const { chromium, devices } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const H='#g=12x10&o=c50&t=Goblin%20Boss|C3|M|r|0|;GO1|E5|M|r|0|;OG1|H6|L|g|0|;Aria|B8|M|b|0|&np=GO2;GO3&ip=Aria:18;OG1:10;GO1:8;GO2:4;GO3:3';
  for (const [name,opts] of [['phone',devices['iPhone 13']],['phoneLand',{...devices['iPhone 13 landscape']}],['desktop',{viewport:{width:1440,height:900}}]]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage(); const errs=[];
    p.on('pageerror',e=>errs.push(e.message));
    await p.goto('http://localhost:8765/index.html'); await p.waitForTimeout(900);
    await p.screenshot({path:`shots/${name}-1-welcome.png`});
    await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Got it'); if(b)b.click();}); await p.waitForTimeout(300);
    await p.screenshot({path:`shots/${name}-2-empty.png`});
    await p.goto('http://localhost:8765/index.html?test=1'+H); await p.waitForTimeout(900);
    await p.screenshot({path:`shots/${name}-3-combat.png`});
    const info = await p.evaluate(()=>{const sb=document.getElementById('sidebar').getBoundingClientRect(); const vp=document.getElementById('map-vp').getBoundingClientRect(); const small=[...document.querySelectorAll('button,input,select,[role=button]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<32||r.width<32);}).length; const all=[...document.querySelectorAll('button,input,select,[role=button]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}).length; const tiny=[...document.querySelectorAll('body *')].filter(e=>e.children.length===0&&e.textContent.trim()&&e.getBoundingClientRect().width>0&&parseFloat(getComputedStyle(e).fontSize)<11).length; return {vw:innerWidth,vh:innerHeight,sidebar:[sb.x|0,sb.y|0,sb.width|0,sb.height|0],map:[vp.x|0,vp.y|0,vp.width|0,vp.height|0],smallTargets:small,allTargets:all,textUnder11px:tiny,hscroll:document.documentElement.scrollWidth>innerWidth};});
    console.log(name, JSON.stringify(info), errs.join('|'));
    for (const tab of ['tokens','overlays','other','map']) { await p.evaluate(t=>{const x=document.querySelector(`#tabs button[data-tab="${t}"]`); if(x)x.click();},tab); await p.waitForTimeout(250); await p.screenshot({path:`shots/${name}-4-${tab}.png`}); }
    await ctx.close();
  }
  await b.close();
})();
