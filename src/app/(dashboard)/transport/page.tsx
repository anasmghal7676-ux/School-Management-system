'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Card, Stack, SimpleGrid, Textarea, Tabs,
  NumberInput,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconEye,
  IconRefresh, IconBus, IconMapPin, IconUsers,
  IconChevronLeft, IconChevronRight, IconRoute,
} from '@tabler/icons-react';

const STATUS_COLOR: Record<string, string> = { Active: 'green', Inactive: 'gray', Maintenance: 'orange', Scrapped: 'red' };

const EMPTY_VEHICLE = { vehicleNumber: '', vehicleType: 'Bus', capacity: '40', driverName: '', driverPhone: '', status: 'Active', schoolId: 'school_main' };
const EMPTY_ROUTE = { name: '', routeNumber: '', startPoint: '', endPoint: '', distance: '', fare: '', schoolId: 'school_main' };

export default function TransportPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<string | null>('vehicles');
  const [vehicleForm, setVehicleForm] = useState({ ...EMPTY_VEHICLE });
  const [routeForm, setRouteForm] = useState({ ...EMPTY_ROUTE });
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null);
  const [editRouteId, setEditRouteId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'vehicle' | 'route'>('vehicle');
  const [vehicleOpened, { open: openVehicle, close: closeVehicle }] = useDisclosure(false);
  const [routeOpened, { open: openRoute, close: closeRoute }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const vf = (k: string, v: any) => setVehicleForm(p => ({ ...p, [k]: v }));
  const rf = (k: string, v: any) => setRouteForm(p => ({ ...p, [k]: v }));

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vehicleRes, routeRes] = await Promise.all([
        fetch('/api/transport/vehicles').then(r => r.json()),
        fetch('/api/transport/routes?limit=100').then(r => r.json()),
      ]);
      setVehicles(vehicleRes.data || []);
      setRoutes(routeRes.data || []);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load transport data' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleVehicleSubmit = async () => {
    if (!vehicleForm.vehicleNumber.trim()) return notifications.show({ color: 'red', message: 'Vehicle number required' });
    setSaving(true);
    try {
      const url = editVehicleId ? `/api/transport/vehicles/${editVehicleId}` : '/api/transport/vehicles';
      const method = editVehicleId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...vehicleForm, capacity: parseInt(vehicleForm.capacity) || 40 }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editVehicleId ? 'Vehicle updated' : 'Vehicle added' });
      closeVehicle();
      loadAll();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  const handleRouteSubmit = async () => {
    if (!routeForm.name.trim()) return notifications.show({ color: 'red', message: 'Route name required' });
    setSaving(true);
    try {
      const url = editRouteId ? `/api/transport/routes/${editRouteId}` : '/api/transport/routes';
      const method = editRouteId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...routeForm, distance: routeForm.distance ? parseFloat(routeForm.distance) : null, fare: routeForm.fare ? parseFloat(routeForm.fare) : null }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editRouteId ? 'Route updated' : 'Route added' });
      closeRoute();
      loadAll();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const url = deleteType === 'vehicle' ? `/api/transport/vehicles/${deleteId}` : `/api/transport/routes/${deleteId}`;
      await fetch(url, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'Deleted' });
      closeDelete();
      loadAll();
    } catch { notifications.show({ color: 'red', message: 'Delete failed' }); }
    finally { setSaving(false); }
  };

  const activeVehicles = vehicles.filter(v => v.status === 'Active').length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Transport</Text>
          <Text size="sm" c="dimmed">Manage vehicles and routes</Text>
        </Box>
        <Group>
          {tab === 'vehicles' ? (
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditVehicleId(null); setVehicleForm({ ...EMPTY_VEHICLE }); openVehicle(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Add Vehicle</Button>
          ) : (
            <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditRouteId(null); setRouteForm({ ...EMPTY_ROUTE }); openRoute(); }} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>Add Route</Button>
          )}
        </Group>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[
          { label: 'Total Vehicles', value: vehicles.length, color: '#3b82f6' },
          { label: 'Active', value: activeVehicles, color: '#10b981' },
          { label: 'Routes', value: routes.length, color: '#8b5cf6' },
          { label: 'Total Capacity', value: vehicles.reduce((s, v) => s + (v.capacity || 0), 0), color: '#f59e0b' },
        ].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="vehicles" leftSection={<IconBus size={14} />}>Vehicles ({vehicles.length})</Tabs.Tab>
          <Tabs.Tab value="routes" leftSection={<IconRoute size={14} />}>Routes ({routes.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="vehicles">
          {loading ? <Center py="xl"><Loader /></Center> : (
            <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
              <Table highlightOnHover>
                <Table.Thead style={{ background: '#f8fafc' }}>
                  <Table.Tr>
                    <Table.Th>Vehicle No.</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Driver</Table.Th>
                    <Table.Th>Capacity</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {vehicles.map(v => (
                    <Table.Tr key={v.id}>
                      <Table.Td>
                        <Group gap={8}>
                          <Box style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <IconBus size={14} />
                          </Box>
                          <Text size="sm" fw={600}>{v.vehicleNumber}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td><Badge variant="light" color="blue" size="sm">{v.vehicleType || 'Bus'}</Badge></Table.Td>
                      <Table.Td>
                        <Box>
                          <Text size="sm">{v.driverName || '—'}</Text>
                          {v.driverPhone && <Text size="xs" c="dimmed">{v.driverPhone}</Text>}
                        </Box>
                      </Table.Td>
                      <Table.Td><Text size="sm" fw={500}>{v.capacity || '—'}</Text></Table.Td>
                      <Table.Td><Badge color={STATUS_COLOR[v.status] || 'gray'} variant="light" size="sm">{v.status || 'Active'}</Badge></Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => { setEditVehicleId(v.id); setVehicleForm({ vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType || 'Bus', capacity: String(v.capacity || 40), driverName: v.driverName || '', driverPhone: v.driverPhone || '', status: v.status || 'Active', schoolId: 'school_main' }); openVehicle(); }}><IconEdit size={14} /></ActionIcon></Tooltip>
                          <Tooltip label="Delete"><ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(v.id); setDeleteType('vehicle'); openDelete(); }}><IconTrash size={14} /></ActionIcon></Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {vehicles.length === 0 && (
                    <Table.Tr><Table.Td colSpan={6}><Center py="xl"><Text c="dimmed">No vehicles added</Text></Center></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Box>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="routes">
          {loading ? <Center py="xl"><Loader /></Center> : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} gap="md">
              {routes.map(route => (
                <Card key={route.id} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
                  <Group justify="space-between" mb="xs">
                    <Group gap={8}>
                      <Box style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <IconRoute size={14} />
                      </Box>
                      <Box>
                        <Text fw={600} size="sm">{route.name}</Text>
                        {route.routeNumber && <Text size="xs" c="dimmed">#{route.routeNumber}</Text>}
                      </Box>
                    </Group>
                    <Group gap={4}>
                      <ActionIcon variant="subtle" size="sm" onClick={() => { setEditRouteId(route.id); setRouteForm({ name: route.name, routeNumber: route.routeNumber || '', startPoint: route.startPoint || '', endPoint: route.endPoint || '', distance: route.distance ? String(route.distance) : '', fare: route.fare ? String(route.fare) : '', schoolId: 'school_main' }); openRoute(); }}><IconEdit size={14} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(route.id); setDeleteType('route'); openDelete(); }}><IconTrash size={14} /></ActionIcon>
                    </Group>
                  </Group>
                  {(route.startPoint || route.endPoint) && (
                    <Group gap={4} mt={4}>
                      <IconMapPin size={12} color="#64748b" />
                      <Text size="xs" c="dimmed">{route.startPoint || '?'} → {route.endPoint || '?'}</Text>
                    </Group>
                  )}
                  <Group gap={16} mt={8}>
                    {route.distance && <Box><Text size="xs" c="dimmed">Distance</Text><Text size="sm" fw={500}>{route.distance} km</Text></Box>}
                    {route.fare && <Box><Text size="xs" c="dimmed">Fare</Text><Text size="sm" fw={500} c="#10b981">₨{route.fare}</Text></Box>}
                  </Group>
                </Card>
              ))}
              <Card shadow="xs" radius="md" p="md" style={{ border: '2px dashed #e2e8f0', cursor: 'pointer' }} onClick={() => { setEditRouteId(null); setRouteForm({ ...EMPTY_ROUTE }); openRoute(); }}>
                <Center style={{ minHeight: 80 }}>
                  <Group gap={6} c="dimmed"><IconPlus size={16} /><Text size="sm">Add Route</Text></Group>
                </Center>
              </Card>
            </SimpleGrid>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Vehicle Form Modal */}
      <Modal opened={vehicleOpened} onClose={closeVehicle} title={<Text fw={700}>{editVehicleId ? 'Edit Vehicle' : 'Add Vehicle'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={6}><TextInput label="Vehicle Number" value={vehicleForm.vehicleNumber} onChange={e => vf('vehicleNumber', e.target.value)} required placeholder="ABC-123" /></Grid.Col>
            <Grid.Col span={6}><Select label="Type" data={['Bus', 'Van', 'Car', 'Rickshaw', 'Other'].map(v => ({ value: v, label: v }))} value={vehicleForm.vehicleType} onChange={v => vf('vehicleType', v || 'Bus')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><NumberInput label="Capacity" value={parseInt(vehicleForm.capacity) || 40} onChange={v => vf('capacity', String(v))} min={1} /></Grid.Col>
            <Grid.Col span={6}><Select label="Status" data={Object.keys(STATUS_COLOR).map(v => ({ value: v, label: v }))} value={vehicleForm.status} onChange={v => vf('status', v || 'Active')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><TextInput label="Driver Name" value={vehicleForm.driverName} onChange={e => vf('driverName', e.target.value)} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Driver Phone" value={vehicleForm.driverPhone} onChange={e => vf('driverPhone', e.target.value)} /></Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeVehicle}>Cancel</Button>
            <Button loading={saving} onClick={handleVehicleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editVehicleId ? 'Update' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Route Form Modal */}
      <Modal opened={routeOpened} onClose={closeRoute} title={<Text fw={700}>{editRouteId ? 'Edit Route' : 'Add Route'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={8}><TextInput label="Route Name" value={routeForm.name} onChange={e => rf('name', e.target.value)} required /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Route No." value={routeForm.routeNumber} onChange={e => rf('routeNumber', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><TextInput label="Start Point" value={routeForm.startPoint} onChange={e => rf('startPoint', e.target.value)} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="End Point" value={routeForm.endPoint} onChange={e => rf('endPoint', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><NumberInput label="Distance (km)" value={parseFloat(routeForm.distance) || 0} onChange={v => rf('distance', String(v))} min={0} step={0.5} /></Grid.Col>
            <Grid.Col span={6}><NumberInput label="Fare (₨)" value={parseFloat(routeForm.fare) || 0} onChange={v => rf('fare', String(v))} min={0} step={100} /></Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeRoute}>Cancel</Button>
            <Button loading={saving} onClick={handleRouteSubmit} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>{editRouteId ? 'Update' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete {deleteType === 'vehicle' ? 'Vehicle' : 'Route'}</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this {deleteType} permanently?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
