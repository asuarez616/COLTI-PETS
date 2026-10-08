export async function prepareAttachmentFile(file:File):Promise<File>{
 if(!file.size||file.size>10485760)throw Error('INVALID_FILE');
 const svg=file.type==='image/svg+xml'||/\.svg$/i.test(file.name);
 if(!svg&&!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('INVALID_FILE');
 const url=URL.createObjectURL(file),image=new Image();
 try{
  image.src=url;await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw Error('INVALID_FILE_CONTENT');
  if(!svg)return file;
  const scale=Math.min(1,2048/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('INVALID_FILE_CONTENT')),'image/png'));
  if(blob.size>10485760)throw Error('INVALID_FILE');return new File([blob],file.name,{type:'image/png'});
 }catch{throw Error('INVALID_FILE_CONTENT');}finally{URL.revokeObjectURL(url);}
}
