-- Persist font size and case, preserving existing order snapshots.
create or replace function public.admin_save_lettering(p_revision integer,p_fonts jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r integer; f jsonb; pos integer:=0; n integer;
begin
 if not public.is_owner() then raise exception 'NOT_AUTHORIZED';end if;
 select revision into r from public.lettering_revision where id=true for update;
 if r<>p_revision then raise exception 'STATE_CONFLICT: lettering changed in another session';end if;
 if jsonb_typeof(p_fonts)<>'array' or jsonb_array_length(p_fonts)>1000 then raise exception 'INVALID_CATALOG';end if;
 if (select count(*) from jsonb_array_elements(p_fonts))<>(select count(distinct value->>'id') from jsonb_array_elements(p_fonts)) then raise exception 'DUPLICATE_FONT';end if;
 if exists(select 1 from public.fonts where not deleted and id::text not in(select value->>'id' from jsonb_array_elements(p_fonts))) then raise exception 'INCOMPLETE_CATALOG';end if;
 for f in select value from jsonb_array_elements(p_fonts) loop
  pos:=pos+1;
  if length(btrim(f->>'label')) not between 1 and 200 or f->>'state'<>'ready' or coalesce(f->>'asset_path','')='' or coalesce(f->>'asset_version','')='' then raise exception 'INVALID_FONT';end if;
  if f->>'asset_path' like 'managed/%' and not exists(select 1 from storage.objects where bucket_id='font-assets' and name=f->>'asset_path') then raise exception 'FONT_ASSET_NOT_FOUND';end if;
  select number into n from public.fonts where id=(f->>'id')::uuid;
  if n is null then select coalesce(max(number),0)+1 into n from public.fonts;end if;
  insert into public.fonts(number,id,label,asset_path,css_family,state,active,asset_version,presentation,display_order,deleted,asset_hash)
  values(n,(f->>'id')::uuid,btrim(f->>'label'),f->>'asset_path',f->>'css_family','ready',coalesce((f->>'active')::boolean,false) and not coalesce((f->>'deleted')::boolean,false),f->>'asset_version',coalesce(f->'presentation','{}'),pos,coalesce((f->>'deleted')::boolean,false),f->>'asset_hash')
  on conflict(id) do update set label=excluded.label,asset_path=excluded.asset_path,css_family=excluded.css_family,active=excluded.active,asset_version=excluded.asset_version,presentation=excluded.presentation,display_order=excluded.display_order,deleted=excluded.deleted,asset_hash=excluded.asset_hash,updated_at=now();
 end loop;
 update public.lettering_revision set revision=r+1 where id=true;
 return public.admin_lettering_catalog();
end $$;
