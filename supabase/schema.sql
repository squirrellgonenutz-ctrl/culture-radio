-- Run once in the new Culture Radio project's SQL editor.
create table if not exists public.radio_favourites (
  user_id uuid not null references auth.users(id) on delete cascade,
  station_id text not null check (station_id in ('flex','centreforce','rinse','kool','pointblank','ukbass','eruption','sub')),
  created_at timestamptz not null default now(),
  primary key (user_id, station_id)
);
alter table public.radio_favourites enable row level security;
revoke all on public.radio_favourites from anon;
grant usage on schema public to authenticated;
grant select, insert, delete on public.radio_favourites to authenticated;
create policy "Read own favourites" on public.radio_favourites for select to authenticated using ((select auth.uid()) = user_id);
create policy "Save own favourites" on public.radio_favourites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Remove own favourites" on public.radio_favourites for delete to authenticated using ((select auth.uid()) = user_id);
