import { z } from 'zod';

// Constants for password requirements
export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Aligned with signup requirements
} as const;

// Reusable password schema - single source of truth
export const passwordSchema = z
  .string()
  .min(
PASSWORD_MIN_LENGTH,
`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  )
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Schema for password change (includes old password and reuse check)
export const passwordChangeSchema = z
  .object({
old_password: z.string().min(1, 'Current password is required'),
new_password: passwordSchema,
  })
  .refine((data) => data.old_password !== data.new_password, {
message: 'New password must be different from your current password',
path: ['new_password'],
  });

// Schema for simple password update (no old password required)
export const newPasswordOnlySchema = z.object({
  new_password: passwordSchema,
});

// Schema for signup with password confirmation
export const signupPasswordSchema = z
  .object({
password: passwordSchema,
confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
message: 'Passwords do not match',
path: ['confirmPassword'],
  });

// Helper function for form validation (returns error message or null)
export const validatePassword = (value: string): string | null => {
  const result = passwordSchema.safeParse(value);
  if (!result.success) {
return 'Password must be at least 8 characters with uppercase, lowercase, and number';
  }
  return null;
};

// Helper function for password confirmation validation
export const validatePasswordConfirmation = (
  confirmPassword: string,
  password: string,
): string | null => {
  if (confirmPassword !== password) {
return 'Passwords do not match';
  }
  return null;
};

// Helper text for UI components
export const PASSWORD_HELPER_TEXT =
  'Minimum 8 characters with uppercase, lowercase, and number';

// Detailed requirements for UI display
export const PASSWORD_REQUIREMENTS_TEXT = [
  `At least ${PASSWORD_MIN_LENGTH} characters long`,
  'Contains at least one uppercase letter (A-Z)',
  'Contains at least one lowercase letter (a-z)',
  'Contains at least one number (0-9)',
];

// Error messages for specific validation failures
export const PASSWORD_ERROR_MESSAGES = {
  TOO_SHORT: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  NO_UPPERCASE: 'Password must contain at least one uppercase letter',
  NO_LOWERCASE: 'Password must contain at least one lowercase letter',
  NO_NUMBER: 'Password must contain at least one number',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  SAME_AS_OLD: 'New password must be different from your current password',
} as const;
