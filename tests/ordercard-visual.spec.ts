import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('collar count changes only product composition, with constant card height',async({page})=>{
 const original=await readFile('tests/fixtures/admin-backend.js','utf8');
 for(const width of [1440,834,390]){
  const heights:number[]=[];
  for(const count of [1,2,3,4,10]){
   await page.unroute('**/src/data/adminBackend.ts*');await page.route('**/src/data/adminBackend.ts*',r=>r.fulfill({contentType:'text/javascript',body:original.replace("['Luna','Sol']",`Array.from({length:${count}},(_,n)=>'Pet '+n)`)}));
   await page.setViewportSize({width,height:1000});await page.goto('/admin/orders');const card=page.locator('.admin-ticket');await expect(card).toHaveCount(1);await page.evaluate(()=>document.fonts.ready);
   const images=card.locator('.design-image');await expect(images).toHaveCount(count>4?3:count);
   expect(Math.round((await images.first().boundingBox())!.width)).toBe(count===1?96:count===2?72:count===3?60:36);
   heights.push((await card.boundingBox())!.height);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.screenshot({path:`artifacts/admin/ordercard-${width}-${count}.png`,fullPage:true});
  }
  expect(Math.max(...heights)-Math.min(...heights)).toBeLessThanOrEqual(1);
 }
});
