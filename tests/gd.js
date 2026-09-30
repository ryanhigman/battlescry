const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{
  const dir=process.argv[2]||'maps'; const only=process.argv[3];
  const truth=fs.existsSync(path.join(dir,'truth.json'))?JSON.parse(fs.readFileSync(path.join(dir,'truth.json'))):{};
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const p = await (await b.newContext({viewport:{width:1440,height:900}})).newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8765/index.html?test=1'); await p.waitForTimeout(700);
  const files=fs.readdirSync(dir).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f)&&(!only||f.includes(only))).sort();
  for(const f of files){
    const b64=fs.readFileSync(path.join(dir,f)).toString('base64');
    const mime=/png$/i.test(f)?'image/png':/webp$/i.test(f)?'image/webp':'image/jpeg';
    const r=await p.evaluate(async({b64,mime,f})=>{
      const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
      const file=new File([u],f,{type:mime});const url=URL.createObjectURL(file);
      const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;});
      const out={w:img.naturalWidth,h:img.naturalHeight};
      let t0=performance.now();
      try{const d=detectGrid(img);out.detect=d.error?d.error:{cs:d.cellSize,ox:d.offsetX,oy:d.offsetY,conf:d.confidence,m:d.method,kind:d.kind};}catch(e){out.detect='ERR '+e.message;}
      out.tDetect=Math.round(performance.now()-t0);
      if(typeof bscryFindGrid==='function'){t0=performance.now();try{const g=bscryFindGrid(img,img.naturalWidth,img.naturalHeight);out.find=g;}catch(e){out.find='ERR '+e.message;}out.tFind=Math.round(performance.now()-t0);}
      out.conv=await new Promise(res=>bscryConvertToJpeg(file,5000,0.9,o=>res({w:o.w,h:o.h,kb:Math.round(o.bytes/1024),srcCell:o.srcCell,cell:o.cell,div:o.divisor,scale:o.scale,note:o.note}),e=>res('ERR '+e)));
      if(typeof bscrySuggestGrids==='function'){try{out.sugg=bscrySuggestGrids(img).map(o=>o.gw+'x'+o.gh+'@c'+o.cs+(o.label?' ['+o.label+']':''));}catch(e){out.sugg='ERR '+e.message;}}
      return out;},{b64,mime,f});
    console.log(f,truth[f]?'TRUTH '+JSON.stringify({cell:truth[f].cell,kind:truth[f].kind}):'');
    console.log('   ',JSON.stringify(r));
  }
  console.log(errs.slice(0,3)); await b.close();
})();
