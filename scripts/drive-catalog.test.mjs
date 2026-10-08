import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildDesigns,designId,listDriveImages,widths,assetId} from './drive-catalog-core.mjs';
const {groups}=JSON.parse(readFileSync(new URL('../catalog-drive-sources.json',import.meta.url)));
test('Drive catalogue applies all four size groups and all valid widths',()=>{
 const designs=buildDesigns(groups.map((g,i)=>({id:'file'+i,name:'design'+i+'.png',mimeType:'image/png',group:g.folderId})),groups);
 for(const [i,g] of groups.entries()){
  const d=designs.find(d=>d.id===designId('file'+i));
  for(const [size,ws] of Object.entries(widths))for(const width of ws)assert.equal(d.compatibility.some(p=>p.size_code===size&&p.width_cm===width),g.sizes.includes(size));
 }
});
test('Stable ids survive renames; non-images are ignored',()=>{
 const f={id:'same',name:'one.png',mimeType:'image/png',group:groups[0].folderId};
 assert.equal(buildDesigns([f],groups)[0].id,buildDesigns([{...f,name:'renamed.png'}],groups)[0].id);
 assert.equal(buildDesigns([{...f,mimeType:'application/pdf'}],groups).length,0);
});
test('Listings read all pages and nested folders, including empty S/SM',async()=>{
 const calls=[];
 const files=await listDriveImages(groups,async url=>{
  const p=new URL(url).searchParams;calls.push(p);const q=p.get('q');
  if(q.includes(groups[0].folderId)&&!p.has('pageToken'))return {files:[{id:'nested',name:'Floral',mimeType:'application/vnd.google-apps.folder'}],nextPageToken:'second'};
  if(q.includes(groups[0].folderId))return {files:[{id:'a',name:'a.png',mimeType:'image/png'}]};
  if(q.includes('nested'))return {files:[{id:'b',name:'b.jpg',mimeType:'image/jpeg'}]};
  return {files:[]};
 });
 assert.deepEqual(files.map(f=>f.id).sort(),['a','b']);assert.equal(files[0].category,'Floral');
 assert.ok(calls.some(p=>p.get('pageToken')==='second'));
 assert.ok(calls.some(p=>p.get('q').includes(groups[2].folderId)));
});
test('Failed folder reads abort synchronization instead of erasing catalogue',async()=>{
 await assert.rejects(listDriveImages(groups,async()=>{throw new Error('403');}),/403/);
});
test('Replaced images receive immutable paths while design identity stays stable',()=>{
 const f={id:'same',name:'one.png',mimeType:'image/png',group:groups[0].folderId,md5Checksum:'before'};
 const a=buildDesigns([f],groups)[0],b=buildDesigns([{...f,md5Checksum:'after'}],groups)[0];
 assert.equal(a.id,b.id);assert.notEqual(a.image,b.image);assert.equal(assetId(f),assetId({...f,name:'rename.png'}));
});
