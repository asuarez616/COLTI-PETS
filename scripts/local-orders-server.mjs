import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {join} from 'node:path';
export function createLocalOrdersMiddleware({root,loadDomain,origin:serverOrigin='http://127.0.0.1:4174',allowedOrigins=['http://127.0.0.1:4173','http://127.0.0.1:4176','http://127.0.0.1:5173','http://127.0.0.1:4174']}){
 const dir=join(root,'.asset-tools/private'),file=join(dir,'local-orders.json');let queue=Promise.resolve();const streams=new Set();const configFile=join(dir,'local-configuration.json');
 async function config(){try{return JSON.parse(await readFile(configFile,'utf8'));}catch(e){if(e.code==='ENOENT')return {overrides:[],hero:{revision:0,images:[]}};throw e;}}
 async function saveConfig(value){await mkdir(dir,{recursive:true});await writeFile(configFile+'.tmp',JSON.stringify(value),{mode:0o600});await rename(configFile+'.tmp',configFile);}
 function notify(resource){for(const stream of streams)stream.write('event: invalidate\ndata: '+JSON.stringify({resource})+'\n\n');}

 async function read(){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return [];throw e;}}
 async function write(data){await mkdir(dir,{recursive:true});await writeFile(file+'.tmp',JSON.stringify(data),{mode:0o600});await rename(file+'.tmp',file);notify('orders');}
 async function locked(work){const previous=queue;let release;queue=new Promise(r=>{release=r;});await previous;try{return await work();}finally{release();}}
 function reply(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
 return async(req,res,next)=>{
  const url=new URL(req.url,serverOrigin);if(!url.pathname.startsWith('/api/admin/local-orders'))return next();
  const origin=req.headers.origin;if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress||'')||(origin&&!allowedOrigins.includes(origin))||req.headers.host!==new URL(serverOrigin).host)return reply(res,403,{error:'Unauthorized'});
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');}
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  try{
   const path=url.pathname.slice('/api/admin/local-orders'.length);
   if(path==='/events'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive'});res.write('retry: 2000\n\n');streams.add(res);const timer=setInterval(()=>res.write(': heartbeat\n\n'),15000);timer.unref();res.on('close',()=>{clearInterval(timer);streams.delete(res);});return;}
   if(path==='/configuration'&&req.method==='GET')return reply(res,200,await config());
   if(path==='/status'&&req.method==='GET')return reply(res,200,{local:true});
   if(path.startsWith('/files/')){
    const id=path.slice('/files/'.length);if(!/^[a-zA-Z0-9_-]{1,200}$/.test(id))throw Error('INVALID_FILE');
    const data=await read(),attachment=data.flatMap(d=>d.order.items.flatMap(i=>i.attachments)).find(a=>a.id===id);if(!attachment)return reply(res,404,{error:'FILE_UNAVAILABLE'});
    const target=join(dir,'local-files',id);
    if(req.method==='GET'){const bytes=await readFile(target);res.writeHead(200,{'Content-Type':attachment.mime_type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(bytes);}
    if(req.method==='POST'&&origin){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>10485760)throw Error('INVALID_FILE');chunks.push(chunk);}const bytes=Buffer.concat(chunks);const mime=req.headers['content-type'];const valid=(mime==='image/png'&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))||(mime==='image/jpeg'&&bytes[0]===255&&bytes[1]===216)||(mime==='image/webp'&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP');if(!valid||bytes.length!==attachment.byte_size||mime!==attachment.mime_type)throw Error('INVALID_FILE');await mkdir(join(dir,'local-files'),{recursive:true});await writeFile(target+'.tmp',bytes,{mode:0o600});await rename(target+'.tmp',target);return reply(res,200,{ok:true});}
    throw Error('INVALID_FILE');
   }
   if(req.method==='GET'){
    const data=await read();if(path){const detail=data.find(d=>d.order.id===decodeURIComponent(path.slice(1)));return reply(res,200,detail||null);}
    const search=(url.searchParams.get('search')||'').toLowerCase(),status=url.searchParams.get('status'),from=url.searchParams.get('from'),to=url.searchParams.get('to'),page=Math.max(0,Number(url.searchParams.get('page'))||0);
    return reply(res,200,data.map(d=>d.order).filter(o=>(!from||Date.parse(o.confirmed_at)>=Date.parse(from))&&(!to||Date.parse(o.confirmed_at)<Date.parse(to))&&(!status||(o.status==='finished'?'ready':o.status)===status)&&[o.order_code,o.customer_snapshot.name,o.customer_snapshot.phone,...o.items.map(i=>i.pet_name)].join(' ').toLowerCase().includes(search)).sort((a,b)=>Date.parse(b.confirmed_at)-Date.parse(a.confirmed_at)).slice(page*20,page*20+20));
   }
   if(req.method!=='POST'||!origin||!req.headers['content-type']?.startsWith('application/json'))return reply(res,405,{error:'Unauthorized'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>2097152)throw Error('INVALID_DATA');}const body=JSON.parse(raw||'{}'),domain=await loadDomain();
   const result=await locked(async()=>{
    if(['/availability','/availability-batch','/hero','/migrate-configuration'].includes(path)){const value=await config();
     if(path==='/availability-batch'){const changes=body.changes;if(!Array.isArray(changes)||!changes.length||changes.length>500||new Set(changes.map(c=>domain.availabilityKey(c))).size!==changes.length)throw Error('INVALID_DATA');for(const c of changes){if(typeof c.designId!=='string'||!Number.isFinite(c.width)||c.width<0||typeof c.enabled!=='boolean'||!Number.isSafeInteger(c.revision))throw Error('INVALID_DATA');const old=value.overrides.find(a=>domain.availabilityKey(a)===domain.availabilityKey(c));if(c.revision!==(old?.revision??0))throw Error('STATE_CONFLICT');}const saved=changes.map(c=>({...c,revision:c.revision+1}));value.overrides=[...value.overrides.filter(a=>!saved.some(c=>domain.availabilityKey(c)===domain.availabilityKey(a))),...saved];await saveConfig(value);notify('catalog');return saved;}
     if(path==='/availability'){const c=body.change;if(!c||typeof c.designId!=='string'||!Number.isFinite(c.width)||c.width<0||typeof c.enabled!=='boolean'||!Number.isSafeInteger(c.revision))throw Error('INVALID_DATA');const old=value.overrides.find(a=>domain.availabilityKey(a)===domain.availabilityKey(c));if(c.revision!==(old?.revision??0))throw Error('STATE_CONFLICT');const change={...c,revision:c.revision+1};value.overrides=[...value.overrides.filter(a=>!(domain.availabilityKey(a)===domain.availabilityKey(c))),change];await saveConfig(value);notify('catalog');return change;}
     if(path==='/hero'){if(!domain.validHeroConfiguration(body.configuration))throw Error('INVALID_DATA');if(body.configuration.revision!==value.hero.revision)throw Error('STATE_CONFLICT');value.hero={...body.configuration,revision:value.hero.revision+1};await saveConfig(value);notify('hero');return value.hero;}
     // One-time preservation of the previous local Admin settings.
     try{await readFile(configFile);return value;}catch(e){if(e.code!=='ENOENT')throw e;}
     if(!Array.isArray(body.overrides)||body.overrides.some(c=>typeof c.designId!=='string'||!Number.isFinite(c.width)||c.width<0||typeof c.enabled!=='boolean'||!Number.isSafeInteger(c.revision)||c.revision<0)||!domain.validHeroConfiguration(body.hero))throw Error('INVALID_DATA');await saveConfig({overrides:body.overrides,hero:body.hero});notify('catalog');notify('hero');return {overrides:body.overrides,hero:body.hero};
    }
    const data=await read();
    if(path==='/import'){if(!Array.isArray(body.orders)||body.orders.length>500)throw Error('INVALID_DATA');let added=0;for(const value of body.orders){const order=domain.parseOrder(value);if(order.demo!==true||!order.order_code.startsWith('DEMO-'))throw Error('INVALID_DATA');const existing=data.find(d=>d.order.id===order.id||d.order.key&&d.order.key===order.key);if(existing)continue;data.push({order,note:''});added++;}if(added)await write(data);return {added};}
    const detail=data.find(d=>d.order.id===decodeURIComponent(path.slice(1)));if(!detail)throw Error('ORDER_NOT_FOUND');if(body.updated!==detail.order.updated_at)throw Error('STATE_CONFLICT');if(body.status!==undefined){if(!domain.nextStatuses(detail.order.status).includes(body.status))throw Error('INVALID_TRANSITION');if(body.reason!==undefined&&(typeof body.reason!=='string'||body.reason.length>1000||body.status!=='cancelled'&&body.reason))throw Error('INVALID_DATA');detail.order.status=body.status;if(body.status==='cancelled')detail.cancellationReason=(body.reason||'').trim();}else if(typeof body.note==='string'&&body.note.length<=4000)detail.note=body.note;else throw Error('INVALID_DATA');detail.order.updated_at=new Date(Math.max(Date.now(),Date.parse(detail.order.updated_at)+1)).toISOString();await write(data);return detail;
   });return reply(res,200,result);
  }catch(e){return reply(res,e.message==='STATE_CONFLICT'?409:400,{error:['STATE_CONFLICT','INVALID_TRANSITION','ORDER_NOT_FOUND'].includes(e.message)?e.message:'INVALID_DATA'});}
 };
}
