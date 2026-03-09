'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Stack, Button, Table, Modal, TextInput, NumberInput, Select, ActionIcon, Loader, Alert, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconApple } from '@tabler/icons-react';

interface MenuItem { id: string; name: string; price: number; category?: string; available?: boolean; description?: string; }
const CATS = ['Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Desserts'];
const EMPTY = { name: '', price: 0, category: 'Lunch', available: true, description: '' };

export default function Page() {
  const [records, setRecords] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/canteen').then(r => r.json());
      setRecords(r.data || r.items || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: MenuItem) { setEditing(r); setForm({ name: r.name, price: r.price, category: r.category || 'Lunch', available: r.available !== false, description: r.description || '' }); setModal(true); }

  async function save() {
    if (!form.name) { notifications.show({ message: 'Name is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/canteen/${editing.id}` : '/api/canteen';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Remove this item?')) return;
    const res = await fetch(`/api/canteen/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Removed', color: 'green' }); load(); }
  }

  const filtered = catFilter ? records.filter(r => r.category === catFilter) : records;
  const available = records.filter(r => r.available !== false).length;
  const revenue = records.reduce((s, r) => s + r.price, 0);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Canteen Menu</Text><Text size="sm" c="dimmed">Manage canteen items and pricing</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Add Item</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total Items</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{available}</Text><Text size="sm" c="dimmed">Available</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{records.length - available}</Text><Text size="sm" c="dimmed">Unavailable</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">Rs. {revenue.toLocaleString()}</Text><Text size="sm" c="dimmed">Total Value</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <Select data={[{ value: '', label: 'All Categories' }, ...CATS.map(c => ({ value: c, label: c }))]} value={catFilter} onChange={v => setCatFilter(v || '')} w={200} radius="md" clearable placeholder="Filter Category" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No menu items found. Add items to the canteen menu.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Item</Table.Th><Table.Th>Category</Table.Th><Table.Th>Price</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Group gap="xs"><IconApple size={16} color="#f59e0b" /><Text fw={500}>{r.name}</Text></Group></Table.Td>
                  <Table.Td><Badge variant="light" color="orange">{r.category || '—'}</Badge></Table.Td>
                  <Table.Td><Text fw={600} c="green">Rs. {r.price.toLocaleString()}</Text></Table.Td>
                  <Table.Td><Badge color={r.available !== false ? 'green' : 'red'} variant="light">{r.available !== false ? 'Available' : 'Unavailable'}</Badge></Table.Td>
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
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Item' : 'Add Menu Item'} radius="md">
        <Stack gap="md">
          <TextInput label="Item Name" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required placeholder="e.g. Chicken Sandwich" />
          <Select label="Category" data={CATS.map(c => ({ value: c, label: c }))} value={form.category} onChange={v => setForm((f: any) => ({ ...f, category: v || 'Lunch' }))} />
          <NumberInput label="Price (Rs.)" value={form.price} onChange={v => setForm((f: any) => ({ ...f, price: Number(v) }))} min={0} />
          <Select label="Status" data={[{ value: 'true', label: 'Available' }, { value: 'false', label: 'Unavailable' }]} value={String(form.available)} onChange={v => setForm((f: any) => ({ ...f, available: v === 'true' }))} />
          <Textarea label="Description (optional)" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
