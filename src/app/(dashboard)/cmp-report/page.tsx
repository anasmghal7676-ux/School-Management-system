'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Stack, Button, Loader, Alert, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconAlertCircle, IconChartBar } from '@tabler/icons-react';

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, recent: 0, active: 0 });

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/comparative-report').then(r => r.json());
      const items = r.data || r.records || [];
      setData(items);
      setStats({
        total: items.length,
        recent: items.filter((i: any) => { const d = new Date(i.createdAt || Date.now()); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length,
        active: items.filter((i: any) => !i.deletedAt && (i.status !== 'Inactive')).length,
      });
    } catch {
      setData([]); setStats({ total: 0, recent: 0, active: 0 });
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Comparative Reports</Text>
          <Text size="sm" c="dimmed">Performance comparison reports</Text>
        </Box>
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
          {loading ? <Loader size="sm" /> : <Text size="xl" fw={700} c="#3b82f6">{stats.total}</Text>}
          <Text size="sm" c="dimmed">Total Records</Text>
        </Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
          {loading ? <Loader size="sm" /> : <Text size="xl" fw={700} c="#10b981">{stats.active}</Text>}
          <Text size="sm" c="dimmed">Active</Text>
        </Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
          {loading ? <Loader size="sm" /> : <Text size="xl" fw={700} c="#6366f1">{stats.recent}</Text>}
          <Text size="sm" c="dimmed">This Month</Text>
        </Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9', textAlign: 'center' }}>
        {loading ? (
          <Group justify="center" py="xl"><Loader /></Group>
        ) : data.length === 0 ? (
          <Stack align="center" gap="md" py="xl">
            <Alert icon={<IconAlertCircle size={16} />} color="violet" radius="md" style={{ maxWidth: 400 }}>
              No comparative reports records found. This section will populate as you use the system.
            </Alert>
          </Stack>
        ) : (
          <Stack align="center" gap="sm" py="md">
            <Badge size="xl" variant="light" color="violet">{data.length} records loaded</Badge>
            <Text size="sm" c="dimmed">Data is available. Full UI coming soon.</Text>
          </Stack>
        )}
      </Card>
    </Box>
  );
}
