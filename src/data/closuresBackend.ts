import {closureApplication} from '../application/closures';
import {closureRepository} from '../infrastructure/closures';
export {closureIconUrl} from '../infrastructure/closures';
export const closures=closureApplication(closureRepository);
