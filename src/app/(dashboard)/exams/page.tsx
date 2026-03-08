'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Card, Stack, SimpleGrid, Textarea, Tabs, Divider,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconEye,
  IconRefresh, IconSchool, IconCalendar, IconCheck, IconX,
  IconChevronLeft, IconChevronRight, IconClipboardList,
  IconAward, IconBook,
} from '@tabler/icons-react';

const EXAM_TYPES = ['Mid-Term', 'Final', 'Unit Test', 'Mock Exam', 'Annual', 'Term 1', 'Term 2', 'Term 3'].map(v => ({ value: v, label: v }));
const STATUS_OPTS = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map(v => ({ value: v, label: v }));

const STATUS_COLOR: Record<string, string> = {
  Upcoming: 'blue', Ongoing: 'yellow', Completed: 'green', Cancelled: 'red',
};

const EMPTY_FORM = {
  name: '', type: 'Mid-Term', startDate: null as Date | null, endDate: null as Date | null,
  status: 'Upcoming', description: '', academicYearId: '',
};

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [viewExam, setViewExam] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const f = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  useEffect(() => {
    fetch('/api/academic-years?limit=20').then(r => r.json()).then(d => setAcademicYears(d.data || [])).catch(() => {});
  }, []);

  const loadExams = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusFilter) p.set('status', statusFilter);
      if (debouncedSearch) p.set('search', debouncedSearch);
      const res = await fetch(`/api/exams?${p}`);
      const data = await res.json();
      setExams(data.data?.exams || data.data || []);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load exams' });
    } finally { setLoading(false); }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { loadExams(); }, [loadExams]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.type || !form.startDate) {
      return notifications.show({ color: 'red', message: 'Name, type and start date are required' });
    }
    setSaving(true);
    try {
      const url = editId ? `/api/exams/${editId}` : '/api/exams';
      const method = editId ? 'PATCH' : 'POST';
      const payload = { ...form, startDate: form.startDate?.toISOString(), endDate: form.endDate?.toISOString() };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Exam updated' : 'Exam created' });
      closeForm();
      loadExams();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/exams/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      notifications.show({ color: 'green', message: 'Exam deleted' });
      closeDelete();
      loadExams();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const openEdit = (exam: any) => {
    setEditId(exam.id);
    setForm({
      name: exam.name, type: exam.type || 'Mid-Term',
      startDate: exam.startDate ? new Date(exam.startDate) : null,
      endDate: exam.endDate ? new Date(exam.endDate) : null,
      status: exam.status || 'Upcoming', description: exam.description || '',
      academicYearId: exam.academicYearId || '',
    });
    openForm();
  };

  const upcomingCount = exams.filter(e => e.status === 'Upcoming').length;
  const ongoingCount = exams.filter(e => e.status === 'Ongoing').length;
  const completedCount = exams.filter(e => e.status === 'Completed').length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Examinations</Text>
          <Text size="sm" c="dimmed">Schedule and manage exams</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Schedule Exam
        </Button>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 3 }} mb="xl">
        {[
          { label: 'Upcoming', value: upcomingCount, color: '#3b82f6' },
          { label: 'Ongoing', value: ongoingCount, color: '#f59e0b' },
          { label: 'Completed', value: completedCount, color: '#10b981' },
        ].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9', borderTop: `3px solid ${s.color}` }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} ls="0.5px">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <Select data={[{ value: '', label: 'All Status' }, ...STATUS_OPTS]} value={statusFilter} onChange={v => setStatusFilter(v || '')} w={160} radius="md" clearable />
        <ActionIcon variant="default" onClick={loadExams} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>

      {loading ? (
        <Center py="xl"><Loader /></Center>
      ) : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr>
                <Table.Th>Exam Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Start Date</Table.Th>
                <Table.Th>End Date</Table.Th>
                <Table.Th>Schedules</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {exams.map(exam => (
                <Table.Tr key={exam.id}>
                  <Table.Td>
                    <Group gap={8}>
                      <Box style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <IconClipboardList size={14} />
                      </Box>
                      <Box>
                        <Text size="sm" fw={600}>{exam.name}</Text>
                        {exam.academicYear && <Text size="xs" c="dimmed">{exam.academicYear.name}</Text>}
                      </Box>
                    </Group>
                  </Table.Td>
                  <Table.Td><Badge variant="light" color="violet" size="sm">{exam.type}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{exam.startDate ? new Date(exam.startDate).toLocaleDateString() : '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{exam.endDate ? new Date(exam.endDate).toLocaleDateString() : '—'}</Text></Table.Td>
                  <Table.Td><Badge variant="light" color="gray" size="sm">{exam._count?.schedules || 0} subjects</Badge></Table.Td>
                  <Table.Td><Badge color={STATUS_COLOR[exam.status] || 'gray'} variant="light" size="sm">{exam.status || 'Upcoming'}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label="View details">
                        <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => { setViewExam(exam); openView(); }}>
                          <IconEye size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon variant="subtle" size="sm" onClick={() => openEdit(exam)}><IconEdit size={14} /></ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete">
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(exam.id); openDelete(); }}><IconTrash size={14} /></ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {exams.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Center py="xl">
                      <Stack align="center" gap="xs">
                        <IconAward size={40} color="#cbd5e1" />
                        <Text c="dimmed">No exams scheduled yet</Text>
                      </Stack>
                    </Center>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Box>
      )}

      {/* Form Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Exam' : 'Schedule New Exam'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <TextInput label="Exam Name" placeholder="e.g. Mid-Term Exam 2025" value={form.name} onChange={e => f('name', e.target.value)} required />
          <Grid>
            <Grid.Col span={6}><Select label="Type" data={EXAM_TYPES} value={form.type} onChange={v => f('type', v || 'Mid-Term')} /></Grid.Col>
            <Grid.Col span={6}><Select label="Status" data={STATUS_OPTS} value={form.status} onChange={v => f('status', v || 'Upcoming')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><DatePickerInput label="Start Date" value={form.startDate} onChange={v => f('startDate', v)} required /></Grid.Col>
            <Grid.Col span={6}><DatePickerInput label="End Date" value={form.endDate} onChange={v => f('endDate', v)} /></Grid.Col>
          </Grid>
          {academicYears.length > 0 && (
            <Select label="Academic Year" data={[{ value: '', label: 'Select year' }, ...academicYears.map(y => ({ value: y.id, label: y.name }))]} value={form.academicYearId} onChange={v => f('academicYearId', v || '')} clearable />
          )}
          <Textarea label="Description" placeholder="Optional notes" value={form.description} onChange={e => f('description', e.target.value)} rows={2} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {editId ? 'Update' : 'Schedule'} Exam
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* View Modal */}
      <Modal opened={viewOpened} onClose={closeView} title={<Text fw={700}>Exam Details</Text>} radius="md" size="lg">
        {viewExam && (
          <Stack gap="md">
            <Group>
              <Badge color={STATUS_COLOR[viewExam.status] || 'gray'} size="lg">{viewExam.status || 'Upcoming'}</Badge>
              <Badge variant="light" color="violet">{viewExam.type}</Badge>
            </Group>
            <Text size="lg" fw={700}>{viewExam.name}</Text>
            <Grid>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">Start Date</Text>
                <Text size="sm" fw={500}>{viewExam.startDate ? new Date(viewExam.startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">End Date</Text>
                <Text size="sm" fw={500}>{viewExam.endDate ? new Date(viewExam.endDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</Text>
              </Grid.Col>
            </Grid>
            {viewExam.description && <><Divider /><Text size="sm" c="dimmed">{viewExam.description}</Text></>}
            {viewExam.schedules && viewExam.schedules.length > 0 && (
              <>
                <Divider label="Exam Schedule" labelPosition="left" />
                <Box style={{ border: '1px solid #f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
                  <Table size="sm">
                    <Table.Thead style={{ background: '#f8fafc' }}>
                      <Table.Tr>
                        <Table.Th>Subject</Table.Th>
                        <Table.Th>Class</Table.Th>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Total Marks</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {viewExam.schedules.map((sch: any) => (
                        <Table.Tr key={sch.id}>
                          <Table.Td>{sch.subject?.name || '—'}</Table.Td>
                          <Table.Td>{sch.class?.name || '—'}</Table.Td>
                          <Table.Td>{sch.examDate ? new Date(sch.examDate).toLocaleDateString() : '—'}</Table.Td>
                          <Table.Td>{sch.totalMarks || '—'}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Box>
              </>
            )}
          </Stack>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Exam</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">This will permanently delete the exam and all its schedules.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
