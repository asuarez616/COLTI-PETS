create table public.id_tag_configuration(id boolean primary key default true check(id),value jsonb not null,revision integer not null default 1);
insert into public.id_tag_configuration values(true,$seed${
  "revision": 1,
  "types": [
    {
      "key": "hanging",
      "name_en": "Hanging",
      "name_es": "Colgante",
      "icon": "/icons/id-tag-hanging.svg",
      "active": true,
      "display_order": 0
    },
    {
      "key": "anti_fall",
      "name_en": "Anti-fall",
      "name_es": "Anticaída",
      "icon": "/icons/id-tag-anti-fall.svg",
      "active": true,
      "display_order": 1
    }
  ],
  "hanging": [
    {
      "key": "paw",
      "name_en": "Paw",
      "name_es": "Huella",
      "icon": "/icons/tag-paw.svg",
      "active": true,
      "display_order": 0,
      "sizes": [
        {
          "id": "small",
          "name_en": "Medium",
          "name_es": "Mediana",
          "width": 2.5,
          "height": 2.5,
          "active": true
        },
        {
          "id": "large",
          "name_en": "Large",
          "name_es": "Grande",
          "width": 3.5,
          "height": 3.3,
          "active": true
        }
      ]
    },
    {
      "key": "circle",
      "name_en": "Circle",
      "name_es": "Círculo",
      "icon": "/icons/tag-circle.svg",
      "active": true,
      "display_order": 1,
      "sizes": [
        {
          "id": "small",
          "name_en": "Medium",
          "name_es": "Mediana",
          "width": 2.5,
          "height": 2.5,
          "active": true
        }
      ]
    },
    {
      "key": "bone",
      "name_en": "Bone",
      "name_es": "Hueso",
      "icon": "/icons/tag-bone.svg",
      "active": true,
      "display_order": 2,
      "sizes": [
        {
          "id": "miniature",
          "name_en": "Miniature",
          "name_es": "Miniatura",
          "width": 2.3,
          "height": 2,
          "active": true
        },
        {
          "id": "medium",
          "name_en": "Medium",
          "name_es": "Mediana",
          "width": 2.7,
          "height": 4,
          "active": true
        },
        {
          "id": "large",
          "name_en": "Large",
          "name_es": "Grande",
          "width": 3,
          "height": 5,
          "active": true
        }
      ]
    },
    {
      "key": "crown",
      "name_en": "Crown",
      "name_es": "Corona",
      "icon": "/icons/id-tag-hanging.svg",
      "active": false,
      "display_order": 3,
      "sizes": [
        {
          "id": "small",
          "name_en": "Medium",
          "name_es": "Mediana",
          "width": 2.5,
          "height": 2.5,
          "active": true
        }
      ]
    },
    {
      "key": "military",
      "name_en": "Military",
      "name_es": "Militar",
      "icon": "/icons/tag-military.svg",
      "active": true,
      "display_order": 4,
      "sizes": [
        {
          "id": "medium",
          "name_en": "Medium",
          "name_es": "Mediana",
          "width": 2.7,
          "height": 4,
          "active": true
        },
        {
          "id": "large",
          "name_en": "Large",
          "name_es": "Grande",
          "width": 3,
          "height": 5,
          "active": true
        }
      ]
    }
  ],
  "anti": [
    {
      "key": "micro",
      "name_en": "Micro",
      "name_es": "Micro",
      "icon": "/icons/id-tag-anti-fall.svg",
      "active": true,
      "display_order": 0,
      "width": 3,
      "height": 1.2
    },
    {
      "key": "miniature",
      "name_en": "Miniature",
      "name_es": "Miniatura",
      "icon": "/icons/id-tag-anti-fall.svg",
      "active": true,
      "display_order": 1,
      "width": 4,
      "height": 1.5
    },
    {
      "key": "small",
      "name_en": "Small",
      "name_es": "Pequeña",
      "icon": "/icons/id-tag-anti-fall.svg",
      "active": true,
      "display_order": 2,
      "width": 3.5,
      "height": 2
    },
    {
      "key": "semi_medium",
      "name_en": "Semi Medium",
      "name_es": "Semimediana",
      "icon": "/icons/id-tag-anti-fall.svg",
      "active": true,
      "display_order": 3,
      "width": 4.3,
      "height": 2.2
    },
    {
      "key": "medium",
      "name_en": "Medium",
      "name_es": "Mediana",
      "icon": "/icons/id-tag-anti-fall.svg",
      "active": true,
      "display_order": 4,
      "width": 5,
      "height": 3
    },
    {
      "key": "large",
      "name_en": "Large",
      "name_es": "Grande",
      "icon": "/icons/id-tag-anti-fall.svg",
      "active": true,
      "display_order": 5,
      "width": 6,
      "height": 4
    }
  ],
  "mapping": [
    {
      "size": "2XS",
      "width": 1,
      "model": "micro"
    },
    {
      "size": "XS",
      "width": 1,
      "model": "miniature"
    },
    {
      "size": "XS",
      "width": 1.5,
      "model": "small"
    },
    {
      "size": "S",
      "width": 1.5,
      "model": "small"
    },
    {
      "size": "S",
      "width": 2,
      "model": "semi_medium"
    },
    {
      "size": "SM",
      "width": 2,
      "model": "semi_medium"
    },
    {
      "size": "M",
      "width": 2.5,
      "model": "medium"
    },
    {
      "size": "ML",
      "width": 2.5,
      "model": "medium"
    },
    {
      "size": "ML",
      "width": 3,
      "model": "large"
    },
    {
      "size": "L",
      "width": 3,
      "model": "large"
    },
    {
      "size": "XL",
      "width": 3,
      "model": "large"
    },
    {
      "size": "2XL",
      "width": 3,
      "model": "large"
    }
  ]
}$seed$::jsonb,1);
alter table public.id_tag_configuration enable row level security;
create policy id_tags_read on public.id_tag_configuration for select to anon,authenticated using(true);
grant select on public.id_tag_configuration to anon,authenticated;
revoke insert,update,delete on public.id_tag_configuration from anon,authenticated;
create function public.admin_id_tags(p_value jsonb,p_revision integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare current_row public.id_tag_configuration; grp text; v jsonb; old jsonb; sz jsonb; mp jsonb;
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED';end if;
 select * into current_row from public.id_tag_configuration where id for update;
 if current_row.revision is distinct from p_revision then raise exception 'STATE_CONFLICT';end if;
 if octet_length(p_value::text)>50000 then raise exception 'INVALID_TAGS';end if;
 foreach grp in array array['types','hanging','anti'] loop
  if jsonb_typeof(p_value->grp) is distinct from 'array' or jsonb_array_length(p_value->grp)<>jsonb_array_length(current_row.value->grp) then raise exception 'INVALID_TAGS';end if;
  if (select count(distinct value->>'key') from jsonb_array_elements(p_value->grp))<>jsonb_array_length(p_value->grp) then raise exception 'INVALID_TAGS';end if;
  for v in select value from jsonb_array_elements(p_value->grp) loop
   select value into old from jsonb_array_elements(current_row.value->grp) where value->>'key'=v->>'key';
   if old is null or jsonb_typeof(v->'active') is distinct from 'boolean' or jsonb_typeof(v->'name_en') is distinct from 'string' or jsonb_typeof(v->'name_es') is distinct from 'string' or length(btrim(v->>'name_en')) not between 1 and 100 or length(btrim(v->>'name_es')) not between 1 and 100 or coalesce(v->>'icon','') !~ '^(/icons/[a-z0-9-]+[.]svg|closures/uploads/[a-f0-9-]+-[0-9]+[.]webp)$' or jsonb_typeof(v->'display_order') is distinct from 'number' or (v->>'display_order')::numeric not between 0 and 100 or (v->>'display_order')::numeric<>trunc((v->>'display_order')::numeric) then raise exception 'INVALID_TAG';end if;
   if grp='anti' and (jsonb_typeof(v->'width') is distinct from 'number' or jsonb_typeof(v->'height') is distinct from 'number' or (v->>'width')::numeric<=0 or (v->>'height')::numeric<=0 or (v->>'width')::numeric>20 or (v->>'height')::numeric>20) then raise exception 'INVALID_DIMENSIONS';end if;
   if grp='hanging' then
    if jsonb_typeof(v->'sizes') is distinct from 'array' or jsonb_array_length(v->'sizes')<>jsonb_array_length(old->'sizes') or (select count(distinct value->>'id') from jsonb_array_elements(v->'sizes'))<>jsonb_array_length(v->'sizes') then raise exception 'INVALID_TAG_SIZE';end if;
    for sz in select value from jsonb_array_elements(v->'sizes') loop
     if not exists(select 1 from jsonb_array_elements(old->'sizes') where value->>'id'=sz->>'id') or jsonb_typeof(sz->'active') is distinct from 'boolean' or jsonb_typeof(sz->'width') is distinct from 'number' or jsonb_typeof(sz->'height') is distinct from 'number' or (sz->>'width')::numeric<=0 or (sz->>'height')::numeric<=0 or (sz->>'width')::numeric>20 or (sz->>'height')::numeric>20 or coalesce(length(btrim(sz->>'name_en')),0) not between 1 and 100 or coalesce(length(btrim(sz->>'name_es')),0) not between 1 and 100 then raise exception 'INVALID_TAG_SIZE';end if;
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
   update public.tag_options set width_cm=(sz->>'width')::numeric,height_cm=(sz->>'height')::numeric,active=(v->>'active')::boolean and (sz->>'active')::boolean where shape=v->>'key' and size=sz->>'id';
  end loop;
 end loop;
 return current_row.value||jsonb_build_object('revision',current_row.revision);
end;$$;
revoke all on function public.admin_id_tags(jsonb,integer) from public,anon;
grant execute on function public.admin_id_tags(jsonb,integer) to authenticated;
create function public.configured_tag_snapshot(i jsonb) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare cfg jsonb; typ jsonb; mdl jsonb; sz jsonb; mapping jsonb;
begin
 select value into cfg from public.id_tag_configuration where id;
 if not exists(select 1 from public.size_widths where size_code=i->>'size_code' and width_cm=(i->>'width_cm')::numeric) then return null;end if;
 select value into typ from jsonb_array_elements(cfg->'types') where value->>'key'=i->>'tag_type' and (value->>'active')::boolean;
 if typ is null then return null;end if;
 if i->>'tag_type'='hanging' then
  select value into mdl from jsonb_array_elements(cfg->'hanging') where value->>'key'=i->>'tagShape' and (value->>'active')::boolean;
  if mdl is null then return null;end if;
  select value into sz from jsonb_array_elements(mdl->'sizes') where value->>'id'=i->>'tagSize' and (value->>'active')::boolean and (value->>'width')::numeric=(i->>'tagWidthCm')::numeric and (value->>'height')::numeric=(i->>'tagHeightCm')::numeric;
  if sz is null then return null;end if;
  return jsonb_build_object('type',typ,'model',mdl-'sizes','size',sz,'width',sz->'width','height',sz->'height');
 else
  select value into mapping from jsonb_array_elements(cfg->'mapping') where value->>'size'=i->>'size_code' and (value->>'width')::numeric=(i->>'width_cm')::numeric;
  select value into mdl from jsonb_array_elements(cfg->'anti') where value->>'key'=mapping->>'model' and (value->>'active')::boolean;
  if mdl is null then return null;end if;
  return jsonb_build_object('type',typ,'model',mdl,'width',mdl->'width','height',mdl->'height');
 end if;
end;$$;
alter function public.confirm_order(uuid,uuid,jsonb,jsonb) rename to confirm_order_before_id_tags;
revoke all on function public.confirm_order_before_id_tags(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
create function public.confirm_order(p_key uuid,p_draft uuid,p_customer jsonb,p_items jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item jsonb;result jsonb;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.orders where owner_user_id=auth.uid() and idempotency_key=p_key) then return public.confirm_order_before_id_tags(p_key,p_draft,p_customer,p_items);end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20 or octet_length(p_items::text)>200000 then raise exception 'INVALID_PAYLOAD';end if;
 perform 1 from public.id_tag_configuration where id for share;
 for item in select value from jsonb_array_elements(p_items) loop
  if public.configured_tag_snapshot(item) is null then raise exception 'ID_TAG_CHANGED';end if;
 end loop;
 result:=public.confirm_order_before_id_tags(p_key,p_draft,p_customer,p_items);
 update public.order_items oi set snapshot=oi.snapshot||jsonb_build_object('tag_snapshot',public.configured_tag_snapshot(item.value)) from jsonb_array_elements(p_items) with ordinality item(value,position) where oi.order_id=(result->>'id')::uuid and oi.position=item.position;
 return public.order_document((result->>'id')::uuid);
end;$$;
revoke all on function public.confirm_order(uuid,uuid,jsonb,jsonb) from public,anon;
grant execute on function public.confirm_order(uuid,uuid,jsonb,jsonb) to authenticated;
do $$ begin if exists(select 1 from pg_publication where pubname='supabase_realtime') then alter publication supabase_realtime add table public.id_tag_configuration;end if;end $$;
notify pgrst,'reload schema';
