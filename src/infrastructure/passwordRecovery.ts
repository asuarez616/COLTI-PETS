import {recoveryTokens} from '../application/passwordRecovery';
import {supabase,checkOwner} from './supabaseRepositories';
let recovery:Promise<void>|undefined;
export function beginPasswordRecovery(){
 if(recovery)return recovery;
 const tokens=recoveryTokens(location.hash);
 // Remove bearer credentials from address/history before any further navigation.
 history.replaceState(null,'',location.pathname);
 recovery=(async()=>{
  if(!supabase)throw Error('RecoveryLinkRequired');
  if(tokens){const {error}=await supabase.auth.setSession(tokens);if(error)throw error;}
  else {const {data,error}=await supabase.auth.getSession();if(error)throw error;if(!data.session)throw Error('RecoveryLinkRequired');}
  if(!await checkOwner())throw Error('OwnerRequired');
 })();return recovery;
}
export async function finishPasswordRecovery(password:string){
 if(!supabase)throw Error('RecoveryLinkRequired');
 await beginPasswordRecovery();
 const {error}=await supabase.auth.updateUser({password});if(error)throw error;
 await supabase.auth.signOut();
}
