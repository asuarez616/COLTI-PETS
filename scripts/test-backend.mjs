import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!url||!key)throw new Error('Requires a disposable Supabase TEST project with migration/seed and anonymous Auth enabled.');
if(process.env.COLTI_TEST_PROJECT!=='true')throw new Error('Set COLTI_TEST_PROJECT=true. These checks create test orders/users.');
const make=()=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const a=make(),b=make();for(const c of [a,b]){const {error}=await c.auth.signInAnonymously();if(error)throw error;}
const keyId=randomUUID(),draft=randomUUID();
const item={id:randomUUID(),size_code:'XS',width_cm:1.5,design_id:'10000000-0000-4000-8000-000000000001',collar_type:'plastic_buckle',tag_type:'hanging',tagShape:'bone',tagSize:'medium',tagWidthCm:2.7,tagHeightCm:4,pet_name:'Test Luna',tag_phone:'+1 555 123 4567',extra_text:'',font_number:36,personalization_type:'none',personalization_notes:'',attachments:[]};
const args={p_key:keyId,p_draft:draft,p_customer:{name:'COLTI integration test',phone:'+1 555 123 4567'},p_items:[item]};
const inventory=await a.from('tag_options').select('shape,size');assert.equal(inventory.error,null);assert.ok(!inventory.data.some(t=>t.shape==='crown'));
for(const patch of [
 {tagShape:'crown',tagSize:'small',tagWidthCm:2.5,tagHeightCm:2.5},
 {personalization_type:'unknown'}, {personalization_type:'photo'},
 {tagEmail:'not-an-email'}, {tagExtras:{selected:['unknown']}},
 {informationIcons:['phone']}, {decorationIcon:'heart'},
 {personalization_type:'decoration',informationIcons:['address']},
 {pet_name:'x'.repeat(201)}, {extra_text:'x'.repeat(2001)},
]){const invalidKey=randomUUID();assert.ok((await a.rpc('confirm_order',{...args,p_key:invalidKey,p_items:[{...item,...patch}]})).error);assert.equal((await a.rpc('find_order',{p_key:invalidKey})).data,null);}
assert.ok((await a.rpc('confirm_order_transaction',args)).error);
assert.ok((await a.rpc('begin_attachment',{p_draft:draft,p_item:item.id,p_purpose:'decoration',p_name:'test.png',p_mime:'image/png',p_size:100})).error);
const results=await Promise.all([a.rpc('confirm_order',args),a.rpc('confirm_order',args)]);for(const r of results)assert.equal(r.error,null);assert.equal(results[0].data.id,results[1].data.id);
const saved=results[0].data;assert.match(saved.order_code,/^COLTI-US-\d{4,}$/);assert.equal(saved.items[0].font.number,36);assert.ok(['ready','placeholder'].includes(saved.items[0].font.state));
assert.equal((await a.rpc('find_order',{p_key:keyId})).data.id,saved.id);
// Discard the first response as if the transport lost it; same key must recover it.
assert.equal((await a.rpc('confirm_order',args)).data.id,saved.id);
assert.equal((await b.rpc('find_order',{p_key:keyId})).data,null);
for(const table of ['orders','customers','order_items']){const r=await b.from(table).select('*');assert.ok(r.error||r.data.length===0);}
assert.ok((await b.rpc('production_orders')).error);assert.ok((await a.rpc('advance_order',{p_id:saved.id,p_expected:'new',p_updated:saved.updated_at})).error);
assert.ok((await a.rpc('confirm_order',{...args,p_customer:{...args.p_customer,name:'changed'}})).error);
const badKey=randomUUID();assert.ok((await a.rpc('confirm_order',{...args,p_key:badKey,p_items:[item,{...item,id:randomUUID(),width_cm:3}]})).error);assert.equal((await a.rpc('find_order',{p_key:badKey})).data,null);
const unique=await Promise.all([a.rpc('confirm_order',{...args,p_key:randomUUID()}),b.rpc('confirm_order',{...args,p_key:randomUUID()})]);for(const r of unique)assert.equal(r.error,null);assert.notEqual(unique[0].data.order_code,unique[1].data.order_code);
const write=await b.from('orders').update({status:'finished'}).eq('id',saved.id);assert.ok(write.error||!write.data);
const escal=await a.rpc('verify_attachment',{p_id:randomUUID(),p_user:randomUUID(),p_valid:true});assert.ok(escal.error);
if(process.env.COLTI_OWNER_EMAIL&&process.env.COLTI_OWNER_PASSWORD){const owner=make();const login=await owner.auth.signInWithPassword({email:process.env.COLTI_OWNER_EMAIL,password:process.env.COLTI_OWNER_PASSWORD});if(login.error)throw login.error;assert.equal((await owner.rpc('is_owner')).data,true);const step=await owner.rpc('advance_order',{p_id:saved.id,p_expected:'new',p_updated:saved.updated_at});assert.equal(step.data.status,'in_progress');const done=await owner.rpc('advance_order',{p_id:saved.id,p_expected:'in_progress',p_updated:step.data.updated_at});assert.equal(done.data.status,'finished');assert.ok((await owner.rpc('advance_order',{p_id:saved.id,p_expected:'new',p_updated:saved.updated_at})).error);}
console.log('Backend checks passed: atomicity, idempotency, concurrency and authorization.');

