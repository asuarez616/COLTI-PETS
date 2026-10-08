import {test,expect,type Page} from './fixture-catalog';
import axe from 'axe-core';
import {mkdir,writeFile} from 'node:fs/promises';
async function next(page:Page){await page.getByRole('button',{name:'Continue →',exact:true}).click();}
async function check(page:Page,label:string,screenshot=false){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(screenshot){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>undefined)));});await mkdir('artifacts/block-e',{recursive:true});await page.screenshot({path:`artifacts/block-e/${label}.png`,fullPage:true});}
}
async function audit(page:Page,label:string){
 // Measure settled UI, rather than intermediate colours during the approved reveal fade.
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>undefined)));});
 await page.evaluate(axe.source);
 const result=await page.evaluate(async()=>await (window as any).axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
 result.touchTargets=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('button,a,input,select,textarea')].filter(n=>n.getClientRects().length&&!n.closest('[inert]')).map(n=>({name:n.getAttribute('aria-label')||n.textContent?.trim(),width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
 await mkdir('artifacts/block-e',{recursive:true});await writeFile(`artifacts/block-e/a11y-${label}.json`,JSON.stringify(result,null,2));
 await writeFile(`artifacts/block-e/tree-${label}.yml`,await page.locator('body').ariaSnapshot());
 // Approved colour combinations are measured and reported for visual review, not silently changed.
 expect(result.violations.filter((v:any)=>v.id!=='color-contrast').map((v:any)=>({id:v.id,nodes:v.nodes.map((n:any)=>n.target)}))).toEqual([]);
 const knownContrast=new Set(['.language','.production-link','#step-error','#review-collar-heading','#review-tag-heading','.collar-review-lettering > .collar-review-heading']);
 expect(result.violations.filter((v:any)=>v.id==='color-contrast').flatMap((v:any)=>v.nodes).filter((n:any)=>!knownContrast.has(n.target.join(' '))).map((n:any)=>n.target)).toEqual([]);
}
const views=[['desktop',1440,900],['laptop',1366,768],['portrait',834,1194],['landscape',1194,834],['mobile',390,844],['narrow',320,740]] as const;
for(const [name,width,height] of views)test(`complete responsive flow: ${name}`,async({page})=>{
 await page.setViewportSize({width,height});await page.goto('/');
 await expect(page.getByRole('textbox')).toBeVisible();await check(page,name+'-start');
 if(width<=800)await expect(page.locator('.story')).toBeHidden();
 await page.getByRole('textbox').fill('Ana García');await next(page);await page.getByRole('textbox').fill('+49 175 646 1669');await next(page);
 await page.getByRole('button',{name:/^M /}).click();await next(page);
 await page.getByRole('tab',{name:'PRINTED'}).focus();await page.keyboard.press('Home');await expect(page.getByRole('tab',{name:'WOVEN'})).toBeFocused();
 await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'PRINTED'})).toBeFocused();
 await page.getByRole('button',{name:'View TEST-PRINTED-02'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();await check(page,name+'-catalog-modal',true);
 await expect(page.getByRole('dialog').getByRole('button',{name:'Select this design'})).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'View TEST-PRINTED-02'})).toBeFocused();
 await page.getByRole('button',{name:'Select this design',exact:true}).click();await next(page);
 await page.getByRole('button',{name:'Metal Buckle',exact:true}).click();await next(page);await page.getByRole('button',{name:'Hanging',exact:true}).click();await next(page);
 await page.getByRole('button',{name:'Bone',exact:true}).click();await page.getByRole('button',{name:/Medium/}).click();await check(page,name+'-shape');await next(page);
 await page.getByRole('textbox').fill('Maximiliano Rodriguez');await next(page);await next(page);
 await page.getByRole('button',{name:'Address',exact:true}).click();await page.getByRole('textbox',{name:'Address',exact:true}).fill('Avenida de las Palmeras, edificio familiar, apartamento 24. '.repeat(4));
 await page.getByRole('button',{name:'Health info',exact:true}).click();await page.getByRole('textbox',{name:'Health info',exact:true}).fill('Allergies and medical information. '.repeat(14));
 await page.getByRole('button',{name:'Family contact',exact:true}).click();await page.getByRole('button',{name:'Additional numbers',exact:true}).click();await page.getByRole('textbox',{name:'Additional number 1',exact:true}).fill('+1 555 123 4567');await page.getByRole('textbox',{name:'Additional number 2 (optional)',exact:true}).fill('+49 175 646 1669');
 await check(page,name+'-extras',true);await next(page);
 await page.getByRole('button',{name:'View all lettering styles →'}).click();await check(page,name+'-lettering-modal',true);
 await page.getByRole('dialog').getByRole('button',{name:'Font 09',exact:true}).click();await page.getByRole('button',{name:'Use this style'}).click();await next(page);
 await page.locator('#personality-toggle-decoration').click();await page.getByRole('button',{name:'Heart',exact:true}).click();await check(page,name+'-decoration',true);
 if(name==='mobile')await audit(page,name+'-decoration');
 for(const kind of ['drawing','dog_photo']){await page.locator('#personality-toggle-'+kind).click();await page.locator('#personality-'+kind+' input[type=file]').setInputFiles('reference-assets/CH-17-1.png');await expect(page.locator('#personality-'+kind).getByText('✓ Image uploaded',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Continue →',exact:true})).toBeEnabled();await page.locator('#personality-'+kind+' textarea').fill('Optional instructions for the engraving.');await check(page,name+'-'+kind);}
 await next(page);await check(page,name+'-review',true);await page.getByRole('button',{name:'Add to my order →'}).click();await check(page,name+'-order',true);
 await page.getByRole('button',{name:'＋ Add another collar'}).click();await expect(page.getByRole('heading',{name:'What size does your dog wear?'})).toBeVisible();
 // Return to the approved order without creating an incomplete second item.
 await page.evaluate(()=>{const d=JSON.parse(sessionStorage.getItem('colti-draft-v1')!);d.step='order-summary';sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));});await page.reload();
 await page.getByRole('button',{name:'Save order'}).click();await expect(page.getByRole('heading',{name:'DEMO-COLTI-US-0001'})).toBeVisible();await check(page,name+'-confirmation');
 await page.goto('/#/production');await expect(page.getByRole('heading',{name:'Owner sign in'})).toBeVisible();await check(page,name+'-production',true);
});
test('keyboard, error association, accordion and modal semantics',async({page})=>{
 await page.goto('/');const input=page.getByRole('textbox');await input.focus();await page.keyboard.press('Enter');await expect(input).toHaveAttribute('aria-invalid','true');await expect(input).toHaveAttribute('aria-describedby','step-error');await audit(page,'initial-error');
 await input.fill('Ana');await page.keyboard.press('Enter');await page.getByRole('textbox').fill('+49 175 646 1669');await page.keyboard.press('Enter');
 await page.getByRole('button',{name:/^M /}).focus();await page.keyboard.press('Space');await page.getByRole('button',{name:'Continue →',exact:true}).focus();await page.keyboard.press('Enter');await next(page);
 await page.getByRole('button',{name:'View CH-17-1'}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toHaveAttribute('aria-modal','true');await audit(page,'catalog-modal');
 const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Select this design'}).focus();await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Close',exact:true})).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('button',{name:'Select this design'})).toBeFocused();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'View CH-17-1'})).toBeFocused();
});
test('mobile shortened viewport keeps fields and Continue reachable',async({page})=>{
 await page.setViewportSize({width:390,height:400});await page.goto('/');await page.getByRole('textbox').fill('Ana');await next(page);await page.getByRole('textbox').fill('+1 555 123 4567');await page.getByRole('button',{name:'Continue →',exact:true}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Continue →',exact:true})).toBeInViewport();await next(page);await check(page,'keyboard-height');
});
test('entire principal flow can be completed by keyboard',async({page})=>{
 await page.goto('/');const activate=async(name:string)=>{const control=page.getByRole('button',{name,exact:true});await control.focus();await page.keyboard.press('Space');};
 await page.getByRole('textbox').focus();await page.keyboard.type('Ana');await page.keyboard.press('Enter');await page.keyboard.type('+1 555 123 4567');await page.keyboard.press('Enter');
 const size=page.getByRole('button',{name:/^M /});await size.focus();await page.keyboard.press('Space');await activate('Continue →');await activate('Select this design');await activate('Continue →');await activate('Metal Buckle');await activate('Continue →');await activate('Anti-fall');await activate('Continue →');
 await page.keyboard.type('Chaos');await page.keyboard.press('Enter');await activate('Continue →');await activate('Continue →');await activate('Continue →');
 await page.locator('#personality-toggle-decoration').focus();await page.keyboard.press('Enter');await expect(page.locator('#personality-toggle-decoration')).toHaveAttribute('aria-expanded','true');await activate('Heart');await expect(page.locator('#personality-toggle-decoration')).toHaveAttribute('aria-expanded','true');await activate('Continue →');
 await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext','10 / 10');await audit(page,'review');await activate('Add to my order →');await audit(page,'final-order');await activate('Save order');await expect(page.getByRole('heading',{name:'DEMO-COLTI-US-0001'})).toBeVisible();await audit(page,'confirmation');
});
