import {it,expect,vi,afterEach} from 'vitest';
import {reconcileSubscription,type SyncSignal} from './synchronization';
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('refetches backend on duplicate events, reconnection and missed-event reconciliation',async()=>{
 vi.stubGlobal('window',new EventTarget());vi.useFakeTimers();let signal!:(s:SyncSignal)=>void;const stopped=vi.fn(),changes={subscribe:vi.fn((_,listener)=>{signal=listener;return stopped;})};let persisted=1;const load=vi.fn(async()=>persisted),values:number[]=[],states:string[]=[];
 const sync=reconcileSubscription({load,changes,resource:'orders',onData:v=>values.push(v),onState:s=>states.push(s)});await vi.advanceTimersByTimeAsync(0);expect(values.at(-1)).toBe(1);
 persisted=2;signal('changed');signal('changed');await vi.advanceTimersByTimeAsync(0);expect(values.at(-1)).toBe(2);
 signal('issue');expect(states.at(-1)).toBe('issue');persisted=3;signal('connected');await vi.advanceTimersByTimeAsync(0);expect(values.at(-1)).toBe(3);expect(states.at(-1)).toBe('current');
 persisted=4;await vi.advanceTimersByTimeAsync(15000);expect(values.at(-1)).toBe(4);persisted=5;await sync.refresh();expect(values.at(-1)).toBe(5);
 sync.stop();expect(stopped).toHaveBeenCalledOnce();const calls=load.mock.calls.length;await vi.advanceTimersByTimeAsync(30000);expect(load).toHaveBeenCalledTimes(calls);
});
it('retains last valid data and reports failed reads without false success',async()=>{
 vi.stubGlobal('window',new EventTarget());let reject=false;const values:number[]=[],states:string[]=[];const sync=reconcileSubscription({changes:{subscribe:()=>()=>{}},resource:'hero',load:async()=>{if(reject)throw Error('offline');return 1;},onData:v=>values.push(v),onState:s=>states.push(s)});await sync.refresh();await Promise.resolve();reject=true;await sync.refresh();expect(values.every(v=>v===1)).toBe(true);expect(states.at(-1)).toBe('issue');sync.stop();
});
it('reconciles closure metadata and availability on notification and manual fallback',async()=>{
 vi.stubGlobal('window',new EventTarget());vi.useFakeTimers();let signal!:(s:SyncSignal)=>void;
 let backend={active:true,name_en:'Plastic Buckle',name_es:'Hebilla Plástica',icon:'/icons/plastic-buckle.svg',display_order:0,preferences:{XS:{enabled:true,widths:{'1.5':true}}}};
 const received:typeof backend[]=[],states:string[]=[];let failed=false;
 const sync=reconcileSubscription({resource:'closures',changes:{subscribe:(resource,listener)=>{expect(resource).toBe('closures');signal=listener;return()=>{};}},load:async()=>{if(failed)throw Error('offline');return structuredClone(backend);},onData:v=>received.push(v),onState:s=>states.push(s)});
 await vi.advanceTimersByTimeAsync(0);
 backend={...backend,active:false,name_en:'Custom buckle',name_es:'Hebilla personalizada',icon:'/icons/metal-buckle.svg',display_order:2,preferences:{XS:{enabled:false,widths:{'1.5':false}}}};
 signal('changed');await vi.advanceTimersByTimeAsync(0);expect(received.at(-1)).toEqual(backend);
 backend={...backend,active:true};await sync.refresh();expect(received.at(-1)?.active).toBe(true);expect(states.at(-1)).toBe('current');
 failed=true;const count=received.length;await sync.refresh();expect(states.at(-1)).toBe('issue');expect(received).toHaveLength(count);failed=false;signal('connected');await vi.advanceTimersByTimeAsync(0);expect(states.at(-1)).toBe('current');sync.stop();
});
