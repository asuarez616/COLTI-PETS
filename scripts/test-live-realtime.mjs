import assert from 'node:assert/strict';
import {loadEnv} from 'vite';
import {createClient} from '@supabase/supabase-js';
const env=loadEnv('production',process.cwd(),'');
const db=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const channel=db.channel('colti-public-connectivity-check').on('postgres_changes',{event:'*',schema:'public',table:'catalog_availability'},()=>{});
try{
 const status=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Realtime subscription timed out')),20000);
  channel.subscribe(value=>{if(value==='SUBSCRIBED'||value==='CHANNEL_ERROR'||value==='TIMED_OUT'){clearTimeout(timer);resolve(value);}});
 });
 assert.equal(status,'SUBSCRIBED');
 console.log('Real Supabase public Realtime subscription connected. Event propagation still requires the owner mutation check.');
}finally{await db.removeChannel(channel);}
