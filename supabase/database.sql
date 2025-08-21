-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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
CREATE TABLE public.context_usage_analytics (
id bigint NOT NULL DEFAULT nextval('context_usage_analytics_id_seq'::regclass),
target_user_id uuid NOT NULL,
context_id uuid NOT NULL,
requesting_application character varying NOT NULL,
application_type character varying NOT NULL DEFAULT 'oauth_client'::character varying,
scopes_requested ARRAY NOT NULL DEFAULT '{}'::text[],
properties_disclosed jsonb NOT NULL DEFAULT '{}'::jsonb,
response_time_ms integer NOT NULL DEFAULT 0,
success boolean NOT NULL DEFAULT true,
error_type character varying,
accessed_at timestamp with time zone NOT NULL DEFAULT now(),
source_ip inet,
user_agent text,
session_id character varying,
details jsonb DEFAULT '{}'::jsonb,
CONSTRAINT context_usage_analytics_pkey PRIMARY KEY (id),
CONSTRAINT context_usage_analytics_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id),
CONSTRAINT context_usage_analytics_context_id_fkey FOREIGN KEY (context_id) REFERENCES public.user_contexts(id)
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
