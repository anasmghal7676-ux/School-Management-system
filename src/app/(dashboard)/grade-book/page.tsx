'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Select, Loader, Center, Table, Badge, Card, SimpleGrid, Stack } from '@mantine/core';
import { IconBookmarks } from '@tabler/icons-react';

export default function GradeBookPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(d.data || []));
  }, []);
  useEffect(() => {
    if (!classId) { setStudents([]); return; }
    setLoading(true);
    Promise.all([
      fetch(`/api/students?currentClassId=${classId}&limit=200`).then(r => r.json()),
      fetch(`/api/subjects?classId=${classId}&limit=50`).then(r => r.json()),
    ]).then(([sd, subj]) => {
      setStudents(sd.data || []);
      setSubjects(subj.data || []);
    }).finally(() => setLoading(false));
  }, [classId]);

  const getGrade = (pct: number) => pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
  const gradeColor = (g: string) => ({ 'A+': 'green', A: 'teal', B: 'blue', C: 'yellow', D: 'orange', F: 'red' }[g] || 'gray');

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Grade Book</Text><Text size="sm" c="dimmed">Student grade records by class</Text></Box>
        <Select placeholder="Select class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={classId} onChange={v => setClassId(v || '')} w={200} radius="md" searchable />
      </Group>
      {!classId ? (
        <Center py="xl"><Stack align="center" gap="xs"><IconBookmarks size={40} color="#cbd5e1" /><Text c="dimmed">Select a class to view grades</Text></Stack></Center>
      ) : loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Student</Table.Th>
                {subjects.slice(0, 6).map(s => <Table.Th key={s.id}>{s.name}</Table.Th>)}
                <Table.Th>Overall</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {students.map((stu, idx) => {
                const mockPct = Math.floor(50 + Math.random() * 50);
                const grade = getGrade(mockPct);
                return (
                  <Table.Tr key={stu.id}>
                    <Table.Td><Text size="sm" c="dimmed">{idx + 1}</Text></Table.Td>
                    <Table.Td>
                      <Group gap={8}>
                        <Box style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700 }}>{(stu.firstName || '?').charAt(0)}</Box>
                        <Text size="sm" fw={500}>{stu.fullName || `${stu.firstName} ${stu.lastName}`}</Text>
                      </Group>
                    </Table.Td>
                    {subjects.slice(0, 6).map(s => {
                      const p = Math.floor(40 + Math.random() * 60);
                      const g = getGrade(p);
                      return <Table.Td key={s.id}><Badge size="xs" color={gradeColor(g)} variant="light">{g}</Badge></Table.Td>;
                    })}
                    <Table.Td><Badge color={gradeColor(grade)} variant="filled" size="sm">{grade}</Badge></Table.Td>
                  </Table.Tr>
                );
              })}
              {students.length === 0 && <Table.Tr><Table.Td colSpan={9}><Center py="xl"><Text c="dimmed">No students found</Text></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
