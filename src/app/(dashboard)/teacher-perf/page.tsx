'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Table, Select, ActionIcon, Loader, Alert, Avatar, Progress, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconAlertCircle, IconSearch, IconStar } from '@tabler/icons-react';

export default function Page() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
      ]);
      setStaff(s.data || []);
      setDepartments(d.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // Generate mock performance scores for display
  function getScore(id: string) {
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return 60 + (hash % 40);
  }

  function getGrade(score: number) {
    if (score >= 90) return { grade: 'A+', color: 'green' };
    if (score >= 80) return { grade: 'A', color: 'teal' };
    if (score >= 70) return { grade: 'B', color: 'blue' };
    if (score >= 60) return { grade: 'C', color: 'yellow' };
    return { grade: 'D', color: 'orange' };
  }

  const filtered = staff.filter(s => {
    if (deptFilter && s.departmentId !== deptFilter) return false;
    if (search) {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      return name.includes(search.toLowerCase());
    }
    return true;
  });

  const avgScore = filtered.length > 0 ? Math.round(filtered.reduce((sum, s) => sum + getScore(s.id), 0) / filtered.length) : 0;
  const topPerformers = filtered.filter(s => getScore(s.id) >= 85).length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Teacher Performance</Text><Text size="sm" c="dimmed">Staff performance evaluation & ratings</Text></Box>
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{staff.length}</Text><Text size="sm" c="dimmed">Total Teachers</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{topPerformers}</Text><Text size="sm" c="dimmed">Top Performers</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{avgScore}%</Text><Text size="sm" c="dimmed">Avg Score</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{departments.length}</Text><Text size="sm" c="dimmed">Departments</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <TextInput placeholder="Search teachers..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} w={220} radius="md" />
          <Select data={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d.id, label: d.name }))]} value={deptFilter} onChange={v => setDeptFilter(v || '')} w={200} radius="md" clearable placeholder="Filter Department" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No teachers found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Teacher</Table.Th><Table.Th>Department</Table.Th><Table.Th>Designation</Table.Th><Table.Th>Score</Table.Th><Table.Th>Grade</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map((s: any) => {
                const score = getScore(s.id);
                const { grade, color } = getGrade(score);
                return (
                  <Table.Tr key={s.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <Avatar size="sm" radius="xl" color="blue">{s.firstName?.[0]}</Avatar>
                        <Box><Text fw={500}>{s.firstName} {s.lastName}</Text><Text size="xs" c="dimmed">{s.email}</Text></Box>
                      </Group>
                    </Table.Td>
                    <Table.Td><Badge variant="light" color="blue">{s.department?.name || '—'}</Badge></Table.Td>
                    <Table.Td><Text size="sm">{s.designation || '—'}</Text></Table.Td>
                    <Table.Td style={{ width: 160 }}>
                      <Group gap="xs"><Progress value={score} color={color} style={{ flex: 1 }} size="md" radius="md" /><Text size="sm" fw={600}>{score}%</Text></Group>
                    </Table.Td>
                    <Table.Td><Badge color={color} variant="light">{grade}</Badge></Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Box>
  );
}
