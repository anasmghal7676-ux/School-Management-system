'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, TextInput, Button, Modal, Grid, ActionIcon, Loader, Center, Table, Stack, Select, Textarea, SimpleGrid, Card } from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconSearch, IconMessageReport, IconRefresh } from '@tabler/icons-react';

const CATEGORIES = ['Academic', 'Facility', 'Staff', 'Transport', 'Fees', 'Canteen', 'Safety', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const EMPTY = { title: '', category: 'Academic', priority: 'Medium', status: 'Open', description: '', complainantName: '', complainantType: 'parent', response: '' };

export default function ComplaintsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '100' });
      if (debouncedSearch) p.set('search', debouncedSearch);
      if (statusFilter) p.set('status', statusFilter);
      const res = await fetch(`/api/complaints?${p}`);
      const data = await res.json();
      setItems(data.data || []);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [debouncedSearch, statusFilter]);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.title.trim()) return notifications.show({ color: 'red', message: 'Title required' });
    setSaving(true);
    try {
      const url = editId ? `/api/complaints/${editId}` : '/api/complaints';
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Complaint filed' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  const PRIORITY_COLOR: Record<string, string> = { Low: 'gray', Medium: 'yellow', High: 'orange', Critical: 'red' };
  const STATUS_COLOR: Record<string, string> = { Open: 'red', 'In Progress': 'yellow', Resolved: 'green', Closed: 'gray' };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Complaints</Text><Text size="sm" c="dimmed">Track and resolve complaints</Text></Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>File Complaint</Button>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {STATUSES.map(s => ({ label: s, value: items.filter(i => i.status === s).length, color: STATUS_COLOR[s] })).map(st => (
          <Card key={st.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => setStatusFilter(statusFilter === st.label ? '' : st.label)}>
            <Text size="xl" fw={700} c={st.color}>{st.value}</Text>
            <Text size="xs" c="dimmed">{st.label}</Text>
          </Card>
        ))}
      </SimpleGrid>
      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <Select data={[{ value: '', label: 'All Status' }, ...STATUSES.map(v => ({ value: v, label: v }))]} value={statusFilter} onChange={v => setStatusFilter(v || '')} w={150} radius="md" />
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr><Table.Th>Complaint</Table.Th><Table.Th>Category</Table.Th><Table.Th>Priority</Table.Th><Table.Th>Complainant</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map(item => (
                <Table.Tr key={item.id}>
                  <Table.Td><Text size="sm" fw={500} lineClamp={1}>{item.title}</Text></Table.Td>
                  <Table.Td><Badge variant="light" size="sm">{item.category}</Badge></Table.Td>
                  <Table.Td><Badge color={PRIORITY_COLOR[item.priority] || 'gray'} variant="light" size="sm">{item.priority}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{item.complainantName || '—'}</Text></Table.Td>
                  <Table.Td><Badge color={STATUS_COLOR[item.status] || 'gray'} variant="filled" size="sm">{item.status}</Badge></Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(item.id); setForm({ title: item.title || '', category: item.category || 'Academic', priority: item.priority || 'Medium', status: item.status || 'Open', description: item.description || '', complainantName: item.complainantName || '', complainantType: item.complainantType || 'parent', response: item.response || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
              {items.length === 0 && <Table.Tr><Table.Td colSpan={6}><Center py="xl"><Stack align="center" gap="xs"><IconMessageReport size={40} color="#cbd5e1" /><Text c="dimmed">No complaints filed</Text></Stack></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Complaint' : 'File Complaint'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <TextInput label="Title" value={form.title} onChange={e => f('title', e.target.value)} required />
          <Grid>
            <Grid.Col span={6}><Select label="Category" data={CATEGORIES.map(v => ({ value: v, label: v }))} value={form.category} onChange={v => f('category', v || 'Academic')} /></Grid.Col>
            <Grid.Col span={6}><Select label="Priority" data={PRIORITIES.map(v => ({ value: v, label: v }))} value={form.priority} onChange={v => f('priority', v || 'Medium')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={7}><TextInput label="Complainant Name" value={form.complainantName} onChange={e => f('complainantName', e.target.value)} /></Grid.Col>
            <Grid.Col span={5}><Select label="Type" data={['parent','student','staff','visitor'].map(v => ({ value: v, label: v }))} value={form.complainantType} onChange={v => f('complainantType', v || 'parent')} /></Grid.Col>
          </Grid>
          <Textarea label="Description" value={form.description} onChange={e => f('description', e.target.value)} rows={3} />
          {editId && <><Select label="Status" data={STATUSES.map(v => ({ value: v, label: v }))} value={form.status} onChange={v => f('status', v || 'Open')} /><Textarea label="Response / Resolution" value={form.response} onChange={e => f('response', e.target.value)} rows={2} /></>}
          <Group justify="flex-end" mt="sm"><Button variant="default" onClick={closeForm}>Cancel</Button><Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'File'}</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
