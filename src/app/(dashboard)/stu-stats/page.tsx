'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Loader, Alert, ActionIcon, Table } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/student-stats').then(r => r.json());
      setData(r.data || r.records || []);
    } catch { setData([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const thisMonth = data.filter((i: any) => {
    const d = new Date(i.createdAt || i.date || Date.now());
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Student Statistics</Text><Text size="sm" c="dimmed">Demographic statistics</Text></Box>
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
          {loading ? null : <Text size="xl" fw={700} c="#3b82f6">{data.length}</Text>}
          <Text size="sm" c="dimmed">Total Records</Text>
        </Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
          {loading ? null : <Text size="xl" fw={700} c="#10b981">{thisMonth}</Text>}
          <Text size="sm" c="dimmed">This Month</Text>
        </Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
          {loading ? null : <Text size="xl" fw={700} c="#6366f1">{data.filter((i: any) => i.status === 'Active' || i.status === 'Approved' || i.status === 'Present').length}</Text>}
          <Text size="sm" c="dimmed">Active</Text>
        </Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : data.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No student statistics records found. Data will appear here once added.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Metric</Table.Th><Table.Th>Value</Table.Th><Table.Th>Change</Table.Th><Table.Th>Date</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {data.slice(0, 50).map((r: any, i: number) => (
                <Table.Tr key={r.id || i}>
                  <Table.Td><Text size="sm">{String((r as any)[Object.keys(r as any)[0]] ?? '—')}</Text></Table.Td><Table.Td><Text size="sm">{String((r as any)[Object.keys(r as any)[1]] ?? '—')}</Text></Table.Td><Table.Td><Text size="sm">{String((r as any)[Object.keys(r as any)[2]] ?? '—')}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Box>
  );
}
