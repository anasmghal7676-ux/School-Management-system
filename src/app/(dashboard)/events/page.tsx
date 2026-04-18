'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Card, Stack, SimpleGrid, Textarea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconEye,
  IconRefresh, IconCalendar, IconChevronLeft, IconChevronRight,
  IconMapPin, IconClock,
} from '@tabler/icons-react';

const EVENT_TYPES = ['Academic', 'Sports', 'Cultural', 'Meeting', 'Holiday', 'Exam', 'Trip', 'Competition', 'Other'].map(v => ({ value: v, label: v }));
const TYPE_COLOR: Record<string, string> = { Academic: 'blue', Sports: 'green', Cultural: 'grape', Meeting: 'orange', Holiday: 'teal', Exam: 'red', Trip: 'cyan', Competition: 'yellow', Other: 'gray' };

const EMPTY_FORM = { title: '', description: '', eventType: 'Academic', eventDate: null as Date | null, endDate: null as Date | null, venue: '', audience: 'All' };

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [viewEvent, setViewEvent] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (typeFilter) p.set('type', typeFilter);
      const res = await fetch(`/api/events?${p}`);
      const data = await res.json();
      setEvents(data.data?.events || data.data || []);
      setTotal(data.total || data.data?.total || 0);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load events' });
    } finally { setLoading(false); }
  }, [page, typeFilter]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.eventDate) return notifications.show({ color: 'red', message: 'Title and date required' });
    setSaving(true);
    try {
      const url = editId ? `/api/events/${editId}` : '/api/events';
      const method = editId ? 'PATCH' : 'POST';
      const payload = { ...form, eventDate: form.eventDate?.toISOString(), endDate: form.endDate?.toISOString() };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Event updated' : 'Event created' });
      closeForm();
      loadEvents();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await fetch(`/api/events/${deleteId}`, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'Deleted' });
      closeDelete();
      loadEvents();
    } catch {
      notifications.show({ color: 'red', message: 'Delete failed' });
    } finally { setSaving(false); }
  };

  const upcoming = events.filter(e => new Date(e.eventDate) >= new Date()).length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Events</Text>
          <Text size="sm" c="dimmed">Plan and track school events</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); openForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Create Event
        </Button>
      </Group>

      {/* Type filter */}
      <Group mb="md" gap="xs" wrap="wrap">
        {[{ value: '', label: 'All Events', color: 'gray' }, ...EVENT_TYPES].map(t => (
          <Badge key={t.value} variant={typeFilter === t.value ? 'filled' : 'light'} color={TYPE_COLOR[t.value] || 'gray'}
            style={{ cursor: 'pointer' }} onClick={() => setTypeFilter(t.value)}>{t.label}</Badge>
        ))}
      </Group>

      <Group mb="md" gap="sm">
        <ActionIcon variant="default" onClick={loadEvents} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
        <Text size="sm" c="dimmed">{total} events · {upcoming} upcoming</Text>
      </Group>

      {loading ? <Center py="xl"><Loader /></Center> : (
        events.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <IconCalendar size={40} color="#cbd5e1" />
              <Text c="dimmed">No events scheduled</Text>
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {events.map(event => {
              const isPast = new Date(event.eventDate) < new Date();
              return (
                <Card key={event.id} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9', opacity: isPast ? 0.75 : 1 }}>
                  <Group justify="space-between" mb="xs">
                    <Badge color={TYPE_COLOR[event.eventType] || 'gray'} variant="light" size="sm">{event.eventType || 'Event'}</Badge>
                    <Group gap={4}>
                      <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => { setViewEvent(event); openView(); }}><IconEye size={14} /></ActionIcon>
                      <ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(event.id); setForm({ title: event.title, description: event.description || '', eventType: event.eventType || 'Academic', eventDate: event.eventDate ? new Date(event.eventDate) : null, endDate: event.endDate ? new Date(event.endDate) : null, venue: event.venue || '', audience: event.audience || 'All' }); openForm(); }}><IconEdit size={14} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(event.id); openDelete(); }}><IconTrash size={14} /></ActionIcon>
                    </Group>
                  </Group>
                  <Text fw={600} size="sm" mb={6} lineClamp={2}>{event.title}</Text>
                  <Group gap={4} mb={2}>
                    <IconClock size={12} color="#64748b" />
                    <Text size="xs" c="dimmed">{event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}</Text>
                  </Group>
                  {event.venue && (
                    <Group gap={4}>
                      <IconMapPin size={12} color="#64748b" />
                      <Text size="xs" c="dimmed">{event.venue}</Text>
                    </Group>
                  )}
                  {event.description && <Text size="xs" c="dimmed" mt={6} lineClamp={2}>{event.description}</Text>}
                </Card>
              );
            })}
          </SimpleGrid>
        )
      )}

      {/* Form Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Event' : 'Create Event'}</Text>} radius="md" size="md">
        <Stack gap="sm">
          <TextInput label="Event Title" value={form.title} onChange={e => f('title', e.target.value)} required />
          <Grid>
            <Grid.Col span={6}><Select label="Type" data={EVENT_TYPES} value={form.eventType} onChange={v => f('eventType', v || 'Academic')} /></Grid.Col>
            <Grid.Col span={6}><Select label="Audience" data={['All', 'Staff', 'Students', 'Parents', 'Public'].map(v => ({ value: v, label: v }))} value={form.audience} onChange={v => f('audience', v || 'All')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><DatePickerInput label="Event Date" value={form.eventDate} onChange={v => f('eventDate', v)} required /></Grid.Col>
            <Grid.Col span={6}><DatePickerInput label="End Date" value={form.endDate} onChange={v => f('endDate', v)} /></Grid.Col>
          </Grid>
          <TextInput label="Venue" value={form.venue} onChange={e => f('venue', e.target.value)} />
          <Textarea label="Description" value={form.description} onChange={e => f('description', e.target.value)} rows={3} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>{editId ? 'Update' : 'Create'}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* View Modal */}
      <Modal opened={viewOpened} onClose={closeView} title={<Text fw={700}>Event Details</Text>} radius="md" size="md">
        {viewEvent && (
          <Stack gap="sm">
            <Group>
              <Badge color={TYPE_COLOR[viewEvent.eventType] || 'gray'} size="lg">{viewEvent.eventType}</Badge>
              {viewEvent.audience && <Badge variant="light" color="gray">{viewEvent.audience}</Badge>}
            </Group>
            <Text size="lg" fw={700}>{viewEvent.title}</Text>
            <Grid>
              <Grid.Col span={6}><Text size="xs" c="dimmed">Date</Text><Text fw={500}>{viewEvent.eventDate ? new Date(viewEvent.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</Text></Grid.Col>
              {viewEvent.venue && <Grid.Col span={6}><Text size="xs" c="dimmed">Venue</Text><Text fw={500}>{viewEvent.venue}</Text></Grid.Col>}
            </Grid>
            {viewEvent.description && <Box style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}><Text size="sm">{viewEvent.description}</Text></Box>}
          </Stack>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Delete Event</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Delete this event permanently?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Delete</Button>
        </Group>
      </Modal>
    </Box>
  );
}
