'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Button, TextInput, Select, Table, Badge,
  Avatar, ActionIcon, Modal, SimpleGrid, Paper, Skeleton,
  Pagination, Tooltip, ThemeIcon, Divider, Textarea, Tabs,
  NumberInput, Stack, Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconUsers,
  IconFilter, IconDownload, IconRefresh, IconUpload,
  IconUser, IconPhone, IconMapPin, IconCalendar,
  IconAlertCircle, IconCheck, IconX, IconEye,
} from '@tabler/icons-react';

interface ClassItem { id: string; name: string; }
interface SectionItem { id: string; name: string; classId: string; }

interface Student {
  id: string; admissionNumber: string; firstName: string; middleName?: string;
  lastName: string; fullName: string; gender: string; dateOfBirth: string;
  phone?: string; fatherName?: string; motherName?: string; fatherPhone?: string;
  address?: string; city?: string; religion?: string; bloodGroup?: string;
  rollNumber?: string; bForm?: string; status: string; currentClassId: string;
  currentSectionId?: string; admissionDate?: string;
  class?: { id: string; name: string };
  section?: { id: string; name: string };
}

const EMPTY_FORM = {
  firstName: '', lastName: '', middleName: '', gender: '', dateOfBirth: '',
  phone: '', email: '', fatherName: '', motherName: '', fatherPhone: '', motherPhone: '',
  address: '', city: '', province: '', religion: 'Islam', bloodGroup: '',
  rollNumber: '', bForm: '', currentClassId: '', currentSectionId: '',
  admissionDate: new Date().toISOString().split('T')[0], status: 'active',
  previousSchool: '', medicalConditions: '',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [opened, { open, close }] = useDisclosure(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const limit = 20;

  const setField = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (formErrors[key]) setFormErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const formSections = sections.filter(s => s.classId === form.currentClassId);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(limit),
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
      notifications.show({ color: 'red', title: 'Error', message: 'Failed to load students' });
    } finally { setLoading(false); }
  }, [page, search, classFilter, statusFilter]);

  const fetchMeta = async () => {
    const [cr, sr] = await Promise.all([
      fetch('/api/classes?limit=200'),
      fetch('/api/sections?limit=500'),
    ]);
    const cd = await cr.json(); const sd = await sr.json();
    if (cd.success) setClasses(cd.data || []);
    if (sd.success) setSections(sd.data || []);
  };

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchMeta(); }, []);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.gender) errors.gender = 'Gender is required';
    if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!form.currentClassId) errors.currentClassId = 'Class is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = selectedStudent ? `/api/students/${selectedStudent.id}` : '/api/students';
      const method = selectedStudent ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      notifications.show({
        color: 'teal', icon: <IconCheck size={16} />,
        title: selectedStudent ? 'Student Updated' : 'Student Added',
        message: `${form.firstName} ${form.lastName} has been ${selectedStudent ? 'updated' : 'enrolled'} successfully.`,
      });
      close(); fetchStudents(); setForm({ ...EMPTY_FORM }); setSelectedStudent(null);
    } catch (e: any) {
      notifications.show({ color: 'red', icon: <IconX size={16} />, title: 'Save Failed', message: e.message });
    } finally { setSaving(false); }
  };

  const handleEdit = (s: Student) => {
    setSelectedStudent(s);
    setForm({
      firstName: s.firstName || '', lastName: s.lastName || '', middleName: s.middleName || '',
      gender: s.gender || '', dateOfBirth: s.dateOfBirth?.split('T')[0] || '',
      phone: s.phone || '', email: '', fatherName: s.fatherName || '',
      motherName: s.motherName || '', fatherPhone: s.fatherPhone || '', motherPhone: '',
      address: s.address || '', city: s.city || '', province: '', religion: s.religion || 'Islam',
      bloodGroup: s.bloodGroup || '', rollNumber: s.rollNumber || '', bForm: s.bForm || '',
      currentClassId: s.currentClassId || '', currentSectionId: s.currentSectionId || '',
      admissionDate: s.admissionDate?.split('T')[0] || '', status: s.status || 'active',
      previousSchool: '', medicalConditions: '',
    });
    setFormErrors({});
    open();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/students/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      notifications.show({ color: 'teal', title: 'Deleted', message: 'Student removed successfully.' });
      closeDelete(); setDeleteId(null); fetchStudents();
    } catch (e: any) {
      notifications.show({ color: 'red', title: 'Error', message: e.message });
    }
  };

  const openAdd = () => {
    setSelectedStudent(null); setForm({ ...EMPTY_FORM }); setFormErrors({}); open();
  };

  const getStatusColor = (s: string) => ({ active: 'teal', inactive: 'gray', transferred: 'orange', graduated: 'blue' }[s] || 'gray');

  return (
    <Box p={{ base: 'sm', sm: 'md' }} className="page-enter">
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <Box>
          <Text size="xl" fw={800} c="#0f172a" style={{ letterSpacing: '-0.4px' }}>Students</Text>
          <Text size="sm" c="dimmed">Manage enrolled students · {total.toLocaleString()} total</Text>
        </Box>
        <Group gap={8}>
          <Tooltip label="Refresh">
            <ActionIcon variant="light" color="gray" onClick={fetchStudents} radius="md" size="lg">
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          <Button leftSection={<IconPlus size={15} />} onClick={openAdd} radius="md"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
            Add Student
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Paper p="sm" radius="md" mb="md" style={{ border: '1px solid #f1f5f9' }}>
        <Group gap={10}>
          <TextInput
            leftSection={<IconSearch size={14} />}
            placeholder="Search name, admission no..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            radius="md" size="sm" style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            placeholder="All Classes"
            data={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
            value={classFilter} onChange={v => { setClassFilter(v || ''); setPage(1); }}
            radius="md" size="sm" w={160} clearable
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
            value={statusFilter} onChange={v => { setStatusFilter(v || ''); setPage(1); }}
            radius="md" size="sm" w={140} clearable
          />
        </Group>
      </Paper>

      {/* Table */}
      <Paper radius="md" style={{ border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        {loading ? (
          <Stack p="md" gap={8}>
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} height={52} radius="md" />)}
          </Stack>
        ) : students.length === 0 ? (
          <Box py={60} style={{ textAlign: 'center' }}>
            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb={16}>
              <IconUsers size={32} />
            </ThemeIcon>
            <Text fw={600} c="#475569">No Students Found</Text>
            <Text size="sm" c="dimmed" mt={4}>
              {search || classFilter || statusFilter ? 'Try adjusting your filters' : 'Click "Add Student" to enroll your first student'}
            </Text>
            {!search && !classFilter && !statusFilter && (
              <Button mt={16} leftSection={<IconPlus size={14} />} onClick={openAdd} variant="light" radius="md">
                Add First Student
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Box style={{ overflowX: 'auto' }}>
              <table className="erp-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Student</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Adm. No</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Class</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Father</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Phone</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#475569', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={s.id} style={{ borderBottom: idx < students.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 150ms ease' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '10px 14px' }}>
                        <Group gap={10}>
                          <Avatar size={34} radius="xl" color="blue" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', fontWeight: 700, fontSize: 13 }}>
                            {(s.firstName?.[0] || '?').toUpperCase()}
                          </Avatar>
                          <Box>
                            <Text size="13px" fw={600} c="#0f172a">{s.fullName || `${s.firstName} ${s.lastName}`}</Text>
                            <Text size="10px" c="dimmed">{s.gender} · {s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : 'N/A'}</Text>
                          </Box>
                        </Group>
                      </td>
                      <td style={{ padding: '10px 14px' }}><Text size="12px" fw={500} ff="monospace" c="#3b82f6">{s.admissionNumber}</Text></td>
                      <td style={{ padding: '10px 14px' }}>
                        <Text size="12px" fw={600}>{s.class?.name || '—'}</Text>
                        {s.section && <Text size="10px" c="dimmed">Sec: {s.section.name}</Text>}
                      </td>
                      <td style={{ padding: '10px 14px' }}><Text size="12px">{s.fatherName || '—'}</Text></td>
                      <td style={{ padding: '10px 14px' }}><Text size="12px" c="dimmed">{s.phone || s.fatherPhone || '—'}</Text></td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge size="sm" variant="light" color={getStatusColor(s.status)} radius="sm">{s.status}</Badge>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <Group gap={4} justify="flex-end">
                          <Tooltip label="View"><ActionIcon size="sm" variant="subtle" color="gray" onClick={() => { setViewStudent(s); openView(); }}><IconEye size={14} /></ActionIcon></Tooltip>
                          <Tooltip label="Edit"><ActionIcon size="sm" variant="subtle" color="blue" onClick={() => handleEdit(s)}><IconEdit size={14} /></ActionIcon></Tooltip>
                          <Tooltip label="Delete"><ActionIcon size="sm" variant="subtle" color="red" onClick={() => { setDeleteId(s.id); openDelete(); }}><IconTrash size={14} /></ActionIcon></Tooltip>
                        </Group>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
            <Box p="sm" style={{ borderTop: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text size="12px" c="dimmed">Showing {((page-1)*limit)+1}–{Math.min(page*limit, total)} of {total} students</Text>
              <Pagination total={Math.ceil(total / limit)} value={page} onChange={setPage} size="sm" radius="md" />
            </Box>
          </>
        )}
      </Paper>

      {/* ADD / EDIT MODAL */}
      <Modal
        opened={opened}
        onClose={() => { close(); setSelectedStudent(null); setForm({ ...EMPTY_FORM }); setFormErrors({}); }}
        title={
          <Group gap={10}>
            <ThemeIcon size={32} radius="md" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              <IconUser size={16} color="white" />
            </ThemeIcon>
            <Box>
              <Text fw={700} size="sm">{selectedStudent ? 'Edit Student' : 'Add New Student'}</Text>
              <Text size="10px" c="dimmed">{selectedStudent ? `Editing: ${selectedStudent.fullName}` : 'Fill in student details below'}</Text>
            </Box>
          </Group>
        }
        size="xl" radius="lg" centered
      >
        <Tabs defaultValue="basic">
          <Tabs.List mb="md">
            <Tabs.Tab value="basic" leftSection={<IconUser size={13} />}>Basic Info</Tabs.Tab>
            <Tabs.Tab value="parent" leftSection={<IconPhone size={13} />}>Parent Info</Tabs.Tab>
            <Tabs.Tab value="address" leftSection={<IconMapPin size={13} />}>Address</Tabs.Tab>
            <Tabs.Tab value="academic" leftSection={<IconCalendar size={13} />}>Academic</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="basic">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput label="First Name *" placeholder="Enter first name" value={form.firstName}
                onChange={e => setField('firstName', e.target.value)} error={formErrors.firstName} radius="md" />
              <TextInput label="Middle Name" placeholder="Optional" value={form.middleName}
                onChange={e => setField('middleName', e.target.value)} radius="md" />
              <TextInput label="Last Name *" placeholder="Enter last name" value={form.lastName}
                onChange={e => setField('lastName', e.target.value)} error={formErrors.lastName} radius="md" />
              <Select label="Gender *" placeholder="Select gender"
                data={['Male', 'Female', 'Other']} value={form.gender}
                onChange={v => setField('gender', v || '')} error={formErrors.gender} radius="md" />
              <TextInput type="date" label="Date of Birth *" value={form.dateOfBirth}
                onChange={e => setField('dateOfBirth', e.target.value)} error={formErrors.dateOfBirth} radius="md" />
              <Select label="Blood Group" placeholder="Select"
                data={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
                value={form.bloodGroup} onChange={v => setField('bloodGroup', v || '')} clearable radius="md" />
              <TextInput label="B-Form / CNIC" placeholder="XXXXX-XXXXXXX-X" value={form.bForm}
                onChange={e => setField('bForm', e.target.value)} radius="md" />
              <Select label="Religion" placeholder="Select"
                data={['Islam', 'Christianity', 'Hinduism', 'Other']}
                value={form.religion} onChange={v => setField('religion', v || '')} radius="md" />
              <TextInput label="Phone" placeholder="03XX-XXXXXXX" value={form.phone}
                onChange={e => setField('phone', e.target.value)} radius="md" />
              <TextInput label="Email" placeholder="student@example.com" value={form.email || ''}
                onChange={e => setField('email', e.target.value)} radius="md" />
            </SimpleGrid>
          </Tabs.Panel>

          <Tabs.Panel value="parent">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput label="Father Name" value={form.fatherName}
                onChange={e => setField('fatherName', e.target.value)} radius="md" />
              <TextInput label="Father Phone" value={form.fatherPhone}
                onChange={e => setField('fatherPhone', e.target.value)} radius="md" />
              <TextInput label="Mother Name" value={form.motherName}
                onChange={e => setField('motherName', e.target.value)} radius="md" />
              <TextInput label="Mother Phone" value={form.motherPhone}
                onChange={e => setField('motherPhone', e.target.value)} radius="md" />
              <TextInput label="Previous School" value={form.previousSchool}
                onChange={e => setField('previousSchool', e.target.value)} radius="md" />
            </SimpleGrid>
            <Textarea label="Medical Conditions" placeholder="Any allergies, conditions, medications..."
              value={form.medicalConditions} onChange={e => setField('medicalConditions', e.target.value)}
              rows={3} mt="sm" radius="md" />
          </Tabs.Panel>

          <Tabs.Panel value="address">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput label="City" value={form.city}
                onChange={e => setField('city', e.target.value)} radius="md" />
              <Select label="Province" placeholder="Select province"
                data={['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK', 'ICT']}
                value={form.province} onChange={v => setField('province', v || '')} clearable radius="md" />
            </SimpleGrid>
            <Textarea label="Full Address" placeholder="Street, Area, City" value={form.address}
              onChange={e => setField('address', e.target.value)} rows={3} mt="sm" radius="md" />
          </Tabs.Panel>

          <Tabs.Panel value="academic">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <Select label="Class *" placeholder="Select class"
                data={classes.map(c => ({ value: c.id, label: c.name }))}
                value={form.currentClassId} onChange={v => { setField('currentClassId', v || ''); setField('currentSectionId', ''); }}
                error={formErrors.currentClassId} searchable radius="md" />
              <Select label="Section" placeholder="Select section"
                data={formSections.map(s => ({ value: s.id, label: s.name }))}
                value={form.currentSectionId} onChange={v => setField('currentSectionId', v || '')}
                disabled={!form.currentClassId} clearable radius="md" />
              <TextInput label="Roll Number" placeholder="Auto-generated if empty"
                value={form.rollNumber} onChange={e => setField('rollNumber', e.target.value)} radius="md" />
              <TextInput type="date" label="Admission Date"
                value={form.admissionDate} onChange={e => setField('admissionDate', e.target.value)} radius="md" />
              <Select label="Status" placeholder="Status"
                data={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'transferred', label: 'Transferred' },
                  { value: 'graduated', label: 'Graduated' },
                ]}
                value={form.status} onChange={v => setField('status', v || 'active')} radius="md" />
            </SimpleGrid>
          </Tabs.Panel>
        </Tabs>

        {Object.keys(formErrors).length > 0 && (
          <Alert icon={<IconAlertCircle size={14} />} color="red" mt="md" radius="md">
            Please fill in all required fields before saving.
          </Alert>
        )}

        <Group justify="flex-end" mt="xl" gap={8}>
          <Button variant="light" color="gray" onClick={() => { close(); setSelectedStudent(null); setForm({ ...EMPTY_FORM }); }} radius="md">Cancel</Button>
          <Button onClick={handleSave} loading={saving} radius="md"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            leftSection={<IconCheck size={14} />}>
            {selectedStudent ? 'Update Student' : 'Enroll Student'}
          </Button>
        </Group>
      </Modal>

      {/* VIEW MODAL */}
      <Modal opened={viewOpened} onClose={closeView} title={<Text fw={700}>Student Details</Text>} size="md" radius="lg" centered>
        {viewStudent && (
          <Box>
            <Box style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar size={64} radius="xl" mx="auto" mb={8}
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', fontSize: 24, fontWeight: 700 }}>
                {viewStudent.firstName?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <Text fw={700} size="lg">{viewStudent.fullName || `${viewStudent.firstName} ${viewStudent.lastName}`}</Text>
              <Badge variant="light" color={getStatusColor(viewStudent.status)} mt={4}>{viewStudent.status}</Badge>
            </Box>
            {[
              { label: 'Admission Number', value: viewStudent.admissionNumber },
              { label: 'Gender', value: viewStudent.gender },
              { label: 'Date of Birth', value: viewStudent.dateOfBirth ? new Date(viewStudent.dateOfBirth).toLocaleDateString() : 'N/A' },
              { label: 'Class', value: viewStudent.class?.name || 'N/A' },
              { label: 'Section', value: viewStudent.section?.name || 'N/A' },
              { label: 'Father', value: viewStudent.fatherName || 'N/A' },
              { label: 'Father Phone', value: viewStudent.fatherPhone || 'N/A' },
              { label: 'Phone', value: viewStudent.phone || 'N/A' },
              { label: 'City', value: viewStudent.city || 'N/A' },
            ].map(({ label, value }) => (
              <Group key={label} justify="space-between" py={8} style={{ borderBottom: '1px solid #f8fafc' }}>
                <Text size="12px" c="dimmed">{label}</Text>
                <Text size="12px" fw={600}>{value}</Text>
              </Group>
            ))}
          </Box>
        )}
      </Modal>

      {/* DELETE CONFIRM */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Confirm Delete</Text>} size="sm" radius="lg" centered>
        <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" radius="md">
          This action cannot be undone. The student record will be permanently deleted.
        </Alert>
        <Group justify="flex-end" gap={8}>
          <Button variant="light" color="gray" onClick={closeDelete} radius="md">Cancel</Button>
          <Button color="red" onClick={handleDelete} radius="md" leftSection={<IconTrash size={14} />}>Delete Student</Button>
        </Group>
      </Modal>
    </Box>
  );
}
