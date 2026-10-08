// Explicit Phase 24 end-to-end proof. Real QA orders remain labelled in history.
import {createClient} from '@supabase/supabase-js';
import {loadEnv} from 'vite';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const proofPath='audits/phase-24/live-orders-1-5-10.json';
try{const saved=JSON.parse(await readFile(proofPath,'utf8'));if(saved.orders?.length===3){console.log('Existing live 1/5/10-order verification preserved; no duplicate QA orders created.');process.exitCode=0;}else throw Error('Incomplete checkpoint');}catch(e){if(e.code!=='ENOENT')throw e;
 const env=loadEnv('production',process.cwd(),''),client=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const signIn=await client.auth.signInAnonymously();if(signIn.error)throw signIn.error;
 const catalog=await client.from('designs').select('id,code,design_compatibility(size_code,width_cm)').eq('active',true).order('display_order');if(catalog.error)throw catalog.error;
 const overrides=await client.from('catalog_availability').select('design_id,width,enabled');if(overrides.error)throw overrides.error;
 const unavailable=(id,width)=>overrides.data.some(o=>o.design_id===id&&[0,width].includes(Number(o.width))&&!o.enabled);
 const design=catalog.data.find(d=>d.design_compatibility.some(c=>c.size_code==='M'&&Number(c.width_cm)===2.5)&&!unavailable(d.id,2.5));assert.ok(design);
 const proof={checkedAt:new Date().toISOString(),project:'fumscyebzupuqylslsdp',orders:[],checks:['real anonymous customer','actual catalog','concurrent idempotency','recovery','no customer administrative access']};
 for(const count of [1,5,10]){
  const items=Array.from({length:count},(_,n)=>({id:randomUUID(),size_code:'M',width_cm:2.5,design_id:design.id,collar_type:'plastic_buckle',tag_type:'anti_fall',pet_name:'QA Sync '+count+'-'+(n+1),tag_phone:'+1 555 123 4567',extra_text:'',font_number:36,personalization_type:'none',personalization_notes:'',attachments:[]}));
  const args={p_key:randomUUID(),p_draft:randomUUID(),p_customer:{name:'COLTI QA – Phase 24 ('+count+' collars)',phone:'+1 555 123 4567'},p_items:items};
  const replies=await Promise.all([client.rpc('confirm_order',args),client.rpc('confirm_order',args)]);for(const result of replies)assert.equal(result.error,null);assert.equal(replies[0].data.id,replies[1].data.id);assert.equal(replies[0].data.items.length,count);
  const recovered=await client.rpc('find_order',{p_key:args.p_key});assert.equal(recovered.error,null);assert.equal(recovered.data.id,replies[0].data.id);
  assert.ok((await client.rpc('admin_order',{p_id:recovered.data.id})).error);
  proof.orders.push({id:recovered.data.id,code:recovered.data.order_code,collars:count,status:recovered.data.status,design:design.code});
  await writeFile(proofPath,JSON.stringify(proof,null,2)+'\n');console.log(recovered.data.order_code+': '+count+' collars saved exactly once and recovered.');
 }
}
