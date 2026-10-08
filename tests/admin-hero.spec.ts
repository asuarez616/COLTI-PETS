import {test,expect} from '@playwright/test';
for(const size of [{width:1440,height:900},{width:834,height:1194},{width:390,height:844}])test('dynamic hero preserves geometry '+size.width,async({page})=>{
 await page.setViewportSize(size);await page.goto('/');const hero=page.locator('.editorial-carousel');
 if(size.width<801){await expect(hero).toHaveCount(0);return;}
 await expect(hero.locator('img.active')).toBeVisible();const before=await hero.boundingBox();
 await page.route('**/src/data/heroBackend.ts*',route=>route.fulfill({contentType:'text/javascript',body:"import images from '/src/catalog/hero-drive.json?import';export const heroImages=images;export const getHeroState=async()=>({source:images,configuration:{revision:1,images:[{id:images[1].id,active:true},{id:images[0].id,active:false}]}});"}));
 await page.reload();await expect(hero.locator('img')).toHaveCount(1);await expect(hero.locator('img.active')).toHaveAttribute('alt','Terrier wearing a COLTI collar');expect(await hero.boundingBox()).toEqual(before);
 expect(await hero.locator('img.active').evaluate(image=>getComputedStyle(image).transitionDuration)).toBe('1s');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.reload();await expect(hero.locator('img.active')).toHaveAttribute('alt','Terrier wearing a COLTI collar');
});
