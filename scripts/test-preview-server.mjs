import {spawnSync} from 'node:child_process';
// Isolate the static demo test from the owner's live Supabase build/server.
process.env.PORT='4177';
process.env.COLTI_PREVIEW_ROOT='artifacts/static-test-dist';
const build=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',process.env.COLTI_PREVIEW_ROOT],{stdio:'inherit',env:{...process.env,VITE_SUPABASE_URL:'',VITE_SUPABASE_PUBLISHABLE_KEY:'',VITE_ALLOW_DEMO:'true',VITE_LOCAL_ADMIN_BRIDGE:''}});
if(build.status!==0)process.exit(build.status||1);
await import('./serve-preview.mjs');
