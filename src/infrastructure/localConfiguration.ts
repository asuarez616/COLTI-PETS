import type {Availability,HeroConfiguration} from '../domain/admin';
const base=import.meta.env.VITE_LOCAL_ADMIN_BRIDGE;
export const localConfigurationEnabled=base==='http://127.0.0.1:4174'&&location.hostname==='127.0.0.1';
export async function readLocalConfiguration():Promise<{overrides:Availability[];hero:HeroConfiguration}>{const response=await fetch(base+'/api/admin/local-orders/configuration',{cache:'no-store'});if(!response.ok)throw Error('LOCAL_SYNC_FAILED');return response.json();}
