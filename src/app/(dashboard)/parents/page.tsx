'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Card, Stack, SimpleGrid, Textarea,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconEye,
  IconRefresh, IconUsers, IconPhone, IconMail,
  IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react';

const EMPTY_FORM = {
  firstName: '', lastName: '', phone: '', email: '',
  occupation: '', address: '', city: '',
  relation: 'Father', cnic: '',
};

export default function ParentsPage() {
  const [parents, setParents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [viewParent, setViewParent] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (debouncedSearch) p.set('search', debouncedSearch);
      const res = await fetch(`/api/parents?${p}`);
      const data = await res.json();
      setParents(data.data || []);
      setTotal(data.total || 0);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load parents' });
    } finally { setLoading(false); }
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.phone.trim()) {
      return notifications.show({ color: 'red', message: 'First name and phone required' });
    }
    setSaving(true);
    try {
      const url = editId ? `/api/parents/${editId}` : '/api/parents';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, schoolId: 'school_main' }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Updated' : 'Parent added' });
      closeForm(); load();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await fetch(`/api/parents/${deleteId}`, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'Deleted' });
      closeDelete(); load();
    } catch { notifications.show({ color: 'red', message: 'Delete failed' }); }
    finally { setSaving(false); }
  };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Parents & Guardians</Text>
          <Text size="sm" c="dimmed">Manage parent and guardian records</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Add Parent
        </Button>
      </Group>

      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 350 }} radius="md" />
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
        <Text size="sm" c="dimmed">{total} parents</Text>
      </Group>

      {loading ? <Center py="xl"><Loader /></Center> : (
        <>
          <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
            <Table highlightOnHover>
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Relation</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Children</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {parents.map(p => (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Group gap={8}>
                        <Box style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {p.firstName?.charAt(0) || '?'}
                        </Box>
                        <Box>
                          <Text size="sm" fw={600}>{p.firstName} {p.lastName}</Text>
                          {p.occupation && <Text size="xs" c="dimmed">{p.occupation}</Text>}
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td><Badge variant="light" color="blue" size="sm">{p.relation || '—'}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}><IconPhone size={12} color="#64748b" /><Text size="sm">{p.phone || '—'}</Text></Group>
                    </Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{p.email || '—'}</Text></Table.Td>
                    <Table.Td><Badge variant="outline" size="sm">{p._count?.students || p.students?.length || 0} children</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label="View"><ActionIcon variant="subtle" color="blue" size="sm" onClick={() => { setViewParent(p); openView(); }}><IconEye size={14} /></ActionIcon></Tooltip>
                        <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(p.id); setForm({ firstName: p.firstName || '', lastName: p.lastName || '', phone: p.phone || '', email: p.email || '', occupation: p.occupation || '', address: p.address || '', city: p.city || '', relation: p.relation || 'Father', cnic: p.cnic || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon></Tooltip>
                        <Tooltip label="Delete"><ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(p.id); openDelete(); }}><IconTrash size={14} /></ActionIcon></Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {parents.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6}><Center py="xl">
                    <Stack align="center" gap="xs">
                      <IconUsers size={40} color="#cbd5e1" />
                      <Text c="dimmed">No parents registered yet</Text>
                    </Stack>
                  </Center></Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Box>
          {total > LIMIT && (
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">Page {page}</Text>
              <Group gap={8}>
                <ActionIcon variant="default" disabled={page === 1} onClick={() => setPage(p => p - 1)}><IconChevronLeft size={14} /></ActionIcon>
                <ActionIcon variant="default" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}><IconChevronRight size={14} /></ActionIcon>
              </Group>
            </Group>
          )}
        </>
      )}

      {/* Form Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Parent' : 'Add Parent'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={6}><TextInput label="First Name" value={form.firstName} onChange={e => f('firstName', e.target.value)} required /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Last Name" value={form.lastName} onChange={e => f('lastName', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><TextInput label="Phone" value={form.phone} onChange={e => f('phone', e.target.value)} required /></Grid.Col>
            <Grid.Col span={6}><Select label="Relation" data={['Father', 'Mother', 'Guardian', 'Grandparent', 'Sibling'].map(v => ({ value: v, label: v }))} value={form.relation} onChange={v => f('relation', v || 'Father')} /></Grid.Col>
          </Grid>
          <TextInput label="Email" value={form.email} onChange={e => f('email', e.target.value)} type="email" />
          <Grid>
            <Grid.Col span={6}><TextInput label="Occupation" value={form.occupation} onChange={e => f('occupation', e.target.value)} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="CNIC" value={form.cnic} onChange={e => f('cnic', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={8}><TextInput label="Address" value={form.address} onChange={e => f('address', e.target.value)} /></Grid.Col>
            <Grid.Col span={4}><TextInput label="City" value={form.city} onChange={e => f('city', e.target.value)} /></Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Add'}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* View Modal */}
      <Modal opened={viewOpened} onClose={closeView} title={<Text fw={700}>Parent Details</Text>} radius="md" size="md">
        {viewParent && (
          <Stack gap="sm">
            <Group>
              <Box style={{ width: 50, height: 50, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 700 }}>
                {viewParent.firstName?.charAt(0)}
              </Box>
              <Box>
                <Text size="lg" fw={700}>{viewParent.firstName} {viewParent.lastName}</Text>
                <Badge variant="light" color="blue">{viewParent.relation || 'Guardian'}</Badge>
              </Box>
            </Group>
            <Grid>
              <Grid.Col span={6}><Text size="xs" c="dimmed">Phone</Text><Text fw={500}>{viewParent.phone || '—'}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="xs" c="dimmed">Email</Text><Text fw={500}>{viewParent.email || '—'}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="xs" c="dimmed">Occupation</Text><Text fw={500}>{viewParent.occupation || '—'}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="xs" c="dimmed">CNIC</Text><Text fw={500}>{viewParent.cnic || '—'}</Text></Grid.Col>
            </Grid>
            {viewParent.students?.length > 0 && (
              <>
                <Text size="sm" fw={600} mt="xs">Children</Text>
                {viewParent.students.map((s: any) => (
                  <Group key={s.id} gap={8} p={8} style={{ background: '#f8fafc', borderRadius: 8 }}>
                    <Text size="sm">{s.fullName || `${s.firstName} ${s.lastName}`}</Text>
                    {s.class && <Badge size="xs" variant="light">{s.class.name}</Badge>}
                  </Group>
                ))}
              </>
            )}
          </Stack>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Parent</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this parent record?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
