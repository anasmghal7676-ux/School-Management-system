'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Stack, Button, Table, Select, ActionIcon, Loader, Alert, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconAlertCircle, IconDownload, IconEye, IconSearch } from '@tabler/icons-react';

interface ReportCard { id: string; student?: { firstName: string; lastName: string; rollNumber: string }; class?: { name: string }; term?: string; totalMarks?: number; obtainedMarks?: number; percentage?: number; grade?: string; status?: string; }

export default function Page() {
  const [records, setRecords] = useState<ReportCard[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        fetch('/api/report-cards' + (classFilter ? `?classId=${classFilter}` : '')).then(r => r.json()),
        fetch('/api/classes').then(r => r.json()),
      ]);
      setRecords(r.data || []);
      setClasses(c.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [classFilter]);

  const filtered = records.filter(r => {
    if (!search) return true;
    const name = `${r.student?.firstName} ${r.student?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (r.student?.rollNumber || '').includes(search);
  });

  const passed = records.filter(r => (r.percentage || 0) >= 40).length;
  const failed = records.length - passed;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Report Cards</Text>
          <Text size="sm" c="dimmed">Student academic performance reports</Text>
        </Box>
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{passed}</Text><Text size="sm" c="dimmed">Passed</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#ef4444">{failed}</Text><Text size="sm" c="dimmed">Failed</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{records.length > 0 ? Math.round(records.reduce((s, r) => s + (r.percentage || 0), 0) / records.length) : 0}%</Text><Text size="sm" c="dimmed">Avg %</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <TextInput placeholder="Search by name or roll no..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} w={250} radius="md" />
          <Select data={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]} value={classFilter} onChange={v => setClassFilter(v || '')} w={180} radius="md" clearable placeholder="Filter Class" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No report cards found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Roll No</Table.Th><Table.Th>Student</Table.Th><Table.Th>Class</Table.Th><Table.Th>Term</Table.Th><Table.Th>Marks</Table.Th><Table.Th>%</Table.Th><Table.Th>Grade</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Badge variant="outline" size="sm">{r.student?.rollNumber || '—'}</Badge></Table.Td>
                  <Table.Td><Text fw={500}>{r.student?.firstName} {r.student?.lastName}</Text></Table.Td>
                  <Table.Td><Badge variant="light" color="blue">{r.class?.name || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.term || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.obtainedMarks || 0}/{r.totalMarks || 0}</Text></Table.Td>
                  <Table.Td><Text fw={600} c={(r.percentage || 0) >= 40 ? 'green' : 'red'}>{r.percentage || 0}%</Text></Table.Td>
                  <Table.Td><Badge color="violet" variant="light">{r.grade || '—'}</Badge></Table.Td>
                  <Table.Td><Badge color={(r.percentage || 0) >= 40 ? 'green' : 'red'} variant="light">{(r.percentage || 0) >= 40 ? 'Pass' : 'Fail'}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="light" color="blue" title="View"><IconEye size={14} /></ActionIcon>
                      <ActionIcon variant="light" color="green" title="Download"><IconDownload size={14} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Box>
  );
}
