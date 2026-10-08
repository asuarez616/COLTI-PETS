-- Decoration may accompany one exclusive media type; attachment ownership and purpose remain unchanged.
create or replace function public.validate_order_item(i jsonb) returns void language plpgsql stable set search_path='' as $$
declare kind text; icons jsonb; available jsonb; a jsonb;
begin
 if i is null or jsonb_typeof(i)<>'object' then raise exception 'INVALID_ITEM'; end if;
 if not public.json_text_valid(i,'id',36,36) or i->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'INVALID_ITEM_ID'; end if;
 if not public.json_text_valid(i,'collar_type',1,30) or i->>'collar_type' not in ('plastic_buckle','metal_buckle','martingale') or not public.json_text_valid(i,'tag_type',1,20) or i->>'tag_type' not in ('hanging','anti_fall') then raise exception 'INVALID_TYPE'; end if;
 if not public.json_text_valid(i,'pet_name',1,200) or i->>'pet_name' ~ '^[[:space:]]*$' or not public.json_text_valid(i,'tag_phone',7,32) or not public.valid_phone(i->>'tag_phone') then raise exception 'INVALID_TAG'; end if;
 if not public.json_text_valid(i,'extra_text',0,2000) or not public.json_text_valid(i,'personalization_notes',0,2000) then raise exception 'INVALID_PERSONALIZATION'; end if;
 if not public.json_text_valid(i,'personalization_type',1,20) or i->>'personalization_type' not in ('none','decoration','drawing','dog_photo') then raise exception 'INVALID_PERSONALIZATION'; end if;
 kind:=i->>'personalization_type';
 if coalesce(jsonb_typeof(i->'width_cm'),'')<>'number' or coalesce(jsonb_typeof(i->'font_number'),'')<>'number' or (i->>'font_number')::numeric<>trunc((i->>'font_number')::numeric) then raise exception 'INVALID_SIZE_OR_FONT'; end if;
 if i->>'tag_type'='hanging' then
  if not public.json_text_valid(i,'tagShape',1,20) or not public.json_text_valid(i,'tagSize',1,20) or coalesce(jsonb_typeof(i->'tagWidthCm'),'')<>'number' or coalesce(jsonb_typeof(i->'tagHeightCm'),'')<>'number' then raise exception 'INVALID_TAG_SELECTION'; end if;
  if not exists(select 1 from public.tag_options where active and shape=i->>'tagShape' and size=i->>'tagSize' and width_cm=(i->>'tagWidthCm')::numeric and height_cm=(i->>'tagHeightCm')::numeric) then raise exception 'INVALID_TAG_SELECTION'; end if;
 end if;
 perform public.validate_tag_extras(i->'tagExtras');
 if i?'tagEmail' and i->'tagEmail'<>'null'::jsonb then
  if not public.json_text_valid(i,'tagEmail',0,254) or (i->>'tagEmail'<>'' and i->>'tagEmail' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'INVALID_EMAIL'; end if;
 end if;
 if i?'decorationIcon' and i->'decorationIcon'<>'null'::jsonb then
  if not public.json_text_valid(i,'decorationIcon',1,20) or i->>'decorationIcon' not in ('heart','star','paw','bone','crown') or kind='none' then raise exception 'INVALID_DECORATION'; end if;
 end if;
 icons:=coalesce(nullif(i->'informationIcons','null'::jsonb),'[]'::jsonb);
 if jsonb_typeof(icons)<>'array' then raise exception 'INVALID_INFORMATION_ICONS'; end if;
 if jsonb_array_length(icons)>4 or (select count(*)<>count(distinct value) from jsonb_array_elements(icons)) then raise exception 'INVALID_INFORMATION_ICONS'; end if;
 available:=public.information_icons_for(i);
 if exists(select 1 from jsonb_array_elements(icons) v where jsonb_typeof(v)<>'string' or v#>>'{}' not in ('phone','neutered','address','email') or not available @> jsonb_build_array(v)) then raise exception 'INVALID_INFORMATION_ICONS'; end if;
 if kind='none' and jsonb_array_length(icons)>0 then raise exception 'INVALID_INFORMATION_ICONS'; end if;
 if kind='decoration' and coalesce(i->>'decorationIcon','')='' and jsonb_array_length(available)=0 then raise exception 'INVALID_DECORATION'; end if;
 if coalesce(jsonb_typeof(i->'attachments'),'')<>'array' then raise exception 'INVALID_ATTACHMENTS'; end if;
 if jsonb_array_length(i->'attachments')>3 or (kind not in ('drawing','dog_photo') and jsonb_array_length(i->'attachments')>0) then raise exception 'INVALID_ATTACHMENTS'; end if;
 if kind in ('drawing','dog_photo') and jsonb_array_length(i->'attachments')=0 then raise exception 'ATTACHMENT_REQUIRED'; end if;
 for a in select value from jsonb_array_elements(i->'attachments') loop
  if jsonb_typeof(a)<>'object' or not public.json_text_valid(a,'id',36,36) or a->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'INVALID_ATTACHMENT'; end if;
 end loop;
end;$$;

