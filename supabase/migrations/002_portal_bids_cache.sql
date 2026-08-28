-- Shared Orange County open-bids cache (public portal data).
-- Loaded by GET /api/scrape-projects; refreshed only via POST (Refresh button).

create table if not exists portal_bids_cache (
  id int primary key default 1 check (id = 1),
  projects jsonb not null default '[]'::jsonb,
  scraped_at timestamptz not null default now()
);

alter table portal_bids_cache enable row level security;

drop policy if exists "portal_bids_cache_select_authenticated" on portal_bids_cache;
create policy "portal_bids_cache_select_authenticated"
  on portal_bids_cache for select
  to authenticated
  using (true);
