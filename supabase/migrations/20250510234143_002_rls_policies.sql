alter table public.names enable row level security;
alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.name_disclosure_log enable row level security;

-- helper: pull JWT audience from the request
create
or replace
function current_aud() returns text language sql as $$
select coalesce(
   (current_setting('request.jwt.claims', true)::json ->> 'aud'),
   'unknown'
   );
$$;

-- 3-1  Names are visible when …
create
policy select_visible_names
on public.names
for
select
using (
-- you own the profile
auth.uid() = profile_id
or -- OR consent says audience may see it
exists (
select 1 from public.consents c
where c.profile_id = names.profile_id
and c.audience = current_aud()
and c.granted
)
or -- OR visibility not sensitive
visibility = 'public'
);

-- 3-2  Profiles: any authenticated user may read minimal row
create
policy select_profiles
on public.profiles
for
select
using ( auth.role() in ('authenticated', 'service_role') );

-- Consent table policies
create policy "Users can view own consents" on public.consents
for select using (auth.uid() = profile_id);

create policy "Users can insert own consents" on public.consents
for insert with check (auth.uid() = profile_id);

create policy "Users can update own consents" on public.consents
for update using (auth.uid() = profile_id);

-- Disclosure log policies (read-only for users)
create policy "Users can view own disclosure log" on public.name_disclosure_log
for select using (auth.uid() = profile_id);
