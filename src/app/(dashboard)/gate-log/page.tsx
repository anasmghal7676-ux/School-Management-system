'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, TextInput, Button, Select, Loader, Center, Table, Stack, Card, SimpleGrid, ActionIcon } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconRefresh, IconDoorEnter, IconDoorExit, IconUsers, IconCheck } from '@tabler/icons-react';

export default function GateLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '200', date });
      if (typeFilter) p.set('personType', typeFilter);
      if (debouncedSearch) p.set('search', debouncedSearch);
      const res = await fetch(`/api/gate-log?${p}`);
      const data = await res.json();
      setLogs(data.data || []);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  }, [date, typeFilter, debouncedSearch]);
  useEffect(() => { load(); }, [load]);

  const inCount = logs.filter(l => l.direction === 'IN').length;
  const outCount = logs.filter(l => l.direction === 'OUT').length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Gate Log</Text><Text size="sm" c="dimmed">Entry and exit tracking</Text></Box>
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[{ label: "Today's Entries", value: inCount, color: '#10b981', icon: <IconDoorEnter size={18} /> }, { label: "Today's Exits", value: outCount, color: '#3b82f6', icon: <IconDoorExit size={18} /> }, { label: 'Total Records', value: logs.length, color: '#8b5cf6', icon: <IconUsers size={18} /> }, { label: 'Inside Now', value: Math.max(0, inCount - outCount), color: '#f59e0b', icon: <IconCheck size={18} /> }].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Group><Box style={{ width: 36, height: 36, borderRadius: 9, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{s.icon}</Box>
              <Box><Text size="xl" fw={700}>{s.value}</Text><Text size="xs" c="dimmed">{s.label}</Text></Box>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
      <Group mb="md" gap="sm">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 260 }} radius="md" />
        <Select data={[{ value: '', label: 'All Types' }, { value: 'student', label: 'Student' }, { value: 'staff', label: 'Staff' }, { value: 'visitor', label: 'Visitor' }]} value={typeFilter} onChange={v => setTypeFilter(v || '')} w={140} radius="md" />
      </Group>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr><Table.Th>Name</Table.Th><Table.Th>Type</Table.Th><Table.Th>Direction</Table.Th><Table.Th>Time</Table.Th><Table.Th>Gate</Table.Th><Table.Th>Vehicle</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {logs.map(log => (
                <Table.Tr key={log.id}>
                  <Table.Td><Text size="sm" fw={500}>{log.personName || log.student?.fullName || log.staff?.fullName || '—'}</Text></Table.Td>
                  <Table.Td><Badge variant="light" size="sm" color={{ student: 'blue', staff: 'green', visitor: 'orange' }[log.personType] || 'gray'}>{log.personType || 'Unknown'}</Badge></Table.Td>
                  <Table.Td><Badge color={log.direction === 'IN' ? 'green' : 'blue'} variant="light" size="sm" leftSection={log.direction === 'IN' ? <IconDoorEnter size={10} /> : <IconDoorExit size={10} />}>{log.direction || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{log.time ? new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{log.gate || 'Main Gate'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{log.vehicleNumber || '—'}</Text></Table.Td>
                </Table.Tr>
              ))}
              {logs.length === 0 && <Table.Tr><Table.Td colSpan={6}><Center py="xl"><Text c="dimmed">No gate log entries for today</Text></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
