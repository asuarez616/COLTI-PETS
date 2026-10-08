import type {ReactNode} from 'react';

export type FactRow={key:string;label:string;value:ReactNode};

/** Semantic description list shared by product review and confirmed order details. */
export default function FactList({rows,className='fact-list',itemClassName='fact-list-item',itemClassNameForRow}:{rows:FactRow[];className?:string;itemClassName?:string;itemClassNameForRow?:(row:FactRow)=>string}){
 return <dl className={className}>{rows.filter(row=>typeof row.value==='string'?row.value.trim():row.value!=null&&row.value!==false).map(row=><div key={row.key} className={itemClassNameForRow?.(row)||itemClassName} data-fact={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>;
}
