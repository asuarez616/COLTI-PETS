import type {ReactNode} from 'react';
import type {Item,Locale,FontRecord} from './domain/model';
import {getTagPreview} from './domain/presentation';
import TagPreview from './ui/TagPreview';
/** Retain the existing entry point as a data adapter. */
export default function TagFaces({item,locale,icon,font}:{item:Item;locale:Locale;icon:(k:string)=>ReactNode;font?:FontRecord}){return <TagPreview data={getTagPreview(item,locale)} locale={locale} icon={icon} font={font}/>;}
