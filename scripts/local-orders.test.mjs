import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer as createHttpServer} from 'node:http';
import {createServer as createViteServer} from 'vite';
import {createLocalOrdersMiddleware} from './local-orders-server.mjs';
test('local confirmed orders persist, import idempotently and protect status/notes and origin',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'colti-local-orders-test-')),vite=await createViteServer({server:{middlewareMode:true},logLevel:'silent'});
 const validation=await vite.ssrLoadModule('/src/domain/validation.ts'),admin=await vite.ssrLoadModule('/src/domain/admin.ts'),model=await vite.ssrLoadModule('/src/domain/model.ts'),fixtures=await vite.ssrLoadModule('/src/data/fixtures.ts');
 const domain={...validation,...admin};let middleware;
 const server=createHttpServer((req,res)=>void middleware(req,res,()=>{res.writeHead(404);res.end();}));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;middleware=createLocalOrdersMiddleware({root:dir,origin:base,loadDomain:async()=>domain});
 async function request(path,body,origin='http://127.0.0.1:4173'){const response=await fetch(base+'/api/admin/local-orders'+path,{method:body?'POST':'GET',headers:{Host:new URL(base).host,Origin:origin,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};}
 const order={id:crypto.randomUUID(),key:crypto.randomUUID(),demo:true,order_code:'DEMO-COLTI-US-0001',status:'new',confirmed_at:new Date().toISOString(),updated_at:new Date().toISOString(),customer_snapshot:{name:'Test customer',phone:'0984156889'},items:[{...model.blankItem(),pet_name:'Test pet',design:fixtures.fixtureDesigns[0],font:fixtures.fixtureFonts[0]}]};
 try{
  assert.deepEqual((await request('')).data,[]);assert.equal((await request('/import',{orders:[order]})).data.added,1);assert.equal((await request('/import',{orders:[order]})).data.added,0);assert.equal((await request('')).data.length,1);
  let detail=(await request('/'+order.id)).data;
  const progress=await request('/'+order.id,{updated:detail.order.updated_at,status:'in_progress'});assert.equal(progress.data.order.status,'in_progress');
  assert.equal((await request('/'+order.id,{updated:detail.order.updated_at,note:'stale'})).status,409);
  detail=progress.data;const noted=await request('/'+order.id,{updated:detail.order.updated_at,note:'Private note'});assert.equal(noted.data.note,'Private note');
  await request('/import',{orders:[order]});assert.equal((await request('/'+order.id)).data.order.status,'in_progress');assert.equal((await request('/'+order.id)).data.note,'Private note');
  middleware=createLocalOrdersMiddleware({root:dir,origin:base,loadDomain:async()=>domain});assert.equal((await request('')).data.length,1);assert(!(JSON.stringify((await request('')).data).includes('Private note')));
  assert.equal((await request('/'+order.id,{updated:noted.data.order.updated_at,status:'delivered'})).data.error,'INVALID_TRANSITION');
  assert.equal((await request('?from='+encodeURIComponent(order.confirmed_at))).data.length,1);
  assert.equal((await request('?to='+encodeURIComponent(order.confirmed_at))).data.length,0);
  const cancelled=await request('/'+order.id,{updated:noted.data.order.updated_at,status:'cancelled',reason:'Customer requested cancellation'});assert.equal(cancelled.data.cancellationReason,'Customer requested cancellation');
  middleware=createLocalOrdersMiddleware({root:dir,origin:base,loadDomain:async()=>domain});assert.equal((await request('/'+order.id)).data.cancellationReason,'Customer requested cancellation');assert(!JSON.stringify((await request('')).data).includes('Customer requested cancellation'));
  assert.equal((await request('/import',{orders:[{...order,demo:false}]})).status,400);assert.equal((await request('',null,'https://external.example')).status,403);
  const eventAbort=new AbortController(),events=await fetch(base+'/api/admin/local-orders/events',{headers:{Origin:'http://127.0.0.1:4173'},signal:eventAbort.signal}),reader=events.body.getReader();assert.equal(events.headers.get('content-type'),'text/event-stream');await reader.read();const event=reader.read();
  const enabled=await request('/availability',{change:{designId:order.items[0].design.id,width:0,enabled:false,revision:0}});assert.equal(enabled.data.enabled,false);assert.equal(enabled.data.revision,1);assert.match(new TextDecoder().decode((await event).value),/"resource":"catalog"/);eventAbort.abort();
  assert.equal((await request('/availability',{change:{designId:order.items[0].design.id,width:0,enabled:true,revision:0}})).status,409);
  const variant=await request('/availability',{change:{designId:order.items[0].design.id,width:1.5,enabled:true,revision:0}});assert.equal(variant.data.enabled,true);assert.equal((await request('/configuration')).data.overrides.length,2);
  const hero=await request('/hero',{configuration:{revision:0,images:[{id:'hero-1',active:false}]}});assert.equal(hero.data.revision,1);assert.equal((await request('/hero',{configuration:{revision:0,images:[]}})).status,409);
  middleware=createLocalOrdersMiddleware({root:dir,origin:base,loadDomain:async()=>domain});assert.deepEqual((await request('/configuration')).data.hero,hero.data);
  assert.equal((await request('/migrate-configuration',{overrides:[],hero:{revision:0,images:[]}})).data.overrides.length,2);
  const reviewConfig=await fetch(base+'/api/admin/local-orders/configuration',{headers:{Host:new URL(base).host,Origin:'http://127.0.0.1:4176'}});assert.equal(reviewConfig.status,200);
 }finally{await new Promise(r=>server.close(r));await vite.close();await rm(dir,{recursive:true,force:true});}
});
