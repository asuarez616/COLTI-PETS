import {ConfirmDelete} from './ConfirmDelete';
import {Collections} from './Collections';
import {collections} from '../data/collectionsBackend';
import {Uploads} from './Uploads';
import {useRef,useEffect,useState} from 'react';

import {admin} from '../data/adminBackend';

import {useSync} from '../ui/useSync';

import {sizes,validPair} from '../domain/model';

import {availabilityKey,availabilityEnabled,type Availability,type CatalogAvailability} from '../domain/admin';

import {catalogGroups,printedCollection,categoryLabel} from '../domain/catalogGroups';

import type {Design} from '../domain/model';

import {DesignImage} from '../components';

import {DriveConnection} from './DriveConnection';



export function Catalog(){
 const [uploading,setUploading]=useState(false),[categories,setCategories]=useState<string[]>([]),[creating,setCreating]=useState(false);

 const [data,setData]=useState<CatalogAvailability|null>(null),[search,setSearch]=useState(''),[family,setFamily]=useState('woven'),[size,setSize]=useState(''),[width,setWidth]=useState(''),[filter,setFilter]=useState('all'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[feedback,setFeedback]=useState(''),[batch,setBatch]=useState<Availability[]|null>(null);

 const [group,setGroup]=useState(''),[moving,setMoving]=useState<Design|null>(null),[newCollection,setNewCollection]=useState(''),[selectedId,setSelectedId]=useState('');
 const [removing,setRemoving]=useState<Design|null>(null);
 async function remove(){if(!removing||busy)return;setBusy(true);setError('');try{await admin.deleteDesign(removing.id,removing.asset_version);await load();setRemoving(null);}catch{setError('Could not delete. The design may have changed; please retry.');}finally{setBusy(false);}}
 const [codeDraft,setCodeDraft]=useState('');
 async function renameCode(){if(!selected||busy||codeDraft.trim().toUpperCase()===selected.code)return;setBusy(true);setError('');try{await admin.renameDesign(selected.id,selected.code,codeDraft);await load();setCodeDraft(codeDraft.trim().toUpperCase());setFeedback('Saved');}catch{setError('Could not save code. Check that it is unique and uses letters, numbers, hyphens or underscores.');}finally{setBusy(false);}}
 const editor=useRef<HTMLDialogElement>(null);
 const selected=data?.designs.find(d=>d.id===selectedId);
 useEffect(()=>{setCodeDraft(selected?.code||'');},[selectedId]);
 useEffect(()=>{if(selectedId&&!editor.current?.open)editor.current?.showModal();else if(!selectedId&&editor.current?.open)editor.current?.close();},[selectedId]);

 const collectionDialog=useRef<HTMLDialogElement>(null);useEffect(()=>{if(moving)collectionDialog.current?.showModal();},[moving]);

 const dialog=useRef<HTMLDialogElement>(null);useEffect(()=>{if(batch)dialog.current?.showModal();},[batch]);

 async function load(){try{const value=await admin.catalog();setData(value);setCategories((await collections.load()).map(c=>c.name));setError('');}catch(e){setError('Could not load the catalog. Your last loaded collection is preserved.');throw e;}}

 useSync('catalog',load);

 const enabled=(id:string,w:number,s='')=>availabilityEnabled(data?.overrides||[],id,w,s);

 const familyDesigns=data?.designs.filter(d=>d.type===family)||[];

 const active=(d:CatalogAvailability['designs'][number])=>d.active&&enabled(d.id,0);

 const counts={all:familyDesigns.length,active:familyDesigns.filter(active).length,inactive:familyDesigns.filter(d=>!active(d)).length};

 const visible=familyDesigns.filter(d=>(filter==='all'||(filter==='active'?active(d):!active(d)))&&d.code.toLowerCase().includes(search.trim().toLowerCase())&&d.compatibility.some(c=>(!size||c.size_code===size)&&(!width||c.width_cm===Number(width))));

 const groups=catalogGroups(visible,family);
 const navigationGroups=catalogGroups(familyDesigns,family);if(family==='printed')for(const name of categories)if(!navigationGroups.some(g=>g.id===name))navigationGroups.push({id:name,label:name,description:'',designs:[]});

 const displayed=group?groups.find(g=>g.id===group)?.designs||[]:visible;

 const collectionOptions=[...new Set([...(data?.designs.filter(d=>d.type==='printed').map(printedCollection)||[]),...categories])].sort((a,b)=>a.localeCompare(b,'es'));

 async function move(d:Design,name:string){if(busy)return;setBusy(true);setError('');try{const result=await admin.collection(d.id,name,d.collection_revision||0);setData(previous=>previous&&({...previous,designs:previous.designs.map(v=>v.id===d.id?{...v,...result}:v)}));setMoving(null);setFeedback('Saved');}catch{setError('Could not move the design. Refresh and retry.');}finally{setBusy(false);}}

 const widths=[...new Set(familyDesigns.flatMap(d=>d.compatibility.filter(c=>!size||c.size_code===size).map(c=>c.width_cm)))].sort((a,b)=>a-b);

 const change=(id:string,w:number,value:boolean,s=''):Availability=>({designId:id,width:w,...(s?{size:s}:{}),enabled:value,revision:data?.overrides.find(v=>availabilityKey(v)===availabilityKey({designId:id,width:w,size:s}))?.revision??0});

 async function save(changes:Availability[],bulk=false){if(busy)return;setBusy(true);setError('');setFeedback('Saving…');try{const result=bulk?await admin.availabilityBatch(changes):[await admin.availability(changes[0])];setData(previous=>previous&&({...previous,overrides:[...previous.overrides.filter(v=>!result.some(c=>availabilityKey(c)===availabilityKey(v))),...result]}));setBatch(null);setFeedback('Saved');}catch{setError('Could not save availability. Refresh and retry; the record may have changed.');setFeedback('Changes not saved');}finally{setBusy(false);}}

 function propose(value:boolean){const w=width?Number(width):0;const changes=displayed.filter(d=>d.active).flatMap(d=>w?d.compatibility.filter(c=>(!size||c.size_code===size)&&c.width_cm===w&&validPair(c.size_code,w)).map(c=>change(d.id,w,value,c.size_code)):size?[change(d.id,0,value,size)]:[change(d.id,0,value)]).filter(c=>enabled(c.designId,c.width,c.size)!==value);if(changes.length)setBatch(changes);}

 return <div className="admin-catalog-workspace">{removing&&<ConfirmDelete name={removing.code} description="This design will leave the catalog. Existing orders keep their original product details." busy={busy} error={error} cancel={()=>setRemoving(null)} confirm={()=>void remove()}/> }<div className="admin-page-heading"><h1>Catalog</h1><p>Designs, collections and availability.</p></div><div className="admin-catalog-navigation"><div className="admin-view-tabs admin-task-tabs" role="tablist" aria-label="Design type">{(['woven','printed'] as const).map(f=><button key={f} role="tab" aria-selected={family===f} className={family===f?'is-selected':''} onClick={()=>{setFamily(f);setUploading(false);setCreating(false);setGroup('');setSize('');setWidth('');}}>{f==='woven'?'Woven':'Printed'}</button>)}</div><div className="admin-catalog-navigation-actions"><button className="admin-primary" aria-expanded={uploading} onClick={()=>setUploading(v=>!v)}>{uploading?'Close upload':'+ Add design'}</button></div></div>{uploading&&<DriveConnection target="catalog" compact ordersSync onSynced={load}/>}{!uploading&&family==='printed'&&<div className="admin-view-tabs admin-catalog-subtabs" role="tablist" aria-label="Printed catalog"><button role="tab" aria-selected={!creating} className={!creating?'is-selected':''} onClick={()=>setCreating(false)}>Designs</button><button role="tab" aria-selected={creating} className={creating?'is-selected':''} onClick={()=>setCreating(true)}>Collections</button></div>}{!uploading&&family==='printed'&&creating&&<Collections onChange={()=>void load().catch(()=>{})}/>}<div hidden={!uploading} role="tabpanel" aria-label="Add new"><div className="admin-add-heading"><div><h2>New {family==='woven'?'Woven':'Printed'} design</h2><p>Upload a product image and set its details.</p></div></div><div><Uploads key={family} destination="catalog" designType={family as 'woven'|'printed'} categories={collectionOptions} onUploaded={()=>{setUploading(false);setSearch('');setGroup('');setSize('');setWidth('');setFilter('all');setFeedback('Design uploaded');void load().catch(()=>{});}}/></div>{error&&<p className="admin-error" role="alert">{error}</p>}</div><div hidden={uploading||(family==='printed'&&creating)} role="tabpanel" aria-label="Catalog"><div className="admin-catalog-filterbar"><div className="admin-toolbar"><label className="admin-search">Search design<input type="search" placeholder="Find a design code…" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Size<select aria-label="Size" value={size} onChange={e=>{setSize(e.target.value);setWidth('');}}><option value="">All sizes</option>{sizes.map(s=><option key={s.code}>{s.code}</option>)}</select></label><label>Width<select value={width} onChange={e=>setWidth(e.target.value)}><option value="">All widths</option>{widths.map(w=><option key={w} value={w}>{w} cm</option>)}</select></label><label>Availability<select aria-label="Catalog status" value={filter} onChange={e=>setFilter(e.target.value)}>{(['all','active','inactive'] as const).map(f=><option key={f} value={f}>{f==='all'?'All':f==='active'?'Active':'Inactive'} ({counts[f]})</option>)}</select></label></div>

</div>
  <div className="admin-catalog-groupbar"><div className="admin-catalog-groups-nav" aria-label="Catalog groups"><button aria-pressed={!group} onClick={()=>setGroup('')}>Todos los grupos</button>{navigationGroups.map(g=><button key={g.id} aria-pressed={group===g.id} onClick={()=>setGroup(g.id)}>{categoryLabel(g.label)} <span>{g.designs.length}</span></button>)}</div>
  <details className="admin-catalog-bulk"><summary>Bulk actions</summary><div><p>{displayed.length} matching designs · {group||'All groups'} · {size||'All sizes'}{width?' · '+width+' cm':''}</p><button disabled={busy||!displayed.length} onClick={()=>propose(true)}>Enable all</button><button disabled={busy||!displayed.length} onClick={()=>propose(false)}>Disable all</button></div></details></div>

  {error&&<p className="admin-error" role="alert">{error}</p>}

  {!data?<p role="status">Loading catalog…</p>:!visible.length?<div className="admin-empty"><h2>No matching designs</h2><p>Try another code, collection or size.</p></div>:<div className="admin-catalog-sections">{groups.filter(g=>(!group||group===g.id)).map(g=><section className="admin-catalog-section" key={g.id}><div className="admin-catalog-section-heading"><h2>{categoryLabel(g.label)} <span>{g.designs.length}</span></h2>{g.description&&<p>{g.description}</p>}</div><div className="admin-catalog">{g.designs.map(d=><article key={d.id} className="admin-design-card"><button className="admin-catalog-open" aria-label={'Configure '+d.code} aria-haspopup="dialog" onClick={()=>setSelectedId(d.id)}><div className="admin-design-image"><DesignImage design={d} locale="en"/></div><div className="admin-catalog-card-caption"><h2>{d.code}</h2></div></button><div className="admin-card-actions"><button onClick={()=>setSelectedId(d.id)}>Edit</button><button onClick={()=>{setRemoving(d);setError('');}}>Delete</button></div></article>)}</div></section>)}</div>}


  <dialog ref={editor} className="admin-catalog-editor" aria-label="Design configuration" onCancel={e=>{e.preventDefault();setSelectedId('');}} onClose={()=>setSelectedId('')}>
   {selected&&<><div className="admin-catalog-editor-top"><span>Design configuration</span><button aria-label="Close design configuration" onClick={()=>setSelectedId('')}>×</button></div><div className="admin-catalog-product"><div className="admin-design-image"><DesignImage design={selected} locale="en"/></div><div><div className="admin-design-code-edit"><label>Design code<input required maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9_-]*" disabled={busy} value={codeDraft} onChange={e=>{setCodeDraft(e.target.value.toUpperCase());setFeedback('');}} onBlur={e=>{if(!e.currentTarget.validity.valid){setError('Check that the design code uses letters, numbers, hyphens or underscores.');return;}void renameCode();}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}}}/></label></div><span className="admin-catalog-family">{selected.type==='printed'?'Printed':'Woven'}</span><p className="admin-catalog-editor-save" role="status">{busy?'Saving…':feedback||'Changes save automatically'}</p></div></div>{error&&<p className="admin-error" role="alert">{error}</p>}{((d:Design)=><div className="admin-design-body">{d.type==='printed'&&<label className="admin-collection-move">Colección<select aria-label={'Move collection · '+d.code} value={printedCollection(d)} disabled={busy} onChange={e=>{if(e.target.value==='__new__'){setMoving(d);setNewCollection('');}else void move(d,e.target.value==='__drive__'?'':e.target.value);}}>{collectionOptions.map(name=><option key={name} value={name}>{categoryLabel(name)}</option>)}{d.collection_override&&<option value="__drive__">Usar colección de Drive</option>}<option value="__new__">+ Nueva colección…</option></select></label>}{!d.active&&<p>Source unavailable · retained for past orders</p>}<label className="admin-toggle admin-design-toggle"><span>Whole design</span><input type="checkbox" checked={enabled(d.id,0)} disabled={busy||!d.active} aria-label={'Whole design · '+d.code} onChange={()=>void save([change(d.id,0,!enabled(d.id,0))])}/><span className="admin-toggle-track" aria-hidden="true"/></label><div className="admin-size-chip-section"><h3>Available sizes</h3><div className="admin-size-chips">{sizes.filter(s=>d.compatibility.some(c=>c.size_code===s.code&&validPair(c.size_code,c.width_cm))).map(s=><button key={s.code} type="button" className="admin-availability-chip" aria-label={'Size '+s.code+' · '+d.code} aria-pressed={enabled(d.id,0,s.code)} disabled={busy||!active(d)} onClick={()=>void save([change(d.id,0,!enabled(d.id,0,s.code),s.code)])}>{s.code}</button>)}</div></div>{sizes.some(s=>s.widths.filter(w=>d.compatibility.some(c=>c.size_code===s.code&&c.width_cm===w)).length>1)&&<div className="admin-width-chip-section"><h3>Width availability</h3>{sizes.map(s=>({size:s,options:s.widths.filter(w=>d.compatibility.some(c=>c.size_code===s.code&&c.width_cm===w))})).filter(v=>v.options.length>1).map(({size:s,options})=><div key={s.code} className={'admin-width-chip-row'+(!enabled(d.id,0,s.code)?' is-disabled':'')}><strong>{s.code}</strong><div>{options.map(w=><button type="button" className="admin-availability-chip" key={w} aria-label={s.code+' · '+w+' cm · '+d.code} aria-pressed={enabled(d.id,w,s.code)} disabled={busy||!active(d)||!enabled(d.id,0,s.code)} onClick={()=>void save([change(d.id,w,!enabled(d.id,w,s.code),s.code)])}>{w} cm</button>)}</div></div>)}</div>}</div>)(selected)}</>}
  </dialog>

  {moving&&<dialog ref={collectionDialog} className="admin-cancel-dialog" aria-label="Nueva colección" onCancel={()=>setMoving(null)}><h2>Nueva colección</h2><p>Mover {moving.code} a una nueva colección.</p><label>Nombre<input autoFocus maxLength={80} value={newCollection} onChange={e=>setNewCollection(e.target.value)} placeholder="Por ejemplo, Cartoons"/></label>{error&&<p role="alert">{error}</p>}<div className="admin-controls"><button disabled={busy} onClick={()=>setMoving(null)}>Cancelar</button><button className="admin-primary" disabled={busy||!newCollection.trim()} onClick={()=>void move(moving,newCollection)}>Crear y mover</button></div></dialog>}

  {batch&&<dialog ref={dialog} className="admin-cancel-dialog" aria-label="Confirm catalog changes" onCancel={e=>{e.preventDefault();if(!busy)setBatch(null);}}><h2>{batch[0].enabled?'Enable':'Disable'} {batch.length} designs?</h2><p>{family==='woven'?'Woven':'Printed'} · {size||'All sizes'} · {width?width+' cm only':'Whole designs'}</p><p>Only the designs matching the current filters will change. Existing orders keep their original selections.</p>{error&&<p className="admin-error" role="alert">{error}</p>}<div className="admin-controls"><button disabled={busy} onClick={()=>setBatch(null)}>Keep current availability</button><button className="admin-primary" disabled={busy} onClick={()=>void save(batch,true)}>{busy?'Saving…':'Confirm changes'}</button></div></dialog>}

 </div></div>;

}

