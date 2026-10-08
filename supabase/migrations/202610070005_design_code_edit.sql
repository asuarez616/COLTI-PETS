alter table public.designs add column code_override text;
create function public.preserve_design_code() returns trigger language plpgsql set search_path='' as $$
begin
 if new.code_override is not null then new.code:=new.code_override; end if;
 return new;
end;$$;
create trigger preserve_design_code before update on public.designs for each row execute function public.preserve_design_code();
create function public.admin_rename_design(p_id uuid,p_previous text,p_code text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED'; end if;
 if p_code is null or p_code !~ '^[A-Z0-9][A-Z0-9_-]{0,39}$' then raise exception 'INVALID_CODE'; end if;
 update public.designs set code=p_code,code_override=p_code,updated_at=now() where id=p_id and code=p_previous and not deleted;
 if not found then raise exception 'STATE_CONFLICT'; end if;
end;$$;
revoke all on function public.admin_rename_design(uuid,text,text) from public,anon;
grant execute on function public.admin_rename_design(uuid,text,text) to authenticated;
notify pgrst,'reload schema';
