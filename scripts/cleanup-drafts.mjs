import {createClient} from '@supabase/supabase-js';
const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY}=process.env;
if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)throw new Error('Missing server-only credentials');
const c=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const before=new Date(Date.now()-7*24*60*60*1000).toISOString();
// Only stale pending/ready/rejected rows, never linked order records.
const {data,error}=await c.from('attachments').select('id,object_path').is('order_item_id',null).in('status',['pending','ready','rejected']).lt('created_at',before).limit(100);
if(error)throw error;
// A SQL claim function atomically rejects orphan rows and prevents confirmation races.
for(const a of data){const r=await c.rpc('claim_stale_attachment',{p_id:a.id,p_before:before});if(r.error)throw r.error;if(!r.data)continue;const removed=await c.storage.from('order-attachments').remove([r.data]);if(removed.error)throw removed.error;}
console.log('Stale draft cleanup completed.');
