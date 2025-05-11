-- JJ / Li Wei / Alex for UI demo
insert into public.profiles (id, email)
values ('11111111-1111-1111-1111-111111111111', 'jj@example.com'),
   ('22222222-2222-2222-2222-222222222222', 'li.wei@example.com'),
   ('33333333-3333-3333-3333-333333333333', 'alex@example.com');

insert into public.names (id, profile_id, name_text, type, visibility, verified)
values (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Jędrzej Lewandowski', 'legal', 'restricted', true),
   (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'JJ', 'preferred', 'internal', true),
   (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '李伟', 'legal', 'restricted', true),
   (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Wei Li', 'preferred', 'public', false),
   (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Alex Smith', 'legal', 'restricted', true),
   (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '@CodeAlex', 'nickname', 'public', false);

insert into public.consents (profile_id, audience, purpose, granted)
values ('11111111-1111-1111-1111-111111111111', 'hr', 'payroll', true),
   ('11111111-1111-1111-1111-111111111111', 'slack', 'display', true),
   ('22222222-2222-2222-2222-222222222222', 'slack', 'display', true);
