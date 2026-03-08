'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Text, Group, Badge, Avatar, TextInput, Select, Button,
  ActionIcon, Modal, SimpleGrid, Table, Pagination, Tooltip,
  Tabs, UnstyledButton, Loader, Center, Alert,
} from '@mantine/core';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconUsers,
  IconDownload, IconUpload, IconFilter, IconX, IconRefresh,
  IconUser, IconPhone, IconCalendar, IconBuilding, IconGenderBigender,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

interface ClassItem { id: string; name: string; }
interface SectionItem { id: string; name: string; classId: string; }
interface StudentForm {
  firstName: string; lastName: string; gender: string; dateOfBirth: string;
  fatherName: string; motherName: string; fatherPhone: string; phone: string;
  address: string; city: string; religion: string; bloodGroup: string;
  currentClassId: string; currentSectionId: string; rollNumber: string;
  admissionDate: string; status: string; bForm: string; academicYearId: string;
}

const EMPTY_FORM: StudentForm = {
  firstName: '', lastName: '', gender: '', dateOfBirth: '',
  fatherName: '', motherName: '', fatherPhone: '', phone: '',
  address: '', city: '', religion: 'Islam', bloodGroup: '',
  currentClassId: '', currentSectionId: '', rollNumber: '',
  admissionDate: new Date().toISOString().split('T')[0], status: 'active',
  bForm: '', academicYearId: '',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'green', inactive: 'gray', transferred: 'orange', graduated: 'blue',
};

function StudentAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const colors = ['#3b82f6','#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#14b8a6'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <Avatar size={size} radius="xl" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white', fontWeight: 700 }}>
      {name?.[0]?.toUpperCase() || '?'}
    </Avatar>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const LIMIT = 20;

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(LIMIT),
        ...(search && { search }),
        ...(classFilter && { classId: classFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data || []);
        setTotal(data.total || 0);
      }
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to load students', color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [page, search, classFilter, statusFilter]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  useEffect(() => {
    async function loadMeta() {
      const [c, s] = await Promise.all([
        fetch('/api/classes?limit=100'),
        fetch('/api/sections?limit=500'),
      ]);
      const cd = await c.json();
      const sd = await s.json();
      if (cd.success) setClasses(cd.data || []);
      if (sd.success) setSections(sd.data || []);
    }
    loadMeta();
  }, []);

  const f = (k: keyof StudentForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const formSections = sections.filter(s => s.classId === form.currentClassId);

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.gender || !form.dateOfBirth || !form.currentClassId) {
      notifications.show({ title: 'Validation', message: 'First name, last name, gender, date of birth, and class are required.', color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/students/${editId}` : '/api/students';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      notifications.show({
        title: editId ? 'Student Updated' : 'Student Added',
        message: `${form.firstName} ${form.lastName} has been ${editId ? 'updated' : 'added'} successfully.`,
        color: 'green',
      });
      closeModal();
      setForm(EMPTY_FORM);
      setEditId(null);
      loadStudents();
    } catch (e: any) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s: any) => {
    setForm({
      firstName: s.firstName || '', lastName: s.lastName || '',
      gender: s.gender || '', dateOfBirth: s.dateOfBirth?.split('T')[0] || '',
      fatherName: s.fatherName || '', motherName: s.motherName || '',
      fatherPhone: s.fatherPhone || '', phone: s.phone || '',
      address: s.address || '', city: s.city || '',
      religion: s.religion || 'Islam', bloodGroup: s.bloodGroup || '',
      currentClassId: s.currentClassId || '', currentSectionId: s.currentSectionId || '',
      rollNumber: s.rollNumber || '',
      admissionDate: s.admissionDate?.split('T')[0] || '',
      status: s.status || 'active', bForm: s.bForm || '',
      academicYearId: s.academicYearId || '',
    });
    setEditId(s.id);
    openModal();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/students/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      notifications.show({ title: 'Deleted', message: 'Student removed successfully.', color: 'green' });
      closeDelete();
      setDeleteId(null);
      loadStudents();
    } catch (e: any) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box p={{ base: 'md', lg: 'xl' }} className="page-content">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="22px" fw={800} style={{ color: '#0f172a', letterSpacing: '-0.3px' }}>
            Students
          </Text>
          <Text c="dimmed" size="sm">{total.toLocaleString()} students enrolled</Text>
        </Box>
        <Group>
          <Tooltip label="Refresh">
            <ActionIcon variant="default" size="lg" radius="lg" onClick={loadStudents}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          <Button
            leftSection={<IconPlus size={16}/>}
            onClick={() => { setForm(EMPTY_FORM); setEditId(null); openModal(); }}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
            radius="lg"
          >
            Add Student
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Box p="md" mb="lg" style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0' }}>
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Search name, admission no., phone..."
            leftSection={<IconSearch size={14} color="#94a3b8" />}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            radius="lg"
            size="sm"
            style={{ flex: 1, minWidth: 200 }}
            styles={{ input: { border: '1.5px solid #e2e8f0', background: '#f8fafc' } }}
          />
          <Select
            placeholder="All Classes"
            data={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
            value={classFilter}
            onChange={v => { setClassFilter(v || ''); setPage(1); }}
            radius="lg" size="sm" w={150}
            clearable
          />
          <Select
            placeholder="All Status"
            data={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'transferred', label: 'Transferred' },
              { value: 'graduated', label: 'Graduated' },
            ]}
            value={statusFilter}
            onChange={v => { setStatusFilter(v || ''); setPage(1); }}
            radius="lg" size="sm" w={150}
            clearable
          />
          {(search || classFilter || statusFilter) && (
            <Button
              variant="subtle" color="gray" size="sm" radius="lg"
              leftSection={<IconX size={12}/>}
              onClick={() => { setSearch(''); setClassFilter(''); setStatusFilter(''); setPage(1); }}
            >
              Clear
            </Button>
          )}
        </Group>
      </Box>

      {/* Table */}
      <Box style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <Center py={80}>
            <Loader size="sm" color="blue" />
          </Center>
        ) : students.length === 0 ? (
          <Center py={80}>
            <Box ta="center">
              <IconUsers size={48} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <Text c="dimmed" fw={500}>No students found</Text>
              <Text c="dimmed" size="sm" mt={4}>Try adjusting your search or filters</Text>
              <Button mt="md" size="sm" onClick={() => { setForm(EMPTY_FORM); setEditId(null); openModal(); }}
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none' }} radius="lg">
                Add First Student
              </Button>
            </Box>
          </Center>
        ) : (
          <Box style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Student', 'Adm. No.', 'Class', 'Gender', 'Father', 'Phone', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{ transition: 'background 100ms ease' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <Group gap={10} wrap="nowrap">
                        <StudentAvatar name={s.fullName || s.firstName} size={34} />
                        <Box miw={0}>
                          <Text size="sm" fw={600} style={{ color: '#0f172a' }} truncate>
                            {s.fullName || `${s.firstName} ${s.lastName}`}
                          </Text>
                        </Box>
                      </Group>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <Text size="xs" ff="monospace" c="dimmed">{s.admissionNumber}</Text>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <Badge variant="light" color="blue" size="sm">{s.class?.name || '—'}</Badge>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <Text size="sm" c="dimmed">{s.gender || '—'}</Text>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <Text size="sm" c="dimmed" truncate style={{ maxWidth: 130 }}>{s.fatherName || '—'}</Text>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <Text size="xs" ff="monospace" c="dimmed">{s.phone || s.fatherPhone || '—'}</Text>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <Badge
                        variant="light"
                        color={STATUS_COLORS[s.status] || 'gray'}
                        size="sm"
                        tt="capitalize"
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Edit">
                          <ActionIcon variant="subtle" color="blue" size="sm" radius="md" onClick={() => handleEdit(s)}>
                            <IconEdit size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <ActionIcon variant="subtle" color="red" size="sm" radius="md"
                            onClick={() => { setDeleteId(s.id); openDelete(); }}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box p="md" style={{ borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text size="xs" c="dimmed">
              Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}
            </Text>
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="lg" />
          </Box>
        )}
      </Box>

      {/* Add/Edit Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => { closeModal(); setForm(EMPTY_FORM); setEditId(null); }}
        title={
          <Group gap={8}>
            <Box style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconUser size={16} color="white" />
            </Box>
            <Text fw={700} size="md">{editId ? 'Edit Student' : 'Add New Student'}</Text>
          </Group>
        }
        size="xl"
        radius="xl"
        overlayProps={{ blur: 3, opacity: 0.15 }}
        styles={{
          header: { paddingBottom: 0 },
          body: { paddingTop: 16 },
        }}
      >
        <Tabs defaultValue="personal" radius="md">
          <Tabs.List mb="md">
            <Tabs.Tab value="personal" leftSection={<IconUser size={13}/>}>Personal</Tabs.Tab>
            <Tabs.Tab value="academic" leftSection={<IconBuilding size={13}/>}>Academic</Tabs.Tab>
            <Tabs.Tab value="contact" leftSection={<IconPhone size={13}/>}>Contact</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="personal">
            <SimpleGrid cols={2} spacing="sm">
              <TextInput label="First Name *" value={form.firstName} onChange={e => f('firstName', e.target.value)} placeholder="Ali" radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
              <TextInput label="Last Name *" value={form.lastName} onChange={e => f('lastName', e.target.value)} placeholder="Khan" radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
              <Select label="Gender *" data={['Male','Female','Other']} value={form.gender} onChange={v => f('gender', v||'')} radius="lg" size="sm" />
              <TextInput label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)} radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
              <Select label="Blood Group" data={['A+','A-','B+','B-','AB+','AB-','O+','O-']} value={form.bloodGroup} onChange={v => f('bloodGroup', v||'')} radius="lg" size="sm" clearable />
              <Select label="Religion" data={['Islam','Christianity','Hinduism','Other']} value={form.religion} onChange={v => f('religion', v||'')} radius="lg" size="sm" />
              <TextInput label="B-Form / CNIC" value={form.bForm} onChange={e => f('bForm', e.target.value)} placeholder="XXXXX-XXXXXXX-X" radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="academic">
            <SimpleGrid cols={2} spacing="sm">
              <Select label="Class *" data={classes.map(c => ({ value: c.id, label: c.name }))} value={form.currentClassId} onChange={v => { f('currentClassId', v||''); f('currentSectionId', ''); }} radius="lg" size="sm" searchable />
              <Select label="Section" data={formSections.map(s => ({ value: s.id, label: s.name }))} value={form.currentSectionId} onChange={v => f('currentSectionId', v||'')} radius="lg" size="sm" disabled={!form.currentClassId} />
              <TextInput label="Roll Number" value={form.rollNumber} onChange={e => f('rollNumber', e.target.value)} placeholder="e.g. 01" radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
              <TextInput label="Admission Date" type="date" value={form.admissionDate} onChange={e => f('admissionDate', e.target.value)} radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
              <Select label="Status" data={['active','inactive','transferred','graduated']} value={form.status} onChange={v => f('status', v||'active')} radius="lg" size="sm" />
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="contact">
            <SimpleGrid cols={2} spacing="sm">
              <TextInput label="Father Name" value={form.fatherName} onChange={e => f('fatherName', e.target.value)} radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
              <TextInput label="Mother Name" value={form.motherName} onChange={e => f('motherName', e.target.value)} radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
              <TextInput label="Father Phone" value={form.fatherPhone} onChange={e => f('fatherPhone', e.target.value)} placeholder="03XX-XXXXXXX" radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
              <TextInput label="Student Phone" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="03XX-XXXXXXX" radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
              <TextInput label="City" value={form.city} onChange={e => f('city', e.target.value)} radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
              <Box style={{ gridColumn: 'span 2' }}>
                <TextInput label="Address" value={form.address} onChange={e => f('address', e.target.value)} radius="lg" size="sm" styles={{ input: { border: '1.5px solid #e2e8f0' } }} />
              </Box>
            </SimpleGrid>
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" mt="xl" pt="md" style={{ borderTop: '1px solid #f1f5f9' }}>
          <Button variant="default" onClick={() => { closeModal(); setForm(EMPTY_FORM); setEditId(null); }} radius="lg">Cancel</Button>
          <Button
            onClick={handleSubmit}
            loading={saving}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', boxShadow: '0 2px 8px rgba(59,130,246,0.35)' }}
            radius="lg"
          >
            {editId ? 'Update Student' : 'Add Student'}
          </Button>
        </Group>
      </Modal>

      {/* Delete confirm */}
      <Modal opened={deleteOpen} onClose={closeDelete} title="Confirm Delete" size="sm" radius="xl" centered>
        <Text size="sm" c="dimmed" mb="xl">Are you sure you want to delete this student? This action cannot be undone.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete} radius="lg">Cancel</Button>
          <Button color="red" onClick={handleDelete} radius="lg">Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
