import {mkdir} from 'node:fs/promises';
import {test,expect} from './fixture-catalog';

const viewports=[
 {name:'ipad-pro-portrait',width:1024,height:1366,heroShare:.51,focal:'42% 39%'},
 {name:'ipad-air-portrait',width:820,height:1180,heroShare:.51,focal:'42% 39%'},
 {name:'ipad-landscape',width:1194,height:834,heroShare:.4,focal:'50% 36%'},
 {name:'desktop',width:1440,height:900,heroShare:.38,focal:'50% 36%'},
] as const;

test('editorial hero fills the shared shell with device-appropriate crop and focal points',async({page})=>{
 await page.goto('/');
 await page.evaluate(async()=>{const {blankDraft}=await import('/src/domain/model.ts');const draft=blankDraft();draft.step='personalization';sessionStorage.setItem('colti-draft-v1',JSON.stringify(draft));});
 await page.reload();await page.evaluate(()=>document.fonts.ready);await expect(page.locator('.story .editorial-carousel>img.active')).toBeVisible();
 await page.locator('.story .editorial-carousel>img.active').evaluate(async element=>{const image=element as HTMLImageElement;if(!image.complete)await image.decode();});
 await page.emulateMedia({reducedMotion:'reduce'});await mkdir('artifacts/hero-crops',{recursive:true});
 for(const viewport of viewports){
 await page.setViewportSize({width:viewport.width,height:viewport.height});
  await expect.poll(()=>page.locator('.story .editorial-carousel>img.active').evaluate(element=>(element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const story=page.locator('.configurator-layout>.story'),layout=page.locator('main.configurator-layout'),footer=page.locator('.site-footer');
  const metrics=await page.evaluate(()=>{
   const story=document.querySelector<HTMLElement>('.configurator-layout>.story')!,main=document.querySelector<HTMLElement>('main.configurator-layout')!,area=document.querySelector<HTMLElement>('.configurator-area')!,footer=document.querySelector<HTMLElement>('.site-footer')!,image=story.querySelector<HTMLImageElement>('img.active')!;
   const s=story.getBoundingClientRect(),m=main.getBoundingClientRect(),a=area.getBoundingClientRect(),f=footer.getBoundingClientRect();return {share:s.width/m.width,heroHeight:s.height,mainHeight:m.height,areaHeight:a.height,heroTop:s.top,mainTop:m.top,heroBottom:s.bottom,footerTop:f.top,focal:getComputedStyle(image).objectPosition};
  });
  expect(metrics.share).toBeCloseTo(viewport.heroShare,2);expect(metrics.heroHeight).toBeCloseTo(metrics.mainHeight,0);expect(metrics.areaHeight).toBeCloseTo(metrics.mainHeight,0);expect(metrics.heroTop).toBeCloseTo(metrics.mainTop,0);expect(metrics.heroBottom).toBeCloseTo(metrics.footerTop,0);expect(metrics.focal).toBe(viewport.focal);
  await page.screenshot({path:`artifacts/hero-crops/${viewport.name}.png`,fullPage:true});
 }
 const perImage=await page.locator('.story .editorial-carousel>img').evaluateAll(images=>images.map(image=>({alt:image.getAttribute('alt'),desktop:(image as HTMLImageElement).style.getPropertyValue('--hero-desktop-focal'),portrait:(image as HTMLImageElement).style.getPropertyValue('--hero-tablet-portrait-focal')})));
 expect(perImage.length).toBeGreaterThanOrEqual(5);expect(perImage.every(image=>image.desktop&&image.portrait)).toBe(true);
});
