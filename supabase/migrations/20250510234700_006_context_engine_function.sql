-- Context Engine: The resolve_name function already exists from migration 003
-- This migration just adds some comments and ensures proper permissions

-- The function is already created in 003_audit_fn_and_trigger.sql
-- It has the signature: resolve_name(p_profile uuid, p_audience text, p_purpose text)

-- Ensure proper permissions are granted
grant execute on function public.resolve_name(uuid, text, text) to anon;
grant execute on function public.resolve_name(uuid, text, text) to authenticated;