'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, Select, Button, ActionIcon,
  Tooltip, Loader, Center, Table, Card, Stack, SimpleGrid,
  SegmentedControl, Progress, Checkbox,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  IconRefresh, IconCheck, IconX, IconClock, IconCalendarCheck,
  IconUsers, IconUserCheck, IconUserX, IconDeviceFloppy, IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react';

const STATUS_OPTS = ['Present', 'Absent', 'Late', 'Leave'] as const;
type AttStatus = typeof STATUS_OPTS[number];

const STATUS_CONFIG: Record<AttStatus, { color: string; icon: React.ReactNode; bg: string }> = {
  Present: { color: 'green', icon: <IconUserCheck size={14} />, bg: '#dcfce7' },
  Absent: { color: 'red', icon: <IconUserX size={14} />, bg: '#fee2e2' },
  Late: { color: 'yellow', icon: <IconClock size={14} />, bg: '#fef9c3' },
  Leave: { color: 'blue', icon: <IconCalendarCheck size={14} />, bg: '#dbeafe' },
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [records, setRecords] = useState<Record<string, AttStatus>>({});
  const [existingRecords, setExistingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('mark');

  useEffect(() => {
    fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(d.data || []));
  }, []);

  useEffect(() => {
    if (!classId) { setSections([]); setSectionId(''); return; }
    fetch(`/api/sections?classId=${classId}&limit=100`).then(r => r.json()).then(d => setSections(d.data || []));
    setSectionId('');
  }, [classId]);

  useEffect(() => {
    if (!classId) { setStudents([]); setRecords({}); return; }
    setLoading(true);
    const params = new URLSearchParams({ currentClassId: classId, limit: '200' });
    if (sectionId) params.set('currentSectionId', sectionId);
    fetch(`/api/students?${params}`).then(r => r.json()).then(d => {
      const studs = d.data || [];
      setStudents(studs);
      const init: Record<string, AttStatus> = {};
      studs.forEach((s: any) => { init[s.id] = 'Present'; });
      setRecords(init);
    }).catch(() => notifications.show({ color: 'red', message: 'Failed to load students' }))
      .finally(() => setLoading(false));
  }, [classId, sectionId]);

  useEffect(() => {
    if (!classId || !date) return;
    const dateStr = date.toISOString().split('T')[0];
    fetch(`/api/attendance?classId=${classId}&date=${dateStr}`).then(r => r.json()).then(d => {
      const existing = d.data || [];
      setExistingRecords(existing);
      if (existing.length > 0) {
        const merged: Record<string, AttStatus> = {};
        existing.forEach((r: any) => { merged[r.studentId] = r.status; });
        setRecords(prev => ({ ...prev, ...merged }));
      }
    }).catch(() => {});
  }, [classId, date]);

  const setAll = (status: AttStatus) => {
    const next: Record<string, AttStatus> = {};
    students.forEach(s => { next[s.id] = status; });
    setRecords(next);
  };

  const handleSave = async () => {
    if (!classId || students.length === 0) return;
    setSaving(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const attendanceRecords = students.map(s => ({ studentId: s.id, status: records[s.id] || 'Present', remarks: '' }));
      const res = await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: dateStr, classId, sectionId: sectionId || null, attendanceRecords }) });
      const data = await res.json();
      if (!data.success && !data.message?.includes('success')) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: `Attendance saved for ${students.length} students` });
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const stats = {
    present: Object.values(records).filter(s => s === 'Present').length,
    absent: Object.values(records).filter(s => s === 'Absent').length,
    late: Object.values(records).filter(s => s === 'Late').length,
    leave: Object.values(records).filter(s => s === 'Leave').length,
  };
  const pct = students.length ? Math.round((stats.present / students.length) * 100) : 0;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Attendance</Text>
          <Text size="sm" c="dimmed">Mark and track daily student attendance</Text>
        </Box>
        <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving} disabled={students.length === 0}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Save Attendance
        </Button>
      </Group>

      {/* Filters */}
      <Card shadow="xs" radius="md" p="md" mb="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group gap="sm" wrap="wrap">
          <Select
            label="Class" placeholder="Select class"
            data={classes.map(c => ({ value: c.id, label: c.name }))}
            value={classId} onChange={v => setClassId(v || '')} w={160} radius="md"
          />
          <Select
            label="Section" placeholder="All sections"
            data={[{ value: '', label: 'All sections' }, ...sections.map(s => ({ value: s.id, label: `Section ${s.name}` }))]}
            value={sectionId} onChange={v => setSectionId(v || '')} w={160} radius="md"
            disabled={sections.length === 0}
          />
          <DatePickerInput label="Date" value={date} onChange={d => d && setDate(d)} radius="md" w={160} />
        </Group>
      </Card>

      {/* Stats */}
      {students.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
          {[
            { label: 'Present', value: stats.present, color: '#10b981' },
            { label: 'Absent', value: stats.absent, color: '#ef4444' },
            { label: 'Late', value: stats.late, color: '#f59e0b' },
            { label: 'Leave', value: stats.leave, color: '#3b82f6' },
          ].map(s => (
            <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
              <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
              <Text size="xs" c="dimmed">{s.label}</Text>
              <Progress value={students.length ? (s.value / students.length) * 100 : 0} color={s.color} size="xs" mt={6} radius="xl" />
            </Card>
          ))}
        </SimpleGrid>
      )}

      {/* Attendance Table */}
      {!classId ? (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <IconCalendarCheck size={40} color="#cbd5e1" />
            <Text c="dimmed">Select a class to mark attendance</Text>
          </Stack>
        </Center>
      ) : loading ? (
        <Center py="xl"><Loader /></Center>
      ) : students.length === 0 ? (
        <Center py="xl"><Text c="dimmed">No students found in this class</Text></Center>
      ) : (
        <>
          <Group justify="space-between" mb="sm">
            <Text size="sm" c="dimmed">{students.length} students · {pct}% attendance rate</Text>
            <Group gap={6}>
              <Text size="xs" c="dimmed">Mark all:</Text>
              {STATUS_OPTS.map(s => (
                <Button key={s} size="xs" variant="light" color={STATUS_CONFIG[s].color} onClick={() => setAll(s)}>{s}</Button>
              ))}
            </Group>
          </Group>

          <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
            <Table highlightOnHover>
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Student</Table.Th>
                  <Table.Th>Roll No</Table.Th>
                  {STATUS_OPTS.map(s => <Table.Th key={s} style={{ textAlign: 'center' }}>{s}</Table.Th>)}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {students.map((stu, idx) => {
                  const status = records[stu.id] || 'Present';
                  return (
                    <Table.Tr key={stu.id} style={{ background: status === 'Absent' ? '#fff5f5' : status === 'Late' ? '#fffbeb' : undefined }}>
                      <Table.Td><Text size="sm" c="dimmed">{idx + 1}</Text></Table.Td>
                      <Table.Td>
                        <Group gap={8}>
                          <Box style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {stu.firstName?.charAt(0)}
                          </Box>
                          <Box>
                            <Text size="sm" fw={500}>{stu.fullName || `${stu.firstName} ${stu.lastName}`}</Text>
                            <Text size="xs" c="dimmed">{stu.admissionNumber}</Text>
                          </Box>
                        </Group>
                      </Table.Td>
                      <Table.Td><Text size="sm">{stu.rollNumber || '—'}</Text></Table.Td>
                      {STATUS_OPTS.map(s => (
                        <Table.Td key={s} style={{ textAlign: 'center' }}>
                          <Checkbox
                            checked={status === s}
                            onChange={() => setRecords(prev => ({ ...prev, [stu.id]: s }))}
                            color={STATUS_CONFIG[s].color}
                            radius="xl"
                          />
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>

          <Group justify="flex-end" mt="md">
            <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving}
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              Save Attendance ({students.length} students)
            </Button>
          </Group>
        </>
      )}
    </Box>
  );
}
