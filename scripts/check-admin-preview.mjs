import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome'});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4174/admin/orders');await page.getByRole('heading',{name:'Orders',exact:true}).waitFor();await page.getByRole('link',{name:'DEMO-COLTI-US-0015',exact:true}).waitFor();await page.getByText('Panel local',{exact:false}).waitFor();
 await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'artifacts/admin/preview-orders.png'});
 await page.getByRole('link',{name:'CATALOG',exact:true}).click();await page.locator('.admin-catalog article').first().waitFor();assert.ok(await page.locator('.admin-catalog article').count()>2);
 await page.screenshot({path:'artifacts/admin/preview-catalog.png'});
 await page.getByRole('link',{name:'HERO',exact:true}).click();await page.locator('.admin-hero article').first().waitFor();assert.equal(await page.locator('.admin-hero article').count(),8);
 await page.screenshot({path:'artifacts/admin/preview-hero.png'});
 assert.deepEqual(errors,[]);console.log('PASS: local Admin preview — Orders, synced Catalog, Hero, local orders banner, no page errors.');
}finally{await browser.close();}
