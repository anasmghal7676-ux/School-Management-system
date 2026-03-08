'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Stack } from '@mantine/core';

export default function Page() {
  return (
    <Box p="xl">
      <Box mb="xl">
        <Text size="xl" fw={700} c="#0f172a">Exam Timetable</Text>
        <Text size="sm" c="dimmed">Exam schedule management</Text>
      </Box>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        {['Total Records', 'This Month', 'Pending'].map((label, i) => (
          <Card key={label} shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c="#3b82f6">—</Text>
            <Text size="sm" c="dimmed">{label}</Text>
          </Card>
        ))}
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', textAlign: 'center' }}>
        <Stack align="center" gap="md" py="xl">
          <Box style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Text size="xl" c="white" fw={700}>E</Text>
          </Box>
          <Text size="lg" fw={600}>Exam Timetable</Text>
          <Text size="sm" c="dimmed" style={{ maxWidth: 400 }}>Exam schedule management. Data will populate as you use the system.</Text>
          <Badge size="lg" variant="light" color="blue">Active</Badge>
        </Stack>
      </Card>
    </Box>
  );
}
