import {test,expect} from './fixture-catalog';
test('rectangular preview shows three icon rows, retains all details and has no false back pages',async({page})=>{
 await page.goto('/');await page.evaluate(async()=>{const path='/src/domain/model.ts';const {blankDraft}=await import(path);const d=blankDraft();d.step='personalization';Object.assign(d.current,{tag_type:'anti_fall',pet_name:'Mona',personalization_type:'decoration',tag_phone:'0984156889',tagExtras:{selected:['address','health','neutered','phones'],address:'Quito',health:'Daily medication',neutered:'Spayed',phones:'0992826805\n0981234567',familyName:'',familyPhone:'',other:''}});sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));});await page.reload();
 await expect(page.locator('.tag-face-line')).toHaveCount(3);await expect(page.locator('.tag-preview-pages')).toHaveCount(0);
 await expect(page.locator('.tag-preview-disclaimer')).toHaveText('Preview only. The final design will include all the details you provided.');
 await expect(page.locator('.tag-face-line').filter({hasText:'Spayed'})).toBeVisible();
 const details=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-draft-v1')!).current.tagExtras);
 expect(details.phones).toBe('0992826805\n0981234567');expect(details.health).toBe('Daily medication');
});
