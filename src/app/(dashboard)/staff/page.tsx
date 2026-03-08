'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, Avatar, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center, SimpleGrid,
  Divider, Tabs, Textarea,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconUserPlus, IconSearch, IconEdit, IconTrash, IconEye,
  IconRefresh, IconUsers, IconCheck, IconX,
  IconChevronLeft, IconChevronRight, IconBuilding, IconPhone,
  IconMail, IconCalendar,
} from '@tabler/icons-react';

const EMPTY_FORM: any = {
  firstName: '', lastName: '', gender: '', dateOfBirth: '',
  phone: '', email: '', designation: 'Teacher', joiningDate: new Date().toISOString().split('T')[0],
  employmentType: 'Permanent', qualification: '', experienceYears: '0',
  address: '', city: '', departmentId: '',
};

const STATUS_COLOR: any = { active: 'green', inactive: 'gray', terminated: 'red' };

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [deptFilter, setDeptFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [viewStaff, setViewStaff] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (key: string, value: string) => setForm((prev: any) => ({ ...prev, [key]: value }));

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ search: debouncedSearch, departmentId: deptFilter, page: String(page), limit: String(LIMIT) });
      const res = await fetch(`/api/staff?${p}`);
      const data = await res.json();
      if (data.success) { setStaff(data.data); setTotal(data.total); }
    } catch { notifications.show({ title: 'Failed to load staff', message: '', color: 'red' }); }
    finally { setLoading(false); }
  }, [debouncedSearch, deptFilter, page]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  useEffect(() => {
    fetch('/api/departments?limit=100').then(r => r.json()).then(d => setDepartments(d.data || []));
  }, []);

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.gender || !form.dateOfBirth || !form.email || !form.phone) {
      notifications.show({ title: 'Fill required fields', message: 'First name, last name, gender, DOB, email and phone are required', color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/staff/${editId}` : '/api/staff';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      notifications.show({ title: editId ? 'Staff updated' : 'Staff added', message: `${form.firstName} ${form.lastName}`, color: 'green', icon: <IconCheck size={16} /> });
      closeForm(); setForm({ ...EMPTY_FORM }); setEditId(null); loadStaff();
    } catch (e: any) {
      notifications.show({ title: 'Save failed', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/staff/${deleteId}`, { method: 'DELETE' });
      notifications.show({ title: 'Staff removed', message: '', color: 'green' });
      setDeleteId(null); closeDelete(); loadStaff();
    } catch { notifications.show({ title: 'Delete failed', message: '', color: 'red' }); }
  };

  const startEdit = (s: any) => {
    setForm({ ...EMPTY_FORM, ...s, dateOfBirth: s.dateOfBirth?.split('T')[0] || '', joiningDate: s.joiningDate?.split('T')[0] || '', departmentId: s.departmentId || '', experienceYears: String(s.experienceYears || 0) });
    setEditId(s.id);
    openForm();
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box style={{ padding: '16px 20px 40px' }}>
      <Group justify="space-between" mb="md">
        <Box>
          <Text style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Staff & HR</Text>
          <Text size="sm" c="dimmed">{total} staff members</Text>
        </Box>
        <Group gap={8}>
          <Tooltip label="Refresh"><ActionIcon variant="light" onClick={loadStaff} size="md" radius="md"><IconRefresh size={16} /></ActionIcon></Tooltip>
          <Button leftSection={<IconUserPlus size={16} />} onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); openForm(); }}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }} radius="md">
            Add Staff
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Box style={{ background: 'white', borderRadius: 12, padding: '12px 16px', border: '1.5px solid #f1f5f9', marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextInput leftSection={<IconSearch size={14} color="#94a3b8" />} placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }} size="sm" radius="md"
          rightSection={search ? <ActionIcon size="xs" variant="subtle" onClick={() => setSearch('')}><IconX size={12} /></ActionIcon> : null} />
        <Select placeholder="All Departments" value={deptFilter} onChange={v => setDeptFilter(v || '')}
          data={[{ label: 'All Departments', value: '' }, ...departments.map(d => ({ label: d.name, value: d.id }))]}
          size="sm" radius="md" style={{ width: 200 }} clearable />
      </Box>

      {/* Table */}
      <Box style={{ background: 'white', borderRadius: 12, border: '1.5px solid #f1f5f9', overflow: 'hidden' }}>
        <Box style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px 140px 120px 80px 120px', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          {['', 'Staff Member', 'Employee Code', 'Department', 'Phone', 'Status', 'Actions'].map(h => (
            <Text key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</Text>
          ))}
        </Box>

        {loading ? (
          <Center py={60}><Loader size="sm" /></Center>
        ) : staff.length === 0 ? (
          <Center py={60} style={{ flexDirection: 'column', gap: 8 }}>
            <IconUsers size={40} color="#e2e8f0" />
            <Text c="dimmed" size="sm">No staff found</Text>
          </Center>
        ) : (
          staff.map((s, i) => (
            <Box key={s.id}
              style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px 140px 120px 80px 120px', padding: '10px 16px', borderBottom: i < staff.length - 1 ? '1px solid #f8fafc' : 'none', alignItems: 'center', transition: 'background 150ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <Avatar size={32} radius="xl" color="teal" style={{ fontWeight: 700, fontSize: 12 }}>
                {(s.firstName?.[0] || '') + (s.lastName?.[0] || '')}
              </Avatar>
              <Box>
                <Text style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{s.firstName} {s.lastName}</Text>
                <Text size="11px" c="dimmed">{s.designation}</Text>
              </Box>
              <Text style={{ fontSize: 12, fontFamily: 'monospace', color: '#475569' }}>{s.employeeCode}</Text>
              <Badge size="sm" variant="light" color="teal">{s.department?.name || '—'}</Badge>
              <Text style={{ fontSize: 12, color: '#475569' }}>{s.phone}</Text>
              <Badge size="xs" color={s.isActive !== false ? 'green' : 'gray'}>{s.isActive !== false ? 'active' : 'inactive'}</Badge>
              <Group gap={4}>
                <Tooltip label="View"><ActionIcon size="sm" variant="light" color="blue" onClick={() => { setViewStaff(s); openView(); }}><IconEye size={13} /></ActionIcon></Tooltip>
                <Tooltip label="Edit"><ActionIcon size="sm" variant="light" color="green" onClick={() => startEdit(s)}><IconEdit size={13} /></ActionIcon></Tooltip>
                <Tooltip label="Delete"><ActionIcon size="sm" variant="light" color="red" onClick={() => { setDeleteId(s.id); openDelete(); }}><IconTrash size={13} /></ActionIcon></Tooltip>
              </Group>
            </Box>
          ))
        )}

        {totalPages > 1 && (
          <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
            <Text size="12px" c="dimmed">Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}</Text>
            <Group gap={4}>
              <ActionIcon size="sm" variant="light" disabled={page === 1} onClick={() => setPage(p => p - 1)}><IconChevronLeft size={13} /></ActionIcon>
              <ActionIcon size="sm" variant="light" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><IconChevronRight size={13} /></ActionIcon>
            </Group>
          </Box>
        )}
      </Box>

      {/* Form Modal */}
      <Modal opened={formOpened} onClose={() => { closeForm(); setEditId(null); setForm({ ...EMPTY_FORM }); }}
        title={<Text fw={700} size="lg">{editId ? 'Edit Staff Member' : 'Add New Staff'}</Text>}
        size="xl" radius="lg" centered>
        <Tabs defaultValue="personal">
          <Tabs.List mb="md">
            <Tabs.Tab value="personal">Personal</Tabs.Tab>
            <Tabs.Tab value="employment">Employment</Tabs.Tab>
            <Tabs.Tab value="contact">Contact</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="personal">
            <Grid gutter="sm">
              <Grid.Col span={6}><TextInput label="First Name *" value={form.firstName} onChange={e => f('firstName', e.target.value)} size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Last Name *" value={form.lastName} onChange={e => f('lastName', e.target.value)} size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><Select label="Gender *" value={form.gender} onChange={v => f('gender', v || '')} data={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }]} size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)} size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Qualification" value={form.qualification} onChange={e => f('qualification', e.target.value)} placeholder="e.g. M.Ed, B.Sc" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Years of Experience" type="number" value={form.experienceYears} onChange={e => f('experienceYears', e.target.value)} size="sm" radius="md" /></Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="employment">
            <Grid gutter="sm">
              <Grid.Col span={6}><TextInput label="Designation" value={form.designation} onChange={e => f('designation', e.target.value)} placeholder="e.g. Teacher, HOD" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><Select label="Employment Type" value={form.employmentType} onChange={v => f('employmentType', v || 'Permanent')} data={['Permanent', 'Contract', 'Part-time', 'Probation'].map(v => ({ label: v, value: v }))} size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><Select label="Department" value={form.departmentId} onChange={v => f('departmentId', v || '')} data={departments.map(d => ({ label: d.name, value: d.id }))} size="sm" radius="md" clearable /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Joining Date" type="date" value={form.joiningDate} onChange={e => f('joiningDate', e.target.value)} size="sm" radius="md" /></Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="contact">
            <Grid gutter="sm">
              <Grid.Col span={6}><TextInput label="Email *" type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="email@school.com" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Phone *" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="03XX-XXXXXXX" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={12}><TextInput label="Address" value={form.address} onChange={e => f('address', e.target.value)} size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="City" value={form.city} onChange={e => f('city', e.target.value)} size="sm" radius="md" /></Grid.Col>
            </Grid>
          </Tabs.Panel>
        </Tabs>

        <Divider my="md" />
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={() => { closeForm(); setEditId(null); }} radius="md">Cancel</Button>
          <Button onClick={handleSave} loading={saving} leftSection={<IconCheck size={16} />}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }} radius="md">
            {editId ? 'Update Staff' : 'Add Staff'}
          </Button>
        </Group>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700}>Confirm Delete</Text>} size="sm" radius="lg" centered>
        <Text size="sm" c="#475569" mb="lg">This will permanently delete the staff member record.</Text>
        <Group justify="flex-end">
          <Button variant="light" color="gray" onClick={closeDelete} radius="md">Cancel</Button>
          <Button color="red" onClick={handleDelete} radius="md" leftSection={<IconTrash size={14} />}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
