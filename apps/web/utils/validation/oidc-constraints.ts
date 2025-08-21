import type { Enums } from '@/generated/database';
import type { UserContext } from '@/types/database';

export const REQUIRED_OIDC_PROPERTIES: readonly Enums<'oidc_property'>[] = [
  'given_name',
  'family_name',
  'name',
] as const;

export function isDefaultContext(context: UserContext): boolean {
  return context.is_permanent === true;
}

export function validateDefaultContextAssignment(
  property: Enums<'oidc_property'>,
  isDefaultContext: boolean,
): { valid: boolean; error?: string } {
  if (isDefaultContext && REQUIRED_OIDC_PROPERTIES.includes(property)) {
return {
  valid: false,
  error: `Cannot remove required property '${property}' from default context. This property is essential for OIDC compliance.`,
};
  }
  return { valid: true };
}

export function getRequiredPropertiesForContext(
  context: UserContext,
): readonly Enums<'oidc_property'>[] {
  return isDefaultContext(context) ? REQUIRED_OIDC_PROPERTIES : [];
}
