import {getCollarDetailRows,getOrderPresentation} from '../domain/presentation';
import {responsiveAsset} from '../catalog/images';
import {attachmentUrl} from '../data/backend';
import {fontText,loadFont,fontPreviewScale} from '../catalog/fonts';
import {translator,summaryLabels} from '../i18n';
import type {Locale,Order} from '../domain/model';
import {PDFDocument} from 'pdf-lib';
async function img(url:string){
 const preferred=responsiveAsset(url)?.src||url;
 for(const source of [...new Set([preferred,url])]){
  try{
   // Read a fresh CORS response instead of reusing a display-only image cache entry.
   const response=await fetch(source,{mode:'cors',cache:'reload'});if(!response.ok)throw Error('IMAGE_UNAVAILABLE');
   const blobUrl=URL.createObjectURL(await response.blob());
   try{const image=new Image();image.src=blobUrl;await image.decode();return image;}finally{URL.revokeObjectURL(blobUrl);}
  }catch{}
 }
 throw new Error('IMAGE_UNAVAILABLE');
}
export async function renderPages(order:Order,locale:Locale):Promise<HTMLCanvasElement[]>{
 const logo=await img(import.meta.env.BASE_URL+'brand/colti-logo-burgundy.svg');
 const presentation=getOrderPresentation(order,locale),t=translator(locale), width=1240,height=1754,pages:HTMLCanvasElement[]=[];let canvas!:HTMLCanvasElement,ctx!:CanvasRenderingContext2D,y=0;
 function page(){canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;ctx=canvas.getContext('2d')!;ctx.fillStyle='#fffaf6';ctx.fillRect(0,0,width,height);ctx.drawImage(logo,70,30,280,280*logo.height/logo.width);ctx.fillStyle='#3e2434';ctx.font='24px Arial';ctx.fillText(order.order_code,70,158);y=205;pages.push(canvas);line(`${t('customer')}: ${order.customer_snapshot.name}`);line(order.customer_snapshot.phone);line(new Date(order.confirmed_at).toISOString().replace('T',' ').slice(0,19)+' UTC',20);if(order.demo)line(t('demo'),20);y+=25;}
 function line(text:string,size=24,bold=false,family='Arial'){ctx.font=`${bold?'bold ':''}${size}px "${family}"`;ctx.fillStyle='#3e2434';const words=text.split(/\s+/);let current='';const lines:string[]=[];
  for(const word of words){if(ctx.measureText(current+word).width>1080&&current){lines.push(current);current='';}let rest=word;while(ctx.measureText(rest).width>1080){let cut=rest.length;while(cut>1&&ctx.measureText(rest.slice(0,cut)).width>1080)cut--;if(current){lines.push(current);current='';}lines.push(rest.slice(0,cut));rest=rest.slice(cut);}current+=rest+' ';}if(current)lines.push(current);
  for(const l of lines){if(y+size+16>height-75)page();ctx.font=`${bold?'bold ':''}${size}px "${family}"`;ctx.fillText(l.trim(),70,y);y+=size+12;}}
 page();
 for(let index=0;index<order.items.length;index++){
  const i=order.items[index],summary=presentation.collars[index];if(y>height-660)page();line(`${index+1}. ${summary.name}`,32,true);
  const design=await img(i.design.image);ctx.drawImage(design,70,y,240,240);ctx.font='bold 24px Arial';ctx.fillText(i.design.code,340,y+38);ctx.font='22px Arial';ctx.fillText(summary.sizeWidth,340,y+82);ctx.fillText(summary.fastening,340,y+124);ctx.fillText(summary.tag.style,340,y+166);if(summary.tag.size){ctx.font='18px Arial';ctx.fillText(summary.tag.size!,340,y+202);};y+=275;
  line(`${summaryLabels[locale].phone}: ${summary.tag.phone}`);for(const extra of summary.tag.extras)line(`${extra.label}: ${extra.value}`);
  line(`${t('fontLabel')} ${i.font_number} · ${i.font.state==='placeholder'?t('placeholder'):i.font.asset_version}`,21);
  try{const family=await loadFont(i.font);line(fontText(i.font,i.pet_name),(i.font.presentation?.size||32)*fontPreviewScale(i.font),(i.font.presentation?.weight||400)>=700,family);}catch{line(t('fontFailed'),21);}
  if(i.personalization_type!=='none')line(summary.personalization);if(i.decorationIcon)line(t(i.decorationIcon));if(summary.notes)line(summary.notes);
  for(const a of summary.attachments){line(`${t('attachment')}: ${a.original_filename} · ${a.mime_type} · ${a.id}`,20);try{const url=await attachmentUrl(a);try{const image=await img(url);if(y+180>height-75)page();const ratio=Math.min(300/image.width,160/image.height);ctx.drawImage(image,70,y,image.width*ratio,image.height*ratio);y+=180;}finally{if(url.startsWith('blob:'))URL.revokeObjectURL(url);}}catch{line(`${t('attachment')}: ${t('view')} → ${t('production')}`,20);}}
  y+=26;
 }
 pages.forEach((p,n)=>{const c=p.getContext('2d')!;c.fillStyle='#79616d';c.font='18px Arial';c.fillText(`${order.order_code} · ${n+1}/${pages.length}`,70,height-35);});return pages;
}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export async function exportOrder(order:Order,locale:Locale,format:'pdf'|'jpg'){
 const pages=await renderPdfPages(order,locale);
 if(format==='jpg'){
  const slices=pages.map((page,n)=>({page,top:n===0?0:Number(page.dataset.bodyTop||0),bottom:Number(page.dataset.bodyBottom||page.height-100)}));
  const total=slices.reduce((height,slice)=>height+slice.bottom-slice.top+32,0)+100,scale=Math.min(1,30000/total);
  const image=document.createElement('canvas');image.width=Math.round(pages[0].width*scale);image.height=Math.ceil(total*scale);const ctx=image.getContext('2d')!;ctx.scale(scale,scale);ctx.fillStyle='#fffaf6';ctx.fillRect(0,0,pages[0].width,total);let y=0;
  for(const slice of slices){const height=slice.bottom-slice.top;ctx.drawImage(slice.page,0,slice.top,slice.page.width,height,0,y,slice.page.width,height);y+=height+32;}
  ctx.strokeStyle='#E8D8D4';ctx.beginPath();ctx.moveTo(76,y);ctx.lineTo(pages[0].width-76,y);ctx.stroke();ctx.font='16px Arial';ctx.fillStyle='#79616d';ctx.fillText(new Date(order.confirmed_at).toLocaleString(locale==='es'?'es':'en-US',{year:'numeric',month:'long',day:'numeric',hour:'numeric',minute:'2-digit'}),76,y+38);
  const blob=await new Promise<Blob>((resolve,reject)=>image.toBlob(b=>b?resolve(b):reject(new Error('JPEG_FAILED')),'image/jpeg',0.94));download(blob,order.order_code+'.jpg');return;
 }
 const pdf=await PDFDocument.create();for(const canvas of pages){const image=await pdf.embedJpg(canvas.toDataURL('image/jpeg',0.94));const page=pdf.addPage([595.28,841.89]);page.drawImage(image,{x:0,y:0,width:595.28,height:841.89});}const bytes=await pdf.save();download(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}),`${order.order_code}.pdf`);
}





/** Shared editorial layout for PDF and JPG downloads. */
export async function renderPdfPages(order:Order,locale:Locale,centerNames=false):Promise<HTMLCanvasElement[]>{
 const t=translator(locale),presentation=getOrderPresentation(order,locale),logo=await img(import.meta.env.BASE_URL+'brand/colti-logo-burgundy.svg');
 const W=1240,H=1754,M=76,bottom=1620,pages:HTMLCanvasElement[]=[];let ctx!:CanvasRenderingContext2D,y=0,index=0;
 const ink='#3e2434',muted='#79616d',brand='#6B2946',rule='#E8D8D4';
 function text(value:string,x:number,top:number,size=22,color=ink,family='Arial',bold=false){ctx.font=(bold?'bold ':'')+size+'px "'+family+'"';ctx.fillStyle=color;ctx.textBaseline='top';ctx.fillText(value,x,top);}
 function lines(value:string,max:number,size=22,family='Arial'):string[]{ctx.font=size+'px "'+family+'"';const result:string[]=[];for(const paragraph of value.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(line&&ctx.measureText(line+' '+word).width>max){result.push(line);line='';}let part='';for(const char of word){if(ctx.measureText(part+char).width>max){if(line){result.push(line);line='';}result.push(part);part='';}part+=char;}line+=(line?' ':'')+part;}result.push(line);}return result;}
 function divider(top:number,x=M,width=W-M*2){ctx.strokeStyle=rule;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x+width,top);ctx.stroke();}
 function page(continued=false){if(pages.length)pages[pages.length-1].dataset.bodyBottom=String(Math.min(H-100,y+24));const c=document.createElement('canvas');c.width=W;c.height=H;ctx=c.getContext('2d')!;ctx.fillStyle='#fffaf6';ctx.fillRect(0,0,W,H);pages.push(c);ctx.drawImage(logo,M,48,220,220*logo.height/logo.width);ctx.font='bold 23px Arial';text(order.order_code,W-M-ctx.measureText(order.order_code).width,63,23,ink,'Arial',true);divider(135);text(locale==='es'?'CLIENTE':'CUSTOMER',M,159,16,brand,'Arial',true);const customer=lines(order.customer_snapshot.name+' · '+order.customer_snapshot.phone,W-M*2,22);customer.forEach((l,n)=>text(l,M,186+n*29));y=186+customer.length*29+30;c.dataset.bodyTop=String(y);if(continued){text((locale==='es'?'COLLAR ':'COLLAR ')+(index+1)+' · '+(locale==='es'?'Continuación':'Continued'),M,y,20,brand,'Arial',true);y+=46;}}
 function group(label:string){if(y+100>bottom)page(true);text(label,M,y,18,brand,'Arial',true);y+=38;}
 function row(label:string,value:string,x=M,width=W-M*2){if(!value.trim())return;const labelWidth=250,gap=24,lh=30;const ll=lines(label,labelWidth,20),vv=lines(value,width-labelWidth-gap,22);let n=0;while(n<Math.max(ll.length,vv.length)){if(y+lh+24>bottom)page(true);const capacity=Math.max(1,Math.floor((bottom-y-24)/lh)),count=Math.min(capacity,Math.max(ll.length,vv.length)-n);for(let k=0;k<count;k++){if(ll[n+k])text(ll[n+k],x,y+k*lh,20,muted);if(vv[n+k])text(vv[n+k],x+labelWidth+gap,y+k*lh);}y+=count*lh+14;divider(y,x,width);y+=14;n+=count;}}
 page();
 for(index=0;index<order.items.length;index++){
  const item=order.items[index],summary=presentation.collars[index],detailRows=getCollarDetailRows(item,locale,item.design.code,{includePetName:true,includeEmptyExtra:true,includeNotesInTag:false,fontNumber:item.font.display_position??item.font_number});if(index>0)page();
  text('COLLAR '+(index+1),M,y,18,brand,'Arial',true);y+=40;
  const start=y,colGap=42,colWidth=(W-M*2-colGap)/2,left=M,right=M+colWidth+colGap;
  text(locale==='es'?'TU COLLAR':'YOUR COLLAR',left,start,17,brand,'Arial',true);
  text(locale==='es'?'TU PLACA':'YOUR TAG',right,start,17,brand,'Arial',true);
  const product=await img(item.design.image),imageSize=Math.min(430,colWidth-24),imageX=left+(colWidth-imageSize)/2,imageY=start+38;
  ctx.drawImage(product,imageX,imageY,imageSize,imageSize);
  const collarFacts=detailRows.collar;let factsY=imageY+imageSize+24;
  for(let i=0;i<collarFacts.length;i+=2){const pair=collarFacts.slice(i,i+2),factGap=30,factWidth=(colWidth-factGap)/2;let rowHeight=0;
   pair.forEach((fact,j)=>{const x=left+j*(factWidth+factGap),valueLines=lines(fact.value,factWidth,23);text(fact.label,x,factsY,19,muted);valueLines.forEach((valueLine,n)=>text(valueLine,x,factsY+25+n*29,23,ink));rowHeight=Math.max(rowHeight,25+valueLines.length*29);});factsY+=rowHeight+18;
  }
  const tagFacts=detailRows.tag;
  const tagStart=start+38,tagGap=30,tagWidth=(colWidth-tagGap)/2;let tagY=tagStart;
  for(let i=0;i<tagFacts.length;i+=2){const pair=tagFacts.slice(i,i+2),cells=pair.map(fact=>({fact,labelLines:lines(fact.label,tagWidth,19),valueLines:lines(fact.value,tagWidth,23)})),labelHeight=Math.max(...cells.map(cell=>cell.labelLines.length*23))+5,maxLines=Math.max(...cells.map(cell=>cell.valueLines.length));let lineIndex=0;
   while(lineIndex<maxLines){let count=Math.floor((bottom-tagY-labelHeight-12)/29);
    if(count<1){page(true);tagY=y+8;count=Math.max(1,Math.floor((bottom-tagY-labelHeight-12)/29));}
    cells.forEach((cell,j)=>{const x=right+j*(tagWidth+tagGap);cell.labelLines.forEach((valueLine,n)=>text(valueLine,x,tagY+n*23,19,muted));cell.valueLines.slice(lineIndex,lineIndex+count).forEach((valueLine,n)=>text(valueLine,x,tagY+labelHeight+n*29,23,ink));});
    const drawn=Math.min(count,maxLines-lineIndex);tagY+=labelHeight+drawn*29+18;lineIndex+=drawn;
    if(lineIndex<maxLines){page(true);tagY=y+8;}
   }
  }
  const detailTop=tagY+18,cardX=right,cardW=colWidth;
  const noteLines=summary.notes.trim()?lines(summary.notes,cardW-48,22):[];
  const attachmentCanvases:HTMLImageElement[]=[];
  for(const attachment of summary.attachments){let url='';try{url=await attachmentUrl(attachment);attachmentCanvases.push(await img(url));}catch{}finally{if(url.startsWith('blob:'))URL.revokeObjectURL(url);}}
  let family='Arial';try{family=await loadFont(item.font);}catch{}
  const sample=fontText(item.font,item.pet_name||t('draft')),sampleWidth=cardW*.39;ctx.font=`48px "${family}"`;
  const naturalSampleWidth=Math.max(1,ctx.measureText(sample).width),sampleSize=Math.max(20,Math.min(48,48*sampleWidth/naturalSampleWidth)),sampleLines=lines(sample,sampleWidth,sampleSize,family);
  const personalLines=lines(detailRows.personalization.value,cardW*.54,23),baseCardHeight=Math.max(192,132+sampleLines.length*(sampleSize+4),110+personalLines.length*30)+noteLines.length*30;
  const cardHeight=baseCardHeight+attachmentCanvases.reduce((sum,image)=>sum+Math.min(180,image.height*(180/image.width))+20,0);
  ctx.fillStyle='#FCF5F6';ctx.strokeStyle=rule;ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(cardX,detailTop,cardW,cardHeight,16);ctx.fill();ctx.stroke();
  text(locale==='es'?'TIPOGRAFÍA Y DISEÑO':'LETTERING & DESIGN',cardX+22,detailTop+20,17,brand,'Arial',true);
  const fontY=detailTop+60; text(`${detailRows.font.label} ${detailRows.font.value}`,cardX+22,fontY,19,muted);
  sampleLines.forEach((lineText,n)=>text(lineText,cardX+22,fontY+28+n*(sampleSize+4),sampleSize,ink,family));
  const personalX=cardX+cardW*.46; text(detailRows.personalization.label,personalX,fontY,19,muted);
  lines(detailRows.personalization.value,cardW*.48,23).forEach((lineText,n)=>text(lineText,personalX,fontY+27+n*30,23,ink));
  let attachmentY=fontY+27+Math.max(1,lines(detailRows.personalization.value,cardW*.54,23).length)*30+noteLines.length*30+14;
  if(noteLines.length){text(locale==='es'?'Instrucciones':'Instructions',cardX+24,attachmentY,19,muted);noteLines.forEach((lineText,n)=>text(lineText,cardX+24,attachmentY+27+n*30,22,ink));attachmentY+=27+noteLines.length*30+14;}
  for(const image of attachmentCanvases){const scale=Math.min(260/image.width,180/image.height);ctx.drawImage(image,cardX+24,attachmentY,image.width*scale,image.height*scale);attachmentY+=image.height*scale+16;}
  y=Math.max(factsY,detailTop+cardHeight)+30;
  const dividerX=left+colWidth+colGap/2;ctx.strokeStyle=rule;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(dividerX,start);ctx.lineTo(dividerX,y-16);ctx.stroke();
 }
 if(pages.length)pages[pages.length-1].dataset.bodyBottom=String(Math.min(H-100,y+24));
 const date=new Date(order.confirmed_at).toLocaleString(locale==='es'?'es':'en-US',{year:'numeric',month:'long',day:'numeric',hour:'numeric',minute:'2-digit'});
 pages.forEach((canvas,n)=>{ctx=canvas.getContext('2d')!;divider(H-86);text(date,M,H-61,16,muted);text((n+1)+' / '+pages.length,W-M-80,H-61,16,muted);});return pages;
}
