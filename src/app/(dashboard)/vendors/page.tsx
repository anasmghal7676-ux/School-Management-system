'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Stack, Button, Table, Modal, TextInput, Select, ActionIcon, Loader, Alert, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconBriefcase, IconSearch } from '@tabler/icons-react';

interface Vendor { id: string; name: string; contactPerson?: string; phone?: string; email?: string; category?: string; status?: string; address?: string; }
const CATS = ['Stationery', 'Furniture', 'Electronics', 'Canteen', 'Maintenance', 'Uniforms', 'Books', 'Other'];
const EMPTY = { name: '', contactPerson: '', phone: '', email: '', category: 'Other', status: 'Active', address: '' };

export default function Page() {
  const [records, setRecords] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/vendors').then(r => r.json());
      setRecords(r.data || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: Vendor) { setEditing(r); setForm({ name: r.name, contactPerson: r.contactPerson || '', phone: r.phone || '', email: r.email || '', category: r.category || 'Other', status: r.status || 'Active', address: r.address || '' }); setModal(true); }

  async function save() {
    if (!form.name) { notifications.show({ message: 'Vendor name is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/vendors/${editing.id}` : '/api/vendors';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this vendor?')) return;
    const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const filtered = records.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.contactPerson || '').toLowerCase().includes(search.toLowerCase()));
  const active = records.filter(r => r.status !== 'Inactive').length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Vendors</Text><Text size="sm" c="dimmed">Supplier and vendor management</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Add Vendor</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total Vendors</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{active}</Text><Text size="sm" c="dimmed">Active</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{[...new Set(records.map(r => r.category))].length}</Text><Text size="sm" c="dimmed">Categories</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <TextInput placeholder="Search vendors..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} w={250} radius="md" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No vendors found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Vendor</Table.Th><Table.Th>Contact</Table.Th><Table.Th>Phone</Table.Th><Table.Th>Category</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Group gap="xs"><IconBriefcase size={14} color="#6366f1" /><Text fw={500}>{r.name}</Text></Group></Table.Td>
                  <Table.Td><Text size="sm">{r.contactPerson || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.phone || '—'}</Text></Table.Td>
                  <Table.Td><Badge variant="light" color="blue">{r.category || '—'}</Badge></Table.Td>
                  <Table.Td><Badge color={r.status !== 'Inactive' ? 'green' : 'red'} variant="light">{r.status || 'Active'}</Badge></Table.Td>
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
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Vendor' : 'Add Vendor'} radius="md" size="lg">
        <Stack gap="md">
          <TextInput label="Vendor Name" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
          <Group grow>
            <TextInput label="Contact Person" value={form.contactPerson} onChange={e => setForm((f: any) => ({ ...f, contactPerson: e.target.value }))} />
            <TextInput label="Phone" value={form.phone} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
          </Group>
          <Group grow>
            <TextInput label="Email" type="email" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} />
            <Select label="Category" data={CATS.map(c => ({ value: c, label: c }))} value={form.category} onChange={v => setForm((f: any) => ({ ...f, category: v || 'Other' }))} />
          </Group>
          <Select label="Status" data={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} value={form.status} onChange={v => setForm((f: any) => ({ ...f, status: v || 'Active' }))} />
          <Textarea label="Address" value={form.address} onChange={e => setForm((f: any) => ({ ...f, address: e.target.value }))} rows={2} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
