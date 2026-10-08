import {describe,it,expect,vi} from 'vitest';
import {createApplication} from './services';
import {createConfirmationRecovery} from './confirmationRecovery';
import {requestSignature,type ConfirmationCheckpoint,type ConfirmationJournal} from './confirmation';
import {errorMessage,normalizeError} from './errors';
import type {Repositories} from './repositories';
import {blankDraft,type Draft,type Order} from '../domain/model';
import {orderItems} from '../domain/configuration';
import {fixtureDesigns,fixtureFonts} from '../data/fixtures';
import {attachmentError} from '../../supabase/functions/attachments/errors';
function setup(){
 let checkpoint:ConfirmationCheckpoint|null=null;
 const journal:ConfirmationJournal={read:()=>checkpoint,write:c=>{checkpoint={...c};},clear:()=>{checkpoint=null;}};
 const saved=new Map<string,{hash:string;order:Order}>();let dropResponse=true;
 const repositories:Repositories={
  orders:{confirm:vi.fn(async(d:Draft)=>{const hash=await requestSignature(d),existing=saved.get(d.key);if(existing){if(existing.hash!==hash)throw Error('IDEMPOTENCY_CONFLICT');return existing.order;}
   const order:Order={id:crypto.randomUUID(),order_code:'COLTI-US-0001',status:'new',confirmed_at:new Date().toISOString(),updated_at:new Date().toISOString(),customer_snapshot:d.customer,items:orderItems(d).map(i=>({...i,design:fixtureDesigns[0],font:fixtureFonts[0]}))};saved.set(d.key,{hash,order});if(dropResponse){dropResponse=false;throw new TypeError('Failed to fetch after commit');}return order;}),findByKey:async key=>saved.get(key)?.order||null,isOwner:async()=>false,list:async()=>[],getById:async()=>null,advance:async o=>o,readDemo:()=>[]},
  catalog:{load:async()=>({designs:fixtureDesigns,fonts:fixtureFonts})},
  attachments:{upload:async()=>{throw Error('INVALID_FILE');},discard:async()=>{},getUrl:async()=>{throw Error('FILE_UNAVAILABLE');}},
  auth:{signIn:async()=>{},signOut:async()=>{},subscribe:()=>()=>{}},
 };
 const application=createApplication(repositories),recovery=createConfirmationRecovery(application,journal),draft=blankDraft();draft.customer={name:'Ana',phone:'+1 555 123 4567'};draft.items=[draft.current];
 return {saved,journal,repositories,application,recovery,draft};
}
describe('repository boundaries and confirmation recovery',()=>{
 it('lost response → retry returns one committed order with the same key',async()=>{const s=setup(),key=s.draft.key;await expect(s.recovery.submit(s.draft)).rejects.toMatchObject({kind:'network',retryable:true});expect(s.saved.size).toBe(1);expect(s.journal.read()?.state).toBe('pending');expect(s.journal.read()?.signature).toMatch(/^[a-f0-9]{64}$/);const result=await s.recovery.submit(s.draft);expect(result.id).toBe(s.saved.get(key)?.order.id);expect(s.saved.size).toBe(1);expect(s.repositories.orders.confirm).toHaveBeenCalledTimes(2);expect(s.draft.key).toBe(key);expect(s.journal.read()?.state).toBe('confirmed');});
 it('refresh recovers a pending commit without sending another confirmation',async()=>{const s=setup();await expect(s.recovery.submit(s.draft)).rejects.toThrow();const refreshed=createConfirmationRecovery(s.application,s.journal);expect((await refreshed.resume())?.id).toBe(s.saved.get(s.draft.key)?.order.id);expect(s.repositories.orders.confirm).toHaveBeenCalledTimes(1);expect((await refreshed.resume())?.order_code).toBe('COLTI-US-0001');});
 it('cannot change an unresolved request or reuse its key for different data',async()=>{const s=setup();await expect(s.recovery.submit(s.draft)).rejects.toThrow();s.draft.customer.name='Different';await expect(s.recovery.submit(s.draft)).rejects.toMatchObject({kind:'conflict'});expect(s.repositories.orders.confirm).toHaveBeenCalledTimes(1);expect(s.saved.size).toBe(1);});
 it('does not lose the draft or checkpoint when recovery is offline',async()=>{const s=setup();await expect(s.recovery.submit(s.draft)).rejects.toThrow();s.repositories.orders.findByKey=async()=>{throw new TypeError('network offline');};await expect(s.recovery.resume()).rejects.toMatchObject({kind:'network'});expect(s.journal.read()?.state).toBe('pending');expect(s.draft.customer.name).toBe('Ana');});
 it('does not confirm when the checkpoint cannot be persisted',async()=>{const s=setup();s.journal.write=()=>{throw Error('Storage unavailable');};await expect(s.recovery.submit(s.draft)).rejects.toThrow();expect(s.repositories.orders.confirm).not.toHaveBeenCalled();expect(s.saved.size).toBe(0);});
 it('allows correcting a rejected order',async()=>{
  const s=setup();s.repositories.orders.confirm=vi.fn().mockRejectedValueOnce({code:'P0001',message:'INVALID_TAG item 2'}).mockResolvedValueOnce({id:'confirmed'});
  await expect(s.recovery.submit(s.draft)).rejects.toMatchObject({reason:'INVALID_TAG'});
  expect(s.journal.read()).toBeNull();expect(s.saved.size).toBe(0);
  s.draft.customer.phone='+1 555 987 6543';
  await expect(s.recovery.submit(s.draft)).resolves.toMatchObject({id:'confirmed'});
  expect(s.journal.read()?.state).toBe('confirmed');
 });
 it('keeps recovery when a response cannot be parsed',async()=>{
  const s=setup();s.repositories.orders.confirm=vi.fn().mockRejectedValueOnce(Error('INVALID_DATA'));
  await expect(s.recovery.submit(s.draft)).rejects.toMatchObject({kind:'validation'});
  expect(s.journal.read()?.state).toBe('pending');
 });
 it('shows safe actionable confirmation errors',()=>{
  const failure=normalizeError({code:'P0001',message:'INVALID_ATTACHMENT item 1 private diagnostic'},'confirmation');
  expect(failure.reason).toBe('INVALID_ATTACHMENT');
  expect(errorMessage(failure,'en','confirmation')).toContain('Upload it again');
  expect(errorMessage(failure,'en','confirmation')).not.toContain('private');
 });
 it('validates external draft structure before invoking infrastructure',async()=>{const s=setup();await expect(s.application.confirmOrder({...s.draft,items:[{}]} as Draft)).rejects.toMatchObject({kind:'validation'});expect(s.repositories.orders.confirm).not.toHaveBeenCalled();});
});
describe('safe error contract',()=>{
 it.each([
  [new TypeError('Failed to fetch'),'network',true],
  [{message:'INVALID_ATTACHMENT_PURPOSE',code:'P0001'},'validation',false],
  [{message:'permission denied for table orders',code:'42501'},'permission',false],
  [{message:'IDEMPOTENCY_CONFLICT'},'conflict',false],
  [{status:503,message:'PostgrestError status 500 RPC internal diagnostic'},'network',true],
  [{message:'SUPABASE_NOT_CONFIGURED'},'unavailable',false],
 ] as const)('normalizes provider failure %# without exposing diagnostics',(failure,kind,retryable)=>{expect(normalizeError(failure,'confirmation')).toMatchObject({kind,retryable});for(const locale of ['en','es'] as const)expect(errorMessage(failure,locale,'confirmation')).not.toMatch(/Postgrest|RPC|500|table orders|SUPABASE/);});
 it('Edge Function publishes stable codes only',()=>{expect(attachmentError({message:'SQL internal detail: owner@example.com'})).toEqual({code:'UPLOAD_FAILED',status:500});expect(attachmentError(Error('INVALID_FILE'))).toEqual({code:'INVALID_FILE',status:400});expect(attachmentError({code:'42501',message:'private policy details'})).toEqual({code:'PERMISSION_DENIED',status:403});});
});
