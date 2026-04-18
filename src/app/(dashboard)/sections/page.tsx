'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, Select, Button, Modal, Grid, ActionIcon, Loader, Center, Table, Stack, TextInput, NumberInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconUsers } from '@tabler/icons-react';

const EMPTY = { name: '', classId: '', capacity: 40, roomNumber: '' };

export default function SectionsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(d.data || [])); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '200' });
      if (classFilter) p.set('classId', classFilter);
      const res = await fetch(`/api/sections?${p}`);
      const data = await res.json();
      setSections(data.data || []);
    } catch { notifications.show({ color: 'red', message: 'Failed to load sections' }); }
    finally { setLoading(false); }
  }, [classFilter]);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.classId) return notifications.show({ color: 'red', message: 'Name and class required' });
    setSaving(true);
    try {
      const url = editId ? `/api/sections/${editId}` : '/api/sections';
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Section created' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  // Group by class
  const grouped: Record<string, any[]> = {};
  sections.forEach(s => {
    const key = s.class?.name || s.classId || 'Unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Sections</Text><Text size="sm" c="dimmed">Manage class sections</Text></Box>
        <Group gap="sm">
          <Select placeholder="Filter by class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={classFilter} onChange={v => setClassFilter(v || '')} w={180} radius="md" clearable />
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Add Section</Button>
        </Group>
      </Group>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr><Table.Th>Section</Table.Th><Table.Th>Class</Table.Th><Table.Th>Room</Table.Th><Table.Th>Capacity</Table.Th><Table.Th>Students</Table.Th><Table.Th>Actions</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sections.map(sec => (
                <Table.Tr key={sec.id}>
                  <Table.Td>
                    <Group gap={8}>
                      <Box style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12 }}>{sec.name?.charAt(0)}</Box>
                      <Text fw={600} size="sm">Section {sec.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Badge variant="light" color="blue" size="sm">{sec.class?.name || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{sec.roomNumber || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{sec.capacity || 40}</Text></Table.Td>
                  <Table.Td><Badge variant="outline" size="sm">{sec._count?.students || 0}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(sec.id); setForm({ name: sec.name || '', classId: sec.classId || '', capacity: sec.capacity || 40, roomNumber: sec.roomNumber || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(sec.id); openDelete(); }}><IconTrash size={14} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {sections.length === 0 && <Table.Tr><Table.Td colSpan={6}><Center py="xl"><Text c="dimmed">No sections found</Text></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Section' : 'Add Section'}</Text>} radius="md" size="sm">
        <Stack gap="sm">
          <Select label="Class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={form.classId} onChange={v => f('classId', v || '')} required searchable />
          <Grid>
            <Grid.Col span={6}><TextInput label="Section Name" placeholder="A, B, C..." value={form.name} onChange={e => f('name', e.target.value)} required /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Room Number" value={form.roomNumber} onChange={e => f('roomNumber', e.target.value)} /></Grid.Col>
          </Grid>
          <NumberInput label="Capacity" value={form.capacity} onChange={v => f('capacity', Number(v) || 40)} min={1} max={100} />
          <Group justify="flex-end" mt="sm"><Button variant="default" onClick={closeForm}>Cancel</Button><Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Create'}</Button></Group>
        </Stack>
      </Modal>
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Section</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this section?</Text>
        <Group justify="flex-end"><Button variant="default" onClick={closeDelete}>Cancel</Button><Button color="red" loading={saving} onClick={async () => { setSaving(true); try { await fetch(`/api/sections/${deleteId}`, { method: 'DELETE' }); notifications.show({ color: 'green', message: 'Deleted' }); closeDelete(); load(); } catch {} finally { setSaving(false); } }}>Delete</Button></Group>
      </Modal>
    </Box>
  );
}
