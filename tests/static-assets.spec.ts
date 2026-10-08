import {test,expect} from '@playwright/test';
test('optimized static build preserves all fonts, previews, snapshots and PDF/JPG',async({page})=>{
 const failed:string[]=[];page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))failed.push(r.url());});
 await page.goto('http://127.0.0.1:4177/');const next=()=>page.getByRole('button',{name:'Continue →',exact:true}).click();
 await page.getByRole('textbox').fill('Ana');await next();await page.getByRole('textbox').fill('+1 555 123 4567');await next();await page.getByRole('button',{name:/^M /}).click();await next();
 await page.locator('.design-card .image-button').first().click();await expect(page.getByRole('dialog').locator('img')).toHaveJSProperty('complete',true);await page.keyboard.press('Escape');await page.locator('.design-meta button').first().click();await next();await next();await page.getByRole('button',{name:'Anti-fall',exact:true}).click();await next();await page.getByRole('textbox').fill('Chaos');await next();await next();await next();
 await page.getByRole('button',{name:'View all lettering styles →'}).click();
 for(let n=1;n<=36;n++){const card=page.getByRole('dialog').getByRole('button',{name:'Font '+String(n).padStart(2,'0'),exact:true});await card.scrollIntoViewIfNeeded();await expect.poll(()=>card.evaluate(c=>[...c.querySelectorAll<HTMLElement>('[style]')].some(e=>e.style.fontFamily.includes('colti-font-')))).toBe(true);}
 await expect(page.getByText('Real font unavailable — neutral preview shown')).toHaveCount(0);await page.getByRole('button',{name:'Use this style'}).click();await next();await next();await page.getByRole('button',{name:'Add to my order →'}).click();await page.getByRole('button',{name:'Save order'}).click();await expect(page.getByRole('heading',{name:'DEMO-COLTI-US-0001'})).toBeVisible();
 for(const format of ['PDF','JPG']){const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download '+format+' ↓'}).click();expect((await download).suggestedFilename()).toContain('DEMO-COLTI-US-0001');}
 expect(failed).toEqual([]);
});
