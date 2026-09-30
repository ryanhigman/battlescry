const { chromium } = require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{
  const dir=process.argv[2]||'maps';
  const b = await chromium.launch({executablePath: process.env.PW_CHROME});
  const p = await (await b.newContext()).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8765/index.html?test=1'); await p.waitForTimeout(700);
  for(const f of fs.readdirSync(dir).filter(f=>/\.(jpg|png|webp)$/i.test(f)).sort()){
    const b64=fs.readFileSync(path.join(dir,f)).toString('base64');
    const r=await p.evaluate(async({b64,f})=>{
      const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
      const file=new File([u],f,{type:'image/jpeg'});
      const o=await new Promise(res=>bscryConvertToJpeg(file,5000,0.85,o=>res(o),e=>res(null)));
      if(!o)return 'conv fail';
      const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(o.blob);});
      const g=bscryFindGrid(img,img.naturalWidth,img.naturalHeight);
      const s=bscrySuggestGrids(img);
      return {planned:o.cell,out:o.w+'x'+o.h,kb:Math.round(o.bytes/1024),note:bscryResizeNote(o).replace('<br>',''),redetect:g.kind+' '+g.cell+' off '+g.ox+','+g.oy,first:s[0]?s[0].gw+'x'+s[0].gh+'@'+s[0].cs+' '+s[0].label:'',note2:s.note};
    },{b64,f});
    console.log(f,JSON.stringify(r));
  }
  console.log(errs); await b.close();
})();
