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
title: 'International Professional',
persona: 'JJ (Jędrzej Lewandowski)',
avatar: 'JJ',
challenge:
  'Polish software developer whose legal name "Jędrzej" contains diacritics that colleagues struggle to pronounce in international workplace settings',
solution:
  'HR systems receive "Jędrzej Lewandowski" for compliance, workplace Slack shows "JJ" for daily communication, professional emails display "J. Lewandowski"',
benefit:
  'Preserves cultural identity while enabling smooth international collaboration and meeting academic requirements for name complexity research',
tags: ['Cultural Identity', 'Diacritics'],
  },
  {
title: 'Cross-Cultural Professional',
persona: 'Li Wei (李伟)',
avatar: 'LW',
challenge:
  'Chinese professional navigating Western business contexts where name order conventions and pronunciation create communication barriers',
solution:
  'Chinese services use "李伟", legal documents show "Li Wei", Western business contexts receive "Wei Li", internal teams use "David Li" or preferred nicknames',
benefit:
  'Maintains cultural naming traditions while adapting to different business contexts as documented in academic literature',
tags: ['Cultural Adaptation', 'Business Context'],
  },
  {
title: 'Privacy-Conscious Developer',
persona: 'Alex',
avatar: 'AX',
challenge:
  'Developer maintaining separate professional identities across different contexts, requiring privacy controls over personal information disclosure',
solution:
  'Open source contributions show pseudonym, work systems display professional identity, HR records contain full legal name with controlled access',
benefit:
  'Demonstrates technical feasibility of granular identity control as outlined in privacy-by-design research framework',
tags: ['Privacy Control', 'Identity Separation'],
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
  Research Personas
</Title>
<Text size='lg' c='gray.6' maw={700} mx='auto'>
  Three personas developed during domain analysis to represent
  real-world naming challenges identified in the literature review.
</Text>
  </Box>

  {/* Use Cases Grid */}
  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing='md'>
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
  <Group gap='xs' align='center'>
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

  {/* Academic Context */}
  <Box ta='center' pt='xl'>
<Text size='lg' fw={600} c='gray.8' mb='sm'>
  Academic Research Foundation
</Text>
<Text size='md' c='gray.6' maw={500} mx='auto'>
  These personas represent documented challenges from academic
  literature, demonstrating the technical feasibility of addressing
  identity complexity through context-aware systems.
</Text>
  </Box>
</Stack>
  </Container>
</Box>
  );
}
