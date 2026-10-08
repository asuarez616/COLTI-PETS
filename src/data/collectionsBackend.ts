import {collectionsApplication} from '../application/collections';
import {loadCollectionRecords,createCategory,editCollection} from '../infrastructure/catalogCategories';
export type {CollectionRecord} from '../infrastructure/catalogCategories';
export const collections=collectionsApplication({load:loadCollectionRecords,create:createCategory,change:editCollection});
