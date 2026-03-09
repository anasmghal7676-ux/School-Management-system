'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Select, ActionIcon, Loader, Alert, Modal, Stack, MultiSelect } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconRefresh, IconAlertCircle } from '@tabler/icons-react';

export default function Page() {
  const [records, setRecords] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [classId, setClassId] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [filterClass, setFilterClass] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [r, c, s] = await Promise.all([
        fetch('/api/class-subjects' + (filterClass ? `?classId=${filterClass}` : '')).then(r => r.json()),
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
      ]);
      setRecords(r.data || []);
      setClasses(c.data || []);
      setSubjects(s.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filterClass]);

  async function save() {
    if (!classId || selectedSubjects.length === 0) { notifications.show({ message: 'Select class and subjects', color: 'orange' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/class-subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classId, subjectIds: selectedSubjects }) });
      const data = await res.json();
      if (data.success) { notifications.show({ title: 'Assigned', message: 'Subjects assigned to class', color: 'green' }); setModal(false); setClassId(''); setSelectedSubjects([]); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Remove this subject assignment?')) return;
    const res = await fetch(`/api/class-subjects/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Removed', color: 'green' }); load(); }
  }

  const uniqueClasses = [...new Set(records.map((r: any) => r.class?.name).filter(Boolean))];

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Class Subjects</Text><Text size="sm" c="dimmed">Assign subjects to classes</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setModal(true)} radius="md">Assign Subjects</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Assignments</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{uniqueClasses.length}</Text><Text size="sm" c="dimmed">Classes</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{subjects.length}</Text><Text size="sm" c="dimmed">Available Subjects</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <Select data={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]} value={filterClass} onChange={v => setFilterClass(v || '')} w={200} radius="md" clearable placeholder="Filter by Class" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : records.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No class-subject assignments found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Class</Table.Th><Table.Th>Subject</Table.Th><Table.Th>Code</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {records.map((r: any) => (
                <Table.Tr key={r.id}>
                  <Table.Td><Badge variant="light" color="blue">{r.class?.name || '—'}</Badge></Table.Td>
                  <Table.Td><Text fw={500}>{r.subject?.name || '—'}</Text></Table.Td>
                  <Table.Td><Badge variant="outline" size="sm">{r.subject?.code || '—'}</Badge></Table.Td>
                  <Table.Td><ActionIcon variant="light" color="red" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      <Modal opened={modal} onClose={() => setModal(false)} title="Assign Subjects to Class" radius="md">
        <Stack gap="md">
          <Select label="Class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={classId} onChange={v => setClassId(v || '')} required searchable placeholder="Select class" />
          <MultiSelect label="Subjects" data={subjects.map(s => ({ value: s.id, label: s.name }))} value={selectedSubjects} onChange={setSelectedSubjects} required searchable placeholder="Select subjects" />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Assign</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
