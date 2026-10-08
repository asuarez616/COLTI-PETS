import {test,expect,type Page} from './fixture-catalog';
import {readFile,writeFile} from 'node:fs/promises';
async function next(page:Page){await page.getByRole('button',{name:'Continue →',exact:true}).click();}
async function collar(page:Page,name:string,size='XS',printed=false){
 await page.getByRole('button',{name:new RegExp(`^${size} `)}).click();await next(page);
 if(size==='XS'){await page.getByRole('button',{name:'1.5 cm',exact:false}).click();await next(page);}
 if(printed)await page.getByRole('tab',{name:'PRINTED'}).click();
 await page.getByRole('button',{name:'Select this design',exact:true}).click();await next(page);await next(page);await page.getByRole('button',{name:'Anti-fall',exact:true}).click();await next(page);
 await page.getByRole('textbox',{name:'What’s your dog’s name?'}).fill(name);await next(page);await next(page);await next(page);
 await page.getByRole('button',{name:'View all lettering styles →'}).click();await page.getByRole('dialog').getByRole('button',{name:'Font 36',exact:true}).click();await page.getByRole('button',{name:'Use this style',exact:true}).click();await next(page);await next(page);
 await expect(page.getByRole('heading',{name:'Looking good. Check this collar.'})).toBeVisible();
 await page.getByRole('button',{name:'Add to my order →'}).click();
}
test('two collars, edit, upload, one confirmation and exports at mobile width',async({page})=>{
 await page.setViewportSize({width:360,height:800});await page.goto('/');
 await expect(page.getByRole('textbox',{name:'First, what’s your name?'})).toBeVisible();
 await page.getByRole('textbox',{name:'First, what’s your name?'}).fill('Ana García');await next(page);
 await page.getByRole('textbox',{name:'What’s your phone number?'}).fill('+593 99 123 4567');await next(page);
 await collar(page,'Luna');
 await page.getByRole('button',{name:'＋ Add another collar'}).click();await collar(page,'Sol','M',true);
 await page.getByRole('button',{name:'Edit: collar 1',exact:true}).first().click();
 for(let i=0;i<9;i++)await next(page); // size → personalization
 await page.locator('.personality-toggle').filter({hasText:'Photo'}).click();
 await page.locator('.personality-notes textarea:visible').fill('Foto de Luna, sin cambiar su nombre.');
 await page.locator('input[type=file]').setInputFiles('reference-assets/CH-17-1.png');
 await expect(page.getByText('✓ Image uploaded',{exact:true})).toBeVisible();await next(page);
 await page.getByRole('button',{name:'Add to my order →'}).click();
 await expect(page.locator('.collar-collapse-toggle')).toHaveCount(2);
 const confirm=page.getByRole('button',{name:'Save order'});await confirm.dblclick();
 await expect(page.getByRole('heading',{name:'DEMO-COLTI-US-0001'})).toBeVisible();
 const pdf=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF ↓'}).click();const pdfFile=await pdf;await pdfFile.saveAs('artifacts/demo-order.pdf');expect(pdfFile.suggestedFilename()).toBe('DEMO-COLTI-US-0001.pdf');
 const jpg=page.waitForEvent('download');await page.getByRole('button',{name:'Download JPG ↓'}).click();await (await jpg).saveAs('artifacts/demo-order-01.jpg');
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('colti-demo-orders-v1')||'[]').length)).toBe(1);
 await page.screenshot({path:'artifacts/mobile-order.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('validation, draft recovery, font placeholders, size guide and static production route',async({page})=>{
 await page.setViewportSize({width:320,height:760});await page.goto('/');await next(page);await expect(page.getByRole('alert')).toBeVisible();
 await page.getByRole('textbox').fill('Test');await next(page);await page.getByRole('textbox').fill('123');await next(page);await expect(page.getByRole('alert')).toHaveText(/valid phone/);
 await page.getByRole('textbox').fill('+1 555 123 4567');await next(page);await page.reload();await expect(page.getByRole('heading',{name:'What size does your dog wear?'})).toBeVisible();
 await page.getByRole('button',{name:'View size guide'}).click();await expect(page.getByRole('cell',{name:'>46',exact:true})).toBeVisible();await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'artifacts/mobile-size.png',fullPage:true});await page.goto('/#/production');await page.reload();await expect(page.getByRole('heading',{name:'Owner sign in'})).toBeVisible();await expect(page.getByText('Connect Supabase to record real orders.')).toBeVisible();
});
test('desktop visual',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.screenshot({path:'artifacts/desktop-start.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('catalogue data controls empty states and image retry',async({page})=>{
 await page.route('**/catalog/CH-17-1*',route=>route.abort());
 await page.goto('/');await page.getByRole('textbox').fill('Test');await next(page);await page.getByRole('textbox').fill('+1 555 123 4567');await next(page);
 await page.getByRole('button',{name:/^M /}).click();await next(page);await next(page);
 await page.evaluate(async()=>{const path='/src/data/fixtures.ts';const {fixtureDesigns}=await import(path);fixtureDesigns[1].compatibility=[];window.dispatchEvent(new Event('focus'));});
 await page.getByRole('tab',{name:'PRINTED'}).click();await expect(page.getByText('No designs for this size and width.')).toBeVisible();
 await page.getByRole('tab',{name:'WOVEN'}).click();
 // A failed image can still be retried, without changing catalogue compatibility.
 await page.getByRole('button',{name:'View CH-17-1'}).click();await expect(page.getByRole('dialog').getByRole('button',{name:'↻ Retry / Reintentar'})).toBeVisible();
 await page.unroute('**/catalog/CH-17-1*');await page.getByRole('dialog').getByRole('button',{name:'↻ Retry / Reintentar'}).click();await expect(page.getByRole('dialog').getByRole('img')).toBeVisible();
});
test('long multi-page exports and a real test-only font loader',async({page})=>{
 await page.goto('/');
 const font=await readFile('C:/Windows/Fonts/arial.ttf');
 await page.route('**/__test/font.ttf',route=>route.fulfill({body:font,contentType:'font/ttf'}));
 const loaded=await page.evaluate(async()=>{const path='/src/catalog/fonts.ts';const {loadFont}=await import(path);return loadFont({number:0,state:'ready',asset_path:location.origin+'/__test/font.ttf',label:'System font — test only, not reference 1–36',css_family:'test',active:true,asset_version:'test-only'});});expect(loaded).toBe('colti-font-0-test-only');
 const result=await page.evaluate(async()=>{
  const fixturePath='/src/data/fixtures.ts',exportPath='/src/exports/documents.ts';const {fixtureDesigns,fixtureFonts}=await import(fixturePath);const {renderPages}=await import(exportPath);
  const order={id:'test',order_code:'DEMO-LONG-EXPORT',status:'new',confirmed_at:new Date().toISOString(),updated_at:new Date().toISOString(),demo:true,customer_snapshot:{name:'Nombre muy largo '.repeat(11),phone:'+593 99 123 4567'},items:Array.from({length:6},(_,n)=>({id:'i'+n,size_code:'M',width_cm:2.5,design_id:fixtureDesigns[0].id,collar_type:'martingale',tag_type:'anti_fall',pet_name:'NombreMascota'.repeat(12),tag_phone:'+593 99 123 4567',extra_text:'Texto extra con acentos: áéíóú. '.repeat(35),font_number:36,personalization_type:'decoration',personalization_notes:'Instrucciones para producción. '.repeat(35),attachments:[],design:fixtureDesigns[0],font:fixtureFonts[35]}))};
  const pages=await renderPages(order,'es');return {count:pages.length,images:pages.map((p:HTMLCanvasElement)=>p.toDataURL('image/png'))};
 });expect(result.count).toBeGreaterThan(2);
 await writeFile('artifacts/long-export-first.png',Buffer.from(result.images[0].split(',')[1],'base64'));await writeFile('artifacts/long-export-last.png',Buffer.from(result.images.at(-1)!.split(',')[1],'base64'));
});

