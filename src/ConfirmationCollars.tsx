import CollapsibleCollar from './CollapsibleCollar';
import OrderCollarSummary from './OrderCollarSummary';
import type {Order,Locale} from './domain/model';
export default function ConfirmationCollars({order,locale}:{order:Order;locale:Locale}){
 return <div className="confirmation-collars">{order.items.map((item,index)=><CollapsibleCollar key={item.id} item={item} number={index+1} design={item.design} font={item.font} locale={locale}><OrderCollarSummary item={item} number={index+1} design={item.design} font={item.font} locale={locale} confirmedDetails confirmation insideCollapse/></CollapsibleCollar>)}</div>;
}
