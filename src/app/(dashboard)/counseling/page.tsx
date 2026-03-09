'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Modal, TextInput, Select, ActionIcon, Loader, Alert, Textarea, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconHeart } from '@tabler/icons-react';

interface Session { id: string; studentName?: string; counselor?: string; type?: string; date?: string; status?: string; notes?: string; followUp?: string; student?: { firstName: string; lastName: string }; }
const TYPES = ['Academic', 'Behavioral', 'Career', 'Personal', 'Family', 'Peer Issues'];
const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'Follow-up Needed'];
const EMPTY = { studentId: '', counselor: '', type: 'Academic', date: new Date().toISOString().split('T')[0], status: 'Scheduled', notes: '', followUp: '' };

export default function Page() {
  const [records, setRecords] = useState<Session[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        fetch('/api/counseling').then(r => r.json()),
        fetch('/api/students?limit=100').then(r => r.json()),
      ]);
      setRecords(r.data || r.sessions || []);
      setStudents(s.data || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: Session) { setEditing(r); setForm({ studentId: '', counselor: r.counselor || '', type: r.type || 'Academic', date: r.date || '', status: r.status || 'Scheduled', notes: r.notes || '', followUp: r.followUp || '' }); setModal(true); }

  async function save() {
    if (!form.type || !form.date) { notifications.show({ message: 'Type and date are required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/counseling/${editing.id}` : '/api/counseling';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Session saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this counseling session?')) return;
    const res = await fetch(`/api/counseling/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const upcoming = records.filter(r => r.status === 'Scheduled').length;
  const followUp = records.filter(r => r.status === 'Follow-up Needed').length;

  function statusColor(s?: string) { return s === 'Completed' ? 'green' : s === 'Scheduled' ? 'blue' : s === 'Cancelled' ? 'red' : 'orange'; }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Counseling</Text><Text size="sm" c="dimmed">Student counseling sessions</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Schedule Session</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total Sessions</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{upcoming}</Text><Text size="sm" c="dimmed">Upcoming</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{followUp}</Text><Text size="sm" c="dimmed">Follow-up Needed</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{records.filter(r => r.status === 'Completed').length}</Text><Text size="sm" c="dimmed">Completed</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : records.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="teal" radius="md">No counseling sessions found. Schedule one to get started.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Student</Table.Th><Table.Th>Type</Table.Th><Table.Th>Counselor</Table.Th><Table.Th>Date</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {records.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Group gap="xs"><IconHeart size={14} color="#14b8a6" /><Text fw={500}>{r.student ? `${r.student.firstName} ${r.student.lastName}` : r.studentName || '—'}</Text></Group></Table.Td>
                  <Table.Td><Badge variant="light" color="teal">{r.type || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.counselor || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</Text></Table.Td>
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
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Session' : 'Schedule Counseling Session'} radius="md">
        <Stack gap="md">
          <Select label="Student" data={students.map(s => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))} value={form.studentId} onChange={v => setForm((f: any) => ({ ...f, studentId: v || '' }))} searchable placeholder="Search student..." />
          <Group grow>
            <Select label="Session Type" data={TYPES.map(t => ({ value: t, label: t }))} value={form.type} onChange={v => setForm((f: any) => ({ ...f, type: v || 'Academic' }))} />
            <TextInput label="Date" type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} required />
          </Group>
          <Group grow>
            <TextInput label="Counselor" value={form.counselor} onChange={e => setForm((f: any) => ({ ...f, counselor: e.target.value }))} placeholder="Counselor name" />
            <Select label="Status" data={STATUSES.map(s => ({ value: s, label: s }))} value={form.status} onChange={v => setForm((f: any) => ({ ...f, status: v || 'Scheduled' }))} />
          </Group>
          <Textarea label="Session Notes" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Session notes and observations..." />
          <TextInput label="Follow-up Action" value={form.followUp} onChange={e => setForm((f: any) => ({ ...f, followUp: e.target.value }))} placeholder="Any follow-up required..." />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Schedule'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
