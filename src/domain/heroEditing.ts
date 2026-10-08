import type {HeroConfiguration,HeroImage} from './admin';
export function mergeHeroSource(configuration:HeroConfiguration,source:HeroImage[]):HeroConfiguration {
 const ids=new Set(source.map(s=>s.id)),known=new Set(configuration.images.map(i=>i.id));
 return {...configuration,images:[...configuration.images.filter(i=>i.deleted||ids.has(i.id)),...source.filter(s=>!known.has(s.id)).map(s=>({id:s.id,active:configuration.revision===0&&configuration.images.length===0}))]};
}
export function toggleHero(configuration:HeroConfiguration,id:string):HeroConfiguration {
 const image=configuration.images.find(i=>i.id===id);if(!image)return configuration;
 const rest=configuration.images.filter(i=>i.id!==id),active=rest.filter(i=>i.active),inactive=rest.filter(i=>!i.active);
 return {...configuration,images:image.active?[...active,...inactive,{...image,active:false}]:[...active,{...image,active:true},...inactive]};
}
export function positionHero(configuration:HeroConfiguration,id:string,position:number):HeroConfiguration {
 const active=configuration.images.filter(i=>i.active),index=active.findIndex(i=>i.id===id);if(index<0||position<0||position>=active.length)return configuration;
 const [image]=active.splice(index,1);active.splice(position,0,image);
 return {...configuration,images:[...active,...configuration.images.filter(i=>!i.active)]};
}
