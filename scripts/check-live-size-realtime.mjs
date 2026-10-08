import {loadEnv} from 'vite';
import {createClient} from '@supabase/supabase-js';
const env=loadEnv('production',process.cwd(),'');
const db=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:design,error}=await db.from('designs').select('id').eq('code','CH-1').single();if(error)throw error;
let resolveDone,rejectDone;const done=new Promise((r,j)=>{resolveDone=r;rejectDone=j});let count=0;
const timer=setTimeout(()=>rejectDone(Error('No restored realtime state within 90s')),90000);
const channel=db.channel('hierarchy-live-verification').on('postgres_changes',{event:'*',schema:'public',table:'catalog_size_availability',filter:`design_id=eq.${design.id}`},async event=>{
 if(event.new.size_code!=='M'||Number(event.new.width)!==0)return;
 const {data,error}=await db.from('catalog_size_availability').select('enabled').eq('design_id',design.id).eq('size_code','M').eq('width',0).single();if(error){rejectDone(error);return;}
 console.log('Public realtime and persisted size M:',data.enabled?'ON':'OFF');count++;if(count>=2&&data.enabled)resolveDone();
});
try{await new Promise((r,j)=>channel.subscribe(s=>{if(s==='SUBSCRIBED')r();if(s==='CHANNEL_ERROR')j(Error(s));}));console.log('READY: public subscription connected');await done;console.log('PASS: public realtime propagated OFF and restored ON.');}finally{clearTimeout(timer);await db.removeChannel(channel);}
