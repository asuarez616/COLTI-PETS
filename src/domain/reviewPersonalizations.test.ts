import {describe,it,expect} from 'vitest';
import {blankItem} from './model';
import {getReviewPersonalizations} from './presentation';
describe('Step 10 selected personalizations',()=>{
 it('lists decoration with Drawing and Photo, including the localized icon',()=>{
  for(const personalization_type of ['drawing','dog_photo'] as const){
   const item={...blankItem(),personalization_type,decorationIcon:'paw' as const};
   expect(getReviewPersonalizations(item,'en')).toEqual(['Decoration · Paw',personalization_type==='drawing'?'Drawing':'Photo']);
   expect(getReviewPersonalizations(item,'es')).toEqual(['Decoración · Huella',personalization_type==='drawing'?'Dibujo':'Foto']);
  }
 });
 it('represents selected decoration without a name icon',()=>{
  expect(getReviewPersonalizations({...blankItem(),personalization_type:'decoration'},'en')).toEqual(['Decoration']);
  expect(getReviewPersonalizations({...blankItem(),personalization_type:'drawing',informationIcons:['phone']},'en')).toEqual(['Decoration','Drawing']);
 });
 it('does not invent selections for media alone or no personalization',()=>{
  expect(getReviewPersonalizations({...blankItem(),personalization_type:'drawing'},'en')).toEqual(['Drawing']);
  expect(getReviewPersonalizations({...blankItem(),personalization_type:'dog_photo'},'en')).toEqual(['Photo']);
  expect(getReviewPersonalizations(blankItem(),'en')).toEqual([]);
 });
});
