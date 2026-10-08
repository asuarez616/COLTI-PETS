// Builds a reviewable SQL bundle for a NEW, empty COLTI project only.
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
let sql='-- COLTI fresh-project bootstrap. Never apply to an existing database.\nBEGIN;\n';
for(const name of (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort())sql+='\n-- '+name+'\n'+await readFile('supabase/migrations/'+name,'utf8');
const seed=await readFile('supabase/seed.sql','utf8');sql+='\n'+seed.slice(0,seed.indexOf('insert into public.designs'));
sql+='\n'+(await readFile('supabase/seed-fonts.sql','utf8')).replaceAll("'plates/","'/fonts/plates/");
const designs=JSON.parse(await readFile('src/catalog/drive-designs.json','utf8'));let index=0;
for(const d of designs){sql+=`\ninsert into public.designs(id,code,type,image_path,active,is_test_data,display_order,asset_version) values(${q(d.id)},${q(d.code)},${q(d.type)},${q('/'+d.image)},${!!d.active},false,${index++},${q(d.asset_version)}) on conflict(id) do nothing;`;
for(const c of d.compatibility)sql+=`\ninsert into public.design_compatibility(design_id,size_code,width_cm) values(${q(d.id)},${q(c.size_code)},${Number(c.width_cm)}) on conflict do nothing;`;}
sql+='\nCOMMIT;\n';await mkdir('audits/phase-24',{recursive:true});await writeFile('audits/phase-24/fresh-project-bootstrap.sql',sql);console.log('Prepared SQL bootstrap: '+designs.length+' real Drive designs, no demonstration orders or test designs.');
