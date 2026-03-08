'use client';
import { Box, Text, Badge, Group } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';

export default function Page() {
  return (
    <Box p="xl" className="page-content">
      <Group mb="xl">
        <Box>
          <Text size="22px" fw={800} style={{ color: '#0f172a' }}>Routes</Text>
          <Text c="dimmed" size="sm">This module is coming soon.</Text>
        </Box>
        <Badge color="orange" variant="light" leftSection={<IconClock size={12}/>}>Coming Soon</Badge>
      </Group>
      <Box p="xl" style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box>
          <Text size="48px" mb="md">🚧</Text>
          <Text fw={600} size="lg" c="#0f172a" mb="xs">Routes Module</Text>
          <Text c="dimmed" size="sm" maw={400}>This module is under development and will be available in a future update.</Text>
        </Box>
      </Box>
    </Box>
  );
}
