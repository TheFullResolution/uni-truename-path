-- Step 1: Add new columns to context_name_assignments
ALTER TABLE context_name_assignments
ADD COLUMN IF NOT EXISTS oidc_property TEXT,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

-- Step 2: Add check constraint for valid OIDC properties
ALTER TABLE context_name_assignments
ADD CONSTRAINT valid_oidc_property CHECK (
  oidc_property IS NULL OR
  oidc_property IN ('given_name', 'family_name', 'nickname', 'display_name', 'preferred_username', 'name')
);

-- Step 3: Create unique constraint for primary per property per context
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_per_oidc_property
ON context_name_assignments(context_id, oidc_property)
WHERE is_primary = TRUE AND oidc_property IS NOT NULL;

-- Step 4: Migrate existing data based on current oidc_property_type
UPDATE context_name_assignments cna
SET 
  oidc_property = CASE
WHEN n.oidc_property_type = 'given_name' THEN 'given_name'
WHEN n.oidc_property_type = 'family_name' THEN 'family_name'
WHEN n.oidc_property_type = 'nickname' THEN 'nickname'
WHEN n.oidc_property_type = 'middle_name' THEN 'display_name'
WHEN n.oidc_property_type = 'preferred_username' THEN 'preferred_username'
WHEN n.oidc_property_type = 'name' THEN 'name'
ELSE 'name'
  END,
  is_primary = TRUE
FROM names n
WHERE n.id = cna.name_id
  AND n.oidc_property_type IS NOT NULL;

-- Step 5: Remove oidc_property_type column from names table
ALTER TABLE names
DROP COLUMN IF EXISTS oidc_property_type;

-- Step 6: Drop the enum type
DROP TYPE IF EXISTS oidc_property_type_enum CASCADE;

-- Step 7: Update complete_signup_with_oidc function
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

  -- Create names (just text, no type)
  INSERT INTO names (user_id, name_text)
  VALUES (p_user_id, p_given_name)
  RETURNING id INTO v_given_name_id;

  INSERT INTO names (user_id, name_text)
  VALUES (p_user_id, p_family_name)
  RETURNING id INTO v_family_name_id;

  -- Assign to default context WITH OIDC properties
  INSERT INTO context_name_assignments (context_id, name_id, oidc_property, is_primary)
  VALUES (v_default_context_id, v_given_name_id, 'given_name', TRUE);

  INSERT INTO context_name_assignments (context_id, name_id, oidc_property, is_primary)
  VALUES (v_default_context_id, v_family_name_id, 'family_name', TRUE);

  -- Optional names
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

-- Step 8: Update can_delete_name function to remove name_type logic
CREATE OR REPLACE FUNCTION can_delete_name(p_name_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_name_count INTEGER;
  v_can_delete BOOLEAN;
  v_reason TEXT;
BEGIN
  -- Check ownership
  IF NOT EXISTS (
SELECT 1 FROM names 
WHERE id = p_name_id AND user_id = p_user_id
  ) THEN
RETURN jsonb_build_object(
  'can_delete', false,
  'reason', 'Name not found or not owned by user'
);
  END IF;

  -- Count total names for user
  SELECT COUNT(*) INTO v_name_count
  FROM names
  WHERE user_id = p_user_id;

  -- Check if last name
  IF v_name_count <= 1 THEN
v_can_delete := false;
v_reason := 'Cannot delete last remaining name';
  ELSE
v_can_delete := true;
v_reason := NULL;
  END IF;

  RETURN jsonb_build_object(
'can_delete', v_can_delete,
'reason', v_reason,
'name_count', v_name_count
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Step 9: Create function to get OIDC claims for a context
CREATE OR REPLACE FUNCTION get_context_oidc_claims(
  p_context_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_claims JSONB := '{}'::JSONB;
  v_record RECORD;
BEGIN
  -- Build OIDC claims from context assignments
  FOR v_record IN
SELECT
  cna.oidc_property,
  n.name_text
FROM context_name_assignments cna
JOIN names n ON n.id = cna.name_id
WHERE cna.context_id = p_context_id
  AND cna.oidc_property IS NOT NULL
  AND cna.is_primary = TRUE
  LOOP
v_claims := v_claims || jsonb_build_object(v_record.oidc_property, v_record.name_text);
  END LOOP;

  RETURN v_claims;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;