import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
const file=process.argv[2];if(!file)throw Error('Provide the locally downloaded OAuth JSON path');
const {web}=JSON.parse(await readFile(file,'utf8'));
if(!web?.client_id||!web.client_secret||web.project_id!=='plenary-osprey-510716-f0'||!web.redirect_uris?.includes('http://127.0.0.1:4176/api/admin/drive/callback'))throw Error('OAuth configuration does not match the approved COLTI project and callback');
const target='.env.production.local';let env=await readFile(target,'utf8');
const entries={GOOGLE_OAUTH_CLIENT_ID:web.client_id,GOOGLE_OAUTH_CLIENT_SECRET:web.client_secret};
if(!/^GOOGLE_OAUTH_TOKEN_KEY=/m.test(env))entries.GOOGLE_OAUTH_TOKEN_KEY=randomBytes(32).toString('base64');
for(const [name,value] of Object.entries(entries)){
 const line=name+'='+value;
 env=new RegExp('^'+name+'=.*$','m').test(env)?env.replace(new RegExp('^'+name+'=.*$','m'),line):env.trimEnd()+'\n'+line+'\n';
}
await writeFile(target,env,{mode:0o600});
console.log('COLTI OAuth client installed in server-only local configuration. No credentials printed.');
