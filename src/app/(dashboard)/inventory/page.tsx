'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Modal, TextInput, NumberInput, Select, ActionIcon, Loader, Alert, Textarea, RingProgress } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconBox, IconSearch } from '@tabler/icons-react';

interface InventoryItem { id: string; name: string; category?: string; quantity: number; unit?: string; minStock?: number; location?: string; description?: string; }
const CATS = ['Stationery', 'Furniture', 'Electronics', 'Lab Equipment', 'Sports', 'Cleaning', 'Kitchen', 'Books', 'Other'];
const EMPTY = { name: '', category: 'Stationery', quantity: 0, unit: 'Pcs', minStock: 10, location: '', description: '' };

export default function Page() {
  const [records, setRecords] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/inventory').then(r => r.json());
      setRecords(r.data || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: InventoryItem) { setEditing(r); setForm({ name: r.name, category: r.category || 'Other', quantity: r.quantity, unit: r.unit || 'Pcs', minStock: r.minStock || 10, location: r.location || '', description: r.description || '' }); setModal(true); }

  async function save() {
    if (!form.name) { notifications.show({ message: 'Item name is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/inventory/${editing.id}` : '/api/inventory';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const filtered = records.filter(r => {
    if (catFilter && r.category !== catFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const lowStock = records.filter(r => r.minStock && r.quantity < r.minStock).length;
  const totalItems = records.reduce((s, r) => s + r.quantity, 0);

  function stockColor(r: InventoryItem) {
    if (!r.minStock) return 'gray';
    if (r.quantity === 0) return 'red';
    if (r.quantity < r.minStock) return 'orange';
    return 'green';
  }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Inventory</Text><Text size="sm" c="dimmed">School inventory and stock management</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Add Item</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Item Types</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{totalItems}</Text><Text size="sm" c="dimmed">Total Units</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">{lowStock}</Text><Text size="sm" c="dimmed">Low Stock Alerts</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#ef4444">{records.filter(r => r.quantity === 0).length}</Text><Text size="sm" c="dimmed">Out of Stock</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md" wrap="wrap">
          <TextInput placeholder="Search items..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} w={220} radius="md" />
          <Select data={[{ value: '', label: 'All Categories' }, ...CATS.map(c => ({ value: c, label: c }))]} value={catFilter} onChange={v => setCatFilter(v || '')} w={180} radius="md" clearable placeholder="Category" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No inventory items found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Item</Table.Th><Table.Th>Category</Table.Th><Table.Th>Qty</Table.Th><Table.Th>Unit</Table.Th><Table.Th>Min Stock</Table.Th><Table.Th>Location</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Group gap="xs"><IconBox size={14} color="#6366f1" /><Text fw={500}>{r.name}</Text></Group></Table.Td>
                  <Table.Td><Badge variant="light" color="indigo">{r.category || '—'}</Badge></Table.Td>
                  <Table.Td><Text fw={600} c={stockColor(r)}>{r.quantity}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.unit || 'Pcs'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{r.minStock || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.location || '—'}</Text></Table.Td>
                  <Table.Td><Badge color={stockColor(r)} variant="light">{r.quantity === 0 ? 'Out of Stock' : r.minStock && r.quantity < r.minStock ? 'Low Stock' : 'In Stock'}</Badge></Table.Td>
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
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Item' : 'Add Inventory Item'} radius="md">
        <Stack gap="md">
          <TextInput label="Item Name" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
          <Group grow>
            <Select label="Category" data={CATS.map(c => ({ value: c, label: c }))} value={form.category} onChange={v => setForm((f: any) => ({ ...f, category: v || 'Other' }))} />
            <TextInput label="Unit" value={form.unit} onChange={e => setForm((f: any) => ({ ...f, unit: e.target.value }))} placeholder="Pcs, Kg, Ltrs..." />
          </Group>
          <Group grow>
            <NumberInput label="Quantity" value={form.quantity} onChange={v => setForm((f: any) => ({ ...f, quantity: Number(v) }))} min={0} />
            <NumberInput label="Min Stock Alert" value={form.minStock} onChange={v => setForm((f: any) => ({ ...f, minStock: Number(v) }))} min={0} />
          </Group>
          <TextInput label="Storage Location" value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} placeholder="e.g. Storeroom A, Shelf 3" />
          <Textarea label="Description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
