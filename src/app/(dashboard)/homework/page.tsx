'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, TextInput, Select, Button, Modal, Grid, ActionIcon, Loader, Center, Table, Stack, Textarea } from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconBook } from '@tabler/icons-react';

const EMPTY = { title: '', description: '', classId: '', subjectId: '', dueDate: '', assignedDate: new Date().toISOString().split('T')[0] };

export default function HomeworkPage() {
  const [hws, setHws] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(d.data || []));
    fetch('/api/subjects?limit=200').then(r => r.json()).then(d => setSubjects(d.data || []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '100' });
      if (debouncedSearch) p.set('search', debouncedSearch);
      const res = await fetch(`/api/homework?${p}`);
      const data = await res.json();
      setHws(data.data || []);
    } catch { notifications.show({ color: 'red', message: 'Failed to load' }); }
    finally { setLoading(false); }
  }, [debouncedSearch]);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.title.trim()) return notifications.show({ color: 'red', message: 'Title required' });
    setSaving(true);
    try {
      const url = editId ? `/api/homework/${editId}` : '/api/homework';
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, schoolId: 'school_main' }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Homework assigned' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Homework</Text><Text size="sm" c="dimmed">Assign and track homework</Text></Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Assign Homework</Button>
      </Group>
      <TextInput leftSection={<IconSearch size={14} />} placeholder="Search homework..." value={search} onChange={e => setSearch(e.target.value)} mb="md" radius="md" style={{ maxWidth: 350 }} />
      {loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr><Table.Th>Title</Table.Th><Table.Th>Class</Table.Th><Table.Th>Subject</Table.Th><Table.Th>Assigned</Table.Th><Table.Th>Due Date</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {hws.map(hw => {
                const isOverdue = hw.dueDate && new Date(hw.dueDate) < new Date();
                return (
                  <Table.Tr key={hw.id}>
                    <Table.Td><Text size="sm" fw={500}>{hw.title}</Text></Table.Td>
                    <Table.Td><Text size="sm">{hw.class?.name || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{hw.subject?.name || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{hw.assignedDate ? new Date(hw.assignedDate).toLocaleDateString() : '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" c={isOverdue ? 'red' : 'inherit'}>{hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : '—'}</Text></Table.Td>
                    <Table.Td><Badge color={isOverdue ? 'red' : 'green'} variant="light" size="sm">{isOverdue ? 'Overdue' : 'Active'}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(hw.id); setForm({ title: hw.title || '', description: hw.description || '', classId: hw.classId || '', subjectId: hw.subjectId || '', dueDate: hw.dueDate ? hw.dueDate.split('T')[0] : '', assignedDate: hw.assignedDate ? hw.assignedDate.split('T')[0] : '' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={async () => { await fetch(`/api/homework/${hw.id}`, { method: 'DELETE' }); load(); }}><IconTrash size={14} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {hws.length === 0 && <Table.Tr><Table.Td colSpan={7}><Center py="xl"><Text c="dimmed">No homework assigned yet</Text></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Homework' : 'Assign Homework'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <TextInput label="Title" value={form.title} onChange={e => f('title', e.target.value)} required />
          <Textarea label="Description" value={form.description} onChange={e => f('description', e.target.value)} rows={3} />
          <Grid>
            <Grid.Col span={6}><Select label="Class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={form.classId} onChange={v => f('classId', v || '')} searchable /></Grid.Col>
            <Grid.Col span={6}><Select label="Subject" data={subjects.map(s => ({ value: s.id, label: s.name }))} value={form.subjectId} onChange={v => f('subjectId', v || '')} searchable /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><TextInput label="Assigned Date" type="date" value={form.assignedDate} onChange={e => f('assignedDate', e.target.value)} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Due Date" type="date" value={form.dueDate} onChange={e => f('dueDate', e.target.value)} /></Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="sm"><Button variant="default" onClick={closeForm}>Cancel</Button><Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Assign'}</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
