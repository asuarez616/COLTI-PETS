import type {IncomingMessage,ServerResponse} from 'node:http';
export function createDriveMiddleware(options:{root:string;origin:string;env:Record<string,string|undefined>;authorize:(request:IncomingMessage)=>Promise<boolean>;production?:boolean}):(req:IncomingMessage,res:ServerResponse,next:()=>void)=>Promise<void>;
