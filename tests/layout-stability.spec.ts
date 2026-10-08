import {test,expect,type Page} from './fixture-catalog';
import {mkdir,writeFile} from 'node:fs/promises';
// Deterministic rasterization: GPU gradient dithering can vary RGB by 1 without movement.
test.use({launchOptions:{args:['--disable-gpu','--force-color-profile=srgb']}});

async function seed(page:Page,step:number){
 await page.goto('/');await page.evaluate(async step=>{
  const path='/src/domain/model.ts';const {blankDraft}=await import(path);const d=blankDraft();d.step=step===9?'tag-details':'personalization';d.customer={name:'Ana',phone:'+1 555 123 4567'};
  Object.assign(d.current,{size_code:'M',width_cm:2.5,pet_name:'Lola',tag_phone:d.customer.phone,tagShape:'circle',tagSize:'small',tagWidthCm:2.5,tagHeightCm:2.5});
  sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));
 },step);await page.reload();await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.editorial-carousel>img.active')).toBeVisible();
 await page.locator('.editorial-carousel>img.active').evaluate(async image=>{const img=image as HTMLImageElement;if(!img.complete)await img.decode();});
}
type Audit={stop:()=>{frames:string[];connected:boolean}};
async function startAudit(page:Page){await page.evaluate(()=>{
 const hero=document.querySelector('.story')!,images=[...hero.querySelectorAll('img')];const active=hero.querySelector('img.active')!;
 const frames:string[]=[];let running=true;
 const tick=()=>{if(!running)return;const r=hero.getBoundingClientRect();const css=getComputedStyle(active);frames.push(JSON.stringify([r.x,r.y,r.width,r.height,css.objectFit,css.objectPosition,css.opacity,(active as HTMLImageElement).currentSrc,window.scrollY,images.every(i=>i.isConnected&&hero.contains(i))]));requestAnimationFrame(tick);};tick();
 (window as unknown as {heroAudit:Audit}).heroAudit={stop:()=>{running=false;return {frames,connected:hero.isConnected&&images.every(i=>i.isConnected)};}};
});}
async function stopAudit(page:Page){const result=await page.evaluate(()=>(window as unknown as {heroAudit:Audit}).heroAudit.stop());expect(result.connected).toBe(true);expect(result.frames.length).toBeGreaterThan(1);expect(new Set(result.frames).size).toBe(1);}
async function samePixels(page:Page,before:Buffer){const after=await page.locator('.story').screenshot();if(!after.equals(before)){await mkdir('artifacts/block-b',{recursive:true});await writeFile('artifacts/block-b/hero-before.png',before);await writeFile('artifacts/block-b/hero-after.png',after);await writeFile('artifacts/block-b/hero-frames.json',JSON.stringify(await page.evaluate(()=>(window as unknown as {heroAudit:Audit}).heroAudit.stop()),null,2));}const delta=after.equals(before)?{maximum:0,changed:0}:await page.evaluate(async({before,after})=>{const decode=async(data:string)=>{const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0)),image=await createImageBitmap(new Blob([bytes],{type:'image/png'})),canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data;};const a=await decode(before),b=await decode(after);let maximum=0,changed=0;for(let i=0;i<a.length;i+=4){let different=false;for(let c=0;c<3;c++){const d=Math.abs(a[i+c]-b[i+c]);maximum=Math.max(maximum,d);different ||=d>0;}if(different)changed++;}return {maximum,changed};},{before:before.toString('base64'),after:after.toString('base64')});expect(delta.maximum).toBeLessThanOrEqual(1);expect(delta.changed).toBeLessThanOrEqual(10);}

for(const [name,width,height] of [['desktop',1440,900],['short-desktop',1366,768],['portrait-tablet',834,1194],['landscape-tablet',1194,834]] as const){
 test(`${name}: hero is pixel-stable through Address, accordions and upload error`,async({page})=>{
  await page.setViewportSize({width,height});await seed(page,9);const hero=page.locator('.story');const before=await hero.screenshot();await startAudit(page);
  await page.getByRole('button',{name:'Address',exact:true}).click();await expect(page.getByRole('textbox',{name:'Address',exact:true})).toBeVisible();
  await samePixels(page,before);await page.getByRole('button',{name:'Address',exact:true}).click();
  await samePixels(page,before);await stopAudit(page);
  await seed(page,11);const initial=await hero.screenshot();await startAudit(page);
  const toggle=(name:string)=>page.locator('.personality-toggle').filter({hasText:name});
  for(const name of ['Decoration','Drawing','Photo']){
   await toggle(name).click();await expect(toggle(name)).toHaveAttribute('aria-expanded','true');await samePixels(page,initial);
   await toggle(name).click();await expect(toggle(name)).toHaveAttribute('aria-expanded','false');await samePixels(page,initial);
  }
  await toggle('Photo').click();await page.locator('#personality-dog_photo input[type=file]').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});
  await expect(page.getByRole('alert')).toBeVisible();await samePixels(page,initial);await stopAudit(page);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  await expect(page.locator('.configurator-area')).toHaveCSS('overflow-y','auto');
 });
}

test('upload error disclosure closes smoothly, keeps its trigger focused, and honors reduced motion',async({page})=>{
 await page.setViewportSize({width:1194,height:834});await seed(page,11);
 const toggle=page.locator('.personality-toggle').filter({hasText:'Photo'});
 await toggle.click();await page.locator('#personality-dog_photo input[type=file]').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});
 const disclosure=page.locator('#personality-dog_photo');
 await expect(disclosure).toHaveAttribute('data-open','true');await expect(page.getByRole('alert')).toBeVisible();
 const transition=await page.evaluate(async()=>{
  const panel=document.querySelector<HTMLElement>('#personality-dog_photo')!;
  document.querySelector<HTMLButtonElement>('#personality-toggle-dog_photo')!.click();
  await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  const heightTransition=panel.getAnimations().find(animation=>(animation as CSSTransition).transitionProperty==='height');
  if(!heightTransition)return {animated:false,samples:[] as number[]};
  const samples:number[]=[];let running=true;const record=()=>{samples.push(panel.getBoundingClientRect().height);if(running)requestAnimationFrame(record);};requestAnimationFrame(record);
  await heightTransition.finished;running=false;samples.push(panel.getBoundingClientRect().height);
  return {animated:true,samples};
 });
 expect(transition.animated).toBe(true);expect(transition.samples.length).toBeGreaterThan(2);expect(Math.max(...transition.samples)).toBeGreaterThan(0);expect(new Set(transition.samples).size).toBeGreaterThan(1);
 await expect(toggle).toBeFocused();await expect(disclosure).toHaveAttribute('data-open','false');await expect(disclosure).toHaveCSS('height','0px');

 await page.emulateMedia({reducedMotion:'reduce'});await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');await toggle.click();
 await expect(toggle).toHaveAttribute('aria-expanded','false');await expect(disclosure).toHaveAttribute('data-open','false');
 await expect(disclosure).toHaveCSS('transition-duration','0s');
});
