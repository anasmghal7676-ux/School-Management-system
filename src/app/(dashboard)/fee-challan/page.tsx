'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import {
  Container, Title, Group, Button, TextInput, Select, Table, Badge,
  Modal, NumberInput, ActionIcon, Text, Stack, Card, Grid, Loader,
  Center, Pagination, Tooltip, Textarea,
} from '@mantine/core';
import {
  IconSearch, IconPlus, IconEdit, IconTrash, IconDownload,
  IconFileText, IconCurrencyRupee, IconCheck, IconClock,
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { generateFeeChallan } from '@/lib/pdf-generator';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const STATUSES = ['Pending','Partial','Paid','Overdue'];
const PAGE_SIZE = 15;

export default function FeeChallanPage() {
  const [records, setRecords]   = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats]       = useState({ total: 0, pending: 0, paid: 0, overdue: 0 });
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');
  const [debouncedSearch]       = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter]   = useState<string | null>(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editRecord, setEditRecord]     = useState<any>(null);
  const [pdfLoading, setPdfLoading]     = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);

  const [form, setForm] = useState({
    studentId: '', monthYear: '', dueDate: '', totalAmount: 0,
    paidAmount: 0, status: 'Pending', remarks: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(monthFilter && { month: monthFilter }),
      });
      const res = await fetch('/api/fee-challans?' + params);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
        setTotal(data.pagination?.total || 0);
        setStats(data.stats || { total: 0, pending: 0, paid: 0, overdue: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, monthFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, monthFilter]);

  useEffect(() => {
    fetch('/api/students?limit=300')
      .then(r => r.json())
      .then(d => setStudents((d.data || []).map((s: any) => ({
        value: s.id,
        label: `${s.fullName} (${s.admissionNumber || 'N/A'})`,
      }))));
  }, []);

  function openAdd() {
    setEditRecord(null);
    setForm({ studentId: '', monthYear: '', dueDate: '', totalAmount: 0, paidAmount: 0, status: 'Pending', remarks: '' });
    setModalOpen(true);
  }
  function openEdit(r: any) {
    setEditRecord(r);
    setForm({
      studentId: r.studentId || '',
      monthYear: r.monthYear || '',
      dueDate: r.dueDate ? r.dueDate.slice(0, 10) : '',
      totalAmount: r.totalAmount || 0,
      paidAmount: r.paidAmount || 0,
      status: r.status || 'Pending',
      remarks: r.remarks || '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.studentId || !form.monthYear) {
      notifications.show({ message: 'Student and month are required', color: 'red' }); return;
    }
    setSaving(true);
    try {
      const url = editRecord ? `/api/fee-challans/${editRecord.id}` : '/api/fee-challans';
      const method = editRecord ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        notifications.show({ message: editRecord ? 'Challan updated' : 'Challan created', color: 'green' });
        setModalOpen(false);
        fetchData();
      } else {
        notifications.show({ message: data.error || 'Failed', color: 'red' });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this challan?')) return;
    const res = await fetch(`/api/fee-challans/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      notifications.show({ message: 'Deleted', color: 'orange' });
      fetchData();
    }
  }

  async function handleDownloadPDF(record: any) {
    setPdfLoading(record.id);
    try {
      const res = await fetch(`/api/pdf?type=fee-challan&studentId=${record.studentId}`);
      const data = await res.json();
      if (data.success) {
        generateFeeChallan({ ...data.data, month: record.monthYear });
        notifications.show({ message: 'PDF generated', color: 'teal' });
      } else {
        notifications.show({ message: 'Could not load PDF data', color: 'red' });
      }
    } catch {
      notifications.show({ message: 'PDF generation failed', color: 'red' });
    } finally {
      setPdfLoading(null);
    }
  }

  function statusColor(s: string) {
    return s === 'Paid' ? 'green' : s === 'Overdue' ? 'red' : s === 'Partial' ? 'orange' : 'blue';
  }

  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Fee Challans</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>New Challan</Button>
      </Group>

      <Grid mb="lg">
        {[
          { label: 'Total Challans', value: stats.total, icon: <IconFileText size={22} />, color: 'blue' },
          { label: 'Pending', value: stats.pending, icon: <IconClock size={22} />, color: 'orange' },
          { label: 'Paid', value: stats.paid, icon: <IconCheck size={22} />, color: 'green' },
          { label: 'Overdue', value: stats.overdue, icon: <IconCurrencyRupee size={22} />, color: 'red' },
        ].map(s => (
          <Grid.Col key={s.label} span={{ base: 6, sm: 3 }}>
            <Card withBorder radius="md" p="md">
              <Group>
                <Text c={s.color}>{s.icon}</Text>
                <div>
                  <Text size="xl" fw={700}>{s.value}</Text>
                  <Text size="xs" c="dimmed">{s.label}</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Group mb="md" gap="sm">
        <TextInput
          placeholder="Search student..."
          leftSection={<IconSearch size={16} />}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <Select placeholder="Status" data={STATUSES} value={statusFilter} onChange={setStatusFilter} clearable w={140} />
        <Select placeholder="Month" data={MONTHS} value={monthFilter} onChange={setMonthFilter} clearable w={140} />
      </Group>

      {loading ? (
        <Center py="xl"><Loader /></Center>
      ) : (
        <Card withBorder radius="md" p={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Student</Table.Th>
                <Table.Th>Month</Table.Th>
                <Table.Th>Total (PKR)</Table.Th>
                <Table.Th>Paid (PKR)</Table.Th>
                <Table.Th>Due Date</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.length === 0 ? (
                <Table.Tr><Table.Td colSpan={7}><Center py="xl"><Text c="dimmed">No challans found</Text></Center></Table.Td></Table.Tr>
              ) : records.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    <Text fw={500} size="sm">{r.student?.fullName || '—'}</Text>
                    <Text size="xs" c="dimmed">{r.student?.admissionNumber}</Text>
                  </Table.Td>
                  <Table.Td>{r.monthYear || '—'}</Table.Td>
                  <Table.Td>PKR {(r.totalAmount || 0).toLocaleString()}</Table.Td>
                  <Table.Td>PKR {(r.paidAmount || 0).toLocaleString()}</Table.Td>
                  <Table.Td>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}</Table.Td>
                  <Table.Td><Badge color={statusColor(r.status)} size="sm">{r.status}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label="Download PDF">
                        <ActionIcon
                          variant="light" color="teal" size="sm"
                          loading={pdfLoading === r.id}
                          onClick={() => handleDownloadPDF(r)}
                        >
                          <IconDownload size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <ActionIcon variant="light" color="blue" size="sm" onClick={() => openEdit(r)}>
                        <IconEdit size={14} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDelete(r.id)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {pages > 1 && (
        <Center mt="md">
          <Pagination total={pages} value={page} onChange={setPage} />
        </Center>
      )}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? 'Edit Challan' : 'New Fee Challan'} size="md">
        <Stack>
          <Select
            label="Student" placeholder="Select student" data={students} searchable
            value={form.studentId} onChange={v => setForm(f => ({ ...f, studentId: v || '' }))}
            required
          />
          <Select
            label="Month" placeholder="Select month" data={MONTHS}
            value={form.monthYear} onChange={v => setForm(f => ({ ...f, monthYear: v || '' }))}
            required
          />
          <TextInput
            label="Due Date" type="date"
            value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
          />
          <Group grow>
            <NumberInput
              label="Total Amount (PKR)" min={0} thousandSeparator=","
              value={form.totalAmount} onChange={v => setForm(f => ({ ...f, totalAmount: Number(v) || 0 }))}
            />
            <NumberInput
              label="Paid Amount (PKR)" min={0} thousandSeparator=","
              value={form.paidAmount} onChange={v => setForm(f => ({ ...f, paidAmount: Number(v) || 0 }))}
            />
          </Group>
          <Select
            label="Status" data={STATUSES}
            value={form.status} onChange={v => setForm(f => ({ ...f, status: v || 'Pending' }))}
          />
          <Textarea
            label="Remarks" placeholder="Optional note..."
            value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editRecord ? 'Update' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
