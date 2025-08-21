-- Fix OIDC constraint compatibility with Supabase upsert
-- Problem: DEFERRABLE constraints are incompatible with onConflict clause
-- Solution: Recreate constraint without DEFERRABLE option

-- Drop the deferrable constraint that breaks upsert
ALTER TABLE public.context_name_assignments
DROP CONSTRAINT IF EXISTS unique_oidc_property_per_context;

-- Recreate without DEFERRABLE to work with Supabase upsert
ALTER TABLE public.context_name_assignments
ADD CONSTRAINT unique_oidc_property_per_context 
UNIQUE (context_id, oidc_property);

-- Verify the constraint exists and is not deferrable
DO $$
BEGIN
IF NOT EXISTS (
SELECT 1 
FROM information_schema.table_constraints 
WHERE constraint_name = 'unique_oidc_property_per_context'
AND table_name = 'context_name_assignments'
AND constraint_type = 'UNIQUE'
) THEN
RAISE EXCEPTION 'unique_oidc_property_per_context constraint was not created successfully';
END IF;
END $$;