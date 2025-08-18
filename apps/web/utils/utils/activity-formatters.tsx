import React from 'react';
import {
  IconEye,
  IconShieldCheck,
  IconUser,
  IconActivity,
} from '@tabler/icons-react';

/**
 * Formats an activity action string into a human-readable format
 *
 * @param action - The raw action string from the audit log
 * @returns A formatted, user-friendly action description
 */
export const formatActivityAction = (action: string): string => {
  switch (action) {
case 'name_resolution':
  return 'Name Resolved';
case 'consent_granted':
  return 'Consent Granted';
case 'consent_revoked':
  return 'Consent Revoked';
case 'profile_updated':
  return 'Profile Updated';
case 'name_created':
  return 'Name Added';
default:
  return action.replace('_', ' ').toUpperCase();
  }
};

/**
 * Returns the appropriate icon component for an activity action
 *
 * @param action - The activity action string
 * @returns A React icon component with appropriate color and size
 */
export const getActivityIcon = (action: string) => {
  switch (action) {
case 'name_resolution':
  return <IconEye size={16} color='#4A7FE7' />;
case 'consent_granted':
  return <IconShieldCheck size={16} color='#27ae60' />;
case 'consent_revoked':
  return <IconShieldCheck size={16} color='#e74c3c' />;
case 'profile_updated':
  return <IconUser size={16} color='#4A7FE7' />;
case 'name_created':
  return <IconUser size={16} color='#27ae60' />;
default:
  return <IconActivity size={16} color='#4A7FE7' />;
  }
};
