'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, Select, Button, Loader, Center,
  Table, Card, ActionIcon, Tooltip, Stack, Grid, Modal, TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconClock, IconCalendarEvent } from '@tabler/icons-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT: Record<string, string> = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };
const PERIODS = Array.from({ length: 8 }, (_, i) => `Period ${i + 1}`);

export default function TimetablePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ day: 'Monday', period: 'Period 1', subjectId: '', staffId: '', startTime: '08:00', endTime: '08:45', room: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(d.data || []));
    fetch('/api/subjects?limit=200').then(r => r.json()).then(d => setSubjects(d.data || []));
    fetch('/api/staff?limit=200').then(r => r.json()).then(d => setStaff(d.data || []));
  }, []);

  useEffect(() => {
    if (!classId) { setTimetable([]); return; }
    setLoading(true);
    fetch(`/api/timetable?classId=${classId}&limit=200`).then(r => r.json()).then(d => setTimetable(d.data || [])).catch(() => setTimetable([])).finally(() => setLoading(false));
  }, [classId]);

  const handleSubmit = async () => {
    if (!classId) return;
    setSaving(true);
    try {
      const url = editId ? `/api/timetable/${editId}` : '/api/timetable';
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, classId }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Period added' });
      closeForm();
      const res2 = await fetch(`/api/timetable?classId=${classId}&limit=200`);
      const d2 = await res2.json(); setTimetable(d2.data || []);
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  // Build grid: day x period
  const grid: Record<string, Record<string, any>> = {};
  DAYS.forEach(d => { grid[d] = {}; });
  timetable.forEach(t => {
    const day = t.day || t.dayOfWeek;
    const period = t.period || t.periodNumber || '';
    if (day && period) grid[day][period] = t;
  });

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Timetable</Text><Text size="sm" c="dimmed">Class schedule management</Text></Box>
        <Group gap="sm">
          <Select placeholder="Select class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={classId} onChange={v => setClassId(v || '')} w={200} radius="md" searchable />
          <Button leftSection={<IconPlus size={16} />} disabled={!classId} onClick={() => { setEditId(null); setForm({ day: 'Monday', period: 'Period 1', subjectId: '', staffId: '', startTime: '08:00', endTime: '08:45', room: '' }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Add Period</Button>
        </Group>
      </Group>

      {!classId ? (
        <Center py="xl"><Stack align="center" gap="xs"><IconCalendarEvent size={40} color="#cbd5e1" /><Text c="dimmed">Select a class to view its timetable</Text></Stack></Center>
      ) : loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ overflowX: 'auto' }}>
          <Table style={{ minWidth: 700, border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr>
                <Table.Th style={{ width: 80 }}>Period</Table.Th>
                {DAYS.map(d => <Table.Th key={d}>{DAY_SHORT[d]}</Table.Th>)}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {PERIODS.map(period => (
                <Table.Tr key={period}>
                  <Table.Td><Text size="xs" fw={600} c="dimmed">{period}</Text></Table.Td>
                  {DAYS.map(day => {
                    const cell = grid[day]?.[period];
                    return (
                      <Table.Td key={day} style={{ padding: 4, verticalAlign: 'top' }}>
                        {cell ? (
                          <Box p={6} style={{ background: '#eff6ff', borderRadius: 6, border: '1px solid #bfdbfe', cursor: 'pointer' }} onClick={() => { setEditId(cell.id); setForm({ day: cell.day || cell.dayOfWeek || day, period: cell.period || period, subjectId: cell.subjectId || '', staffId: cell.staffId || '', startTime: cell.startTime || '08:00', endTime: cell.endTime || '08:45', room: cell.room || '' }); openForm(); }}>
                            <Text size="xs" fw={600} c="#1d4ed8" lineClamp={1}>{cell.subject?.name || '—'}</Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>{cell.staff?.fullName || cell.staff?.firstName || '—'}</Text>
                            {cell.room && <Text size="xs" c="dimmed">{cell.room}</Text>}
                          </Box>
                        ) : (
                          <Box p={6} style={{ minHeight: 44, borderRadius: 6, border: '1px dashed #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setEditId(null); setForm({ day, period, subjectId: '', staffId: '', startTime: '08:00', endTime: '08:45', room: '' }); openForm(); }}>
                            <Text size="xs" c="#cbd5e1">+</Text>
                          </Box>
                        )}
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      )}

      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Period' : 'Add Period'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={6}><Select label="Day" data={DAYS.map(d => ({ value: d, label: d }))} value={form.day} onChange={v => f('day', v || 'Monday')} /></Grid.Col>
            <Grid.Col span={6}><Select label="Period" data={PERIODS.map(p => ({ value: p, label: p }))} value={form.period} onChange={v => f('period', v || 'Period 1')} /></Grid.Col>
          </Grid>
          <Select label="Subject" data={subjects.map(s => ({ value: s.id, label: s.name }))} value={form.subjectId} onChange={v => f('subjectId', v || '')} searchable />
          <Select label="Teacher" data={staff.map(s => ({ value: s.id, label: s.fullName || `${s.firstName} ${s.lastName}` }))} value={form.staffId} onChange={v => f('staffId', v || '')} searchable />
          <Grid>
            <Grid.Col span={4}><TextInput label="Start Time" type="time" value={form.startTime} onChange={e => f('startTime', e.target.value)} /></Grid.Col>
            <Grid.Col span={4}><TextInput label="End Time" type="time" value={form.endTime} onChange={e => f('endTime', e.target.value)} /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Room" value={form.room} onChange={e => f('room', e.target.value)} /></Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="sm">
            {editId && <Button color="red" variant="subtle" onClick={async () => { await fetch(`/api/timetable/${editId}`, { method: 'DELETE' }); closeForm(); const r = await fetch(`/api/timetable?classId=${classId}&limit=200`); const d = await r.json(); setTimetable(d.data || []); }}>Delete</Button>}
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
