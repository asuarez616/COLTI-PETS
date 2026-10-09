import {afterEach,it,expect,vi} from 'vitest';
import {printShippingLabels} from './ShippingLabel';
import type {Order} from '../domain/model';
afterEach(()=>vi.unstubAllGlobals());

const order=(id:string,name='Ana',petNames=['Luna & Sol'])=>({
 id,
 order_code:`COLTI-US-${id}`,
 status:'ready',
 confirmed_at:'2026-10-08T12:00:00Z',
 updated_at:'2026-10-08T12:00:00Z',
 customer_snapshot:{name,phone:'+593 99 123 4567'},
 shipping_address:{line1:'Av. República 123',line2:'Departamento 4',city:'Quito',region:'Pichincha',postalCode:'170135',country:'Ecuador'},
 items:petNames.map((pet_name,index)=>({id:`item-${index}`,pet_name}))
}) as unknown as Order;

it('prints one monochrome option B 4 × 6 inch page per order',()=>{
 vi.stubGlobal('window',{location:{origin:'https://colti.test'}});
 const write=vi.fn();
 const target={document:{open:vi.fn(),write,close:vi.fn()}} as unknown as Window;
 expect(printShippingLabels([order('0001','Ana <Suárez>'),order('0002')],target)).toBe(true);
 const html=write.mock.calls[0][0] as string;
 expect(html).toContain('@page{size:4in 6in;margin:0}');
 expect(html).toContain('<header class="top">');
 expect(html).toContain('PARA · ENTREGAR A');
 expect(html).toContain('CONTENIDO · Accesorio para mascota');
 expect(html).toContain('brand/colti-logo-rosa.svg');
 expect(html).toContain('brand/colti-symbol-burgundy.svg');
 expect(html).toContain('CI 1719347229001');
 expect(html).toContain('color:#161616');
 expect(html.match(/<main class="label">/g)).toHaveLength(2);
 expect(html).toContain('Ana &lt;Suárez&gt;');
 expect(html).toContain('Luna &amp; Sol');
 expect(html).toContain('Quito, Pichincha · 170135 · Ecuador');
 expect(html).toContain('FRÁGIL');
 expect(target.document.close).toHaveBeenCalledOnce();
});

it('shows every pet name and uses the compact treatment for a larger household',()=>{
 vi.stubGlobal('window',{location:{origin:'https://colti.test'}});
 const write=vi.fn();
 const target={document:{open:vi.fn(),write,close:vi.fn()}} as unknown as Window;
 const names=['Pepino','Toyo','Susi','Lolu','Filomena','Nube','Bruno','Kira','Max','Luna'];
 expect(printShippingLabels([order('0003','Ana',names)],target)).toBe(true);
 const html=write.mock.calls[0][0] as string;
 expect(html).toContain('class="pet-name pet-name--dense"');
 for(const name of names)expect(html).toContain(name);
});

it('refuses to print if any selected order has no complete postal address',()=>{
 vi.stubGlobal('window',{location:{origin:'https://colti.test'}});
 const write=vi.fn();
 const target={document:{open:vi.fn(),write,close:vi.fn()}} as unknown as Window;
 expect(printShippingLabels([order('0001'),{...order('0002'),shipping_address:null}],target)).toBe(false);
 expect(write).not.toHaveBeenCalled();
});