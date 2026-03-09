'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Modal, TextInput, NumberInput, Select, ActionIcon, Loader, Alert, Textarea, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle, IconCurrencyDollar } from '@tabler/icons-react';

interface PettyCash { id: string; description: string; amount: number; type: 'credit' | 'debit'; category?: string; date?: string; approvedBy?: string; receiptNo?: string; }
const CATS = ['Stationery', 'Refreshments', 'Maintenance', 'Postage', 'Transport', 'Utilities', 'Miscellaneous'];
const EMPTY = { description: '', amount: 0, type: 'debit', category: 'Miscellaneous', date: new Date().toISOString().split('T')[0], approvedBy: '', receiptNo: '' };

export default function Page() {
  const [records, setRecords] = useState<PettyCash[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/petty-cash').then(r => r.json());
      setRecords(r.data || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.description || !form.amount) { notifications.show({ message: 'Description and amount are required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/petty-cash', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Transaction recorded', color: 'green' }); setModal(false); setForm(EMPTY); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this transaction?')) return;
    const res = await fetch(`/api/petty-cash/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  const totalIn = records.filter(r => r.type === 'credit').reduce((s, r) => s + r.amount, 0);
  const totalOut = records.filter(r => r.type === 'debit').reduce((s, r) => s + r.amount, 0);
  const balance = totalIn - totalOut;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Petty Cash</Text><Text size="sm" c="dimmed">Small expense transactions</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setModal(true)} radius="md">Add Transaction</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c={balance >= 0 ? '#10b981' : '#ef4444'}>Rs. {Math.abs(balance).toLocaleString()}</Text><Text size="sm" c="dimmed">{balance >= 0 ? 'Balance' : 'Deficit'}</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">Rs. {totalIn.toLocaleString()}</Text><Text size="sm" c="dimmed">Total In (Credits)</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#f59e0b">Rs. {totalOut.toLocaleString()}</Text><Text size="sm" c="dimmed">Total Out (Debits)</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Transactions</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : records.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No transactions yet. Add credits and debits to track petty cash.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Date</Table.Th><Table.Th>Description</Table.Th><Table.Th>Category</Table.Th><Table.Th>Type</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Receipt No</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {records.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text size="sm">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</Text></Table.Td>
                  <Table.Td><Text fw={500}>{r.description}</Text></Table.Td>
                  <Table.Td><Badge variant="light" color="gray">{r.category || '—'}</Badge></Table.Td>
                  <Table.Td><Badge color={r.type === 'credit' ? 'green' : 'orange'} variant="light">{r.type === 'credit' ? 'Credit (+)' : 'Debit (-)'}</Badge></Table.Td>
                  <Table.Td><Text fw={600} c={r.type === 'credit' ? 'green' : 'orange'}>Rs. {r.amount.toLocaleString()}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{r.receiptNo || '—'}</Text></Table.Td>
                  <Table.Td><ActionIcon variant="light" color="red" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      <Modal opened={modal} onClose={() => setModal(false)} title="Record Transaction" radius="md">
        <Stack gap="md">
          <Select label="Type" data={[{ value: 'debit', label: 'Debit (Expense)' }, { value: 'credit', label: 'Credit (Received)' }]} value={form.type} onChange={v => setForm((f: any) => ({ ...f, type: v || 'debit' }))} />
          <TextInput label="Description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} required placeholder="Brief description of expense" />
          <Group grow>
            <NumberInput label="Amount (Rs.)" value={form.amount} onChange={v => setForm((f: any) => ({ ...f, amount: Number(v) }))} min={0} required leftSection={<IconCurrencyDollar size={14} />} />
            <Select label="Category" data={CATS.map(c => ({ value: c, label: c }))} value={form.category} onChange={v => setForm((f: any) => ({ ...f, category: v || 'Miscellaneous' }))} />
          </Group>
          <Group grow>
            <TextInput label="Date" type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} />
            <TextInput label="Receipt No." value={form.receiptNo} onChange={e => setForm((f: any) => ({ ...f, receiptNo: e.target.value }))} placeholder="Optional" />
          </Group>
          <TextInput label="Approved By" value={form.approvedBy} onChange={e => setForm((f: any) => ({ ...f, approvedBy: e.target.value }))} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Record</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
