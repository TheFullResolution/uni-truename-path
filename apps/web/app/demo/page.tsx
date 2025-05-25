'use client';

import { useState } from 'react';
import { Button, Container, Title, Text, Card, Group, Stack, Code, Alert } from '@mantine/core';
import { createBrowserSupabaseClient } from '@uni-final-project/database';

// Demo personas from your academic requirements
const PERSONAS = {
  jj: {
id: '11111111-1111-1111-1111-111111111111',
description: 'Jędrzej Lewandowski (JJ) - Polish developer with nickname preference'
  },
  liwei: {
id: '22222222-2222-2222-2222-222222222222', 
description: 'Li Wei - Chinese name with Western adaptation'
  },
  alex: {
id: '33333333-3333-3333-3333-333333333333',
description: 'Alex Smith - Developer with online persona'
  }
} as const;

const AUDIENCES = ['hr', 'slack', 'github', 'internal_systems'] as const;

export default function DemoPage() {
  const [selectedPersona, setSelectedPersona] = useState<keyof typeof PERSONAS>('jj');
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const testNameResolution = async (audience: string) => {
setLoading(true);
try {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase.rpc('resolve_name', {
p_profile: PERSONAS[selectedPersona].id,
p_audience: audience,
p_purpose: 'demo_testing'
  });

  if (error) {
console.error('Error:', error);
setResults(prev => ({ ...prev, [audience]: `Error: ${error.message}` }));
  } else {
setResults(prev => ({ ...prev, [audience]: data || 'No name found' }));
  }
} catch (err) {
  console.error('Network error:', err);
  setResults(prev => ({ ...prev, [audience]: 'Network error' }));
} finally {
  setLoading(false);
}
  };

  return (
<Container size="md" py="xl">
  <Stack gap="xl">
<div>
  <Title order={1} mb="md">TrueNamePath Demo</Title>
  <Text size="lg" c="dimmed">
Context-aware name resolution in action. Select a persona and test how different audiences see different names.
  </Text>
</div>

<Alert color="blue" title="Academic Project Demo">
  This demonstrates the core TrueNamePath concept: <strong>right name, right audience, right time</strong>.
  Each persona has different name variants with different visibility and consent settings.
</Alert>

<Card withBorder>
  <Title order={3} mb="md">Select Persona</Title>
  <Group gap="sm">
{Object.entries(PERSONAS).map(([key, persona]) => (
  <Button
key={key}
variant={selectedPersona === key ? 'filled' : 'outline'}
onClick={() => setSelectedPersona(key as keyof typeof PERSONAS)}
size="sm"
  >
{key.toUpperCase()}
  </Button>
))}
  </Group>
  <Text size="sm" c="dimmed" mt="sm">
{PERSONAS[selectedPersona].description}
  </Text>
</Card>

<Card withBorder>
  <Title order={3} mb="md">Test Name Resolution by Audience</Title>
  <Text size="sm" c="dimmed" mb="md">
Click each button to see what name this persona shows to different audiences:
  </Text>
  
  <Group gap="sm" mb="md">
{AUDIENCES.map((audience) => (
  <Button
key={audience}
onClick={() => testNameResolution(audience)}
loading={loading}
variant="outline"
size="sm"
  >
View as {audience.toUpperCase()}
  </Button>
))}
  </Group>

  {Object.keys(results).length > 0 && (
<Stack gap="xs">
  <Text fw={500}>Results:</Text>
  {Object.entries(results).map(([audience, name]) => (
<Group key={audience} gap="xs">
  <Code>{audience}:</Code>
  <Text>{name}</Text>
</Group>
  ))}
</Stack>
  )}
</Card>

<Card withBorder>
  <Title order={4} mb="sm">How This Works</Title>
  <Stack gap="xs">
<Text size="sm">
  • <strong>Context Engine</strong>: The <Code>resolve_name()</Code> function checks user consent and name visibility
</Text>
<Text size="sm">
  • <strong>Privacy by Design</strong>: Each request is logged in the audit table for GDPR compliance
</Text>
<Text size="sm">
  • <strong>Consent-Based</strong>: Users control which audiences can see which names
</Text>
<Text size="sm">
  • <strong>Prioritized</strong>: preferred > nickname > legal > alias based on context appropriateness
</Text>
  </Stack>
</Card>
  </Stack>
</Container>
  );
}