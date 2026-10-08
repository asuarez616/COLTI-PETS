import {supabase} from './supabaseRepositories';
import type {CollectionRecord} from '../domain/catalogGroups';
export type {CollectionRecord} from '../domain/catalogGroups';
export async function loadCollectionRecords():Promise<CollectionRecord[]>{if(!supabase)return [];const {data,error}=await supabase.from('catalog_categories').select('*').eq('deleted',false).order('name');if(error)throw error;return data;}
export async function loadCategories(){return (await loadCollectionRecords()).map(c=>c.name);}
export async function editCollection(action:string,name:string,newName:string|null,revision:number){if(!supabase)throw Error('Authentication required');const {error}=await supabase.rpc('admin_collection',{p_action:action,p_name:name,p_new:newName,p_revision:revision});if(error)throw error;}
export async function createCategory(name:string){return editCollection('create','',name.trim().replace(/\s+/g,' ').normalize('NFC'),0);}
