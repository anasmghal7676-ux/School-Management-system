'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Card, SimpleGrid, Badge, Button, Table,
  ActionIcon, Loader, Alert, Modal, Stack, TextInput, Select,
  NumberInput, Textarea, ThemeIcon, Pagination, Tooltip,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle,
  IconSearch, IconCurrencyRupee, IconCircleCheck, IconCircleX,
} from '@tabler/icons-react';

const EMPTY = { studentId: '', monthYear: '', fineAmount: '', reason: '', waived: false, waivedBy: '' };
const MONTHS = ['2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12',
                 '2024-01','2024-02','2024-03','2024-04','2024-05','2024-06','2024-07','2024-08','2024-09','2024-10','2024-11','2024-12'];

export default function FeeFinesPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dSearch] = useDebouncedValue(search, 300);
  const [monthFilter, setMonthFilter] = useState('');
  const [waivedFilter, setWaivedFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [waivedBy, setWaivedBy] = useState('');
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [waiverOpened, { open: openWaiver, close: closeWaiver }] = useDisclosure(false);
  const [waiverTarget, setWaiverTarget] = useState<any>(null);
  const LIMIT = 20;

  useEffect(() => {
    fetch('/api/students?limit=200').then(r => r.json()).then(d => setStudents(d.data || []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (monthFilter) p.set('monthYear', monthFilter);
      if (waivedFilter) p.set('waived', waivedFilter);
      const res = await fetch('/api/fee-fines?' + p);
      const data = await res.json();
      setRecords(data.data || []);
      setTotal(data.total || 0);
    } catch { notifications.show({ color: 'red', message: 'Failed to load fee fines' }); }
    finally { setLoading(false); }
  }, [page, monthFilter, waivedFilter]);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditId(null); setForm({ ...EMPTY }); openForm(); }
  function openEdit(r: any) {
    setEditId(r.id);
    setForm({ studentId: r.studentId, monthYear: r.monthYear, fineAmount: String(r.fineAmount), reason: r.reason, waived: r.waived, waivedBy: r.waivedBy || '' });
    openForm();
  }

  async function save() {
    if (!form.studentId || !form.monthYear || !form.fineAmount || !form.reason)
      return notifications.show({ color: 'orange', message: 'All fields required' });
    setSaving(true);
    try {
      const url = editId ? '/api/fee-fines/' + editId : '/api/fee-fines';
      const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, fineAmount: parseFloat(form.fineAmount) }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      notifications.show({ color: 'green', message: editId ? 'Fine updated' : 'Fine added' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  }

  async function doWaiver(id: string, waive: boolean) {
    const res = await fetch('/api/fee-fines/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ waived: waive, waivedBy: waive ? waivedBy : null }) });
    const d = await res.json();
    if (d.success) { notifications.show({ color: 'green', message: waive ? 'Fine waived' : 'Waiver reversed' }); closeWaiver(); load(); }
    else notifications.show({ color: 'red', message: d.error || 'Failed' });
  }

  async function del(id: string) {
    if (!confirm('Delete this fine record?')) return;
    const res = await fetch('/api/fee-fines/' + id, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { notifications.show({ color: 'green', message: 'Deleted' }); load(); }
  }

  const totalAmt = records.reduce((s, r) => s + (r.fineAmount || 0), 0);
  const waivedAmt = records.filter(r => r.waived).reduce((s, r) => s + (r.fineAmount || 0), 0);
  const pendingAmt = totalAmt - waivedAmt;
  const filtered = records.filter(r => !dSearch || (r.student?.fullName || '').toLowerCase().includes(dSearch.toLowerCase()));

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Fee Fines</Text>
          <Text size="sm" c="dimmed">Manage late payment fines & penalties</Text>
        </Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Add Fine</Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        {[
          { label: 'Pending Fines', value: 'PKR ' + pendingAmt.toLocaleString(), color: 'red', icon: <IconCurrencyRupee size={22} /> },
          { label: 'Total Fines', value: 'PKR ' + totalAmt.toLocaleString(), color: 'blue', icon: <IconCurrencyRupee size={22} /> },
          { label: 'Waived Amount', value: 'PKR ' + waivedAmt.toLocaleString(), color: 'green', icon: <IconCircleCheck size={22} /> },
        ].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
            <Group justify="space-between">
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{s.label}</Text>
                <Text size="xl" fw={700} mt={4}>{loading ? '—' : s.value}</Text>
              </Box>
              <ThemeIcon size={48} radius="md" color={s.color} variant="light">{s.icon}</ThemeIcon>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Card shadow="xs" radius="md" p="md" mb="md" style={{ border: '1px solid #f1f5f9' }}>
        <Group>
          <TextInput placeholder="Search by student..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} w={220} radius="md" />
          <Select placeholder="Month" data={MONTHS.map(m => ({ value: m, label: m }))} value={monthFilter} onChange={v => setMonthFilter(v || '')} w={150} radius="md" clearable />
          <Select placeholder="Status" data={[{ value: 'false', label: 'Pending' }, { value: 'true', label: 'Waived' }]} value={waivedFilter} onChange={v => setWaivedFilter(v || '')} w={130} radius="md" clearable />
        </Group>
      </Card>

      <Card shadow="xs" radius="md" p={0} style={{ border: '1px solid #f1f5f9' }}>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : filtered.length === 0 ? (
          <Box p="xl"><Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No fine records found. Add a fine to get started.</Alert></Box>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr>
                <Table.Th>Student</Table.Th><Table.Th>Month</Table.Th><Table.Th>Amount</Table.Th>
                <Table.Th>Reason</Table.Th><Table.Th>Status</Table.Th><Table.Th>Waived By</Table.Th><Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map((r: any) => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    <Text fw={600} size="sm">{r.student?.fullName || r.studentId}</Text>
                    <Text size="xs" c="dimmed">{r.student?.admissionNumber}</Text>
                  </Table.Td>
                  <Table.Td><Badge variant="outline" size="sm">{r.monthYear}</Badge></Table.Td>
                  <Table.Td><Text fw={600} c="red">PKR {(r.fineAmount || 0).toLocaleString()}</Text></Table.Td>
                  <Table.Td><Text size="sm" lineClamp={2} style={{ maxWidth: 200 }}>{r.reason}</Text></Table.Td>
                  <Table.Td><Badge color={r.waived ? 'green' : 'orange'} variant="light">{r.waived ? 'Waived' : 'Pending'}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{r.waivedBy || '—'}</Text></Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label="Edit"><ActionIcon variant="light" color="blue" size="sm" onClick={() => openEdit(r)}><IconEdit size={14} /></ActionIcon></Tooltip>
                      {!r.waived
                        ? <Tooltip label="Waive"><ActionIcon variant="light" color="green" size="sm" onClick={() => { setWaiverTarget(r); setWaivedBy(''); openWaiver(); }}><IconCircleCheck size={14} /></ActionIcon></Tooltip>
                        : <Tooltip label="Reverse"><ActionIcon variant="light" color="orange" size="sm" onClick={() => doWaiver(r.id, false)}><IconCircleX size={14} /></ActionIcon></Tooltip>
                      }
                      <Tooltip label="Delete"><ActionIcon variant="light" color="red" size="sm" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon></Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
        {total > LIMIT && (
          <Group justify="center" p="md">
            <Pagination total={Math.ceil(total / LIMIT)} value={page} onChange={setPage} size="sm" radius="md" />
          </Group>
        )}
      </Card>

      <Modal opened={formOpened} onClose={closeForm} title={editId ? 'Edit Fine' : 'Add Fee Fine'} radius="md" size="md">
        <Stack gap="sm">
          <Select label="Student" placeholder="Select student" searchable
            data={students.map(s => ({ value: s.id, label: (s.fullName || (s.firstName + ' ' + s.lastName)) + ' (' + s.admissionNumber + ')' }))}
            value={form.studentId} onChange={v => setForm(f => ({ ...f, studentId: v || '' }))} required />
          <Select label="Month/Year" placeholder="Select month" data={MONTHS.map(m => ({ value: m, label: m }))}
            value={form.monthYear} onChange={v => setForm(f => ({ ...f, monthYear: v || '' }))} required />
          <NumberInput label="Fine Amount (PKR)" placeholder="500" min={0}
            value={form.fineAmount ? parseFloat(form.fineAmount) : ''} onChange={v => setForm(f => ({ ...f, fineAmount: String(v) }))} required />
          <Textarea label="Reason" placeholder="Late payment / Lost ID card / etc." minRows={2}
            value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editId ? 'Update' : 'Add Fine'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={waiverOpened} onClose={closeWaiver} title="Waive Fine" radius="md" size="sm">
        <Stack gap="sm">
          <Alert color="orange" radius="md" variant="light">
            Waiving PKR <strong>{waiverTarget?.fineAmount?.toLocaleString()}</strong> fine for <strong>{waiverTarget?.student?.fullName}</strong>
          </Alert>
          <TextInput label="Waived By (Authority)" placeholder="e.g. Principal / HOD"
            value={waivedBy} onChange={e => setWaivedBy(e.target.value)} />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeWaiver}>Cancel</Button>
            <Button color="green" onClick={() => doWaiver(waiverTarget?.id, true)}>Confirm Waiver</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
