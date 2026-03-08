'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, TextInput, Button, Modal, Grid, ActionIcon, Loader, Center, Table, Stack, Select, Textarea, SimpleGrid, Card } from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconSearch, IconEdit, IconRefresh, IconHeartHandshake } from '@tabler/icons-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const EMPTY = { studentId: '', bloodGroup: 'O+', allergies: '', medicalConditions: '', medications: '', emergencyContact: '', emergencyPhone: '', notes: '' };

export default function MedicalPage() {
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
      const res = await fetch(`/api/student-health?${p}`);
      const data = await res.json();
      setRecords(data.data || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }, [debouncedSearch]);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.studentId) return notifications.show({ color: 'red', message: 'Select a student' });
    setSaving(true);
    try {
      const url = editId ? `/api/student-health/${editId}` : '/api/student-health';
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Record saved' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Student Medical Records</Text><Text size="sm" c="dimmed">Health information and medical history</Text></Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Add Record</Button>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[{ label: 'Total Records', value: records.length, color: '#3b82f6' },
          { label: 'With Allergies', value: records.filter(r => r.allergies).length, color: '#f59e0b' },
          { label: 'On Medication', value: records.filter(r => r.medications).length, color: '#8b5cf6' },
          { label: 'Special Conditions', value: records.filter(r => r.medicalConditions).length, color: '#ef4444' }].map(s => (
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
              <Table.Tr><Table.Th>Student</Table.Th><Table.Th>Blood Group</Table.Th><Table.Th>Allergies</Table.Th><Table.Th>Medications</Table.Th><Table.Th>Emergency Contact</Table.Th><Table.Th>Actions</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Text size="sm" fw={500}>{r.student?.fullName || r.student?.firstName || '—'}</Text></Table.Td>
                  <Table.Td><Badge color="red" variant="filled" size="sm">{r.bloodGroup || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm" c={r.allergies ? 'orange' : 'dimmed'}>{r.allergies || 'None'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c={r.medications ? 'violet' : 'dimmed'}>{r.medications || 'None'}</Text></Table.Td>
                  <Table.Td><Box><Text size="sm">{r.emergencyContact || '—'}</Text><Text size="xs" c="dimmed">{r.emergencyPhone}</Text></Box></Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(r.id); setForm({ studentId: r.studentId || '', bloodGroup: r.bloodGroup || 'O+', allergies: r.allergies || '', medicalConditions: r.medicalConditions || '', medications: r.medications || '', emergencyContact: r.emergencyContact || '', emergencyPhone: r.emergencyPhone || '', notes: r.notes || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
              {records.length === 0 && <Table.Tr><Table.Td colSpan={6}><Center py="xl"><Stack align="center" gap="xs"><IconHeartHandshake size={40} color="#cbd5e1" /><Text c="dimmed">No medical records yet</Text></Stack></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Medical Record' : 'Add Medical Record'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Select label="Student" data={students.map(s => ({ value: s.id, label: s.fullName || `${s.firstName} ${s.lastName}` }))} value={form.studentId} onChange={v => f('studentId', v || '')} required searchable />
          <Select label="Blood Group" data={BLOOD_GROUPS.map(v => ({ value: v, label: v }))} value={form.bloodGroup} onChange={v => f('bloodGroup', v || 'O+')} />
          <TextInput label="Allergies" value={form.allergies} onChange={e => f('allergies', e.target.value)} placeholder="e.g. Peanuts, Dust" />
          <Textarea label="Medical Conditions" value={form.medicalConditions} onChange={e => f('medicalConditions', e.target.value)} rows={2} />
          <TextInput label="Current Medications" value={form.medications} onChange={e => f('medications', e.target.value)} />
          <Grid>
            <Grid.Col span={7}><TextInput label="Emergency Contact" value={form.emergencyContact} onChange={e => f('emergencyContact', e.target.value)} /></Grid.Col>
            <Grid.Col span={5}><TextInput label="Phone" value={form.emergencyPhone} onChange={e => f('emergencyPhone', e.target.value)} /></Grid.Col>
          </Grid>
          <Textarea label="Additional Notes" value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} />
          <Group justify="flex-end" mt="sm"><Button variant="default" onClick={closeForm}>Cancel</Button><Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Save'}</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
