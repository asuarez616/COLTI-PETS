import type {StepId} from '../configurator/steps';

/** Shared heading and edit-action pattern for the two review sections. */
export default function ReviewSectionHeader({id,title,editLabel,onEdit,step}:{id:string;title:string;editLabel:string;onEdit?:(step:StepId)=>void;step:StepId}){
 return <div className="collar-review-section-header">
  <h2 id={id} className="collar-review-heading">{title}</h2>
  {onEdit&&<button type="button" className="collar-review-edit collar-review-header-edit" onClick={()=>onEdit(step)}>{editLabel}</button>}
 </div>;
}
