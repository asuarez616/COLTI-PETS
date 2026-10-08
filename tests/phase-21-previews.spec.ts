import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
for(const shape of ['paw','circle','bone','military','anti-fall'])test('all shown information rows fit the safe engraving area '+shape,async({page})=>{
 await page.goto('/');await page.evaluate(async shape=>{const p='/src/domain/model.ts',r='/src/domain/rules.ts';const {blankDraft}=await import(p),{getAvailableTagSizes}=await import(r);const d=blankDraft(),size=getAvailableTagSizes(shape)[0];d.step='personalization';Object.assign(d.current,{tag_type:shape==='anti-fall'?'anti_fall':'hanging',tagShape:shape==='anti-fall'?undefined:shape,tagSize:size?.id,tagWidthCm:size?.width,tagHeightCm:size?.height,pet_name:'Mona',tag_phone:'0984156889',font_number:9,personalization_type:'decoration',tagExtras:{selected:['address','neutered','health'],address:'Quito',neutered:'Neutered',health:'Daily medication',familyName:'',familyPhone:'',other:''}});sessionStorage.setItem('colti-draft-v1',JSON.stringify(d));},shape);await page.reload();
 if(shape!=='anti-fall')await page.getByRole('button',{name:'View back',exact:true}).click();
 await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.tag-face-line')).toHaveCount(shape==='bone'||shape==='anti-fall'?3:4);
 await mkdir('artifacts/phase-21',{recursive:true});await page.locator('.tag-preview-container').screenshot({path:`artifacts/phase-21/preview-${shape}.png`});
 const bounds=await page.locator('.tag-face-content').evaluate(box=>{const b=box.getBoundingClientRect();return {area:{top:b.top,bottom:b.bottom,left:b.left,right:b.right,height:b.height},scrollHeight:box.scrollHeight,rows:[...box.querySelectorAll('.tag-face-line')].map(row=>{const r=row.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,text:row.textContent};})};});
 await writeFile(`artifacts/phase-21/preview-${shape}-bounds.json`,JSON.stringify(bounds,null,2));
 for(const row of bounds.rows){expect(row.top).toBeGreaterThanOrEqual(bounds.area.top-.5);expect(row.bottom).toBeLessThanOrEqual(bounds.area.bottom+.5);}
});
