'use client';

import { Logo } from '@/components/branding/Logo';
import { LogoWithText } from '@/components/branding/LogoWithText';
import {
  Box,
  Center,
  Container,
  Grid,
  Group,
  List,
  Paper,
  Text,
  Title,
  Button,
  Alert,
} from '@mantine/core';
import {
  IconCheck,
  IconHome,
  IconUserPlus,
  IconShield,
  IconClock,
  IconTrash,
} from '@tabler/icons-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback } from 'react';

function AccountDeletedPageContent() {
  const router = useRouter();

  // Navigate to homepage
  const handleGoHome = useCallback(() => {
router.push('/' as Route);
  }, [router]);

  // Navigate to signup for new account
  const handleCreateNewAccount = useCallback(() => {
router.push('/auth/signup' as Route);
  }, [router]);

  // Get current timestamp for confirmation
  const deletionTimestamp = new Date().toLocaleString('en-US', {
weekday: 'long',
year: 'numeric',
month: 'long',
day: 'numeric',
hour: '2-digit',
minute: '2-digit',
timeZoneName: 'short',
  });

  return (
<Box
  style={{
minHeight: '100vh',
background:
  'linear-gradient(135deg, rgba(46, 204, 113, 0.05) 0%, rgba(39, 174, 96, 0.1) 100%)',
  }}
>
  <Container size='lg' py='xl'>
<Paper
  shadow='lg'
  radius='lg'
  style={{ overflow: 'hidden', backgroundColor: 'white' }}
>
  {/* Brand Header */}
  <Box
py='xl'
px='xl'
style={{
  textAlign: 'center',
  background:
'linear-gradient(135deg, rgba(46, 204, 113, 0.08) 0%, rgba(39, 174, 96, 0.15) 100%)',
  borderBottom: '1px solid rgba(46, 204, 113, 0.2)',
}}
  >
<Center mb='md'>
  <Logo size='xl' />
</Center>
<Title order={1} size='h2' fw={600} c='green.8'>
  TrueNamePath
</Title>
<Text size='lg' c='gray.7'>
  Account Successfully Deleted
</Text>
  </Box>

  {/* Two-column layout */}
  <Grid gutter={0} style={{ minHeight: '500px' }}>
{/* Left Panel - Information Content */}
<Grid.Col
  span={{ base: 12, md: 6 }}
  style={{
backgroundColor: '#f8f9fa',
borderRight: '1px solid #dee2e6',
  }}
>
  <Box p='xl'>
<Title order={2} c='gray.8' mb='xs'>
  What Happened
</Title>
<Text c='gray.6' size='lg' mb='lg'>
  Your account and all associated data have been permanently
  removed from our systems.
</Text>

{/* Deletion confirmation box */}
<Box
  style={{
backgroundColor: 'rgba(46, 204, 113, 0.1)',
border: '1px solid rgba(46, 204, 113, 0.3)',
borderRadius: '8px',
padding: '20px',
  }}
  mb='xl'
>
  <Group gap='xs' mb='md'>
<IconTrash size={20} color='#27ae60' />
<Title order={3} c='green.7' size='h4'>
  Data Permanently Deleted
</Title>
  </Group>
  <List
spacing='xs'
size='sm'
c='gray.7'
mb='md'
styles={{
  itemWrapper: {
alignItems: 'flex-start',
  },
  itemIcon: {
color: '#27ae60',
marginTop: '2px',
  },
}}
  >
<List.Item>All name variants and contexts</List.Item>
<List.Item>OAuth application connections</List.Item>
<List.Item>Consent records and preferences</List.Item>
<List.Item>Audit logs and session history</List.Item>
<List.Item>Profile information and settings</List.Item>
  </List>
</Box>

{/* GDPR Compliance section */}
<Group gap='xs' mb='md'>
  <IconShield size={20} color='#4A7FE7' />
  <Title order={3} c='gray.7' size='h4'>
GDPR Compliant Deletion
  </Title>
</Group>
<Text size='sm' c='gray.7' mb='xl'>
  In accordance with Article 17 of the GDPR (Right to Erasure),
  all your personal data has been permanently deleted from our
  systems. This action cannot be undone.
</Text>

{/* Timestamp section */}
<Group gap='xs' mb='md'>
  <IconClock size={20} color='#6c757d' />
  <Title order={3} c='gray.7' size='h4'>
Deletion Completed
  </Title>
</Group>
<Text size='sm' c='gray.7' mb='xl'>
  {deletionTimestamp}
</Text>

{/* Thank you message */}
<Box
  style={{
backgroundColor: 'rgba(74, 127, 231, 0.1)',
border: '1px solid rgba(74, 127, 231, 0.2)',
borderRadius: '8px',
padding: '16px',
  }}
>
  <Text size='sm' c='gray.7' style={{ fontStyle: 'italic' }}>
Thank you for trying TrueNamePath. Your privacy and data
protection were our priority throughout your experience with
our platform.
  </Text>
</Box>
  </Box>
</Grid.Col>

{/* Right Panel - Action Options */}
<Grid.Col span={{ base: 12, md: 6 }}>
  <Box p='xl'>
<Title order={2} c='gray.8' mb='xl'>
  What&apos;s Next?
</Title>

{/* Success confirmation alert */}
<Alert
  icon={<IconCheck size={16} />}
  title='Account Deletion Confirmed'
  color='green'
  variant='light'
  mb='xl'
>
  Your TrueNamePath account has been successfully and
  permanently deleted. All data associated with your account has
  been removed from our systems.
</Alert>

<Text c='gray.6' mb='xl'>
  You can explore our homepage to learn more about TrueNamePath,
  or create a new account if you&apos;d like to try our services
  again.
</Text>

{/* Action buttons */}
<Box>
  <Button
size='lg'
fullWidth
mb='md'
color='brand'
leftSection={<IconHome size={20} />}
onClick={handleGoHome}
  >
Go to Homepage
  </Button>

  <Button
size='lg'
fullWidth
variant='light'
color='green'
leftSection={<IconUserPlus size={20} />}
onClick={handleCreateNewAccount}
  >
Create New Account
  </Button>
</Box>

{/* Additional information */}
<Box mt='xl' pt='xl' style={{ borderTop: '1px solid #dee2e6' }}>
  <Title order={3} c='gray.7' mb='md' size='h5'>
Need Support?
  </Title>
  <Text size='sm' c='gray.6' mb='sm'>
If you have any questions about the account deletion process
or need assistance, please refer to our privacy policy or
contact documentation.
  </Text>
  <Text size='xs' c='gray.5'>
This is a university demonstration project (CM3035 Advanced
Web Design).
  </Text>
</Box>
  </Box>
</Grid.Col>
  </Grid>
</Paper>
  </Container>
</Box>
  );
}

export default function AccountDeletedPage() {
  return (
<Suspense
  fallback={
<Box bg='gray.0' style={{ minHeight: '100vh' }}>
  <Container size='lg' py='xl'>
<Center style={{ minHeight: '60vh' }}>
  <Box style={{ textAlign: 'center' }}>
<Box mb='lg'>
  <LogoWithText size='md' />
</Box>
<Text size='sm' c='dimmed'>
  Loading...
</Text>
  </Box>
</Center>
  </Container>
</Box>
  }
>
  <AccountDeletedPageContent />
</Suspense>
  );
}
