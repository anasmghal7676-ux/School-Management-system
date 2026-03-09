'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Stack, Button, Table, Modal, TextInput, NumberInput, ActionIcon, Loader, Alert, ColorInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle } from '@tabler/icons-react';

interface GradeScale { id: string; name: string; minPercentage: number; maxPercentage: number; grade: string; gpa?: number; color?: string; }
const EMPTY = { name: '', minPercentage: 0, maxPercentage: 100, grade: '', gpa: 0, color: '#3b82f6' };

export default function Page() {
  const [records, setRecords] = useState<GradeScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<GradeScale | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/grade-scales').then(r => r.json());
      setRecords(r.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(r: GradeScale) { setEditing(r); setForm({ name: r.name, minPercentage: r.minPercentage, maxPercentage: r.maxPercentage, grade: r.grade, gpa: r.gpa || 0, color: r.color || '#3b82f6' }); setModal(true); }

  async function save() {
    if (!form.grade) { notifications.show({ message: 'Grade label is required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/grade-scales/${editing.id}` : '/api/grade-scales';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ message: 'Saved', color: 'green' }); setModal(false); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this grade scale?')) return;
    const res = await fetch(`/api/grade-scales/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Grade Scales</Text><Text size="sm" c="dimmed">Configure grading scales and GPA mapping</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Add Grade</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Grade Levels</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{records.length > 0 ? Math.max(...records.map(r => r.gpa || 0)).toFixed(1) : '—'}</Text><Text size="sm" c="dimmed">Max GPA</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{records.length > 0 ? Math.min(...records.map(r => r.minPercentage)) + '%' : '—'}</Text><Text size="sm" c="dimmed">Min Pass %</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : records.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No grade scales configured. Add your grading system.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Grade</Table.Th><Table.Th>Name</Table.Th><Table.Th>Min %</Table.Th><Table.Th>Max %</Table.Th><Table.Th>GPA</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {records.sort((a, b) => b.minPercentage - a.minPercentage).map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Badge size="lg" style={{ background: r.color || '#3b82f6', color: '#fff' }}>{r.grade}</Badge></Table.Td>
                  <Table.Td><Text fw={500}>{r.name || '—'}</Text></Table.Td>
                  <Table.Td><Text>{r.minPercentage}%</Text></Table.Td>
                  <Table.Td><Text>{r.maxPercentage}%</Text></Table.Td>
                  <Table.Td><Badge variant="light" color="violet">{r.gpa?.toFixed(1) || '—'}</Badge></Table.Td>
                  <Table.Td><Group gap="xs">
                    <ActionIcon variant="light" color="blue" onClick={() => openEdit(r)}><IconEdit size={14} /></ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon>
                  </Group></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      <Modal opened={modal} onClose={() => setModal(false)} title={editing ? 'Edit Grade Scale' : 'Add Grade Scale'} radius="md">
        <Stack gap="md">
          <TextInput label="Grade Label" placeholder="e.g. A+" value={form.grade} onChange={e => setForm((f: any) => ({ ...f, grade: e.target.value }))} required />
          <TextInput label="Name" placeholder="e.g. Excellent" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} />
          <Group grow>
            <NumberInput label="Min %" value={form.minPercentage} onChange={v => setForm((f: any) => ({ ...f, minPercentage: Number(v) }))} min={0} max={100} />
            <NumberInput label="Max %" value={form.maxPercentage} onChange={v => setForm((f: any) => ({ ...f, maxPercentage: Number(v) }))} min={0} max={100} />
          </Group>
          <NumberInput label="GPA Value" value={form.gpa} onChange={v => setForm((f: any) => ({ ...f, gpa: Number(v) }))} min={0} max={4} step={0.1} decimalScale={1} />
          <ColorInput label="Badge Color" value={form.color} onChange={v => setForm((f: any) => ({ ...f, color: v }))} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
