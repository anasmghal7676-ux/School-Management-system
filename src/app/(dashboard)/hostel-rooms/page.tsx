'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, Select, Button, Modal, Grid, ActionIcon, Loader, Center, Table, Stack, TextInput, NumberInput, SimpleGrid, Card } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconBed } from '@tabler/icons-react';

const EMPTY = { roomNumber: '', hostelId: '', type: 'Shared', capacity: 4, floor: '1', facilities: '' };
const ROOM_TYPES = ['Single', 'Double', 'Triple', 'Shared', 'Dormitory'];

export default function HostelRoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [hostels, setHostels] = useState<any[]>([]);
  const [hostelFilter, setHostelFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { fetch('/api/hostels?limit=100').then(r => r.json()).then(d => setHostels(d.data || [])); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '200' });
      if (hostelFilter) p.set('hostelId', hostelFilter);
      const res = await fetch(`/api/hostel-rooms?${p}`);
      const data = await res.json();
      setRooms(data.data || []);
    } catch { setRooms([]); }
    finally { setLoading(false); }
  }, [hostelFilter]);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.roomNumber.trim() || !form.hostelId) return notifications.show({ color: 'red', message: 'Room number and hostel required' });
    setSaving(true);
    try {
      const url = editId ? `/api/hostel-rooms/${editId}` : '/api/hostel-rooms';
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Room added' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  const totalBeds = rooms.reduce((s, r) => s + (r.capacity || 0), 0);
  const occupiedBeds = rooms.reduce((s, r) => s + (r._count?.hostelResidents || 0), 0);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Hostel Rooms</Text><Text size="sm" c="dimmed">Room allocation and management</Text></Box>
        <Group gap="sm">
          <Select placeholder="All Hostels" data={hostels.map(h => ({ value: h.id, label: h.name }))} value={hostelFilter} onChange={v => setHostelFilter(v || '')} w={180} clearable radius="md" />
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Add Room</Button>
        </Group>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[{ label: 'Total Rooms', value: rooms.length, color: '#3b82f6' }, { label: 'Total Beds', value: totalBeds, color: '#8b5cf6' }, { label: 'Occupied', value: occupiedBeds, color: '#ef4444' }, { label: 'Available', value: totalBeds - occupiedBeds, color: '#10b981' }].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr><Table.Th>Room</Table.Th><Table.Th>Hostel</Table.Th><Table.Th>Type</Table.Th><Table.Th>Floor</Table.Th><Table.Th>Capacity</Table.Th><Table.Th>Occupied</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rooms.map(room => {
                const occ = room._count?.hostelResidents || 0;
                const cap = room.capacity || 4;
                const full = occ >= cap;
                return (
                  <Table.Tr key={room.id}>
                    <Table.Td><Group gap={6}><IconBed size={14} color="#64748b" /><Text fw={600} size="sm">{room.roomNumber}</Text></Group></Table.Td>
                    <Table.Td><Text size="sm">{room.hostel?.name || '—'}</Text></Table.Td>
                    <Table.Td><Badge variant="light" size="sm">{room.type}</Badge></Table.Td>
                    <Table.Td><Text size="sm">{room.floor}</Text></Table.Td>
                    <Table.Td><Text size="sm">{cap}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={500} c={full ? 'red' : 'inherit'}>{occ}</Text></Table.Td>
                    <Table.Td><Badge color={full ? 'red' : occ > 0 ? 'orange' : 'green'} variant="light" size="sm">{full ? 'Full' : occ > 0 ? 'Partial' : 'Available'}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(room.id); setForm({ roomNumber: room.roomNumber || '', hostelId: room.hostelId || '', type: room.type || 'Shared', capacity: room.capacity || 4, floor: room.floor || '1', facilities: room.facilities || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={async () => { if (!confirm('Delete this room?')) return; await fetch(`/api/hostel-rooms/${room.id}`, { method: 'DELETE' }); load(); }}><IconTrash size={14} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {rooms.length === 0 && <Table.Tr><Table.Td colSpan={8}><Center py="xl"><Text c="dimmed">No rooms configured</Text></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Room' : 'Add Room'}</Text>} radius="md" size="sm">
        <Stack gap="sm">
          <Select label="Hostel" data={hostels.map(h => ({ value: h.id, label: h.name }))} value={form.hostelId} onChange={v => f('hostelId', v || '')} required />
          <Grid>
            <Grid.Col span={6}><TextInput label="Room Number" value={form.roomNumber} onChange={e => f('roomNumber', e.target.value)} required /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Floor" value={form.floor} onChange={e => f('floor', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><Select label="Type" data={ROOM_TYPES.map(v => ({ value: v, label: v }))} value={form.type} onChange={v => f('type', v || 'Shared')} /></Grid.Col>
            <Grid.Col span={6}><NumberInput label="Bed Capacity" value={form.capacity} onChange={v => f('capacity', Number(v) || 4)} min={1} /></Grid.Col>
          </Grid>
          <TextInput label="Facilities" placeholder="Fan, AC, WiFi..." value={form.facilities} onChange={e => f('facilities', e.target.value)} />
          <Group justify="flex-end" mt="sm"><Button variant="default" onClick={closeForm}>Cancel</Button><Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Add'}</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
