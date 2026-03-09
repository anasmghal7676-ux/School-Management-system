'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Modal, TextInput, Select, ActionIcon, Loader, Alert, Textarea, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconTool, IconSearch } from '@tabler/icons-react';

interface Request { id: string; title: string; location?: string; priority?: string; status?: string; description?: string; assignedTo?: string; createdAt?: string; resolvedAt?: string; }
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const EMPTY = { title: '', location: '', priority: 'Medium', status: 'Open', description: '', assignedTo: '' };

export default function Page() {
  const [records, setRecords] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Request | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/maintenance').then(r => r.json());
      setRecords(r.data || r.requests || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: Request) { setEditing(r); setForm({ title: r.title, location: r.location || '', priority: r.priority || 'Medium', status: r.status || 'Open', description: r.description || '', assignedTo: r.assignedTo || '' }); setModal(true); }

  async function save() {
    if (!form.title) { notifications.show({ message: 'Title is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/maintenance/${editing.id}` : '/api/maintenance';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this request?')) return;
    const res = await fetch(`/api/maintenance/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const filtered = statusFilter ? records.filter(r => r.status === statusFilter) : records;
  const open = records.filter(r => r.status === 'Open' || r.status === 'In Progress').length;
  const urgent = records.filter(r => r.priority === 'Urgent').length;

  function priorityColor(p?: string) { return p === 'Urgent' ? 'red' : p === 'High' ? 'orange' : p === 'Medium' ? 'yellow' : 'green'; }
  function statusColor(s?: string) { return s === 'Open' ? 'red' : s === 'In Progress' ? 'orange' : s === 'Resolved' ? 'green' : 'gray'; }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Maintenance</Text><Text size="sm" c="dimmed">Facility maintenance requests</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">New Request</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total Requests</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{open}</Text><Text size="sm" c="dimmed">Open</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#ef4444">{urgent}</Text><Text size="sm" c="dimmed">Urgent</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{records.filter(r => r.status === 'Resolved').length}</Text><Text size="sm" c="dimmed">Resolved</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <Select data={[{ value: '', label: 'All Status' }, ...STATUSES.map(s => ({ value: s, label: s }))]} value={statusFilter} onChange={v => setStatusFilter(v || '')} w={180} radius="md" clearable placeholder="Filter Status" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No maintenance requests found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Issue</Table.Th><Table.Th>Location</Table.Th><Table.Th>Priority</Table.Th><Table.Th>Status</Table.Th><Table.Th>Assigned To</Table.Th><Table.Th>Date</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Group gap="xs"><IconTool size={14} color="#6366f1" /><Text fw={500}>{r.title}</Text></Group></Table.Td>
                  <Table.Td><Text size="sm">{r.location || '—'}</Text></Table.Td>
                  <Table.Td><Badge color={priorityColor(r.priority)} variant="light">{r.priority || '—'}</Badge></Table.Td>
                  <Table.Td><Badge color={statusColor(r.status)} variant="light">{r.status || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.assignedTo || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</Text></Table.Td>
                  <Table.Td><Group gap="xs">
                    <ActionIcon variant="light" color="blue" onClick={() => openEdit(r)}><IconEdit size={14} /></ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon>
                  </Group></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Request' : 'New Maintenance Request'} radius="md">
        <Stack gap="md">
          <TextInput label="Issue Title" value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} required placeholder="e.g. Broken window in Room 5" />
          <TextInput label="Location" value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} placeholder="e.g. Block A, Room 203" />
          <Group grow>
            <Select label="Priority" data={PRIORITIES.map(p => ({ value: p, label: p }))} value={form.priority} onChange={v => setForm((f: any) => ({ ...f, priority: v || 'Medium' }))} />
            <Select label="Status" data={STATUSES.map(s => ({ value: s, label: s }))} value={form.status} onChange={v => setForm((f: any) => ({ ...f, status: v || 'Open' }))} />
          </Group>
          <TextInput label="Assign To" value={form.assignedTo} onChange={e => setForm((f: any) => ({ ...f, assignedTo: e.target.value }))} placeholder="Staff name or team" />
          <Textarea label="Description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe the issue in detail..." />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Submit'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
