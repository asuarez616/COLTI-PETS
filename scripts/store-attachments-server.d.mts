import type {IncomingMessage,ServerResponse} from 'node:http';
export function createStoreAttachmentsMiddleware(options:{origin:string;env:Record<string,string|undefined>}):(req:IncomingMessage,res:ServerResponse)=>Promise<void>;
