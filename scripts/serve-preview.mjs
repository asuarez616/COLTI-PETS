import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.env.COLTI_PREVIEW_ROOT||'dist'),base=process.env.COLTI_PREVIEW_BASE||'/',port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.json':'application/json'};
http.createServer(async(req,res)=>{
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!pathname.startsWith(base)){res.writeHead(404).end();return;}const file=resolve(root,pathname.slice(base.length)||'index.html');if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}const s=await stat(file);if(!s.isFile()){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file));}catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`COLTI preview: http://127.0.0.1:${port}${base}`));
