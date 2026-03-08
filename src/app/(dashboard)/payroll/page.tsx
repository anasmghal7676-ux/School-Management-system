'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Card, Stack, SimpleGrid, Textarea, NumberInput,
  Progress,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconEye,
  IconRefresh, IconUsers, IconCheck, IconX, IconCurrencyDollar,
  IconChevronLeft, IconChevronRight, IconBuildingBank, IconDownload,
} from '@tabler/icons-react';

const STATUS_COLOR: Record<string, string> = { Paid: 'green', Pending: 'yellow', Processing: 'blue', Failed: 'red' };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CUR_MONTH = MONTHS[new Date().getMonth()];
const CUR_YEAR = new Date().getFullYear();

const EMPTY_FORM = {
  staffId: '', monthYear: `${CUR_MONTH} ${CUR_YEAR}`,
  basicSalary: '', allowances: '0', deductions: '0',
  bonus: '0', netSalary: '', status: 'Pending', remarks: '',
};

export default function PayrollPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [monthYearFilter, setMonthYearFilter] = useState(`${CUR_MONTH} ${CUR_YEAR}`);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (key: string, val: any) => setForm(prev => {
    const next = { ...prev, [key]: val };
    // Auto-calculate net salary
    const basic = parseFloat(next.basicSalary) || 0;
    const allowances = parseFloat(next.allowances) || 0;
    const deductions = parseFloat(next.deductions) || 0;
    const bonus = parseFloat(next.bonus) || 0;
    next.netSalary = String(basic + allowances + bonus - deductions);
    return next;
  });

  useEffect(() => {
    fetch('/api/staff?limit=200').then(r => r.json()).then(d => setStaff(d.data || []));
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (monthYearFilter) p.set('monthYear', monthYearFilter);
      if (statusFilter) p.set('status', statusFilter);
      const res = await fetch(`/api/payroll?${p}`);
      const data = await res.json();
      setRecords(data.data || []);
      setTotal(data.total || 0);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load payroll' });
    } finally { setLoading(false); }
  }, [page, monthYearFilter, statusFilter]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const handleSubmit = async () => {
    if (!form.staffId || !form.basicSalary) return notifications.show({ color: 'red', message: 'Staff and basic salary required' });
    setSaving(true);
    try {
      const url = editId ? `/api/payroll/${editId}` : '/api/payroll';
      const method = editId ? 'PATCH' : 'POST';
      const payload = { ...form, basicSalary: parseFloat(form.basicSalary), allowances: parseFloat(form.allowances) || 0, deductions: parseFloat(form.deductions) || 0, bonus: parseFloat(form.bonus) || 0, netSalary: parseFloat(form.netSalary) || 0 };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Payroll record created' });
      closeForm();
      loadRecords();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await fetch(`/api/payroll/${deleteId}`, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'Deleted' });
      closeDelete();
      loadRecords();
    } catch {
      notifications.show({ color: 'red', message: 'Delete failed' });
    } finally { setSaving(false); }
  };

  const totalPayroll = records.reduce((s, r) => s + (r.netSalary || 0), 0);
  const paidCount = records.filter(r => r.status === 'Paid').length;
  const pendingCount = records.filter(r => r.status === 'Pending').length;

  // Month/year select options
  const monthYearOptions = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    monthYearOptions.push({ value: label, label });
  }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Payroll</Text>
          <Text size="sm" c="dimmed">Manage staff salaries and payments</Text>
        </Box>
        <Group>
          <Button variant="default" leftSection={<IconDownload size={16} />}>Export</Button>
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            Add Record
          </Button>
        </Group>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[
          { label: 'Total Records', value: total, color: '#3b82f6' },
          { label: 'Paid', value: paidCount, color: '#10b981' },
          { label: 'Pending', value: pendingCount, color: '#f59e0b' },
          { label: 'Total Amount', value: `₨${totalPayroll.toLocaleString()}`, color: '#8b5cf6' },
        ].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Group mb="md" gap="sm">
        <Select data={monthYearOptions} value={monthYearFilter} onChange={v => setMonthYearFilter(v || '')} placeholder="Month/Year" w={200} radius="md" />
        <Select data={[{ value: '', label: 'All Status' }, 'Paid', 'Pending', 'Processing', 'Failed'].map(v => ({ value: v, label: v }))} value={statusFilter} onChange={v => setStatusFilter(v || '')} w={150} radius="md" clearable />
        <ActionIcon variant="default" onClick={loadRecords} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>

      {loading ? <Center py="xl"><Loader /></Center> : (
        <>
          <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
            <Table highlightOnHover>
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr>
                  <Table.Th>Staff</Table.Th>
                  <Table.Th>Month/Year</Table.Th>
                  <Table.Th>Basic</Table.Th>
                  <Table.Th>Allowances</Table.Th>
                  <Table.Th>Deductions</Table.Th>
                  <Table.Th>Net Salary</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {records.map(rec => (
                  <Table.Tr key={rec.id}>
                    <Table.Td>
                      <Group gap={8}>
                        <Box style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {rec.staff?.firstName?.charAt(0) || 'S'}
                        </Box>
                        <Box>
                          <Text size="sm" fw={500}>{rec.staff ? `${rec.staff.firstName} ${rec.staff.lastName}` : '—'}</Text>
                          <Text size="xs" c="dimmed">{rec.staff?.designation || ''}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm">{rec.monthYear}</Text></Table.Td>
                    <Table.Td><Text size="sm">₨{(rec.basicSalary || 0).toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="green">+₨{(rec.allowances || 0).toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="red">-₨{(rec.deductions || 0).toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={700} c="#10b981">₨{(rec.netSalary || 0).toLocaleString()}</Text></Table.Td>
                    <Table.Td><Badge color={STATUS_COLOR[rec.status] || 'gray'} variant="light" size="sm">{rec.status}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(rec.id); setForm({ staffId: rec.staffId, monthYear: rec.monthYear, basicSalary: String(rec.basicSalary), allowances: String(rec.allowances || 0), deductions: String(rec.deductions || 0), bonus: String(rec.bonus || 0), netSalary: String(rec.netSalary), status: rec.status, remarks: rec.remarks || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon></Tooltip>
                        <Tooltip label="Delete"><ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(rec.id); openDelete(); }}><IconTrash size={14} /></ActionIcon></Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {records.length === 0 && (
                  <Table.Tr><Table.Td colSpan={8}><Center py="xl"><Text c="dimmed">No payroll records for this period</Text></Center></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Box>

          {/* Pagination */}
          {total > LIMIT && (
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">{(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</Text>
              <Group gap={8}>
                <ActionIcon variant="default" disabled={page === 1} onClick={() => setPage(p => p - 1)}><IconChevronLeft size={14} /></ActionIcon>
                <ActionIcon variant="default" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}><IconChevronRight size={14} /></ActionIcon>
              </Group>
            </Group>
          )}
        </>
      )}

      {/* Form Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Payroll' : 'New Payroll Record'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Select label="Staff Member" data={staff.map(s => ({ value: s.id, label: `${s.firstName} ${s.lastName} — ${s.designation || ''}` }))} value={form.staffId} onChange={v => f('staffId', v || '')} required searchable placeholder="Select staff" />
          <Grid>
            <Grid.Col span={6}><Select label="Month/Year" data={monthYearOptions} value={form.monthYear} onChange={v => f('monthYear', v || '')} /></Grid.Col>
            <Grid.Col span={6}><Select label="Status" data={['Pending','Processing','Paid','Failed'].map(v => ({ value: v, label: v }))} value={form.status} onChange={v => f('status', v || 'Pending')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><NumberInput label="Basic Salary (₨)" value={parseFloat(form.basicSalary) || 0} onChange={v => f('basicSalary', String(v))} min={0} step={1000} /></Grid.Col>
            <Grid.Col span={6}><NumberInput label="Allowances (₨)" value={parseFloat(form.allowances) || 0} onChange={v => f('allowances', String(v))} min={0} step={100} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><NumberInput label="Deductions (₨)" value={parseFloat(form.deductions) || 0} onChange={v => f('deductions', String(v))} min={0} /></Grid.Col>
            <Grid.Col span={6}><NumberInput label="Bonus (₨)" value={parseFloat(form.bonus) || 0} onChange={v => f('bonus', String(v))} min={0} /></Grid.Col>
          </Grid>
          <Card shadow="none" p="sm" radius="md" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Net Salary</Text>
              <Text size="lg" fw={700} c="#10b981">₨{(parseFloat(form.netSalary) || 0).toLocaleString()}</Text>
            </Group>
          </Card>
          <Textarea label="Remarks" value={form.remarks} onChange={e => f('remarks', e.target.value)} rows={2} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {editId ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Record</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this payroll record permanently?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
