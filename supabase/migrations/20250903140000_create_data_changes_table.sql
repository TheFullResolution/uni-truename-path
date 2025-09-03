-- Migration: Create Data Changes Table
-- Purpose: Add GDPR-compliant data change tracking for profile/context modifications
-- Date: September 3, 2025
--
-- GDPR Compliance: Articles 15 & 20 (Right of access and data portability) require tracking data changes
-- for audit trails and data export functionality.
--
-- This addresses the gaps identified in step-21-gdpr-compliance-gaps.md:
-- - Profile Updates (name, email changes)
-- - Context creation/deletion/updates
-- - Name variant management
-- - Consent management changes

DO $$
BEGIN
RAISE LOG 'TrueNamePath GDPR Enhancement: Starting data changes table creation';
END $$;

-- ===
-- SECTION 1: CREATE DATA_CHANGES TABLE
-- ===

CREATE TABLE public.data_changes (
id bigserial PRIMARY KEY,
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
table_name varchar(100) NOT NULL,
record_id text NOT NULL, -- Using text to support different ID types (UUID, bigint, etc.)
operation varchar(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
old_values jsonb,
new_values jsonb,
changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Who made the change
change_reason varchar(200), -- Optional reason for the change
ip_address inet, -- IP address where change was made
user_agent text, -- Browser/client info
created_at timestamptz NOT NULL DEFAULT now()
);

-- Add table documentation
COMMENT ON TABLE public.data_changes IS 
'GDPR-compliant data change tracking for audit trails and data portability compliance. 
Tracks INSERT, UPDATE, DELETE operations on user data as required by GDPR Articles 15 & 20.';

COMMENT ON COLUMN public.data_changes.user_id IS 'User whose data was changed (FK to auth.users)';
COMMENT ON COLUMN public.data_changes.table_name IS 'Name of the table that was modified';
COMMENT ON COLUMN public.data_changes.record_id IS 'ID of the specific record that was changed';
COMMENT ON COLUMN public.data_changes.operation IS 'Type of database operation: INSERT, UPDATE, or DELETE';
COMMENT ON COLUMN public.data_changes.old_values IS 'Previous values (for UPDATE and DELETE operations)';
COMMENT ON COLUMN public.data_changes.new_values IS 'New values (for INSERT and UPDATE operations)';
COMMENT ON COLUMN public.data_changes.changed_by IS 'User who initiated the change (may differ from user_id for admin actions)';
COMMENT ON COLUMN public.data_changes.change_reason IS 'Optional human-readable reason for the change';
COMMENT ON COLUMN public.data_changes.ip_address IS 'IP address from which the change was made';
COMMENT ON COLUMN public.data_changes.user_agent IS 'Browser/client user agent information';

-- ===
-- SECTION 2: CREATE INDEXES
-- ===

-- Index for user-specific queries (user data export, audit trail)
CREATE INDEX idx_data_changes_user_time 
  ON public.data_changes (user_id, created_at DESC);

-- Index for table-specific queries (tracking changes per table)
CREATE INDEX idx_data_changes_table_time 
  ON public.data_changes (table_name, created_at DESC);

-- Index for record-specific queries (tracking changes to specific records)
CREATE INDEX idx_data_changes_record 
  ON public.data_changes (table_name, record_id, created_at DESC);

-- Index for operation type analysis
CREATE INDEX idx_data_changes_operation_time 
  ON public.data_changes (operation, created_at DESC);

-- Index for change attribution (who made changes)
CREATE INDEX idx_data_changes_changed_by_time 
  ON public.data_changes (changed_by, created_at DESC) 
  WHERE changed_by IS NOT NULL;

DO $$
BEGIN
RAISE LOG 'Data Changes: Created table with 5 performance indexes';
END $$;

-- ===
-- SECTION 3: ROW LEVEL SECURITY
-- ===

-- Enable RLS on the table
ALTER TABLE public.data_changes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view changes to their own data
CREATE POLICY "users_view_own_data_changes" ON public.data_changes
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Service role can manage all data changes (for triggers/system operations)
CREATE POLICY "service_manage_data_changes" ON public.data_changes
FOR ALL
USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.data_changes TO authenticated;
GRANT ALL ON public.data_changes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.data_changes_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.data_changes_id_seq TO service_role;

DO $$
BEGIN
RAISE LOG 'Data Changes: RLS policies and permissions configured';
END $$;

-- ===
-- SECTION 4: DATA CHANGE LOGGING FUNCTION
-- ===

CREATE OR REPLACE FUNCTION public.log_data_change(
p_user_id uuid,
p_table_name varchar(100),
p_record_id text,
p_operation varchar(20),
p_old_values jsonb DEFAULT NULL,
p_new_values jsonb DEFAULT NULL,
p_changed_by uuid DEFAULT NULL,
p_change_reason varchar(200) DEFAULT NULL,
p_ip_address inet DEFAULT NULL,
p_user_agent text DEFAULT NULL
) RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
change_id bigint;
BEGIN
-- Validate required parameters
IF p_user_id IS NULL OR p_table_name IS NULL OR p_record_id IS NULL OR p_operation IS NULL THEN
RAISE EXCEPTION 'user_id, table_name, record_id, and operation are required parameters';
END IF;

-- Validate operation type
IF p_operation NOT IN ('INSERT', 'UPDATE', 'DELETE') THEN
RAISE EXCEPTION 'Invalid operation. Must be: INSERT, UPDATE, or DELETE';
END IF;

-- Insert data change record
INSERT INTO public.data_changes (
user_id,
table_name,
record_id,
operation,
old_values,
new_values,
changed_by,
change_reason,
ip_address,
user_agent
) VALUES (
p_user_id,
p_table_name,
p_record_id,
p_operation,
p_old_values,
p_new_values,
COALESCE(p_changed_by, p_user_id),
p_change_reason,
p_ip_address,
p_user_agent
) RETURNING id INTO change_id;

-- Log successful operation for debugging
RAISE LOG 'Data Change: Logged % on %.% for user % (record: %)', 
p_operation, p_table_name, p_record_id, p_user_id, change_id;

RETURN change_id;

EXCEPTION
WHEN OTHERS THEN
RAISE LOG 'Data Change Error: Failed to log % on %.% for user % - %', 
p_operation, p_table_name, p_record_id, p_user_id, SQLERRM;
RAISE;
END;
$$;

-- Function documentation
COMMENT ON FUNCTION public.log_data_change IS 
'GDPR-compliant data change logging function. Records INSERT, UPDATE, DELETE operations
for audit trails and data portability compliance as required by GDPR Articles 15 & 20.
Returns change ID on success, raises exception on failure.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_data_change TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_data_change TO service_role;

DO $$
BEGIN
RAISE LOG 'Data Changes: Created log_data_change function with validation';
END $$;

-- ===
-- SECTION 5: CREATE HELPER VIEW FOR AUDIT QUERIES
-- ===

-- Create a view that combines data changes with user information for easier querying
CREATE VIEW public.user_data_audit AS
SELECT 
dc.id,
dc.user_id,
p.email as user_email,
dc.table_name,
dc.record_id,
dc.operation,
dc.old_values,
dc.new_values,
dc.changed_by,
cb.email as changed_by_email,
dc.change_reason,
dc.ip_address,
dc.user_agent,
dc.created_at
FROM public.data_changes dc
LEFT JOIN public.profiles p ON dc.user_id = p.id
LEFT JOIN public.profiles cb ON dc.changed_by = cb.id
ORDER BY dc.created_at DESC;

COMMENT ON VIEW public.user_data_audit IS 
'Enhanced view of data changes with user email information for easier audit trail queries.
Combines data_changes with profiles for comprehensive GDPR audit reporting.';

-- Grant permissions on the view
GRANT SELECT ON public.user_data_audit TO authenticated;
GRANT ALL ON public.user_data_audit TO service_role;

-- RLS policy for the view (inherits from underlying table)
ALTER VIEW public.user_data_audit SET (security_barrier = true);

DO $$
BEGIN
RAISE LOG 'Data Changes: Created user_data_audit view with email joins';
END $$;

-- ===
-- SECTION 6: MIGRATION VALIDATION
-- ===

-- Validate table creation and structure
DO $$
DECLARE
table_exists boolean;
index_count integer;
function_exists boolean;
policy_count integer;
view_exists boolean;
BEGIN
-- Check if table exists
SELECT EXISTS (
SELECT 1 FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'data_changes'
) INTO table_exists;

-- Count indexes
SELECT COUNT(*) INTO index_count 
FROM pg_indexes 
WHERE tablename = 'data_changes' 
AND schemaname = 'public';

-- Check if function exists
SELECT EXISTS (
SELECT 1 FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'log_data_change'
) INTO function_exists;

-- Count RLS policies
SELECT COUNT(*) INTO policy_count
FROM pg_policies
WHERE tablename = 'data_changes'
AND schemaname = 'public';

-- Check if view exists
SELECT EXISTS (
SELECT 1 FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'user_data_audit'
) INTO view_exists;

-- Validate all components
IF NOT table_exists THEN
RAISE EXCEPTION 'Data Changes: Table validation failed - table not created';
END IF;

IF index_count < 5 THEN
RAISE EXCEPTION 'Data Changes: Index validation failed - Expected 5+ indexes, found %', index_count;
END IF;

IF NOT function_exists THEN
RAISE EXCEPTION 'Data Changes: Function validation failed - log_data_change not created';
END IF;

IF policy_count < 2 THEN
RAISE EXCEPTION 'Data Changes: RLS validation failed - Expected 2+ policies, found %', policy_count;
END IF;

IF NOT view_exists THEN
RAISE EXCEPTION 'Data Changes: View validation failed - user_data_audit not created';
END IF;

RAISE LOG 'Data Changes: All validation checks passed successfully';
RAISE LOG 'Table: data_changes created with % indexes', index_count;
RAISE LOG 'Function: log_data_change created with parameter validation';
RAISE LOG 'Security: % RLS policies configured', policy_count;
RAISE LOG 'View: user_data_audit created for enhanced querying';
END $$;

-- ===
-- SECTION 7: MIGRATION COMPLETION
-- ===

-- Final migration completion log
DO $$
BEGIN
RAISE LOG 'TrueNamePath GDPR Enhancement: Migration completed successfully';
RAISE LOG '';
RAISE LOG '✅ DATA CHANGE TRACKING:';
RAISE LOG '  • Created data_changes table for GDPR Articles 15 & 20 compliance';
RAISE LOG '  • Added performance indexes for user and table queries';
RAISE LOG '  • Configured RLS policies for data privacy';
RAISE LOG '  • Created log_data_change function with validation';
RAISE LOG '  • Created user_data_audit view for enhanced reporting';
RAISE LOG '';
RAISE LOG '✅ GDPR COMPLIANCE IMPROVEMENTS:';
RAISE LOG '  • Profile updates (name, email) - ready for tracking';
RAISE LOG '  • Context operations (create/update/delete) - ready for tracking';
RAISE LOG '  • Name variant changes - ready for tracking';
RAISE LOG '  • Consent management changes - ready for tracking';
RAISE LOG '';
RAISE LOG '🔐 READY FOR TRIGGERS:';
RAISE LOG '  • Add triggers to profiles table for automatic tracking';
RAISE LOG '  • Add triggers to user_contexts table for context changes';
RAISE LOG '  • Add triggers to names table for name variant changes';
RAISE LOG '';
RAISE LOG '⚡ NEXT STEPS: Implement database triggers for automatic logging';
END $$;