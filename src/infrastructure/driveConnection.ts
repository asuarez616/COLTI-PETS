import type {DriveConnectionRepository} from '../application/driveConnection';
import {supabase} from './supabaseRepositories';
async function request(path:string,body?:object){
 const session=supabase?(await supabase.auth.getSession()).data.session:null;
 const response=await fetch('/api/admin/drive/'+path,{method:body?'POST':'GET',credentials:'same-origin',headers:{...(body?{'Content-Type':'application/json'}:{}),...(session?{Authorization:'Bearer '+session.access_token}:{})},...(body?{body:JSON.stringify(body)}:{})});
 if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('DriveServerUnavailable');
 const data=await response.json();if(!response.ok)throw new Error(data.error||'DriveSyncFailed');return data;
}
export const driveHttpRepository:DriveConnectionRepository={status:()=>request('status'),connect:()=>request('connect',{}),disconnect:async()=>{await request('disconnect',{});},sync:async target=>{await request('sync',{target});}};
