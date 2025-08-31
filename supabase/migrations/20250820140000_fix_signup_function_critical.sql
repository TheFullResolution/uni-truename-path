-- Critical Fix: Complete Signup Function - Column References and Missing Fields
-- Fixes critical issues preventing OIDC signup from working properly

-- Drop the existing function with all its variants
DROP FUNCTION IF EXISTS complete_signup_with_oidc(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS complete_signup_with_oidc(UUID, TEXT, TEXT, TEXT, TEXT);

-- Create the function with correct column references
CREATE FUNCTION complete_signup_with_oidc(
  p_user_id UUID,
  p_given_name TEXT,
  p_family_name TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_nickname TEXT DEFAULT NULL,
  p_preferred_username TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_default_context_id UUID;
  v_given_name_id UUID;
  v_family_name_id UUID;
  v_display_name_id UUID;
  v_nickname_id UUID;
  v_preferred_username_id UUID;
  v_full_name_id UUID;
  v_full_name TEXT;
BEGIN
  -- Get or create default context (FIXED: use is_permanent instead of is_default)
  SELECT id INTO v_default_context_id
  FROM user_contexts
  WHERE user_id = p_user_id AND is_permanent = TRUE;

  IF v_default_context_id IS NULL THEN
-- FIXED: Remove non-existent columns (visibility, allowed_scopes)
INSERT INTO user_contexts (
  user_id, context_name, description, is_permanent
) VALUES (
  p_user_id, 'Default', 'Default identity context', TRUE
) RETURNING id INTO v_default_context_id;
  END IF;

  -- Auto-generate full name from given_name + family_name
  v_full_name := p_given_name || ' ' || p_family_name;

  -- Create required names (given_name, family_name, full name)
  -- Set the given_name as the preferred name for proper API ordering
  INSERT INTO names (user_id, name_text, is_preferred)
  VALUES (p_user_id, p_given_name, TRUE)
  RETURNING id INTO v_given_name_id;

  INSERT INTO names (user_id, name_text)
  VALUES (p_user_id, p_family_name)
  RETURNING id INTO v_family_name_id;

  INSERT INTO names (user_id, name_text)
  VALUES (p_user_id, v_full_name)
  RETURNING id INTO v_full_name_id;

  -- FIXED: Add missing user_id to all context_name_assignments
  -- Assign required OIDC properties to default context
  INSERT INTO context_name_assignments (user_id, context_id, name_id, oidc_property, is_primary)
  VALUES (p_user_id, v_default_context_id, v_given_name_id, 'given_name', TRUE);

  INSERT INTO context_name_assignments (user_id, context_id, name_id, oidc_property, is_primary)
  VALUES (p_user_id, v_default_context_id, v_family_name_id, 'family_name', TRUE);

  INSERT INTO context_name_assignments (user_id, context_id, name_id, oidc_property, is_primary)
  VALUES (p_user_id, v_default_context_id, v_full_name_id, 'name', TRUE);

  -- Optional names with OIDC assignments (FIXED: Add missing user_id)
  IF p_display_name IS NOT NULL THEN
INSERT INTO names (user_id, name_text)
VALUES (p_user_id, p_display_name)
RETURNING id INTO v_display_name_id;

INSERT INTO context_name_assignments (user_id, context_id, name_id, oidc_property, is_primary)
VALUES (p_user_id, v_default_context_id, v_display_name_id, 'display_name', TRUE);
  END IF;

  IF p_nickname IS NOT NULL THEN
INSERT INTO names (user_id, name_text)
VALUES (p_user_id, p_nickname)
RETURNING id INTO v_nickname_id;

INSERT INTO context_name_assignments (user_id, context_id, name_id, oidc_property, is_primary)
VALUES (p_user_id, v_default_context_id, v_nickname_id, 'nickname', TRUE);
  END IF;

  -- New: Support for preferred_username (FIXED: Add missing user_id)
  IF p_preferred_username IS NOT NULL THEN
INSERT INTO names (user_id, name_text)
VALUES (p_user_id, p_preferred_username)
RETURNING id INTO v_preferred_username_id;

INSERT INTO context_name_assignments (user_id, context_id, name_id, oidc_property, is_primary)
VALUES (p_user_id, v_default_context_id, v_preferred_username_id, 'preferred_username', TRUE);
  END IF;

  RETURN jsonb_build_object(
'success', true,
'default_context_id', v_default_context_id,
'names_created', jsonb_build_object(
  'given_name', v_given_name_id,
  'family_name', v_family_name_id,
  'name', v_full_name_id,
  'display_name', v_display_name_id,
  'nickname', v_nickname_id,
  'preferred_username', v_preferred_username_id
)
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Add comment documenting the critical fixes
COMMENT ON FUNCTION complete_signup_with_oidc IS 'Fixed critical issues: 1) is_default -> is_permanent, 2) context_id -> id for RETURNING, 3) Added missing user_id to all context_name_assignments, 4) Removed non-existent columns from user_contexts INSERT';