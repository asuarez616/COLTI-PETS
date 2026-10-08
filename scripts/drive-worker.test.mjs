import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDriveWorker} from './drive-worker.mjs';
test('worker reconciles both sources, reports failure and recovers without overlapping cycles',async()=>{
 let fail=true,release;const calls=[];
 const worker=createDriveWorker({status:async()=>({connected:true}),synchronize:async target=>{calls.push(target);if(target==='catalog')await new Promise(r=>{release=r;});if(target==='hero'&&fail)throw Error('DriveReconnect');}},{now:()=>0});
 const first=worker.tick();await new Promise(r=>setImmediate(r));await worker.tick();assert.deepEqual(calls,['catalog']);release();await first;
 assert.equal(worker.status().targets.catalog.checkedAt,'1970-01-01T00:00:00.000Z');assert.equal(worker.status().targets.hero.issue,'DriveReconnect');
 fail=false;const next=worker.tick();await new Promise(r=>setImmediate(r));release();await next;assert.equal(worker.status().targets.hero.issue,null);
 worker.stop();await worker.tick();assert.equal(calls.length,4);
});
test('disconnected Drive does not run synchronization',async()=>{
 const worker=createDriveWorker({status:async()=>({connected:false}),synchronize:()=>assert.fail('must not sync')});await worker.tick();assert.equal(worker.status().targets.catalog.checkedAt,null);
});
