import {test,expect} from '@playwright/test';
test('saves two Drive collars and preserves their images and details',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const modelPath='/src/domain/model.ts',repoPath='/src/infrastructure/supabaseRepositories.ts';
  const {blankDraft,blankItem}=await import(modelPath);
  const {loadCatalog,confirmOrder,findOrder}=await import(repoPath);
  const {designs}=await loadCatalog();const draft=blankDraft();draft.customer={name:'Test',phone:'+593998888888'};
  draft.items=['CH-24','CH-1'].map((code,i)=>({...blankItem(),size_code:i?'ML':'M',width_cm:i?3:2.5,design_id:designs.find((d:any)=>d.code===code).id,tag_type:'anti_fall',pet_name:i?'Pame':'Lolo',tag_phone:'0984156889'}));
  const order=await confirmOrder(draft),again=await confirmOrder(draft),restored=await findOrder(draft.key);
  return {codes:order.items.map((i:any)=>i.design.code),images:order.items.map((i:any)=>i.design.image),names:order.items.map((i:any)=>i.pet_name),same:order.id===again.id&&restored.id===order.id};
 });
 expect(result.codes).toEqual(['CH-24','CH-1']);expect(result.names).toEqual(['Lolo','Pame']);expect(result.same).toBe(true);
 for(const image of result.images)expect(image).toContain('/catalog/drive/');
});
for(const [size,width,wovenCount] of [['XS',1,96],['S',1.5,0],['M',2.5,98]] as const){
 test('Drive catalogue filters '+size,async({page})=>{
  await page.goto('/');
  await page.evaluate(async({size,width})=>{const path='/src/domain/model.ts';const {blankDraft}=await import(path);const draft=blankDraft();draft.step='design';Object.assign(draft.current,{size_code:size,width_cm:width});sessionStorage.setItem('colti-draft-v1',JSON.stringify(draft));},{size,width});
  await page.reload();await expect(page.locator('.design-card')).toHaveCount(wovenCount);
  if(wovenCount){const img=page.locator('.design-card img').first();await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);expect(await img.getAttribute('srcset')).toContain('240w');}
  await page.getByRole('tab',{name:'PRINTED',exact:true}).click();await expect(page.locator('.design-card')).toHaveCount(71);
  await expect.poll(()=>page.locator('.design-card img').first().evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
 });
}
