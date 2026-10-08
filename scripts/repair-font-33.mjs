// Repair the supplied file's incorrect OS/2 version marker, preserving glyphs.
// Reference: https://learn.microsoft.com/en-us/typography/opentype/spec/os2
import {readFile,writeFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
const input=await readFile(new URL('../public/fonts/plates/33.woff',import.meta.url));
assert.equal(input.toString('ascii',0,4),'wOFF');
const count=input.readUInt16BE(12),tables=[];
for(let n=0;n<count;n++){const at=44+n*20,tag=input.toString('ascii',at,at+4),offset=input.readUInt32BE(at+4),compressed=input.readUInt32BE(at+8),length=input.readUInt32BE(at+12);const original=compressed<length?inflateSync(input.subarray(offset,offset+compressed)):input.subarray(offset,offset+length);assert.equal(original.length,length);tables.push({tag,original:Buffer.from(original),bytes:Buffer.from(original)});}
const os2=tables.find(t=>t.tag==='OS/2');assert.equal(os2.bytes.length,96);assert.equal(os2.bytes.readUInt16BE(0),5);os2.bytes.writeUInt16BE(4,0);
const head=tables.find(t=>t.tag==='head');head.bytes.writeUInt32BE(0,8);
const padded=n=>(n+3)&~3;
function checksum(b){const p=Buffer.alloc(padded(b.length));b.copy(p);let sum=0;for(let n=0;n<p.length;n+=4)sum=(sum+p.readUInt32BE(n))>>>0;return sum;}
tables.sort((a,b)=>a.tag.localeCompare(b.tag,'en',{sensitivity:'variant'}));
const total=12+16*count+tables.reduce((n,t)=>n+padded(t.bytes.length),0);const output=Buffer.alloc(total);output.writeUInt32BE(input.readUInt32BE(4),0);output.writeUInt16BE(count,4);const power=2**Math.floor(Math.log2(count));output.writeUInt16BE(power*16,6);output.writeUInt16BE(Math.log2(power),8);output.writeUInt16BE(count*16-power*16,10);
let offset=12+count*16;
for(let n=0;n<count;n++){const t=tables[n],at=12+n*16;t.offset=offset;output.write(t.tag,at,4,'ascii');output.writeUInt32BE(checksum(t.bytes),at+4);output.writeUInt32BE(offset,at+8);output.writeUInt32BE(t.bytes.length,at+12);t.bytes.copy(output,offset);offset+=padded(t.bytes.length);if(!['OS/2','head'].includes(t.tag))assert.deepEqual(output.subarray(t.offset,t.offset+t.bytes.length),t.original);}
output.writeUInt32BE((0xb1b0afba-checksum(output))>>>0,head.offset+8);
assert.equal(checksum(output),0xb1b0afba);
await writeFile(new URL('../public/fonts/plates/33.ttf',import.meta.url),output);
console.log('Font 33 repaired: OS/2 v4 marker and checksums. Glyph/name tables unchanged.');
