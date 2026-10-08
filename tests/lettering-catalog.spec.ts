import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('font catalog JPG renders all 36 real styles in four columns',async({page})=>{
 await page.goto('/');const download=page.waitForEvent('download');
 const size=await page.evaluate(async()=>{const catalog='/src/exports/fontCatalog.ts',fixtures='/src/data/fixtures.ts';const {generateFontCatalog}=await import(catalog),{fixtureFonts}=await import(fixtures);const blob=await generateFontCatalog(fixtureFonts,'PUPI');const bitmap=await createImageBitmap(blob);const dimensions={width:bitmap.width,height:bitmap.height};bitmap.close();const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='COLTI-Lettering-Styles-PUPI-four-columns.jpg';link.click();return dimensions;});
 expect(size).toEqual({width:1600,height:2702});await mkdir('artifacts/admin',{recursive:true});const file=await download;await file.saveAs('artifacts/admin/COLTI-Lettering-Styles-PUPI-four-columns.jpg');expect(await file.failure()).toBeNull();
});

