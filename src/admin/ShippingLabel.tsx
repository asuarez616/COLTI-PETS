import {useEffect,useState} from 'react';
import {AdminError,validShippingAddress} from '../domain/admin';
import type {Order,ShippingAddress} from '../domain/model';

const emptyAddress:ShippingAddress={line1:'',line2:'',city:'',region:'',postalCode:'',country:''};
const sender={name:'Erick Perez',taxId:'1719347229001',phone:'095876497',address:'Humberto Salvador S3-130 y Rita Lecumberry',city:'Quito'};
const htmlEntities:Record<string,string>={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,character=>htmlEntities[character]||character);
const assetUrl=(path:string)=>new URL(`${import.meta.env.BASE_URL}${path}`,window.location.origin).href;

function labelMarkup(order:Order){
 const address=order.shipping_address!;
 const petNames=order.items.map(item=>item.pet_name.trim()).filter(Boolean);
 const petText=petNames.join(' · ');
 const petClass=petNames.length>7||petText.length>78?' pet-name--dense':petNames.length>1?' pet-name--multiple':'';
 const fullName=escapeHtml(order.customer_snapshot.name);
 const cityLine=[address.city,address.region].filter(Boolean).join(', ');
 const locality=[cityLine,[address.postalCode,address.country].filter(Boolean).join(' · ')].filter(Boolean).join(' · ');
 const recipientLines=[address.line1,address.line2].filter(Boolean).map(escapeHtml).join('<br>');
 const logo=escapeHtml(assetUrl('brand/colti-logo-rosa.svg'));
 const seal=escapeHtml(assetUrl('brand/colti-symbol-burgundy.svg'));
 return `<main class="label">
   <header class="top">
     <div class="brand"><img class="brand-logo" src="${logo}" alt="COLTI" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="brand-fallback" hidden>COLTI</span></div>
     <section class="from" aria-label="Remitente">
       <p class="kicker">DE · REMITENTE</p>
       <p class="from-name">${escapeHtml(sender.name)}</p>
       <p class="from-info">CI ${escapeHtml(sender.taxId)} · ${escapeHtml(sender.phone)}<br>${escapeHtml(sender.address)}<br>${escapeHtml(sender.city)}</p>
     </section>
   </header>
   <section class="recipient" aria-label="Destinatario">
     <p class="kicker">PARA · ENTREGAR A</p>
     <h1 class="to-name">${fullName}</h1>
     <p class="to-phone">${escapeHtml(order.customer_snapshot.phone)}</p>
     <p class="to-address">${recipientLines}${locality?`<span class="to-city">${escapeHtml(locality)}</span>`:''}</p>
   </section>
   <section class="order" aria-label="Número de pedido">
     <div><p class="kicker">NÚMERO DE PEDIDO</p><p class="order-code">${escapeHtml(order.order_code)}</p></div>
     <div class="fragile" aria-label="Frágil">
       <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h16l-2.1 11.2a7 7 0 0 1-5.9 5.8v5h5v2H11v-2h5v-5a7 7 0 0 1-5.9-5.8L8 4Z"/><path d="m18 7-3 5 3 1-3 5"/></svg>
       <span>FRÁGIL</span>
     </div>
   </section>
   ${petText?`<section class="pet" aria-label="Mascotas del pedido"><p class="kicker">PREPARADO CON CARIÑO PARA</p><p class="pet-name${petClass}">${escapeHtml(petText)}</p></section>`:''}
   <footer class="footer"><p class="note">CONTENIDO · Accesorio para mascota</p><div class="footer-mark" aria-hidden="true"><img class="seal-logo" src="${seal}" alt=""></div></footer>
 </main>`;
}

function printDocument(orders:Order[]){
 const fontUrl=escapeHtml(assetUrl('fonts/Montserrat/Montserrat-VariableFont_wght.woff2'));
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>COLTI · Etiquetas de envío</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet"><style>
   @font-face{font-family:Montserrat;src:url('${fontUrl}') format('woff2');font-style:normal;font-weight:100 900;font-display:swap}
   *{box-sizing:border-box}
   html,body{margin:0;min-height:100%;background:#efede9;color:#161616;font-family:Montserrat,Arial,sans-serif}
   body{display:grid;justify-items:center;gap:14px;padding:36px 16px}
   .screen-note{position:fixed;top:10px;left:50%;transform:translateX(-50%);color:#4d4d4d;font:500 12px Montserrat,Arial,sans-serif;white-space:nowrap}
   .label{width:4in;height:6in;padding:.25in .27in .22in;background:#fff;display:flex;flex-direction:column;overflow:hidden;page-break-after:always;break-after:page}
   .label:last-of-type{page-break-after:auto;break-after:auto}
   .top{display:grid;grid-template-columns:1.58in 1fr;gap:.12in;align-items:center;padding:0 0 .15in;border-bottom:1.5px solid #333}
   .brand{min-height:.88in;display:flex;align-items:center;gap:6px}
   .brand-logo{width:1.45in;height:.87in;object-fit:contain;object-position:left center;filter:grayscale(1) brightness(0)}
   .brand-fallback{font:700 14pt/1 Montserrat,Arial,sans-serif;letter-spacing:3px}
   .from{min-width:0;border-left:1px solid #777;padding-left:.16in}
   .kicker{margin:0 0 5px;color:#4d4d4d;font:700 7pt/1.2 Montserrat,Arial,sans-serif;letter-spacing:1.35px}
   .from-name{margin:0 0 3px;font:600 13pt/1.15 'Playfair Display',Georgia,serif;overflow-wrap:anywhere}
   .from-info{margin:0;color:#333;font:500 9pt/1.3 Montserrat,Arial,sans-serif;overflow-wrap:anywhere}
   .recipient{display:block;min-width:0;padding:.17in 0;border-bottom:1px solid #777}
   .to-name{margin:0 0 6px;font:600 21pt/1.08 'Playfair Display',Georgia,serif;overflow-wrap:anywhere}
   .to-phone{margin:0 0 7px;font:600 10pt/1.25 Montserrat,Arial,sans-serif;overflow-wrap:anywhere}
   .to-address{margin:0;color:#333;font:400 9pt/1.35 Montserrat,Arial,sans-serif;overflow-wrap:anywhere}
   .to-city{display:block;margin-top:.08in;font-weight:400}
   .order{padding:.13in 0 .12in;border-bottom:1px solid #777;display:flex;justify-content:space-between;align-items:center;gap:10px}
   .order .kicker{margin-bottom:3px}
   .order-code{margin:0;font:600 14pt/1.1 'Playfair Display',Georgia,serif;letter-spacing:.25px;overflow-wrap:anywhere}
   .fragile{flex:none;width:.48in;display:grid;justify-items:center;gap:2px;color:#161616}
   .fragile svg{display:block;width:.28in;height:.28in}
   .fragile span{font:700 6pt/1 Montserrat,Arial,sans-serif;letter-spacing:.8px}
   .pet{margin-top:auto;padding:.13in 0 .12in;border-bottom:1.5px solid #333}
   .pet-name{margin:0;font:600 20pt/1.1 'Playfair Display',Georgia,serif;overflow-wrap:anywhere}
   .pet-name--multiple{font-size:16pt;line-height:1.2}
   .pet-name--dense{font-size:12pt;line-height:1.2}
   .footer{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:.07in}
   .note{max-width:2.5in;margin:0;color:#333;font:500 7pt/1.3 Montserrat,Arial,sans-serif;letter-spacing:.2px}
   .footer-mark{flex:none;width:.32in;height:.32in;border:1px solid #161616;border-radius:50%;display:grid;place-items:center}
   .seal-logo{width:.22in;height:.22in;object-fit:contain;filter:grayscale(1) brightness(0)}
   @page{size:4in 6in;margin:0}
   @media print{html,body{width:4in!important;margin:0!important;background:#fff}body{display:block;padding:0}.screen-note{display:none}.label{margin:0;print-color-adjust:exact;-webkit-print-color-adjust:exact}}
 </style></head><body><div class="screen-note">COLTI · Etiqueta de envío · 4 × 6 in</div>${orders.map(labelMarkup).join('')}<script>window.addEventListener('load',async()=>{await Promise.all(Array.from(document.images,image=>image.decode().catch(()=>undefined)));if(document.fonts)await document.fonts.ready;window.focus();window.print()})</script></body></html>`;
}

export function printShippingLabels(orders:Order[],target?:Window|null):boolean{
 if(!orders.length||orders.some(order=>!order.shipping_address||!validShippingAddress(order.shipping_address)))return false;
 const printWindow=target===undefined?window.open('','_blank'):target;
 if(!printWindow)return false;
 printWindow.document.open();
 printWindow.document.write(printDocument(orders));
 printWindow.document.close();
 return true;
}

export function ShippingLabel({order,onSave}:{order:Order;onSave:(address:ShippingAddress)=>Promise<Order>}){
 const [address,setAddress]=useState<ShippingAddress>(order.shipping_address||emptyAddress),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>setAddress(order.shipping_address||emptyAddress),[order.id,order.updated_at]);
 const valid=validShippingAddress(address),saved=!!order.shipping_address&&validShippingAddress(order.shipping_address)&&JSON.stringify(order.shipping_address)===JSON.stringify(address);
 async function save(){
  if(!valid||busy)return;
  setBusy(true);setMessage('');
  try{await onSave(address);setMessage('Shipping address saved.');}
  catch(error){setMessage(error instanceof AdminError&&error.code==='ShippingSetupRequired'?'Supabase does not recognize the shipping-label function. Apply migration 202610080001_shipping_labels.sql (it also reloads the schema), then refresh.':error instanceof AdminError&&error.code==='Conflict'?'This order changed in another session. Refresh the order and save the address again.':'Could not save the address. Check your access and retry.');}
  finally{setBusy(false);}
 }
 return <section className="admin-panel admin-shipping-panel">
  <h2>COLTI shipping label · 4 × 6 in</h2>
  <p className="admin-hint">Black-and-white thermal label. The courier adds its official guide separately.</p>
  <div className="admin-shipping-address">
   <label>Street address<input autoComplete="shipping address-line1" maxLength={120} value={address.line1} onChange={event=>setAddress({...address,line1:event.target.value})} placeholder="Street, number, apartment"/></label>
   <label>Additional address details<input autoComplete="shipping address-line2" maxLength={100} value={address.line2} onChange={event=>setAddress({...address,line2:event.target.value})} placeholder="Neighborhood, reference (optional)"/></label>
   <div className="admin-shipping-address-row">
    <label>City<input autoComplete="shipping address-level2" maxLength={80} value={address.city} onChange={event=>setAddress({...address,city:event.target.value})}/></label>
    <label>State / province<input autoComplete="shipping address-level1" maxLength={80} value={address.region} onChange={event=>setAddress({...address,region:event.target.value})}/></label>
   </div>
   <div className="admin-shipping-address-row">
    <label>Postal code<input autoComplete="shipping postal-code" maxLength={16} value={address.postalCode} onChange={event=>setAddress({...address,postalCode:event.target.value})}/></label>
    <label>Country<input autoComplete="shipping country-name" maxLength={80} value={address.country} onChange={event=>setAddress({...address,country:event.target.value})}/></label>
   </div>
  </div>
  <div className="admin-shipping-actions">
   <button disabled={busy||!valid||saved} onClick={()=>void save()}>{busy?'Saving…':'Save address'}</button>
   <button className="admin-primary" disabled={!saved} onClick={()=>{if(!printShippingLabels([order]))setMessage('Allow pop-ups to print this label.');}}>Print 4 × 6 label</button>
  </div>
  <p className="admin-feedback" role="status">{message}</p>
 </section>;
}