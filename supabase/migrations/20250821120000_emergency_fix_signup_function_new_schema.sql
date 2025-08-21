-- EMERGENCY FIX: Update complete_signup_with_oidc function for new schema
-- Critical Issue: Function broken after Step 15.7.1 schema changes
-- Root Cause: Function still uses old context_name_assignments table structure
-- Fix: Update to use new context_oidc_assignments table structure

-- Date: August 21, 2025 - Emergency Database Fix
-- Migration: 20250821120000_emergency_fix_signup_function_new_schema.sql

-- Log the emergency fix
DO $$
BEGIN
RAISE LOG 'TrueNamePath Emergency Fix: Updating complete_signup_with_oidc function for new schema structure';
END
$$;

-- Drop the broken function
DROP FUNCTION IF EXISTS complete_signup_with_oidc(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Create the fixed function with correct table references
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
  v_error_context TEXT;
BEGIN
  -- Set error context for debugging
  v_error_context := 'complete_signup_with_oidc for user: ' || p_user_id;
  
  RAISE LOG 'Starting signup process for user: %', p_user_id;

  -- Get or create default context
  SELECT id INTO v_default_context_id
  FROM user_contexts
  WHERE user_id = p_user_id AND is_permanent = TRUE;

  IF v_default_context_id IS NULL THEN
RAISE LOG 'Creating default context for user: %', p_user_id;

INSERT INTO user_contexts (
  user_id, context_name, description, is_permanent
) VALUES (
  p_user_id, 'Default', 'Default identity context', TRUE
) RETURNING id INTO v_default_context_id;

RAISE LOG 'Created default context with ID: %', v_default_context_id;
  ELSE
RAISE LOG 'Using existing default context: %', v_default_context_id;
  END IF;

  -- Auto-generate full name from given_name + family_name
  v_full_name := p_given_name || ' ' || p_family_name;
  RAISE LOG 'Generated full name: %', v_full_name;

  -- Create required names (given_name, family_name, full name)
  -- Set the given_name as the preferred name for proper API ordering
  RAISE LOG 'Creating given name: %', p_given_name;
  INSERT INTO names (user_id, name_text, is_preferred)
  VALUES (p_user_id, p_given_name, TRUE)
  RETURNING id INTO v_given_name_id;

  RAISE LOG 'Creating family name: %', p_family_name;
  INSERT INTO names (user_id, name_text)
  VALUES (p_user_id, p_family_name)
  RETURNING id INTO v_family_name_id;

  RAISE LOG 'Creating full name: %', v_full_name;
  INSERT INTO names (user_id, name_text)
  VALUES (p_user_id, v_full_name)
  RETURNING id INTO v_full_name_id;

  -- FIXED: Use context_oidc_assignments table instead of context_name_assignments
  -- FIXED: Remove is_primary column (doesn't exist in new schema)
  
  RAISE LOG 'Creating OIDC assignment for given_name';
  INSERT INTO context_oidc_assignments (user_id, context_id, name_id, oidc_property)
  VALUES (p_user_id, v_default_context_id, v_given_name_id, 'given_name');

  RAISE LOG 'Creating OIDC assignment for family_name';
  INSERT INTO context_oidc_assignments (user_id, context_id, name_id, oidc_property)
  VALUES (p_user_id, v_default_context_id, v_family_name_id, 'family_name');

  RAISE LOG 'Creating OIDC assignment for name (full name)';
  INSERT INTO context_oidc_assignments (user_id, context_id, name_id, oidc_property)
  VALUES (p_user_id, v_default_context_id, v_full_name_id, 'name');

  -- Optional names with OIDC assignments
  IF p_display_name IS NOT NULL THEN
RAISE LOG 'Creating display name: %', p_display_name;
INSERT INTO names (user_id, name_text)
VALUES (p_user_id, p_display_name)
RETURNING id INTO v_display_name_id;

RAISE LOG 'Creating OIDC assignment for display_name';
INSERT INTO context_oidc_assignments (user_id, context_id, name_id, oidc_property)
VALUES (p_user_id, v_default_context_id, v_display_name_id, 'display_name');
  END IF;

  IF p_nickname IS NOT NULL THEN
RAISE LOG 'Creating nickname: %', p_nickname;
INSERT INTO names (user_id, name_text)
VALUES (p_user_id, p_nickname)
RETURNING id INTO v_nickname_id;

RAISE LOG 'Creating OIDC assignment for nickname';
INSERT INTO context_oidc_assignments (user_id, context_id, name_id, oidc_property)
VALUES (p_user_id, v_default_context_id, v_nickname_id, 'nickname');
  END IF;

  IF p_preferred_username IS NOT NULL THEN
RAISE LOG 'Creating preferred username: %', p_preferred_username;
INSERT INTO names (user_id, name_text)
VALUES (p_user_id, p_preferred_username)
RETURNING id INTO v_preferred_username_id;

RAISE LOG 'Creating OIDC assignment for preferred_username';
INSERT INTO context_oidc_assignments (user_id, context_id, name_id, oidc_property)
VALUES (p_user_id, v_default_context_id, v_preferred_username_id, 'preferred_username');
  END IF;

  RAISE LOG 'Successfully completed signup for user: %', p_user_id;

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

EXCEPTION
  WHEN OTHERS THEN
-- Log the error for debugging
RAISE LOG 'Error in %: % %', v_error_context, SQLSTATE, SQLERRM;

-- Return error information for debugging
RETURN jsonb_build_object(
  'success', false,
  'error', SQLERRM,
  'error_code', SQLSTATE,
  'context', v_error_context,
  'user_id', p_user_id,
  'given_name', p_given_name,
  'family_name', p_family_name
);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Add comprehensive comment documenting the emergency fix
COMMENT ON FUNCTION complete_signup_with_oidc IS 
'EMERGENCY FIX (Aug 21, 2025): Updated for Step 15.7.1 schema changes. 
Fixed: 1) Use context_oidc_assignments table instead of context_name_assignments, 
2) Removed is_primary column (does not exist in new schema), 
3) Added comprehensive error handling and logging for debugging, 
4) Maintains all original functionality with new table structure';

-- Log successful migration completion
DO $$
BEGIN
RAISE LOG 'TrueNamePath Emergency Fix Complete: complete_signup_with_oidc function updated for new schema structure';
END
$$;