-- Step 15: Complete Legacy System Removal
-- Remove legacy resolve_name function as part of OIDC migration
-- This is a university project - no backwards compatibility required

DROP FUNCTION IF EXISTS resolve_name(uuid, uuid, text);