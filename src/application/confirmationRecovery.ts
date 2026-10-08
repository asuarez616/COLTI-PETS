import {requestSignature,type ConfirmationJournal} from './confirmation';
import {ApplicationError,normalizeError} from './errors';
import type {Draft,Order} from '../domain/model';
interface Orders {confirmOrder(draft:Draft):Promise<Order>;findOrder(key:string):Promise<Order|null>}
export function createConfirmationRecovery(orders:Orders,journal:ConfirmationJournal){
 return {
  async submit(draft:Draft){
   try{
    const request=structuredClone(draft),signature=await requestSignature(request),previous=journal.read();
    if(previous&&previous.state==='pending'&&(previous.key!==draft.key||previous.signature!==signature))throw new ApplicationError('conflict','confirmation',false);
    const checkpoint={key:draft.key,draftId:draft.draftId,signature,state:'pending' as const};
    journal.write(checkpoint); // Persist before sending; never rotate a key after a temporary failure.
    let order:Order;
    try{order=await orders.confirmOrder(request);}catch(e){
     const failure=normalizeError(e,'confirmation');
     // A known server rejection rolls back the transaction. Allow corrections;
     // ambiguous/lost responses must retain their original recovery checkpoint.
     if(failure.kind==='validation'&&failure.reason)journal.clear();
     throw failure;
    }
    journal.write({...checkpoint,state:'confirmed'});
    return order;
   }catch(e){throw normalizeError(e,'confirmation');}
  },
  async resume(){
   try{const checkpoint=journal.read();if(!checkpoint)return null;const order=await orders.findOrder(checkpoint.key);
    if(order)journal.write({...checkpoint,state:'confirmed'});
    else if(checkpoint.state==='confirmed')throw new ApplicationError('permission','recovery',false);
    return order;
   }catch(e){throw normalizeError(e,'recovery');}
  },
 };
}
