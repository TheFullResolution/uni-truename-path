// UI-specific types that don't belong in database types

export interface DashboardUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}
