-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_context_assignments (
id uuid NOT NULL DEFAULT gen_random_uuid(),
profile_id uuid NOT NULL,
context_id uuid NOT NULL,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone DEFAULT now(),
client_id character varying NOT NULL,
CONSTRAINT app_context_assignments_pkey PRIMARY KEY (id),
CONSTRAINT app_context_assignments_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
CONSTRAINT app_context_assignments_context_id_fkey FOREIGN KEY (context_id) REFERENCES public.user_contexts(id)
);
CREATE TABLE public.app_usage_log (
  id bigint NOT NULL DEFAULT nextval('app_usage_log_id_seq'::regclass),
  profile_id uuid NOT NULL,
  session_id uuid,
  action character varying NOT NULL CHECK (action::text = ANY (ARRAY['authorize'::character varying, 'resolve'::character varying, 'revoke'::character varying, 'assign_context'::character varying]::text[])),
  context_id uuid,
  response_time_ms integer DEFAULT 0 CHECK (response_time_ms >= 0),
  success boolean NOT NULL DEFAULT true,
  error_type character varying CHECK (error_type::text = ANY (ARRAY['authorization_denied'::character varying, 'invalid_token'::character varying, 'context_missing'::character varying, 'server_error'::character varying, 'rate_limited'::character varying]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  client_id character varying NOT NULL CHECK (client_id::text ~ '^tnp_[a-f0-9]{16}$'::text),
  resource_type character varying,
  resource_id text,
  CONSTRAINT app_usage_log_pkey PRIMARY KEY (id),
  CONSTRAINT app_usage_log_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT app_usage_log_context_id_fkey FOREIGN KEY (context_id) REFERENCES public.user_contexts(id)
);
CREATE TABLE public.audit_log_entries (
  id bigint NOT NULL DEFAULT nextval('audit_log_entries_id_seq'::regclass),
  target_user_id uuid NOT NULL,
  requester_user_id uuid,
  context_id uuid,
  resolved_name_id uuid,
  action USER-DEFINED NOT NULL,
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  source_ip inet,
  details jsonb,
  CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id),
  CONSTRAINT audit_log_entries_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id),
  CONSTRAINT audit_log_entries_requester_user_id_fkey FOREIGN KEY (requester_user_id) REFERENCES public.profiles(id),
  CONSTRAINT audit_log_entries_context_id_fkey FOREIGN KEY (context_id) REFERENCES public.user_contexts(id),
  CONSTRAINT audit_log_entries_resolved_name_id_fkey FOREIGN KEY (resolved_name_id) REFERENCES public.names(id)
);
CREATE TABLE public.consents (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 granter_user_id uuid NOT NULL,
 requester_user_id uuid NOT NULL,
 context_id uuid NOT NULL,
 status USER-DEFINED NOT NULL DEFAULT 'PENDING'::consent_status,
 granted_at timestamp with time zone,
 revoked_at timestamp with time zone,
 expires_at timestamp with time zone,
 created_at timestamp with time zone NOT NULL DEFAULT now(),
 updated_at timestamp with time zone DEFAULT now(),
 CONSTRAINT consents_pkey PRIMARY KEY (id),
 CONSTRAINT consents_granter_user_id_fkey FOREIGN KEY (granter_user_id) REFERENCES public.profiles(id),
 CONSTRAINT consents_requester_user_id_fkey FOREIGN KEY (requester_user_id) REFERENCES public.profiles(id),
 CONSTRAINT consents_context_id_fkey FOREIGN KEY (context_id) REFERENCES public.user_contexts(id)
);
CREATE TABLE public.context_name_assignments (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 context_id uuid NOT NULL,
 name_id uuid NOT NULL,
 created_at timestamp with time zone NOT NULL DEFAULT now(),
 oidc_property USER-DEFINED,
 is_primary boolean DEFAULT false,
 CONSTRAINT context_name_assignments_pkey PRIMARY KEY (id),
 CONSTRAINT context_name_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
 CONSTRAINT context_name_assignments_context_id_fkey FOREIGN KEY (context_id) REFERENCES public.user_contexts(id),
 CONSTRAINT context_name_assignments_name_id_fkey FOREIGN KEY (name_id) REFERENCES public.names(id)
);
CREATE TABLE public.context_oidc_assignments (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 context_id uuid NOT NULL,
 oidc_property USER-DEFINED NOT NULL,
 name_id uuid NOT NULL,
 created_at timestamp with time zone NOT NULL DEFAULT now(),
 updated_at timestamp with time zone DEFAULT now(),
 CONSTRAINT context_oidc_assignments_pkey PRIMARY KEY (id),
 CONSTRAINT context_oidc_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
 CONSTRAINT context_oidc_assignments_context_id_fkey FOREIGN KEY (context_id) REFERENCES public.user_contexts(id),
 CONSTRAINT context_oidc_assignments_name_id_fkey FOREIGN KEY (name_id) REFERENCES public.names(id)
);
CREATE TABLE public.name_disclosure_log (
id bigint NOT NULL DEFAULT nextval('name_disclosure_log_id_seq'::regclass),
profile_id uuid,
name_id uuid,
audience text,
purpose text,
requested_by uuid,
disclosed_at timestamp with time zone NOT NULL DEFAULT now(),
name_disclosed text,
CONSTRAINT name_disclosure_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.names (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name_text text NOT NULL CHECK (char_length(name_text) > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  source text,
  is_preferred boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  oidc_properties jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT names_pkey PRIMARY KEY (id),
  CONSTRAINT names_profile_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.oauth_applications (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   app_name character varying NOT NULL UNIQUE,
   display_name character varying NOT NULL,
   description text,
   redirect_uri text NOT NULL,
   app_type character varying DEFAULT 'oauth_client'::character varying,
   is_active boolean DEFAULT true,
   created_at timestamp with time zone NOT NULL DEFAULT now(),
   updated_at timestamp with time zone DEFAULT now(),
   CONSTRAINT oauth_applications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.oauth_client_registry (
  client_id character varying NOT NULL CHECK (client_id::text ~ '^tnp_[a-f0-9]{16}$'::text),
  display_name character varying NOT NULL,
  app_name character varying NOT NULL,
  publisher_domain character varying NOT NULL CHECK (publisher_domain::text ~ '^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$'::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_used_at timestamp with time zone,
  CONSTRAINT oauth_client_registry_pkey PRIMARY KEY (client_id)
);
CREATE TABLE public.oauth_sessions (
   id uuid NOT NULL DEFAULT gen_random_uuid(),
   profile_id uuid NOT NULL,
   session_token character varying NOT NULL UNIQUE CHECK (session_token::text ~ '^tnp_[a-f0-9]{32}$'::text),
  return_url text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '02:00:00'::interval),
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  state character varying,
  client_id character varying NOT NULL,
  CONSTRAINT oauth_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT oauth_sessions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 email text NOT NULL UNIQUE,
 created_at timestamp with time zone NOT NULL DEFAULT now(),
 updated_at timestamp with time zone DEFAULT now(),
 CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_contexts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  context_name text NOT NULL CHECK (char_length(TRIM(BOTH FROM context_name)) > 0),
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_permanent boolean DEFAULT false,
  visibility USER-DEFINED NOT NULL DEFAULT 'restricted'::context_visibility,
  CONSTRAINT user_contexts_pkey PRIMARY KEY (id),
  CONSTRAINT user_contexts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
