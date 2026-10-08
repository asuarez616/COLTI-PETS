import {afterEach,expect,it,vi} from 'vitest';
vi.mock('./supabaseRepositories',()=>({supabase:{from:()=>({select:()=>({order:async()=>({data:[],error:null})})}),storage:{from:()=>({getPublicUrl:(path:string)=>({data:{publicUrl:'https://colti.example/storage/'+path}})})}}}));
import {loadHeroImages} from './heroImages';
afterEach(()=>vi.unstubAllGlobals());
it('reads the current published source without relying on the compiled list',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify([{id:'new',name:'New.png',width:800,height:1000,variants:[{file:'editorial/drive/new-800.webp',width:800,height:1000,bytes:200}]}]))));
 const source=await loadHeroImages();expect(source[0].id).toBe('new');expect(source[0].variants[0].file).toBe('https://colti.example/storage/editorial/drive/new-800.webp');
});
it('fails a broken or unsafe source so reconciliation retains its previous good data',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('Unavailable',{status:503})));await expect(loadHeroImages()).rejects.toThrow('Hero source unavailable');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify([{id:'new',name:'New',width:800,height:1000,variants:[{file:'editorial/../private.png',width:800,height:1000}]}]))));await expect(loadHeroImages()).rejects.toThrow('Invalid hero source');
});
