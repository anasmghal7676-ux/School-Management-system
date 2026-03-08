'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Stack, SimpleGrid, PasswordInput,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconEye,
  IconRefresh, IconUser, IconLock, IconShield,
  IconChevronLeft, IconChevronRight,
} from '@tabler/icons-react';

const ROLES = ['super_admin', 'admin', 'principal', 'teacher', 'accountant', 'librarian', 'receptionist', 'parent', 'student'].map(v => ({ value: v, label: v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }));
const ROLE_COLOR: Record<string, string> = { super_admin: 'red', admin: 'orange', principal: 'violet', teacher: 'blue', accountant: 'green', librarian: 'teal', receptionist: 'gray', parent: 'pink', student: 'cyan' };

const EMPTY_FORM = { name: '', email: '', password: '', role: 'teacher' };

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (debouncedSearch) p.set('search', debouncedSearch);
      if (roleFilter) p.set('role', roleFilter);
      const res = await fetch(`/api/users?${p}`);
      const data = await res.json();
      setUsers(data.data || data.users || []);
      setTotal(data.total || 0);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load users' });
    } finally { setLoading(false); }
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || (!editId && !form.password.trim())) {
      return notifications.show({ color: 'red', message: 'Name, email and password required' });
    }
    setSaving(true);
    try {
      const url = editId ? `/api/users/${editId}` : '/api/users';
      const method = editId ? 'PATCH' : 'POST';
      const payload: any = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'User updated' : 'User created' });
      closeForm(); load();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await fetch(`/api/users/${deleteId}`, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'User deleted' });
      closeDelete(); load();
    } catch { notifications.show({ color: 'red', message: 'Delete failed' }); }
    finally { setSaving(false); }
  };

  // Count by role
  const adminCount = users.filter(u => ['super_admin', 'admin', 'principal'].includes(u.role)).length;
  const teacherCount = users.filter(u => u.role === 'teacher').length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">System Users</Text>
          <Text size="sm" c="dimmed">Manage user accounts and access</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Create User
        </Button>
      </Group>

      {/* Quick stats */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[
          { label: 'Total Users', value: total, color: '#3b82f6' },
          { label: 'Admins', value: adminCount, color: '#ef4444' },
          { label: 'Teachers', value: teacherCount, color: '#3b82f6' },
          { label: 'Others', value: total - adminCount - teacherCount, color: '#8b5cf6' },
        ].map(s => (
          <Box key={s.label} p="md" style={{ border: '1px solid #f1f5f9', borderRadius: 12, background: 'white' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Box>
        ))}
      </SimpleGrid>

      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <Select data={[{ value: '', label: 'All Roles' }, ...ROLES]} value={roleFilter} onChange={v => setRoleFilter(v || '')} w={180} radius="md" clearable />
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>

      {loading ? <Center py="xl"><Loader /></Center> : (
        <>
          <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
            <Table highlightOnHover>
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map(usr => (
                  <Table.Tr key={usr.id}>
                    <Table.Td>
                      <Group gap={8}>
                        <Box style={{ width: 32, height: 32, borderRadius: '50%', background: `var(--mantine-color-${ROLE_COLOR[usr.role] || 'blue'}-6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {(usr.name || usr.email || '?').charAt(0).toUpperCase()}
                        </Box>
                        <Text size="sm" fw={600}>{usr.name || '—'}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{usr.email}</Text></Table.Td>
                    <Table.Td><Badge color={ROLE_COLOR[usr.role] || 'gray'} variant="light" size="sm">{usr.role?.replace(/_/g, ' ')}</Badge></Table.Td>
                    <Table.Td><Badge color={usr.isActive !== false ? 'green' : 'gray'} variant="light" size="sm">{usr.isActive !== false ? 'Active' : 'Inactive'}</Badge></Table.Td>
                    <Table.Td><Text size="xs" c="dimmed">{usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : '—'}</Text></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(usr.id); setForm({ name: usr.name || '', email: usr.email || '', password: '', role: usr.role || 'teacher' }); openForm(); }}><IconEdit size={14} /></ActionIcon></Tooltip>
                        <Tooltip label="Delete"><ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(usr.id); openDelete(); }}><IconTrash size={14} /></ActionIcon></Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {users.length === 0 && (
                  <Table.Tr><Table.Td colSpan={6}><Center py="xl"><Text c="dimmed">No users found</Text></Center></Table.Td></Table.Tr>
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
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit User' : 'Create User'}</Text>} radius="md" size="sm">
        <Stack gap="sm">
          <TextInput label="Full Name" value={form.name} onChange={e => f('name', e.target.value)} required />
          <TextInput label="Email" value={form.email} onChange={e => f('email', e.target.value)} type="email" required />
          <Select label="Role" data={ROLES} value={form.role} onChange={v => f('role', v || 'teacher')} />
          <PasswordInput label={editId ? 'New Password (leave blank to keep)' : 'Password'} value={form.password} onChange={e => f('password', e.target.value)} required={!editId} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete User</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">This will permanently delete the user account.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete User</Button>
        </Group>
      </Modal>
    </Box>
  );
}
