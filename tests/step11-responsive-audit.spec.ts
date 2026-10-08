import {test,expect} from './fixture-catalog';
import {mkdir} from 'node:fs/promises';

test('Step 11 responds to content width across mobile, tablet and desktop',async({page})=>{
 const viewports=[393,430,768,820,1024,1180,1366,1440,1920];
 await mkdir('artifacts/step11-responsive',{recursive:true});
 for(const width of viewports){
  await page.setViewportSize({width,height:width===1024?1366:width===1366?1024:900});
  await page.goto('/');
  await page.evaluate(async()=>{
   const {blankDraft}=await import('/src/domain/model.ts'),{fixtureDesigns}=await import('/src/data/fixtures.ts');
   const d=blankDraft();d.step='review';d.customer={name:'Ana Example',phone:'+1 555 123 4567'};
   Object.assign(d.current,{size_code:'M',width_cm:2.5,design_id:fixtureDesigns[0].id,collar_type:'plastic_buckle',tag_type:'anti_fall',tagShape:'bone',tagSize:'large',tagWidthCm:6,tagHeightCm:4,pet_name:'Lola',tag_phone:d.customer.phone,font_number:9,personalization_type:'decoration',decorationIcon:'heart',tagExtras:{selected:['address','family','neutered','health','phones','other'],address:'Quito',familyName:'Ana Example',familyPhone:'0987654321',neutered:'Neutered',health:'Allergies',phones:'0998765432',other:'Call family'}});
   sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));
  });
  await page.reload();
  await expect(page.getByRole('heading',{name:'Looking good. Check this collar.'})).toBeVisible();
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(image=>image.getAttribute('src')).map(image=>image.decode().catch(()=>undefined)));});
  const main=page.locator('.flow-content>.collar-review');
  const display=await main.evaluate(node=>getComputedStyle(node).display);
  expect(display).toBe(width>=1200?'grid':'block');
  const lettering=page.locator('.collar-review-lettering');
  const font=await lettering.locator('.collar-review-font-label').boundingBox();
  const sample=await lettering.locator('.collar-review-font-preview>.lettering-renderer').boundingBox();
  const personalization=await lettering.locator('.collar-review-personalization-summary>[data-fact="personalization"]').boundingBox();
  expect(font).not.toBeNull();expect(sample).not.toBeNull();expect(personalization).not.toBeNull();
  if(width<=600){expect(font!.y).toBeLessThan(personalization!.y);expect(sample!.y+sample!.height).toBeLessThanOrEqual(personalization!.y+2)}
  else expect(font!.x).toBeLessThan(personalization!.x);
  const [editCollar,editTag]=await page.locator('.flow[data-flow-step="review"] .collar-review-body-edit').all();
  if(width<=600){
   const [collarRow,tagRow]=await Promise.all([page.locator('.flow[data-flow-step="review"] .collar-review-product').boundingBox(),page.locator('.flow[data-flow-step="review"] .collar-review-personalization').boundingBox()]);
   const [collarButton,tagButton]=await Promise.all([editCollar.boundingBox(),editTag.boundingBox()]);
   expect(collarButton!.width).toBeGreaterThan(collarRow!.width*.9);expect(tagButton!.width).toBeGreaterThan(tagRow!.width*.9);
  }else if(width<1200){
   const [collarColumn,tagColumn]=await Promise.all([page.locator('.flow[data-flow-step="review"] .collar-review-configuration').boundingBox(),page.locator('.flow[data-flow-step="review"] .collar-review-personalization').boundingBox()]);
   const [collarButton,tagButton]=await Promise.all([editCollar.boundingBox(),editTag.boundingBox()]);
   expect(Math.abs(collarColumn!.x+collarColumn!.width-collarButton!.x-collarButton!.width)).toBeLessThanOrEqual(2);
   expect(Math.abs(tagColumn!.x+tagColumn!.width-tagButton!.x-tagButton!.width)).toBeLessThanOrEqual(2);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(width>600&&width<1200)expect(await page.locator('.flow[data-flow-step="review"]').evaluate(node=>getComputedStyle(node).marginBlockStart)).toBe('0px');
  await page.screenshot({path:`artifacts/step11-responsive/step11-${width}.png`,fullPage:true});
 }
});
