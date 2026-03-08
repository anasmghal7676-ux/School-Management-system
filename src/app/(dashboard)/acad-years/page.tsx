'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, Button, Modal, Grid,
  ActionIcon, Tooltip, Loader, Center, Card, Stack,
  SimpleGrid, Switch, Divider,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconEdit, IconTrash, IconRefresh,
  IconCalendar, IconCheck, IconStar, IconSchool,
} from '@tabler/icons-react';

const EMPTY_FORM = {
  name: '', startDate: null as Date | null, endDate: null as Date | null,
  isCurrent: false, schoolId: 'school_main',
};

export default function AcademicYearsPage() {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const loadYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/academic-years');
      const data = await res.json();
      setYears(data.data || []);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load academic years' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadYears(); }, [loadYears]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      return notifications.show({ color: 'red', message: 'Name, start and end dates are required' });
    }
    setSaving(true);
    try {
      const url = editId ? `/api/academic-years/${editId}` : '/api/academic-years';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, startDate: form.startDate?.toISOString(), endDate: form.endDate?.toISOString() }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Academic year created' });
      closeForm();
      loadYears();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await fetch(`/api/academic-years/${deleteId}`, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'Deleted' });
      closeDelete(); loadYears();
    } catch { notifications.show({ color: 'red', message: 'Delete failed' }); }
    finally { setSaving(false); }
  };

  const currentYear = years.find(y => y.isCurrent);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Academic Years</Text>
          <Text size="sm" c="dimmed">Manage school academic year periods</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          New Academic Year
        </Button>
      </Group>

      {currentYear && (
        <Card shadow="xs" radius="md" p="md" mb="xl" style={{ border: '2px solid #3b82f6', background: 'linear-gradient(135deg, #eff6ff, #eef2ff)' }}>
          <Group>
            <Box style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <IconStar size={22} />
            </Box>
            <Box>
              <Group gap={8}>
                <Text fw={700} size="lg">{currentYear.name}</Text>
                <Badge color="blue" size="sm">Current Year</Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {currentYear.startDate ? new Date(currentYear.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '?'} —{' '}
                {currentYear.endDate ? new Date(currentYear.endDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '?'}
              </Text>
            </Box>
            <Box ml="auto">
              <Text size="sm" c="dimmed">{currentYear._count?.exams || 0} exams · {currentYear._count?.feeStructures || 0} fee structures</Text>
            </Box>
          </Group>
        </Card>
      )}

      {loading ? <Center py="xl"><Loader /></Center> : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} gap="md">
          {years.map(yr => (
            <Card key={yr.id} shadow="xs" radius="md" p="md" style={{ border: `1px solid ${yr.isCurrent ? '#93c5fd' : '#f1f5f9'}` }}>
              <Group justify="space-between" mb="sm">
                <Group gap={8}>
                  <Box style={{ width: 36, height: 36, borderRadius: 9, background: yr.isCurrent ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: yr.isCurrent ? 'white' : '#64748b' }}>
                    <IconCalendar size={16} />
                  </Box>
                  <Box>
                    <Text fw={600} size="sm">{yr.name}</Text>
                    {yr.isCurrent && <Badge color="blue" size="xs" variant="light">Current</Badge>}
                  </Box>
                </Group>
                <Group gap={4}>
                  <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(yr.id); setForm({ name: yr.name, startDate: yr.startDate ? new Date(yr.startDate) : null, endDate: yr.endDate ? new Date(yr.endDate) : null, isCurrent: yr.isCurrent || false, schoolId: 'school_main' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(yr.id); openDelete(); }}><IconTrash size={14} /></ActionIcon>
                </Group>
              </Group>
              <Stack gap={4}>
                <Group gap={6}>
                  <Text size="xs" c="dimmed">Start:</Text>
                  <Text size="xs" fw={500}>{yr.startDate ? new Date(yr.startDate).toLocaleDateString() : '—'}</Text>
                </Group>
                <Group gap={6}>
                  <Text size="xs" c="dimmed">End:</Text>
                  <Text size="xs" fw={500}>{yr.endDate ? new Date(yr.endDate).toLocaleDateString() : '—'}</Text>
                </Group>
              </Stack>
              <Divider my="xs" />
              <Group gap={16}>
                <Box><Text size="xs" c="dimmed">Exams</Text><Text size="sm" fw={600}>{yr._count?.exams || 0}</Text></Box>
                <Box><Text size="xs" c="dimmed">Fee Structures</Text><Text size="sm" fw={600}>{yr._count?.feeStructures || 0}</Text></Box>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Academic Year' : 'New Academic Year'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <TextInput label="Year Name" placeholder="e.g. 2024-2025" value={form.name} onChange={e => f('name', e.target.value)} required />
          <Grid>
            <Grid.Col span={6}><DatePickerInput label="Start Date" value={form.startDate} onChange={v => f('startDate', v)} required /></Grid.Col>
            <Grid.Col span={6}><DatePickerInput label="End Date" value={form.endDate} onChange={v => f('endDate', v)} required /></Grid.Col>
          </Grid>
          <Switch label="Set as current academic year" checked={form.isCurrent} onChange={e => f('isCurrent', e.currentTarget.checked)} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Academic Year</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this academic year permanently?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
