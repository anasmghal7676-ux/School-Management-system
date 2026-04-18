'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Card, Stack, SimpleGrid, Textarea, NumberInput,
  Tabs, Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconEdit, IconTrash, IconRefresh,
  IconCurrencyDollar, IconSchool, IconCheck, IconX,
  IconBuildingBank, IconTag,
} from '@tabler/icons-react';

const FREQ_OPTIONS = ['Monthly', 'Quarterly', 'Annually', 'One-time', 'Per-Semester'].map(v => ({ value: v, label: v }));

const EMPTY_FEE_TYPE = { name: '', code: '', description: '' };
const EMPTY_STRUCTURE = { classId: '', feeTypeId: '', amount: '', dueDate: '' };

export default function FeeStructurePage() {
  const [structures, setStructures] = useState<any[]>([]);
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [feeTypeForm, setFeeTypeForm] = useState({ ...EMPTY_FEE_TYPE });
  const [structureForm, setStructureForm] = useState({ ...EMPTY_STRUCTURE });
  const [editStructureId, setEditStructureId] = useState<string | null>(null);
  const [deleteStructureId, setDeleteStructureId] = useState<string | null>(null);
  const [tab, setTab] = useState<string | null>('structure');
  const [feeTypeOpened, { open: openFeeType, close: closeFeeType }] = useDisclosure(false);
  const [structureOpened, { open: openStructure, close: closeStructure }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const ff = (key: string, val: any) => setFeeTypeForm(p => ({ ...p, [key]: val }));
  const sf = (key: string, val: any) => setStructureForm(p => ({ ...p, [key]: val }));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const p = classFilter ? `?classId=${classFilter}` : '';
      const [structRes, feeTypeRes, classRes] = await Promise.all([
        fetch(`/api/fees/structure${p}`).then(r => r.json()),
        fetch('/api/fee-types').then(r => r.json()),
        fetch('/api/classes?limit=100').then(r => r.json()),
      ]);
      setStructures(structRes.data || []);
      setFeeTypes(feeTypeRes.data || []);
      setClasses(classRes.data || []);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load data' });
    } finally { setLoading(false); }
  }, [classFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateFeeType = async () => {
    if (!feeTypeForm.name.trim()) return notifications.show({ color: 'red', message: 'Fee type name required' });
    setSaving(true);
    try {
      const res = await fetch('/api/fee-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(feeTypeForm) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: 'Fee type created' });
      closeFeeType();
      loadData();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleStructureSubmit = async () => {
    if (!structureForm.classId || !structureForm.feeTypeId || !structureForm.amount) {
      return notifications.show({ color: 'red', message: 'Class, fee type and amount are required' });
    }
    setSaving(true);
    try {
      const url = editStructureId ? `/api/fees/structure/${editStructureId}` : '/api/fees/structure';
      const method = editStructureId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...structureForm, amount: parseFloat(structureForm.amount) }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      notifications.show({ color: 'green', message: editStructureId ? 'Updated' : 'Fee structure added' });
      closeStructure();
      loadData();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteStructureId) return;
    setSaving(true);
    try {
      await fetch(`/api/fees/structure/${deleteStructureId}`, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'Deleted' });
      closeDelete();
      loadData();
    } catch {
      notifications.show({ color: 'red', message: 'Failed to delete' });
    } finally { setSaving(false); }
  };

  const totalAmount = structures.reduce((s, str) => s + (str.amount || 0), 0);

  // Group structures by class
  const byClass = structures.reduce((acc: any, str) => {
    const key = str.class?.name || str.classId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(str);
    return acc;
  }, {});

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Fee Structure</Text>
          <Text size="sm" c="dimmed">Define fees per class and fee type</Text>
        </Box>
        <Group>
          <Button variant="default" leftSection={<IconTag size={16} />} onClick={() => { setFeeTypeForm({ ...EMPTY_FEE_TYPE }); openFeeType(); }}>
            Add Fee Type
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditStructureId(null); setStructureForm({ ...EMPTY_STRUCTURE }); openStructure(); }}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            Add Structure
          </Button>
        </Group>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, sm: 3 }} mb="xl">
        {[
          { label: 'Fee Types', value: feeTypes.length, color: '#8b5cf6', icon: <IconTag size={20} /> },
          { label: 'Structures', value: structures.length, color: '#3b82f6', icon: <IconBuildingBank size={20} /> },
          { label: 'Total/Student', value: `₨${totalAmount.toLocaleString()}`, color: '#10b981', icon: <IconCurrencyDollar size={20} /> },
        ].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Group>
              <Box style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</Box>
              <Box>
                <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
                <Text size="xs" c="dimmed">{s.label}</Text>
              </Box>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="structure">Fee Structure</Tabs.Tab>
          <Tabs.Tab value="types">Fee Types ({feeTypes.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="structure">
          <Group mb="md" gap="sm">
            <Select data={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
              value={classFilter} onChange={v => setClassFilter(v || '')} placeholder="Filter by class" w={200} radius="md" clearable />
            <ActionIcon variant="default" onClick={loadData} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          </Group>

          {loading ? <Center py="xl"><Loader /></Center> : (
            Object.keys(byClass).length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="xs">
                  <IconCurrencyDollar size={40} color="#cbd5e1" />
                  <Text c="dimmed">No fee structures defined yet</Text>
                  <Button size="sm" onClick={() => openStructure()} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Add First Structure</Button>
                </Stack>
              </Center>
            ) : (
              <Stack gap="md">
                {Object.entries(byClass).map(([className, items]: [string, any]) => (
                  <Card key={className} shadow="xs" radius="md" p={0} style={{ border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                    <Box p="sm" style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <Group justify="space-between">
                        <Group gap={8}>
                          <Box style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>
                            <IconSchool size={14} />
                          </Box>
                          <Text fw={600} size="sm">{className}</Text>
                        </Group>
                        <Text size="sm" c="dimmed">Total: <Text component="span" fw={700} c="#10b981">₨{items.reduce((s: number, i: any) => s + (i.amount || 0), 0).toLocaleString()}</Text></Text>
                      </Group>
                    </Box>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Fee Type</Table.Th>
                          <Table.Th>Amount</Table.Th>
                          <Table.Th>Due Date</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {items.map((item: any) => (
                          <Table.Tr key={item.id}>
                            <Table.Td>
                              <Group gap={8}>
                                <Badge color="violet" variant="light" size="sm">{item.feeType?.name || '—'}</Badge>
                              </Group>
                            </Table.Td>
                            <Table.Td><Text size="sm" fw={600} c="#10b981">₨{(item.amount || 0).toLocaleString()}</Text></Table.Td>
                            <Table.Td><Text size="sm">{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}</Text></Table.Td>
                            <Table.Td>
                              <Group gap={4}>
                                <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => { setEditStructureId(item.id); setStructureForm({ classId: item.classId, feeTypeId: item.feeTypeId, amount: String(item.amount), dueDate: item.dueDate ? item.dueDate.split('T')[0] : '' }); openStructure(); }}><IconEdit size={14} /></ActionIcon></Tooltip>
                                <Tooltip label="Delete"><ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteStructureId(item.id); openDelete(); }}><IconTrash size={14} /></ActionIcon></Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Card>
                ))}
              </Stack>
            )
          )}
        </Tabs.Panel>

        <Tabs.Panel value="types">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {feeTypes.map(ft => (
              <Card key={ft.id} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
                <Group justify="space-between">
                  <Group gap={8}>
                    <Box style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><IconTag size={16} /></Box>
                    <Box>
                      <Text fw={600} size="sm">{ft.name}</Text>
                      {ft.code && <Text size="xs" c="dimmed">{ft.code}</Text>}
                    </Box>
                  </Group>
                  <Badge variant="light" color="blue" size="sm">{ft._count?.feeStructures || 0} classes</Badge>
                </Group>
                {ft.description && <Text size="xs" c="dimmed" mt={8}>{ft.description}</Text>}
              </Card>
            ))}
            <Card shadow="xs" radius="md" p="md" style={{ border: '2px dashed #e2e8f0', cursor: 'pointer' }} onClick={() => { setFeeTypeForm({ ...EMPTY_FEE_TYPE }); openFeeType(); }}>
              <Center style={{ height: '100%', minHeight: 60 }}>
                <Group gap={6} c="dimmed">
                  <IconPlus size={16} />
                  <Text size="sm">Add Fee Type</Text>
                </Group>
              </Center>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      {/* Fee Type Modal */}
      <Modal opened={feeTypeOpened} onClose={closeFeeType} title={<Text fw={700}>New Fee Type</Text>} radius="md" size="sm">
        <Stack gap="sm">
          <TextInput label="Name" placeholder="e.g. Tuition Fee, Exam Fee" value={feeTypeForm.name} onChange={e => ff('name', e.target.value)} required />
          <TextInput label="Code" placeholder="TUITION" value={feeTypeForm.code} onChange={e => ff('code', e.target.value)} />
          <Textarea label="Description" value={feeTypeForm.description} onChange={e => ff('description', e.target.value)} rows={2} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeFeeType}>Cancel</Button>
            <Button loading={saving} onClick={handleCreateFeeType} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>Create</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Structure Form Modal */}
      <Modal opened={structureOpened} onClose={closeStructure} title={<Text fw={700}>{editStructureId ? 'Edit Fee' : 'Add Fee Structure'}</Text>} radius="md" size="sm">
        <Stack gap="sm">
          <Select label="Class" data={classes.map(c => ({ value: c.id, label: c.name }))} value={structureForm.classId} onChange={v => sf('classId', v || '')} required placeholder="Select class" searchable />
          <Select label="Fee Type" data={feeTypes.map(ft => ({ value: ft.id, label: ft.name }))} value={structureForm.feeTypeId} onChange={v => sf('feeTypeId', v || '')} required placeholder="Select fee type" />
          <NumberInput label="Amount (₨)" value={parseFloat(structureForm.amount) || 0} onChange={v => sf('amount', String(v))} min={0} step={100} />
          <TextInput label="Due Date" type="date" value={structureForm.dueDate} onChange={e => sf('dueDate', e.target.value)} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeStructure}>Cancel</Button>
            <Button loading={saving} onClick={handleStructureSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {editStructureId ? 'Update' : 'Add'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Fee Structure</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Are you sure you want to delete this fee structure?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
