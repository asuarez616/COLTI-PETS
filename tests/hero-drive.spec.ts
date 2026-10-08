import {test,expect} from '@playwright/test';
test('Drive hero image failure keeps geometry and loads a local fallback',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.route('**/editorial/0-*.webp',route=>route.abort());await page.goto('/');
 const photo=page.locator('.editorial-carousel img.active');await expect(photo).toHaveAttribute('data-fallback','true');await expect.poll(()=>photo.evaluate((image:HTMLImageElement)=>image.complete&&image.naturalWidth>0)).toBe(true);
 const before=await page.locator('.editorial-carousel').boundingBox();await page.getByRole('button',{name:'Cambiar a español'}).click();expect(await page.locator('.editorial-carousel').boundingBox()).toEqual(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
