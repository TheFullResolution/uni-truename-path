-- 4-1  Stored proc that both returns the correct name
--  AND writes to the audit table.
create
or replace
function public.resolve_name(
  p_profile uuid,
  p_audience text,
  p_purpose  text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_name  text;
v_name_id uuid;
begin
select n.name_text,
   n.id into v_name, v_name_id
from public.names n
where n.profile_id = p_profile
  and n.id in (
select id from public.names
where profile_id = p_profile
  and (visibility = 'public'
   or exists (select 1
from public.consents c
where c.profile_id = p_profile
  and c.audience = p_audience
  and c.granted))
order by
case when type='preferred' then 0
when type='nickname' then 1
when type='legal' then 2
else 3 end
limit 1);

insert into public.name_disclosure_log
(profile_id, name_id, audience, purpose, requested_by)
values (p_profile, v_name_id, p_audience, p_purpose, auth.uid());

return v_name;
end $$;

-- 4-2  Grant execute to anonymous/edge role
grant execute on function public.resolve_name(uuid,text,text) to anon;
