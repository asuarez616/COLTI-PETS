import manifest from './drive-designs.json';
import type {Design} from '../domain/model';
/** Local copy synchronized from Drive. Live orders use the published database catalogue. */
export const driveDesigns:Design[]=manifest.map(d=>({...d,type:d.type as Design['type'],image:import.meta.env.BASE_URL+d.image}));
