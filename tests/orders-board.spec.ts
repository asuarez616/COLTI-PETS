import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('history wraps four cards per desktop row',async({page})=>{
 const body=(await readFile('tests/fixtures/admin-backend.js','utf8')).replace("status:'new'","status:'delivered'").replace('?[data.order]:[]','?Array.from({length:9},(_,n)=>({...data.order,id:"history-"+n,order_code:"HISTORY-"+n})):[]');await page.route('**/src/data/adminBackend.ts*',r=>r.fulfill({contentType:'text/javascript',body}));await page.setViewportSize({width:1440,height:900});await page.goto('/admin/orders');await page.getByRole('button',{name:'History',exact:true}).click();const cards=page.locator('.column-delivered .admin-ticket');await expect(cards).toHaveCount(9);const boxes=await cards.evaluateAll(es=>es.map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y})));expect(boxes[3].y).toBe(boxes[0].y);expect(boxes[4].y).toBeGreaterThan(boxes[0].y);expect(boxes[4].x).toBe(boxes[0].x);for(const width of [834,390]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test('many new orders scroll inside their production lane and keep history separate',async({page})=>{
 const body=(await readFile('tests/fixtures/admin-backend.js','utf8')).replace('?[data.order]:[]','?Array.from({length:16},(_,n)=>({...data.order,id:"order-"+n,order_code:"COLTI-"+n})):[]');
 await page.route('**/src/data/adminBackend.ts*',r=>r.fulfill({contentType:'text/javascript',body}));await page.goto('/admin/orders');await expect(page.locator('.column-new .admin-ticket')).toHaveCount(16);
 for(const width of [1440,834,390]){await page.setViewportSize({width,height:900});const lane=page.locator('.admin-lanes .column-new');expect(await lane.evaluate(e=>e.getBoundingClientRect().height)).toBeLessThanOrEqual(460);const cards=lane.locator('.admin-column-cards');expect(await cards.evaluate(e=>e.scrollHeight>e.clientHeight)).toBe(true);await cards.evaluate(e=>{e.scrollTop=150;});expect(await cards.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await expect(page.locator('.admin-delivered-section')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test.beforeEach(async({page})=>{const body=await readFile('tests/fixtures/admin-backend.js','utf8');await page.route('**/src/data/adminBackend.ts*',r=>r.fulfill({contentType:'text/javascript',body}));await page.goto('/admin/orders');});
test('dates, list transitions, terminal history and responsive list',async({page})=>{
 const code=page.getByText('COLTI-US-0024',{exact:true});await expect(code).toBeVisible();
 await page.getByLabel('From date').fill('2026-10-04');await expect(code).toHaveCount(0);
 await page.getByLabel('To date').fill('2026-10-03');await expect(page.getByRole('alert')).toContainText('end date');
 await page.getByRole('button',{name:'Clear filters'}).click();await expect(code).toBeVisible();
 await page.getByLabel('From date').fill('2026-10-03');await page.getByLabel('To date').fill('2026-10-03');await expect(code).toBeVisible();
 await page.locator('.admin-ticket').dragTo(page.getByRole('region',{name:'In progress orders',exact:true}));await expect(page.getByRole('region',{name:'In progress orders',exact:true}).locator('.admin-ticket')).toHaveCount(1);await page.getByRole('button',{name:'New',exact:true}).click();await expect(code).toHaveCount(0);await page.getByRole('button',{name:'In progress',exact:true}).click();await expect(code).toBeVisible();
 await page.reload();await page.getByLabel('Move COLTI-US-0024').selectOption('ready');await expect(page.locator('.admin-ticket')).toHaveCount(1);
 await page.getByRole('button',{name:'All',exact:true}).click();await page.getByLabel('Move COLTI-US-0024').selectOption('delivered');await page.getByRole('button',{name:'History'}).click();await expect(code).toBeVisible();await expect(page.getByLabel('Move COLTI-US-0024')).toHaveCount(0);
 for(const width of [1440,834,390]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`artifacts/admin/history-${width}.png`,fullPage:true});}
});
test('optional cancellation reason persists and dismissal keeps order',async({page})=>{
 await page.getByLabel('Move COLTI-US-0024').selectOption('cancelled');await page.getByRole('button',{name:'Keep order'}).click();await expect(page.locator('.admin-ticket')).toHaveCount(1);
 await page.getByLabel('Move COLTI-US-0024').selectOption('cancelled');await page.getByLabel('Cancellation reason (optional)').fill('Customer requested cancellation');await page.getByRole('button',{name:'Confirm cancellation'}).click();await page.getByRole('button',{name:'History'}).click();await page.getByRole('button',{name:'Open order COLTI-US-0024'}).click();await page.getByRole('link',{name:'Open full page'}).click();await expect(page.getByText('Customer requested cancellation',{exact:true})).toBeVisible();await page.reload();await expect(page.getByText('Customer requested cancellation',{exact:true})).toBeVisible();
});
