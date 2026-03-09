'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Modal, TextInput, Select, ActionIcon, Loader, Alert, Textarea, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconSearch } from '@tabler/icons-react';

interface LostItem { id: string; itemName: string; description?: string; foundLocation?: string; status?: string; foundBy?: string; claimedBy?: string; date?: string; }
const STATUSES = ['Found', 'Claimed', 'Discarded', 'Returned'];
const EMPTY = { itemName: '', description: '', foundLocation: '', status: 'Found', foundBy: '', claimedBy: '', date: new Date().toISOString().split('T')[0] };

export default function Page() {
  const [records, setRecords] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<LostItem | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/lost-found').then(r => r.json());
      setRecords(r.data || r.items || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: LostItem) { setEditing(r); setForm({ itemName: r.itemName, description: r.description || '', foundLocation: r.foundLocation || '', status: r.status || 'Found', foundBy: r.foundBy || '', claimedBy: r.claimedBy || '', date: r.date || '' }); setModal(true); }

  async function save() {
    if (!form.itemName) { notifications.show({ message: 'Item name is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/lost-found/${editing.id}` : '/api/lost-found';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Remove this item?')) return;
    const res = await fetch(`/api/lost-found/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Removed', color: 'green' }); load(); }
  }

  const filtered = records.filter(r => !search || r.itemName.toLowerCase().includes(search.toLowerCase()));
  const unclaimed = records.filter(r => r.status === 'Found').length;

  function statusColor(s?: string) { return s === 'Found' ? 'yellow' : s === 'Claimed' ? 'green' : s === 'Returned' ? 'blue' : 'gray'; }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Lost & Found</Text><Text size="sm" c="dimmed">Lost & found item registry</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Log Item</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total Items</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{unclaimed}</Text><Text size="sm" c="dimmed">Unclaimed</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{records.filter(r => r.status === 'Claimed' || r.status === 'Returned').length}</Text><Text size="sm" c="dimmed">Returned</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{records.filter(r => r.status === 'Discarded').length}</Text><Text size="sm" c="dimmed">Discarded</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <TextInput placeholder="Search items..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} w={250} radius="md" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="yellow" radius="md">No items in lost & found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Item</Table.Th><Table.Th>Found At</Table.Th><Table.Th>Found By</Table.Th><Table.Th>Date</Table.Th><Table.Th>Status</Table.Th><Table.Th>Claimed By</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text fw={500}>{r.itemName}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.foundLocation || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.foundBy || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</Text></Table.Td>
                  <Table.Td><Badge color={statusColor(r.status)} variant="light">{r.status || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{r.claimedBy || '—'}</Text></Table.Td>
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
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Item' : 'Log Found Item'} radius="md">
        <Stack gap="md">
          <TextInput label="Item Name" value={form.itemName} onChange={e => setForm((f: any) => ({ ...f, itemName: e.target.value }))} required placeholder="Describe the item" />
          <TextInput label="Found Location" value={form.foundLocation} onChange={e => setForm((f: any) => ({ ...f, foundLocation: e.target.value }))} placeholder="e.g. Ground floor corridor" />
          <Group grow>
            <TextInput label="Found By" value={form.foundBy} onChange={e => setForm((f: any) => ({ ...f, foundBy: e.target.value }))} placeholder="Who found it" />
            <TextInput label="Date Found" type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} />
          </Group>
          <Select label="Status" data={STATUSES.map(s => ({ value: s, label: s }))} value={form.status} onChange={v => setForm((f: any) => ({ ...f, status: v || 'Found' }))} />
          {(form.status === 'Claimed' || form.status === 'Returned') && (
            <TextInput label="Claimed By" value={form.claimedBy} onChange={e => setForm((f: any) => ({ ...f, claimedBy: e.target.value }))} placeholder="Name of person who claimed it" />
          )}
          <Textarea label="Description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Additional details..." />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Log Item'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
