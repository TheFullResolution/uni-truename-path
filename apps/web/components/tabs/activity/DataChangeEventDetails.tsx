import {
  Badge,
  Code,
  Collapse,
  Group,
  Stack,
  Text,
  UnstyledButton,
  JsonInput,
} from '@mantine/core';
import {
  IconChevronDown,
  IconChevronRight,
  IconTable,
  IconUser,
  IconNote,
} from '@tabler/icons-react';
import { useState } from 'react';
import type { DataChangeEvent } from '@/types/database';

interface DataChangeEventDetailsProps {
  event: DataChangeEvent;
}

export function DataChangeEventDetails({ event }: DataChangeEventDetailsProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getOperationDescription = (operation: string, tableName: string) => {
const tableDisplayNames: Record<string, string> = {
  profiles: 'Profile',
  names: 'Name Variant',
  user_contexts: 'Context',
  context_name_assignments: 'Context Assignment',
  consents: 'Privacy Consent',
};

const displayName = tableDisplayNames[tableName] || tableName;

switch (operation) {
  case 'INSERT':
return `New ${displayName.toLowerCase()} was created`;
  case 'UPDATE':
return `${displayName} was modified`;
  case 'DELETE':
return `${displayName} was deleted`;
  default:
return `${displayName} was changed (${operation})`;
}
  };

  const getOperationColor = (operation: string) => {
switch (operation) {
  case 'INSERT':
return 'green';
  case 'UPDATE':
return 'blue';
  case 'DELETE':
return 'red';
  default:
return 'gray';
}
  };

  const getChangeSummary = () => {
if (!event.old_values && !event.new_values) {
  return 'No change details available';
}

if (event.operation === 'INSERT' && event.new_values) {
  const keys = Object.keys(event.new_values);
  return `Created with ${keys.length} field${keys.length === 1 ? '' : 's'}`;
}

if (event.operation === 'DELETE' && event.old_values) {
  const keys = Object.keys(event.old_values);
  return `Deleted ${keys.length} field${keys.length === 1 ? '' : 's'}`;
}

if (event.operation === 'UPDATE' && event.old_values && event.new_values) {
  const newKeys = new Set(Object.keys(event.new_values));
  const changedFields = Array.from(newKeys).filter(
(key) => event.old_values![key] !== event.new_values![key],
  );
  return `Modified ${changedFields.length} field${changedFields.length === 1 ? '' : 's'}: ${changedFields.join(', ')}`;
}

return 'Change details available';
  };

  const renderFieldChanges = () => {
if (event.operation === 'UPDATE' && event.old_values && event.new_values) {
  const changes = [];
  const newKeys = new Set(Object.keys(event.new_values));

  for (const key of Array.from(newKeys)) {
const oldValue = event.old_values[key];
const newValue = event.new_values[key];

if (oldValue !== newValue) {
  changes.push(
<Group key={key} gap='xs' align='center' wrap='nowrap'>
  <Text size='xs' fw={500} style={{ minWidth: '80px' }}>
{key}:
  </Text>
  <Group gap='xs' align='center'>
{oldValue != null && (
  <Code fz='xs' c='red'>
{String(oldValue).length > 30
  ? String(oldValue).substring(0, 30) + '...'
  : String(oldValue)}
  </Code>
)}
<Text size='xs' c='dimmed'>
  →
</Text>
{newValue != null && (
  <Code fz='xs' c='green'>
{String(newValue).length > 30
  ? String(newValue).substring(0, 30) + '...'
  : String(newValue)}
  </Code>
)}
  </Group>
</Group>,
  );
}
  }

  return changes.length > 0
? changes
: [
<Text key='no-changes' size='xs' c='dimmed'>
  No field changes detected
</Text>,
  ];
}

return null;
  };

  return (
<Stack gap='xs'>
  <Text size='sm' c='dimmed'>
{getOperationDescription(event.operation, event.table_name)}
  </Text>

  <Group gap='md' wrap='nowrap'>
{/* Table & Operation */}
<Stack gap={2} flex={1}>
  <Group gap={4} align='center'>
<IconTable size={12} />
<Text size='xs' fw={500} c='dimmed'>
  Target
</Text>
  </Group>

  <Text size='sm' fw={500}>
{event.table_name}
  </Text>
  <Badge
size='xs'
color={getOperationColor(event.operation)}
variant='light'
  >
{event.operation}
  </Badge>
</Stack>

{/* Record ID */}
<Stack gap={2} flex={1}>
  <Text size='xs' fw={500} c='dimmed'>
Record ID
  </Text>
  <Code fz='xs'>
{event.record_id.length > 12
  ? `${event.record_id.substring(0, 8)}...`
  : event.record_id}
  </Code>
</Stack>

{/* Changed By */}
{event.changed_by && (
  <Stack gap={2} align='center'>
<Group gap={4} align='center'>
  <IconUser size={12} />
  <Text size='xs' fw={500} c='dimmed'>
Changed By
  </Text>
</Group>

<Badge size='xs' variant='outline'>
  {event.changed_by === event.user_id ? 'Self' : 'Other'}
</Badge>
  </Stack>
)}
  </Group>

  {/* Change Reason */}
  {event.change_reason && (
<Group gap='xs' align='center'>
  <IconNote size={12} />
  <Text size='xs' fw={500} c='dimmed'>
Reason:
  </Text>
  <Text size='xs'>{event.change_reason}</Text>
</Group>
  )}

  {/* Quick Change Summary */}
  <Text size='xs' c='dimmed'>
{getChangeSummary()}
  </Text>

  {/* Expandable Details */}
  {(event.old_values || event.new_values) && (
<>
  <UnstyledButton
onClick={() => setShowDetails(!showDetails)}
style={{ alignSelf: 'flex-start' }}
  >
<Group gap={4} align='center'>
  {showDetails ? (
<IconChevronDown size={12} />
  ) : (
<IconChevronRight size={12} />
  )}
  <Text size='xs' fw={500} c='dimmed'>
{showDetails ? 'Hide' : 'Show'} Change Details
  </Text>
</Group>
  </UnstyledButton>

  <Collapse in={showDetails}>
<Stack
  gap='sm'
  pl='md'
  style={{ borderLeft: '2px solid var(--mantine-color-gray-3)' }}
>
  {/* Field-by-field changes for updates */}
  {event.operation === 'UPDATE' && renderFieldChanges()}

  {/* Raw JSON for insert/delete or detailed view */}
  {event.operation === 'INSERT' && event.new_values && (
<Stack gap='xs'>
  <Text size='xs' fw={500} c='green'>
Created Values:
  </Text>
  <JsonInput
value={JSON.stringify(event.new_values, null, 2)}
readOnly
size='xs'
minRows={3}
maxRows={8}
  />
</Stack>
  )}

  {event.operation === 'DELETE' && event.old_values && (
<Stack gap='xs'>
  <Text size='xs' fw={500} c='red'>
Deleted Values:
  </Text>
  <JsonInput
value={JSON.stringify(event.old_values, null, 2)}
readOnly
size='xs'
minRows={3}
maxRows={8}
  />
</Stack>
  )}

  {/* Source IP for audit trail */}
  {event.ip_address && (
<Group gap='xs' align='center'>
  <Text size='xs' c='dimmed'>
Source IP:
  </Text>
  <Code fz='xs'>{event.ip_address}</Code>
</Group>
  )}
</Stack>
  </Collapse>
</>
  )}
</Stack>
  );
}
