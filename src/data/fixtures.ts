import { sizes, type Design, type FontRecord } from '../domain/model';
import manifest from '../catalog/font-manifest.json';
const pairs=sizes.flatMap(s=>s.widths.map(w=>({size_code:s.code,width_cm:w})));
export const fixtureDesigns:Design[]=[
 {id:'10000000-0000-4000-8000-000000000001',code:'CH-17-1',type:'woven',image:import.meta.env.BASE_URL+'catalog/CH-17-1.png',active:true,is_test_data:true,asset_version:'test-v1',compatibility:pairs},
 {id:'10000000-0000-4000-8000-000000000002',code:'TEST-PRINTED-02',type:'printed',image:import.meta.env.BASE_URL+'catalog/design-test-02.png',active:true,is_test_data:true,asset_version:'test-v1',compatibility:pairs}
];
export const fixtureFonts:FontRecord[]=manifest.map(f=>({number:f.number,label:f.label,state:'ready',asset_path:import.meta.env.BASE_URL+`fonts/plates/${String(f.number).padStart(2,'0')}.${f.file.split('.').at(-1)}`,css_family:`colti-plate-${f.number}`,active:true,asset_version:'letras-2025-v1',presentation:{size:f.size,weight:'weight' in f?f.weight:400,transform:'transform' in f?f.transform:'none'}}));
