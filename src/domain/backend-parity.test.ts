import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import type {PGlite} from '@electric-sql/pglite';
import {createTestDatabase} from '../../scripts/local-postgres.mjs';
import {blankItem,sizes,validateItem} from './model';
import {parseItem} from './validation';
import {tagModels} from './tags';
import {getInformationIcons} from './personalization';
import {fixtureDesigns,fixtureFonts} from '../data/fixtures';
let db:PGlite;const user=crypto.randomUUID(),draft=crypto.randomUUID();
const base=()=>({...blankItem('+593 99 123 4567'),size_code:'M',width_cm:2.5,design_id:fixtureDesigns[0].id,tagShape:'circle' as const,tagSize:'small',tagWidthCm:2.5,tagHeightCm:2.5,pet_name:'Lola'});
beforeAll(async()=>{db=await createTestDatabase();await db.query('insert into auth.users values ($1)',[user]);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);},30000);
afterAll(async()=>{await db?.close();});
async function accepted(value:unknown){await db.exec('begin');try{await db.query('select public.confirm_order($1,$2,$3::jsonb,$4::jsonb)',[crypto.randomUUID(),draft,JSON.stringify({name:'Ana',phone:'+593 99 123 4567'}),JSON.stringify([value])]);return true;}catch{return false;}finally{await db.exec('rollback');}}
const extra=()=>({selected:['address','health','neutered','family','phones','other'],address:'Miami',health:'Allergies',neutered:'Spayed',familyName:'Ana',familyPhone:'+593 99 123 4567',phones:'+1 555 333 4444',other:'Humberto Salvador'});
const cases:Record<string,unknown>[]=[
 {},{personalization_type:'unknown'},{decorationIcon:'fake'},{decorationIcon:'heart'},{informationIcons:['phone']},
 {personalization_type:'decoration',decorationIcon:'heart',informationIcons:['phone']},
 {personalization_type:'decoration',decorationIcon:'crown'},
 {personalization_type:'decoration',informationIcons:['phone','phone']},
 {personalization_type:'decoration',informationIcons:['fake']},
 {personalization_type:'decoration',informationIcons:['address']},
 {personalization_type:'decoration',tagExtras:extra(),tagEmail:'family@example.com',informationIcons:['phone','address','email','neutered']},
 {tagExtras:extra()},{tagExtras:{...extra(),selected:['fake']}},{tagExtras:{...extra(),selected:['address','address']}},
 {tagExtras:{...extra(),selected:[true]}},{tagExtras:{...extra(),address:true}},{tagExtras:{...extra(),address:'x'.repeat(2001)}},
 {tagExtras:{...extra(),phones:null}},{tagExtras:{...extra(),neutered:'Both'}},{tagExtras:{...extra(),familyPhone:'1'.repeat(33)}},
 {tagEmail:'bad'},{tagEmail:' x@y.com'},{tagEmail:'x@y.com'},{tagEmail:''},{tagEmail:null},{tagEmail:'a'.repeat(249)+'@b.com'},
 {collar_type:'fake'},{tag_type:'fake'},{width_cm:'2.5'},{width_cm:3},{font_number:0},{font_number:37},{font_number:1.5},
 {pet_name:' '},{pet_name:'\t'},{pet_name:'x'.repeat(200)},{pet_name:'x'.repeat(201)},
 {pet_name:'🐾'.repeat(100)},{pet_name:'🐾'.repeat(101)},{extra_text:'🐾'.repeat(1000)},{extra_text:'🐾'.repeat(1001)},
 {personalization_notes:'x'.repeat(2001)},{attachments:null},{attachments:[{id:'bad'}]},
 {personalization_type:'drawing'},{personalization_type:'dog_photo'},
];
describe('TypeScript ↔ PostgreSQL contract',()=>{
 it('size/width and active shape/size inventories match exactly',async()=>{
  const widths=(await db.query<{size_code:string;width_cm:string}>('select size_code,width_cm::text from public.size_widths')).rows.map(r=>`${r.size_code}:${Number(r.width_cm)}`).sort();
  expect(widths).toEqual(sizes.flatMap(s=>s.widths.map(w=>`${s.code}:${w}`)).sort());
  const tags=(await db.query<{shape:string;size:string;width_cm:string;height_cm:string}>('select shape,size,width_cm::text,height_cm::text from public.tag_options where active')).rows.map(r=>`${r.shape}:${r.size}:${Number(r.width_cm)}:${Number(r.height_cm)}`).sort();
  expect(tags).toEqual(tagModels.filter(m=>!('active' in m&&m.active===false)).flatMap(m=>m.sizes.map(s=>`${m.shape}:${s.id}:${s.width}:${s.height}`)).sort());
 });
 it.each(cases)('matches full server confirmation for payload %#',async patch=>{const value={...base(),...patch};let client=false;try{client=validateItem(parseItem(value),fixtureDesigns,fixtureFonts).length===0;}catch{}expect(await accepted(value)).toBe(client);});
 it('all tag geometries and sizes have the same availability',async()=>{for(const model of tagModels)for(const size of model.sizes){const value={...base(),tagShape:model.shape,tagSize:size.id,tagWidthCm:size.width,tagHeightCm:size.height};expect(await accepted(value)).toBe(validateItem(value,fixtureDesigns,fixtureFonts).length===0);}});
 it('automatic information icons reflect only provided data in both layers',async()=>{const value={...base(),tagEmail:'hello@example.com',tagExtras:{...extra(),selected:['address','neutered'] as ('address'|'neutered')[]}};const server=(await db.query<{icons:string[]}>('select public.information_icons_for($1::jsonb) icons',[JSON.stringify(value)])).rows[0].icons;expect(server).toEqual(getInformationIcons(value));});
});
