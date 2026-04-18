'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, TextInput, Button, Modal, Grid, ActionIcon, Loader, Center, Table, Stack, Select, Textarea, SimpleGrid, Card } from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconSearch, IconRefresh, IconUserCheck, IconClock, IconCheck } from '@tabler/icons-react';

const PURPOSES = ['Meeting', 'Parent Visit', 'Delivery', 'Maintenance', 'Official', 'Other'];
const EMPTY = { visitorName: '', phone: '', address: '', purpose: 'Meeting', personToMeet: '', vehicleNumber: '', remarks: '' };

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [form, setForm] = useState({ ...EMPTY });
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '100', date: today });
      if (debouncedSearch) p.set('search', debouncedSearch);
      const res = await fetch(`/api/visitors?${p}`);
      const data = await res.json();
      setVisitors(data.data || []);
    } catch { notifications.show({ color: 'red', message: 'Failed to load' }); }
    finally { setLoading(false); }
  }, [debouncedSearch, today]);
  useEffect(() => { load(); }, [load]);

  const handleCheckIn = async () => {
    if (!form.visitorName.trim()) return notifications.show({ color: 'red', message: 'Visitor name required' });
    setSaving(true);
    try {
      const res = await fetch('/api/visitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, checkInTime: new Date().toISOString(), date: today }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: 'Visitor checked in' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await fetch(`/api/visitors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkOutTime: new Date().toISOString() }) });
      notifications.show({ color: 'green', message: 'Checked out' });
      load();
    } catch { notifications.show({ color: 'red', message: 'Failed' }); }
  };

  const inCount = visitors.filter(v => !v.checkOutTime).length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Visitor Management</Text><Text size="sm" c="dimmed">Track school visitors — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text></Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setForm({ ...EMPTY }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Check In Visitor</Button>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 3 }} mb="xl">
        {[{ label: "Today's Visitors", value: visitors.length, color: '#3b82f6' }, { label: 'Currently Inside', value: inCount, color: '#10b981' }, { label: 'Checked Out', value: visitors.length - inCount, color: '#64748b' }].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>
      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search visitors..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr><Table.Th>Visitor</Table.Th><Table.Th>Purpose</Table.Th><Table.Th>Meeting</Table.Th><Table.Th>Check In</Table.Th><Table.Th>Check Out</Table.Th><Table.Th>Status</Table.Th><Table.Th>Action</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visitors.map(v => (
                <Table.Tr key={v.id}>
                  <Table.Td>
                    <Box><Text size="sm" fw={500}>{v.visitorName}</Text><Text size="xs" c="dimmed">{v.phone || '—'}</Text></Box>
                  </Table.Td>
                  <Table.Td><Badge variant="light" size="sm" color="blue">{v.purpose || '—'}</Badge></Table.Td>
                  <Table.Td><Text size="sm">{v.personToMeet || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{v.checkOutTime ? new Date(v.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Text></Table.Td>
                  <Table.Td><Badge color={v.checkOutTime ? 'gray' : 'green'} variant="light" size="sm">{v.checkOutTime ? 'Left' : 'Inside'}</Badge></Table.Td>
                  <Table.Td>
                    {!v.checkOutTime && <ActionIcon variant="subtle" color="green" size="sm" onClick={() => handleCheckOut(v.id)}><IconCheck size={14} /></ActionIcon>}
                  </Table.Td>
                </Table.Tr>
              ))}
              {visitors.length === 0 && <Table.Tr><Table.Td colSpan={7}><Center py="xl"><Text c="dimmed">No visitors today</Text></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>Check In Visitor</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={7}><TextInput label="Visitor Name" value={form.visitorName} onChange={e => f('visitorName', e.target.value)} required /></Grid.Col>
            <Grid.Col span={5}><TextInput label="Phone" value={form.phone} onChange={e => f('phone', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><Select label="Purpose" data={PURPOSES.map(v => ({ value: v, label: v }))} value={form.purpose} onChange={v => f('purpose', v || 'Meeting')} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Meeting With" value={form.personToMeet} onChange={e => f('personToMeet', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><TextInput label="Vehicle Number" value={form.vehicleNumber} onChange={e => f('vehicleNumber', e.target.value)} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Address" value={form.address} onChange={e => f('address', e.target.value)} /></Grid.Col>
          </Grid>
          <Textarea label="Remarks" value={form.remarks} onChange={e => f('remarks', e.target.value)} rows={2} />
          <Group justify="flex-end" mt="sm"><Button variant="default" onClick={closeForm}>Cancel</Button><Button loading={saving} onClick={handleCheckIn} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Check In</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
