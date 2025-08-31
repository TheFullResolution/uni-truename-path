-- Enhanced OIDC Compliance for Signup Function
-- Adds support for preferred_username and auto-generation of full name

-- Update complete_signup_with_oidc function to support preferred_username and auto-generate full name
CREATE OR REPLACE FUNCTION complete_signup_with_oidc(
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
  -- Get or create default context
  SELECT context_id INTO v_default_context_id
  FROM user_contexts
  WHERE user_id = p_user_id AND is_default = TRUE;

  IF v_default_context_id IS NULL THEN
INSERT INTO user_contexts (
  user_id, context_name, description, is_default, visibility, allowed_scopes
) VALUES (
  p_user_id, 'Professional', 'Default professional identity',
  TRUE, 'public', ARRAY['openid', 'profile', 'email']::TEXT[]
) RETURNING context_id INTO v_default_context_id;
  END IF;

  -- Auto-generate full name from given_name + family_name
  v_full_name := p_given_name || ' ' || p_family_name;

  -- Create required names (given_name, family_name, full name)
  INSERT INTO names (user_id, name_text)
  VALUES (p_user_id, p_given_name)
  RETURNING id INTO v_given_name_id;

  INSERT INTO names (user_id, name_text)
  VALUES (p_user_id, p_family_name)
  RETURNING id INTO v_family_name_id;

  INSERT INTO names (user_id, name_text)
  VALUES (p_user_id, v_full_name)
  RETURNING id INTO v_full_name_id;

  -- Assign required OIDC properties to default context
  INSERT INTO context_name_assignments (context_id, name_id, oidc_property, is_primary)
  VALUES (v_default_context_id, v_given_name_id, 'given_name', TRUE);

  INSERT INTO context_name_assignments (context_id, name_id, oidc_property, is_primary)
  VALUES (v_default_context_id, v_family_name_id, 'family_name', TRUE);

  INSERT INTO context_name_assignments (context_id, name_id, oidc_property, is_primary)
  VALUES (v_default_context_id, v_full_name_id, 'name', TRUE);

  -- Optional names with OIDC assignments
  IF p_display_name IS NOT NULL THEN
INSERT INTO names (user_id, name_text)
VALUES (p_user_id, p_display_name)
RETURNING id INTO v_display_name_id;

INSERT INTO context_name_assignments (context_id, name_id, oidc_property, is_primary)
VALUES (v_default_context_id, v_display_name_id, 'display_name', TRUE);
  END IF;

  IF p_nickname IS NOT NULL THEN
INSERT INTO names (user_id, name_text)
VALUES (p_user_id, p_nickname)
RETURNING id INTO v_nickname_id;

INSERT INTO context_name_assignments (context_id, name_id, oidc_property, is_primary)
VALUES (v_default_context_id, v_nickname_id, 'nickname', TRUE);
  END IF;

  -- New: Support for preferred_username
  IF p_preferred_username IS NOT NULL THEN
INSERT INTO names (user_id, name_text)
VALUES (p_user_id, p_preferred_username)
RETURNING id INTO v_preferred_username_id;

INSERT INTO context_name_assignments (context_id, name_id, oidc_property, is_primary)
VALUES (v_default_context_id, v_preferred_username_id, 'preferred_username', TRUE);
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