// Debug: dump the detector's intermediate numbers for one image.  node dbg_gd.js <file>
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{
  const f=process.argv[2];
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const p = await (await b.newContext()).newPage();
  await p.goto('http://localhost:8765/index.html?test=1'); await p.waitForTimeout(700);
  const b64=fs.readFileSync(f).toString('base64');
  const r=await p.evaluate(async(b64)=>{
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src='data:image/jpeg;base64,'+b64;});
    let src=bscryFindGrid.toString();
    src=src.replace('const tryQ=(qi)=>{','const tryQ=(qi)=>{const _d={qi:qi};(window._dbg=window._dbg||[]).push(_d);')
           .replace('if(!lx&&!ly)return null;','_d.lx=lx;_d.ly=ly;if(!lx&&!ly)return null;')
           .replace('const fx=comb(px,P0),fy=comb(py,P0);if(!fx||!fy)continue;','const fx=comb(px,P0),fy=comb(py,P0);(_d.c=_d.c||[]).push({P0:+P0.toFixed(1),fx:fx&&{P:+fx.P.toFixed(2),con:+fx.contrast.toFixed(2),cov:+fx.cover.toFixed(2),soft:+fx.soft.toFixed(2)},fy:fy&&{P:+fy.P.toFixed(2),con:+fy.contrast.toFixed(2),cov:+fy.cover.toFixed(2),soft:+fy.soft.toFixed(2)}});if(!fx||!fy)continue;');
    const fn=eval('('+src+')');window._dbg=[];
    const g=fn(img,img.naturalWidth,img.naturalHeight);
    return {g,T:BSCRY_GRID_T,dbg:window._dbg};
  },b64);
  console.log(JSON.stringify(r.g),JSON.stringify(r.T));
  for(const d of r.dbg)console.log(JSON.stringify(d));
  await b.close();
})();
