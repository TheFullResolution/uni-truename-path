// Shared Assignment Validation Schemas

import { z } from 'zod';
import type { Enums } from '@/generated/database';

export type OIDCProperty = Enums<'oidc_property'>;

export const OIDC_PROPERTY_VALUES = [
  'given_name',
  'family_name',
  'name',
  'nickname',
  'display_name',
  'preferred_username',
  'middle_name',
] as const satisfies readonly OIDCProperty[];

export const UuidSchema = z.string().uuid();

export const ContextIdSchema = UuidSchema.refine((val) => val.length > 0, {
  message: 'Context ID is required',
});

export const NameIdSchema = UuidSchema.refine((val) => val.length > 0, {
  message: 'Name ID is required',
});

export const ListQueryParamsSchema = z.object({
  limit: z
.string()
.nullable()
.optional()
.transform((val) => (val ? parseInt(val, 10) : undefined))
.refine((val) => !val || (val > 0 && val <= 100), {
  message: 'Limit must be between 1 and 100',
}),

  context_id: ContextIdSchema.nullable().optional(),
});

export const OIDCAssignmentRequestSchema = z.object({
  context_id: ContextIdSchema,
  name_id: NameIdSchema,
  oidc_property: z.enum(OIDC_PROPERTY_VALUES),
});

export const OIDCQueryParamsSchema = z.object({
  context_id: ContextIdSchema.optional(),
});

export const BatchOIDCAssignmentRequestSchema = z.object({
  context_id: ContextIdSchema,
  assignments: z
.array(
  z.object({
oidc_property: z.enum(OIDC_PROPERTY_VALUES),
name_id: NameIdSchema.nullable(),
  }),
)
.min(1, 'At least one assignment is required')
.max(20, 'Maximum 20 assignments per batch request'),
});

export type ListQueryParams = z.infer<typeof ListQueryParamsSchema>;

export type BatchOIDCAssignmentRequest = z.infer<
  typeof BatchOIDCAssignmentRequestSchema
>;

export function createValidationErrorResponse(
  result: z.ZodSafeParseResult<unknown>,
  request_id: string,
  timestamp: string,
  createErrorResponse: (
code: string,
message: string,
requestId: string,
data: unknown,
timestamp: string,
  ) => unknown,
  ErrorCodes: Record<string, string>,
) {
  if (result.success) {
throw new Error('Cannot create error response for successful validation');
  }

  return createErrorResponse(
ErrorCodes.VALIDATION_ERROR,
'Invalid request parameters',
request_id,
result.error.issues.map((err: z.ZodIssue) => ({
  field: err.path?.join?.('.') || 'unknown',
  message: err.message || 'Validation error',
  code: err.code || 'invalid_input',
})),
timestamp,
  );
}
