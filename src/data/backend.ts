// Composition root and backwards-compatible application facade. No provider escapes to React.
import {createApplication} from '../application/services';
import {repositories} from '../infrastructure/supabaseRepositories';
export {mode,imageUrl} from '../infrastructure/supabaseRepositories';
export {compatible} from '../domain/model';
export const {loadCatalog,confirmOrder,findOrder,upload,discard,attachmentUrl,checkOwner,listOrders,getProductionOrder,advance,signIn,signOut,subscribeAuth,readDemo}=createApplication(repositories);

import {createConfirmationRecovery} from '../application/confirmationRecovery';
import {confirmationJournal} from '../infrastructure/confirmationJournal';
export const confirmation=createConfirmationRecovery({confirmOrder,findOrder},confirmationJournal);
export const getConfirmationCheckpoint=()=>confirmationJournal.read();
export const clearConfirmationCheckpoint=()=>confirmationJournal.clear();
