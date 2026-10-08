-- Legacy number remains an immutable compatibility key; position is independent.
alter table public.fonts drop constraint if exists fonts_number_check;
alter table public.fonts add constraint fonts_number_positive check(number>0);
alter table public.fonts add column id uuid not null default gen_random_uuid() unique;
alter table public.fonts add column display_order integer;
update public.fonts set display_order=number where display_order is null;
alter table public.fonts alter column display_order set not null;
alter table public.fonts alter column display_order set default 1;
alter table public.fonts add column deleted boolean not null default false;
alter table public.fonts add column asset_hash text;
create unique index fonts_managed_asset_hash on public.fonts(asset_hash) where not deleted;
create table public.lettering_revision(id boolean primary key default true check(id),revision integer not null default 0);
insert into public.lettering_revision values(true,0);
alter table public.lettering_revision enable row level security;
create policy owner_read_fonts on public.fonts for select to authenticated using(public.is_owner());
create function public.admin_lettering_catalog() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'NOT_AUTHORIZED';end if;
 return jsonb_build_object('revision',(select revision from public.lettering_revision where id=true),'fonts',coalesce((select jsonb_agg(to_jsonb(f) order by display_order,number) from public.fonts f where not deleted),'[]'::jsonb));
end $$;
create function public.admin_save_lettering(p_revision integer,p_fonts jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
  on conflict(id) do update set label=excluded.label,asset_path=excluded.asset_path,css_family=excluded.css_family,active=excluded.active,asset_version=excluded.asset_version,display_order=excluded.display_order,deleted=excluded.deleted,asset_hash=excluded.asset_hash,updated_at=now();
 end loop;
 update public.lettering_revision set revision=r+1 where id=true;
 return public.admin_lettering_catalog();
end $$;
revoke all on function public.admin_lettering_catalog(),public.admin_save_lettering(integer,jsonb) from public,anon;
grant execute on function public.admin_lettering_catalog(),public.admin_save_lettering(integer,jsonb) to authenticated;
-- Capture immutable asset/name/id and the display label at confirmation time.
create function public.snapshot_lettering_identity() returns trigger language plpgsql security definer set search_path='' as $$
declare f public.fonts; position integer;
begin
 select * into f from public.fonts where number=new.font_number;
 select count(*) into position from public.fonts where active and not deleted and (display_order,number)<=(f.display_order,f.number);
 new.snapshot=jsonb_set(new.snapshot,'{font}',coalesce(new.snapshot->'font','{}')||jsonb_build_object('id',f.id,'display_position',position));
 return new;
end $$;
create trigger order_lettering_identity before insert on public.order_items for each row execute function public.snapshot_lettering_identity();
do $$begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='fonts') then alter publication supabase_realtime add table public.fonts;end if;
end $$;
