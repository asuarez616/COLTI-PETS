import {test,expect,type Page,type Locator} from './fixture-catalog';

async function seed(page:Page,step:number){await page.goto('/');await page.evaluate(async step=>{const path='/src/domain/model.ts';const {blankDraft}=await import(path);const d=blankDraft();d.step=step===9?'tag-details':'personalization';d.current.pet_name='Lola';d.current.tag_phone='+1 555 123 4567';d.current.tagShape='circle';sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));},step);await page.reload();}
type Motion={stop:()=>number[]};
async function watch(panel:Locator){await panel.evaluate(element=>{const heights:number[]=[];let running=true;const sample=()=>{if(!running)return;heights.push(element.getBoundingClientRect().height);requestAnimationFrame(sample);};sample();(window as unknown as {motion:Motion}).motion={stop:()=>{running=false;return heights;}};});}
async function sampled(page:Page){return page.evaluate(()=>(window as unknown as {motion:Motion}).motion.stop());}
async function settled(panel:Locator,open:boolean){await expect.poll(()=>panel.evaluate((e,open)=>{const actual=e.getBoundingClientRect().height,target=open?e.firstElementChild!.getBoundingClientRect().height:0;return Math.abs(actual-target)<.1;},open)).toBe(true);}

for(const width of [1440,834,390])test(`disclosure animates open and close, preserves focus and DOM at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await seed(page,11);const toggle=page.locator('#personality-toggle-decoration'),panel=page.locator('#personality-decoration');
 await watch(panel);await toggle.focus();await page.keyboard.press('Enter');await settled(panel,true);const opening=await sampled(page);
 expect(new Set(opening.map(h=>Math.round(h))).size).toBeGreaterThan(3);await expect(toggle).toBeFocused();
 const preview=await panel.locator('.tag-face-preview').count();expect(preview).toBeGreaterThan(0);
 await panel.evaluate(e=>{(window as unknown as {retained:Element}).retained=e.firstElementChild!;});
 await watch(panel);await page.keyboard.press('Enter');await settled(panel,false);const closing=await sampled(page);
 expect(new Set(closing.map(h=>Math.round(h))).size).toBeGreaterThan(3);await expect(toggle).toBeFocused();await expect(panel).toHaveAttribute('inert','');
 expect(await panel.evaluate(e=>e.firstElementChild===(window as unknown as {retained:Element}).retained)).toBe(true);
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-draft-v1')!).current.personalization_type)).toBe('decoration');
 await page.keyboard.press('Enter');await settled(panel,true);await page.getByRole('button',{name:'Heart',exact:true}).click();await expect(toggle).toHaveAttribute('aria-expanded','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('Address expands and closes smoothly; typing keeps focus; hidden input is inert',async({page})=>{
 await page.setViewportSize({width:390,height:844});await seed(page,9);const address=page.getByRole('button',{name:'Address',exact:true});await address.click();
 const input=page.getByRole('textbox',{name:'Address',exact:true}),panel=page.locator('.tag-extras>.reveal').first();await settled(panel,true);await input.fill('Miami, FL');await expect(input).toBeFocused();
 await watch(panel);await address.click();await settled(panel,false);expect(new Set((await sampled(page)).map(h=>Math.round(h))).size).toBeGreaterThan(3);await expect(panel).toHaveAttribute('inert','');
 await address.click();await settled(panel,true);await expect(input).toHaveValue('Miami, FL');
});

test('reduced motion removes disclosure transitions without changing selection',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await seed(page,11);const toggle=page.locator('#personality-toggle-decoration'),panel=page.locator('#personality-decoration');
 await toggle.click();await settled(panel,true);await expect(panel).toHaveCSS('transition-duration','0s');await toggle.click();await settled(panel,false);await expect(panel).toHaveAttribute('aria-hidden','true');
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-draft-v1')!).current.personalization_type)).toBe('decoration');
});

test('open panels resize smoothly for upload feedback and errors',async({page})=>{
 await page.setViewportSize({width:834,height:1194});await seed(page,11);
 const photo=page.locator('#personality-dog_photo');await page.locator('#personality-toggle-dog_photo').click();await settled(photo,true);
 await watch(photo);await photo.locator('input[type=file]').setInputFiles('reference-assets/CH-17-1.png');await expect(photo.getByText('✓ Image uploaded',{exact:true})).toBeVisible();await settled(photo,true);
 expect(new Set((await sampled(page)).map(h=>Math.round(h))).size).toBeGreaterThan(3);
 await photo.locator('.file-row button').click();await photo.locator('input[type=file]').setInputFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('bad')});
 const alert=page.getByRole('alert'),error=page.locator('.reveal').filter({has:page.locator('.error')}).last();await expect(alert).toBeVisible();await settled(error,true);
 await watch(error);await page.locator('#personality-toggle-decoration').click();await settled(page.locator('#personality-decoration'),true);
 await page.getByRole('button',{name:'Heart',exact:true}).click();await settled(error,false);
 expect(new Set((await sampled(page)).map(h=>Math.round(h))).size).toBeGreaterThan(3);
 expect(await page.evaluate(()=>window.scrollY)).toBe(0);
});
