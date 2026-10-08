import {validateLettering,type LetteringCatalog} from '../domain/lettering';
export interface LetteringRepository {load():Promise<LetteringCatalog>;save(value:LetteringCatalog,files:Map<string,File>):Promise<LetteringCatalog>}
export const letteringApplication=(repository:LetteringRepository)=>({load:()=>repository.load(),save:(value:LetteringCatalog,files:Map<string,File>)=>repository.save(validateLettering(value),files)});
