import {test,expect} from './fixture-catalog';
test('Spanish editorial and customer progress contain localized copy',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');await page.getByRole('button',{name:'Cambiar a español',exact:true}).click();
 await expect(page.locator('.editorial-eyebrow')).toHaveText('PEQUEÑOS DETALLES. GRAN PERSONALIDAD.');
 await expect(page.locator('.story-copy h2')).toContainText('Su día a día.');await expect(page.locator('.story-copy p')).toContainText('Un diseño que cuenta su historia.');
 await expect(page.getByText('HECHO PARA TU MEJOR AMIGO',{exact:true})).toBeVisible();
 await page.screenshot({path:'artifacts/translation-copy-desktop-es.png',fullPage:true});
});

