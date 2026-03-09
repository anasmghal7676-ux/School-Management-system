'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import {
  Box, Text, Group, Card, SimpleGrid, Badge, Button, Table,
  ActionIcon, Loader, Alert, Modal, Stack, TextInput, Progress,
  ThemeIcon, Tooltip, Switch,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconTrash, IconEdit, IconRefresh, IconAlertCircle,
  IconCalendar, IconCheck, IconStar, IconStarFilled,
} from '@tabler/icons-react';

const EMPTY = { name: '', startDate: '', endDate: '', description: '' };

function YearProgress({ start, end }: { start: string; end: string }) {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (!start || !end || now < s) return <Text size="xs" c="dimmed">Not started</Text>;
  if (now > e) return <Group gap="xs"><Progress value={100} color="gray" size="sm" style={{ flex: 1 }} /><Text size="xs" c="dimmed">Completed</Text></Group>;
  const pct = Math.round(((now - s) / (e - s)) * 100);
  const daysLeft = Math.ceil((e - now) / 86400000);
  return (
    <Stack gap={2}>
      <Progress value={pct} color="blue" size="sm" />
      <Text size="xs" c="dimmed">{pct}% · {daysLeft} days left</Text>
    </Stack>
  );
}

export default function AcadYearsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/academic-years').then(r => r.json());
      setRecords(r.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openAdd() { setEditId(null); setForm({ ...EMPTY }); open(); }
  function openEdit(r: any) {
    setEditId(r.id);
    setForm({ name: r.name, startDate: r.startDate?.slice(0, 10) || '', endDate: r.endDate?.slice(0, 10) || '', description: r.description || '' });
    open();
  }

  async function save() {
    if (!form.name || !form.startDate) return notifications.show({ message: 'Name and start date required', color: 'orange' });
    setSaving(true);
    try {
      const url = editId ? '/api/academic-years/' + editId : '/api/academic-years';
      const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      notifications.show({ color: 'green', message: editId ? 'Year updated' : 'Year created' });
      close(); load();
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function setAsCurrent(id: string) {
    const res = await fetch('/api/academic-years/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isCurrent: true, setAsCurrent: true }) });
    const d = await res.json();
    if (d.success) { notifications.show({ color: 'green', message: 'Set as current year!' }); load(); }
    else notifications.show({ color: 'red', message: d.error || 'Failed' });
  }

  async function del(id: string) {
    if (!confirm('Delete this academic year?')) return;
    const res = await fetch('/api/academic-years/' + id, { method: 'DELETE' });
    const d = await res.json();
    if (d.success) { notifications.show({ color: 'green', message: 'Deleted' }); load(); }
    else notifications.show({ color: 'red', message: d.error || 'Cannot delete — may have associated data' });
  }

  const current = records.find(r => r.isCurrent);
  const upcoming = records.filter(r => !r.isCurrent && r.startDate && new Date(r.startDate) > new Date());
  const past = records.filter(r => !r.isCurrent && r.endDate && new Date(r.endDate) < new Date());

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Academic Years</Text>
          <Text size="sm" c="dimmed">Manage school academic year cycles</Text>
        </Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd} radius="md">Add Year</Button>
        </Group>
      </Group>

      {current && (
        <Card shadow="xs" radius="md" p="lg" mb="xl" style={{ border: '2px solid #10b981', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
          <Group gap="md">
            <ThemeIcon size={48} radius="xl" color="green">
              <IconStarFilled size={22} />
            </ThemeIcon>
            <Box flex={1}>
              <Group gap="xs" mb={4}>
                <Text fw={700} size="lg" c="#10b981">Current Academic Year</Text>
                <Badge color="green" variant="filled" size="sm">ACTIVE</Badge>
              </Group>
              <Text fw={600}>{current.name}</Text>
              <Text size="sm" c="dimmed">
                {current.startDate ? new Date(current.startDate).toLocaleDateString() : ''} — {current.endDate ? new Date(current.endDate).toLocaleDateString() : 'Ongoing'}
              </Text>
              {current.startDate && current.endDate && (
                <Box mt="xs" style={{ maxWidth: 300 }}>
                  <YearProgress start={current.startDate} end={current.endDate} />
                </Box>
              )}
            </Box>
          </Group>
        </Card>
      )}

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
          <ThemeIcon size={40} radius="md" color="blue" variant="light" mb="sm"><IconCalendar size={20} /></ThemeIcon>
          <Text size="xl" fw={700}>{records.length}</Text><Text size="sm" c="dimmed">Total Years</Text>
        </Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
          <ThemeIcon size={40} radius="md" color="violet" variant="light" mb="sm"><IconCalendar size={20} /></ThemeIcon>
          <Text size="xl" fw={700}>{upcoming.length}</Text><Text size="sm" c="dimmed">Upcoming</Text>
        </Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
          <ThemeIcon size={40} radius="md" color="gray" variant="light" mb="sm"><IconCalendar size={20} /></ThemeIcon>
          <Text size="xl" fw={700}>{past.length}</Text><Text size="sm" c="dimmed">Past Years</Text>
        </Card>
      </SimpleGrid>

      <Card shadow="xs" radius="md" p={0} style={{ border: '1px solid #f1f5f9' }}>
        {loading ? <Group justify="center" py="xl"><Loader /></Group> : records.length === 0 ? (
          <Box p="xl"><Alert icon={<IconAlertCircle size={16} />} color="blue" radius="md">No academic years found. Add one to get started.</Alert></Box>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr>
                <Table.Th>Year Name</Table.Th><Table.Th>Start Date</Table.Th><Table.Th>End Date</Table.Th>
                <Table.Th>Progress</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((r: any) => (
                <Table.Tr key={r.id} style={r.isCurrent ? { background: '#f0fdf4' } : {}}>
                  <Table.Td>
                    <Group gap="xs">
                      {r.isCurrent && <IconStarFilled size={14} color="#10b981" />}
                      <Text fw={r.isCurrent ? 700 : 500}>{r.name}</Text>
                    </Group>
                    {r.description && <Text size="xs" c="dimmed">{r.description}</Text>}
                  </Table.Td>
                  <Table.Td><Text size="sm">{r.startDate ? new Date(r.startDate).toLocaleDateString() : '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.endDate ? new Date(r.endDate).toLocaleDateString() : 'Ongoing'}</Text></Table.Td>
                  <Table.Td style={{ minWidth: 150 }}>
                    {r.startDate && r.endDate ? <YearProgress start={r.startDate} end={r.endDate} /> : <Text size="xs" c="dimmed">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={r.isCurrent ? 'green' : new Date(r.startDate) > new Date() ? 'blue' : 'gray'} variant="light">
                      {r.isCurrent ? 'Current' : new Date(r.startDate) > new Date() ? 'Upcoming' : 'Past'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {!r.isCurrent && (
                        <Tooltip label="Set as Current">
                          <ActionIcon variant="light" color="green" size="sm" onClick={() => setAsCurrent(r.id)}><IconCheck size={14} /></ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="Edit"><ActionIcon variant="light" color="blue" size="sm" onClick={() => openEdit(r)}><IconEdit size={14} /></ActionIcon></Tooltip>
                      {!r.isCurrent && (
                        <Tooltip label="Delete"><ActionIcon variant="light" color="red" size="sm" onClick={() => del(r.id)}><IconTrash size={14} /></ActionIcon></Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Modal opened={opened} onClose={close} title={editId ? 'Edit Academic Year' : 'Add Academic Year'} radius="md">
        <Stack gap="sm">
          <TextInput label="Year Name" placeholder="e.g. 2024-2025" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Group grow>
            <TextInput label="Start Date" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
            <TextInput label="End Date" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </Group>
          <TextInput label="Description (optional)" placeholder="Notes about this year" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editId ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
