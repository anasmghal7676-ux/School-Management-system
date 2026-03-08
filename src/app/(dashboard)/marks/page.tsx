'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, Select, Button, Loader, Center,
  Table, Card, Stack, SimpleGrid, NumberInput, ActionIcon,
  Tooltip, Progress,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconRefresh, IconCheck, IconX, IconClipboardList } from '@tabler/icons-react';

export default function MarksPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [examId, setExamId] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<any>(null);

  useEffect(() => {
    fetch('/api/exams').then(r => r.json()).then(d => setExams(d.data?.exams || d.data || []));
    fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(d.data || []));
  }, []);

  useEffect(() => {
    if (!examId) { setSchedules([]); setScheduleId(''); return; }
    fetch(`/api/exam-schedules?examId=${examId}&limit=100`).then(r => r.json()).then(d => {
      setSchedules(d.data || d.schedules || []);
    }).catch(() => setSchedules([]));
  }, [examId]);

  useEffect(() => {
    if (!scheduleId) { setStudents([]); setMarks({}); setCurrentSchedule(null); return; }
    const sch = schedules.find((s: any) => s.id === scheduleId);
    setCurrentSchedule(sch);
    const cId = sch?.classId || classId;
    if (!cId) return;
    setLoading(true);
    // Load students and existing marks in parallel
    Promise.all([
      fetch(`/api/students?currentClassId=${cId}&limit=200`).then(r => r.json()),
      fetch(`/api/marks?scheduleId=${scheduleId}`).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([studsRes, marksRes]) => {
      const studs = studsRes.data || [];
      setStudents(studs);
      const existingMarks: Record<string, number> = {};
      (marksRes.data || []).forEach((m: any) => { existingMarks[m.studentId] = m.marksObtained ?? m.marks ?? 0; });
      const initMarks: Record<string, number> = {};
      studs.forEach((s: any) => { initMarks[s.id] = existingMarks[s.id] ?? 0; });
      setMarks(initMarks);
    }).finally(() => setLoading(false));
  }, [scheduleId, schedules, classId]);

  const handleSave = async () => {
    if (!scheduleId || students.length === 0) return;
    setSaving(true);
    try {
      const marksData = students.map(s => ({
        studentId: s.id, examScheduleId: scheduleId,
        marksObtained: marks[s.id] ?? 0,
        isAbsent: false,
      }));
      const res = await fetch('/api/marks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ marks: marksData }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: `Marks saved for ${students.length} students` });
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const maxMarks = currentSchedule?.maxMarks || 100;
  const passMarks = currentSchedule?.passMarks || 40;
  const passCount = Object.values(marks).filter(m => m >= passMarks).length;
  const avgMark = students.length ? Math.round(Object.values(marks).reduce((s, m) => s + m, 0) / students.length) : 0;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Mark Entry</Text>
          <Text size="sm" c="dimmed">Enter and manage exam marks</Text>
        </Box>
        <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving} disabled={students.length === 0}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Save Marks
        </Button>
      </Group>

      {/* Selectors */}
      <Card shadow="xs" radius="md" p="md" mb="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group gap="sm" wrap="wrap">
          <Select label="Exam" placeholder="Select exam" data={exams.map(e => ({ value: e.id, label: e.name }))} value={examId} onChange={v => setExamId(v || '')} w={220} radius="md" searchable />
          <Select label="Subject / Schedule" placeholder="Select subject" data={schedules.map((s: any) => ({ value: s.id, label: `${s.subject?.name || 'Subject'} — ${s.class?.name || 'Class'}` }))} value={scheduleId} onChange={v => setScheduleId(v || '')} w={280} radius="md" disabled={!examId || schedules.length === 0} />
        </Group>
      </Card>

      {/* Stats */}
      {students.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
          {[
            { label: 'Students', value: students.length, color: '#3b82f6' },
            { label: 'Passed', value: passCount, color: '#10b981' },
            { label: 'Failed', value: students.length - passCount, color: '#ef4444' },
            { label: 'Avg Marks', value: `${avgMark}/${maxMarks}`, color: '#8b5cf6' },
          ].map(s => (
            <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
              <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
              <Text size="xs" c="dimmed">{s.label}</Text>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {!scheduleId ? (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <IconClipboardList size={40} color="#cbd5e1" />
            <Text c="dimmed">Select an exam and subject schedule to enter marks</Text>
          </Stack>
        </Center>
      ) : loading ? (
        <Center py="xl"><Loader /></Center>
      ) : students.length === 0 ? (
        <Center py="xl"><Text c="dimmed">No students found for this class</Text></Center>
      ) : (
        <>
          {currentSchedule && (
            <Group mb="sm" gap="md">
              <Badge variant="light" color="violet">Max: {maxMarks}</Badge>
              <Badge variant="light" color="orange">Pass: {passMarks}</Badge>
              <Badge variant="light" color="blue">{currentSchedule.subject?.name}</Badge>
            </Group>
          )}
          <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
            <Table highlightOnHover>
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Student</Table.Th>
                  <Table.Th>Roll No</Table.Th>
                  <Table.Th>Marks Obtained</Table.Th>
                  <Table.Th>Percentage</Table.Th>
                  <Table.Th>Result</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {students.map((stu, idx) => {
                  const m = marks[stu.id] ?? 0;
                  const pct = Math.round((m / maxMarks) * 100);
                  const passed = m >= passMarks;
                  return (
                    <Table.Tr key={stu.id}>
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
                      <Table.Td>
                        <NumberInput
                          value={m}
                          onChange={v => setMarks(prev => ({ ...prev, [stu.id]: Number(v) || 0 }))}
                          min={0} max={maxMarks} step={1}
                          style={{ width: 90 }}
                          size="sm"
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group gap={8}>
                          <Progress value={pct} color={pct >= 60 ? 'green' : pct >= 40 ? 'yellow' : 'red'} size="sm" style={{ width: 60 }} radius="xl" />
                          <Text size="xs" c="dimmed">{pct}%</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={passed ? 'green' : 'red'} variant="light" size="sm" leftSection={passed ? <IconCheck size={10} /> : <IconX size={10} />}>
                          {passed ? 'Pass' : 'Fail'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>
          <Group justify="flex-end" mt="md">
            <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving}
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              Save All Marks
            </Button>
          </Group>
        </>
      )}
    </Box>
  );
}
