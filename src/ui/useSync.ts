import {useEffect,useRef,useState} from 'react';
import {reconcileSubscription,type SyncResource,type SyncState} from '../application/synchronization';
import {changes} from '../data/syncBackend';
export function useSync(resource:SyncResource,load:()=>Promise<unknown>){const ref=useRef(load);ref.current=load;const [state,setState]=useState<SyncState>('syncing');useEffect(()=>{const sync=reconcileSubscription({load:()=>ref.current(),changes,resource,onData:()=>{},onState:setState});return sync.stop;},[resource]);return state;}
