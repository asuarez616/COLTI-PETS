export function createDriveWorker(oauth,{interval=30000,now=Date.now}={}){
 let running=false,timer=null,stopped=false;
 const state={catalog:{issue:null,checkedAt:null},hero:{issue:null,checkedAt:null}};
 async function tick(){
  if(stopped||running)return;running=true;
  try{if(!(await oauth.status()).connected)return;
   for(const target of ['catalog','hero']){
    if(stopped)break;
    try{await oauth.synchronize(target);state[target]={issue:null,checkedAt:new Date(now()).toISOString()};}
    catch(error){if(error.message!=='DriveBusy')state[target].issue=error.message==='DriveReconnect'?'DriveReconnect':'DriveSyncFailed';}
   }
  }finally{running=false;}
 }
 return {tick,status:()=>({running,targets:structuredClone(state)}),start(){if(timer)return;stopped=false;timer=setInterval(()=>void tick().catch(()=>{}),interval);timer.unref();void tick().catch(()=>{});},stop(){stopped=true;clearInterval(timer);timer=null;}};
}
