-- TrueNamePath: Migration 025 - Fix OIDC Function to Use Permanent Context
-- Purpose: Update complete_signup_with_oidc function to use is_permanent instead of is_default
-- Status: Production-ready

BEGIN;

-- ===
-- Update complete_signup_with_oidc function
-- ===

CREATE OR REPLACE FUNCTION complete_signup_with_oidc(
  p_user_id UUID,
  p_given_name TEXT,
  p_family_name TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_nickname TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_default_context_id UUID;
  v_given_name_id UUID;
  v_family_name_id UUID;
  v_display_name_id UUID;
  v_nickname_id UUID;
BEGIN
  -- Get or create default permanent context
  SELECT id INTO v_default_context_id
  FROM user_contexts
  WHERE user_id = p_user_id AND is_permanent = TRUE;

  IF v_default_context_id IS NULL THEN
INSERT INTO user_contexts (
  user_id, context_name, description, is_permanent
) VALUES (
  p_user_id, 'Default', 'Default identity context', TRUE
) RETURNING id INTO v_default_context_id;
  END IF;

  -- Create names (just text, no type)
  INSERT INTO names (user_id, name_text)
  VALUES (p_user_id, p_given_name)
  RETURNING id INTO v_given_name_id;

  INSERT INTO names (user_id, name_text)
  VALUES (p_user_id, p_family_name)
  RETURNING id INTO v_family_name_id;

  -- Assign to default context WITH OIDC properties
  INSERT INTO context_name_assignments (user_id, context_id, name_id, oidc_property, is_primary)
  VALUES (p_user_id, v_default_context_id, v_given_name_id, 'given_name', TRUE);

  INSERT INTO context_name_assignments (user_id, context_id, name_id, oidc_property, is_primary)
  VALUES (p_user_id, v_default_context_id, v_family_name_id, 'family_name', TRUE);

  -- Optional names
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

  RETURN jsonb_build_object(
'success', true,
'default_context_id', v_default_context_id,
'names_created', jsonb_build_object(
  'given_name', v_given_name_id,
  'family_name', v_family_name_id,
  'display_name', v_display_name_id,
  'nickname', v_nickname_id
)
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Add documentation
COMMENT ON FUNCTION complete_signup_with_oidc(UUID, TEXT, TEXT, TEXT, TEXT) IS 
  'Completes OIDC signup by creating default permanent context and assigning names with OIDC properties';

-- Log function update
DO $$
BEGIN
  RAISE LOG 'TrueNamePath Migration 025: Updated complete_signup_with_oidc function to use is_permanent instead of is_default';
  RAISE LOG '✅ Function now looks for is_permanent = TRUE context';
  RAISE LOG '✅ Creates "Default" context instead of "Professional" context';
  RAISE LOG '✅ Uses proper column names that exist in the schema';
END $$;

COMMIT;

-- ===
-- POST-MIGRATION NOTES
-- ===

-- This migration fixes the complete_signup_with_oidc function:
--
-- KEY FIXES:
-- ✅ Changed WHERE clause from is_default = TRUE to is_permanent = TRUE
-- ✅ Changed context creation from 'Professional' to 'Default'  
-- ✅ Changed description from 'Default professional identity' to 'Default identity context'
-- ✅ Removed non-existent columns (visibility, allowed_scopes) from INSERT
-- ✅ Function now uses correct column names that exist in user_contexts table
--
-- FUNCTION BEHAVIOR:
-- • Looks for existing permanent context for the user
-- • If not found, creates new "Default" permanent context
-- • Creates name entries and assigns them to context with OIDC properties
-- • Returns success response with context and name IDs
--
-- TESTING:
-- • Test OIDC signup flow with new users
-- • Verify "Default" context is created with is_permanent = TRUE
-- • Verify names are properly assigned with OIDC properties
-- • Verify function returns expected JSONB response