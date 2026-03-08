import { Box, Text, Button, Stack, Center } from '@mantine/core';

interface EmptyStateProps {
  icon?: React.ComponentType<any>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: React.ComponentType<any> };
  className?: string;
  compact?: boolean;
}

export default function EmptyState({ icon: Icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <Center py={compact ? 'md' : 'xl'}>
      <Stack align="center" gap="sm" style={{ maxWidth: 340 }}>
        {Icon && <Box style={{ width: 48, height: 48, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={22} color="#94a3b8" /></Box>}
        <Text fw={600} ta="center">{title}</Text>
        {description && <Text size="sm" c="dimmed" ta="center">{description}</Text>}
        {action && (
          <Button size="sm" onClick={action.onClick} leftSection={action.icon ? <action.icon size={14} /> : undefined} mt="xs" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            {action.label}
          </Button>
        )}
      </Stack>
    </Center>
  );
}
