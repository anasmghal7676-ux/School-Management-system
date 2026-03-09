'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, ActionIcon, Loader, Alert, Modal, Stack, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconCheck } from '@tabler/icons-react';

const EMPTY = { name: '', startDate: '', endDate: '', isCurrent: false };

export default function Page() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/academic-years').then(r => r.json());
      setRecords(r.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: any) { setEditing(r); setForm({ name: r.name, startDate: r.startDate?.slice(0, 10) || '', endDate: r.endDate?.slice(0, 10) || '', isCurrent: r.isCurrent || false }); setModal(true); }

  async function save() {
    if (!form.name || !form.startDate) { notifications.show({ message: 'Name and start date required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/academic-years/${editing.id}` : '/api/academic-years';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ title: editing ? 'Updated' : 'Created', message: 'Academic year saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this academic year?')) return;
    const res = await fetch(`/api/academic-years/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const current = records.find(r => r.isCurrent);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Academic Years</Text><Text size="sm" c="dimmed">Manage school academic year cycles</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Add Year</Button>
        </Group>
      </Group>

      {current && (
        <Card shadow="xs" radius="md" p="lg" mb="lg" style={{ border: '2px solid #10b981', background: '#f0fdf4' }}>
          <Group gap="sm">
            <Box style={{ width: 36, height: 36, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCheck size={18} color="white" />
            </Box>
            <Box>
              <Text fw={700} c="#10b981">Current Academic Year: {current.name}</Text>
              <Text size="sm" c="dimmed">{current.startDate ? new Date(current.startDate).toLocaleDateString() : ''} — {current.endDate ? new Date(current.endDate).toLocaleDateString() : 'Ongoing'}</Text>
            </Box>
          </Group>
        </Card>
      )}

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total Years</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{current ? 1 : 0}</Text><Text size="sm" c="dimmed">Active Year</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{records.filter(r => !r.isCurrent).length}</Text><Text size="sm" c="dimmed">Past Years</Text></Card>
      </SimpleGrid>

      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : records.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No academic years found. Add one to get started.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Name</Table.Th><Table.Th>Start Date</Table.Th><Table.Th>End Date</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {records.map((r: any) => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text fw={600}>{r.name}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.startDate ? new Date(r.startDate).toLocaleDateString() : '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.endDate ? new Date(r.endDate).toLocaleDateString() : 'Ongoing'}</Text></Table.Td>
                  <Table.Td><Badge color={r.isCurrent ? 'green' : 'gray'} variant="light">{r.isCurrent ? 'Current' : 'Past'}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="light" color="blue" onClick={() => openEdit(r)}><IconEdit size={14} /></ActionIcon>
                      {!r.isCurrent && <ActionIcon variant="light" color="red" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon>}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Academic Year' : 'Add Academic Year'} radius="md">
        <Stack gap="md">
          <TextInput label="Year Name" placeholder="e.g. 2024-2025" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Group grow>
            <TextInput label="Start Date" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
            <TextInput label="End Date" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </Group>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
