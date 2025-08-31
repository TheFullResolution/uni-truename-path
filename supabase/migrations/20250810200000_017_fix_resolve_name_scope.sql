-- TrueNamePath: Fix resolve_name() variable scoping issue
-- Issue: v_fallback_reason variable declared in nested block but used outside

BEGIN;

-- Fix the resolve_name function variable scoping issue
CREATE OR REPLACE FUNCTION public.resolve_name(
p_target_user_id uuid,
p_requester_user_id uuid DEFAULT NULL,
p_context_name text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
v_context_id uuid;
v_name_id uuid;
v_resolved_name text;
v_preferred_name text;
v_used_fallback boolean := false;
v_resolution_type text;
v_context_name_for_audit text;
v_fallback_reason text; -- Move this to main DECLARE block
BEGIN
-- Input validation
IF p_target_user_id IS NULL THEN
RAISE EXCEPTION 'resolve_name(): target_user_id cannot be NULL';
END IF;

-- =============================================================================
-- PRIORITY 1: Consent-based resolution (highest priority)
-- =============================================================================
-- If requester is provided, check for active consent from target user
IF p_requester_user_id IS NOT NULL THEN
SELECT c.context_id INTO v_context_id
FROM public.consents c
WHERE c.granter_user_id = p_target_user_id
  AND c.requester_user_id = p_requester_user_id
  AND c.status = 'GRANTED'
  AND (c.expires_at IS NULL OR c.expires_at > now());

-- If active consent found, get the name assigned to that context
IF v_context_id IS NOT NULL THEN
SELECT cna.name_id, uc.context_name INTO v_name_id, v_context_name_for_audit
FROM public.context_name_assignments cna
JOIN public.user_contexts uc ON uc.id = cna.context_id
WHERE cna.context_id = v_context_id
  AND cna.user_id = p_target_user_id;

IF v_name_id IS NOT NULL THEN
SELECT name_text INTO v_resolved_name
FROM public.names
WHERE id = v_name_id;

IF v_resolved_name IS NOT NULL THEN
v_resolution_type := 'consent_based';

-- Log successful consent-based resolution
INSERT INTO public.audit_log_entries
(target_user_id, requester_user_id, context_id, resolved_name_id, action, details)
VALUES
(p_target_user_id, p_requester_user_id, v_context_id, v_name_id, 'NAME_DISCLOSED',
 jsonb_build_object(
'resolution_type', v_resolution_type,
'context_name', v_context_name_for_audit,
'consent_based', true
 ));

RETURN v_resolved_name;
END IF;
END IF;
END IF;
END IF;

-- =============================================================================  
-- PRIORITY 2: Context-specific resolution (second priority)
-- =============================================================================
-- If context name is provided, look for user's context with that name
IF p_context_name IS NOT NULL AND trim(p_context_name) != '' THEN
SELECT id INTO v_context_id
FROM public.user_contexts
WHERE user_id = p_target_user_id
  AND context_name = p_context_name;

IF v_context_id IS NOT NULL THEN
SELECT cna.name_id INTO v_name_id
FROM public.context_name_assignments cna
WHERE cna.context_id = v_context_id
  AND cna.user_id = p_target_user_id;

IF v_name_id IS NOT NULL THEN
SELECT name_text INTO v_resolved_name
FROM public.names
WHERE id = v_name_id;

IF v_resolved_name IS NOT NULL THEN
v_resolution_type := 'context_specific';

-- Log successful context-specific resolution
INSERT INTO public.audit_log_entries
(target_user_id, requester_user_id, context_id, resolved_name_id, action, details)
VALUES
(p_target_user_id, p_requester_user_id, v_context_id, v_name_id, 'NAME_DISCLOSED',
 jsonb_build_object(
'resolution_type', v_resolution_type,
'context_name', p_context_name,
'user_defined_context', true
 ));

RETURN v_resolved_name;
END IF;
END IF;
END IF;
END IF;

-- =============================================================================
-- PRIORITY 3: Preferred name fallback (lowest priority)
-- =============================================================================
-- When no specific context assignment exists, fall back to user's preferred name
SELECT name_text, id INTO v_preferred_name, v_name_id
FROM public.names
WHERE user_id = p_target_user_id
  AND is_preferred = true
LIMIT 1;

v_used_fallback := true;
v_resolution_type := 'preferred_fallback';

-- Determine fallback reason for audit trail (now using variable from main scope)
IF p_requester_user_id IS NOT NULL AND p_context_name IS NOT NULL THEN
v_fallback_reason := 'no_consent_and_no_context_assignment';
ELSIF p_requester_user_id IS NOT NULL THEN
v_fallback_reason := 'no_active_consent';
ELSIF p_context_name IS NOT NULL THEN
v_fallback_reason := 'context_not_found_or_no_assignment';
ELSE
v_fallback_reason := 'no_specific_request';
END IF;

-- Log fallback resolution with detailed reasoning
INSERT INTO public.audit_log_entries
(target_user_id, requester_user_id, context_id, resolved_name_id, action, details)
VALUES
(p_target_user_id, p_requester_user_id, NULL, v_name_id, 'NAME_DISCLOSED',
 jsonb_build_object(
'resolution_type', v_resolution_type,
'fallback_reason', v_fallback_reason,
'requested_context', p_context_name,
'had_requester', (p_requester_user_id IS NOT NULL)
 ));

-- Return preferred name or ultimate fallback
RETURN COALESCE(v_preferred_name, 'Anonymous User');

EXCEPTION
WHEN OTHERS THEN
-- Log error for debugging but don't break calling code
RAISE LOG 'resolve_name() error: % (Target: %, Requester: %, Context: %)',
  SQLERRM, p_target_user_id, p_requester_user_id, p_context_name;

-- Insert error audit log
INSERT INTO public.audit_log_entries
(target_user_id, requester_user_id, context_id, resolved_name_id, action, details)
VALUES
(p_target_user_id, p_requester_user_id, NULL, NULL, 'NAME_DISCLOSED',
 jsonb_build_object(
'resolution_type', 'error_fallback',
'error_message', SQLERRM,
'requested_context', p_context_name
 ));

RETURN 'Anonymous User';
END $$;

-- Log fix completion
DO $$
BEGIN
  RAISE LOG 'TrueNamePath: resolve_name() variable scoping issue fixed';
  RAISE LOG '  ✅ v_fallback_reason moved to main DECLARE block';
  RAISE LOG '  ✅ Function should now work correctly for all test scenarios';
END $$;

COMMIT;