import {test,expect,type Page} from '@playwright/test';

import {readFile} from 'node:fs/promises';

const browserProblems=new WeakMap<Page,string[]>();

test.beforeEach(async({page})=>{const problems:string[]=[];browserProblems.set(page,problems);page.on('pageerror',error=>problems.push(error.message));page.on('console',message=>{if(/React|Invalid hook|Warning:|uncontrolled|unique.*key/i.test(message.text())&&['warning','error'].includes(message.type()))problems.push(message.text());});});

test.afterEach(async({page})=>{expect(browserProblems.get(page)).toEqual([]);});

async function fixture(page:Page){const body=await readFile('tests/fixtures/admin-backend.js','utf8');await page.route('**/src/data/adminBackend.ts*',route=>route.fulfill({contentType:'text/javascript',body}));}

test('orders operations and exports use existing presentation',async({page})=>{

 await fixture(page);await page.goto('/admin/orders');await expect(page.getByText('COLTI-US-0024',{exact:true})).toBeVisible();await page.screenshot({path:'artifacts/admin/orders.png',fullPage:true});

 for(const query of ['colti-us','Ana','0984156889','Luna']){await page.getByLabel('Search orders').fill(query);await expect(page.getByText('COLTI-US-0024',{exact:true})).toBeVisible();}

 await page.getByLabel('Search orders').fill('missing');await expect(page.locator('.admin-ticket')).toHaveCount(0);await page.getByLabel('Search orders').fill('');await page.getByRole('button',{name:'Ready',exact:true}).click();await expect(page.locator('.admin-ticket')).toHaveCount(0);await page.getByRole('button',{name:'All',exact:true}).click();await page.getByRole('button',{name:'Open order COLTI-US-0024'}).click();await page.getByRole('link',{name:'Open full page'}).click();

 await expect(page.getByRole('heading',{name:'Customer',exact:true})).toBeVisible();await expect(page.locator('.admin-collar')).toHaveCount(2);await expect(page.getByText('Decoration',{exact:true})).toHaveCount(0);

 await page.getByLabel('Internal note').fill('PRIVATE internal instruction');await page.getByRole('button',{name:'Save note'}).click();await expect(page.getByText('Note saved',{exact:true})).toBeVisible();await page.reload();await expect(page.getByLabel('Internal note')).toHaveValue('PRIVATE internal instruction');

 await page.getByRole('button',{name:'Move to In progress'}).click();await expect(page.getByRole('button',{name:'Move to Ready'})).toBeVisible();await page.evaluate(()=>document.fonts.ready);await expect(page.getByText('Real font unavailable',{exact:false})).toHaveCount(0);await page.screenshot({path:'artifacts/admin/order-detail.png',fullPage:true});

 await page.evaluate(()=>{const original=CanvasRenderingContext2D.prototype.fillText;const texts:string[]=[];(window as unknown as {exportTexts:string[]}).exportTexts=texts;CanvasRenderingContext2D.prototype.fillText=function(text:string,x:number,y:number,maxWidth?:number){texts.push(text);if(maxWidth===undefined)original.call(this,text,x,y);else original.call(this,text,x,y,maxWidth);};});

 for(const format of ['PDF','JPG']){const download=page.waitForEvent('download');await page.getByRole('button',{name:new RegExp('Download '+format)}).click();const file=await download;expect(file.suggestedFilename()).toContain(format.toLowerCase());await file.saveAs('artifacts/admin/order.'+format.toLowerCase());}

 expect(await page.evaluate(()=>(window as unknown as {exportTexts:string[]}).exportTexts.some(t=>t.includes('PRIVATE')))).toBe(false);

 await page.getByRole('button',{name:'Cancel order'}).click();await page.getByRole('button',{name:'Confirm cancellation'}).click();await expect(page.getByText('Cancelled',{exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:'Cancel order'})).toHaveCount(0);

});

test('catalog hierarchical size and width controls preserve saved preferences',async({page})=>{

 await fixture(page);await page.route('**/api/admin/drive/status',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({configured:true,connected:true,lastSync:{catalog:'2026-10-05T19:24:00Z',hero:null}})}));await page.goto('/admin/catalog');

 await expect(page.locator('.admin-design-card')).toHaveCount(3);
 await expect(page.locator('.admin-catalog-results')).toHaveCount(0);await expect(page.getByRole('button',{name:'Refresh catalog'})).toHaveCount(0);
 const aligned=await page.locator('.admin-catalog-groupbar').evaluate(el=>{const chips=el.querySelector('.admin-catalog-groups-nav')!.getBoundingClientRect(),bulk=el.querySelector('summary')!.getBoundingClientRect();return Math.abs((chips.top+chips.bottom)/2-(bulk.top+bulk.bottom)/2)<2;});expect(aligned).toBe(true);

 await page.getByRole('button',{name:/^Miniatura/}).click();

 await expect(page.locator('.admin-design-card')).toHaveCount(1);

 await expect(page.locator('.admin-design-sizes')).toHaveCount(0);
 await expect(page.getByLabel('Whole design · CH-17-1')).toHaveCount(0);
 await page.getByRole('button',{name:'Configure CH-17-1',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Design configuration',exact:true})).toBeVisible();

 await expect(page.getByLabel('XS · 1.5 cm · CH-17-1',{exact:true})).toBeVisible();

 await expect(page.getByLabel('M · 3 cm · CH-17-1',{exact:true})).toHaveCount(0);

 await page.getByLabel('XS · 1.5 cm · CH-17-1',{exact:true}).uncheck();

 await expect(page.getByLabel('S · 1.5 cm · CH-17-1',{exact:true})).toBeChecked();

 await page.getByLabel('Size XS · CH-17-1',{exact:true}).uncheck();

 await expect(page.getByLabel('XS · 1 cm · CH-17-1',{exact:true})).toBeDisabled();

 await page.reload();await page.getByRole('button',{name:/^Miniatura/}).click();await page.getByRole('button',{name:'Configure CH-17-1',exact:true}).click();

 await expect(page.getByLabel('Size XS · CH-17-1',{exact:true})).not.toBeChecked();

 await page.getByLabel('Size XS · CH-17-1',{exact:true}).check();

 await expect(page.getByLabel('XS · 1.5 cm · CH-17-1',{exact:true})).not.toBeChecked();

 await page.getByLabel('Whole design · CH-17-1').uncheck();

 await expect(page.getByLabel('Size XS · CH-17-1',{exact:true})).toBeDisabled();

 await page.getByLabel('Whole design · CH-17-1').check();

 await expect(page.getByLabel('XS · 1.5 cm · CH-17-1',{exact:true})).not.toBeChecked();

 await page.getByRole('button',{name:'Close design configuration'}).click();await expect(page.getByRole('dialog',{name:'Design configuration'})).not.toBeVisible();
 await page.getByLabel('Size',{exact:true}).selectOption('M');

 await expect(page.locator('.admin-design-card')).toHaveCount(1);

 await page.locator('.admin-design-card').screenshot({path:'artifacts/admin/catalog-hierarchy-card.png'});await page.screenshot({path:'artifacts/admin/catalog-hierarchy.png',fullPage:true});

 for(const width of [1440,834,390]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}

 await page.getByRole('button',{name:'Printed',exact:true}).click();

 await expect(page.getByRole('heading',{name:'TEST-PRINTED-02',exact:true})).toBeVisible();

 await page.getByRole('button',{name:'Configure TEST-PRINTED-02',exact:true}).click();await page.getByLabel('Move collection · TEST-PRINTED-02').selectOption('__new__');await page.getByRole('dialog',{name:'Nueva colección',exact:true}).getByRole('textbox').fill('Cartoons');await page.getByRole('button',{name:'Crear y mover'}).click();await expect(page.getByLabel('Move collection · TEST-PRINTED-02')).toHaveValue('Cartoons');await page.reload();await page.getByRole('button',{name:'Printed',exact:true}).click();await page.getByRole('button',{name:'Configure TEST-PRINTED-02',exact:true}).click();await expect(page.getByLabel('Move collection · TEST-PRINTED-02')).toHaveValue('Cartoons');

 await page.screenshot({path:'artifacts/admin/catalog-hierarchy-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('dialog',{name:'Design configuration'}).press('Escape');await expect(page.getByRole('dialog',{name:'Design configuration'})).not.toBeVisible();

});



test('hero activity and order persist',async({page})=>{await fixture(page);await page.goto('/admin/hero');await expect(page.locator('.admin-hero article')).toHaveCount(JSON.parse(await readFile('src/catalog/hero-drive.json','utf8')).length);await page.getByLabel('Activate 0.png',{exact:true}).uncheck();await page.getByRole('button',{name:'Move 2.png first',exact:true}).click();await page.getByRole('button',{name:'Save changes'}).click();await expect(page.getByText('Saved',{exact:true})).toBeVisible();await page.reload();await expect(page.locator('.admin-hero article').first().getByRole('heading')).toHaveText('2.png');await expect(page.getByRole('region',{name:'INACTIVE hero photos',exact:true}).getByRole('checkbox',{name:'Activate 0.png',exact:true})).not.toBeChecked();await page.screenshot({path:'artifacts/admin/hero.png',fullPage:true});});

test('missing product image and responsive Admin stay usable',async({page})=>{

 await fixture(page);await page.route('**/catalog/CH-17-1*',route=>route.abort());

 for(const width of [834,390]){await page.setViewportSize({width,height:900});for(const path of ['/admin/orders','/admin/orders/test-order','/admin/catalog','/admin/hero']){await page.goto(path);await expect(page.getByRole('navigation',{name:'Administration'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}

 await page.goto('/admin/orders/test-order');await expect(page.getByLabel('Internal note')).toBeVisible();await expect(page.locator('.image-failed')).toHaveCount(2);

});






test('uploads select catalog group or hero and keep hidden defaults clear',async({page})=>{
 await fixture(page);await page.goto('/admin/uploads');await expect(page.getByRole('heading',{name:'Upload images'})).toBeVisible();await page.getByLabel('Choose an image').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+afo0AAAAASUVORK5CYII=','base64')});await page.getByLabel('Design code').fill('NEW-50');await page.getByLabel('Size group').selectOption('miniature');await page.getByRole('button',{name:'Upload image',exact:true}).click();await expect(page.getByRole('status')).toContainText('NEW-50 uploaded');await page.getByRole('button',{name:'Hero photo',exact:true}).click();await expect(page.getByLabel('Design code')).toHaveCount(0);await page.getByRole('button',{name:'Upload image',exact:true}).click();await expect(page.getByRole('status')).toContainText('Photo uploaded');for(const width of [834,390]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}await page.screenshot({path:'artifacts/admin/uploads-mobile.png',fullPage:true});
});
