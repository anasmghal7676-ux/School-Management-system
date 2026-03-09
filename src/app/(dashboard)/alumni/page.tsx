'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Select, ActionIcon, Loader, Alert, Modal, Stack, TextInput, Avatar } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconSearch } from '@tabler/icons-react';

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', graduationYear: '', currentJob: '', city: '' };

export default function Page() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/alumni').then(r => r.json());
      setRecords(r.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: any) { setEditing(r); setForm({ firstName: r.firstName || '', lastName: r.lastName || '', email: r.email || '', phone: r.phone || '', graduationYear: r.graduationYear || '', currentJob: r.currentJob || '', city: r.city || '' }); setModal(true); }

  async function save() {
    if (!form.firstName || !form.lastName) { notifications.show({ message: 'Name is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/alumni/${editing.id}` : '/api/alumni';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ title: editing ? 'Updated' : 'Added', message: 'Alumni record saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete alumni record?')) return;
    const res = await fetch(`/api/alumni/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const name = `${r.firstName} ${r.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (r.email || '').toLowerCase().includes(search.toLowerCase());
  });

  const years = [...new Set(records.map((r: any) => r.graduationYear).filter(Boolean))];

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Alumni</Text><Text size="sm" c="dimmed">Former student database</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Add Alumni</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total Alumni</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{years.length}</Text><Text size="sm" c="dimmed">Graduation Years</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{records.filter((r: any) => r.currentJob).length}</Text><Text size="sm" c="dimmed">Employed</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <TextInput placeholder="Search by name or email..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} w={280} radius="md" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No alumni records found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Name</Table.Th><Table.Th>Email</Table.Th><Table.Th>Grad Year</Table.Th><Table.Th>Current Job</Table.Th><Table.Th>City</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map((r: any) => (
                <Table.Tr key={r.id}>
                  <Table.Td><Group gap="xs"><Avatar size="sm" radius="xl" color="blue">{r.firstName?.[0]}</Avatar><Text fw={500}>{r.firstName} {r.lastName}</Text></Group></Table.Td>
                  <Table.Td><Text size="sm">{r.email || '—'}</Text></Table.Td>
                  <Table.Td><Badge variant="light" color="violet">{r.graduationYear || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.currentJob || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{r.city || '—'}</Text></Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="light" color="blue" onClick={() => openEdit(r)}><IconEdit size={14} /></ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Alumni' : 'Add Alumni'} radius="md">
        <Stack gap="md">
          <Group grow><TextInput label="First Name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required /><TextInput label="Last Name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required /></Group>
          <TextInput label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <TextInput label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Group grow><TextInput label="Graduation Year" placeholder="e.g. 2020" value={form.graduationYear} onChange={e => setForm(f => ({ ...f, graduationYear: e.target.value }))} /><TextInput label="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></Group>
          <TextInput label="Current Job / Company" value={form.currentJob} onChange={e => setForm(f => ({ ...f, currentJob: e.target.value }))} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
