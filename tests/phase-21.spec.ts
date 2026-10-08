import {test,expect,type Page} from '@playwright/test';
import {translator} from '../src/i18n';
import {readFile,mkdir} from 'node:fs/promises';
const next=async(page:Page)=>page.locator('.flow-actions .primary').click();
test('Family contact supports two separate additional numbers with safe spacing',async({page})=>{
 await page.goto('/');await page.evaluate(async()=>{const path='/src/domain/model.ts';const {blankDraft}=await import(path);const d=blankDraft();d.step='tag-details';sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));});await page.reload();
 await page.getByRole('button',{name:'Family contact',exact:true}).click();await page.getByRole('button',{name:'Additional numbers',exact:true}).click();
 const phones=page.locator('.tag-extra-fields input[type=tel]');await expect(phones).toHaveCount(2);
 await phones.nth(0).fill('0984156889');await phones.nth(1).fill('0992826805');
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-draft-v1')!).current.tagExtras.phones)).toBe('0984156889\n0992826805');
 await page.reload();await expect(phones.nth(0)).toHaveValue('0984156889');await expect(phones.nth(1)).toHaveValue('0992826805');
 const choices=await page.locator('.tag-extra-fields .tag-extra-choices').boundingBox(),fields=await page.locator('.tag-extra-fields .contact-fields').boundingBox();expect(fields!.y-(choices!.y+choices!.height)).toBeGreaterThanOrEqual(17);
 await page.getByRole('button',{name:'Name and number',exact:true}).click();await expect(page.locator('.tag-extra-fields input[type=tel]')).toHaveCount(1);
});
for(const locale of ['en','es'] as const)test('actual Drive complete flow, edit/remove/add, fonts, exports and Production '+locale,async({page})=>{
 test.setTimeout(60000);await page.setViewportSize({width:390,height:844});await page.goto('/');
 const t=translator(locale);if(locale==='es')await page.getByRole('button',{name:'Cambiar a español'}).click();
 await page.getByRole('textbox').fill('Auditoría Fase 21');await next(page);await page.getByRole('textbox').fill('+593998888888');await next(page);
 async function collar(name:string,tag:'anti_fall'|'hanging'){
  await page.getByRole('button',{name:/^M 32/}).click();await next(page);
  await expect(page.locator('.tabs')).toBeVisible();await page.locator('.design-meta button').first().click();await next(page);await next(page);
  await page.getByRole('button',{name:t(tag),exact:true}).click();await next(page);
  if(tag==='hanging'){await page.getByRole('button',{name:locale==='es'?'Huella':'Paw',exact:true}).click();await page.locator('.tag-size-option').first().click();await next(page);}
  await page.getByRole('textbox').fill(name);await next(page);await next(page);await next(page);
  await page.locator('.lettering-view-all').click();await page.getByRole('dialog').getByRole('button',{name:(locale==='es'?'Fuente':'Font')+' 17',exact:true}).click();await page.locator('.lettering-bar .primary').click();await next(page);
  await page.locator('#personality-toggle-decoration').click();await page.getByRole('button',{name:locale==='es'?'Corazón':'Heart',exact:true}).click();
  await expect.poll(()=>page.locator('.tag-face-name .fitted-lettering').evaluate(e=>getComputedStyle(e).fontFamily)).toContain('colti-font-17-');
  await next(page);await expect(page.locator('.collar-review')).toBeVisible();await page.getByRole('button',{name:t('save')+' →',exact:true}).click();
 }
 await collar('Mona','anti_fall');await expect(page.locator('.collar-collapse-toggle')).toHaveCount(1);
 await page.getByRole('button',{name:'＋ '+t('add'),exact:true}).click();await collar('Luna Sol','hanging');await expect(page.locator('.collar-collapse-toggle')).toHaveCount(2);
 await page.getByRole('button',{name:t('remove')+': collar 2',exact:true}).click();await expect(page.locator('.collar-collapse-toggle')).toHaveCount(1);
 await page.getByRole('button',{name:t('edit')+': collar 1',exact:true}).click();
 // Follow the semantic engine, keeping every approved step and selection intact.
 for(let i=0;i<15&&!(await page.getByRole('button',{name:t('save')+' →',exact:true}).count());i++)await next(page);
 await page.getByRole('button',{name:t('save')+' →',exact:true}).click();
 await page.getByRole('button',{name:t('demoConfirm'),exact:true}).dblclick();await expect(page.getByRole('heading',{name:'DEMO-COLTI-US-0001'})).toBeVisible();
 for(const format of ['PDF','JPG']){const pending=page.waitForEvent('download',{predicate:d=>d.suggestedFilename().endsWith('.'+format.toLowerCase())});await page.getByRole('button',{name:t('download')+' '+format+' ↓',exact:true}).click();const download=await pending;await mkdir('artifacts/phase-21',{recursive:true});await download.saveAs(`artifacts/phase-21/${locale}.${format.toLowerCase()}`);const bytes=await readFile(`artifacts/phase-21/${locale}.${format.toLowerCase()}`);expect(format==='PDF'?bytes.subarray(0,5).toString():bytes.subarray(0,3).toString('hex')).toBe(format==='PDF'?'%PDF-':'ffd8ff');}
 await page.reload();await expect(page.getByRole('heading',{name:'DEMO-COLTI-US-0001'})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-demo-orders-v1')!).length)).toBe(1);
 await page.goto('/#/production');await page.locator('summary').click();await expect(page.locator('.panel .downloads')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Drive image failure offers retry, keeps design selectable and recovers',async({page})=>{
 await page.route('**/catalog/drive/*',r=>r.abort());await page.goto('/');
 await page.evaluate(async()=>{const model='/src/domain/model.ts';const {blankDraft}=await import(model);const d=blankDraft();d.step='design';Object.assign(d.current,{size_code:'M',width_cm:2.5});sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));});await page.reload();
 const card=page.locator('.design-card').first();await expect(card.getByRole('button',{name:'↻ Retry / Reintentar'})).toBeVisible();await card.locator('.design-meta button').click();
 await expect(card.locator('.design-meta button')).toHaveAttribute('aria-pressed','true');await page.unroute('**/catalog/drive/*');await card.getByRole('button',{name:'↻ Retry / Reintentar'}).click();
 await expect.poll(()=>card.locator('img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
});
