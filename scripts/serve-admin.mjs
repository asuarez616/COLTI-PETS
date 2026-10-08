// Production host: private operations use the existing Supabase owner identity.
import {createStoreAttachmentsMiddleware} from './store-attachments-server.mjs';
import {createServer} from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {loadEnv} from 'vite';
import {createClient} from '@supabase/supabase-js';
import {createFontsMiddleware} from './admin-fonts-server.mjs';
import {createAssetsMiddleware} from './admin-assets-server.mjs';
import {createDriveMiddleware} from './drive-oauth-server.mjs';
const root=process.cwd(),env={...process.env,...loadEnv('production',root,'')};
const origin=env.COLTI_ADMIN_ORIGIN,port=Number(env.COLTI_ADMIN_PORT||3000);
if(!origin||!env.SUPABASE_URL||!env.VITE_SUPABASE_PUBLISHABLE_KEY)throw Error('Configure COLTI_ADMIN_ORIGIN, SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before hosting Admin.');
if(!origin.startsWith('https://')&&!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))throw Error('Admin origin must use HTTPS, except for loopback review.');
const authorize=async req=>{const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];if(!token)return false;const db=createClient(env.SUPABASE_URL,env.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:'Bearer '+token}}});const {data,error}=await db.auth.getUser(token);if(error||!data.user||data.user.is_anonymous)return false;const owner=await db.rpc('is_owner');return !owner.error&&owner.data===true;};
const middleware=createDriveMiddleware({root,origin,env,production:true,authorize});
const assets=createAssetsMiddleware({root,origin,env,authorize});
const attachments=createStoreAttachmentsMiddleware({origin,env});
const fonts=createFontsMiddleware({root,origin,env,authorize});
const dist=resolve(root,'dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf'};
const server=createServer((req,res)=>{if(req.url==='/api/store/attachments'){void attachments(req,res);return;}void fonts(req,res,()=>{void assets(req,res,()=>{void middleware(req,res,()=>{void (async()=>{try{if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}const url=new URL(req.url,origin);let file=resolve(dist,'.'+decodeURIComponent(url.pathname));if(file!==dist&&!file.startsWith(dist+sep)){res.writeHead(404);return res.end();}if(!extname(file))file=joinIndex();const actual=await realpath(file);if(!actual.startsWith(dist+sep))throw Error('OUTSIDE_DIST');const bytes=await readFile(actual);res.writeHead(200,{'Content-Type':mime[extname(actual)]||'application/octet-stream','Cache-Control':extname(actual)==='.html'?'no-store':'public, max-age=3600','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404);res.end('Not found');}})();});});});});
function joinIndex(){return resolve(dist,'index.html');}
server.requestTimeout=1900000;server.listen(port,'127.0.0.1',()=>console.log('COLTI Admin server ready on loopback port '+port+'. Use the configured HTTPS reverse proxy.'));
