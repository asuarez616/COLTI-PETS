import type {FontRecord} from '../domain/model';
import {loadFont,fontText,fontPreviewScale,fontDisplayOrder} from '../catalog/fonts';
export function catalogFonts(fonts:FontRecord[]){return fonts.filter(f=>f.active).sort(fontDisplayOrder);}
export function catalogHeight(count:number){return 370+Math.ceil(count/4)*248+100;}
export async function generateFontCatalog(fonts:FontRecord[],name:string):Promise<Blob>{
 const active=catalogFonts(fonts);if(!active.length)throw Error('No active lettering styles.');
 const families=await Promise.all(active.map(async f=>{if(f.state!=='ready'||!f.asset_path)throw Error('Style '+String(f.number).padStart(2,'0')+' is not ready.');try{return await loadFont(f);}catch{throw Error('Could not load style '+String(f.number).padStart(2,'0')+'. Catalog not generated.');}}));
 await Promise.all([document.fonts.load('600 52px "Playfair Display"'),document.fonts.load('400 24px Montserrat')]);
 const logo=await new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Could not load COLTI logo.'));i.src=import.meta.env.BASE_URL+'brand/colti-logo-burgundy.svg';});
 const W=1600,M=90,G=28,C=(W-2*M-3*G)/4,R=220,top=370,H=catalogHeight(active.length);
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d')!;
 ctx.fillStyle='#fffaf6';ctx.fillRect(0,0,W,H);ctx.drawImage(logo,M,55,240,240*logo.height/logo.width);
 ctx.fillStyle='#6B2946';ctx.font='600 54px "Playfair Display"';ctx.fillText('Choose their lettering style',M,245);
 ctx.fillStyle='#79616d';ctx.font='24px Montserrat';ctx.fillText("See how your pet’s name looks in every style.",M,298);
 active.forEach((f,n)=>{const x=M+(n%4)*(C+G),y=top+Math.floor(n/4)*(R+G);ctx.fillStyle='#FFFAF5';ctx.strokeStyle='#E8D8D4';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x,y,C,R,18);ctx.fill();ctx.stroke();ctx.fillStyle='#6B2946';ctx.font='500 23px Montserrat';ctx.fillText(String(n+1).padStart(2,'0'),x+26,y+39);
 const text=fontText(f,name),family=families[n],weight=f.presentation?.weight||400;let size=64*fontPreviewScale(f);ctx.font=weight+' '+size+'px "'+family+'"';const width=ctx.measureText(text).width;if(width>C-80)size*=((C-80)/width);ctx.font=weight+' '+size+'px "'+family+'"';const metrics=ctx.measureText(text),height=metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent;if(height>112){size*=112/height;ctx.font=weight+' '+size+'px "'+family+'"';}ctx.fillStyle='#3E2434';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x+C/2,y+130);ctx.textAlign='left';ctx.textBaseline='alphabetic';});
 ctx.font='18px Montserrat';ctx.fillStyle='#79616d';ctx.fillText('COLTI · Made for your best friend',M,H-40);
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not generate JPG.')),'image/jpeg',0.96));
}

