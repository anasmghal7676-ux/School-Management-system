'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Stack, Button, Table, Select, ActionIcon, Loader, Alert, TextInput, Modal, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconBook } from '@tabler/icons-react';

interface Homework { id: string; title: string; description?: string; dueDate?: string; subject?: { name: string }; class?: { name: string }; status?: string; createdAt: string; }
const EMPTY = { title: '', description: '', dueDate: '', subjectId: '', classId: '' };

export default function Page() {
  const [records, setRecords] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Homework | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [classFilter, setClassFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [h, c, s] = await Promise.all([
        fetch('/api/homework' + (classFilter ? `?classId=${classFilter}` : '')).then(r => r.json()),
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
      ]);
      setRecords(h.data || []);
      setClasses(c.data || []);
      setSubjects(s.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [classFilter]);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: Homework) { setEditing(r); setForm({ title: r.title, description: r.description || '', dueDate: r.dueDate || '', subjectId: '', classId: '' }); setModal(true); }

  async function save() {
    if (!form.title) { notifications.show({ message: 'Title is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/homework/${editing.id}` : '/api/homework';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ title: editing ? 'Updated' : 'Created', message: 'Homework saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete homework?')) return;
    const res = await fetch(`/api/homework/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = records.filter(r => r.dueDate && new Date(r.dueDate) < today).length;
  const dueToday = records.filter(r => r.dueDate && new Date(r.dueDate).toDateString() === today.toDateString()).length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Homework</Text>
          <Text size="sm" c="dimmed">Assign and track homework</Text>
        </Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Assign Homework</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{dueToday}</Text><Text size="sm" c="dimmed">Due Today</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#ef4444">{overdue}</Text><Text size="sm" c="dimmed">Overdue</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{records.length - overdue}</Text><Text size="sm" c="dimmed">On Track</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <Select data={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]} value={classFilter} onChange={v => setClassFilter(v || '')} w={180} radius="md" clearable placeholder="Filter Class" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : records.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No homework found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Title</Table.Th><Table.Th>Subject</Table.Th><Table.Th>Class</Table.Th><Table.Th>Due Date</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {records.map(r => {
                const isOverdue = r.dueDate && new Date(r.dueDate) < today;
                return (
                  <Table.Tr key={r.id}>
                    <Table.Td><Group gap="xs"><IconBook size={14} color="#6366f1" /><Text fw={500}>{r.title}</Text></Group></Table.Td>
                    <Table.Td><Badge variant="light" color="violet">{r.subject?.name || '—'}</Badge></Table.Td>
                    <Table.Td><Badge variant="light" color="blue">{r.class?.name || '—'}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c={isOverdue ? 'red' : 'inherit'}>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}</Text></Table.Td>
                    <Table.Td><Badge color={isOverdue ? 'red' : 'green'} variant="light">{isOverdue ? 'Overdue' : 'Active'}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="light" color="blue" onClick={() => openEdit(r)}><IconEdit size={14} /></ActionIcon>
                        <ActionIcon variant="light" color="red" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Homework' : 'Assign Homework'} radius="md">
        <Stack gap="md">
          <TextInput label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Math exercises Ch. 5" />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Detailed instructions..." />
          <Select label="Class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={form.classId} onChange={v => setForm(f => ({ ...f, classId: v || '' }))} searchable placeholder="Select class" />
          <Select label="Subject" data={subjects.map(s => ({ value: s.id, label: s.name }))} value={form.subjectId} onChange={v => setForm(f => ({ ...f, subjectId: v || '' }))} searchable placeholder="Select subject" />
          <TextInput label="Due Date" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Assign'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
