// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidNameType = (type: string): boolean => {
  return ['legal', 'preferred', 'nickname', 'alias'].includes(type);
};

export const isValidVisibility = (visibility: string): boolean => {
  return ['public', 'internal', 'restricted', 'private'].includes(visibility);
};