export type SyncResource='orders'|'catalog'|'hero'|'closures'|'id-tags';
export type SyncSignal='changed'|'connected'|'issue';
export interface ChangeRepository {subscribe(resource:SyncResource,listener:(signal:SyncSignal)=>void):()=>void}
export type SyncState='syncing'|'current'|'issue';
/** Notifications invalidate; successful repository reads alone replace data. */
export function reconcileSubscription<T>({load,changes,resource,onData,onState,interval=15000}:{load:()=>Promise<T>;changes:ChangeRepository;resource:SyncResource;onData:(data:T)=>void;onState?:(state:SyncState)=>void;interval?:number}){
 let alive=true,running=false,pending=false,transportIssue=false;
 async function refresh(){if(!alive)return;if(running){pending=true;return;}running=true;onState?.('syncing');try{const value=await load();if(alive){onData(value);onState?.(transportIssue?'issue':'current');}}catch{if(alive)onState?.('issue');}finally{running=false;if(pending&&alive){pending=false;void refresh();}}}
 const stop=changes.subscribe(resource,signal=>{transportIssue=signal==='issue';if(signal==='issue')onState?.('issue');else void refresh();});
 const focus=()=>void refresh(),timer=setInterval(focus,interval);window.addEventListener('focus',focus);window.addEventListener('online',focus);void refresh();
 return {refresh,stop:()=>{alive=false;clearInterval(timer);window.removeEventListener('focus',focus);window.removeEventListener('online',focus);stop();}};
}
