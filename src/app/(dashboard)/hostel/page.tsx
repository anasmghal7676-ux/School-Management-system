'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, Button, Tabs, Card, SimpleGrid,
  Table, ActionIcon, Tooltip, Loader, Center, Stack, Modal,
  TextInput, Select, Grid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconBuildingCommunity, IconBed, IconUsers } from '@tabler/icons-react';

export default function HostelPage() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Boys', capacity: '', wardenName: '', wardenPhone: '', address: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hostels?limit=100');
      const data = await res.json();
      setHostels(data.data || []);
    } catch { notifications.show({ color: 'red', message: 'Failed to load hostels' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return notifications.show({ color: 'red', message: 'Name required' });
    setSaving(true);
    try {
      const url = editId ? `/api/hostels/${editId}` : '/api/hostels';
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, capacity: Number(form.capacity) || 0, schoolId: 'school_main' }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Hostel created' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  const totalCapacity = hostels.reduce((s, h) => s + (h.capacity || 0), 0);
  const totalOccupied = hostels.reduce((s, h) => s + (h._count?.hostelResidents || 0), 0);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Hostel Management</Text>
          <Text size="sm" c="dimmed">Manage school hostels and residences</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ name: '', type: 'Boys', capacity: '', wardenName: '', wardenPhone: '', address: '' }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Add Hostel</Button>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        {[{ label: 'Total Hostels', value: hostels.length, icon: <IconBuildingCommunity size={20} />, color: '#3b82f6' }, { label: 'Total Capacity', value: totalCapacity, icon: <IconBed size={20} />, color: '#8b5cf6' }, { label: 'Residents', value: totalOccupied, icon: <IconUsers size={20} />, color: '#10b981' }].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Group>
              <Box style={{ width: 42, height: 42, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{s.icon}</Box>
              <Box><Text size="xl" fw={700}>{s.value}</Text><Text size="xs" c="dimmed">{s.label}</Text></Box>
            </Group>
          </Card>
        ))}
      </SimpleGrid>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} gap="md">
          {hostels.map(h => (
            <Card key={h.id} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
              <Group justify="space-between" mb="sm">
                <Group gap={8}>
                  <Box style={{ width: 36, height: 36, borderRadius: 9, background: h.type === 'Girls' ? 'linear-gradient(135deg, #ec4899, #db2777)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><IconBuildingCommunity size={18} /></Box>
                  <Box><Text fw={600}>{h.name}</Text><Badge size="xs" variant="light" color={h.type === 'Girls' ? 'pink' : 'blue'}>{h.type}</Badge></Box>
                </Group>
                <Group gap={4}>
                  <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(h.id); setForm({ name: h.name, type: h.type || 'Boys', capacity: String(h.capacity || ''), wardenName: h.wardenName || '', wardenPhone: h.wardenPhone || '', address: h.address || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(h.id); openDelete(); }}><IconTrash size={14} /></ActionIcon>
                </Group>
              </Group>
              <Stack gap={4} mt="sm">
                {h.wardenName && <Text size="sm">Warden: <Text span fw={500}>{h.wardenName}</Text></Text>}
                <Group gap={16}>
                  <Box><Text size="xs" c="dimmed">Capacity</Text><Text fw={600}>{h.capacity || 0}</Text></Box>
                  <Box><Text size="xs" c="dimmed">Rooms</Text><Text fw={600}>{h._count?.hostelRooms || 0}</Text></Box>
                  <Box><Text size="xs" c="dimmed">Residents</Text><Text fw={600}>{h._count?.hostelResidents || 0}</Text></Box>
                </Group>
              </Stack>
            </Card>
          ))}
          {hostels.length === 0 && <Center style={{ gridColumn: '1/-1' }} py="xl"><Stack align="center" gap="xs"><IconBuildingCommunity size={40} color="#cbd5e1" /><Text c="dimmed">No hostels configured yet</Text></Stack></Center>}
        </SimpleGrid>
      )}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Hostel' : 'Add Hostel'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={8}><TextInput label="Hostel Name" value={form.name} onChange={e => f('name', e.target.value)} required /></Grid.Col>
            <Grid.Col span={4}><Select label="Type" data={['Boys', 'Girls', 'Mixed'].map(v => ({ value: v, label: v }))} value={form.type} onChange={v => f('type', v || 'Boys')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><TextInput label="Warden Name" value={form.wardenName} onChange={e => f('wardenName', e.target.value)} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Warden Phone" value={form.wardenPhone} onChange={e => f('wardenPhone', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={4}><TextInput label="Capacity" type="number" value={form.capacity} onChange={e => f('capacity', e.target.value)} /></Grid.Col>
            <Grid.Col span={8}><TextInput label="Address" value={form.address} onChange={e => f('address', e.target.value)} /></Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="sm"><Button variant="default" onClick={closeForm}>Cancel</Button><Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Create'}</Button></Group>
        </Stack>
      </Modal>
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Hostel</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this hostel?</Text>
        <Group justify="flex-end"><Button variant="default" onClick={closeDelete}>Cancel</Button><Button color="red" loading={saving} onClick={async () => { setSaving(true); try { await fetch(`/api/hostels/${deleteId}`, { method: 'DELETE' }); notifications.show({ color: 'green', message: 'Deleted' }); closeDelete(); load(); } catch {} finally { setSaving(false); } }}>Delete</Button></Group>
      </Modal>
    </Box>
  );
}
