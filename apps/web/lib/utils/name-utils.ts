/**
 * Type definition for name type colors used in Mantine components
 */
export type NameTypeColor = 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'gray';

/**
 * Returns the appropriate color for a name type badge or component
 * 
 * @param type - The name type string (LEGAL, PREFERRED, NICKNAME, etc.)
 * @returns A Mantine color string for consistent theming
 */
export const getNameTypeColor = (type: string): NameTypeColor => {
  switch (type) {
case 'LEGAL':
  return 'red';
case 'PREFERRED':
  return 'blue';
case 'NICKNAME':
  return 'green';
case 'ALIAS':
  return 'orange';
case 'PROFESSIONAL':
  return 'purple';
case 'CULTURAL':
  return 'teal';
default:
  return 'gray';
  }
};