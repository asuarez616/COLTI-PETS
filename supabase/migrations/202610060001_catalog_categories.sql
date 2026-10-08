create table public.catalog_categories(name text primary key check(length(btrim(name)) between 1 and 80),created_at timestamptz not null default now());
alter table public.catalog_categories enable row level security;
create policy categories_owner_read on public.catalog_categories for select to authenticated using(public.is_owner());
create policy categories_owner_create on public.catalog_categories for insert to authenticated with check(public.is_owner());
grant select,insert on public.catalog_categories to authenticated;
notify pgrst,'reload schema';
