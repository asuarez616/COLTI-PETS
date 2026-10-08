import {validateTags,type TagsConfig} from '../domain/idTags';
export interface TagsRepository {load():Promise<TagsConfig>;save(value:TagsConfig):Promise<TagsConfig>;uploadIcon(file:File):Promise<string>}
export const tagsApplication=(r:TagsRepository)=>({load:()=>r.load(),save:(c:TagsConfig)=>r.save(validateTags(c)),uploadIcon:(file:File)=>r.uploadIcon(file)});
