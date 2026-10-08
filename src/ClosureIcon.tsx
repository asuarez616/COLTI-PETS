import type {CollarType} from './domain/model';

const icons:Partial<Record<CollarType,string>>={plastic_buckle:'plastic-buckle',metal_buckle:'metal-buckle',martingale:'martingale'};
export default function ClosureIcon({type}:{type:CollarType}){
 return <img className={`closure-icon closure-icon-${type}`} src={import.meta.env.BASE_URL+'icons/'+icons[type]+'.svg'} alt="" aria-hidden="true"/>;
}

