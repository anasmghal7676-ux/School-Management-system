'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Card, Stack, SimpleGrid, Textarea, TextInput,
  SegmentedControl,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconCheck, IconX, IconRefresh, IconEye,
  IconCalendarOff, IconUserCheck, IconClock, IconCircleX,
  IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react';

const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Paternity Leave', 'Emergency Leave', 'Unpaid Leave'].map(v => ({ value: v, label: v }));
const STATUS_COLOR: Record<string, string> = { Pending: 'yellow', Approved: 'green', Rejected: 'red', Cancelled: 'gray' };
const STATUS_OPTS = ['Pending', 'Approved', 'Rejected', 'Cancelled'].map(v => ({ value: v, label: v }));

const EMPTY_FORM: any = {
  applicantId: '', applicantType: 'Staff', leaveType: 'Sick Leave',
  fromDate: null, toDate: null, reason: '', status: 'Pending',
};

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [applicantType, setApplicantType] = useState('Staff');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [viewLeave, setViewLeave] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  useEffect(() => {
    fetch('/api/staff?limit=200').then(r => r.json()).then(d => setStaff(d.data || []));
  }, []);

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ applicantType, page: String(page), limit: String(LIMIT) });
      if (statusFilter) p.set('status', statusFilter);
      const res = await fetch(`/api/leaves?${p}`);
      const data = await res.json();
      setLeaves(data.data || []);
      setTotal(data.total || 0);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load leaves' });
    } finally { setLoading(false); }
  }, [applicantType, page, statusFilter]);

  useEffect(() => { loadLeaves(); }, [loadLeaves]);

  const handleSubmit = async () => {
    if (!form.applicantId || !form.fromDate || !form.toDate) {
      return notifications.show({ color: 'red', message: 'Staff, from date and to date are required' });
    }
    setSaving(true);
    try {
      const url = editId ? `/api/leaves/${editId}` : '/api/leaves';
      const method = editId ? 'PATCH' : 'POST';
      const payload = { ...form, fromDate: form.fromDate?.toISOString(), toDate: form.toDate?.toISOString() };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Leave submitted' });
      closeForm();
      loadLeaves();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const data = await res.json();
      if (!data.success) throw new Error('Failed');
      notifications.show({ color: status === 'Approved' ? 'green' : 'red', message: `Leave ${status.toLowerCase()}` });
      loadLeaves();
    } catch {
      notifications.show({ color: 'red', message: 'Update failed' });
    }
  };

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Leave Management</Text>
          <Text size="sm" c="dimmed">Review and approve staff leave requests</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM, applicantType }); openForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Apply Leave
        </Button>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[
          { label: 'Total', value: total, color: '#3b82f6' },
          { label: 'Pending', value: pendingCount, color: '#f59e0b' },
          { label: 'Approved', value: approvedCount, color: '#10b981' },
          { label: 'Rejected', value: leaves.filter(l => l.status === 'Rejected').length, color: '#ef4444' },
        ].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Group mb="md" gap="sm">
        <SegmentedControl data={['Staff', 'Student']} value={applicantType} onChange={setApplicantType} />
        <Select data={[{ value: '', label: 'All Status' }, ...STATUS_OPTS]} value={statusFilter} onChange={v => setStatusFilter(v || '')} w={150} radius="md" clearable />
        <ActionIcon variant="default" onClick={loadLeaves} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>

      {loading ? <Center py="xl"><Loader /></Center> : (
        <>
          <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
            <Table highlightOnHover>
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr>
                  <Table.Th>Applicant</Table.Th>
                  <Table.Th>Leave Type</Table.Th>
                  <Table.Th>From</Table.Th>
                  <Table.Th>To</Table.Th>
                  <Table.Th>Days</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {leaves.map(leave => {
                  const days = leave.fromDate && leave.toDate ? Math.ceil((new Date(leave.toDate).getTime() - new Date(leave.fromDate).getTime()) / 86400000) + 1 : '—';
                  const name = leave.staff ? `${leave.staff.firstName} ${leave.staff.lastName}` : leave.student ? `${leave.student.firstName} ${leave.student.lastName}` : '—';
                  return (
                    <Table.Tr key={leave.id}>
                      <Table.Td>
                        <Group gap={8}>
                          <Box style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {name.charAt(0)}
                          </Box>
                          <Text size="sm" fw={500}>{name}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td><Badge variant="light" color="blue" size="sm">{leave.leaveType}</Badge></Table.Td>
                      <Table.Td><Text size="sm">{leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : '—'}</Text></Table.Td>
                      <Table.Td><Text size="sm">{leave.toDate ? new Date(leave.toDate).toLocaleDateString() : '—'}</Text></Table.Td>
                      <Table.Td><Badge variant="outline" size="sm">{days} days</Badge></Table.Td>
                      <Table.Td><Badge color={STATUS_COLOR[leave.status] || 'gray'} variant="light" size="sm">{leave.status}</Badge></Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <Tooltip label="View"><ActionIcon variant="subtle" color="blue" size="sm" onClick={() => { setViewLeave(leave); openView(); }}><IconEye size={14} /></ActionIcon></Tooltip>
                          {leave.status === 'Pending' && <>
                            <Tooltip label="Approve"><ActionIcon variant="subtle" color="green" size="sm" onClick={() => handleStatusUpdate(leave.id, 'Approved')}><IconCheck size={14} /></ActionIcon></Tooltip>
                            <Tooltip label="Reject"><ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleStatusUpdate(leave.id, 'Rejected')}><IconX size={14} /></ActionIcon></Tooltip>
                          </>}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {leaves.length === 0 && (
                  <Table.Tr><Table.Td colSpan={7}><Center py="xl"><Text c="dimmed">No leave requests found</Text></Center></Table.Td></Table.Tr>
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
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>Apply Leave</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Select label="Staff Member" data={staff.map(s => ({ value: s.id, label: `${s.firstName} ${s.lastName} — ${s.designation || ''}` }))} value={form.applicantId} onChange={v => f('applicantId', v || '')} required searchable />
          <Grid>
            <Grid.Col span={6}><Select label="Leave Type" data={LEAVE_TYPES} value={form.leaveType} onChange={v => f('leaveType', v || '')} /></Grid.Col>
            <Grid.Col span={6}><Select label="Status" data={STATUS_OPTS} value={form.status} onChange={v => f('status', v || 'Pending')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><DatePickerInput label="From Date" value={form.fromDate} onChange={v => f('fromDate', v)} required /></Grid.Col>
            <Grid.Col span={6}><DatePickerInput label="To Date" value={form.toDate} onChange={v => f('toDate', v)} required /></Grid.Col>
          </Grid>
          <Textarea label="Reason" value={form.reason} onChange={e => f('reason', e.target.value)} rows={3} required />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Submit</Button>
          </Group>
        </Stack>
      </Modal>

      {/* View Modal */}
      <Modal opened={viewOpened} onClose={closeView} title={<Text fw={700}>Leave Details</Text>} radius="md" size="md">
        {viewLeave && (
          <Stack gap="sm">
            <Badge color={STATUS_COLOR[viewLeave.status] || 'gray'} size="lg">{viewLeave.status}</Badge>
            <Grid>
              <Grid.Col span={6}><Text size="xs" c="dimmed">Leave Type</Text><Text fw={600}>{viewLeave.leaveType}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="xs" c="dimmed">Applied On</Text><Text fw={600}>{viewLeave.createdAt ? new Date(viewLeave.createdAt).toLocaleDateString() : '—'}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="xs" c="dimmed">From</Text><Text fw={600}>{viewLeave.fromDate ? new Date(viewLeave.fromDate).toLocaleDateString() : '—'}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="xs" c="dimmed">To</Text><Text fw={600}>{viewLeave.toDate ? new Date(viewLeave.toDate).toLocaleDateString() : '—'}</Text></Grid.Col>
            </Grid>
            {viewLeave.reason && <><Text size="xs" c="dimmed">Reason</Text><Text size="sm">{viewLeave.reason}</Text></>}
            {viewLeave.status === 'Pending' && (
              <Group mt="sm">
                <Button color="green" leftSection={<IconCheck size={14} />} onClick={() => { handleStatusUpdate(viewLeave.id, 'Approved'); closeView(); }}>Approve</Button>
                <Button color="red" variant="light" leftSection={<IconX size={14} />} onClick={() => { handleStatusUpdate(viewLeave.id, 'Rejected'); closeView(); }}>Reject</Button>
              </Group>
            )}
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
