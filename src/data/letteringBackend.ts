import {letteringApplication} from '../application/lettering';
import {letteringRepository} from '../infrastructure/lettering';
export const lettering=letteringApplication(letteringRepository);
