import {test,expect} from '@playwright/test';
test('design filters preserve selection and keep navigation accessible',async({page})=>{
 for(const [width,height] of [[390,667],[834,900],[1440,900]]){
  await page.setViewportSize({width,height});await page.goto('/');
  await page.evaluate(async()=>{const {blankDraft}=await import('/src/domain/model.ts');const draft=blankDraft();draft.step='design';draft.current.size_code='M';draft.current.width_cm=2.5;sessionStorage.setItem('colti-draft-v1',JSON.stringify(draft));});await page.reload();
  await expect(page.locator('.design-card').first()).toBeVisible();
  const total=await page.locator('.design-card').count();
  await expect(page.getByRole('button',{name:'Blue',exact:true})).toBeEnabled({timeout:45000});
  await page.getByRole('button',{name:'Blue',exact:true}).click();
  const blue=await page.locator('.design-card').count();expect(blue).toBeGreaterThan(0);expect(blue).toBeLessThan(total);
  await page.locator('.design-meta button').first().click();await expect(page.locator('.design-card.selected')).toHaveCount(1);
  const next=page.getByRole('button',{name:'Continue →',exact:true});await expect(next).toBeEnabled();
  const buttonBox=await next.boundingBox();expect(buttonBox!.y+buttonBox!.height).toBeLessThanOrEqual(height);
  await page.getByRole('tab',{name:'PRINTED',exact:true}).click();
  const collection=page.getByLabel('Collection',{exact:true});await expect(collection).toBeVisible();
  const collectionBox=await collection.boundingBox(),colorsBox=await page.locator('.design-color-filters').boundingBox();expect(colorsBox!.x).toBeGreaterThan(collectionBox!.x+collectionBox!.width);
  await expect(page.locator('.flow-progress')).toHaveCSS('position','static');
  const progressBefore=await page.locator('.flow-progress').boundingBox();
  await page.locator('.store-design-scroll').evaluate(el=>{el.scrollTop=300;});
  const progressAfter=await page.locator('.flow-progress').boundingBox();expect(progressAfter!.y).toBe(progressBefore!.y);
  const galleryBox=await page.locator('.store-design-scroll').boundingBox(),actionsBox=await page.locator('.flow-actions').boundingBox();expect(actionsBox!.y).toBeGreaterThanOrEqual(galleryBox!.y+galleryBox!.height);
  const values=await collection.locator('option').evaluateAll(nodes=>nodes.map(n=>(n as HTMLOptionElement).value));expect(values.length).toBeGreaterThan(1);
  await collection.selectOption(values[1]);await expect(page.locator('.design-card').first()).toBeVisible();
  await page.locator('.image-button').first().click();await expect(page.getByRole('dialog')).toBeVisible();
  const scrim=await page.getByRole('dialog').evaluate(node=>getComputedStyle(node,'::backdrop').backgroundColor);expect(scrim).toBe('rgba(62, 36, 52, 0.48)');
  await page.keyboard.press('Escape');await page.screenshot({path:`artifacts/admin/store-filters-${width}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.design-meta button').first().click();await next.click();
  await expect(page.getByRole('heading',{name:'How should it fasten?',exact:true})).toBeVisible();
  expect(await page.locator('.configurator-area').evaluate(node=>node.scrollTop)).toBe(0);
  const progress=await page.locator('.flow-progress').boundingBox();expect(progress!.y).toBeGreaterThanOrEqual(0);expect(progress!.y).toBeLessThan(220);
 }
});

