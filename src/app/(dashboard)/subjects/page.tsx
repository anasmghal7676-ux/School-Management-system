'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Card, Stack, SimpleGrid, Textarea,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconRefresh,
  IconBook, IconCheck, IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react';

const SUBJECT_TYPES = ['Core', 'Elective', 'Optional', 'Co-Curricular', 'Language'].map(v => ({ value: v, label: v }));
const TYPE_COLOR: Record<string, string> = { Core: 'blue', Elective: 'green', Optional: 'yellow', 'Co-Curricular': 'orange', Language: 'grape' };

const EMPTY_FORM = { name: '', code: '', type: 'Core', description: '', schoolId: 'school_main' };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const f = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '200' });
      if (debouncedSearch) p.set('search', debouncedSearch);
      const res = await fetch(`/api/subjects?${p}`);
      const data = await res.json();
      const list = data.data?.subjects || data.data || [];
      setSubjects(list);
      setTotal(data.data?.total || list.length);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load subjects' });
    } finally { setLoading(false); }
  }, [debouncedSearch]);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) return notifications.show({ color: 'red', message: 'Name and code required' });
    setSaving(true);
    try {
      const url = editId ? `/api/subjects/${editId}` : '/api/subjects';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Subject updated' : 'Subject created' });
      closeForm();
      loadSubjects();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await fetch(`/api/subjects/${deleteId}`, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'Subject deleted' });
      closeDelete();
      loadSubjects();
    } catch {
      notifications.show({ color: 'red', message: 'Delete failed' });
    } finally { setSaving(false); }
  };

  const filtered = subjects.filter(s => !typeFilter || s.type === typeFilter);
  const typeCounts = SUBJECT_TYPES.reduce((acc, t) => {
    acc[t.value] = subjects.filter(s => s.type === t.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Subjects</Text>
          <Text size="sm" c="dimmed">Manage all subjects across classes</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Add Subject
        </Button>
      </Group>

      {/* Type breakdown */}
      <SimpleGrid cols={{ base: 3, sm: 5 }} mb="xl">
        {SUBJECT_TYPES.map(t => (
          <Card key={t.value} shadow="xs" radius="md" p="sm" style={{ border: `1px solid #f1f5f9`, cursor: 'pointer', borderBottom: typeFilter === t.value ? `3px solid #3b82f6` : undefined }}
            onClick={() => setTypeFilter(prev => prev === t.value ? '' : t.value)}>
            <Text size="lg" fw={700} c={TYPE_COLOR[t.value]}>{typeCounts[t.value] || 0}</Text>
            <Text size="xs" c="dimmed">{t.label}</Text>
          </Card>
        ))}
      </SimpleGrid>

      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <Select data={[{ value: '', label: 'All Types' }, ...SUBJECT_TYPES]} value={typeFilter} onChange={v => setTypeFilter(v || '')} w={160} radius="md" clearable />
        <ActionIcon variant="default" onClick={loadSubjects} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
        <Text size="sm" c="dimmed">{filtered.length} subjects</Text>
      </Group>

      {loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr>
                <Table.Th>Subject</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map(subj => (
                <Table.Tr key={subj.id}>
                  <Table.Td>
                    <Group gap={8}>
                      <Box style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <IconBook size={14} />
                      </Box>
                      <Text size="sm" fw={600}>{subj.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Badge variant="outline" size="sm" color="gray">{subj.code}</Badge></Table.Td>
                  <Table.Td><Badge color={TYPE_COLOR[subj.type] || 'gray'} variant="light" size="sm">{subj.type || 'Core'}</Badge></Table.Td>
                  <Table.Td><Text size="xs" c="dimmed" lineClamp={1}>{subj.description || '—'}</Text></Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(subj.id); setForm({ name: subj.name, code: subj.code, type: subj.type || 'Core', description: subj.description || '', schoolId: 'school_main' }); openForm(); }}><IconEdit size={14} /></ActionIcon></Tooltip>
                      <Tooltip label="Delete"><ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(subj.id); openDelete(); }}><IconTrash size={14} /></ActionIcon></Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {filtered.length === 0 && (
                <Table.Tr><Table.Td colSpan={5}><Center py="xl"><Text c="dimmed">No subjects found</Text></Center></Table.Td></Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>
      )}

      {/* Form Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Subject' : 'New Subject'}</Text>} radius="md" size="sm">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={8}><TextInput label="Subject Name" value={form.name} onChange={e => f('name', e.target.value)} required placeholder="e.g. Mathematics" /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Code" value={form.code} onChange={e => f('code', e.target.value)} required placeholder="MATH" /></Grid.Col>
          </Grid>
          <Select label="Type" data={SUBJECT_TYPES} value={form.type} onChange={v => f('type', v || 'Core')} />
          <Textarea label="Description" value={form.description} onChange={e => f('description', e.target.value)} rows={2} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {editId ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Subject</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this subject permanently?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
