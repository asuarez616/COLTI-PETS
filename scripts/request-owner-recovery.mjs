import {loadEnv} from 'vite';
import {createClient} from '@supabase/supabase-js';
// Sends only a recovery email; password entry/submission belongs to the user.
if(process.argv[2]!=='--send')throw Error('Explicit --send is required');
const env=loadEnv('production',process.cwd(),'');
const db=createClient(env.VITE_SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {error}=await db.auth.resetPasswordForEmail('antonela.suarez@gmail.com',{redirectTo:'http://127.0.0.1:4176/admin/reset-password'});
if(error)throw Error('Recovery request failed: '+(error.code||error.name));
console.log('Supabase accepted the administrator recovery email request.');
