'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, Select, Button, Loader, Center,
  Table, Card, ActionIcon, Tooltip, Stack, Modal, TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconRefresh } from '@tabler/icons-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NUM: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

export default function TimetablePage() {
  const [classes, setClasses]         = useState<any[]>([]);
  const [subjects, setSubjects]       = useState<any[]>([]);
  const [staff, setStaff]             = useState<any[]>([]);
  const [slots, setSlots]             = useState<any[]>([]);
  const [sections, setSections]       = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [academicYearId, setAcademicYearId] = useState('');
  const [classId, setClassId]         = useState('');
  const [sectionId, setSectionId]     = useState('');
  const [timetable, setTimetable]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState({ day: 'Monday', period: '1', subjectId: '', staffId: '', room: '' });
  const [editId, setEditId]           = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  // Load static data
  useEffect(() => {
    Promise.all([
      fetch('/api/classes?limit=100').then(r => r.json()),
      fetch('/api/subjects?limit=200').then(r => r.json()),
      fetch('/api/staff?limit=200').then(r => r.json()),
      fetch('/api/timetable-slots').then(r => r.json()),
      fetch('/api/academic-years?isCurrent=true').then(r => r.json()),
    ]).then(([cls, sub, stf, slt, ayr]) => {
      setClasses(cls.data || []);
      setSubjects(sub.data || []);
      setStaff(stf.data || []);
      setSlots(slt.data || []);
      const years = ayr.data || [];
      setAcademicYears(years);
      if (years[0]) setAcademicYearId(years[0].id);
    });
  }, []);

  // Load sections when class changes
  useEffect(() => {
    if (!classId) { setSections([]); setSectionId(''); return; }
    fetch(`/api/sections?classId=${classId}&limit=50`).then(r => r.json()).then(d => {
      const s = d.data || [];
      setSections(s);
      if (s[0]) setSectionId(s[0].id);
    });
  }, [classId]);

  // Load timetable
  const loadTimetable = useCallback(async () => {
    if (!sectionId || !academicYearId) { setTimetable([]); return; }
    setLoading(true);
    fetch(`/api/timetable?sectionId=${sectionId}&academicYearId=${academicYearId}&limit=200`)
      .then(r => r.json()).then(d => setTimetable(d.data || []))
      .catch(() => setTimetable([]))
      .finally(() => setLoading(false));
  }, [sectionId, academicYearId]);

  useEffect(() => { loadTimetable(); }, [loadTimetable]);

  const handleSubmit = async () => {
    if (!sectionId || !academicYearId) {
      notifications.show({ color: 'orange', message: 'Select a class, section and academic year first' });
      return;
    }
    // Resolve day + period → slotId
    const dayNum     = DAY_NUM[form.day];
    const periodNum  = parseInt(form.period);
    const slot       = slots.find(s => s.dayOfWeek === dayNum && s.periodNumber === periodNum);
    if (!slot) {
      notifications.show({ color: 'red', message: 'Invalid period — TimetableSlot not found. Run DB seed.' });
      return;
    }
    setSaving(true);
    try {
      const url    = editId ? `/api/timetable/${editId}` : '/api/timetable';
      const method = editId ? 'PATCH' : 'POST';
      const body   = {
        sectionId,
        slotId:        slot.id,
        subjectId:     form.subjectId || null,
        teacherId:     form.staffId   || null,
        academicYearId,
        roomNumber:    form.room      || null,
      };
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || 'Failed to save');
      notifications.show({ color: 'green', message: editId ? 'Period updated ✓' : 'Period added ✓' });
      closeForm();
      setEditId(null);
      loadTimetable();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this period?')) return;
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: 'DELETE' });
      const d   = await res.json();
      if (!d.success) throw new Error(d.error || 'Delete failed');
      notifications.show({ color: 'green', message: 'Deleted' });
      loadTimetable();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    }
  };

  // Build grid: rows = periods 1-8, cols = DAYS
  const DAY_INDEXES = DAYS.map((_, i) => i + 1);
  const PERIOD_NUMS = Array.from({ length: 8 }, (_, i) => i + 1);

  const cellEntry = (dayNum: number, periodNum: number) => {
    const slot = slots.find(s => s.dayOfWeek === dayNum && s.periodNumber === periodNum);
    if (!slot) return null;
    return timetable.find(t => t.slotId === slot.id);
  };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700}>Timetable</Text>
          <Text size="sm" c="dimmed">Manage class schedules</Text>
        </Box>
        <Group>
          <ActionIcon variant="light" onClick={() => loadTimetable()} title="Refresh">
            <IconRefresh size={16} />
          </ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ day: 'Monday', period: '1', subjectId: '', staffId: '', room: '' }); openForm(); }} disabled={!sectionId}>
            Add Period
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Card withBorder radius="md" p="md" mb="lg">
        <Group>
          <Select label="Academic Year" data={academicYears.map(y => ({ value: y.id, label: y.name }))}
            value={academicYearId} onChange={v => setAcademicYearId(v || '')} w={180} />
          <Select label="Class" data={classes.map(c => ({ value: c.id, label: c.name }))}
            value={classId} onChange={v => setClassId(v || '')} placeholder="Select class" w={160} searchable />
          <Select label="Section" data={sections.map(s => ({ value: s.id, label: `Section ${s.name}` }))}
            value={sectionId} onChange={v => setSectionId(v || '')} placeholder="Select section" w={160} disabled={!classId} />
        </Group>
      </Card>

      {/* Grid */}
      {loading ? (
        <Center h={200}><Loader /></Center>
      ) : !sectionId ? (
        <Center h={200}><Text c="dimmed">Select a class and section to view timetable</Text></Center>
      ) : (
        <Card withBorder radius="md" p={0} style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ minWidth: 80 }}>Period</Table.Th>
                {DAYS.map(d => <Table.Th key={d} style={{ minWidth: 140 }}>{d}</Table.Th>)}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {PERIOD_NUMS.map(p => {
                const slot = slots.find(s => s.dayOfWeek === 1 && s.periodNumber === p);
                return (
                  <Table.Tr key={p}>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text fw={600} size="sm">P{p}</Text>
                        {slot && <Text size="xs" c="dimmed">{slot.startTime}–{slot.endTime}</Text>}
                      </Stack>
                    </Table.Td>
                    {DAY_INDEXES.map(d => {
                      const entry = cellEntry(d, p);
                      return (
                        <Table.Td key={d}>
                          {entry ? (
                            <Stack gap={4}>
                              <Text size="sm" fw={500}>{entry.subject?.name || '—'}</Text>
                              <Text size="xs" c="dimmed">{entry.teacher ? `${entry.teacher.firstName} ${entry.teacher.lastName}` : ''}</Text>
                              {entry.roomNumber && <Badge size="xs" variant="light">{entry.roomNumber}</Badge>}
                              <Group gap={4}>
                                <Tooltip label="Edit"><ActionIcon size="xs" variant="subtle" onClick={() => {
                                  setEditId(entry.id);
                                  const slotObj = slots.find((s: any) => s.id === entry.slotId);
                                  const dayName = DAYS[slotObj ? slotObj.dayOfWeek - 1 : 0];
                                  setForm({ day: dayName, period: String(slotObj?.periodNumber || 1), subjectId: entry.subjectId || '', staffId: entry.teacherId || '', room: entry.roomNumber || '' });
                                  openForm();
                                }}><IconEdit size={10} /></ActionIcon></Tooltip>
                                <Tooltip label="Delete"><ActionIcon size="xs" variant="subtle" color="red" onClick={() => handleDelete(entry.id)}><IconTrash size={10} /></ActionIcon></Tooltip>
                              </Group>
                            </Stack>
                          ) : (
                            <ActionIcon size="xs" variant="subtle" c="dimmed" onClick={() => {
                              setEditId(null);
                              setForm({ day: DAYS[d - 1], period: String(p), subjectId: '', staffId: '', room: '' });
                              openForm();
                            }}><IconPlus size={12} /></ActionIcon>
                          )}
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={editId ? 'Edit Period' : 'Add Period'} size="md">
        <Stack>
          <Group grow>
            <Select label="Day" data={DAYS} value={form.day} onChange={v => f('day', v || 'Monday')} />
            <Select label="Period" data={Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Period ${i + 1}` }))}
              value={form.period} onChange={v => f('period', v || '1')} />
          </Group>
          <Select label="Subject" data={subjects.map(s => ({ value: s.id, label: s.name }))}
            value={form.subjectId} onChange={v => f('subjectId', v || '')} placeholder="Select subject" searchable clearable />
          <Select label="Teacher" data={staff.map(s => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))}
            value={form.staffId} onChange={v => f('staffId', v || '')} placeholder="Select teacher" searchable clearable />
          <TextInput label="Room Number" value={form.room} onChange={e => f('room', e.target.value)} placeholder="e.g. R-101" />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editId ? 'Update' : 'Add Period'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
