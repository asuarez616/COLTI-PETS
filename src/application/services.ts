import type {Repositories} from './repositories';
import {normalizeError,type Operation} from './errors';
import {parseDraft} from '../domain/validation';
import type {Attachment,Draft,Order,Status} from '../domain/model';
export function createApplication(repositories:Repositories){
 const run=async<T>(operation:Operation,task:()=>Promise<T>):Promise<T>=>{try{return await task();}catch(e){throw normalizeError(e,operation);}};
 return {
  loadCatalog:()=>run('catalog',()=>repositories.catalog.load()),
  // Always replay confirmation through the server hash contract. A lookup alone
  // must not turn a different payload with the same key into a successful retry.
  confirmOrder:(draft:Draft)=>run('confirmation',()=>repositories.orders.confirm(parseDraft(draft))),
  findOrder:(key:string)=>run('recovery',()=>repositories.orders.findByKey(key)),
  upload:(file:File,draft:Draft,state:(s:string)=>void)=>run('upload',()=>repositories.attachments.upload(file,draft,state)),
  discard:(a:Attachment)=>run('upload',()=>repositories.attachments.discard(a)),
  attachmentUrl:(a:Attachment)=>run('image',()=>repositories.attachments.getUrl(a)),
  checkOwner:()=>run('production',()=>repositories.orders.isOwner()),
  listOrders:(status:Status|'',page:number)=>run('production',()=>repositories.orders.list(status,page)),
  getProductionOrder:(id:string)=>run('production',()=>repositories.orders.getById(id)),
  advance:(order:Order)=>run('production',()=>repositories.orders.advance(order)),
  signIn:(email:string,password:string)=>run('login',()=>repositories.auth.signIn(email,password)),
  signOut:()=>run('login',()=>repositories.auth.signOut()),
  subscribeAuth:repositories.auth.subscribe,
  readDemo:repositories.orders.readDemo,
 };
}
