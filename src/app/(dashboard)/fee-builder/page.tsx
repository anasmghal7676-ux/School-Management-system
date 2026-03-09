'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Stack, Button, Table, Modal, TextInput, Select, NumberInput, ActionIcon, Loader, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconCurrencyDollar } from '@tabler/icons-react';

interface FeeStructure { id: string; amount: number; dueDate?: string; class?: { name: string }; feeType?: { name: string }; classId: string; feeTypeId: string; }
interface Class { id: string; name: string; }
interface FeeType { id: string; name: string; }
const EMPTY = { classId: '', feeTypeId: '', amount: 0, dueDate: '' };

export default function Page() {
  const [records, setRecords] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [classFilter, setClassFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [s, c, ft] = await Promise.all([
        fetch('/api/fees/structure' + (classFilter ? `?classId=${classFilter}` : '')).then(r => r.json()),
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/fee-types').then(r => r.json()),
      ]);
      setRecords(s.data || []);
      setClasses(c.data || []);
      setFeeTypes(ft.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [classFilter]);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: FeeStructure) { setEditing(r); setForm({ classId: r.classId, feeTypeId: r.feeTypeId, amount: r.amount, dueDate: r.dueDate || '' }); setModal(true); }

  async function save() {
    if (!form.classId || !form.feeTypeId || !form.amount) { notifications.show({ title: 'Validation', message: 'Class, Fee Type and Amount are required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/fees/structure/${editing.id}` : '/api/fees/structure';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ title: editing ? 'Updated' : 'Created', message: 'Fee structure saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this fee structure?')) return;
    const res = await fetch(`/api/fees/structure/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
    else notifications.show({ title: 'Error', message: data.error, color: 'red' });
  }

  const total = records.reduce((s, r) => s + r.amount, 0);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Fee Builder</Text>
          <Text size="sm" c="dimmed">Define fee structures per class and fee type</Text>
        </Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Add Structure</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Total Structures</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{classes.length}</Text><Text size="sm" c="dimmed">Classes Configured</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">Rs. {total.toLocaleString()}</Text><Text size="sm" c="dimmed">Total Fee Value</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <Select data={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]} value={classFilter} onChange={v => setClassFilter(v || '')} placeholder="Filter by Class" w={200} radius="md" clearable />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : records.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No fee structures found. Add one to get started.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Class</Table.Th><Table.Th>Fee Type</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Due Date</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {records.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Badge variant="light" color="blue">{r.class?.name || '—'}</Badge></Table.Td>
                  <Table.Td><Text fw={500}>{r.feeType?.name || '—'}</Text></Table.Td>
                  <Table.Td><Text fw={600} c="green">Rs. {r.amount.toLocaleString()}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{r.dueDate || '—'}</Text></Table.Td>
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
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Fee Structure' : 'Add Fee Structure'} radius="md">
        <Stack gap="md">
          <Select label="Class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={form.classId} onChange={v => setForm(f => ({ ...f, classId: v || '' }))} required searchable placeholder="Select class" />
          <Select label="Fee Type" data={feeTypes.map(t => ({ value: t.id, label: t.name }))} value={form.feeTypeId} onChange={v => setForm(f => ({ ...f, feeTypeId: v || '' }))} required searchable placeholder="Select fee type" />
          <NumberInput label="Amount (Rs.)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: Number(v) }))} min={0} leftSection={<IconCurrencyDollar size={16} />} required />
          <TextInput label="Due Date (optional)" placeholder="e.g. 10th of each month" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
