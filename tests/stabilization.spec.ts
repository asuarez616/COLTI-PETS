import {test,expect} from './fixture-catalog';
test('accordion UI is independent, Heart determines the final saved payload',async({page})=>{
 await page.goto('/');
 await page.evaluate(async()=>{const path='/src/domain/model.ts',fixtures='/src/data/fixtures.ts';const {blankDraft}=await import(path);const {fixtureDesigns}=await import(fixtures);const d=blankDraft();d.customer={name:'Ana',phone:'+1 555 123 4567'};Object.assign(d.current,{size_code:'M',width_cm:2.5,design_id:fixtureDesigns[0].id,tagShape:'circle',tagSize:'small',tagWidthCm:2.5,tagHeightCm:2.5,pet_name:'Lola',tag_phone:d.customer.phone});d.step='personalization';sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));});await page.reload();
 const toggle=(name:string)=>page.locator('.personality-toggle').filter({hasText:name});
 for(const name of ['Decoration','Drawing','Photo'])await toggle(name).click();
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-draft-v1')!).current.personalization_type)).toBe('decoration');
 await page.getByRole('button',{name:'Heart',exact:true}).click();
 await toggle('Decoration').click();await expect(toggle('Decoration')).toHaveAttribute('aria-expanded','false');
 await toggle('Decoration').click();await expect(page.getByRole('button',{name:'Heart',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Continue →',exact:true}).click();await page.getByRole('button',{name:'Add to my order →'}).click();await page.getByRole('button',{name:'Save order'}).click();
 await expect(page.getByRole('heading',{name:'DEMO-COLTI-US-0001'})).toBeVisible();
 const item=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-demo-orders-v1')!)[0].items[0]);expect(item.personalization_type).toBe('decoration');expect(item.decorationIcon).toBe('heart');expect(item.attachments).toEqual([]);
});
test('corrupt nested draft recovers without reload loop',async({page})=>{await page.goto('/');await page.evaluate(()=>sessionStorage.setItem('colti-draft-v1',JSON.stringify({version:1,current:{},customer:{},items:[],step:11})));await page.reload();await expect(page.getByRole('textbox',{name:'First, what’s your name?'})).toBeVisible();await page.reload();await expect(page.getByRole('textbox',{name:'First, what’s your name?'})).toBeVisible();});
