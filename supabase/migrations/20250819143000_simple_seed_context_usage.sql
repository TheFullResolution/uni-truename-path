-- Migration: Simple Context Usage Analytics Demo Data
-- Creates minimal realistic external OAuth/OIDC usage patterns
-- Part of Step 15: Reimagining Dashboard Statistics for Commercial Value

DO $$
DECLARE
  jj_user_id uuid := '54c00e81-cda9-4251-9456-7778df91b988';
  liwei_user_id uuid := '809d0224-81f1-48a0-9405-2258de21ea60';
  alex_user_id uuid := '257113c8-7a62-4758-9b1b-7992dd8aca1e';
  
  context_id uuid;
BEGIN
  -- Simple usage data for JJ
  SELECT id INTO context_id FROM public.user_contexts 
  WHERE user_id = jj_user_id LIMIT 1;
  
  IF context_id IS NOT NULL THEN
INSERT INTO public.context_usage_analytics (
  target_user_id, context_id, requesting_application,
  scopes_requested, properties_disclosed, response_time_ms,
  success, accessed_at
) VALUES 
(jj_user_id, context_id, 'microsoft-teams', 
 '{"profile"}', '{"name": "JJ"}', 2, true, now()),
(jj_user_id, context_id, 'github-api', 
 '{"user"}', '{"name": "J. Lewandowski"}', 3, true, now() - interval '1 hour');
  END IF;

  -- Simple usage data for Li Wei
  SELECT id INTO context_id FROM public.user_contexts 
  WHERE user_id = liwei_user_id LIMIT 1;
  
  IF context_id IS NOT NULL THEN
INSERT INTO public.context_usage_analytics (
  target_user_id, context_id, requesting_application,
  scopes_requested, properties_disclosed, response_time_ms,
  success, accessed_at
) VALUES 
(liwei_user_id, context_id, 'linkedin-api',
 '{"profile"}', '{"name": "Wei Li"}', 2, true, now()),
(liwei_user_id, context_id, 'zoom-api',
 '{"user:read"}', '{"name": "Wei Li"}', 1, true, now() - interval '2 hours');
  END IF;

  -- Simple usage data for Alex
  SELECT id INTO context_id FROM public.user_contexts 
  WHERE user_id = alex_user_id LIMIT 1;
  
  IF context_id IS NOT NULL THEN
INSERT INTO public.context_usage_analytics (
  target_user_id, context_id, requesting_application,
  scopes_requested, properties_disclosed, response_time_ms,
  success, accessed_at
) VALUES 
(alex_user_id, context_id, 'github-api',
 '{"user"}', '{"login": "@CodeAlex"}', 1, true, now()),
(alex_user_id, context_id, 'freshbooks-api',
 '{"profile"}', '{"name": "Alexander Chen"}', 3, true, now() - interval '3 hours');
  END IF;

  RAISE LOG '✅ Simple Context Usage Analytics: Demo data created for 3 personas';
END $$;