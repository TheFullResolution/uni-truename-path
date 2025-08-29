'use client';
import { UserContext } from '@/types/database';
import { Select } from '@mantine/core';

interface ContextAssignmentDropdownProps {
  clientId: string;
  currentContextId: string;
  availableContexts: UserContext[];
  onChange?: (clientId: string, newContextId: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ContextAssignmentDropdown({
  clientId,
  currentContextId,
  availableContexts,
  onChange,
  disabled = false,
  loading = false,
}: ContextAssignmentDropdownProps) {
  return (
<Select
  value={currentContextId}
  onChange={(value) => value && onChange?.(clientId, value)}
  disabled={disabled || loading}
  data={availableContexts.map((context) => ({
value: context.id,
label: context.context_name,
  }))}
  placeholder='Select context'
  size='xs'
  w={200}
  data-testid={`context-dropdown-${clientId}`}
/>
  );
}
