'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Modal, TextInput, Select, ActionIcon, Loader, Alert, Textarea, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle } from '@tabler/icons-react';

interface Grievance { id: string; subject: string; category?: string; status?: string; priority?: string; description?: string; filedBy?: string; assignedTo?: string; resolution?: string; createdAt?: string; }
const CATS = ['Academic', 'Facilities', 'Staff Conduct', 'Administrative', 'Fee Related', 'Safety', 'Other'];
const STATUSES = ['Open', 'Under Review', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const EMPTY = { subject: '', category: 'Other', status: 'Open', priority: 'Medium', description: '', filedBy: '', assignedTo: '', resolution: '' };

export default function Page() {
  const [records, setRecords] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Grievance | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/grievances').then(r => r.json());
      setRecords(r.data || r.grievances || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: Grievance) { setEditing(r); setForm({ subject: r.subject, category: r.category || 'Other', status: r.status || 'Open', priority: r.priority || 'Medium', description: r.description || '', filedBy: r.filedBy || '', assignedTo: r.assignedTo || '', resolution: r.resolution || '' }); setModal(true); }

  async function save() {
    if (!form.subject) { notifications.show({ message: 'Subject is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/grievances/${editing.id}` : '/api/grievances';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this grievance?')) return;
    const res = await fetch(`/api/grievances/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const filtered = statusFilter ? records.filter(r => r.status === statusFilter) : records;
  function statusColor(s?: string) { return s === 'Resolved' || s === 'Closed' ? 'green' : s === 'Open' ? 'red' : 'orange'; }
  function priorityColor(p?: string) { return p === 'Urgent' ? 'red' : p === 'High' ? 'orange' : p === 'Medium' ? 'yellow' : 'gray'; }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Grievances</Text><Text size="sm" c="dimmed">Student & staff grievance management</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">File Grievance</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#ef4444">{records.filter(r => r.status === 'Open').length}</Text><Text size="sm" c="dimmed">Open</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{records.filter(r => r.status === 'Under Review').length}</Text><Text size="sm" c="dimmed">Under Review</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{records.filter(r => r.status === 'Resolved' || r.status === 'Closed').length}</Text><Text size="sm" c="dimmed">Resolved</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <Select data={[{ value: '', label: 'All Status' }, ...STATUSES.map(s => ({ value: s, label: s }))]} value={statusFilter} onChange={v => setStatusFilter(v || '')} w={180} radius="md" clearable placeholder="Filter Status" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No grievances found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Subject</Table.Th><Table.Th>Category</Table.Th><Table.Th>Filed By</Table.Th><Table.Th>Priority</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text fw={500}>{r.subject}</Text></Table.Td>
                  <Table.Td><Badge variant="light" color="blue">{r.category || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.filedBy || '—'}</Text></Table.Td>
                  <Table.Td><Badge color={priorityColor(r.priority)} variant="light">{r.priority || '—'}</Badge></Table.Td>
                  <Table.Td><Badge color={statusColor(r.status)} variant="light">{r.status || '—'}</Badge></Table.Td>
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
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Grievance' : 'File Grievance'} radius="md" size="lg">
        <Stack gap="md">
          <TextInput label="Subject" value={form.subject} onChange={e => setForm((f: any) => ({ ...f, subject: e.target.value }))} required placeholder="Brief summary of grievance" />
          <Group grow>
            <Select label="Category" data={CATS.map(c => ({ value: c, label: c }))} value={form.category} onChange={v => setForm((f: any) => ({ ...f, category: v || 'Other' }))} />
            <Select label="Priority" data={PRIORITIES.map(p => ({ value: p, label: p }))} value={form.priority} onChange={v => setForm((f: any) => ({ ...f, priority: v || 'Medium' }))} />
          </Group>
          <Group grow>
            <TextInput label="Filed By" value={form.filedBy} onChange={e => setForm((f: any) => ({ ...f, filedBy: e.target.value }))} placeholder="Complainant name" />
            <TextInput label="Assigned To" value={form.assignedTo} onChange={e => setForm((f: any) => ({ ...f, assignedTo: e.target.value }))} placeholder="Responsible person" />
          </Group>
          <Select label="Status" data={STATUSES.map(s => ({ value: s, label: s }))} value={form.status} onChange={v => setForm((f: any) => ({ ...f, status: v || 'Open' }))} />
          <Textarea label="Description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={4} required placeholder="Detailed description of the issue..." />
          {(form.status === 'Resolved' || form.status === 'Closed') && <Textarea label="Resolution" value={form.resolution} onChange={e => setForm((f: any) => ({ ...f, resolution: e.target.value }))} rows={3} placeholder="How was this resolved..." />}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Submit'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
