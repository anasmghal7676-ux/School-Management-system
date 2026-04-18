'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Card, Stack, SimpleGrid, Textarea,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconRefresh,
  IconBuilding, IconUsers, IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react';

const EMPTY_FORM = { name: '', code: '', description: '' };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const loadDepts = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (debouncedSearch) p.set('search', debouncedSearch);
      const res = await fetch(`/api/departments?${p}`);
      const data = await res.json();
      setDepartments(data.data || []);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load departments' });
    } finally { setLoading(false); }
  }, [debouncedSearch]);

  useEffect(() => { loadDepts(); }, [loadDepts]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return notifications.show({ color: 'red', message: 'Department name required' });
    setSaving(true);
    try {
      const url = editId ? `/api/departments/${editId}` : '/api/departments';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Department created' });
      closeForm();
      loadDepts();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await fetch(`/api/departments/${deleteId}`, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'Deleted' });
      closeDelete();
      loadDepts();
    } catch {
      notifications.show({ color: 'red', message: 'Delete failed' });
    } finally { setSaving(false); }
  };

  const DEPT_COLORS = ['blue', 'teal', 'violet', 'orange', 'pink', 'green', 'red', 'cyan'];

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Departments</Text>
          <Text size="sm" c="dimmed">Manage school departments and staff grouping</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Add Department
        </Button>
      </Group>

      <Group mb="xl" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <ActionIcon variant="default" onClick={loadDepts} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
        <Text size="sm" c="dimmed">{departments.length} departments</Text>
      </Group>

      {loading ? <Center py="xl"><Loader /></Center> : (
        departments.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <IconBuilding size={40} color="#cbd5e1" />
              <Text c="dimmed">No departments yet</Text>
              <Button size="sm" onClick={() => openForm()} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Add First Department</Button>
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {departments.map((dept, i) => (
              <Card key={dept.id} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
                <Group justify="space-between" mb="sm">
                  <Group gap={10}>
                    <Box style={{ width: 40, height: 40, borderRadius: 10, background: `var(--mantine-color-${DEPT_COLORS[i % DEPT_COLORS.length]}-1)`, color: `var(--mantine-color-${DEPT_COLORS[i % DEPT_COLORS.length]}-6)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconBuilding size={20} />
                    </Box>
                    <Box>
                      <Text fw={700} size="sm">{dept.name}</Text>
                      {dept.code && <Badge variant="outline" size="xs" color="gray">{dept.code}</Badge>}
                    </Box>
                  </Group>
                  <Group gap={4}>
                    <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(dept.id); setForm({ name: dept.name, code: dept.code || '', description: dept.description || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(dept.id); openDelete(); }}><IconTrash size={14} /></ActionIcon>
                  </Group>
                </Group>
                <Group gap={6}>
                  <IconUsers size={14} color="#64748b" />
                  <Text size="xs" c="dimmed">{dept.staff?.length || 0} staff members</Text>
                </Group>
                {dept.description && <Text size="xs" c="dimmed" mt={6} lineClamp={2}>{dept.description}</Text>}
                {dept.hod && (
                  <Box mt={8} p={8} style={{ background: '#f8fafc', borderRadius: 6 }}>
                    <Text size="xs" c="dimmed">Head of Department</Text>
                    <Text size="xs" fw={600}>{dept.hod.firstName} {dept.hod.lastName}</Text>
                  </Box>
                )}
              </Card>
            ))}
          </SimpleGrid>
        )
      )}

      {/* Form Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Department' : 'New Department'}</Text>} radius="md" size="sm">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={8}><TextInput label="Department Name" value={form.name} onChange={e => f('name', e.target.value)} required /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Code" value={form.code} onChange={e => f('code', e.target.value)} /></Grid.Col>
          </Grid>
          <Textarea label="Description" value={form.description} onChange={e => f('description', e.target.value)} rows={2} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Department</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this department? Staff members won't be deleted but will lose their department assignment.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
