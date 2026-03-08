'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, TextInput, Button, Modal, Grid, ActionIcon, Loader, Center, Table, Stack, Select, Textarea, SimpleGrid, Card, NumberInput } from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconAward, IconRefresh } from '@tabler/icons-react';

const TYPES = ['Merit', 'Need-Based', 'Sports', 'Arts', 'Disability', 'Government', 'Other'];
const EMPTY = { name: '', type: 'Merit', amount: 0, percentage: 0, criteria: '', maxBeneficiaries: 0, description: '' };

export default function ScholarshipsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '100' });
      if (debouncedSearch) p.set('search', debouncedSearch);
      const res = await fetch(`/api/scholarships?${p}`);
      const data = await res.json();
      setItems(data.data || []);
    } catch { setItems([]); } finally { setLoading(false); }
  }, [debouncedSearch]);
  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return notifications.show({ color: 'red', message: 'Name required' });
    setSaving(true);
    try {
      const url = editId ? `/api/scholarships/${editId}` : '/api/scholarships';
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, schoolId: 'school_main' }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Scholarship created' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Scholarships</Text><Text size="sm" c="dimmed">Manage scholarship programs</Text></Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Add Scholarship</Button>
      </Group>
      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search scholarships..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} gap="md">
          {items.map(item => (
            <Card key={item.id} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
              <Group justify="space-between" mb="sm">
                <Group gap={8}>
                  <Box style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><IconAward size={18} /></Box>
                  <Box><Text fw={600} size="sm">{item.name}</Text><Badge size="xs" variant="light" color="yellow">{item.type}</Badge></Box>
                </Group>
                <Group gap={4}>
                  <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(item.id); setForm({ name: item.name || '', type: item.type || 'Merit', amount: item.amount || 0, percentage: item.percentage || 0, criteria: item.criteria || '', maxBeneficiaries: item.maxBeneficiaries || 0, description: item.description || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={async () => { if (!confirm('Delete?')) return; await fetch(`/api/scholarships/${item.id}`, { method: 'DELETE' }); load(); }}><IconTrash size={14} /></ActionIcon>
                </Group>
              </Group>
              <Stack gap={4}>
                {item.amount > 0 && <Text size="sm">Amount: <Text span fw={600} c="green">Rs {item.amount.toLocaleString()}</Text></Text>}
                {item.percentage > 0 && <Text size="sm">Discount: <Text span fw={600} c="blue">{item.percentage}%</Text></Text>}
                {item.criteria && <Text size="xs" c="dimmed">{item.criteria}</Text>}
                <Text size="xs" c="dimmed">Max beneficiaries: {item.maxBeneficiaries || 'Unlimited'}</Text>
              </Stack>
            </Card>
          ))}
          {items.length === 0 && <Center style={{ gridColumn: '1/-1' }} py="xl"><Stack align="center" gap="xs"><IconAward size={40} color="#cbd5e1" /><Text c="dimmed">No scholarships configured</Text></Stack></Center>}
        </SimpleGrid>
      )}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Scholarship' : 'Add Scholarship'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Grid><Grid.Col span={8}><TextInput label="Name" value={form.name} onChange={e => f('name', e.target.value)} required /></Grid.Col><Grid.Col span={4}><Select label="Type" data={TYPES.map(v => ({ value: v, label: v }))} value={form.type} onChange={v => f('type', v || 'Merit')} /></Grid.Col></Grid>
          <Grid><Grid.Col span={6}><NumberInput label="Amount (Rs)" value={form.amount} onChange={v => f('amount', Number(v))} min={0} /></Grid.Col><Grid.Col span={6}><NumberInput label="Fee % Discount" value={form.percentage} onChange={v => f('percentage', Number(v))} min={0} max={100} /></Grid.Col></Grid>
          <TextInput label="Eligibility Criteria" value={form.criteria} onChange={e => f('criteria', e.target.value)} />
          <NumberInput label="Max Beneficiaries (0 = unlimited)" value={form.maxBeneficiaries} onChange={v => f('maxBeneficiaries', Number(v))} min={0} />
          <Textarea label="Description" value={form.description} onChange={e => f('description', e.target.value)} rows={2} />
          <Group justify="flex-end" mt="sm"><Button variant="default" onClick={closeForm}>Cancel</Button><Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Create'}</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
