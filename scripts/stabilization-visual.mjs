import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const stage=process.argv[2]||'before';
const dir=`artifacts/stabilization/${stage}`;await mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
for(const [name,width,height] of [['desktop',1440,1000],['tablet',834,1194],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height}});await page.goto('http://127.0.0.1:4173');
 await page.evaluate(()=>{sessionStorage.clear();});await page.reload();await page.waitForTimeout(800);
 await page.screenshot({path:`${dir}/${name}-start.png`,fullPage:true});
 await page.evaluate(()=>{const id=crypto.randomUUID();const current={id,size_code:'M',width_cm:2.5,design_id:'',collar_type:'plastic_buckle',tag_type:'hanging',tagShape:'circle',tagSize:'small',tagWidthCm:2.5,tagHeightCm:2.5,pet_name:'Lola',tag_phone:'+1 555 123 4567',extra_text:'',font_number:1,personalization_type:'none',personalization_notes:'',attachments:[]};sessionStorage.setItem('colti-draft-v1',JSON.stringify({version:1,draftId:crypto.randomUUID(),key:crypto.randomUUID(),customer:{name:'Ana',phone:current.tag_phone},items:[],current,step:11,editing:false}));});
 await page.reload();await page.waitForTimeout(800);await page.screenshot({path:`${dir}/${name}-personalization.png`,fullPage:true});await page.close();
}await browser.close();
