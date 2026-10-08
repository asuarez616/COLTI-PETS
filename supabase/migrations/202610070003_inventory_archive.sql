-- Archive inventory without deleting historical references or snapshots.
alter table public.designs add column deleted boolean not null default false;
alter table public.closures add column deleted boolean not null default false;
create function public.admin_delete_design(p_id uuid,p_version text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED';end if;
 perform 1 from public.designs where id=p_id and asset_version=p_version and not deleted for update;
 if not found then raise exception 'STATE_CONFLICT';end if;
 update public.designs set deleted=true,active=false where id=p_id;
end;$$;
revoke all on function public.admin_delete_design(uuid,text) from public,anon;
grant execute on function public.admin_delete_design(uuid,text) to authenticated;
create function public.admin_delete_closure(p_key text,p_revision integer) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'OWNER_REQUIRED';end if;
 perform 1 from public.closures where key=p_key and revision=p_revision and not deleted for update;
 if not found then raise exception 'STATE_CONFLICT';end if;
 update public.closures set deleted=true,active=false,revision=revision+1 where key=p_key;
end;$$;
revoke all on function public.admin_delete_closure(text,integer) from public,anon;
grant execute on function public.admin_delete_closure(text,integer) to authenticated;
-- Archived entries cannot be restored by an old editor or a Drive import.
create function public.guard_archived_inventory() returns trigger language plpgsql set search_path='' as $$
begin if old.deleted then new.deleted:=true;new.active:=false;end if;return new;end;$$;
create trigger guard_archived_design before update on public.designs for each row execute function public.guard_archived_inventory();
create trigger guard_archived_closure before update on public.closures for each row execute function public.guard_archived_inventory();
alter function public.catalog_variant_available(uuid,text,numeric) rename to catalog_variant_available_before_archive;
create function public.catalog_variant_available(p_design uuid,p_size text,p_width numeric) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.designs where id=p_design and not deleted) and public.catalog_variant_available_before_archive(p_design,p_size,p_width);$$;
notify pgrst,'reload schema';
