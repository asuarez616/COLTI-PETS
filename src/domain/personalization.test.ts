import {getCollarConfiguration,toItem} from './configuration';
import {describe,it,expect} from 'vitest';
import {blankItem,blankDraft} from './model';
import {selectNameDecoration,selectPersonalization,validatePersonalization} from './personalization';
import {saveItem} from '../configurator/state';
describe('personalization integrity',()=>{
 it('preserves Photo when adding decoration',()=>{
  const item={...blankItem('+1 555 123 4567'),personalization_type:'dog_photo' as const,attachments:[{id:'a',original_filename:'photo.png',mime_type:'image/png',byte_size:100,status:'ready' as const,object_path:'a',purpose:'dog_photo' as const}]};
  const current=selectNameDecoration(item,'heart');const payload=JSON.parse(JSON.stringify(saveItem({...blankDraft(),current}).items));
  expect(payload[0].personalization_type).toBe('dog_photo');expect(payload[0].decorationIcon).toBe('heart');expect(payload[0].attachments).toHaveLength(1);expect(validatePersonalization(current)).toEqual([]);
 });
 it('does not carry photo instructions into drawing',()=>{const item={...blankItem(),personalization_type:'dog_photo' as const,personalization_notes:'Photo only'};expect(selectPersonalization(item,'drawing').personalization_notes).toBe('');});
 it('rejects an attachment with a different purpose',()=>{const item=blankItem();item.personalization_type='drawing';item.attachments=[{id:'a',original_filename:'photo.png',mime_type:'image/png',byte_size:100,status:'ready',object_path:'a',purpose:'dog_photo'}];expect(validatePersonalization(item)).toContain('attachment');});
});

it('preserves decoration while switching exclusive media and in configuration round trips',()=>{
 const decorated=selectNameDecoration(blankItem('+1 555 123 4567'),'heart');
 const photo=selectPersonalization(decorated,'dog_photo');
 const next=selectPersonalization({...photo,attachments:[{id:'a',original_filename:'photo.png',mime_type:'image/png',byte_size:100,status:'ready',object_path:'a',purpose:'dog_photo'}]},'drawing');
 expect(next.decorationIcon).toBe('heart');expect(next.personalization_type).toBe('drawing');expect(next.attachments).toEqual([]);
 expect(toItem(getCollarConfiguration(next)).decorationIcon).toBe('heart');
});
