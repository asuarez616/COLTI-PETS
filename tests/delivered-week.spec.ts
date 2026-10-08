import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('weekly summary caps six cards, preserves layout and opens all delivered history',async({page})=>{
 let body=await readFile('tests/fixtures/admin-backend.js','utf8');
 body=body.replace("status:'new'","status:'delivered'").replace('?[data.order]:[]','?Array.from({length:9},(_,n)=>({...data.order,id:"delivered-"+n,order_code:"DELIVERED-"+n})):[]');
 body=body.replace("const orders=data.order.status==='delivered'&&data.order.delivered_at?await repo.list(search,'delivered',0,dates):[];","const orders=await repo.list(search,'delivered',0,dates);");
 await page.route('**/src/data/adminBackend.ts*',r=>r.fulfill({contentType:'text/javascript',body}));await page.setViewportSize({width:1440,height:1100});await page.goto('/admin/orders');
 const lane=page.locator('.admin-delivered-section');await expect(lane.getByRole('heading',{name:'Delivered this week'})).toBeVisible();await expect(lane.locator('.admin-column-heading span')).toHaveText('9');await expect(lane.locator('.admin-ticket')).toHaveCount(6);
 const boxes=await lane.locator('.admin-ticket').evaluateAll(es=>es.map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y})));expect(boxes[2].y).toBe(boxes[0].y);expect(boxes[3].y).toBeGreaterThan(boxes[0].y);expect(boxes[3].x).toBe(boxes[0].x);
 for(const width of [834,390]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(lane.locator('.admin-ticket')).toHaveCount(6);}
 await page.setViewportSize({width:1440,height:1100});await page.screenshot({path:'artifacts/admin/delivered-week-six.png',fullPage:true});await lane.getByRole('button',{name:'View all delivered (9)'}).click();await expect(page.locator('.admin-history-grid .column-delivered .admin-ticket')).toHaveCount(9);await expect(page.locator('.admin-history-grid .column-cancelled')).toHaveCount(0);
 await page.getByRole('button',{name:'History',exact:true}).click();await expect(page.locator('.admin-history-grid .column-cancelled')).toHaveCount(1);
});
test('zero delivered keeps empty weekly lane without an empty-state message',async({page})=>{
 const body=await readFile('tests/fixtures/admin-backend.js','utf8');await page.route('**/src/data/adminBackend.ts*',r=>r.fulfill({contentType:'text/javascript',body}));await page.goto('/admin/orders');
 const lane=page.locator('.admin-delivered-section');await expect(lane.locator('.admin-column-heading span')).toHaveText('0');await expect(lane.locator('.admin-column-cards')).toBeEmpty();await expect(lane.getByRole('button')).toHaveCount(0);
});
