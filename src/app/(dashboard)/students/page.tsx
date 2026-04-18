'use client';

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
  IconFilter, IconDownload, IconRefresh, IconUsers,
  IconPhone, IconCalendar, IconSchool, IconChevronLeft, IconChevronRight,
  IconX, IconCheck, IconUpload, IconGenderMale, IconGenderFemale,
} from '@tabler/icons-react';

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string | null;
  fatherName: string | null;
  fatherPhone: string | null;
  motherName: string | null;
  address: string | null;
  city: string | null;
  religion: string | null;
  bloodGroup: string | null;
  rollNumber: string | null;
  admissionDate: string | null;
  status: string;
  currentClassId: string | null;
  currentSectionId: string | null;
  bForm: string | null;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
}

const EMPTY_FORM: Partial<Student> & Record<string, string> = {
  firstName: '', lastName: '', gender: '', dateOfBirth: '',
  phone: '', fatherName: '', motherName: '', fatherPhone: '',
  address: '', city: '', religion: 'Islam', bloodGroup: '',
  rollNumber: '', bForm: '', currentClassId: '', currentSectionId: '',
  admissionDate: new Date().toISOString().split('T')[0], status: 'active',
};

const GENDER_COLOR: Record<string, string> = {
  Male: 'blue', Female: 'pink', Other: 'gray',
};
const STATUS_COLOR: Record<string, string> = {
  active: 'green', inactive: 'gray', transferred: 'orange', graduated: 'blue',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const loadStudents = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        search: debouncedSearch, classId: classFilter,
        status: statusFilter, page: String(page), limit: String(LIMIT),
      });
      const res = await fetch(`/api/students?${p}`, { signal });
      const data = await res.json();
      if (data.success) { setStudents(data.data); setTotal(data.total); }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        notifications.show({ title: 'Failed to load students', message: '', color: 'red' });
      }
    }
    finally { setLoading(false); }
  }, [debouncedSearch, classFilter, statusFilter, page]);

  useEffect(() => {
    const controller = new AbortController();
    loadStudents(controller.signal);
    return () => controller.abort();
  }, [loadStudents]);

  useEffect(() => {
    Promise.all([
      fetch('/api/classes?limit=100').then(r => r.json()),
      fetch('/api/sections?limit=200').then(r => r.json()),
    ]).then(([c, s]) => {
      setClasses(c.data || []);
      setSections(s.data || []);
    });
  }, []);

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.gender || !form.dateOfBirth || !form.currentClassId) {
      notifications.show({ title: 'Fill all required fields', message: 'First name, last name, gender, DOB and class are required', color: 'orange' });
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/students/${editId}` : '/api/students';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      notifications.show({ title: editId ? 'Student updated' : 'Student added', message: `${form.firstName} ${form.lastName}`, color: 'green', icon: <IconCheck size={16} /> });
      closeForm();
      setForm({ ...EMPTY_FORM });
      setEditId(null);
      loadStudents();
    } catch (e: any) {
      notifications.show({ title: 'Save failed', message: e.message, color: 'red' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/students/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      notifications.show({ title: 'Student removed', message: '', color: 'green' });
      setDeleteId(null); closeDelete(); loadStudents();
    } catch { notifications.show({ title: 'Delete failed', message: '', color: 'red' }); }
  };

  const startEdit = (s: Student) => {
    setForm({
      ...EMPTY_FORM,
      ...(s as any),
      dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
      admissionDate: s.admissionDate ? s.admissionDate.split('T')[0] : '',
      currentClassId: s.currentClassId || '',
      currentSectionId: s.currentSectionId || '',
    } as typeof EMPTY_FORM);
    setEditId(s.id);
    openForm();
  };

  const formSections = sections.filter(s => s.classId === form.currentClassId);
  const totalPages = Math.ceil(total / LIMIT);

  const statsCards = [
    { label: 'Total', value: total, color: '#3b82f6' },
    { label: 'Active', value: students.filter(s => s.status === 'active').length, color: '#10b981' },
    { label: 'Male', value: students.filter(s => s.gender === 'Male').length, color: '#6366f1' },
    { label: 'Female', value: students.filter(s => s.gender === 'Female').length, color: '#ec4899' },
  ];

  return (
    <Box style={{ padding: '16px 20px 40px' }}>
      {/* Header */}
      <Group justify="space-between" mb="md" align="flex-start">
        <Box>
          <Text style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Students</Text>
          <Text size="sm" c="dimmed">{total} students enrolled</Text>
        </Box>
        <Group gap={8}>
          <Tooltip label="Refresh">
            <ActionIcon variant="light" onClick={() => loadStudents()} size="md" radius="md"><IconRefresh size={16} /></ActionIcon>
          </Tooltip>
          <Button leftSection={<IconUserPlus size={16} />} onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); openForm(); }}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none' }} radius="md">
            Add Student
          </Button>
        </Group>
      </Group>

      {/* Stats Strip */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mb="md">
        {statsCards.map(s => (
          <Box key={s.label} style={{ background: 'white', borderRadius: 10, padding: '12px 16px', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Box style={{ width: 6, height: 36, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <Box>
              <Text style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</Text>
              <Text size="11px" c="dimmed">{s.label}</Text>
            </Box>
          </Box>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Box style={{ background: 'white', borderRadius: 12, padding: '12px 16px', border: '1.5px solid #f1f5f9', marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextInput
          leftSection={<IconSearch size={14} color="#94a3b8" />}
          placeholder="Search by name, admission no..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }} size="sm" radius="md"
          rightSection={search ? <ActionIcon size="xs" variant="subtle" onClick={() => setSearch('')}><IconX size={12} /></ActionIcon> : null}
        />
        <Select
          placeholder="All Classes" value={classFilter} onChange={v => setClassFilter(v || '')}
          data={[{ label: 'All Classes', value: '' }, ...classes.map(c => ({ label: c.name, value: c.id }))]}
          size="sm" radius="md" style={{ width: 160 }} clearable
        />
        <Select
          placeholder="All Status" value={statusFilter} onChange={v => setStatusFilter(v || '')}
          data={[{ label: 'All Status', value: '' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Transferred', value: 'transferred' }, { label: 'Graduated', value: 'graduated' }]}
          size="sm" radius="md" style={{ width: 140 }} clearable
        />
        {(search || classFilter || statusFilter) && (
          <Button size="sm" variant="light" color="gray" leftSection={<IconX size={14} />} onClick={() => { setSearch(''); setClassFilter(''); setStatusFilter(''); }}>
            Clear
          </Button>
        )}
      </Box>

      {/* Table */}
      <Box style={{ background: 'white', borderRadius: 12, border: '1.5px solid #f1f5f9', overflow: 'hidden' }}>
        {/* Table Header */}
        <Box style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px 100px 120px 100px 80px 120px', padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          {['', 'Student', 'Admission No', 'Class', 'Father', 'Phone', 'Status', 'Actions'].map(h => (
            <Text key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</Text>
          ))}
        </Box>

        {loading ? (
          <Center py={60}><Loader size="sm" /></Center>
        ) : students.length === 0 ? (
          <Center py={60} style={{ flexDirection: 'column', gap: 8 }}>
            <IconUsers size={40} color="#e2e8f0" />
            <Text c="dimmed" size="sm">No students found</Text>
            <Button size="xs" variant="light" onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); openForm(); }}>
              Add First Student
            </Button>
          </Center>
        ) : (
          <>
            {students.map((student, i) => (
              <Box
                key={student.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr 120px 100px 120px 100px 80px 120px',
                  padding: '10px 16px',
                  borderBottom: i < students.length - 1 ? '1px solid #f8fafc' : 'none',
                  alignItems: 'center',
                  transition: 'background 150ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar size={32} radius="xl" color={student.gender === 'Male' ? 'blue' : 'pink'} style={{ fontWeight: 700, fontSize: 12 }}>
                  {(student.firstName?.[0] || '') + (student.lastName?.[0] || '')}
                </Avatar>
                <Box>
                  <Text style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>
                    {student.fullName || `${student.firstName} ${student.lastName}`}
                  </Text>
                  <Text size="11px" c="dimmed">{student.city || 'No city'}</Text>
                </Box>
                <Text style={{ fontSize: 12, fontFamily: 'monospace', color: '#475569' }}>{student.admissionNumber}</Text>
                <Badge size="sm" variant="light" color="blue">{student.class?.name || '—'}</Badge>
                <Text style={{ fontSize: 12, color: '#475569' }}>{student.fatherName || '—'}</Text>
                <Text style={{ fontSize: 12, color: '#475569' }}>{student.fatherPhone || student.phone || '—'}</Text>
                <Badge size="xs" color={STATUS_COLOR[student.status] || 'gray'}>{student.status}</Badge>
                <Group gap={4}>
                  <Tooltip label="View">
                    <ActionIcon size="sm" variant="light" color="blue" onClick={() => { setViewStudent(student); openView(); }}>
                      <IconEye size={13} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Edit">
                    <ActionIcon size="sm" variant="light" color="green" onClick={() => startEdit(student)}>
                      <IconEdit size={13} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <ActionIcon size="sm" variant="light" color="red" onClick={() => { setDeleteId(student.id); openDelete(); }}>
                      <IconTrash size={13} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Box>
            ))}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
            <Text size="12px" c="dimmed">Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}</Text>
            <Group gap={4}>
              <ActionIcon size="sm" variant="light" disabled={page === 1} onClick={() => setPage(p => p - 1)}><IconChevronLeft size={13} /></ActionIcon>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const p = i + 1;
                return (
                  <ActionIcon key={p} size="sm" variant={p === page ? 'filled' : 'light'} color="blue" onClick={() => setPage(p)}>
                    <Text style={{ fontSize: 11 }}>{p}</Text>
                  </ActionIcon>
                );
              })}
              <ActionIcon size="sm" variant="light" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><IconChevronRight size={13} /></ActionIcon>
            </Group>
          </Box>
        )}
      </Box>

      {/* Add/Edit Modal */}
      <Modal
        opened={formOpened} onClose={() => { closeForm(); setEditId(null); setForm({ ...EMPTY_FORM }); }}
        title={<Text fw={700} size="lg">{editId ? 'Edit Student' : 'Add New Student'}</Text>}
        size="xl" radius="lg" centered
      >
        <Tabs defaultValue="personal">
          <Tabs.List mb="md">
            <Tabs.Tab value="personal">Personal Info</Tabs.Tab>
            <Tabs.Tab value="family">Family & Contact</Tabs.Tab>
            <Tabs.Tab value="academic">Academic</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="personal">
            <Grid gutter="sm">
              <Grid.Col span={4}><TextInput label="First Name *" value={form.firstName} onChange={e => f('firstName', e.target.value)} placeholder="First name" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={4}><TextInput label="Middle Name" value={form.middleName || ''} onChange={e => f('middleName', e.target.value)} placeholder="Middle name" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={4}><TextInput label="Last Name *" value={form.lastName} onChange={e => f('lastName', e.target.value)} placeholder="Last name" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}>
                <Select label="Gender *" value={form.gender} onChange={v => f('gender', v || '')} placeholder="Select gender"
                  data={[{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }, { label: 'Other', value: 'Other' }]}
                  size="sm" radius="md" />
              </Grid.Col>
              <Grid.Col span={6}><TextInput label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)} size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}>
                <Select label="Blood Group" value={form.bloodGroup || ''} onChange={v => f('bloodGroup', v || '')} placeholder="Select"
                  data={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(v => ({ label: v, value: v }))}
                  size="sm" radius="md" clearable />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select label="Religion" value={form.religion || 'Islam'} onChange={v => f('religion', v || '')}
                  data={['Islam', 'Christianity', 'Hinduism', 'Other'].map(v => ({ label: v, value: v }))}
                  size="sm" radius="md" />
              </Grid.Col>
              <Grid.Col span={6}><TextInput label="B-Form / CNIC" value={form.bForm || ''} onChange={e => f('bForm', e.target.value)} placeholder="XXXXX-XXXXXXX-X" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Student Phone" value={form.phone || ''} onChange={e => f('phone', e.target.value)} placeholder="03XX-XXXXXXX" size="sm" radius="md" /></Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="family">
            <Grid gutter="sm">
              <Grid.Col span={6}><TextInput label="Father Name" value={form.fatherName || ''} onChange={e => f('fatherName', e.target.value)} placeholder="Father's full name" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Father Phone" value={form.fatherPhone || ''} onChange={e => f('fatherPhone', e.target.value)} placeholder="03XX-XXXXXXX" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Mother Name" value={form.motherName || ''} onChange={e => f('motherName', e.target.value)} placeholder="Mother's full name" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Mother Phone" value={form.motherPhone || ''} onChange={e => f('motherPhone', e.target.value)} placeholder="03XX-XXXXXXX" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={12}><Textarea label="Address" value={form.address || ''} onChange={e => f('address', e.target.value)} placeholder="Full address" rows={2} size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="City" value={form.city || ''} onChange={e => f('city', e.target.value)} placeholder="City" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Province" value={form.province || ''} onChange={e => f('province', e.target.value)} placeholder="Province" size="sm" radius="md" /></Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="academic">
            <Grid gutter="sm">
              <Grid.Col span={6}>
                <Select label="Class *" value={form.currentClassId} onChange={v => { f('currentClassId', v || ''); f('currentSectionId', ''); }}
                  data={classes.map(c => ({ label: c.name, value: c.id }))} placeholder="Select class" size="sm" radius="md" />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select label="Section" value={form.currentSectionId || ''} onChange={v => f('currentSectionId', v || '')}
                  data={formSections.map(s => ({ label: s.name, value: s.id }))} placeholder="Select section"
                  disabled={!form.currentClassId} size="sm" radius="md" clearable />
              </Grid.Col>
              <Grid.Col span={6}><TextInput label="Roll Number" value={form.rollNumber || ''} onChange={e => f('rollNumber', e.target.value)} placeholder="Roll number" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}><TextInput label="Admission Date" type="date" value={form.admissionDate || ''} onChange={e => f('admissionDate', e.target.value)} size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={6}>
                <Select label="Status" value={form.status} onChange={v => f('status', v || 'active')}
                  data={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Transferred', value: 'transferred' }, { label: 'Graduated', value: 'graduated' }]}
                  size="sm" radius="md" />
              </Grid.Col>
              <Grid.Col span={6}><TextInput label="Previous School" value={form.previousSchool || ''} onChange={e => f('previousSchool', e.target.value)} placeholder="Previous school name" size="sm" radius="md" /></Grid.Col>
              <Grid.Col span={12}><Textarea label="Medical Conditions" value={form.medicalConditions || ''} onChange={e => f('medicalConditions', e.target.value)} placeholder="Any known medical conditions or allergies" rows={2} size="sm" radius="md" /></Grid.Col>
            </Grid>
          </Tabs.Panel>
        </Tabs>

        <Divider my="md" />
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={() => { closeForm(); setEditId(null); }} radius="md">Cancel</Button>
          <Button onClick={handleSave} loading={saving} leftSection={<IconCheck size={16} />}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none' }} radius="md">
            {editId ? 'Update Student' : 'Add Student'}
          </Button>
        </Group>
      </Modal>

      {/* View Modal */}
      <Modal opened={viewOpened} onClose={closeView} title={<Text fw={700} size="lg">Student Profile</Text>} size="lg" radius="lg" centered>
        {viewStudent && (
          <Box>
            <Group mb="md" gap={16}>
              <Avatar size={64} radius="xl" color={viewStudent.gender === 'Male' ? 'blue' : 'pink'} style={{ fontSize: 22, fontWeight: 800 }}>
                {(viewStudent.firstName?.[0] || '') + (viewStudent.lastName?.[0] || '')}
              </Avatar>
              <Box>
                <Text fw={800} size="xl" c="#0f172a">{viewStudent.fullName}</Text>
                <Group gap={8} mt={4}>
                  <Badge color={GENDER_COLOR[viewStudent.gender] || 'gray'} size="sm">{viewStudent.gender}</Badge>
                  <Badge color={STATUS_COLOR[viewStudent.status] || 'gray'} size="sm">{viewStudent.status}</Badge>
                  <Badge variant="outline" size="sm">{viewStudent.admissionNumber}</Badge>
                </Group>
              </Box>
            </Group>
            <Divider mb="md" />
            <Grid gutter="sm">
              {[
                ['Class', viewStudent.class?.name],
                ['Section', viewStudent.section?.name],
                ['Roll No', viewStudent.rollNumber],
                ['Date of Birth', viewStudent.dateOfBirth?.split('T')[0]],
                ['Blood Group', viewStudent.bloodGroup],
                ['Religion', viewStudent.religion],
                ['B-Form', viewStudent.bForm],
                ['Phone', viewStudent.phone],
                ['Father', viewStudent.fatherName],
                ['Father Phone', viewStudent.fatherPhone],
                ['Mother', viewStudent.motherName],
                ['City', viewStudent.city],
              ].map(([label, value]) => value ? (
                <Grid.Col key={label as string} span={6}>
                  <Text size="11px" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
                  <Text size="13px" fw={500} c="#0f172a">{value}</Text>
                </Grid.Col>
              ) : null)}
            </Grid>
          </Box>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700}>Confirm Delete</Text>} size="sm" radius="lg" centered>
        <Text size="sm" c="#475569" mb="lg">This action cannot be undone. The student record will be permanently deleted.</Text>
        <Group justify="flex-end">
          <Button variant="light" color="gray" onClick={closeDelete} radius="md">Cancel</Button>
          <Button color="red" onClick={handleDelete} radius="md" leftSection={<IconTrash size={14} />}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
