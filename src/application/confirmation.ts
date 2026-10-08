import {confirmationPayload} from '../domain/configuration';
import type {Draft} from '../domain/model';
function canonical(value:unknown):unknown{
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]));
 return value;
}
/** Local request identity, not a replacement for the server's cryptographic hash. */
export async function requestSignature(draft:Draft){const bytes=new TextEncoder().encode(JSON.stringify(canonical(confirmationPayload(draft))));const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');}
export interface ConfirmationCheckpoint {key:string;draftId:string;state:'pending'|'confirmed';signature:string}
export interface ConfirmationJournal {read():ConfirmationCheckpoint|null;write(checkpoint:ConfirmationCheckpoint):void;clear():void}
