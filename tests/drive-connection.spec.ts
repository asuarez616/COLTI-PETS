import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('Drive controls connect, sync, report renewal errors and disconnect',async({page})=>{
 const body=await readFile('tests/fixtures/admin-backend.js','utf8');await page.route('**/src/data/adminBackend.ts*',r=>r.fulfill({contentType:'text/javascript',body}));
 let connected=false,fail=false;const syncs:string[]=[];const lastSync:{catalog:string|null;hero:string|null}={catalog:null,hero:null};
 await page.route('**/api/admin/drive/**',async route=>{const path=new URL(route.request().url()).pathname.split('/').at(-1);let result:object={ok:true},status=200;if(path==='status')result={configured:true,connected,lastSync};else if(path==='connect'){connected=true;result={url:'https://accounts.google.com/o/oauth2/v2/auth?state=mock'};}else if(path==='sync'){const target=route.request().postDataJSON().target;syncs.push(target);if(fail){result={error:'DriveReconnect'};status=400;}else lastSync[target as 'catalog'|'hero']='2026-10-04T18:00:00Z';}else if(path==='disconnect')connected=false;await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});});
 await page.route('https://accounts.google.com/**',r=>r.fulfill({status:302,headers:{Location:'http://127.0.0.1:5173/admin/catalog?drive=connected'}}));
 await page.goto('/admin/catalog');await page.getByRole('button',{name:'Google Drive',exact:true}).click();await expect(page.getByRole('button',{name:'Sync catalog now',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Conectar Google Drive',exact:true}).click();await page.getByRole('button',{name:'Google Drive',exact:true}).click();await expect(page.getByText('Google Drive conectado. Ya puedes sincronizar.')).toBeVisible();
 await page.getByRole('button',{name:'Sync catalog now',exact:true}).click();await expect(page.getByRole('status',{name:/Last Drive sync/})).toBeVisible();expect(syncs).toEqual(['catalog']);await expect(page.getByRole('button',{name:'Sync catalog now'})).toHaveAttribute('title',/Last synced at .* · Click to sync now/);await expect(page.getByRole('button',{name:'Refresh catalog'})).toHaveCount(0);
 await page.goto('/admin/hero');await expect(page.getByText('THEIR EVERYDAY. MADE EXTRAORDINARY.',{exact:true})).toHaveCount(0);await expect(page.locator('.admin-hero-savebar')).toHaveCount(1);await page.getByRole('button',{name:'Google Drive',exact:false}).click();await page.getByRole('button',{name:'Sync hero',exact:true}).click();await expect(page.getByRole('status',{name:/Last Drive sync/})).toBeVisible();expect(syncs).toEqual(['catalog','hero']);
 fail=true;await page.getByRole('button',{name:'Sync hero',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('La autorización venció. Vuelve a conectar Google Drive.');
 await page.getByRole('button',{name:'Desconectar',exact:true}).click();await expect(page.getByRole('button',{name:'Sync hero',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'Desconectar',exact:true})).toHaveCount(0);
});
test('missing Google configuration is visible and does not pretend to connect',async({page})=>{const body=await readFile('tests/fixtures/admin-backend.js','utf8');await page.route('**/src/data/adminBackend.ts*',r=>r.fulfill({contentType:'text/javascript',body}));await page.route('**/api/admin/drive/status',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({configured:false,connected:false,lastSync:{catalog:null,hero:null}})}));await page.goto('/admin/catalog');await page.getByRole('button',{name:'Google Drive',exact:true}).click();await expect(page.getByRole('button',{name:'Conectar Google Drive',exact:true})).toBeDisabled();await expect(page.getByText('Falta configurar la conexión de Google de COLTI en el servidor.')).toBeVisible();});

test('hero disclosure stays compact and chip follows automatic sync',async({page})=>{
 const body=await readFile('tests/fixtures/admin-backend.js','utf8');
 await page.route('**/src/data/adminBackend.ts*',r=>r.fulfill({contentType:'text/javascript',body}));
 let running=false;
 await page.route('**/api/admin/drive/status',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({configured:true,connected:true,lastSync:{catalog:null,hero:'2026-10-05T18:00:00Z'},automatic:{running,targets:{hero:{issue:null,checkedAt:null},catalog:{issue:null,checkedAt:null}}}})}));
 await page.goto('/admin/hero');
 const disclosure=page.getByRole('button',{name:'Google Drive',exact:false});
 await expect(disclosure).toHaveAttribute('aria-expanded','false');
 await expect(page.getByRole('button',{name:'Sync hero',exact:true})).toHaveCount(0);
 await expect(page.getByRole('status',{name:/Last Drive sync/})).toBeVisible();
 running=true;
 await expect(page.getByRole('status',{name:'Syncing Google Drive'})).toHaveText('…');
 running=false;
 await expect(page.getByRole('status',{name:/Last Drive sync/})).toBeVisible();
 await disclosure.click();
 await expect(page.getByRole('button',{name:'Sync hero',exact:true})).toBeVisible();
 await disclosure.click();
 await expect(page.getByRole('button',{name:'Sync hero',exact:true})).toHaveCount(0);
 for(const width of [834,390]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 }
});
