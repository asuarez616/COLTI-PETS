import type {Design} from './model';

export const wovenGroups=[

 {id:'medium-large',label:'Medianos a grandes',sizes:['M','ML','L','XL','2XL']},

 {id:'small-medium',label:'Pequeños a semimedianos',sizes:['S','SM']},

 {id:'miniature',label:'Miniatura',sizes:['2XS','XS']}

];

export const collectionName=(value:string)=>value.trim().replace(/\s+/g,' ').normalize('NFC');

export const categoryLabel=(value:string)=>value.charAt(0).toLocaleUpperCase('es')+value.slice(1);
export const printedCollection=(design:Design)=>categoryLabel(collectionName(design.collection_override||design.source_collection||'Sin colección'));

export function catalogGroups(designs:Design[],family:string){

 if(family==='woven')return wovenGroups.map(g=>({...g,description:g.sizes.join(' · '),designs:designs.filter(d=>d.compatibility.some(c=>g.sizes.includes(c.size_code)))}));

 const names=[...new Set(designs.map(printedCollection))].sort((a,b)=>a.localeCompare(b,'es'));

 return names.map(label=>({id:label,label,description:'',designs:designs.filter(d=>printedCollection(d)===label)}));

}


export interface CollectionRecord{name:string;active:boolean;deleted:boolean;revision:number}

export interface CollectionRecord{name:string;active:boolean;deleted:boolean;revision:number}
