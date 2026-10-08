import FactList,{type FactRow} from './ui/FactList';
export default function SummaryFacts({rows}:{rows:FactRow[]}){return <FactList rows={rows} className="summary-facts" itemClassName="summary-fact"/>;}
