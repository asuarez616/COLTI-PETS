import type {Order} from '../domain/model';
export function ShippingLabel({order}:{order:Order}){
 function print(){
  const frame=document.createElement('iframe');frame.style.cssText='position:fixed;width:0;height:0;border:0';document.body.append(frame);
  const doc=frame.contentDocument;if(!doc){frame.remove();return;}
  doc.open();doc.write('<!doctype html><html><head><title>Shipping label</title><style>@page{size:100mm 150mm;margin:8mm}body{font-family:sans-serif;color:#3e2434}h1{color:#6B2946;font-size:24px}p{font-size:18px;overflow-wrap:anywhere}small{font-size:13px}</style></head><body><h1>COLTI</h1></body></html>');doc.close();
  [order.order_code,order.customer_snapshot.name,order.customer_snapshot.phone].forEach(value=>{const p=doc.createElement('p');p.textContent=value;doc.body.append(p);});
  const count=doc.createElement('small');count.textContent=`${order.items.length} collar${order.items.length===1?'':'s'}`;doc.body.append(count);
  frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(()=>frame.remove(),60000);
 }
 return <section className="admin-panel"><h2>Shipping label</h2><div className="admin-shipping-label"><strong>{order.order_code}</strong><p>{order.customer_snapshot.name}<br/>{order.customer_snapshot.phone}</p></div><button className="admin-primary" onClick={print}>Print shipping label</button></section>;
}
