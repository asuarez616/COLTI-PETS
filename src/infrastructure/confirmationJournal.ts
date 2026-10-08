import type {ConfirmationCheckpoint,ConfirmationJournal} from '../application/confirmation';
export const CONFIRMATION_KEY='colti-confirmation-v1';
export const confirmationJournal:ConfirmationJournal={
 read(){try{const raw=sessionStorage.getItem(CONFIRMATION_KEY);if(!raw)return null;const x=JSON.parse(raw);if(!x||typeof x.key!=='string'||typeof x.draftId!=='string'||typeof x.signature!=='string'||!/^[-0-9a-f]{36}$/i.test(x.key)||!/^[-0-9a-f]{36}$/i.test(x.draftId)||! /^[0-9a-f]{64}$/i.test(x.signature)||!['pending','confirmed'].includes(x.state))throw new Error('INVALID_CHECKPOINT');return x as ConfirmationCheckpoint;}catch{try{sessionStorage.removeItem(CONFIRMATION_KEY);}catch{}return null;}},
 write(value){sessionStorage.setItem(CONFIRMATION_KEY,JSON.stringify(value));},
 clear(){sessionStorage.removeItem(CONFIRMATION_KEY);},
};
