/**
 * OAuth Resolve Endpoint Validation Schemas
 * University Final Project - TrueNamePath
 */

import { z } from 'zod';
import { OIDCClaims, OAuthResolveResponseData } from './types';

// Request schema - empty body as token comes from Authorization header
export const OAuthResolveRequestSchema = z.object({});

// OIDC Claims schema for validation
export const OIDCClaimsSchema = z.object({
  sub: z.string().uuid('Subject must be a valid UUID'),
  iss: z.string().url('Issuer must be a valid URL'),
  aud: z.string().min(1, 'Audience is required'),
  iat: z.number().int().positive('Issued at must be a positive integer'),

  // Optional standard claims
  name: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  nickname: z.string().optional(),
  preferred_username: z.string().optional(),

  // TrueNamePath-specific fields
  context_name: z.string().min(1, 'Context name is required'),
  app_name: z.string().min(1, 'App name is required'),
}) satisfies z.ZodType<OIDCClaims>;

// Response schema
export const OAuthResolveResponseSchema = z.object({
  claims: OIDCClaimsSchema,
  resolved_at: z.string().datetime('Resolved at must be a valid ISO datetime'),
}) satisfies z.ZodType<OAuthResolveResponseData>;
