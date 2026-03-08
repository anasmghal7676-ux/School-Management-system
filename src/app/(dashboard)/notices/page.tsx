'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Card, Stack, SimpleGrid, Textarea, SegmentedControl,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconEye,
  IconRefresh, IconBell, IconChevronLeft, IconChevronRight,
  IconAward, IconAlertCircle, IconInfoCircle,
} from '@tabler/icons-react';

const NOTICE_TYPES = ['General', 'Academic', 'Administrative', 'Emergency', 'Event', 'Holiday'].map(v => ({ value: v, label: v }));
const AUDIENCES = ['All', 'Staff', 'Students', 'Parents', 'Specific Class'].map(v => ({ value: v, label: v }));
const TYPE_COLOR: Record<string, string> = { General: 'blue', Academic: 'teal', Administrative: 'orange', Emergency: 'red', Event: 'grape', Holiday: 'green' };

const EMPTY_FORM = {
  title: '', content: '', type: 'General', audience: 'All',
  publishDate: null as Date | null, expiryDate: null as Date | null,
  priority: 'Normal', isPublished: true,
};

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [viewNotice, setViewNotice] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (typeFilter) p.set('type', typeFilter);
      if (debouncedSearch) p.set('search', debouncedSearch);
      const res = await fetch(`/api/notice-board?${p}`);
      const data = await res.json();
      setNotices(data.data || data.notices || []);
      setTotal(data.total || 0);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load notices' });
    } finally { setLoading(false); }
  }, [page, typeFilter, debouncedSearch]);

  useEffect(() => { loadNotices(); }, [loadNotices]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return notifications.show({ color: 'red', message: 'Title and content required' });
    setSaving(true);
    try {
      const url = editId ? `/api/notice-board/${editId}` : '/api/notice-board';
      const method = editId ? 'PATCH' : 'POST';
      const payload = { ...form, publishDate: form.publishDate?.toISOString(), expiryDate: form.expiryDate?.toISOString(), schoolId: 'school_main' };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Notice updated' : 'Notice published' });
      closeForm();
      loadNotices();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await fetch(`/api/notice-board/${deleteId}`, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'Notice deleted' });
      closeDelete();
      loadNotices();
    } catch {
      notifications.show({ color: 'red', message: 'Delete failed' });
    } finally { setSaving(false); }
  };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Notice Board</Text>
          <Text size="sm" c="dimmed">Post and manage school announcements</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Post Notice
        </Button>
      </Group>

      {/* Type filter chips */}
      <Group mb="md" gap="xs">
        {[{ value: '', label: 'All', color: 'gray' }, ...NOTICE_TYPES].map(t => (
          <Badge key={t.value} variant={typeFilter === t.value ? 'filled' : 'light'} color={TYPE_COLOR[t.value] || 'gray'}
            style={{ cursor: 'pointer' }} onClick={() => setTypeFilter(t.value)}>{t.label}</Badge>
        ))}
      </Group>

      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <ActionIcon variant="default" onClick={loadNotices} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
        <Text size="sm" c="dimmed">{total} notices</Text>
      </Group>

      {loading ? <Center py="xl"><Loader /></Center> : (
        notices.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <IconBell size={40} color="#cbd5e1" />
              <Text c="dimmed">No notices found</Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap="md">
            {notices.map(notice => (
              <Card key={notice.id} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9', borderLeft: `4px solid ${notice.type === 'Emergency' ? '#ef4444' : '#3b82f6'}` }}>
                <Group justify="space-between" mb="xs">
                  <Group gap={8}>
                    <Badge color={TYPE_COLOR[notice.type] || 'blue'} variant="light" size="sm">{notice.type || 'General'}</Badge>
                    <Badge variant="outline" color="gray" size="sm">{notice.audience || 'All'}</Badge>
                    {notice.priority === 'High' && <Badge color="red" size="sm">High Priority</Badge>}
                  </Group>
                  <Group gap={6}>
                    <Text size="xs" c="dimmed">{notice.publishDate ? new Date(notice.publishDate).toLocaleDateString() : notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : '—'}</Text>
                    <Tooltip label="View"><ActionIcon variant="subtle" color="blue" size="sm" onClick={() => { setViewNotice(notice); openView(); }}><IconEye size={14} /></ActionIcon></Tooltip>
                    <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(notice.id); setForm({ title: notice.title, content: notice.content, type: notice.type || 'General', audience: notice.audience || 'All', publishDate: notice.publishDate ? new Date(notice.publishDate) : null, expiryDate: notice.expiryDate ? new Date(notice.expiryDate) : null, priority: notice.priority || 'Normal', isPublished: notice.isPublished !== false }); openForm(); }}><IconEdit size={14} /></ActionIcon></Tooltip>
                    <Tooltip label="Delete"><ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(notice.id); openDelete(); }}><IconTrash size={14} /></ActionIcon></Tooltip>
                  </Group>
                </Group>
                <Text fw={600} size="sm" mb={4}>{notice.title}</Text>
                <Text size="sm" c="dimmed" lineClamp={2}>{notice.content}</Text>
              </Card>
            ))}
          </Stack>
        )
      )}

      {/* Form Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Notice' : 'Post New Notice'}</Text>} radius="md" size="lg">
        <Stack gap="sm">
          <TextInput label="Title" placeholder="Notice title" value={form.title} onChange={e => f('title', e.target.value)} required />
          <Grid>
            <Grid.Col span={6}><Select label="Type" data={NOTICE_TYPES} value={form.type} onChange={v => f('type', v || 'General')} /></Grid.Col>
            <Grid.Col span={6}><Select label="Audience" data={AUDIENCES} value={form.audience} onChange={v => f('audience', v || 'All')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><DatePickerInput label="Publish Date" value={form.publishDate} onChange={v => f('publishDate', v)} /></Grid.Col>
            <Grid.Col span={6}><DatePickerInput label="Expiry Date" value={form.expiryDate} onChange={v => f('expiryDate', v)} /></Grid.Col>
          </Grid>
          <Select label="Priority" data={['Normal', 'High', 'Urgent'].map(v => ({ value: v, label: v }))} value={form.priority} onChange={v => f('priority', v || 'Normal')} />
          <Textarea label="Content" placeholder="Notice content..." value={form.content} onChange={e => f('content', e.target.value)} rows={5} required />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {editId ? 'Update' : 'Publish'} Notice
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* View Modal */}
      <Modal opened={viewOpened} onClose={closeView} title={<Text fw={700}>Notice</Text>} radius="md" size="md">
        {viewNotice && (
          <Stack gap="sm">
            <Group>
              <Badge color={TYPE_COLOR[viewNotice.type] || 'blue'} size="lg">{viewNotice.type}</Badge>
              <Badge variant="light" color="gray">{viewNotice.audience || 'All'}</Badge>
            </Group>
            <Text size="lg" fw={700}>{viewNotice.title}</Text>
            <Text size="xs" c="dimmed">Published: {viewNotice.publishDate ? new Date(viewNotice.publishDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</Text>
            <Box style={{ background: '#f8fafc', borderRadius: 8, padding: 16, borderLeft: '4px solid #3b82f6' }}>
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{viewNotice.content}</Text>
            </Box>
          </Stack>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Notice</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this notice permanently?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
