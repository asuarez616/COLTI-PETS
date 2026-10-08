import {mkdir} from 'node:fs/promises';
import {test,expect} from './fixture-catalog';
for(const width of [1440,390])test('engraving examples appear only inside opened accordions '+width,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/');await page.evaluate(async()=>{const path='/src/domain/model.ts';const {blankDraft}=await import(path);const d=blankDraft();d.step='personalization';d.current.pet_name='Lola';d.current.font_number=9;sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));});await page.reload();await expect(page.locator('.engraving-example')).toHaveCount(0);
 for(const type of ['drawing','dog_photo']){const header=page.locator('#personality-toggle-'+type);await header.click();const example=page.locator('.engraving-example').filter({has:page.locator('img[src$="'+(type==='drawing'?'drawing':'photo')+'.svg"]')});await expect(example).toBeVisible();await expect(example.locator('figcaption')).toHaveText('Engraving example');await expect.poll(()=>example.locator('img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);await expect(example.locator('input')).toHaveCount(0);await mkdir('artifacts/engraving-examples',{recursive:true});await page.locator('#personality-toggle-'+type).locator('..').screenshot({path:'artifacts/engraving-examples/'+type+'-'+width+'.png'});await header.click();await expect(example).not.toBeVisible();}expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const type of ['drawing','dog_photo'])test('clears upload status after No personalization '+type,async({page})=>{
 await page.goto('/');await page.evaluate(async()=>{const path='/src/domain/model.ts';const {blankDraft}=await import(path);const d=blankDraft();d.step='personalization';sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));});await page.reload();
 const panel=page.locator('#personality-'+type);await page.locator('#personality-toggle-'+type).click();
 await panel.locator('input[type=file]').setInputFiles('reference-assets/CH-17-1.png');await expect(panel.getByText('✓ Image uploaded',{exact:true})).toBeVisible();await expect(panel.locator('.attachment-thumbnail')).toBeVisible();await expect(panel.locator('input[type=file]')).toHaveCount(0);
 await page.locator('#personality-toggle-none').click();await page.locator('#personality-toggle-'+type).click();
 await expect(panel.getByText('✓ Image uploaded',{exact:true})).not.toBeVisible();await expect(panel.locator('.file-row')).toHaveCount(0);await expect(panel.locator('.engraving-example')).toBeVisible();
});

test('switching uploaded media collapses the other accordion, preserving Decoration',async({page})=>{
 await page.goto('/');await page.evaluate(async()=>{const path='/src/domain/model.ts';const {blankDraft}=await import(path);const d=blankDraft();d.step='personalization';sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));});await page.reload();
 await page.locator('#personality-toggle-decoration').click();
 for(const type of ['drawing','dog_photo','drawing']){
  const header=page.locator('#personality-toggle-'+type);await header.click();await page.locator('#personality-'+type+' input[type=file]').setInputFiles('reference-assets/CH-17-1.png');
  await expect(page.locator('#personality-'+type).getByText('✓ Image uploaded',{exact:true})).toBeVisible();
  await expect(header).toHaveAttribute('aria-expanded','true');await expect(page.locator('#personality-toggle-'+(type==='drawing'?'dog_photo':'drawing'))).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#personality-toggle-decoration')).toHaveAttribute('aria-expanded','true');
 }
});
