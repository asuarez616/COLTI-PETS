import {test,expect} from './fixture-catalog';
import type {FontRecord} from '../src/domain/model';
test('all 36 supplied fonts decode and render with reference numbering',async({page})=>{
 page.on('console',message=>{if(message.type()==='warning'||message.type()==='error')console.log(message.text());});
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const fixtures='/src/data/fixtures.ts',loader='/src/catalog/fonts.ts';const {fixtureFonts}=await import(fixtures);const {loadFont,fontText}=await import(loader);
  return Promise.all(fixtureFonts.map(async(f:FontRecord)=>{try{const family=await loadFont(f);return {number:f.number,label:f.label,loaded:document.fonts.check(`30px "${family}"`),text:fontText(f,'Luna Sol')};}catch(e){return {number:f.number,error:String(e)};}}));
 });expect(result).toHaveLength(36);expect(result.filter(r=>r.error||!r.loaded)).toEqual([]);expect(result.map(r=>r.number)).toEqual(Array.from({length:36},(_,n)=>n+1));expect(result[16].text).toBe('Luna] Sol}');expect(result[28].text).toBe('LUNA SOL');
 const draft=await page.evaluate(async()=>{const p='/src/domain/model.ts';const {blankDraft}=await import(p);const d=blankDraft();d.customer={name:'Font preview',phone:'+1 555 123 4567'};d.current.pet_name='Luna';d.current.size_code='M';d.current.width_cm=2.5;d.step='lettering';return d;});
 await page.evaluate(d=>sessionStorage.setItem('colti-draft-v1',JSON.stringify(d)),draft);await page.reload();
 await expect(page.locator('.lettering-quick .lettering-card')).toHaveCount(3);await page.getByRole('button',{name:'View all lettering styles →'}).click();await expect(page.locator('.lettering-grid .lettering-card')).toHaveCount(36);await expect(page.getByText('Placeholder — real font preview pending')).toHaveCount(0);await page.screenshot({path:'artifacts/fonts-all.png',fullPage:true});await page.getByRole('dialog').getByRole('button',{name:'Font 36',exact:true}).click();await page.getByRole('button',{name:'Use this style'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
