import type {Item,Locale} from './model';
export type TagShape='paw'|'circle'|'bone'|'crown'|'military'|`custom_${string}`;
export const tagModels=[
 {shape:'paw',en:'Paw',es:'Huella',path:'M20 29c-7 0-12 9-9 14 2 4 7 2 9 2s7 2 9-2c3-5-2-14-9-14 M12 15a4 6 0 1 0 0 12 4 6 0 1 0 0-12 M28 15a4 6 0 1 0 0 12 4 6 0 1 0 0-12 M5 23a3 5 0 1 0 0 10 3 5 0 1 0 0-10 M35 23a3 5 0 1 0 0 10 3 5 0 1 0 0-10',sizes:[{id:'small',en:'Medium',es:'Mediana',width:2.5,height:2.5,dimensions:'2.5 × 2.5 cm'},{id:'large',en:'Large',es:'Grande',width:3.5,height:3.3,dimensions:'3.3 × 3.5 cm'}]},
 {shape:'circle',en:'Circle',es:'Círculo',path:'M38 28a18 18 0 1 0-36 0 18 18 0 1 0 36 0',sizes:[{id:'small',en:'Medium',es:'Mediana',width:2.5,height:2.5,dimensions:'2.5 × 2.5 cm'}]},
 {shape:'bone',en:'Bone',es:'Hueso',path:'M9 21c-11-12-15 7-7 8-8 1-4 20 7 8h22c11 12 15-7 7-8 8-1 4-20-7-8Z',sizes:[{id:'miniature',en:'Miniature',es:'Miniatura',width:2.3,height:2,dimensions:'2 × 2.3 cm'},{id:'medium',en:'Medium',es:'Mediana',width:2.7,height:4,dimensions:'4 × 2.7 cm'},{id:'large',en:'Large',es:'Grande',width:3,height:5,dimensions:'5 × 3 cm'}]},
 {shape:'crown',active:false,en:'Crown',es:'Corona',path:'M4 16l8 8 8-14 8 14 8-8-4 26H8Z M8 36h24',sizes:[{id:'small',en:'Medium',es:'Mediana',width:2.5,height:2.5,dimensions:'2.5 × 2.5 cm'}]},
 {shape:'military',en:'Military',es:'Militar',path:'M12 8h16a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8Z',sizes:[{id:'medium',en:'Medium',es:'Mediana',width:2.7,height:4,dimensions:'4 × 2.7 cm'},{id:'large',en:'Large',es:'Grande',width:3,height:5,dimensions:'5 × 3 cm'}]},
] as const;
export function tagSelection(i:Item){const model=tagModels.find(m=>m.shape===i.tagShape);return {model,size:model?.sizes.find(s=>s.id===i.tagSize)};}
export function validTag(i:Item){if(i.tag_type!=='hanging')return true;const {size}=tagSelection(i);return i.tagShape!=='crown'&&!!size&&size.width===i.tagWidthCm&&size.height===i.tagHeightCm;}
export function tagDescription(i:Item,locale:Locale){if(i.tag_snapshot){const s=i.tag_snapshot,k=locale==='es'?'name_es':'name_en';return {style:s.type[k]+' · '+s.model[k],size:(s.size?s.size[k]+' · ':'')+s.width+' × '+s.height+' cm'};}const {model,size}=tagSelection(i);return {style:i.tag_type==='hanging'&&model?`${locale==='es'?'Colgante':'Hanging'} · ${model[locale]}`:null,size:size?`${size[locale]} · ${size.dimensions}`:null};}


