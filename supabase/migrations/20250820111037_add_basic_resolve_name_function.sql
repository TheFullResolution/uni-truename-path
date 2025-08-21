-- Add basic resolve_name function for Step 15.4
-- This provides simple name resolution based on context

CREATE OR REPLACE FUNCTION resolve_name(
  p_target_user_id UUID,
  p_requester_user_id UUID DEFAULT NULL,
  p_context_name TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  v_resolved_name TEXT;
BEGIN
  -- If no requester, return a default message
  IF p_requester_user_id IS NULL THEN
RETURN 'Anonymous User';
  END IF;

  -- Try to get name from context_name_assignments if context provided
  IF p_context_name IS NOT NULL THEN
SELECT n.name_text INTO v_resolved_name
FROM user_contexts uc
JOIN context_name_assignments cna ON cna.context_id = uc.id
JOIN names n ON n.id = cna.name_id
WHERE uc.user_id = p_target_user_id
  AND uc.context_name = p_context_name
  AND cna.is_primary = TRUE
LIMIT 1;

IF v_resolved_name IS NOT NULL THEN
  RETURN v_resolved_name;
END IF;
  END IF;

  -- Fallback to any preferred name
  SELECT name_text INTO v_resolved_name
  FROM names
  WHERE user_id = p_target_user_id
AND is_preferred = TRUE
  LIMIT 1;
  
  IF v_resolved_name IS NOT NULL THEN
RETURN v_resolved_name;
  END IF;

  -- Fallback to any name
  SELECT name_text INTO v_resolved_name
  FROM names
  WHERE user_id = p_target_user_id
  ORDER BY created_at
  LIMIT 1;
  
  IF v_resolved_name IS NOT NULL THEN
RETURN v_resolved_name;
  END IF;

  -- If no name found
  RETURN 'Unknown User';
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION resolve_name(UUID, UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION resolve_name(UUID, UUID, TEXT) IS 'Simple name resolution function for Step 15.4 - returns appropriate name based on context';