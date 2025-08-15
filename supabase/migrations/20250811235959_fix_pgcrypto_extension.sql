-- Enable pgcrypto extension for password hashing
-- This extension is required for auth user creation in demo personas migration

CREATE EXTENSION IF NOT EXISTS pgcrypto;