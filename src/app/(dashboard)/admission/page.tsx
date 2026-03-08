'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Card, Stack, SimpleGrid, Divider, Stepper,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconEye,
  IconRefresh, IconUserPlus, IconCheck, IconArrowRight,
  IconChevronLeft, IconChevronRight, IconUserCheck,
} from '@tabler/icons-react';

const STAGES = ['inquiry', 'applied', 'document_review', 'interview', 'approved', 'rejected'];
const STAGE_LABELS: Record<string, string> = {
  inquiry: 'Inquiry', applied: 'Applied', document_review: 'Doc Review',
  interview: 'Interview', approved: 'Approved', rejected: 'Rejected',
};
const STAGE_COLOR: Record<string, string> = {
  inquiry: 'gray', applied: 'blue', document_review: 'yellow',
  interview: 'violet', approved: 'green', rejected: 'red',
};

const EMPTY_FORM = {
  firstName: '', lastName: '', gender: 'Male', dateOfBirth: '',
  fatherName: '', fatherPhone: '', motherName: '',
  address: '', city: '', religion: 'Islam',
  currentClassId: '', status: 'inquiry',
  admissionDate: new Date().toISOString().split('T')[0],
};

export default function AdmissionPage() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [stageFilter, setStageFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [viewApplicant, setViewApplicant] = useState<any>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(d.data || []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (stageFilter) p.set('stage', stageFilter);
      if (debouncedSearch) p.set('search', debouncedSearch);
      const res = await fetch(`/api/admissions?${p}`);
      const data = await res.json();
      setApplicants(data.data || []);
      setTotal(data.total || 0);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load admissions' });
    } finally { setLoading(false); }
  }, [page, stageFilter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return notifications.show({ color: 'red', message: 'First and last name required' });
    }
    setSaving(true);
    try {
      const url = editId ? `/api/students/${editId}` : '/api/students';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Application submitted' });
      closeForm(); load();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const advanceStage = async (id: string, currentStage: string) => {
    const idx = STAGES.indexOf(currentStage);
    if (idx < 0 || idx >= STAGES.length - 2) return; // can't advance past 'approved'
    const next = STAGES[idx + 1];
    try {
      const res = await fetch(`/api/admissions/${id}/stage`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: next }) });
      const data = await res.json();
      if (!data.success) {
        // fallback: try student PATCH
        await fetch(`/api/students/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
      }
      notifications.show({ color: 'green', message: `Moved to ${STAGE_LABELS[next]}` });
      load();
    } catch {
      notifications.show({ color: 'red', message: 'Failed to update stage' });
    }
  };

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = applicants.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Admissions</Text>
          <Text size="sm" c="dimmed">Manage student admission applications</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          New Application
        </Button>
      </Group>

      {/* Stage filter chips */}
      <Group mb="md" gap="xs" wrap="wrap">
        <Badge variant={stageFilter === '' ? 'filled' : 'light'} color="gray" style={{ cursor: 'pointer' }} onClick={() => setStageFilter('')}>
          All ({total})
        </Badge>
        {STAGES.map(s => (
          <Badge key={s} variant={stageFilter === s ? 'filled' : 'light'} color={STAGE_COLOR[s]} style={{ cursor: 'pointer' }} onClick={() => setStageFilter(s)}>
            {STAGE_LABELS[s]} ({stageCounts[s] || 0})
          </Badge>
        ))}
      </Group>

      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search applicants..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>

      {loading ? <Center py="xl"><Loader /></Center> : (
        <>
          <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
            <Table highlightOnHover>
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr>
                  <Table.Th>Applicant</Table.Th>
                  <Table.Th>Applied Class</Table.Th>
                  <Table.Th>Father/Guardian</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Stage</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {applicants.map(app => (
                  <Table.Tr key={app.id}>
                    <Table.Td>
                      <Group gap={8}>
                        <Box style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {(app.firstName || app.fullName || '?').charAt(0)}
                        </Box>
                        <Box>
                          <Text size="sm" fw={600}>{app.fullName || `${app.firstName} ${app.lastName}`}</Text>
                          {app.admissionNumber && <Text size="xs" c="dimmed">{app.admissionNumber}</Text>}
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm">{app.class?.name || '—'}</Text></Table.Td>
                    <Table.Td>
                      <Box>
                        <Text size="sm">{app.fatherName || '—'}</Text>
                        {app.fatherPhone && <Text size="xs" c="dimmed">{app.fatherPhone}</Text>}
                      </Box>
                    </Table.Td>
                    <Table.Td><Text size="sm">{app.admissionDate ? new Date(app.admissionDate).toLocaleDateString() : app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}</Text></Table.Td>
                    <Table.Td>
                      <Badge color={STAGE_COLOR[app.status] || 'gray'} variant="light" size="sm">{STAGE_LABELS[app.status] || app.status}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label="View details"><ActionIcon variant="subtle" color="blue" size="sm" onClick={() => { setViewApplicant(app); openView(); }}><IconEye size={14} /></ActionIcon></Tooltip>
                        {app.status !== 'approved' && app.status !== 'rejected' && (
                          <Tooltip label={`Advance to ${STAGE_LABELS[STAGES[STAGES.indexOf(app.status) + 1]] || 'next stage'}`}>
                            <ActionIcon variant="subtle" color="green" size="sm" onClick={() => advanceStage(app.id, app.status)}><IconArrowRight size={14} /></ActionIcon>
                          </Tooltip>
                        )}
                        <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(app.id); setForm({ firstName: app.firstName || '', lastName: app.lastName || '', gender: app.gender || 'Male', dateOfBirth: app.dateOfBirth ? app.dateOfBirth.split('T')[0] : '', fatherName: app.fatherName || '', fatherPhone: app.fatherPhone || '', motherName: app.motherName || '', address: app.address || '', city: app.city || '', religion: app.religion || 'Islam', currentClassId: app.currentClassId || '', status: app.status || 'inquiry', admissionDate: app.admissionDate ? app.admissionDate.split('T')[0] : new Date().toISOString().split('T')[0] }); openForm(); }}><IconEdit size={14} /></ActionIcon></Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {applicants.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6}><Center py="xl">
                    <Stack align="center" gap="xs">
                      <IconUserPlus size={40} color="#cbd5e1" />
                      <Text c="dimmed">No applications found</Text>
                    </Stack>
                  </Center></Table.Td></Table.Tr>
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
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Application' : 'New Admission Application'}</Text>} radius="md" size="lg">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={6}><TextInput label="First Name" value={form.firstName} onChange={e => f('firstName', e.target.value)} required /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Last Name" value={form.lastName} onChange={e => f('lastName', e.target.value)} required /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={4}><Select label="Gender" data={['Male', 'Female', 'Other'].map(v => ({ value: v, label: v }))} value={form.gender} onChange={v => f('gender', v || 'Male')} /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)} /></Grid.Col>
            <Grid.Col span={4}><Select label="Apply For Class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={form.currentClassId} onChange={v => f('currentClassId', v || '')} searchable /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><TextInput label="Father's Name" value={form.fatherName} onChange={e => f('fatherName', e.target.value)} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Father's Phone" value={form.fatherPhone} onChange={e => f('fatherPhone', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><TextInput label="Mother's Name" value={form.motherName} onChange={e => f('motherName', e.target.value)} /></Grid.Col>
            <Grid.Col span={6}><Select label="Stage" data={STAGES.map(s => ({ value: s, label: STAGE_LABELS[s] }))} value={form.status} onChange={v => f('status', v || 'inquiry')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={8}><TextInput label="Address" value={form.address} onChange={e => f('address', e.target.value)} /></Grid.Col>
            <Grid.Col span={4}><TextInput label="City" value={form.city} onChange={e => f('city', e.target.value)} /></Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Submit Application'}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* View Modal */}
      <Modal opened={viewOpened} onClose={closeView} title={<Text fw={700}>Application Details</Text>} radius="md" size="md">
        {viewApplicant && (
          <Stack gap="sm">
            <Group>
              <Badge color={STAGE_COLOR[viewApplicant.status] || 'gray'} size="lg">{STAGE_LABELS[viewApplicant.status] || viewApplicant.status}</Badge>
            </Group>
            <Text size="lg" fw={700}>{viewApplicant.fullName || `${viewApplicant.firstName} ${viewApplicant.lastName}`}</Text>
            <Grid>
              <Grid.Col span={6}><Text size="xs" c="dimmed">Gender</Text><Text fw={500}>{viewApplicant.gender || '—'}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="xs" c="dimmed">DOB</Text><Text fw={500}>{viewApplicant.dateOfBirth ? new Date(viewApplicant.dateOfBirth).toLocaleDateString() : '—'}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="xs" c="dimmed">Father</Text><Text fw={500}>{viewApplicant.fatherName || '—'}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="xs" c="dimmed">Contact</Text><Text fw={500}>{viewApplicant.fatherPhone || '—'}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="xs" c="dimmed">Class Applied</Text><Text fw={500}>{viewApplicant.class?.name || '—'}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="xs" c="dimmed">Religion</Text><Text fw={500}>{viewApplicant.religion || '—'}</Text></Grid.Col>
            </Grid>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
