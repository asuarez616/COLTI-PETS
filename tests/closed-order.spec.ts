import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
for(const status of ['cancelled','delivered'])test(`${status} order hides actions`,async({page})=>{
 const fixture=(await readFile('tests/fixtures/admin-backend.js','utf8')).replace("status:'new'",`status:'${status}'`);
 await page.route('**/src/data/adminBackend.ts*',route=>route.fulfill({contentType:'text/javascript',body:fixture}));
 await page.goto('/admin/orders/test-order');
 await expect(page.getByRole('heading',{name:'Customer',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Actions',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Print shipping label'})).toHaveCount(status==='delivered'?1:0);
});
