-- profiles  (one row per human)
create table public.profiles
(
id uuid primary key default gen_random_uuid(),
email  text unique not null,
created_at timestamptz not null default now()
);

-- names  (many per profile; the "multi-name" model)
create table public.names
(
id uuid primary key   default gen_random_uuid(),
profile_id uuid references public.profiles (id) on delete cascade,
name_text  textnot null,
type   text check (type in ('legal', 'preferred', 'nickname', 'alias')),
visibility text check (visibility in ('public', 'internal', 'restricted', 'private')) default 'internal',
verified   booleandefault false,
created_at timestamptz not null   default now(),
source text
);

-- consent ledger  (stores "YES, reveal X to Y for purpose Z")
create table public.consents
(
id uuid primary key default gen_random_uuid(),
profile_id uuidnot null references public.profiles (id) on delete cascade,
audience   textnot null, -- e.g. 'hr', 'slack'
purposetextnot null,
granted_at timestamptz not null default now(),
grantedboolean  default true
);

-- disclosure audit  (immutable)
create table public.name_disclosure_log
(
id   bigserial primary key,
profile_id   uuid,
name_id  uuid,
audience text,
purpose  text,
requested_by uuid, -- auth.uid() if available
disclosed_at timestamptz not null default now()
);
