import {supabase,mode} from './supabaseRepositories';
import {validateTags,initialTags,type TagsConfig} from '../domain/idTags';
import {closureRepository} from './closures';
import type {TagsRepository} from '../application/idTags';
export const tagsRepository:TagsRepository={async load(){if(!supabase){if(mode==='demo')return structuredClone(initialTags);throw Error('TAGS_NOT_CONFIGURED');}const {data,error}=await supabase.from('id_tag_configuration').select('value,revision').eq('id',true).single();if(error)throw error;return validateTags({...data.value,revision:data.revision} as TagsConfig);},async save(c){if(!supabase)throw Error('TAGS_NOT_CONFIGURED');const {data,error}=await supabase.rpc('admin_id_tags',{p_value:c,p_revision:c.revision});if(error)throw error;return validateTags(data as TagsConfig);},uploadIcon:closureRepository.uploadIcon};
