-- Fix schema to match test expectations

-- Add RLS policies for testing
-- Allow service role full access for testing
CREATE POLICY "Service role can do everything on profiles" ON public.profiles
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on names" ON public.names
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on consents" ON public.consents
FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on disclosure log" ON public.name_disclosure_log
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add missing columns to consents table
ALTER TABLE public.consents 
ADD COLUMN IF NOT EXISTS access_level text DEFAULT 'full',
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Add name_disclosed column to audit log
ALTER TABLE public.name_disclosure_log
ADD COLUMN IF NOT EXISTS name_disclosed text;

-- Update the resolve_name function to match test expectations
CREATE OR REPLACE FUNCTION public.resolve_name(
  p_profile uuid,
  p_audience text,
  p_purpose text
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text;
  v_name_id uuid;
  v_has_consent boolean := false;
  v_access_level text;
BEGIN
  -- Check if user has given consent for this specific audience
  SELECT EXISTS(
SELECT 1 FROM public.consents c 
WHERE c.profile_id = p_profile 
AND c.audience = p_audience 
AND c.active = true
  ) INTO v_has_consent;
  
  -- Get access level if consent exists
  IF v_has_consent THEN
SELECT c.access_level INTO v_access_level
FROM public.consents c
WHERE c.profile_id = p_profile 
AND c.audience = p_audience 
AND c.active = true
LIMIT 1;
  END IF;

  -- Select the most appropriate name based on audience and consent
  SELECT n.name_text, n.id INTO v_name, v_name_id
  FROM public.names n
  WHERE n.profile_id = p_profile
  AND v_has_consent  -- Must have consent to see any name
  AND (
-- Full access: can see names based on visibility
(v_access_level = 'full' AND (
  n.visibility IN ('public', 'internal') OR
  (n.visibility = 'restricted' AND p_audience = 'hr_department') OR
  n.visibility = 'private' AND false  -- private never shown
))
OR
-- Preferred only: can only see preferred/nickname names if visible
(v_access_level = 'preferred_only' AND n.type IN ('preferred', 'nickname') AND n.visibility IN ('public', 'internal'))
OR
-- Alias only: can only see aliases if visible
(v_access_level = 'alias_only' AND n.type = 'alias' AND n.visibility IN ('public', 'internal'))
  )
  ORDER BY
-- Priority based on audience context and access level
CASE 
  WHEN p_audience = 'hr_department' AND v_access_level = 'full' THEN 
CASE n.type 
  WHEN 'legal' THEN 1  -- HR sees legal names first
  WHEN 'preferred' THEN 2
  ELSE 3 
END
  WHEN p_audience IN ('slack_internal', 'slack') AND v_access_level = 'preferred_only' THEN
CASE n.type
  WHEN 'preferred' THEN 1  -- Slack sees preferred first
  WHEN 'nickname' THEN 2  -- Then nicknames
  ELSE 3
END
  WHEN p_audience IN ('github_public', 'github') AND v_access_level = 'alias_only' THEN
CASE n.type
  WHEN 'alias' THEN 1  -- GitHub sees aliases
  ELSE 3
END
  ELSE
CASE n.type   -- Default priority
  WHEN 'preferred' THEN 1
  WHEN 'nickname' THEN 2
  WHEN 'legal' THEN 3
  WHEN 'alias' THEN 4
  ELSE 5
END
END,
n.verified DESC,
n.created_at DESC
  LIMIT 1;

  -- Log the disclosure for audit trail
  IF v_name IS NOT NULL THEN
INSERT INTO public.name_disclosure_log
  (profile_id, name_id, audience, purpose, requested_by, name_disclosed)
VALUES (p_profile, v_name_id, p_audience, p_purpose, auth.uid(), v_name);
  END IF;

  -- Return the name or a fallback
  RETURN COALESCE(v_name, 'Anonymous User');
END $$;