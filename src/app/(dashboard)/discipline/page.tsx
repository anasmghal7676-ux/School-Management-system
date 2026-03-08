'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, TextInput, Button, Modal, Grid, ActionIcon, Loader, Center, Table, Stack, Select, Textarea, SimpleGrid, Card } from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconSearch, IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

const INCIDENTS = ['Late Arrival', 'Misconduct', 'Bullying', 'Vandalism', 'Cheating', 'Absenteeism', 'Disrespect', 'Other'];
const ACTIONS = ['Warning', 'Parent Notification', 'Detention', 'Suspension', 'Expulsion', 'Counseling'];
const EMPTY = { studentId: '', incidentType: 'Misconduct', actionTaken: 'Warning', date: new Date().toISOString().split('T')[0], description: '', staffId: '' };

export default function DisciplinePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { fetch('/api/students?limit=500').then(r => r.json()).then(d => setStudents(d.data || [])); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '100' });
      if (debouncedSearch) p.set('search', debouncedSearch);
      const res = await fetch(`/api/discipline?${p}`);
      const data = await res.json();
      setRecords(data.data || []);
    } catch { setRecords([]); } finally { setLoading(false); }
  }, [debouncedSearch]);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.studentId) return notifications.show({ color: 'red', message: 'Select a student' });
    setSaving(true);
    try {
      const url = editId ? `/api/discipline/${editId}` : '/api/discipline';
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, schoolId: 'school_main' }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Record added' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  const ACTION_COLORS: Record<string, string> = { Warning: 'yellow', 'Parent Notification': 'orange', Detention: 'red', Suspension: 'red', Expulsion: 'red', Counseling: 'blue' };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Discipline</Text><Text size="sm" c="dimmed">Student disciplinary records and actions</Text></Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Add Record</Button>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[{ label: 'Total Records', value: records.length, color: '#3b82f6' }, { label: 'This Month', value: records.filter(r => { const d = new Date(r.date); const now = new Date(); return d.getMonth() === now.getMonth(); }).length, color: '#f59e0b' }, { label: 'Warnings', value: records.filter(r => r.actionTaken === 'Warning').length, color: '#ef4444' }, { label: 'Suspensions', value: records.filter(r => r.actionTaken === 'Suspension').length, color: '#7c3aed' }].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>
      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr><Table.Th>Student</Table.Th><Table.Th>Incident</Table.Th><Table.Th>Action Taken</Table.Th><Table.Th>Date</Table.Th><Table.Th>Description</Table.Th><Table.Th>Actions</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text size="sm" fw={500}>{r.student?.fullName || r.student?.firstName || '—'}</Text></Table.Td>
                  <Table.Td><Badge variant="light" color="orange" size="sm">{r.incidentType}</Badge></Table.Td>
                  <Table.Td><Badge color={ACTION_COLORS[r.actionTaken] || 'gray'} variant="light" size="sm">{r.actionTaken}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" lineClamp={1}>{r.description || '—'}</Text></Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(r.id); setForm({ studentId: r.studentId || '', incidentType: r.incidentType || 'Misconduct', actionTaken: r.actionTaken || 'Warning', date: r.date?.split('T')[0] || '', description: r.description || '', staffId: r.staffId || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
              {records.length === 0 && <Table.Tr><Table.Td colSpan={6}><Center py="xl"><Stack align="center" gap="xs"><IconAlertTriangle size={40} color="#cbd5e1" /><Text c="dimmed">No disciplinary records</Text></Stack></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Record' : 'Add Disciplinary Record'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Select label="Student" data={students.map(s => ({ value: s.id, label: s.fullName || `${s.firstName} ${s.lastName}` }))} value={form.studentId} onChange={v => f('studentId', v || '')} required searchable />
          <Grid><Grid.Col span={6}><Select label="Incident Type" data={INCIDENTS.map(v => ({ value: v, label: v }))} value={form.incidentType} onChange={v => f('incidentType', v || 'Misconduct')} /></Grid.Col><Grid.Col span={6}><Select label="Action Taken" data={ACTIONS.map(v => ({ value: v, label: v }))} value={form.actionTaken} onChange={v => f('actionTaken', v || 'Warning')} /></Grid.Col></Grid>
          <TextInput label="Date" type="date" value={form.date} onChange={e => f('date', e.target.value)} />
          <Textarea label="Description" value={form.description} onChange={e => f('description', e.target.value)} rows={3} />
          <Group justify="flex-end" mt="sm"><Button variant="default" onClick={closeForm}>Cancel</Button><Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Add'}</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
