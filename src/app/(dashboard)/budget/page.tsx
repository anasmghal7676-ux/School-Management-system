'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Stack, Button, Table, Modal, TextInput, NumberInput, Select, ActionIcon, Loader, Alert, Progress } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconChartBar } from '@tabler/icons-react';

interface BudgetItem { id: string; category: string; allocated: number; spent: number; year?: string; month?: string; description?: string; }
const CATS = ['Salaries', 'Utilities', 'Maintenance', 'Library', 'Laboratory', 'Sports', 'Events', 'Technology', 'Transport', 'Canteen', 'Miscellaneous'];
const EMPTY = { category: 'Miscellaneous', allocated: 0, spent: 0, year: new Date().getFullYear().toString(), description: '' };

export default function Page() {
  const [records, setRecords] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/budget').then(r => r.json());
      setRecords(r.data || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: BudgetItem) { setEditing(r); setForm({ category: r.category, allocated: r.allocated, spent: r.spent, year: r.year || new Date().getFullYear().toString(), description: r.description || '' }); setModal(true); }

  async function save() {
    if (!form.category || !form.allocated) { notifications.show({ message: 'Category and amount are required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/budget/${editing.id}` : '/api/budget';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this budget item?')) return;
    const res = await fetch(`/api/budget/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const totalAllocated = records.reduce((s, r) => s + r.allocated, 0);
  const totalSpent = records.reduce((s, r) => s + r.spent, 0);
  const remaining = totalAllocated - totalSpent;
  const overallPct = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Budget</Text><Text size="sm" c="dimmed">Annual budget allocation and tracking</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Add Budget Line</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">Rs. {totalAllocated.toLocaleString()}</Text><Text size="sm" c="dimmed">Total Allocated</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">Rs. {totalSpent.toLocaleString()}</Text><Text size="sm" c="dimmed">Total Spent</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c={remaining >= 0 ? '#10b981' : '#ef4444'}>Rs. {Math.abs(remaining).toLocaleString()}</Text><Text size="sm" c="dimmed">{remaining >= 0 ? 'Remaining' : 'Overspent'}</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{overallPct}%</Text><Text size="sm" c="dimmed">Utilised</Text></Card>
      </SimpleGrid>
      {totalAllocated > 0 && <Card shadow="xs" radius="md" p="md" mb="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Text size="sm" fw={500} mb="xs">Overall Budget Utilisation</Text>
        <Progress value={overallPct} color={overallPct > 90 ? 'red' : overallPct > 75 ? 'orange' : 'green'} size="lg" radius="xl" />
        <Text size="xs" c="dimmed" mt="xs">{overallPct}% used — Rs. {totalSpent.toLocaleString()} of Rs. {totalAllocated.toLocaleString()}</Text>
      </Card>}
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : records.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No budget items found. Start by adding budget lines.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Category</Table.Th><Table.Th>Year</Table.Th><Table.Th>Allocated</Table.Th><Table.Th>Spent</Table.Th><Table.Th>Remaining</Table.Th><Table.Th>Usage</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {records.map(r => {
                const pct = r.allocated > 0 ? Math.round((r.spent / r.allocated) * 100) : 0;
                const rem = r.allocated - r.spent;
                return (
                  <Table.Tr key={r.id}>
                    <Table.Td><Badge variant="light" color="blue">{r.category}</Badge></Table.Td>
                    <Table.Td><Text size="sm">{r.year || '—'}</Text></Table.Td>
                    <Table.Td><Text fw={500}>Rs. {r.allocated.toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text c="orange">Rs. {r.spent.toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text c={rem >= 0 ? 'green' : 'red'}>Rs. {Math.abs(rem).toLocaleString()}</Text></Table.Td>
                    <Table.Td style={{ minWidth: 120 }}>
                      <Progress value={pct} color={pct > 90 ? 'red' : pct > 75 ? 'orange' : 'green'} size="sm" />
                      <Text size="xs" c="dimmed">{pct}%</Text>
                    </Table.Td>
                    <Table.Td><Group gap="xs">
                      <ActionIcon variant="light" color="blue" onClick={() => openEdit(r)}><IconEdit size={14} /></ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon>
                    </Group></Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Budget Line' : 'Add Budget Line'} radius="md">
        <Stack gap="md">
          <Select label="Category" data={CATS.map(c => ({ value: c, label: c }))} value={form.category} onChange={v => setForm((f: any) => ({ ...f, category: v || 'Miscellaneous' }))} required />
          <TextInput label="Year" value={form.year} onChange={e => setForm((f: any) => ({ ...f, year: e.target.value }))} placeholder="e.g. 2024-25" />
          <Group grow>
            <NumberInput label="Allocated (Rs.)" value={form.allocated} onChange={v => setForm((f: any) => ({ ...f, allocated: Number(v) }))} min={0} />
            <NumberInput label="Already Spent (Rs.)" value={form.spent} onChange={v => setForm((f: any) => ({ ...f, spent: Number(v) }))} min={0} />
          </Group>
          <TextInput label="Description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
