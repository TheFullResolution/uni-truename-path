alter table public.names enable row level security;
alter table public.profiles enable row level security;
alter table public.consents enable row level security;

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
