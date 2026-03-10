'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, TextInput, NumberInput, Table, Stack, Progress, Select, ActionIcon, Modal, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconCalculator, IconEdit, IconCheck } from '@tabler/icons-react';

interface GradeScale { id: string; grade: string; name: string; minPercentage: number; maxPercentage: number; gradePoint: number; description?: string; }
interface Subject { name: string; marks: number; total: number; }



export default function GradeCalcPage() {
  const [scales, setScales] = useState<GradeScale[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<GradeScale | null>(null);
  const [form, setForm] = useState({ grade: '', name: '', minPercentage: 0, maxPercentage: 100, gradePoint: 0, description: '' });
  const [saving, setSaving] = useState(false);
  // Calculator state
  const [subjects, setSubjects] = useState<Subject[]>([
    { name: 'Mathematics', marks: 0, total: 100 },
    { name: 'English', marks: 0, total: 100 },
    { name: 'Science', marks: 0, total: 100 },
  ]);
  const [newSubject, setNewSubject] = useState('');

  const loadScales = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/grade-scales');
      const data = await res.json();
      if (data.success) setScales(data.data || []);
    } catch { notifications.show({ message: 'Failed to load grade scales', color: 'red' }); }
    setLoading(false);
  };

  useEffect(() => { loadScales(); }, []);

  const getGrade = (pct: number): GradeScale | null => {
    if (!scales.length) return null;
    return scales.find(s => pct >= s.minPercentage && pct <= s.maxPercentage) ||
           scales.reduce((best, s) => Math.abs(s.minPercentage - pct) < Math.abs(best.minPercentage - pct) ? s : best, scales[0]);
  };

  const totalMarks = subjects.reduce((s, sub) => s + sub.marks, 0);
  const totalMax = subjects.reduce((s, sub) => s + sub.total, 0);
  const overallPct = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
  const overallGrade = getGrade(overallPct);

  const gradeColors: any = { 'A+': '#10b981', A: '#10b981', 'A-': '#34d399', 'B+': '#3b82f6', B: '#3b82f6', 'B-': '#60a5fa', 'C+': '#f59e0b', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
  const gradeColor = (g: string) => gradeColors[g] || '#6366f1';

  const openAdd = () => { setEditItem(null); setForm({ grade: '', name: '', minPercentage: 0, maxPercentage: 100, gradePoint: 0, description: '' }); setModalOpen(true); };
  const openEdit = (s: GradeScale) => { setEditItem(s); setForm({ grade: s.grade, name: s.name, minPercentage: s.minPercentage, maxPercentage: s.maxPercentage, gradePoint: s.gradePoint, description: s.description || '' }); setModalOpen(true); };

  const saveScale = async () => {
    if (!form.grade) { notifications.show({ message: 'Grade required', color: 'red' }); return; }
    setSaving(true);
    try {
      const url = editItem ? `/api/grade-scales/${editItem.id}` : '/api/grade-scales';
      const method = editItem ? 'PUT' : 'POST';
      const body = { ...form };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: editItem ? 'Updated' : 'Created', color: 'green' }); setModalOpen(false); loadScales(); }
      else notifications.show({ message: data.message || 'Failed', color: 'red' });
    } catch { notifications.show({ message: 'Failed to save', color: 'red' }); }
    setSaving(false);
  };

  const deleteScale = async (id: string) => {
    if (!confirm('Delete this grade scale?')) return;
    try {
      const res = await fetch(`/api/grade-scales/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); loadScales(); }
    } catch { notifications.show({ message: 'Failed to delete', color: 'red' }); }
  };

  const addSubject = () => {
    if (!newSubject.trim()) return;
    setSubjects(s => [...s, { name: newSubject.trim(), marks: 0, total: 100 }]);
    setNewSubject('');
  };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="22px" fw={800} c="#0f172a">Grade Calculator</Text>
          <Text c="dimmed" size="sm">Configure grade scales and calculate student grades</Text>
        </Box>
        <Button leftSection={<IconPlus size={16}/>} onClick={openAdd}>Add Grade Scale</Button>
      </Group>

      <SimpleGrid cols={{ base: 1, lg: 2 }} gap="xl" mb="xl">
        {/* Interactive Calculator */}
        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #e2e8f0' }}>
          <Group justify="space-between" mb="lg">
            <Group gap="sm">
              <Box style={{ width: 36, height: 36, borderRadius: 8, background: '#6366f122', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCalculator size={20} color="#6366f1" />
              </Box>
              <Text fw={700} size="lg">Live Calculator</Text>
            </Group>
            {overallGrade && (
              <Badge size="xl" color={gradeColor(overallGrade.grade)} variant="filled" style={{ fontSize: 18, padding: '8px 16px' }}>
                {overallGrade.grade}
              </Badge>
            )}
          </Group>

          <Table mb="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Subject</Table.Th><Table.Th>Marks</Table.Th><Table.Th>Total</Table.Th><Table.Th>%</Table.Th><Table.Th>Grade</Table.Th><Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {subjects.map((sub, i) => {
                const pct = sub.total > 0 ? (sub.marks / sub.total) * 100 : 0;
                const g = getGrade(pct);
                return (
                  <Table.Tr key={i}>
                    <Table.Td><Text size="sm" fw={500}>{sub.name}</Text></Table.Td>
                    <Table.Td>
                      <NumberInput size="xs" min={0} max={sub.total} value={sub.marks}
                        onChange={v => setSubjects(s => s.map((x, j) => j===i ? {...x, marks: Number(v)||0} : x))}
                        style={{ width: 70 }} />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput size="xs" min={1} value={sub.total}
                        onChange={v => setSubjects(s => s.map((x, j) => j===i ? {...x, total: Number(v)||100} : x))}
                        style={{ width: 70 }} />
                    </Table.Td>
                    <Table.Td><Text size="sm" c={pct >= 50 ? 'green' : 'red'}>{pct.toFixed(1)}%</Text></Table.Td>
                    <Table.Td>{g && <Badge size="sm" color={gradeColor(g.grade)}>{g.grade}</Badge>}</Table.Td>
                    <Table.Td>
                      {subjects.length > 1 && (
                        <ActionIcon size="xs" color="red" variant="subtle" onClick={() => setSubjects(s => s.filter((_,j) => j!==i))}>
                          <IconTrash size={12}/>
                        </ActionIcon>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>

          <Group mb="md" gap="sm">
            <TextInput placeholder="Add subject…" size="xs" value={newSubject} onChange={e => setNewSubject(e.currentTarget.value)}
              onKeyDown={e => e.key === 'Enter' && addSubject()} style={{ flex: 1 }} />
            <Button size="xs" variant="light" onClick={addSubject} leftSection={<IconPlus size={12}/>}>Add</Button>
          </Group>

          <Divider mb="md" />

          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600}>Overall Performance</Text>
              <Text size="sm" fw={700} c={overallGrade ? gradeColor(overallGrade.grade) : 'dimmed'}>
                {totalMarks}/{totalMax} — {overallPct.toFixed(1)}%
              </Text>
            </Group>
            <Progress value={overallPct} color={overallPct >= 80 ? 'green' : overallPct >= 60 ? 'blue' : overallPct >= 40 ? 'yellow' : 'red'} size="lg" radius="xl" mb="sm" />
            {overallGrade && (
              <Card radius="md" p="md" style={{ background: gradeColor(overallGrade.grade) + '11', border: `1px solid ${gradeColor(overallGrade.grade)}33` }}>
                <Group justify="space-between">
                  <Box>
                    <Text fw={700} size="lg" c={gradeColor(overallGrade.grade)}>{overallGrade.grade} — {overallGrade.name}</Text>
                    {overallGrade.description && <Text size="sm" c="dimmed">{overallGrade.description}</Text>}
                  </Box>
                  <Box ta="right">
                    <Text size="xs" c="dimmed">GPA</Text>
                    <Text fw={800} size="xl" c={gradeColor(overallGrade.grade)}>{overallGrade.gradePoint.toFixed(1)}</Text>
                  </Box>
                </Group>
              </Card>
            )}
          </Box>
        </Card>

        {/* Grade Scale Summary */}
        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #e2e8f0' }}>
          <Text fw={700} size="lg" mb="lg">Grade Scale Configuration</Text>
          {loading ? <Text c="dimmed" ta="center" py="xl">Loading…</Text>
           : scales.length === 0 ? (
            <Stack align="center" gap="md" py="xl">
              <Text size="xl">📊</Text>
              <Text fw={600}>No grade scales configured</Text>
              <Text size="sm" c="dimmed" ta="center">Add grade scales to enable automatic grade calculation</Text>
              <Button size="sm" leftSection={<IconPlus size={14}/>} onClick={openAdd}>Add Grade Scale</Button>
            </Stack>
           ) : (
            <Stack gap="xs">
              {scales.map(s => (
                <Group key={s.id} justify="space-between" p="sm" style={{ borderRadius: 8, border: '1px solid #f1f5f9', background: gradeColor(s.grade) + '08' }}>
                  <Group gap="sm">
                    <Badge size="lg" color={gradeColor(s.grade)} variant="filled" style={{ width: 48, justifyContent: 'center' }}>{s.grade}</Badge>
                    <Box>
                      <Text size="sm" fw={600}>{s.name}</Text>
                      <Text size="xs" c="dimmed">{s.minPercentage}% – {s.maxPercentage}% · GPA {s.gradePoint}</Text>
                    </Box>
                  </Group>
                  <Group gap={4}>
                    <ActionIcon size="sm" variant="light" color="blue" onClick={() => openEdit(s)}><IconEdit size={14}/></ActionIcon>
                    <ActionIcon size="sm" variant="light" color="red" onClick={() => deleteScale(s.id)}><IconTrash size={14}/></ActionIcon>
                  </Group>
                </Group>
              ))}
            </Stack>
           )}
        </Card>
      </SimpleGrid>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Grade Scale' : 'Add Grade Scale'} size="sm">
        <Stack gap="sm">
          <Group gap="sm">
            <TextInput label="Grade *" placeholder="A+" value={form.grade} onChange={e => setForm(f => ({...f, grade: e.currentTarget.value}))} style={{ flex: 1 }} />
            <TextInput label="Name" placeholder="Excellent" value={form.name} onChange={e => setForm(f => ({...f, name: e.currentTarget.value}))} style={{ flex: 2 }} />
          </Group>
          <Group gap="sm">
            <NumberInput label="Min %" min={0} max={100} value={form.minPercentage} onChange={v => setForm(f => ({...f, minPercentage: Number(v)||0}))} style={{ flex: 1 }} />
            <NumberInput label="Max %" min={0} max={100} value={form.maxPercentage} onChange={v => setForm(f => ({...f, maxPercentage: Number(v)||100}))} style={{ flex: 1 }} />
            <NumberInput label="GPA" min={0} max={4} step={0.1} decimalScale={1} value={form.gradePoint} onChange={v => setForm(f => ({...f, gradePoint: Number(v)||0}))} style={{ flex: 1 }} />
          </Group>
          <TextInput label="Description" placeholder="e.g. Outstanding performance" value={form.description} onChange={e => setForm(f => ({...f, description: e.currentTarget.value}))} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveScale} loading={saving} leftSection={<IconCheck size={14}/>}>{editItem ? 'Update' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
