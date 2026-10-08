import {validConfiguredTag,type TagsConfig} from './idTags';
import {sizes,compatible,validateItem,type Item,type Design,type FontRecord} from './model';
import {tagModels,type TagShape} from './tags';
export {getInformationIcons,validatePersonalization} from './personalization';
export const getAvailableWidths=(size:string)=>sizes.find(s=>s.code===size)?.widths||[];
export const getAvailableDesigns=(designs:Design[],size:string,width:number,collection?:Design['type'])=>designs.filter(d=>(!collection||d.type===collection)&&compatible(d,size,width));
export const getAvailableTagSizes=(shape?:TagShape)=>tagModels.find(m=>m.shape===shape&&(!('active' in m)||m.active!==false))?.sizes||[];
export function selectTagShape(item:Item,shape:TagShape):Item{
 const available=getAvailableTagSizes(shape);
 const size=available.length===1?available[0]:item.tagShape===shape?available.find(s=>s.id===item.tagSize):undefined;
 return {...item,tagShape:shape,tagSize:size?.id,tagWidthCm:size?.width,tagHeightCm:size?.height};
}
export const validateCollar=(item:Item,designs:Design[],fonts:FontRecord[],tags?:TagsConfig|null)=>validateItem(item,designs,fonts,!!tags&&validConfiguredTag(tags,item));
