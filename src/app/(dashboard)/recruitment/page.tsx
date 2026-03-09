'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Modal, TextInput, Select, ActionIcon, Loader, Alert, Textarea, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconUserPlus, IconSearch } from '@tabler/icons-react';

interface Job { id: string; title: string; department?: string; positions?: number; status?: string; deadline?: string; applicants?: number; description?: string; }
const STATUSES = ['Open', 'Closed', 'Draft', 'On Hold'];
const EMPTY = { title: '', department: '', positions: 1, status: 'Open', deadline: '', description: '' };

export default function Page() {
  const [records, setRecords] = useState<Job[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [r, d] = await Promise.all([
        fetch('/api/recruitment').then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
      ]);
      setRecords(r.data || r.jobs || []);
      setDepts(d.data || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: Job) { setEditing(r); setForm({ title: r.title, department: r.department || '', positions: r.positions || 1, status: r.status || 'Open', deadline: r.deadline || '', description: r.description || '' }); setModal(true); }

  async function save() {
    if (!form.title) { notifications.show({ message: 'Job title is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/recruitment/${editing.id}` : '/api/recruitment';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this job posting?')) return;
    const res = await fetch(`/api/recruitment/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const filtered = records.filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()));
  const open = records.filter(r => r.status === 'Open').length;

  function statusColor(s?: string) { return s === 'Open' ? 'green' : s === 'Closed' ? 'red' : s === 'Draft' ? 'gray' : 'yellow'; }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Recruitment</Text><Text size="sm" c="dimmed">Staff hiring & job postings</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Post Job</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total Postings</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{open}</Text><Text size="sm" c="dimmed">Open Positions</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{records.reduce((s, r) => s + (r.applicants || 0), 0)}</Text><Text size="sm" c="dimmed">Total Applicants</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{records.reduce((s, r) => s + (r.positions || 0), 0)}</Text><Text size="sm" c="dimmed">Total Vacancies</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <TextInput placeholder="Search job title..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} w={250} radius="md" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No job postings found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Position</Table.Th><Table.Th>Department</Table.Th><Table.Th>Vacancies</Table.Th><Table.Th>Applicants</Table.Th><Table.Th>Deadline</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Group gap="xs"><IconUserPlus size={14} color="#3b82f6" /><Text fw={500}>{r.title}</Text></Group></Table.Td>
                  <Table.Td><Badge variant="light" color="blue">{r.department || '—'}</Badge></Table.Td>
                  <Table.Td><Text fw={500}>{r.positions || 1}</Text></Table.Td>
                  <Table.Td><Badge variant="outline">{r.applicants || 0}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{r.deadline ? new Date(r.deadline).toLocaleDateString() : '—'}</Text></Table.Td>
                  <Table.Td><Badge color={statusColor(r.status)} variant="light">{r.status || 'Open'}</Badge></Table.Td>
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
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Job Posting' : 'Post New Job'} radius="md" size="lg">
        <Stack gap="md">
          <TextInput label="Job Title" value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} required placeholder="e.g. Senior Math Teacher" />
          <Group grow>
            <Select label="Department" data={[{ value: '', label: 'Not specified' }, ...depts.map(d => ({ value: d.name || d.id, label: d.name }))]} value={form.department} onChange={v => setForm((f: any) => ({ ...f, department: v || '' }))} searchable />
            <NumberInput label="Vacancies" value={form.positions} onChange={v => setForm((f: any) => ({ ...f, positions: Number(v) }))} min={1} />
          </Group>
          <Group grow>
            <Select label="Status" data={STATUSES.map(s => ({ value: s, label: s }))} value={form.status} onChange={v => setForm((f: any) => ({ ...f, status: v || 'Open' }))} />
            <TextInput label="Application Deadline" type="date" value={form.deadline} onChange={e => setForm((f: any) => ({ ...f, deadline: e.target.value }))} />
          </Group>
          <Textarea label="Job Description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe responsibilities, qualifications, etc." />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Post Job'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
