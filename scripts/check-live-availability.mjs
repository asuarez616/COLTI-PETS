import {loadEnv} from 'vite';
import {createClient} from '@supabase/supabase-js';
const env=loadEnv('production',process.cwd(),'');
const db=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await db.from('catalog_availability').select('*');if(error)throw error;
console.log(JSON.stringify(data));
