import {memo,type ReactNode} from 'react';
import EditorialCarousel from './EditorialCarousel';
import type {Locale} from './domain/model';

const EditorialHero=memo(function EditorialHero({locale,index}:{locale:Locale;index:number}){
 return <aside className="story"><EditorialCarousel locale={locale} index={index}/></aside>;
});
/** The shell owns geometry; the form owns only its content and local scroll. */
export default function ConfiguratorLayout({locale,editorialIndex,children}:{locale:Locale;editorialIndex:number;children:ReactNode}){
 return <main className="configurator-layout"><EditorialHero locale={locale} index={editorialIndex}/><div className="configurator-area">{children}</div></main>;
}
