export const testProfiles = {
  johnDoe: {
email: 'john.doe@example.com',
names: [
  {
name_text: 'John Doe',
name_type: 'LEGAL' as const,
is_preferred: false,
  },
  {
name_text: 'Johnny',
name_type: 'NICKNAME' as const,
is_preferred: true,
  },
],
  },
  janeDoe: {
email: 'jane.doe@example.com',
names: [
  {
name_text: 'Jane Smith',
name_type: 'LEGAL' as const,
is_preferred: false,
  },
  {
name_text: 'Jane Doe',
name_type: 'PREFERRED' as const,
is_preferred: true,
  },
],
  },
} as const;
