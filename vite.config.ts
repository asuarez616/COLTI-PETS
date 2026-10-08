import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import {resolve,sep} from 'node:path';
import {rmSync,readFileSync} from 'node:fs';
import images from './src/catalog/image-manifest.json';
import fonts from './src/catalog/font-assets.json';
import {createDriveMiddleware} from './scripts/drive-oauth-server.mjs';
import {createLocalOrdersMiddleware} from './scripts/local-orders-server.mjs';
import {createStoreAttachmentsMiddleware} from './scripts/store-attachments-server.mjs';
// Keep source originals for regeneration and uploads; ship only the versions used
// by the image/font adapters. Existing snapshots are resolved by those adapters.
const optimizedAssets={name:'colti-optimized-assets',writeBundle(options:{dir?:string}){const root=resolve(options.dir||'dist');for(const asset of [...Object.keys(images),...Object.keys(fonts),'icons/martingale-reference.png']){const file=resolve(root,asset);if(!file.startsWith(root+sep))throw Error('INVALID_ASSET_PATH');rmSync(file,{force:true});}}};
export default defineConfig(({mode,command}) => {
 const localPreview=mode==='admin-preview';
 const serverEnv={...process.env,...loadEnv(mode,process.cwd(),'')};
 const storeAttachments=mode==='production'&&serverEnv.SUPABASE_URL&&serverEnv.SUPABASE_SERVICE_ROLE_KEY&&serverEnv.VITE_SUPABASE_PUBLISHABLE_KEY?{name:'colti-local-store-attachments',configureServer(server:import('vite').ViteDevServer){server.middlewares.use('/api/store/attachments',createStoreAttachmentsMiddleware({origin:`http://127.0.0.1:${server.config.server.port}`,env:serverEnv}));}}:null;
 const driveOAuth={name:'colti-local-drive-oauth',configureServer(server:import('vite').ViteDevServer){server.middlewares.use(createDriveMiddleware({root:process.cwd(),origin:'http://127.0.0.1:4174',env:serverEnv,authorize:async req=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress||'')}));server.middlewares.use(createLocalOrdersMiddleware({root:process.cwd(),loadDomain:async()=>({...await server.ssrLoadModule('/src/domain/validation.ts'),...await server.ssrLoadModule('/src/domain/admin.ts')})}));}};
 if(localPreview&&command!=='serve')throw new Error('Admin preview is local-only and cannot be built for deployment.');
 const previewAdapter={name:'colti-local-admin-preview',enforce:'pre' as const,load(id:string){if(id.replaceAll('\\','/').endsWith('/src/data/adminBackend.ts'))return readFileSync(resolve('scripts/admin-preview-backend.js'),'utf8');},transform(code:string,id:string){if(id.replaceAll('\\','/').endsWith('/src/admin/Admin.tsx'))return code.replace('<header className="admin-header">','<p role="status" className="admin-error">Panel local · pedidos generados en esta instalación · sin conexión de producción</p><header className="admin-header">');}};
 return {plugins:[...(localPreview?[previewAdapter,driveOAuth]:[]),...(storeAttachments?[storeAttachments]:[]),react(),optimizedAssets],base:serverEnv.VITE_BASE_PATH||'/',server:{host:'127.0.0.1',port:localPreview?4174:5173,strictPort:localPreview,watch:{ignored:['**/artifacts/**','**/test-results/**','**/sources/**','**/.asset-tools/private/**']}},build:{target:'es2022',rollupOptions:{output:{manualChunks:{react:['react','react-dom'],supabase:['@supabase/supabase-js']}}}}};
});
