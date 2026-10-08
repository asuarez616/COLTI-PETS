import {test,expect} from '@playwright/test';
test('compact design gallery preserves selection on phone and tablet',async({page})=>{
 for(const width of [390,834,1440]){
  await page.setViewportSize({width,height:1000});await page.goto('/');await page.evaluate(async()=>{const {blankDraft}=await import('/src/domain/model.ts');const d=blankDraft();d.step='design';d.current.size_code='M';d.current.width_cm=2.5;sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));});await page.reload();
  await expect(page.locator('.design-card').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const first=page.locator('.design-card').first();const bounds=await first.boundingBox();expect(bounds!.width).toBeLessThan(260);await first.locator('.design-meta button').click();await expect(first).toHaveClass(/selected/);
  await page.screenshot({path:`artifacts/admin/store-brand-${width}.png`});
 }
});
