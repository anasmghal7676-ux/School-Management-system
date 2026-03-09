'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Table, Select, ActionIcon, Loader, Alert, Modal, Stack, Avatar } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconRefresh, IconAlertCircle } from '@tabler/icons-react';

export default function Page() {
  const [records, setRecords] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ classId: '', staffId: '', role: 'class_teacher' });
  const [saving, setSaving] = useState(false);
  const [filterClass, setFilterClass] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [r, c, s] = await Promise.all([
        fetch('/api/class-teachers' + (filterClass ? `?classId=${filterClass}` : '')).then(r => r.json()),
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/staff').then(r => r.json()),
      ]);
      setRecords(r.data || []);
      setClasses(c.data || []);
      setStaff(s.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filterClass]);

  async function save() {
    if (!form.classId || !form.staffId) { notifications.show({ message: 'Class and teacher are required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/class-teachers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ title: 'Assigned', message: 'Teacher assigned to class', color: 'green' }); setModal(false); setForm({ classId: '', staffId: '', role: 'class_teacher' }); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Remove this teacher assignment?')) return;
    const res = await fetch(`/api/class-teachers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Removed', color: 'green' }); load(); }
  }

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Class Teachers</Text><Text size="sm" c="dimmed">Assign teachers to classes</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setModal(true)} radius="md">Assign Teacher</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#3b82f6">{records.length}</Text><Text size="sm" c="dimmed">Assignments</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#10b981">{classes.length}</Text><Text size="sm" c="dimmed">Classes</Text></Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}><Text size="xl" fw={700} c="#6366f1">{staff.length}</Text><Text size="sm" c="dimmed">Staff Available</Text></Card>
      </SimpleGrid>
      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group mb="md">
          <Select data={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]} value={filterClass} onChange={v => setFilterClass(v || '')} w={200} radius="md" clearable placeholder="Filter by Class" />
        </Group>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : records.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No teacher assignments found.</Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>Teacher</Table.Th><Table.Th>Class</Table.Th><Table.Th>Role</Table.Th><Table.Th>Actions</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {records.map((r: any) => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <Avatar size="sm" radius="xl" color="blue">{(r.staff?.firstName?.[0] || '?')}</Avatar>
                      <Text fw={500}>{r.staff?.firstName} {r.staff?.lastName}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Badge variant="light" color="blue">{r.class?.name || '—'}</Badge></Table.Td>
                  <Table.Td><Badge variant="light" color={r.role === 'class_teacher' ? 'green' : 'orange'}>{r.role?.replace('_', ' ') || 'Teacher'}</Badge></Table.Td>
                  <Table.Td><ActionIcon variant="light" color="red" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      <Modal opened={modal} onClose={() => setModal(false)} title="Assign Teacher to Class" radius="md">
        <Stack gap="md">
          <Select label="Class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={form.classId} onChange={v => setForm(f => ({ ...f, classId: v || '' }))} required searchable placeholder="Select class" />
          <Select label="Teacher" data={staff.map(s => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))} value={form.staffId} onChange={v => setForm(f => ({ ...f, staffId: v || '' }))} required searchable placeholder="Select teacher" />
          <Select label="Role" data={[{ value: 'class_teacher', label: 'Class Teacher' }, { value: 'subject_teacher', label: 'Subject Teacher' }, { value: 'co_teacher', label: 'Co Teacher' }]} value={form.role} onChange={v => setForm(f => ({ ...f, role: v || 'class_teacher' }))} />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Assign</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
