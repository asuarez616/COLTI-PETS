import type {IncomingMessage,ServerResponse} from 'node:http';
export function createLocalOrdersMiddleware(options:{root:string;origin?:string;loadDomain:()=>Promise<unknown>;allowedOrigins?:string[]}):(req:IncomingMessage,res:ServerResponse,next:()=>void)=>Promise<void>;
