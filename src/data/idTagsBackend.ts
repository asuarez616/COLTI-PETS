import {tagsApplication} from '../application/idTags';
import {tagsRepository} from '../infrastructure/idTags';
export const idTags=tagsApplication(tagsRepository);
