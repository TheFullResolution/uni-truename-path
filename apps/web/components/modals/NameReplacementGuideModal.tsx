'use client';

import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
  Alert,
  Badge,
  Stepper,
  Title,
  Divider,
  Progress,
  Card,
} from '@mantine/core';
import { StepperStep } from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUsers,
  IconLock,
  IconInfoCircle,
  IconCheck,
  IconArrowRight,
} from '@tabler/icons-react';
import { CanDeleteNameResponse } from '@/types/database';

interface NameReplacementGuideModalProps {
  opened: boolean;
  onClose: () => void;
  nameText: string;
  protectionData: CanDeleteNameResponse;
  onCreateNewName?: () => void;
  onUpdateContexts?: () => void;
}

function getContextTypeIcon(isPublic: boolean) {
  return isPublic ? <IconUsers size={12} /> : <IconLock size={12} />;
}

function calculateProgress(step: number): number {
  return Math.round((step / 3) * 100);
}

export function NameReplacementGuideModal({
  opened,
  onClose,
  nameText,
  protectionData,
  onCreateNewName,
  onUpdateContexts,
}: NameReplacementGuideModalProps) {
  const { context_info, reason_code } = protectionData;
  const allContexts = [
...context_info.public_contexts,
...context_info.permanent_contexts,
  ];

  // Determine current step (this would be managed by parent component in real implementation)
  const currentStep = 0; // 0-based: 0=create, 1=update, 2=delete
  const isLastName = reason_code === 'LAST_NAME';

  const steps = [
{
  icon: IconPlus,
  title: 'Create New Name',
  description: 'Add a new name variant to replace the protected one',
  action: 'Create Name',
  actionColor: 'green',
  onAction: onCreateNewName,
},
{
  icon: IconEdit,
  title: 'Update Context Assignments',
  description: `Reassign ${allContexts.length} context${allContexts.length !== 1 ? 's' : ''} to use the new name`,
  action: 'Update Assignments',
  actionColor: 'blue',
  onAction: onUpdateContexts,
},
{
  icon: IconTrash,
  title: 'Delete Original Name',
  description: 'Safely remove the original name (now unprotected)',
  action: 'Delete Safely',
  actionColor: 'red',
  onAction: undefined, // Would be handled by parent
},
  ];

  return (
<Modal
  opened={opened}
  onClose={onClose}
  title='Safe Name Replacement Guide'
  centered
  size='lg'
>
  <Stack gap='md'>
{/* Overview Alert */}
<Alert
  icon={<IconInfoCircle size={16} />}
  title='Safe Replacement Process'
  color='blue'
  variant='light'
>
  <Text size='sm'>
Follow this 3-step process to safely replace the protected name{' '}
<Text component='span' fw={600}>
  &ldquo;{nameText}&rdquo;
</Text>{' '}
without affecting your identity presentation or breaking context
assignments.
  </Text>
</Alert>

{/* Progress indicator */}
<Card withBorder padding='md' radius='md'>
  <Stack gap='xs'>
<Group justify='space-between'>
  <Text size='sm' fw={500}>
Progress
  </Text>
  <Text size='sm' c='dimmed'>
Step {currentStep + 1} of 3
  </Text>
</Group>
<Progress
  value={calculateProgress(currentStep)}
  size='md'
  color='blue'
  striped={currentStep < 3}
  animated={currentStep < 3}
/>
  </Stack>
</Card>

{/* Step-by-step guide */}
<Stepper
  active={currentStep}
  orientation='vertical'
  size='md'
  iconSize={32}
  completedIcon={<IconCheck size={16} />}
>
  {steps.map((step, index) => (
<StepperStep
  key={index}
  icon={<step.icon size={16} />}
  label={step.title}
  description={step.description}
  color={
index === currentStep
  ? 'blue'
  : index < currentStep
? 'green'
: 'gray'
  }
  allowStepSelect={false}
>
  {index === currentStep && step.onAction && (
<Card withBorder padding='sm' radius='sm' mt='xs'>
  <Group justify='space-between' align='center'>
<Text size='sm' c='dimmed'>
  Ready to proceed with this step
</Text>
<Button
  size='sm'
  variant='light'
  color={step.actionColor}
  rightSection={<IconArrowRight size={14} />}
  onClick={() => {
step.onAction?.();
onClose();
  }}
>
  {step.action}
</Button>
  </Group>
</Card>
  )}
</StepperStep>
  ))}
</Stepper>

<Divider />

{/* Affected contexts display */}
<Stack gap='xs'>
  <Title order={6}>Affected Contexts ({allContexts.length})</Title>
  <Alert
color='orange'
variant='light'
icon={<IconInfoCircle size={16} />}
  >
<Text size='sm'>
  These contexts currently use the name &ldquo;{nameText}&rdquo; and
  will need to be reassigned in Step 2:
</Text>
  </Alert>

  <Group gap='xs'>
{context_info.public_contexts.map((context) => (
  <Badge
key={`public-${context.id}`}
variant='light'
color='green'
size='sm'
leftSection={getContextTypeIcon(true)}
  >
{context.context_name}
  </Badge>
))}
{context_info.permanent_contexts.map((context) => (
  <Badge
key={`permanent-${context.id}`}
variant='light'
color='red'
size='sm'
leftSection={getContextTypeIcon(false)}
  >
{context.context_name}
  </Badge>
))}
  </Group>
</Stack>

{/* Last name special notice */}
{isLastName && (
  <Alert
icon={<IconInfoCircle size={16} />}
title='Last Name Protection'
color='yellow'
variant='light'
  >
<Text size='sm'>
  This is your last remaining name variant. You must complete Step 1
  (Create New Name) before you can proceed with the replacement
  process to ensure continuous identity resolution.
</Text>
  </Alert>
)}

{/* Why this process is necessary */}
<Alert
  icon={<IconInfoCircle size={16} />}
  title='Why follow this process?'
  color='blue'
  variant='light'
>
  <Stack gap='xs'>
<Text size='sm'>
  • <strong>Prevents broken context assignments:</strong> Ensures
  all contexts have valid name mappings
</Text>
<Text size='sm'>
  • <strong>Maintains identity continuity:</strong> No disruption to
  external applications or consents
</Text>
<Text size='sm'>
  • <strong>Preserves data integrity:</strong> Proper sequencing
  prevents database constraint violations
</Text>
  </Stack>
</Alert>

{/* Action buttons */}
<Group justify='space-between' mt='md'>
  <Button variant='light' size='md' onClick={onClose}>
Close Guide
  </Button>

  {currentStep === 0 && onCreateNewName && (
<Button
  variant='filled'
  color='green'
  size='md'
  leftSection={<IconPlus size={16} />}
  onClick={() => {
onCreateNewName();
onClose();
  }}
>
  Start Replacement
</Button>
  )}
</Group>
  </Stack>
</Modal>
  );
}
