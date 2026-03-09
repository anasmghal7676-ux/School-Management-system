'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Table, Select, ActionIcon, Loader, Alert, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconAlertCircle, IconSearch } from '@tabler/icons-react';

interface GradeEntry { id: string; marks?: number; grade?: string; student?: { firstName: string; lastName: string; rollNumber: string }; subject?: { name: string }; exam?: { name: string }; }

export default function Page() {
  const [records, setRecords] = useState<GradeEntry[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classFilter) params.set('classId', classFilter);
      if (subjectFilter) params.set('subjectId', subjectFilter);
      const [g, c, s] = await Promise.all([
        fetch('/api/grade-book?' + params.toString()).then(r => r.json()),
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
      ]);
      setRecords(g.data || []);
      setClasses(c.data || []);
      setSubjects(s.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [classFilter, subjectFilter]);

  const filtered = records.filter(r => {
    if (!search) return true;
    const name = `${r.student?.firstName} ${r.student?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const avg = filtered.length > 0 ? Math.round(filtered.reduce((s, r) => s + (r.marks || 0), 0) / filtered.length) : 0;
  const passing = filtered.filter(r => (r.marks || 0) >= 40).length;

  function gradeColor(g?: string) {
    if (!g) return 'gray';
    if (g === 'A+' || g === 'A') return 'green';
    if (g === 'B') return 'teal';
    if (g === 'C') return 'yellow';
    if (g === 'D') return 'orange';
    return 'red';
  }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Grade Book</Text>
          <Text size="sm" c="dimmed">Student marks and grades overview</Text>
        </Box>
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{filtered.length}</Text><Text size="sm" c="dimmed">Entries</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{avg}</Text><Text size="sm" c="dimmed">Avg Marks</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#22c55e">{passing}</Text><Text size="sm" c="dimmed">Passing</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#ef4444">{filtered.length - passing}</Text><Text size="sm" c="dimmed">Failing</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md" wrap="wrap">
          <TextInput placeholder="Search student..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} w={220} radius="md" />
          <Select data={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]} value={classFilter} onChange={v => setClassFilter(v || '')} w={160} radius="md" clearable placeholder="Class" />
          <Select data={[{ value: '', label: 'All Subjects' }, ...subjects.map(s => ({ value: s.id, label: s.name }))]} value={subjectFilter} onChange={v => setSubjectFilter(v || '')} w={160} radius="md" clearable placeholder="Subject" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No grade entries found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Roll No</Table.Th><Table.Th>Student</Table.Th><Table.Th>Subject</Table.Th><Table.Th>Exam</Table.Th><Table.Th>Marks</Table.Th><Table.Th>Grade</Table.Th><Table.Th>Result</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Badge variant="outline" size="sm">{r.student?.rollNumber || '—'}</Badge></Table.Td>
                  <Table.Td><Text fw={500}>{r.student?.firstName} {r.student?.lastName}</Text></Table.Td>
                  <Table.Td><Badge variant="light" color="violet">{r.subject?.name || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.exam?.name || '—'}</Text></Table.Td>
                  <Table.Td><Text fw={600} c={(r.marks || 0) >= 40 ? 'green' : 'red'}>{r.marks ?? '—'}</Text></Table.Td>
                  <Table.Td><Badge color={gradeColor(r.grade)} variant="light">{r.grade || '—'}</Badge></Table.Td>
                  <Table.Td><Badge color={(r.marks || 0) >= 40 ? 'green' : 'red'} variant="light">{(r.marks || 0) >= 40 ? 'Pass' : 'Fail'}</Badge></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Box>
  );
}
