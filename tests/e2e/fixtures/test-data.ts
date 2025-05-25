export const testProfiles = {
  johnDoe: {
email: 'john.doe@example.com',
names: [
  {
name_text: 'John Doe',
type: 'legal' as const,
visibility: 'public' as const,
  },
  {
name_text: 'Johnny',
type: 'nickname' as const,
visibility: 'internal' as const,
  }
]
  },
  janeDoe: {
email: 'jane.doe@example.com',
names: [
  {
name_text: 'Jane Smith',
type: 'legal' as const,
visibility: 'public' as const,
  },
  {
name_text: 'Jane Doe',
type: 'preferred' as const,
visibility: 'public' as const,
  }
]
  }
} as const;