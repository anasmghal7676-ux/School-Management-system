'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center, SimpleGrid,
  Divider, NumberInput,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconTrash, IconEye, IconRefresh,
  IconCurrencyDollar, IconCheck, IconX, IconChevronLeft, IconChevronRight,
  IconReceipt,
} from '@tabler/icons-react';

const EMPTY_FORM: any = {
  studentId: '', totalAmount: '', paidAmount: '', paymentMethod: 'cash',
  paymentDate: new Date().toISOString().split('T')[0], remarks: '', status: 'paid',
};

const STATUS_COLOR: any = { paid: 'green', partial: 'orange', pending: 'yellow', overdue: 'red' };
const METHOD_LABEL: any = { cash: 'Cash', bank: 'Bank Transfer', cheque: 'Cheque', online: 'Online' };

export default function FeeCollectionPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [collectedAmount, setCollectedAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ status: statusFilter, page: String(page), limit: String(LIMIT) });
      const res = await fetch(`/api/fees/collection?${p}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
        setTotal(data.total);
        setTotalAmount(data.totalAmount || 0);
        setCollectedAmount(data.collectedAmount || 0);
      }
    } catch { notifications.show({ title: 'Failed to load payments', message: '', color: 'red' }); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  useEffect(() => {
    fetch('/api/students?limit=500').then(r => r.json()).then(d => setStudents(d.data || []));
  }, []);

  const handleSave = async () => {
    if (!form.studentId || !form.totalAmount) {
      notifications.show({ title: 'Fill required fields', message: 'Student and amount are required', color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/fees/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, totalAmount: parseFloat(form.totalAmount), paidAmount: parseFloat(form.paidAmount || form.totalAmount) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      notifications.show({ title: 'Payment recorded', message: `Receipt: ${data.data?.receiptNumber}`, color: 'green', icon: <IconCheck size={16} /> });
      closeForm(); setForm({ ...EMPTY_FORM }); loadPayments();
    } catch (e: any) {
      notifications.show({ title: 'Save failed', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/fees/collection/${deleteId}`, { method: 'DELETE' });
      notifications.show({ title: 'Payment deleted', message: '', color: 'green' });
      setDeleteId(null); closeDelete(); loadPayments();
    } catch { notifications.show({ title: 'Delete failed', message: '', color: 'red' }); }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const fmtCurrency = (n: number) => `Rs ${n.toLocaleString()}`;

  const kpiCards = [
    { label: 'Total Payments', value: total, color: '#3b82f6', prefix: '' },
    { label: 'Total Collected', value: fmtCurrency(collectedAmount), color: '#10b981', prefix: '' },
    { label: 'Total Amount', value: fmtCurrency(totalAmount), color: '#f59e0b', prefix: '' },
    { label: 'Pending', value: fmtCurrency(Math.max(0, totalAmount - collectedAmount)), color: '#ef4444', prefix: '' },
  ];

  return (
    <Box style={{ padding: '16px 20px 40px' }}>
      <Group justify="space-between" mb="md">
        <Box>
          <Text style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Fee Collection</Text>
          <Text size="sm" c="dimmed">Manage fee payments and receipts</Text>
        </Box>
        <Group gap={8}>
          <Tooltip label="Refresh"><ActionIcon variant="light" onClick={loadPayments} size="md" radius="md"><IconRefresh size={16} /></ActionIcon></Tooltip>
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setForm({ ...EMPTY_FORM }); openForm(); }}
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }} radius="md">
            Record Payment
          </Button>
        </Group>
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mb="md">
        {kpiCards.map(card => (
          <Box key={card.label} style={{ background: 'white', borderRadius: 10, padding: '14px 16px', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Box style={{ width: 6, height: 36, borderRadius: 3, background: card.color, flexShrink: 0 }} />
            <Box>
              <Text style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{card.value}</Text>
              <Text size="11px" c="dimmed">{card.label}</Text>
            </Box>
          </Box>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Box style={{ background: 'white', borderRadius: 12, padding: '12px 16px', border: '1.5px solid #f1f5f9', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
        <Select placeholder="All Status" value={statusFilter} onChange={v => setStatusFilter(v || '')}
          data={[{ label: 'All Status', value: '' }, { label: 'Paid', value: 'paid' }, { label: 'Partial', value: 'partial' }, { label: 'Pending', value: 'pending' }, { label: 'Overdue', value: 'overdue' }]}
          size="sm" radius="md" style={{ width: 150 }} clearable />
      </Box>

      {/* Table */}
      <Box style={{ background: 'white', borderRadius: 12, border: '1.5px solid #f1f5f9', overflow: 'hidden' }}>
        <Box style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 120px 100px 80px 80px', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          {['Receipt', 'Student', 'Total', 'Paid', 'Method', 'Status', 'Actions'].map(h => (
            <Text key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</Text>
          ))}
        </Box>

        {loading ? <Center py={60}><Loader size="sm" /></Center> :
         payments.length === 0 ? (
          <Center py={60} style={{ flexDirection: 'column', gap: 8 }}>
            <IconReceipt size={40} color="#e2e8f0" />
            <Text c="dimmed" size="sm">No payments recorded yet</Text>
            <Button size="xs" variant="light" onClick={() => { setForm({ ...EMPTY_FORM }); openForm(); }}>Record First Payment</Button>
          </Center>
        ) : payments.map((p, i) => (
          <Box key={p.id}
            style={{ display: 'grid', gridTemplateColumns: '140px 1fr 120px 120px 100px 80px 80px', padding: '10px 16px', borderBottom: i < payments.length - 1 ? '1px solid #f8fafc' : 'none', alignItems: 'center', transition: 'background 150ms ease' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <Text style={{ fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>{p.receiptNumber}</Text>
            <Box>
              <Text style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>
                {p.student?.fullName || `${p.student?.firstName} ${p.student?.lastName}`}
              </Text>
              <Text size="11px" c="dimmed">{p.student?.admissionNumber}</Text>
            </Box>
            <Text style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{fmtCurrency(p.totalAmount)}</Text>
            <Text style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>{fmtCurrency(p.paidAmount)}</Text>
            <Badge size="xs" variant="light" color="blue">{METHOD_LABEL[p.paymentMethod] || p.paymentMethod}</Badge>
            <Badge size="xs" color={STATUS_COLOR[p.status] || 'gray'}>{p.status}</Badge>
            <Group gap={4}>
              <Tooltip label="Delete"><ActionIcon size="sm" variant="light" color="red" onClick={() => { setDeleteId(p.id); openDelete(); }}><IconTrash size={13} /></ActionIcon></Tooltip>
            </Group>
          </Box>
        ))}

        {totalPages > 1 && (
          <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
            <Text size="12px" c="dimmed">Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}</Text>
            <Group gap={4}>
              <ActionIcon size="sm" variant="light" disabled={page === 1} onClick={() => setPage(p => p - 1)}><IconChevronLeft size={13} /></ActionIcon>
              <ActionIcon size="sm" variant="light" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><IconChevronRight size={13} /></ActionIcon>
            </Group>
          </Box>
        )}
      </Box>

      {/* Record Payment Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700} size="lg">Record Fee Payment</Text>} size="md" radius="lg" centered>
        <Grid gutter="sm">
          <Grid.Col span={12}>
            <Select label="Student *" value={form.studentId} onChange={v => f('studentId', v || '')}
              data={students.map(s => ({ label: `${s.fullName || s.firstName + ' ' + s.lastName} (${s.admissionNumber})`, value: s.id }))}
              placeholder="Search and select student" searchable size="sm" radius="md" />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput label="Total Amount (Rs) *" type="number" value={form.totalAmount} onChange={e => f('totalAmount', e.target.value)} placeholder="e.g. 5000" size="sm" radius="md" />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput label="Paid Amount (Rs)" type="number" value={form.paidAmount || form.totalAmount} onChange={e => f('paidAmount', e.target.value)} placeholder="Leave blank if full" size="sm" radius="md" />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select label="Payment Method" value={form.paymentMethod} onChange={v => f('paymentMethod', v || 'cash')}
              data={[{ label: 'Cash', value: 'cash' }, { label: 'Bank Transfer', value: 'bank' }, { label: 'Cheque', value: 'cheque' }, { label: 'Online', value: 'online' }]}
              size="sm" radius="md" />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput label="Payment Date" type="date" value={form.paymentDate} onChange={e => f('paymentDate', e.target.value)} size="sm" radius="md" />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select label="Status" value={form.status} onChange={v => f('status', v || 'paid')}
              data={[{ label: 'Paid (Full)', value: 'paid' }, { label: 'Partial', value: 'partial' }, { label: 'Pending', value: 'pending' }]}
              size="sm" radius="md" />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput label="Remarks" value={form.remarks} onChange={e => f('remarks', e.target.value)} placeholder="Optional note" size="sm" radius="md" />
          </Grid.Col>
        </Grid>
        <Divider my="md" />
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={closeForm} radius="md">Cancel</Button>
          <Button onClick={handleSave} loading={saving} leftSection={<IconCheck size={16} />}
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }} radius="md">
            Record Payment
          </Button>
        </Group>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700}>Confirm Delete</Text>} size="sm" radius="lg" centered>
        <Text size="sm" c="#475569" mb="lg">Delete this payment record permanently?</Text>
        <Group justify="flex-end">
          <Button variant="light" color="gray" onClick={closeDelete} radius="md">Cancel</Button>
          <Button color="red" onClick={handleDelete} radius="md">Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
