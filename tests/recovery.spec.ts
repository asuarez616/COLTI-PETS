import {test,expect,type Page} from './fixture-catalog';
async function prepare(page:Page){
 await page.goto('/');
 await page.evaluate(async()=>{
  const model='/src/domain/model.ts',fixtures='/src/data/fixtures.ts';
  const {blankDraft}=await import(model),{fixtureDesigns}=await import(fixtures);
  const d=blankDraft();d.customer={name:'Ana',phone:'+1 555 123 4567'};
  Object.assign(d.current,{size_code:'M',width_cm:2.5,design_id:fixtureDesigns[0].id,tag_type:'anti_fall',pet_name:'Lola',tag_phone:d.customer.phone});
  d.items=[d.current];d.step='order-summary';sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));
 });
 await page.reload();await expect(page.getByRole('button',{name:'Save order'})).toBeEnabled();
}
async function count(page:Page){return page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-demo-orders-v1')||'[]').length);}
test('lost response after commit: retry and refresh recover exactly one order',async({page})=>{
 await prepare(page);
 await page.evaluate(async()=>{const path='/src/infrastructure/supabaseRepositories.ts';const {repositories}=await import(path);const original=repositories.orders.confirm;let lost=false;repositories.orders.confirm=async(d:any)=>{const result=await original(d);if(!lost){lost=true;throw new TypeError('Failed to fetch after commit');}return result;};});
 await page.getByRole('button',{name:'Save order'}).click();
 await expect(page.getByRole('alert')).toContainText('We couldn’t save your order.');expect(await count(page)).toBe(1);
 await expect(page.getByRole('button',{name:'Edit customer'})).toBeDisabled();
 expect(await page.evaluate(()=>!!sessionStorage.getItem('colti-draft-v1'))).toBe(true);
 // A saved request must remain recoverable even if the catalogue changes meanwhile.
 await page.evaluate(async()=>{const path='/src/data/fixtures.ts';const {fixtureDesigns}=await import(path);fixtureDesigns[0].active=false;});
 await page.getByRole('button',{name:'Try again →',exact:true}).click();
 await expect(page.getByRole('heading',{name:'DEMO-COLTI-US-0001'})).toBeVisible();expect(await count(page)).toBe(1);
 await page.reload();await expect(page.getByRole('heading',{name:'DEMO-COLTI-US-0001'})).toBeVisible();expect(await count(page)).toBe(1);
 expect(await page.evaluate(()=>sessionStorage.getItem('colti-draft-v1'))).toBeNull();
});
test('pending request survives refresh when nothing was committed',async({page})=>{
 await prepare(page);
 await page.evaluate(async()=>{const path='/src/infrastructure/supabaseRepositories.ts';const {repositories}=await import(path);repositories.orders.confirm=async()=>{throw new TypeError('Failed to fetch before commit');};});
 await page.getByRole('button',{name:'Save order'}).click();await expect(page.getByRole('alert')).toBeVisible();expect(await count(page)).toBe(0);
 const key=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-confirmation-v1')!).key);
 await page.reload();await expect(page.getByRole('button',{name:'Try again →',exact:true})).toBeEnabled();
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-draft-v1')!).key)).toBe(key);
 await page.getByRole('button',{name:'Try again →',exact:true}).click();await expect(page.getByRole('heading',{name:'DEMO-COLTI-US-0001'})).toBeVisible();expect(await count(page)).toBe(1);
});
test('unavailable confirmed-order recovery keeps the store visible and prevents duplicate confirmation',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>sessionStorage.setItem('colti-confirmation-v1',JSON.stringify({key:'11111111-1111-4111-8111-111111111111',draftId:'22222222-2222-4222-8222-222222222222',signature:'a'.repeat(64),state:'confirmed'})));
 await page.reload();
 await expect(page.locator('.recovery-notice')).toContainText('You don’t have permission to do that.');
 await expect(page.getByRole('heading',{name:'First, what’s your name?'})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-confirmation-v1')!).state)).toBe('confirmed');
 expect(await count(page)).toBe(0);
});
test('concurrent duplicate confirmations use one saved order',async({page})=>{
 await prepare(page);
 const ids=await page.evaluate(async()=>{const path='/src/data/backend.ts';const {confirmOrder}=await import(path);const d=JSON.parse(sessionStorage.getItem('colti-draft-v1')!);return (await Promise.all([confirmOrder(d),confirmOrder(d)])).map(o=>o.id);});
 expect(ids[0]).toBe(ids[1]);expect(await count(page)).toBe(1);
});
