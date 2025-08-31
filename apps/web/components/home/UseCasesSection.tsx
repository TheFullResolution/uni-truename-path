import {
  Container,
  Title,
  Text,
  Card,
  Box,
  Stack,
  SimpleGrid,
  Avatar,
  Group,
  Badge,
} from '@mantine/core';

const useCases = [
  {
title: 'International Professionals',
persona: 'Jędrzej (JJ) Lewandowski',
avatar: 'JL',
challenge:
  'Polish developer whose legal name contains diacritics that are difficult to pronounce internationally',
solution:
  'Uses legal name for documents, JJ for Slack and casual interactions, J. Lewandowski for professional emails',
benefit:
  'Maintains cultural identity while ensuring smooth professional communication',
tags: ['Cultural Identity', 'Accessibility'],
  },
  {
title: 'Privacy-Conscious Developers',
persona: 'Alex Smith / @CodeAlex',
avatar: 'AS',
challenge:
  'Open source contributor wants to separate professional identity from personal employment',
solution:
  'Uses @CodeAlex for GitHub contributions, Alex Smith for work Slack, full legal name only for HR systems',
benefit: 'Protects personal privacy while building professional reputation',
tags: ['Privacy', 'Professional'],
  },
  {
title: 'Creative Professionals',
persona: 'Maria Santos / DJ Luna',
avatar: 'MS',
challenge:
  'Musician with separate professional and artistic identities needs context-aware presentation',
solution:
  'Uses Maria Santos for corporate bookings, DJ Luna for fan interactions, legal name for contracts',
benefit:
  'Maintains distinct brand identities while managing business efficiently',
tags: ['Creative', 'Branding'],
  },
];

export function UseCasesSection() {
  return (
<Box py='xl' bg='#fafbfc'>
  <Container size='lg' py='xl'>
<Stack gap='xl'>
  {/* Section Header */}
  <Box ta='center' mb='xl'>
<Title order={2} size='2.5rem' fw={600} c='gray.8' mb='md'>
  Real People, Real Solutions
</Title>
<Text size='lg' c='gray.6' maw={700} mx='auto'>
  See how TrueNamePath solves identity challenges for people from
  all walks of life, giving them control over their digital presence
  without compromising authenticity.
</Text>
  </Box>

  {/* Use Cases Grid */}
  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing='xl'>
{useCases.map((useCase, index) => (
  <Card
key={index}
padding='xl'
radius='md'
shadow='sm'
withBorder
className='card-hover-effect'
h='100%'
  >
<Stack gap='md' h='100%'>
  {/* Header */}
  <Group gap='md' align='center'>
<Avatar
  size='md'
  radius='md'
  color='brand'
  variant='filled'
>
  {useCase.avatar}
</Avatar>
<div>
  <Title order={4} size='md' fw={600} c='gray.8' mb={2}>
{useCase.title}
  </Title>
  <Text size='sm' c='gray.6' fw={500}>
{useCase.persona}
  </Text>
</div>
  </Group>

  {/* Tags */}
  <Group gap='xs'>
{useCase.tags.map((tag) => (
  <Badge key={tag} size='xs' variant='light' color='brand'>
{tag}
  </Badge>
))}
  </Group>

  {/* Content */}
  <Stack gap='sm' flex={1}>
<Box>
  <Text size='xs' fw={600} c='gray.7' mb={4}>
CHALLENGE
  </Text>
  <Text size='sm' c='gray.6' lh={1.4}>
{useCase.challenge}
  </Text>
</Box>

<Box>
  <Text size='xs' fw={600} c='brand.6' mb={4}>
SOLUTION
  </Text>
  <Text size='sm' c='gray.6' lh={1.4}>
{useCase.solution}
  </Text>
</Box>

<Box>
  <Text size='xs' fw={600} c='green.6' mb={4}>
BENEFIT
  </Text>
  <Text size='sm' c='gray.6' lh={1.4}>
{useCase.benefit}
  </Text>
</Box>
  </Stack>
</Stack>
  </Card>
))}
  </SimpleGrid>

  {/* Bottom CTA */}
  <Box ta='center' pt='xl'>
<Text size='lg' fw={600} c='gray.8' mb='sm'>
  Your Story Matters Too
</Text>
<Text size='md' c='gray.6' maw={500} mx='auto'>
  Whether you&apos;re navigating cultural identity, professional
  personas, or privacy concerns, TrueNamePath gives you the tools to
  present yourself authentically in every context.
</Text>
  </Box>
</Stack>
  </Container>
</Box>
  );
}
