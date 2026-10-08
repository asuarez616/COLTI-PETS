import {test,expect} from '@playwright/test';
test('private routes stay closed without configured owner Auth',async({page})=>{
 for(const route of ['/admin/orders','/admin/orders/unknown','/admin/catalog','/admin/hero','/admin/login']){
 await page.goto(route);await expect(page.getByText('Administrative access requires configured Supabase Auth',{exact:false})).toBeVisible();await expect(page.getByRole('navigation',{name:'Administration'})).toHaveCount(0);
 }
});
test('admin root redirects to orders',async({page})=>{await page.goto('/admin');await expect(page).toHaveURL(/\/admin\/orders$/);});
