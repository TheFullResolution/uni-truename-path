-- Step 16.1.6: Fix Token Generation Function - Add explicit RETURN
-- Purpose: Fix linting warning about missing RETURN statement
-- Context: PostgreSQL linter warning fix for generate_oauth_token function

-- ===
-- SECTION 1: MIGRATION INITIALIZATION & LOGGING
-- ===

-- Log migration start
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Fixing Token Generation Function Linting Warning';
RAISE LOG 'Migration: 035_fix_token_generation_return - Add explicit RETURN statement';
RAISE LOG 'Issue: PostgreSQL linter warning about control reaching end without RETURN';
RAISE LOG 'Solution: Add explicit RETURN statement after loop for safety';
END
$$;

-- ===
-- SECTION 2: FIX TOKEN GENERATION FUNCTION
-- ===

-- Fix the generate_oauth_token function to address linting warning
CREATE OR REPLACE FUNCTION public.generate_oauth_token()
RETURNS varchar(36)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token varchar(36);
  collision_count integer := 0;
  max_retries constant integer := 10;
  uuid_hex text;
BEGIN
  -- Generate tokens with collision retry logic using built-in gen_random_uuid()
  LOOP
-- Generate UUID and convert to hex (remove hyphens, take first 32 chars)
uuid_hex := replace(gen_random_uuid()::text, '-', '');
uuid_hex := substring(uuid_hex from 1 for 32);

-- Generate new token: 'tnp_' + 32 hex characters from UUID
new_token := 'tnp_' || uuid_hex;

-- Check for collision
IF NOT EXISTS (SELECT 1 FROM public.oauth_sessions WHERE session_token = new_token) THEN
  RETURN new_token;
END IF;

-- Handle collisions with retry limit
collision_count := collision_count + 1;
IF collision_count >= max_retries THEN
  RAISE EXCEPTION 'Token generation failed: exceeded maximum retry attempts (%)' , max_retries
USING ERRCODE = '23505'; -- unique_violation
END IF;

-- Log collision for monitoring (rare occurrence)
RAISE LOG 'OAuth token collision detected, retrying (attempt %/%)', collision_count, max_retries;
  END LOOP;
  
  -- This should never be reached, but added to satisfy PostgreSQL linter
  -- If we somehow reach here, generate a final token attempt
  uuid_hex := replace(gen_random_uuid()::text, '-', '');
  uuid_hex := substring(uuid_hex from 1 for 32);
  RETURN 'tnp_' || uuid_hex;
END $$;

-- Add function documentation
COMMENT ON FUNCTION public.generate_oauth_token() IS 
'FIXED: Generates unique OAuth session tokens with tnp_ prefix using gen_random_uuid().
Uses built-in PostgreSQL gen_random_uuid() for reliable token generation without extension dependencies.
Includes collision detection and retry logic with maximum 10 attempts. 
Returns varchar(36) tokens in format: tnp_[32 hex characters from UUID].
Added explicit RETURN statement to satisfy PostgreSQL linter requirements.';

-- Grant execute permission to service role for token generation
GRANT EXECUTE ON FUNCTION public.generate_oauth_token() TO service_role;

-- ===
-- SECTION 3: VALIDATION & TESTING
-- ===

-- Test the fixed function
DO $$
DECLARE
  test_token varchar(36);
BEGIN
  -- Generate test token
  SELECT public.generate_oauth_token() INTO test_token;
  
  -- Validate token format
  IF test_token ~ '^tnp_[a-f0-9]{32}$' THEN
RAISE LOG 'Token Generation Linting Fix: Validation passed - generated token: %', substring(test_token from 1 for 10) || '...';
  ELSE
RAISE EXCEPTION 'Token Generation Linting Fix: Validation failed - invalid format: %', test_token;
  END IF;
  
  RAISE LOG 'Token Generation Linting Fix: Function validation successful';
END
$$;

-- ===
-- SECTION 4: MIGRATION COMPLETION
-- ===

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath OAuth Integration: Migration 035 completed successfully';
RAISE LOG '';
RAISE LOG '✅ TOKEN GENERATION FUNCTION LINTING FIX:';
RAISE LOG '  • Added explicit RETURN statement after LOOP';
RAISE LOG '  • Maintained all existing functionality and collision detection';
RAISE LOG '  • PostgreSQL linter warning resolved';
RAISE LOG '  • Function remains fully compatible with OAuth system';
RAISE LOG '';
RAISE LOG '🚀 generate_oauth_token function now passes all linting checks';
RAISE LOG '🚀 OAuth database infrastructure ready for Phase 2 API development';
END
$$;