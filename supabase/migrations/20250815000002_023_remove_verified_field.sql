-- TrueNamePath: Remove Verified Field Migration
-- File: 20250815000002_023_remove_verified_field.sql
-- Purpose: Clean removal of unused verified field that was causing filtering issues

-- The verified field was originally intended for identity verification (similar to Facebook's verified accounts)
-- but adds no value to this project and causes bugs where newly created names don't appear
-- because they default to verified=false and are filtered out by the API

-- Remove the verified field from the names table
ALTER TABLE public.names DROP COLUMN IF EXISTS verified;

-- Note: This change will:
-- 1. Remove the unnecessary complexity from the schema
-- 2. Fix the bug where new names don't appear (they were being filtered out)
-- 3. Simplify API endpoints by removing includeUnverified parameter logic
-- 4. Align the codebase with the project scope