'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center, SimpleGrid,
  Table, Tabs, NumberInput, Textarea, Card, Stack, Divider,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconEye,
  IconRefresh, IconSchool, IconUsers, IconCheck, IconX,
  IconChevronLeft, IconChevronRight, IconLayoutGrid, IconList,
  IconDoorEnter,
} from '@tabler/icons-react';

const LEVEL_OPTIONS = ['Kindergarten','Primary','Middle','Secondary','Higher Secondary'].map(v => ({ value: v, label: v }));

const EMPTY_CLASS_FORM = {
  name: '', code: '', level: 'Primary', numericValue: '1', capacity: '40', description: '',
};

const EMPTY_SECTION_FORM = {
  name: '', code: '', classId: '', capacity: '40',
};

const LEVEL_COLOR: Record<string, string> = {
  Kindergarten: 'grape', Primary: 'blue', Middle: 'teal',
  Secondary: 'orange', 'Higher Secondary': 'red',
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [levelFilter, setLevelFilter] = useState('');
  const [classForm, setClassForm] = useState({ ...EMPTY_CLASS_FORM });
  const [sectionForm, setSectionForm] = useState({ ...EMPTY_SECTION_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [tab, setTab] = useState<string | null>('classes');
  const [classFormOpened, { open: openClassForm, close: closeClassForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [sectionFormOpened, { open: openSectionForm, close: closeSectionForm }] = useDisclosure(false);
  const [deleteSectionOpened, { open: openDeleteSection, close: closeDeleteSection }] = useDisclosure(false);
  const LIMIT = 50;

  const cf = (key: string, val: any) => setClassForm(p => ({ ...p, [key]: val }));
  const sf = (key: string, val: any) => setSectionForm(p => ({ ...p, [key]: val }));

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ search: debouncedSearch, page: String(page), limit: String(LIMIT) });
      const res = await fetch(`/api/classes?${p}`);
      const data = await res.json();
      setClasses(data.data || []);
      setTotal(data.total || 0);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load classes' });
    } finally { setLoading(false); }
  }, [debouncedSearch, page]);

  const loadSections = useCallback(async (classId: string) => {
    setSectionsLoading(true);
    try {
      const res = await fetch(`/api/sections?classId=${classId}&limit=100`);
      const data = await res.json();
      setSections(data.data || []);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load sections' });
    } finally { setSectionsLoading(false); }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const handleClassSubmit = async () => {
    if (!classForm.name.trim()) return notifications.show({ color: 'red', message: 'Class name is required' });
    setSaving(true);
    try {
      const url = editId ? `/api/classes/${editId}` : '/api/classes';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...classForm, numericValue: parseInt(classForm.numericValue) || 1, capacity: parseInt(classForm.capacity) || 40 }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Class updated' : 'Class created' });
      closeClassForm();
      loadClasses();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDeleteClass = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/classes/${deleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      notifications.show({ color: 'green', message: 'Class deleted' });
      closeDelete();
      loadClasses();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleSectionSubmit = async () => {
    if (!sectionForm.name.trim() || !sectionForm.classId) return notifications.show({ color: 'red', message: 'Name and class are required' });
    setSaving(true);
    try {
      const url = editSectionId ? `/api/sections/${editSectionId}` : '/api/sections';
      const method = editSectionId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...sectionForm, capacity: parseInt(sectionForm.capacity) || 40 }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      notifications.show({ color: 'green', message: editSectionId ? 'Section updated' : 'Section created' });
      closeSectionForm();
      if (selectedClass) loadSections(selectedClass.id);
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDeleteSection = async () => {
    if (!deleteSectionId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sections/${deleteSectionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      notifications.show({ color: 'green', message: 'Section deleted' });
      closeDeleteSection();
      if (selectedClass) loadSections(selectedClass.id);
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const openEditClass = (cls: any) => {
    setEditId(cls.id);
    setClassForm({ name: cls.name, code: cls.code || '', level: cls.level || 'Primary', numericValue: String(cls.numericValue || 1), capacity: String(cls.capacity || 40), description: cls.description || '' });
    openClassForm();
  };

  const handleSelectClass = (cls: any) => {
    setSelectedClass(cls);
    setSectionForm(p => ({ ...p, classId: cls.id }));
    loadSections(cls.id);
    setTab('sections');
  };

  const totalStudents = classes.reduce((s, c) => s + (c._count?.students || 0), 0);
  const totalSections = classes.reduce((s, c) => s + (c.sections?.length || 0), 0);
  const totalCapacity = classes.reduce((s, c) => s + (c.capacity || 0), 0);

  return (
    <Box p="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Classes & Sections</Text>
          <Text size="sm" c="dimmed">Manage class structure and sections</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setClassForm({ ...EMPTY_CLASS_FORM }); openClassForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          New Class
        </Button>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[
          { label: 'Total Classes', value: total, color: '#3b82f6', icon: <IconSchool size={20} /> },
          { label: 'Total Sections', value: totalSections, color: '#10b981', icon: <IconDoorEnter size={20} /> },
          { label: 'Total Students', value: totalStudents, color: '#f59e0b', icon: <IconUsers size={20} /> },
          { label: 'Total Capacity', value: totalCapacity, color: '#8b5cf6', icon: <IconLayoutGrid size={20} /> },
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
          <Tabs.Tab value="classes" leftSection={<IconSchool size={14} />}>Classes ({total})</Tabs.Tab>
          <Tabs.Tab value="sections" leftSection={<IconDoorEnter size={14} />}>
            {selectedClass ? `Sections of ${selectedClass.name}` : 'Sections (select a class)'}
          </Tabs.Tab>
        </Tabs.List>

        {/* CLASSES TAB */}
        <Tabs.Panel value="classes">
          <Group mb="md" gap="sm">
            <TextInput leftSection={<IconSearch size={14} />} placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
            <Select data={[{ value: '', label: 'All Levels' }, ...LEVEL_OPTIONS]} value={levelFilter} onChange={v => setLevelFilter(v || '')} placeholder="Filter by level" radius="md" clearable w={160} />
            <ActionIcon variant="default" onClick={loadClasses} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          </Group>

          {loading ? (
            <Center py="xl"><Loader /></Center>
          ) : (
            <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
              <Table highlightOnHover>
                <Table.Thead style={{ background: '#f8fafc' }}>
                  <Table.Tr>
                    <Table.Th>Class</Table.Th>
                    <Table.Th>Level</Table.Th>
                    <Table.Th>Sections</Table.Th>
                    <Table.Th>Students</Table.Th>
                    <Table.Th>Capacity</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {classes.filter(c => !levelFilter || c.level === levelFilter).map(cls => (
                    <Table.Tr key={cls.id}>
                      <Table.Td>
                        <Group gap={8}>
                          <Box style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>
                            {cls.numericValue || '?'}
                          </Box>
                          <Box>
                            <Text size="sm" fw={600}>{cls.name}</Text>
                            {cls.code && <Text size="xs" c="dimmed">{cls.code}</Text>}
                          </Box>
                        </Group>
                      </Table.Td>
                      <Table.Td><Badge color={LEVEL_COLOR[cls.level] || 'gray'} variant="light" size="sm">{cls.level}</Badge></Table.Td>
                      <Table.Td><Text size="sm" fw={500}>{cls.sections?.length || 0}</Text></Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <IconUsers size={14} color="#64748b" />
                          <Text size="sm">{cls._count?.students || 0}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c={cls._count?.students > cls.capacity ? 'red' : 'dimmed'}>
                          {cls._count?.students || 0}/{cls.capacity}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <Tooltip label="Manage sections"><ActionIcon variant="subtle" color="blue" size="sm" onClick={() => handleSelectClass(cls)}><IconDoorEnter size={14} /></ActionIcon></Tooltip>
                          <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => openEditClass(cls)}><IconEdit size={14} /></ActionIcon></Tooltip>
                          <Tooltip label="Delete"><ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(cls.id); openDelete(); }}><IconTrash size={14} /></ActionIcon></Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {classes.length === 0 && (
                    <Table.Tr><Table.Td colSpan={6}><Center py="xl"><Text c="dimmed">No classes found</Text></Center></Table.Td></Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Box>
          )}
        </Tabs.Panel>

        {/* SECTIONS TAB */}
        <Tabs.Panel value="sections">
          {!selectedClass ? (
            <Center py="xl"><Text c="dimmed">Select a class from the Classes tab to manage its sections</Text></Center>
          ) : (
            <>
              <Group justify="space-between" mb="md">
                <Group gap={8}>
                  <Badge size="lg" color="blue" variant="light">{selectedClass.name}</Badge>
                  <Text size="sm" c="dimmed">{sections.length} section(s)</Text>
                </Group>
                <Button size="sm" leftSection={<IconPlus size={14} />} onClick={() => { setEditSectionId(null); setSectionForm({ ...EMPTY_SECTION_FORM, classId: selectedClass.id }); openSectionForm(); }}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  Add Section
                </Button>
              </Group>

              {sectionsLoading ? (
                <Center py="xl"><Loader /></Center>
              ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} gap="md">
                  {sections.map(sec => (
                    <Card key={sec.id} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
                      <Group justify="space-between" mb="xs">
                        <Group gap={8}>
                          <Box style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                            {sec.name.charAt(0)}
                          </Box>
                          <Box>
                            <Text fw={600} size="sm">Section {sec.name}</Text>
                            <Text size="xs" c="dimmed">{sec.code || ''}</Text>
                          </Box>
                        </Group>
                        <Group gap={4}>
                          <ActionIcon variant="subtle" size="sm" onClick={() => { setEditSectionId(sec.id); setSectionForm({ name: sec.name, code: sec.code || '', classId: sec.classId, capacity: String(sec.capacity || 40) }); openSectionForm(); }}><IconEdit size={14} /></ActionIcon>
                          <ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteSectionId(sec.id); openDeleteSection(); }}><IconTrash size={14} /></ActionIcon>
                        </Group>
                      </Group>
                      <Group gap={16} mt="xs">
                        <Box>
                          <Text size="xs" c="dimmed">Students</Text>
                          <Text size="sm" fw={600}>{sec._count?.students || 0}</Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="dimmed">Capacity</Text>
                          <Text size="sm" fw={600}>{sec.capacity || 40}</Text>
                        </Box>
                      </Group>
                    </Card>
                  ))}
                  {sections.length === 0 && (
                    <Card shadow="xs" radius="md" p="xl" style={{ border: '2px dashed #e2e8f0', gridColumn: '1/-1' }}>
                      <Center><Stack align="center" gap={8}>
                        <IconDoorEnter size={32} color="#cbd5e1" />
                        <Text c="dimmed" size="sm">No sections yet. Add the first section for {selectedClass.name}.</Text>
                      </Stack></Center>
                    </Card>
                  )}
                </SimpleGrid>
              )}
            </>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Class Form Modal */}
      <Modal opened={classFormOpened} onClose={closeClassForm} title={<Text fw={700}>{editId ? 'Edit Class' : 'New Class'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={8}><TextInput label="Class Name" placeholder="e.g. Class 1, Grade 9" value={classForm.name} onChange={e => cf('name', e.target.value)} required /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Code" placeholder="CLS1" value={classForm.code} onChange={e => cf('code', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><Select label="Level" data={LEVEL_OPTIONS} value={classForm.level} onChange={v => cf('level', v || 'Primary')} /></Grid.Col>
            <Grid.Col span={3}><NumberInput label="Order" value={parseInt(classForm.numericValue) || 1} onChange={v => cf('numericValue', String(v))} min={1} /></Grid.Col>
            <Grid.Col span={3}><NumberInput label="Capacity" value={parseInt(classForm.capacity) || 40} onChange={v => cf('capacity', String(v))} min={1} /></Grid.Col>
          </Grid>
          <Textarea label="Description" placeholder="Optional description" value={classForm.description} onChange={e => cf('description', e.target.value)} rows={2} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeClassForm}>Cancel</Button>
            <Button loading={saving} onClick={handleClassSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {editId ? 'Update' : 'Create'} Class
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Section Form Modal */}
      <Modal opened={sectionFormOpened} onClose={closeSectionForm} title={<Text fw={700}>{editSectionId ? 'Edit Section' : 'New Section'}</Text>} radius="md" size="sm">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={8}><TextInput label="Section Name" placeholder="A, B, C..." value={sectionForm.name} onChange={e => sf('name', e.target.value)} required /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Code" value={sectionForm.code} onChange={e => sf('code', e.target.value)} /></Grid.Col>
          </Grid>
          <NumberInput label="Capacity" value={parseInt(sectionForm.capacity) || 40} onChange={v => sf('capacity', String(v))} min={1} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeSectionForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSectionSubmit} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              {editSectionId ? 'Update' : 'Add'} Section
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Class Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Class</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Are you sure? This will delete the class and may affect students assigned to it.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDeleteClass}>Delete Class</Button>
        </Group>
      </Modal>

      {/* Delete Section Modal */}
      <Modal opened={deleteSectionOpened} onClose={closeDeleteSection} title={<Text fw={700} c="red">Delete Section</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Are you sure you want to delete this section?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDeleteSection}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDeleteSection}>Delete Section</Button>
        </Group>
      </Modal>
    </Box>
  );
}
