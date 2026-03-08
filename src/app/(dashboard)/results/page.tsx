'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, Select, Loader, Center,
  Table, Card, SimpleGrid, Stack, Progress, RingProgress,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrophy, IconTrendingUp, IconChartBar } from '@tabler/icons-react';

export default function ResultsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/exams').then(r => r.json()).then(d => setExams(d.data?.exams || d.data || []));
    fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(d.data || []));
  }, []);

  useEffect(() => {
    if (!examId) { setResults([]); return; }
    setLoading(true);
    const p = new URLSearchParams({ examId });
    if (classId) p.set('classId', classId);
    fetch(`/api/results?${p}`).then(r => r.json()).then(d => setResults(d.data || [])).catch(() => {
      // fallback: get marks
      fetch(`/api/marks?examId=${examId}${classId ? `&classId=${classId}` : ''}`).then(r => r.json()).then(d => setResults(d.data || [])).catch(() => setResults([]));
    }).finally(() => setLoading(false));
  }, [examId, classId]);

  // Aggregate by student
  const studentMap: Record<string, { student: any, total: number, max: number, subjects: any[] }> = {};
  results.forEach(r => {
    const sid = r.studentId;
    if (!studentMap[sid]) studentMap[sid] = { student: r.student, total: 0, max: 0, subjects: [] };
    studentMap[sid].total += r.marksObtained || r.marks || 0;
    studentMap[sid].max += r.examSchedule?.maxMarks || 100;
    studentMap[sid].subjects.push(r);
  });
  const rows = Object.values(studentMap).sort((a, b) => (b.total / b.max) - (a.total / a.max));
  const passCount = rows.filter(r => (r.total / r.max) >= 0.4).length;
  const avgPct = rows.length ? Math.round(rows.reduce((s, r) => s + (r.total / r.max) * 100, 0) / rows.length) : 0;

  const getGrade = (pct: number) => {
    if (pct >= 90) return { grade: 'A+', color: 'green' };
    if (pct >= 80) return { grade: 'A', color: 'teal' };
    if (pct >= 70) return { grade: 'B', color: 'blue' };
    if (pct >= 60) return { grade: 'C', color: 'yellow' };
    if (pct >= 50) return { grade: 'D', color: 'orange' };
    if (pct >= 40) return { grade: 'E', color: 'pink' };
    return { grade: 'F', color: 'red' };
  };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Exam Results</Text><Text size="sm" c="dimmed">View and analyze exam performance</Text></Box>
      </Group>
      <Group mb="xl" gap="sm">
        <Select placeholder="Select exam" data={exams.map(e => ({ value: e.id, label: e.name }))} value={examId} onChange={v => setExamId(v || '')} w={220} radius="md" searchable />
        <Select placeholder="All classes" data={classes.map(c => ({ value: c.id, label: c.name }))} value={classId} onChange={v => setClassId(v || '')} w={180} radius="md" searchable clearable />
      </Group>
      {examId && rows.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
          {[{ label: 'Total Students', value: rows.length, color: '#3b82f6' }, { label: 'Passed', value: passCount, color: '#10b981' }, { label: 'Failed', value: rows.length - passCount, color: '#ef4444' }, { label: 'Class Average', value: `${avgPct}%`, color: '#8b5cf6' }].map(s => (
            <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
              <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
              <Text size="xs" c="dimmed">{s.label}</Text>
            </Card>
          ))}
        </SimpleGrid>
      )}
      {!examId ? (
        <Center py="xl"><Stack align="center" gap="xs"><IconChartBar size={40} color="#cbd5e1" /><Text c="dimmed">Select an exam to view results</Text></Stack></Center>
      ) : loading ? <Center py="xl"><Loader /></Center> : rows.length === 0 ? (
        <Center py="xl"><Text c="dimmed">No results found for this exam</Text></Center>
      ) : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr>
                <Table.Th>Rank</Table.Th>
                <Table.Th>Student</Table.Th>
                <Table.Th>Total Marks</Table.Th>
                <Table.Th>Percentage</Table.Th>
                <Table.Th>Grade</Table.Th>
                <Table.Th>Result</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, idx) => {
                const pct = Math.round((row.total / row.max) * 100);
                const { grade, color } = getGrade(pct);
                return (
                  <Table.Tr key={row.student?.id || idx}>
                    <Table.Td>
                      {idx < 3 ? <Box style={{ width: 24, height: 24, borderRadius: '50%', background: idx === 0 ? '#fbbf24' : idx === 1 ? '#9ca3af' : '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>{idx + 1}</Box>
                        : <Text size="sm" c="dimmed">{idx + 1}</Text>}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={8}>
                        <Box style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>{row.student?.firstName?.charAt(0) || '?'}</Box>
                        <Box>
                          <Text size="sm" fw={500}>{row.student?.fullName || `${row.student?.firstName} ${row.student?.lastName}` || 'Unknown'}</Text>
                          <Text size="xs" c="dimmed">{row.student?.admissionNumber}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm" fw={600}>{row.total} / {row.max}</Text></Table.Td>
                    <Table.Td>
                      <Group gap={8}>
                        <Progress value={pct} color={pct >= 60 ? 'green' : pct >= 40 ? 'yellow' : 'red'} size="sm" style={{ width: 70 }} radius="xl" />
                        <Text size="xs" fw={500}>{pct}%</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td><Badge color={color} variant="filled" size="sm">{grade}</Badge></Table.Td>
                    <Table.Td><Badge color={pct >= 40 ? 'green' : 'red'} variant="light" size="sm">{pct >= 40 ? 'Pass' : 'Fail'}</Badge></Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
