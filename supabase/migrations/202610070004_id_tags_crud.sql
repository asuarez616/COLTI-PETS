create or replace function public.admin_id_tags(p_value jsonb,p_revision integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare current_row public.id_tag_configuration; grp text; v jsonb; old jsonb; sz jsonb; mp jsonb;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED';end if;
 select * into current_row from public.id_tag_configuration where id for update;
 if current_row.revision is distinct from p_revision then raise exception 'STATE_CONFLICT';end if;
 if octet_length(p_value::text)>50000 then raise exception 'INVALID_TAGS';end if;
 foreach grp in array array['types','hanging','anti'] loop
  if jsonb_typeof(p_value->grp) is distinct from 'array' or jsonb_array_length(p_value->grp)>100 or (grp='types' and jsonb_array_length(p_value->grp)<>2) then raise exception 'INVALID_TAGS';end if;
  if (select count(distinct value->>'key') from jsonb_array_elements(p_value->grp))<>jsonb_array_length(p_value->grp) then raise exception 'INVALID_TAGS';end if;
  if exists(select 1 from jsonb_array_elements(current_row.value->grp) previous where not exists(select 1 from jsonb_array_elements(p_value->grp) proposed where proposed->>'key'=previous->>'key')) then raise exception 'ARCHIVE_REQUIRED';end if;
  for v in select value from jsonb_array_elements(p_value->grp) loop
   select value into old from jsonb_array_elements(current_row.value->grp) where value->>'key'=v->>'key';
   if (old is null and (grp='types' or coalesce(v->>'key','') !~ '^custom_[a-f0-9]{12}$')) or (coalesce((old->>'deleted')::boolean,false) and not coalesce((v->>'deleted')::boolean,false)) or (coalesce((v->>'deleted')::boolean,false) and (v->>'active')::boolean) or jsonb_typeof(v->'active') is distinct from 'boolean' or jsonb_typeof(v->'name_en') is distinct from 'string' or jsonb_typeof(v->'name_es') is distinct from 'string' or length(btrim(v->>'name_en')) not between 1 and 100 or length(btrim(v->>'name_es')) not between 1 and 100 or coalesce(v->>'icon','') !~ '^(/icons/[a-z0-9-]+[.]svg|closures/uploads/[a-f0-9-]+-[0-9]+[.]webp)$' or jsonb_typeof(v->'display_order') is distinct from 'number' or (v->>'display_order')::numeric not between 0 and 100 or (v->>'display_order')::numeric<>trunc((v->>'display_order')::numeric) then raise exception 'INVALID_TAG';end if;
   if grp='anti' and (jsonb_typeof(v->'width') is distinct from 'number' or jsonb_typeof(v->'height') is distinct from 'number' or (v->>'width')::numeric<=0 or (v->>'height')::numeric<=0 or (v->>'width')::numeric>20 or (v->>'height')::numeric>20) then raise exception 'INVALID_DIMENSIONS';end if;
   if grp='hanging' then
    if jsonb_typeof(v->'sizes') is distinct from 'array' or jsonb_array_length(v->'sizes') not between 1 and 4 or (select count(distinct value->>'id') from jsonb_array_elements(v->'sizes'))<>jsonb_array_length(v->'sizes') then raise exception 'INVALID_TAG_SIZE';end if;
    for sz in select value from jsonb_array_elements(v->'sizes') loop
     if coalesce(sz->>'id','') not in ('small','medium','large','miniature') or jsonb_typeof(sz->'active') is distinct from 'boolean' or jsonb_typeof(sz->'width') is distinct from 'number' or jsonb_typeof(sz->'height') is distinct from 'number' or (sz->>'width')::numeric<=0 or (sz->>'height')::numeric<=0 or (sz->>'width')::numeric>20 or (sz->>'height')::numeric>20 or coalesce(length(btrim(sz->>'name_en')),0) not between 1 and 100 or coalesce(length(btrim(sz->>'name_es')),0) not between 1 and 100 then raise exception 'INVALID_TAG_SIZE';end if;
    end loop;
   end if;
  end loop;
 end loop;
 if jsonb_typeof(p_value->'mapping') is distinct from 'array' or jsonb_array_length(p_value->'mapping')>100 then raise exception 'INVALID_MAPPING';end if;
 if (select count(distinct (value->>'size',value->>'width')) from jsonb_array_elements(p_value->'mapping'))<>jsonb_array_length(p_value->'mapping') then raise exception 'INVALID_MAPPING';end if;
 for mp in select value from jsonb_array_elements(p_value->'mapping') loop
  if not exists(select 1 from public.size_widths where size_code=mp->>'size' and width_cm=(mp->>'width')::numeric) or not exists(select 1 from jsonb_array_elements(p_value->'anti') where value->>'key'=mp->>'model') or (mp->>'model'='micro' and mp->>'size'<>'2XS') then raise exception 'INVALID_MAPPING';end if;
 end loop;
 update public.id_tag_configuration set value=p_value-'revision',revision=revision+1 where id returning * into current_row;
 -- Only the current compatibility inventory changes; saved order snapshots are untouched.
 for v in select value from jsonb_array_elements(p_value->'hanging') loop
  for sz in select value from jsonb_array_elements(v->'sizes') loop
   insert into public.tag_options(shape,size,width_cm,height_cm,active) values(v->>'key',sz->>'id',(sz->>'width')::numeric,(sz->>'height')::numeric,(v->>'active')::boolean and (sz->>'active')::boolean) on conflict(shape,size) do update set width_cm=excluded.width_cm,height_cm=excluded.height_cm,active=excluded.active;
  end loop;
 end loop;
 return current_row.value||jsonb_build_object('revision',current_row.revision);
end;$$;
revoke all on function public.admin_id_tags(jsonb,integer) from public,anon;
grant execute on function public.admin_id_tags(jsonb,integer) to authenticated;

notify pgrst,'reload schema';
