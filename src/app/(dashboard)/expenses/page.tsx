'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Card, Stack, SimpleGrid, Textarea, NumberInput,
  Progress,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconEdit, IconTrash, IconRefresh,
  IconCurrencyDollar, IconChevronLeft, IconChevronRight,
  IconReceipt, IconTrendingUp, IconDownload,
} from '@tabler/icons-react';

const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Credit Card'].map(v => ({ value: v, label: v }));

const EMPTY_FORM: any = {
  description: '', amount: '', expenseDate: null,
  paymentMode: 'Cash', vendorName: '', billNumber: '',
  remarks: '', schoolId: 'school_main',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (paymentFilter) p.set('paymentMode', paymentFilter);
      const res = await fetch(`/api/expenses?${p}`);
      const data = await res.json();
      setExpenses(data.data || []);
      setTotal(data.total || 0);
      setTotalAmount(data.totalAmount || (data.data || []).reduce((s: number, e: any) => s + (e.amount || 0), 0));
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load expenses' });
    } finally { setLoading(false); }
  }, [page, paymentFilter]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const handleSubmit = async () => {
    if (!form.description.trim() || !form.amount) return notifications.show({ color: 'red', message: 'Description and amount required' });
    setSaving(true);
    try {
      const url = editId ? `/api/expenses/${editId}` : '/api/expenses';
      const method = editId ? 'PATCH' : 'POST';
      const payload = { ...form, amount: parseFloat(form.amount), expenseDate: form.expenseDate?.toISOString() };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Expense updated' : 'Expense recorded' });
      closeForm();
      loadExpenses();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'Expense deleted' });
      closeDelete();
      loadExpenses();
    } catch {
      notifications.show({ color: 'red', message: 'Delete failed' });
    } finally { setSaving(false); }
  };

  // This month total from loaded data
  const thisMonthTotal = expenses.filter(e => {
    const d = new Date(e.expenseDate || e.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + (e.amount || 0), 0);

  const PAYMENT_COLOR: Record<string, string> = { Cash: 'green', 'Bank Transfer': 'blue', Cheque: 'yellow', Online: 'violet', 'Credit Card': 'orange' };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Expenses</Text>
          <Text size="sm" c="dimmed">Track all school expenditures</Text>
        </Box>
        <Group>
          <Button variant="default" leftSection={<IconDownload size={16} />}>Export</Button>
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            Record Expense
          </Button>
        </Group>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, sm: 3 }} mb="xl">
        {[
          { label: 'Total Records', value: total, color: '#3b82f6' },
          { label: 'This Month', value: `₨${thisMonthTotal.toLocaleString()}`, color: '#f59e0b' },
          { label: 'All Time Total', value: `₨${totalAmount.toLocaleString()}`, color: '#ef4444' },
        ].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Group mb="md" gap="sm">
        <Select data={[{ value: '', label: 'All Payment Modes' }, ...PAYMENT_MODES]} value={paymentFilter} onChange={v => setPaymentFilter(v || '')} w={200} radius="md" clearable />
        <ActionIcon variant="default" onClick={loadExpenses} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
        <Text size="sm" c="dimmed">{total} records</Text>
      </Group>

      {loading ? <Center py="xl"><Loader /></Center> : (
        <>
          <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
            <Table highlightOnHover>
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Payment Mode</Table.Th>
                  <Table.Th>Vendor</Table.Th>
                  <Table.Th>Bill #</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {expenses.map(exp => (
                  <Table.Tr key={exp.id}>
                    <Table.Td>
                      <Group gap={8}>
                        <Box style={{ width: 28, height: 28, borderRadius: 7, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                          <IconReceipt size={14} />
                        </Box>
                        <Text size="sm" fw={500} lineClamp={1}>{exp.description}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm" fw={700} c="#ef4444">₨{(exp.amount || 0).toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text size="sm">{exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString() : '—'}</Text></Table.Td>
                    <Table.Td><Badge color={PAYMENT_COLOR[exp.paymentMode] || 'gray'} variant="light" size="sm">{exp.paymentMode || 'Cash'}</Badge></Table.Td>
                    <Table.Td><Text size="sm">{exp.vendorName || '—'}</Text></Table.Td>
                    <Table.Td><Text size="xs" c="dimmed">{exp.billNumber || '—'}</Text></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(exp.id); setForm({ description: exp.description, amount: String(exp.amount), expenseDate: exp.expenseDate ? new Date(exp.expenseDate) : null, paymentMode: exp.paymentMode || 'Cash', vendorName: exp.vendorName || '', billNumber: exp.billNumber || '', remarks: exp.remarks || '', schoolId: 'school_main' }); openForm(); }}><IconEdit size={14} /></ActionIcon></Tooltip>
                        <Tooltip label="Delete"><ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(exp.id); openDelete(); }}><IconTrash size={14} /></ActionIcon></Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {expenses.length === 0 && (
                  <Table.Tr><Table.Td colSpan={7}><Center py="xl"><Text c="dimmed">No expenses recorded</Text></Center></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Box>
          {total > LIMIT && (
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">Page {page} of {Math.ceil(total / LIMIT)}</Text>
              <Group gap={8}>
                <ActionIcon variant="default" disabled={page === 1} onClick={() => setPage(p => p - 1)}><IconChevronLeft size={14} /></ActionIcon>
                <ActionIcon variant="default" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}><IconChevronRight size={14} /></ActionIcon>
              </Group>
            </Group>
          )}
        </>
      )}

      {/* Form Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Expense' : 'Record Expense'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <TextInput label="Description" value={form.description} onChange={e => f('description', e.target.value)} required placeholder="e.g. Electricity bill" />
          <Grid>
            <Grid.Col span={6}><NumberInput label="Amount (₨)" value={parseFloat(form.amount) || 0} onChange={v => f('amount', String(v))} min={0} step={100} /></Grid.Col>
            <Grid.Col span={6}><DatePickerInput label="Expense Date" value={form.expenseDate} onChange={v => f('expenseDate', v)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><Select label="Payment Mode" data={PAYMENT_MODES} value={form.paymentMode} onChange={v => f('paymentMode', v || 'Cash')} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Bill Number" value={form.billNumber} onChange={e => f('billNumber', e.target.value)} /></Grid.Col>
          </Grid>
          <TextInput label="Vendor / Supplier" value={form.vendorName} onChange={e => f('vendorName', e.target.value)} />
          <Textarea label="Remarks" value={form.remarks} onChange={e => f('remarks', e.target.value)} rows={2} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {editId ? 'Update' : 'Record'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Expense</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this expense record permanently?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
