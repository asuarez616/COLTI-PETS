alter function public.admin_id_tags(jsonb,integer) rename to admin_id_tags_before_fixed_ribbon;
create function public.admin_id_tags(p_value jsonb,p_revision integer) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if exists(select 1 from jsonb_array_elements(p_value->'mapping') m where m->>'model' in ('micro','miniature','small','semi_medium','medium','large') and not exists(select 1 from (values ('2XS',1::numeric,'micro'),('XS',1,'miniature'),('XS',1.5,'small'),('S',1.5,'small'),('S',2,'semi_medium'),('SM',2,'semi_medium'),('M',2.5,'medium'),('ML',2.5,'medium'),('ML',3,'large'),('L',3,'large'),('XL',3,'large'),('2XL',3,'large')) valid(size,width,model) where valid.size=m->>'size' and valid.width=(m->>'width')::numeric and valid.model=m->>'model')) then raise exception 'INVALID_MAPPING'; end if;
 return public.admin_id_tags_before_fixed_ribbon(p_value,p_revision);
end;$$;
revoke all on function public.admin_id_tags_before_fixed_ribbon(jsonb,integer) from public,anon,authenticated;
revoke all on function public.admin_id_tags(jsonb,integer) from public,anon;
grant execute on function public.admin_id_tags(jsonb,integer) to authenticated;
update public.id_tag_configuration set value=jsonb_set(value,'{mapping}', '[{"size":"2XS","width":1,"model":"micro"},{"size":"XS","width":1,"model":"miniature"},{"size":"XS","width":1.5,"model":"small"},{"size":"S","width":1.5,"model":"small"},{"size":"S","width":2,"model":"semi_medium"},{"size":"SM","width":2,"model":"semi_medium"},{"size":"M","width":2.5,"model":"medium"},{"size":"ML","width":2.5,"model":"medium"},{"size":"ML","width":3,"model":"large"},{"size":"L","width":3,"model":"large"},{"size":"XL","width":3,"model":"large"},{"size":"2XL","width":3,"model":"large"}]'::jsonb),revision=revision+1 where id=true;
notify pgrst,'reload schema';
