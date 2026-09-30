const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const p = await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8765/index.html?test=1'); await p.waitForTimeout(800);
  const r = await p.evaluate(async()=>{
    const mk=(w,h,cell,alpha,type)=>new Promise(res=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
      // textured "map art": blotches, walls and random edges
      x.fillStyle='#5b5346';x.fillRect(0,0,w,h);let s=12345;const rnd=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};
      for(let i=0;i<900;i++){x.fillStyle=`rgba(${rnd()*255|0},${rnd()*200|0},${rnd()*160|0},${0.15+rnd()*0.5})`;x.fillRect(rnd()*w,rnd()*h,20+rnd()*400,20+rnd()*300);}
      for(let i=0;i<300;i++){x.strokeStyle='#111';x.lineWidth=1+rnd()*6;x.beginPath();x.moveTo(rnd()*w,rnd()*h);x.lineTo(rnd()*w,rnd()*h);x.stroke();}
      if(cell){x.strokeStyle=`rgba(0,0,0,${alpha})`;x.lineWidth=2;for(let i=0;i<=w;i+=cell){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}for(let j=0;j<=h;j+=cell){x.beginPath();x.moveTo(0,j);x.lineTo(w,j);x.stroke();}}
      c.toBlob(bl=>res(new File([bl],'m.'+(type==='image/webp'?'webp':'jpg'),{type})),type,0.9);});
    const run=async(label,w,h,cell,alpha,type='image/jpeg')=>{const f=await mk(w,h,cell,alpha,type);return new Promise(res=>bscryConvertToJpeg(f,5000,0.85,o=>res(label+': '+w+'x'+h+' -> '+o.w+'x'+o.h+' k='+o.divisor+' src='+o.srcCell+' cell='+o.cell+' '+Math.round(o.bytes/1024)+'KB'),e=>res(label+': ERR '+e)));};
    const out=[];
    out.push(await run('140 grid strong',3080,2240,140,0.6));
    out.push(await run('140 grid faint',3080,2240,140,0.25));
    out.push(await run('70 grid',3080,2240,70,0.5));
    out.push(await run('gridless 140-size',3080,2240,0,0));
    out.push(await run('gridless huge',6160,4200,0,0));
    out.push(await run('140 grid huge',7420,6160,140,0.5));
    out.push(await run('200 grid',4000,3000,200,0.5));
    out.push(await run('280 grid',5600,4200,280,0.5));
    out.push(await run('100 grid',3000,2000,100,0.5));
    out.push(await run('webp 140',3080,2240,140,0.5,'image/webp'));
    const st=document.createElement('div'); uploadImage(new File([new Uint8Array(8*1024*1024)],'x.webp',{type:'image/webp'}),st,()=>{},'bg'); out.push('8MB webp logged-out msg: '+st.textContent);
    return out;});
  console.log(r.join('\n')); console.log(errs.join('\n')||'no page errors'); await b.close();
})();
