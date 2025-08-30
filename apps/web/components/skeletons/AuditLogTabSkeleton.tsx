'use client';

import { Card, Group, Skeleton, Stack, Table, Tabs } from '@mantine/core';

/**
 * Audit log tab skeleton that mirrors the audit log tab layout
 * Shows loading skeleton for the audit log table structure
 */
export function AuditLogTabSkeleton() {
  return (
<Tabs.Panel value='audit-log'>
  <Stack gap='lg'>
{/* Header Section */}
<div>
  <Group justify='space-between' mb='md'>
<Skeleton height={32} width='25%' radius='sm' />
<Skeleton height={32} width={90} radius='sm' />
  </Group>

  <Skeleton height={16} width='80%' radius='sm' mb='lg' />
</div>

{/* Table Section */}
<Card withBorder>
  <Table.ScrollContainer minWidth={800}>
<Table striped highlightOnHover>
  <Table.Thead>
<Table.Tr>
  <Table.Th>
<Skeleton height={18} width='100%' radius='sm' />
  </Table.Th>
  <Table.Th>
<Skeleton height={18} width='100%' radius='sm' />
  </Table.Th>
  <Table.Th>
<Skeleton height={18} width='100%' radius='sm' />
  </Table.Th>
  <Table.Th>
<Skeleton height={18} width='100%' radius='sm' />
  </Table.Th>
</Table.Tr>
  </Table.Thead>
  <Table.Tbody>
{[1, 2, 3, 4, 5, 6, 7].map((item) => (
  <Table.Tr key={item}>
<Table.Td>
  <Skeleton height={16} width='90%' radius='sm' />
</Table.Td>
<Table.Td>
  <Skeleton height={20} width={80} radius='sm' />
</Table.Td>
<Table.Td>
  <Skeleton height={16} width='60%' radius='sm' />
</Table.Td>
<Table.Td>
  <Skeleton height={16} width='85%' radius='sm' />
</Table.Td>
  </Table.Tr>
))}
  </Table.Tbody>
</Table>
  </Table.ScrollContainer>

  {/* Load More Button Area */}
  <div
style={{
  borderTop: '1px solid var(--mantine-color-gray-3)',
  marginTop: '1rem',
  paddingTop: '1rem',
}}
  >
<Group justify='center'>
  <Skeleton height={36} width={150} radius='sm' />
</Group>
  </div>
</Card>
  </Stack>
</Tabs.Panel>
  );
}
