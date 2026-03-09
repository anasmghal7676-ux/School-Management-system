'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Stack, Button, Table, Select, ActionIcon, Loader, Alert, Modal, Checkbox } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconAlertCircle, IconArrowUp, IconUserCheck } from '@tabler/icons-react';

interface Student { id: string; firstName: string; lastName: string; rollNumber: string; class?: { name: string }; section?: { name: string }; }

export default function Page() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromClass, setFromClass] = useState('');
  const [toClass, setToClass] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [promoting, setPromoting] = useState(false);
  const [modal, setModal] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        fetch('/api/students' + (fromClass ? `?classId=${fromClass}` : '')).then(r => r.json()),
        fetch('/api/classes').then(r => r.json()),
      ]);
      setStudents(s.data || []);
      setClasses(c.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [fromClass]);

  function toggleAll() {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map(s => s.id)));
  }

  function toggle(id: string) {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  }

  async function promote() {
    if (!toClass || selected.size === 0) { notifications.show({ message: 'Select students and target class', color: 'orange' }); return; }
    setPromoting(true);
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: Array.from(selected), toClassId: toClass })
      });
      const data = await res.json();
      if (data.success) {
        notifications.show({ title: 'Success', message: `${selected.size} students promoted!`, color: 'green' });
        setModal(false); setSelected(new Set()); load();
      } else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setPromoting(false); }
  }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Promotions</Text>
          <Text size="sm" c="dimmed">Promote students to next class</Text>
        </Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconArrowUp size={16} />} onClick={() => setModal(true)} disabled={selected.size === 0} radius="md" color="green">
            Promote Selected ({selected.size})
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{students.length}</Text><Text size="sm" c="dimmed">Students in Class</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{selected.size}</Text><Text size="sm" c="dimmed">Selected</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{classes.length}</Text><Text size="sm" c="dimmed">Classes Available</Text></Card>
      </SimpleGrid>

      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <Select data={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]} value={fromClass} onChange={v => setFromClass(v || '')} w={200} placeholder="From Class" radius="md" clearable label="From Class" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : students.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No students found. Select a class above.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th><Checkbox checked={selected.size === students.length} onChange={toggleAll} /></Table.Th>
                <Table.Th>Roll No</Table.Th>
                <Table.Th>Student</Table.Th>
                <Table.Th>Current Class</Table.Th>
                <Table.Th>Section</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {students.map(s => (
                <Table.Tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => toggle(s.id)}>
                  <Table.Td><Checkbox checked={selected.has(s.id)} onChange={() => toggle(s.id)} /></Table.Td>
                  <Table.Td><Badge variant="outline" size="sm">{s.rollNumber || '—'}</Badge></Table.Td>
                  <Table.Td><Text fw={500}>{s.firstName} {s.lastName}</Text></Table.Td>
                  <Table.Td><Badge variant="light" color="blue">{s.class?.name || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{s.section?.name || '—'}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Modal opened={modal} onClose={() => setModal(false)} title="Confirm Promotion" radius="md">
        <Stack gap="md">
          <Alert icon={<IconUserCheck size={16} />} color="blue" radius="md">
            You are about to promote <strong>{selected.size} students</strong>.
          </Alert>
          <Select label="Promote To Class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={toClass} onChange={v => setToClass(v || '')} required searchable placeholder="Select target class" />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={promote} loading={promoting} color="green" leftSection={<IconArrowUp size={16} />}>Promote</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
