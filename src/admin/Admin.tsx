
import {authenticationErrorMessage} from '../application/authenticationError';
import {useEffect,useState,type FormEvent} from 'react';
import {admin,adminAuth,mode} from '../data/adminBackend';
import {AdminError,productionStatus,statusLabel} from '../domain/admin';
import {type Order} from '../domain/model';


import {OrdersBoard} from './OrdersBoard';
import {OrderDetail} from './OrderDetail';
import {Catalog} from './Catalog';
import {Hero} from './Hero';
import {ProductSettings} from './ProductSettings';
import './admin.css';
function errorText(error:unknown){const code=error instanceof AdminError?error.code:'PersistenceError';return ({Unauthorized:'Your account does not have administrative access.',OrderNotFound:'Order not found.',InvalidStatusTransition:'This status change is not allowed.',CatalogUnavailable:'This design is unavailable.',HeroConfigurationError:'Check the image configuration.',DriveSyncError:'Image sync is unavailable.',PersistenceError:'Could not save or load. Please retry.',Conflict:'This record changed. Reload before saving again.'})[code];}
function Message({error}:{error:string}){return error?<p className="admin-error" role="alert">{error}</p>:null;}
function PageHeading({eyebrow,title,description}:{eyebrow:string;title:string;description:string}){return <div className="admin-page-heading"><p className="admin-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>;}
function StatusBadge({status}:{status:Order['status']}){const value=productionStatus(status);return <span className={'admin-status status-'+value}>{statusLabel[value]}</span>;}
export default function Admin(){
 const [access,setAccess]=useState<boolean|null>(null),[error,setError]=useState('');
 const [path,setPath]=useState(()=>location.pathname.replace(/\/$/,''));
 useEffect(()=>{const update=()=>setPath(location.pathname.replace(/\/$/,''));window.addEventListener('popstate',update);return()=>window.removeEventListener('popstate',update);},[]);
 function navigate(e:React.MouseEvent<HTMLAnchorElement>){if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();const url=e.currentTarget.getAttribute('href')!;history.pushState(null,'',url);setPath(url);}
 useEffect(()=>{let mounted=true;const check=()=>admin.authorized().then(v=>{if(mounted)setAccess(v);}).catch(e=>{if(mounted){setError(errorText(e));setAccess(false);}});check();const unsubscribe=adminAuth.subscribe(check);return()=>{mounted=false;unsubscribe();};},[]);
 useEffect(()=>{if(path==='/admin'){location.replace('/admin/orders');}},[path]);
 if(access===null)return <div className="admin"><p role="status">Checking access…</p></div>;
 if(!access)return <div className="admin admin-login"><aside className="admin-login-brand" aria-label="Tina and Toya"><img className="admin-login-symbol" src={import.meta.env.BASE_URL+'brand/colti-symbol-burgundy.svg'} alt="COLTI" width="300" height="275"/></aside><section className="admin-login-content"><div className="admin-login-card"><p className="admin-eyebrow">ADMINISTRATION</p><h2>Sign in to COLTI</h2><p className="admin-login-intro">Orders, catalog and hero — all in one place.</p><Message error={error}/><Login onAccess={()=>setAccess(true)}/><a className="admin-login-back" href="/">Back to the COLTI store</a></div><p className="admin-login-footer">COLTI · Admin</p></section></div>;
 const id=path.startsWith('/admin/orders/')?decodeURIComponent(path.slice('/admin/orders/'.length)):null;
 return <div className="admin"><header className="admin-header"><a href="/admin/orders" onClick={navigate} className="admin-brand" aria-label="COLTI Admin"><img src={import.meta.env.BASE_URL+'brand/colti-logo-cream.svg'} alt="COLTI" width="180" height="46"/><span>ADMIN</span></a><nav aria-label="Administration">{['orders','catalog','product-settings','hero'].map(page=><a key={page} href={'/admin/'+page} onClick={navigate} aria-current={path.startsWith('/admin/'+page)?'page':undefined}>{page==='product-settings'?'PRODUCT SETTINGS':page.toUpperCase()}</a>)}</nav><button onClick={()=>adminAuth.signOut().then(()=>setAccess(false)).catch(e=>setError(errorText(e)))}>Sign out</button></header><main><Message error={error}/>{id?<OrderDetail id={id}/>:path==='/admin/catalog'?<Catalog/>:path.startsWith('/admin/product-settings')?<ProductSettings/>:path==='/admin/hero'?<Hero/>:<Orders/>}</main></div>;
}
function Login({onAccess}:{onAccess:()=>void}){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[visible,setVisible]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');try{await adminAuth.signIn(email,password);if(!await admin.authorized())throw new AdminError('Unauthorized');onAccess();if(location.pathname==='/admin/login')location.replace('/admin/orders');}catch(e){setError(authenticationErrorMessage(e)??errorText(e));}finally{setBusy(false);}}
 if(mode!=='live')return <><p>Administrative access requires configured Supabase Auth and a production owner. Local demo orders are not hosted production orders.</p><a href="/">Back to configurator</a></>;
 return <form onSubmit={submit}><label>Email address<input placeholder="you@example.com" type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<div className="admin-password-field"><input type={visible?"text":"password"} placeholder="Enter your password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={visible?"Hide password":"Show password"} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?"Hide":"Show"}</button></div></label><Message error={error}/><button className="admin-primary admin-login-submit" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></form>;
}
function Orders(){return <OrdersBoard/>;}

