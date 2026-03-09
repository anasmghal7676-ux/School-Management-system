'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Stack, Button, Table, Select, ActionIcon, Loader, Alert, TextInput, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconRefresh, IconAlertCircle, IconSearch, IconDownload, IconFileText, IconEdit } from '@tabler/icons-react';

interface Document { id: string; title: string; type?: string; uploadedBy?: string; createdAt: string; url?: string; student?: { firstName: string; lastName: string }; staff?: { firstName: string; lastName: string }; }
const EMPTY = { title: '', type: '', entityType: 'student', url: '' };

export default function Page() {
  const [records, setRecords] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/documents').then(r => r.json());
      setRecords(r.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title) { notifications.show({ message: 'Title is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ title: 'Uploaded', message: 'Document saved', color: 'green' }); setModal(false); setForm(EMPTY); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this document?')) return;
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const docTypes = ['Admission Form', 'Birth Certificate', 'Leaving Certificate', 'Medical', 'ID Card', 'Report Card', 'Other'];
  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return (!q || r.title.toLowerCase().includes(q)) && (!typeFilter || r.type === typeFilter);
  });

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Documents</Text>
          <Text size="sm" c="dimmed">Student & staff document management</Text>
        </Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setModal(true)} radius="md">Upload Document</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total Documents</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{[...new Set(records.map(r => r.type))].length}</Text><Text size="sm" c="dimmed">Document Types</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{records.filter(r => { const d = new Date(r.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length}</Text><Text size="sm" c="dimmed">This Month</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <TextInput placeholder="Search documents..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} w={250} radius="md" />
          <Select data={[{ value: '', label: 'All Types' }, ...docTypes.map(t => ({ value: t, label: t }))]} value={typeFilter} onChange={v => setTypeFilter(v || '')} w={180} radius="md" clearable placeholder="Filter Type" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No documents found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Title</Table.Th><Table.Th>Type</Table.Th><Table.Th>Owner</Table.Th><Table.Th>Date</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Group gap="xs"><IconFileText size={16} color="#6366f1" /><Text fw={500}>{r.title}</Text></Group></Table.Td>
                  <Table.Td><Badge variant="light" color="blue">{r.type || 'General'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.student ? `${r.student.firstName} ${r.student.lastName}` : r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : r.uploadedBy || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{new Date(r.createdAt).toLocaleDateString()}</Text></Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {r.url && <ActionIcon variant="light" color="green" component="a" href={r.url} target="_blank"><IconDownload size={14} /></ActionIcon>}
                      <ActionIcon variant="light" color="red" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      <Modal opened={modal} onClose={() => setModal(false)} title="Upload Document" radius="md">
        <Stack gap="md">
          <TextInput label="Document Title" placeholder="e.g. Birth Certificate" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <Select label="Document Type" data={docTypes.map(t => ({ value: t, label: t }))} value={form.type} onChange={v => setForm(f => ({ ...f, type: v || '' }))} placeholder="Select type" />
          <Select label="Entity Type" data={[{ value: 'student', label: 'Student' }, { value: 'staff', label: 'Staff' }, { value: 'general', label: 'General' }]} value={form.entityType} onChange={v => setForm(f => ({ ...f, entityType: v || 'student' }))} />
          <TextInput label="Document URL (optional)" placeholder="https://..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
