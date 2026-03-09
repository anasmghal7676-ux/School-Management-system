'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Modal, TextInput, Select, ActionIcon, Loader, Alert, Textarea, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconCalendar } from '@tabler/icons-react';

interface Meeting { id: string; title: string; type?: string; date?: string; time?: string; venue?: string; status?: string; agenda?: string; attendees?: string; }
const TYPES = ['Staff', 'Department', 'Board', 'Parent', 'Emergency', 'General'];
const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Postponed'];
const EMPTY = { title: '', type: 'Staff', date: new Date().toISOString().split('T')[0], time: '10:00', venue: '', status: 'Scheduled', agenda: '', attendees: '' };

export default function Page() {
  const [records, setRecords] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/meetings').then(r => r.json());
      setRecords(r.data || r.meetings || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: Meeting) { setEditing(r); setForm({ title: r.title, type: r.type || 'Staff', date: r.date || '', time: r.time || '10:00', venue: r.venue || '', status: r.status || 'Scheduled', agenda: r.agenda || '', attendees: r.attendees || '' }); setModal(true); }

  async function save() {
    if (!form.title || !form.date) { notifications.show({ message: 'Title and date are required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/meetings/${editing.id}` : '/api/meetings';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this meeting?')) return;
    const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const upcoming = records.filter(r => r.status === 'Scheduled').length;
  function statusColor(s?: string) { return s === 'Completed' ? 'green' : s === 'Scheduled' ? 'blue' : s === 'Cancelled' ? 'red' : 'orange'; }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Meetings</Text><Text size="sm" c="dimmed">Staff & admin meeting management</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Schedule Meeting</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{upcoming}</Text><Text size="sm" c="dimmed">Upcoming</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{records.filter(r => r.status === 'Completed').length}</Text><Text size="sm" c="dimmed">Completed</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#ef4444">{records.filter(r => r.status === 'Cancelled').length}</Text><Text size="sm" c="dimmed">Cancelled</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : records.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No meetings scheduled.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Title</Table.Th><Table.Th>Type</Table.Th><Table.Th>Date & Time</Table.Th><Table.Th>Venue</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {records.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Group gap="xs"><IconCalendar size={14} color="#6366f1" /><Text fw={500}>{r.title}</Text></Group></Table.Td>
                  <Table.Td><Badge variant="light" color="indigo">{r.type || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.date ? new Date(r.date).toLocaleDateString() : '—'} {r.time || ''}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.venue || '—'}</Text></Table.Td>
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
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Meeting' : 'Schedule Meeting'} radius="md" size="lg">
        <Stack gap="md">
          <TextInput label="Meeting Title" value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} required placeholder="e.g. Monthly Staff Meeting" />
          <Group grow>
            <Select label="Type" data={TYPES.map(t => ({ value: t, label: t }))} value={form.type} onChange={v => setForm((f: any) => ({ ...f, type: v || 'Staff' }))} />
            <Select label="Status" data={STATUSES.map(s => ({ value: s, label: s }))} value={form.status} onChange={v => setForm((f: any) => ({ ...f, status: v || 'Scheduled' }))} />
          </Group>
          <Group grow>
            <TextInput label="Date" type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} required />
            <TextInput label="Time" type="time" value={form.time} onChange={e => setForm((f: any) => ({ ...f, time: e.target.value }))} />
          </Group>
          <TextInput label="Venue" value={form.venue} onChange={e => setForm((f: any) => ({ ...f, venue: e.target.value }))} placeholder="Conference Room / Hall" />
          <Textarea label="Agenda" value={form.agenda} onChange={e => setForm((f: any) => ({ ...f, agenda: e.target.value }))} rows={4} placeholder="Meeting agenda and discussion points..." />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Schedule'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
