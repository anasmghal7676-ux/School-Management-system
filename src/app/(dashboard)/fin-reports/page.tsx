'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Loader, Center, Stack, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';

const PAGE_META: Record<string, { title: string; desc: string; color: string }> = {
  'budget': { title: 'Budget Management', desc: 'Annual budget planning and tracking', color: '#3b82f6' },
  'analytics': { title: 'Analytics', desc: 'School performance analytics and insights', color: '#8b5cf6' },
  'reports': { title: 'Reports', desc: 'Generate and view school reports', color: '#0891b2' },
  'calendar': { title: 'School Calendar', desc: 'Academic calendar and events', color: '#16a34a' },
  'syllabus': { title: 'Syllabus', desc: 'Curriculum syllabus management', color: '#d97706' },
  'lesson-plans': { title: 'Lesson Plans', desc: 'Teacher lesson planning', color: '#dc2626' },
  'curriculum': { title: 'Curriculum', desc: 'Curriculum design and management', color: '#7c3aed' },
  'acad-session': { title: 'Academic Sessions', desc: 'Session and term management', color: '#0e7490' },
  'acad-planner': { title: 'Academic Planner', desc: 'Academic activity planning', color: '#16a34a' },
  'fin-dash': { title: 'Finance Dashboard', desc: 'Financial overview and KPIs', color: '#15803d' },
  'fin-reports': { title: 'Finance Reports', desc: 'Financial statements and reports', color: '#b45309' },
  'mon-summary': { title: 'Monthly Summary', desc: 'Monthly performance summary', color: '#4338ca' },
};

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const slug = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() || '' : '';
  const meta = PAGE_META[slug] || { title: 'Module', desc: 'Module management', color: '#3b82f6' };

  return (
    <Box p="xl">
      <Box mb="xl">
        <Text size="xl" fw={700} c="#0f172a">{meta.title}</Text>
        <Text size="sm" c="dimmed">{meta.desc}</Text>
      </Box>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        {['Total Records', 'This Month', 'Pending'].map((label, i) => (
          <Card key={label} shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="2xl" fw={700} c={meta.color}>—</Text>
            <Text size="sm" c="dimmed">{label}</Text>
          </Card>
        ))}
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', textAlign: 'center' }}>
        <Stack align="center" gap="md" py="xl">
          <Box style={{ width: 64, height: 64, borderRadius: 16, background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Text size="xl" c="white" fw={700}>{meta.title.charAt(0)}</Text>
          </Box>
          <Text size="lg" fw={600}>{meta.title}</Text>
          <Text size="sm" c="dimmed" style={{ maxWidth: 400 }}>This module is ready. Data will populate as you use the system.</Text>
          <Badge size="lg" variant="light" color="blue">Active</Badge>
        </Stack>
      </Card>
    </Box>
  );
}
