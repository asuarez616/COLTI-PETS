import {heroImageSource,publicHeroConfiguration} from '../infrastructure/admin';
import {validHeroConfiguration,type HeroConfiguration} from '../domain/admin';
export async function getHeroState(){const [source,configuration]=await Promise.all([heroImageSource.load(),getHeroConfiguration()]);return {source,configuration};}
export async function getHeroConfiguration():Promise<HeroConfiguration>{const value=await publicHeroConfiguration();if(!validHeroConfiguration(value))throw new Error('Invalid hero configuration');return value;}
