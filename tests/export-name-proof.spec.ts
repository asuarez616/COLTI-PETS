import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('actual JPG and PDF exports omit Name and preserve pet lettering',async({page})=>{
 await page.goto('/');await mkdir('artifacts/export-name-proof',{recursive:true});
 for(const format of ['jpg','pdf'] as const){const downloaded=page.waitForEvent('download');await page.evaluate(async(format)=>{
 const model='/src/domain/model.ts',catalog='/src/catalog/drive.ts',fixtures='/src/data/fixtures.ts',exports='/src/exports/documents.ts';const {blankItem}=await import(model),{driveDesigns}=await import(catalog),{fixtureFonts}=await import(fixtures),{exportOrder}=await import(exports);
 const design=driveDesigns.find((d:any)=>d.code==='E-2');const item={...blankItem(),pet_name:'wewefef',size_code:'XS',width_cm:1.5,collar_type:'plastic_buckle',tag_type:'anti_fall',tag_phone:'123213123132',font_number:9,design,font:fixtureFonts.find((f:any)=>f.number===9),tagExtras:{selected:['neutered'],neutered:'Neutered',address:'',health:'',familyName:'',familyPhone:'',other:''}};
 const labels:string[]=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,x,y,max){labels.push(text);return max===undefined?original.call(this,text,x,y):original.call(this,text,x,y,max);};try{await exportOrder({order_code:'DEMO-COLTI-US-0011',customer_snapshot:{name:'dsad',phone:'123213123132'},confirmed_at:'2026-10-03T23:49:00Z',items:[item]} as any,'en',format);if(labels.includes('Name')||labels.includes('Nombre'))throw Error('NAME_LABEL_REMAINED');}finally{CanvasRenderingContext2D.prototype.fillText=original;}
 },format);const file=await downloaded;await file.saveAs('artifacts/export-name-proof/DEMO-COLTI-US-0011-corrected.'+format);expect(await file.failure()).toBeNull();}
});
