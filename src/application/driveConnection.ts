export interface DriveConnectionStatus {configured:boolean;connected:boolean;lastSync:{catalog:string|null;hero:string|null};automatic?:{running:boolean;targets:Record<'catalog'|'hero',{issue:string|null;checkedAt:string|null}>}}
export type DriveSyncTarget='catalog'|'hero';
export interface DriveConnectionRepository {
 status():Promise<DriveConnectionStatus>;
 connect():Promise<{url:string}>;
 disconnect():Promise<void>;
 sync(target:DriveSyncTarget):Promise<void>;
}
export function createDriveConnection(repository:DriveConnectionRepository,authorized:()=>Promise<boolean>){
 async function run<T>(action:()=>Promise<T>){if(!await authorized())throw new Error('Unauthorized');return action();}
 return {status:()=>run(()=>repository.status()),connect:()=>run(()=>repository.connect()),disconnect:()=>run(()=>repository.disconnect()),sync:(target:DriveSyncTarget)=>run(()=>repository.sync(target))};
}
