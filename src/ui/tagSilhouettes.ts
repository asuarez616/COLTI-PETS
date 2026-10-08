const pending=new Map<string,Promise<string>>();
/** Preserve the original paths; align paper dimensions with the supplied cropped viewBox. */
export function loadTagSilhouette(shape:string):Promise<string>{
 if(!['paw-back','paw','circle','bone','military','anti-fall'].includes(shape))return Promise.reject(new Error('UNKNOWN_SHAPE'));
 const previous=pending.get(shape);if(previous)return previous;
 const request=fetch(import.meta.env.BASE_URL+'icons/preview-tag-'+shape+'.svg').then(async response=>{if(!response.ok)throw new Error('SILHOUETTE_UNAVAILABLE');const svg=await response.text();const viewBox=svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);if(!viewBox||viewBox.length!==4||viewBox.some(v=>!Number.isFinite(v)))throw new Error('INVALID_SILHOUETTE');
 const normalized=svg.replace(/(<svg\b[^>]*?)\bwidth="[^"]+"/,'$1width="'+viewBox[2]+'"').replace(/(<svg\b[^>]*?)\bheight="[^"]+"/,'$1height="'+viewBox[3]+'"');const radius=viewBox[2]*(shape==='anti-fall'?.004:.003);
 const thinner=normalized.replace('</defs>',`<filter id="preview-fine-outline" x="-5%" y="-5%" width="110%" height="110%"><feMorphology operator="erode" radius="${radius}"/></filter></defs>`).replace(/<path\b/g,'<path filter="url(#preview-fine-outline)"');
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(thinner);
 });pending.set(shape,request);request.catch(()=>pending.delete(shape));return request;
}
