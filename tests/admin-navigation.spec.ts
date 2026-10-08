import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('admin section links preserve the document and empty lanes stay quiet',async({page})=>{
 const body=(await readFile('tests/fixtures/admin-backend.js','utf8')).replace('?[data.order]:[]','?[]:[]');
 await page.route('**/src/data/adminBackend.ts*',r=>r.fulfill({contentType:'text/javascript',body}));
 let documents=0;page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())documents++;});
 await page.goto('/admin/orders');await expect(page.getByRole('region',{name:'Delivered orders',exact:true})).toBeVisible();
 await expect(page.getByText('No orders yet.',{exact:true})).toHaveCount(0);await expect(page.getByText('No orders in this section.',{exact:true})).toHaveCount(0);
 for(const [link,title] of [['CATALOG','Catalog'],['HERO','Hero images'],['ORDERS','Orders']]){await page.getByRole('link',{name:link,exact:true}).click();await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();}
 expect(documents).toBe(1);await page.goBack();await expect(page.getByRole('heading',{name:'Hero images',exact:true})).toBeVisible();await page.goForward();await expect(page.getByRole('heading',{name:'Orders',exact:true})).toBeVisible();
 await expect(page.getByText('MADE PERSONAL. READY TO MAKE.',{exact:true})).toHaveCount(0);
 await expect(page.locator('.admin-inline-note')).toHaveCount(0);
 const sync=page.locator('.admin-toolbar .admin-orders-sync');await expect(sync.getByRole('status')).toHaveText('Up to date');await expect(sync.getByRole('button',{name:'Refresh orders'})).toBeVisible();
 await page.screenshot({path:'artifacts/admin/quiet-empty-lanes.png',fullPage:true});
});
