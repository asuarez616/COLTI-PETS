import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';

/** Presentation only: retains content for closing, while immediately making it inert. */
export default function Reveal({open,children,id,labelledBy}:{open:boolean;children:ReactNode;id?:string;labelledBy?:string}){
 const [visited,setVisited]=useState(open);
 const [height,setHeight]=useState(0);
 const content=useRef<HTMLDivElement>(null);
 const retained=useRef(children);
 if(open)retained.current=children;
 useEffect(()=>{if(open)setVisited(true);},[open]);
 useLayoutEffect(()=>{
  const element=content.current;if(!element)return;
  const measure=()=>setHeight(element.getBoundingClientRect().height);
  measure();const observer=new ResizeObserver(measure);observer.observe(element);
  return()=>observer.disconnect();
 },[visited,open]);
 return <div className="reveal" data-open={open} style={{height:open?height:0}} id={id} aria-hidden={!open} inert={!open} role={labelledBy?'region':undefined} aria-labelledby={labelledBy}>
  <div ref={content} className="reveal-content">{(visited||open)&&retained.current}</div>
 </div>;
}
