import {test,expect} from './fixture-catalog';
test('contact choices have no icons; decoration adds user and phone to the actual contact',async({page})=>{
 await page.goto('/');await page.evaluate(async()=>{const path='/src/domain/model.ts';const {blankDraft}=await import(path);const draft=blankDraft();draft.step='tag-details';draft.current.pet_name='Mona';draft.current.font_number=9;draft.current.tag_type='hanging';draft.current.tagShape='circle';draft.current.personalization_type='decoration';draft.current.tagExtras={selected:['family'],familyName:'Ana',familyPhone:'0992826805',address:'',health:'',neutered:'',other:''};sessionStorage.setItem('colti-draft-v1',JSON.stringify(draft));});await page.reload();
 await expect(page.locator('.contact-mode-option svg')).toHaveCount(0);
 await page.evaluate(()=>{const draft=JSON.parse(sessionStorage.getItem('colti-draft-v1')!);draft.step='personalization';sessionStorage.setItem('colti-draft-v1',JSON.stringify(draft));});await page.reload();
 await page.getByRole('button',{name:'View back',exact:true}).click();
 const name=page.locator('[data-info-key="family-name"]'),phone=page.locator('[data-info-key="family-phone"]');await expect(name).toContainText('Ana');await expect(name.locator('svg')).toHaveCount(1);await expect(phone).toContainText('0992826805');await expect(phone.locator('svg')).toHaveCount(1);await expect(page.locator('.automatic-info-icon').filter({hasText:'Contact name'})).toBeVisible();
 await page.screenshot({path:'artifacts/family-decoration.png',fullPage:true});
});
