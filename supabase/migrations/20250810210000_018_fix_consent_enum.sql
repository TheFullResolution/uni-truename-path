-- TrueNamePath: Fix consent request ENUM issue
-- Date: August 10, 2025
-- Issue: audit_action ENUM missing CONSENT_REQUESTED value

BEGIN;

-- Add missing CONSENT_REQUESTED value to the audit_action enum
ALTER TYPE audit_action ADD VALUE 'CONSENT_REQUESTED';

-- Log the fix
DO $$
BEGIN
  RAISE LOG 'TrueNamePath: Fixed audit_action ENUM to include CONSENT_REQUESTED';
  RAISE LOG '  ✅ CONSENT_REQUESTED now available for request_consent() function';
END $$;

COMMIT;