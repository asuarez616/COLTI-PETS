import type {Attachment,Design,Draft,FontRecord,Order,Status} from '../domain/model';
export interface CatalogRepository {load():Promise<{designs:Design[];fonts:FontRecord[]}>}
export interface OrderRepository {
 findByKey(key:string):Promise<Order|null>;confirm(draft:Draft):Promise<Order>;
 isOwner():Promise<boolean>;list(status:Status|'',page:number):Promise<Order[]>;
 getById(id:string):Promise<Order|null>;advance(order:Order):Promise<Order>;
 readDemo():Order[];
}
export interface AttachmentRepository {
 upload(file:File,draft:Draft,onState:(state:string)=>void):Promise<Attachment>;
 discard(attachment:Attachment):Promise<void>;getUrl(attachment:Attachment):Promise<string>;
}
export interface AuthRepository {
 signIn(email:string,password:string):Promise<void>;signOut():Promise<void>;
 subscribe(listener:()=>void):()=>void;
}
export interface Repositories {catalog:CatalogRepository;orders:OrderRepository;attachments:AttachmentRepository;auth:AuthRepository}
