// Formatting utilities
export const formatName = (name: string): string => {
  return name.trim();
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};