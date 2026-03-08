'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button, Modal,
  Table, Card, ActionIcon, Tooltip, Loader, Center, Stack,
  SimpleGrid, Grid, NumberInput,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconPackage, IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

const CATEGORIES = ['Stationery', 'Furniture', 'Electronics', 'Sports', 'Lab Equipment', 'Books', 'Cleaning', 'Kitchen', 'Medical', 'Other'];
const EMPTY_FORM = { name: '', category: 'Stationery', quantity: 0, minQuantity: 5, unit: 'pieces', purchasePrice: 0, vendor: '', location: '' };

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [catFilter, setCatFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '200' });
      if (debouncedSearch) p.set('search', debouncedSearch);
      if (catFilter) p.set('category', catFilter);
      const res = await fetch(`/api/inventory?${p}`);
      const data = await res.json();
      setItems(data.data || []);
      setTotal(data.total || (data.data || []).length);
    } catch { notifications.show({ color: 'red', message: 'Failed to load inventory' }); }
    finally { setLoading(false); }
  }, [debouncedSearch, catFilter]);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return notifications.show({ color: 'red', message: 'Item name required' });
    setSaving(true);
    try {
      const url = editId ? `/api/inventory/${editId}` : '/api/inventory';
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, schoolId: 'school_main' }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Item added' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  const lowStock = items.filter(i => (i.quantity || 0) <= (i.minQuantity || 5));
  const totalValue = items.reduce((s, i) => s + ((i.quantity || 0) * (i.purchasePrice || 0)), 0);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Inventory</Text><Text size="sm" c="dimmed">Track school assets and supplies</Text></Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Add Item</Button>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[{ label: 'Total Items', value: total, color: '#3b82f6' }, { label: 'Low Stock', value: lowStock.length, color: '#ef4444' }, { label: 'Categories', value: new Set(items.map(i => i.category)).size, color: '#8b5cf6' }, { label: 'Total Value', value: `Rs ${totalValue.toLocaleString()}`, color: '#10b981' }].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>
      {lowStock.length > 0 && (
        <Card shadow="xs" radius="md" p="sm" mb="md" style={{ border: '1px solid #fecaca', background: '#fff5f5' }}>
          <Group gap={8}><IconAlertTriangle size={16} color="#ef4444" /><Text size="sm" fw={500} c="red">{lowStock.length} items running low: {lowStock.slice(0, 3).map(i => i.name).join(', ')}{lowStock.length > 3 ? '...' : ''}</Text></Group>
        </Card>
      )}
      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <Select data={[{ value: '', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]} value={catFilter} onChange={v => setCatFilter(v || '')} w={180} radius="md" clearable />
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Stock</Table.Th>
                <Table.Th>Unit</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Location</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map(item => {
                const isLow = (item.quantity || 0) <= (item.minQuantity || 5);
                return (
                  <Table.Tr key={item.id}>
                    <Table.Td><Group gap={8}><Box style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><IconPackage size={12} /></Box><Text size="sm" fw={500}>{item.name}</Text></Group></Table.Td>
                    <Table.Td><Badge variant="light" size="sm">{item.category}</Badge></Table.Td>
                    <Table.Td><Text size="sm" fw={600} c={isLow ? 'red' : 'inherit'}>{item.quantity ?? 0}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{item.unit || 'pieces'}</Text></Table.Td>
                    <Table.Td><Text size="sm">Rs {(item.purchasePrice || 0).toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{item.location || '—'}</Text></Table.Td>
                    <Table.Td><Badge color={isLow ? 'red' : 'green'} variant="light" size="sm">{isLow ? 'Low Stock' : 'In Stock'}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(item.id); setForm({ name: item.name, category: item.category || 'Stationery', quantity: item.quantity || 0, minQuantity: item.minQuantity || 5, unit: item.unit || 'pieces', purchasePrice: item.purchasePrice || 0, vendor: item.vendor || '', location: item.location || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(item.id); openDelete(); }}><IconTrash size={14} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {items.length === 0 && <Table.Tr><Table.Td colSpan={8}><Center py="xl"><Text c="dimmed">No inventory items</Text></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Item' : 'Add Item'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={8}><TextInput label="Item Name" value={form.name} onChange={e => f('name', e.target.value)} required /></Grid.Col>
            <Grid.Col span={4}><Select label="Category" data={CATEGORIES.map(c => ({ value: c, label: c }))} value={form.category} onChange={v => f('category', v || 'Stationery')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={4}><NumberInput label="Quantity" value={form.quantity} onChange={v => f('quantity', Number(v) || 0)} min={0} /></Grid.Col>
            <Grid.Col span={4}><NumberInput label="Min Stock Alert" value={form.minQuantity} onChange={v => f('minQuantity', Number(v) || 0)} min={0} /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Unit" value={form.unit} onChange={e => f('unit', e.target.value)} placeholder="pieces" /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><NumberInput label="Purchase Price" value={form.purchasePrice} onChange={v => f('purchasePrice', Number(v) || 0)} min={0} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Vendor" value={form.vendor} onChange={e => f('vendor', e.target.value)} /></Grid.Col>
          </Grid>
          <TextInput label="Storage Location" value={form.location} onChange={e => f('location', e.target.value)} />
          <Group justify="flex-end" mt="sm"><Button variant="default" onClick={closeForm}>Cancel</Button><Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Add'}</Button></Group>
        </Stack>
      </Modal>
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Item</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this inventory item?</Text>
        <Group justify="flex-end"><Button variant="default" onClick={closeDelete}>Cancel</Button><Button color="red" loading={saving} onClick={async () => { setSaving(true); try { await fetch(`/api/inventory/${deleteId}`, { method: 'DELETE' }); notifications.show({ color: 'green', message: 'Deleted' }); closeDelete(); load(); } catch {} finally { setSaving(false); } }}>Delete</Button></Group>
      </Modal>
    </Box>
  );
}
