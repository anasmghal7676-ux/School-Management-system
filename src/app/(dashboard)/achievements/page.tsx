'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Modal, TextInput, Select, ActionIcon, Loader, Alert, Textarea, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconTrophy, IconSearch } from '@tabler/icons-react';

interface Achievement { id: string; title: string; category?: string; level?: string; date?: string; description?: string; student?: { firstName: string; lastName: string }; staff?: { firstName: string; lastName: string }; entityType?: string; }
const CATS = ['Academic', 'Sports', 'Arts', 'Science', 'Cultural', 'Leadership', 'Community Service', 'Other'];
const LEVELS = ['School', 'District', 'Regional', 'National', 'International'];
const EMPTY = { title: '', category: 'Academic', level: 'School', date: new Date().toISOString().split('T')[0], description: '', entityType: 'student', entityId: '' };

export default function Page() {
  const [records, setRecords] = useState<Achievement[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        fetch('/api/achievements').then(r => r.json()),
        fetch('/api/students?limit=200').then(r => r.json()),
      ]);
      setRecords(r.data || []);
      setStudents(s.data || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title) { notifications.show({ message: 'Title is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/achievements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Achievement recorded!', color: 'green' }); setModal(false); setForm(EMPTY); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this achievement?')) return;
    const res = await fetch(`/api/achievements/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const filtered = records.filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()));

  function levelColor(l?: string) { return l === 'International' ? 'red' : l === 'National' ? 'orange' : l === 'Regional' ? 'yellow' : l === 'District' ? 'teal' : 'blue'; }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Achievements</Text><Text size="sm" c="dimmed">Student & staff achievements</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setModal(true)} radius="md">Record Achievement</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{records.filter(r => r.level === 'National' || r.level === 'International').length}</Text><Text size="sm" c="dimmed">National/Intl</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{records.filter(r => r.category === 'Academic').length}</Text><Text size="sm" c="dimmed">Academic</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{records.filter(r => r.category === 'Sports').length}</Text><Text size="sm" c="dimmed">Sports</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <TextInput placeholder="Search achievements..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} w={250} radius="md" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="yellow" radius="md">No achievements found. Start recording your students' achievements!</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Title</Table.Th><Table.Th>Category</Table.Th><Table.Th>Level</Table.Th><Table.Th>Achiever</Table.Th><Table.Th>Date</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Group gap="xs"><IconTrophy size={14} color="#f59e0b" /><Text fw={500}>{r.title}</Text></Group></Table.Td>
                  <Table.Td><Badge variant="light" color="blue">{r.category || '—'}</Badge></Table.Td>
                  <Table.Td><Badge color={levelColor(r.level)} variant="light">{r.level || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.student ? `${r.student.firstName} ${r.student.lastName}` : r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</Text></Table.Td>
                  <Table.Td><ActionIcon variant="light" color="red" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      <Modal opened={modal} onClose={() => setModal(false)} title="Record Achievement" radius="md">
        <Stack gap="md">
          <TextInput label="Achievement Title" value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} required placeholder="e.g. 1st place in Regional Science Fair" />
          <Group grow>
            <Select label="Category" data={CATS.map(c => ({ value: c, label: c }))} value={form.category} onChange={v => setForm((f: any) => ({ ...f, category: v || 'Academic' }))} />
            <Select label="Level" data={LEVELS.map(l => ({ value: l, label: l }))} value={form.level} onChange={v => setForm((f: any) => ({ ...f, level: v || 'School' }))} />
          </Group>
          <Group grow>
            <Select label="Entity Type" data={[{ value: 'student', label: 'Student' }, { value: 'staff', label: 'Staff' }, { value: 'team', label: 'Team' }]} value={form.entityType} onChange={v => setForm((f: any) => ({ ...f, entityType: v || 'student' }))} />
            <TextInput label="Date" type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} />
          </Group>
          {form.entityType === 'student' && <Select label="Student" data={students.map(s => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))} value={form.entityId} onChange={v => setForm((f: any) => ({ ...f, entityId: v || '' }))} searchable placeholder="Select student..." />}
          <Textarea label="Description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Details about the achievement..." />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Record</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
