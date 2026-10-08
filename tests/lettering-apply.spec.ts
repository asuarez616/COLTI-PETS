import {test,expect} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
test('Apply updates lettering size immediately and footer has status chip',async({page})=>{
 await page.route('**/src/data/adminBackend.ts*',async route=>route.fulfill({contentType:'text/javascript',body:await readFile('tests/fixtures/admin-backend.js','utf8')}));
 await page.route('**/src/data/letteringBackend.ts*',route=>route.fulfill({contentType:'text/javascript',body:`import {fixtureFonts} from '/src/data/fixtures.ts'; export const lettering={load:async()=>({revision:0,fonts:fixtureFonts.map((f,i)=>({...f,id:f.id||'font-'+i,active:true,presentation:{size:42}}))}),save:async()=>{throw Error('Test must not save')}};`}));
 await page.goto('/admin/product-settings');
 await page.getByRole('tab',{name:'Lettering',exact:true}).click();
 const card=page.locator('.managed-lettering article').first();
 const preview=card.locator('.managed-font-preview');
 await expect(preview.locator('.lettering-fit-text')).toBeVisible();
 const text=preview.locator('.lettering-fit-text');
 const size=()=>text.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
 await expect.poll(size).toBeGreaterThan(30);
 const before=await size();
 await card.getByRole('button',{name:'Edit',exact:true}).click();
 await page.locator('#managed-letter-size').fill('60');
 await page.getByRole('button',{name:'Apply to draft'}).click();
 await expect.poll(size).toBeGreaterThan(before+10);
 await expect(card.locator('.managed-font-status.is-active')).toHaveText('Active');
 await expect(card.locator('footer')).toHaveCSS('border-top-style','solid');
 await expect(page.getByRole('button',{name:'Save changes',exact:true})).toBeEnabled();
 await mkdir('artifacts/admin',{recursive:true});
 await page.screenshot({path:'artifacts/admin/lettering-burgundy-status.png'});
 await page.getByRole('button',{name:'Discard changes'}).click();
 await expect.poll(size).toBe(before);
 await page.getByRole('button',{name:'Generate font catalog',exact:true}).click();
 await expect(page.getByText('Active styles:',{exact:false})).toHaveCount(0);
 await page.getByLabel('Preview name').fill('Toya');
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Generate JPG',exact:true}).click();
 expect((await download).suggestedFilename()).toBe('COLTI-Lettering-Styles-Toya.jpg');
 await expect(page.getByRole('dialog',{name:'Generate font catalog'})).toHaveCount(0);
});

test('Store respects saved lettering size and uppercase in quick choices and gallery',async({page})=>{
 await page.route('**/src/data/fixtures.ts*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+"\nfixtureFonts[0].presentation={size:26,transform:'uppercase'};"});});
 await page.goto('/');
 await page.evaluate(async()=>{const {blankDraft}=await import('/src/domain/model.ts');const draft=blankDraft();draft.step='lettering';draft.current.pet_name='Toya';draft.current.size_code='M';draft.current.width_cm=2.5;sessionStorage.setItem('colti-draft-v1',JSON.stringify(draft));});
 await page.reload();
 const sample=page.locator('.lettering-quick .lettering-card').first().locator('.lettering-fit-text');
 await expect(sample).toHaveText('TOYA');await expect(sample).toHaveCSS('font-size','26px');
 await page.getByRole('button',{name:'View all lettering styles →'}).click();
 const gallery=page.getByRole('dialog').getByRole('button',{name:'Font 01',exact:true}).locator('.lettering-fit-text');
 await expect(gallery).toHaveText('TOYA');await expect(gallery).toHaveCSS('font-size','26px');
});


