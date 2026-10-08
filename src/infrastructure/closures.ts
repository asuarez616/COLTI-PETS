import type {ClosureRepository} from '../application/closures';
import {validateClosure,type Closure} from '../domain/closures';
import {supabase,imageUrl,mode} from './supabaseRepositories';
import fixtures from '../data/closure-fixtures.json';
import {uploadImage} from './adminUploads';
export const closureRepository:ClosureRepository={
 async load(){if(!supabase){if(mode==='demo')return fixtures.map(value=>validateClosure(value as Closure));throw Error('CLOSURES_NOT_CONFIGURED');}const {data,error}=await supabase.from('closures').select('*').eq('deleted',false).order('display_order');if(error)throw error;return data.map(value=>validateClosure(value as Closure));},
 async create(value){if(!supabase)throw Error('CLOSURES_NOT_CONFIGURED');const {data,error}=await supabase.rpc('admin_create_closure',{p_value:value});if(error)throw error;return validateClosure(data as Closure);},
 async save(value){if(!supabase)throw Error('CLOSURES_NOT_CONFIGURED');const {data,error}=await supabase.rpc('admin_closure',{p_value:value,p_revision:value.revision});if(error)throw error;return validateClosure(data as Closure);},
 async remove(key,revision){if(!supabase)throw Error('CLOSURES_NOT_CONFIGURED');const {error}=await supabase.rpc('admin_delete_closure',{p_key:key,p_revision:revision});if(error)throw error;},
 async uploadIcon(file){const result=await uploadImage(file,{target:'closure',code:'',type:'woven',group:'',collection:''});if(!result.icon)throw Error('Could not upload icon');return result.icon;}
};
export const closureIconUrl=(path:string)=>path.startsWith('/icons/')?import.meta.env.BASE_URL+path.slice(1):imageUrl(path);
