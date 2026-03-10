'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Text, Group, Button, TextInput, Table, Badge, ActionIcon,
  Modal, Grid, Loader, Center, Tooltip, Card, Stack,
  Textarea, Select,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconRefresh,
  IconRoute, IconBus, IconMapPin,
} from '@tabler/icons-react';

const EMPTY_FORM = {
  name: '', routeNumber: '', description: '', startPoint: '', endPoint: '',
  distance: '', estimatedTime: '', stops: '', status: 'Active',
};

export default function RoutesPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transport/routes');
      const data = await res.json();
      setRecords(data.data || data.routes || []);
    } catch {
      notifications.show({ message: 'Failed to load routes', color: 'red' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = records.filter(r =>
    !debouncedSearch ||
    r.routeName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    r.routeNumber?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); open(); };
  const openEdit = (r: any) => {
    setForm({
      name: r.routeName || '', routeNumber: r.routeNumber || '',
      description: r.description || '', startPoint: r.startingPoint || '',
      endPoint: r.endingPoint || '', distance: String(r.totalDistanceKm || ''),
      estimatedTime: '', stops: '',
      status: r.isActive ? 'Active' : 'Inactive',
    });
    setEditId(r.id);
    open();
  };

  const handleSave = async () => {
    if (!form.name || !form.routeNumber) {
      notifications.show({ message: 'Name and Route Number are required', color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/transport/routes/${editId}` : '/api/transport/routes';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeNumber: form.routeNumber,
          routeName: form.name,
          startingPoint: form.startPoint,
          endingPoint: form.endPoint,
          totalDistanceKm: Number(form.distance) || null,
          pickupTime: form.estimatedTime || null,
          description: form.description,
          isActive: form.status === 'Active',
        }),      });
      const data = await res.json();
      if (data.success !== false) {
        notifications.show({ message: editId ? 'Route updated' : 'Route added', color: 'green' });
        close(); fetchData();
      } else {
        notifications.show({ message: data.error || 'Save failed', color: 'red' });
      }
    } catch {
      notifications.show({ message: 'Save failed', color: 'red' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this route?')) return;
    try {
      await fetch(`/api/transport/routes/${id}`, { method: 'DELETE' });
      notifications.show({ message: 'Route deleted', color: 'green' });
      fetchData();
    } catch { notifications.show({ message: 'Delete failed', color: 'red' }); }
  };

  return (
    <Box p="xl" className="page-content">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="22px" fw={800} style={{ color: '#0f172a' }}>Transport Routes</Text>
          <Text c="dimmed" size="sm">Manage school bus routes and stops</Text>
        </Box>
        <Group>
          <Tooltip label="Refresh"><ActionIcon variant="light" color="blue" onClick={fetchData}><IconRefresh size={16}/></ActionIcon></Tooltip>
          <Button leftSection={<IconPlus size={16}/>} onClick={openCreate}>Add Route</Button>
        </Group>
      </Group>

      <Grid mb="md">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder p="md" radius="md">
            <Group><IconRoute size={28} color="#3b82f6"/><Box><Text fw={700} size="xl">{records.length}</Text><Text size="xs" c="dimmed">Total Routes</Text></Box></Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder p="md" radius="md">
            <Group><IconBus size={28} color="#10b981"/><Box><Text fw={700} size="xl">{records.filter(r => r.status === 'Active').length}</Text><Text size="xs" c="dimmed">Active</Text></Box></Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Card withBorder p="md" radius="md">
            <Group><IconMapPin size={28} color="#f59e0b"/><Box><Text fw={700} size="xl">{records.length}</Text><Text size="xs" c="dimmed">Configured</Text></Box></Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Card withBorder radius="md" p="md">
        <TextInput leftSection={<IconSearch size={16}/>} placeholder="Search routes..." value={search} onChange={e => setSearch(e.target.value)} mb="md" maw={300}/>
        {loading ? (
          <Center h={200}><Loader/></Center>
        ) : filtered.length === 0 ? (
          <Center h={200}><Stack align="center"><IconRoute size={40} color="#94a3b8"/><Text c="dimmed">No routes found</Text><Button leftSection={<IconPlus size={16}/>} onClick={openCreate}>Add First Route</Button></Stack></Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Route #</Table.Th><Table.Th>Name</Table.Th>
                <Table.Th>Start → End</Table.Th><Table.Th>Distance</Table.Th>
                <Table.Th>Pickup Time</Table.Th><Table.Th>Status</Table.Th><Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td><Badge variant="light" color="blue">{r.routeNumber}</Badge></Table.Td>
                  <Table.Td><Text fw={500}>{r.routeName}</Text></Table.Td>
                  <Table.Td><Text size="sm">{r.startingPoint || '—'} → {r.endingPoint || '—'}</Text></Table.Td>
                  <Table.Td>{r.totalDistanceKm ? `${r.totalDistanceKm} km` : '—'}</Table.Td>
                  <Table.Td>{r.pickupTime || '—'}</Table.Td>
                  <Table.Td><Badge color={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon variant="light" color="blue" onClick={() => openEdit(r)}><IconEdit size={15}/></ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => handleDelete(r.id)}><IconTrash size={15}/></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      <Modal opened={opened} onClose={close} title={editId ? 'Edit Route' : 'Add Route'} size="lg">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={6}><TextInput label="Route Name" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}/></Grid.Col>
            <Grid.Col span={6}><TextInput label="Route Number" required value={form.routeNumber} onChange={e => setForm(f => ({...f, routeNumber: e.target.value}))}/></Grid.Col>
            <Grid.Col span={6}><TextInput label="Start Point" value={form.startPoint} onChange={e => setForm(f => ({...f, startPoint: e.target.value}))}/></Grid.Col>
            <Grid.Col span={6}><TextInput label="End Point" value={form.endPoint} onChange={e => setForm(f => ({...f, endPoint: e.target.value}))}/></Grid.Col>
            <Grid.Col span={4}><TextInput label="Distance (km)" value={form.distance} onChange={e => setForm(f => ({...f, distance: e.target.value}))}/></Grid.Col>
            <Grid.Col span={4}><TextInput label="Pickup Time (e.g. 7:00 AM)" value={form.estimatedTime} onChange={e => setForm(f => ({...f, estimatedTime: e.target.value}))}/></Grid.Col>
            <Grid.Col span={4}><Select label="Status" value={form.status} onChange={v => setForm(f => ({...f, status: v || 'Active'}))} data={['Active', 'Inactive']}/></Grid.Col>
            <Grid.Col span={12}><Textarea label="Description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2}/></Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="sm">
            <Button variant="light" onClick={close}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Route</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
