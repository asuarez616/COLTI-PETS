import React,{useEffect,useState,lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import Configurator from './configurator/Configurator';
const Production=lazy(()=>import('./production/Production'));
const Admin=lazy(()=>import('./admin/Admin'));
const PasswordRecovery=lazy(()=>import('./admin/PasswordRecovery'));
import {mode} from './data/backend';
import {translator} from './i18n';
import type {Locale} from './domain/model';
import './design-tokens.css';
import './styles.css';
import './editorial.css';
import './interactions.css';
import './accessibility.css';

import ConfiguratorLayout from './ConfiguratorLayout';
function App(){const [locale,setLocale]=useState<Locale>(import.meta.env.VITE_DEFAULT_LOCALE==='es'?'es':'en'),[route,setRoute]=useState(location.hash),[editorialIndex,setEditorialIndex]=useState(0);const t=translator(locale);
 useEffect(()=>{const update=()=>setRoute(location.hash);window.addEventListener('hashchange',update);return ()=>window.removeEventListener('hashchange',update);},[]);
 useEffect(()=>{document.documentElement.lang=locale;},[locale]);
 if(location.pathname==='/admin/reset-password')return <Suspense fallback={<p role="status">Verificando enlace…</p>}><PasswordRecovery/></Suspense>;
 if(location.pathname==='/admin'||location.pathname.startsWith('/admin/'))return <Suspense fallback={null}><Admin/></Suspense>;
 return <><header className="site-header"><a href="#/" className="brand" aria-label="COLTI home"><img src={import.meta.env.BASE_URL+'brand/colti-logo-cream.svg'} alt="COLTI" width="331.35" height="85.18"/></a><nav><button className="language" onClick={()=>setLocale(l=>l==='en'?'es':'en')} aria-label={locale==='en'?'Cambiar a español':'Switch to English'}>{locale==='en'?'ES':'EN'}</button></nav></header>{mode==='unconfigured'?<div className="environment-banner">{t('noBackend')}</div>:null}{route.startsWith('#/production')?<main><Suspense fallback={<p role="status">{t('loading')}</p>}><Production locale={locale}/></Suspense></main>:<ConfiguratorLayout locale={locale} editorialIndex={editorialIndex}><Configurator locale={locale} onAdvance={()=>setEditorialIndex(i=>i+1)}/></ConfiguratorLayout>}<footer className="site-footer">COLTI PETS <span>MADE PERSONAL, ALWAYS.</span></footer></>;
}
class Boundary extends React.Component<{children:React.ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<div className="panel"><h1>COLTI</h1><p>Unable to load / No se pudo cargar.</p><button onClick={()=>location.reload()}>Retry / Reintentar</button></div>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<Boundary><App/></Boundary>);










import './ui-corrections.css';
import './store-flow-layout.css';
