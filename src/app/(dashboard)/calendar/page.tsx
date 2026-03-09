'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, Badge, Button, Loader, Alert, Modal, Stack, TextInput, Select, Textarea, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconRefresh, IconAlertCircle, IconCalendar, IconTrash } from '@tabler/icons-react';

const EMPTY = { title: '', description: '', startDate: '', endDate: '', type: 'event', color: '#3b82f6' };
const EVENT_TYPES = ['event', 'holiday', 'exam', 'meeting', 'sports', 'other'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Page() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/events').then(r => r.json());
      setEvents(r.data || []);
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title || !form.startDate) { notifications.show({ message: 'Title and start date required', color: 'orange' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { notifications.show({ title: 'Created', message: 'Event added to calendar', color: 'green' }); setModal(false); setForm(EMPTY); load(); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  async function del(id: string) {
    if (!confirm('Delete this event?')) return;
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { notifications.show({ message: 'Deleted', color: 'green' }); load(); }
  }

  // Build calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function getEventsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e: any) => e.startDate && e.startDate.startsWith(dateStr));
  }

  const upcoming = events.filter((e: any) => e.startDate && new Date(e.startDate) >= new Date()).slice(0, 5);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">School Calendar</Text><Text size="sm" c="dimmed">Events, holidays & schedules</Text></Box>
        <Group>
          <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setModal(true)} radius="md">Add Event</Button>
        </Group>
      </Group>

      <Group gap="xl" align="flex-start" style={{ flexWrap: 'wrap' }}>
        {/* Calendar Grid */}
        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9', flex: '1 1 500px' }}>
          <Group justify="space-between" mb="md">
            <Button variant="subtle" size="xs" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>← Prev</Button>
            <Text fw={700}>{monthNames[month]} {year}</Text>
            <Button variant="subtle" size="xs" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>Next →</Button>
          </Group>
          <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {dayNames.map(d => <Text key={d} size="xs" fw={600} c="dimmed" ta="center" py={4}>{d}</Text>)}
            {Array(firstDay).fill(null).map((_, i) => <Box key={`empty-${i}`} />)}
            {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              return (
                <Box key={day} p={4} style={{ borderRadius: 6, background: isToday ? '#eff6ff' : 'transparent', border: isToday ? '1px solid #3b82f6' : '1px solid transparent', minHeight: 44 }}>
                  <Text size="xs" fw={isToday ? 700 : 400} c={isToday ? '#3b82f6' : 'inherit'} ta="center">{day}</Text>
                  {dayEvents.slice(0, 2).map((e: any) => (
                    <Box key={e.id} style={{ background: e.color || '#3b82f6', borderRadius: 3, padding: '1px 4px', marginTop: 2 }}>
                      <Text size="xs" c="white" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>{e.title}</Text>
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        </Card>

        {/* Upcoming Events */}
        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9', flex: '0 0 280px' }}>
          <Text fw={600} mb="md">Upcoming Events</Text>
          {loading ? <Loader size="sm" /> : upcoming.length === 0 ? (
            <Alert icon={<IconAlertCircle size={14} />} color="blue" radius="md">No upcoming events.</Alert>
          ) : (
            <Stack gap="sm">
              {upcoming.map((e: any) => (
                <Group key={e.id} justify="space-between" style={{ padding: '8px', borderRadius: 8, background: '#f8fafc' }}>
                  <Box style={{ flex: 1 }}>
                    <Box style={{ width: 8, height: 8, borderRadius: '50%', background: e.color || '#3b82f6', display: 'inline-block', marginRight: 8 }} />
                    <Text size="sm" fw={500} style={{ display: 'inline' }}>{e.title}</Text>
                    <Text size="xs" c="dimmed">{e.startDate ? new Date(e.startDate).toLocaleDateString() : ''}</Text>
                    <Badge size="xs" variant="light" color="blue">{e.type || 'event'}</Badge>
                  </Box>
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={() => del(e.id)}><IconTrash size={12} /></ActionIcon>
                </Group>
              ))}
            </Stack>
          )}
        </Card>
      </Group>

      <Modal opened={modal} onClose={() => setModal(false)} title="Add Calendar Event" radius="md">
        <Stack gap="md">
          <TextInput label="Event Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Annual Sports Day" />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          <Select label="Event Type" data={EVENT_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} value={form.type} onChange={v => setForm(f => ({ ...f, type: v || 'event' }))} />
          <Group grow>
            <TextInput label="Start Date" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
            <TextInput label="End Date" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </Group>
          <Box>
            <Text size="sm" fw={500} mb={8}>Color</Text>
            <Group gap="xs">
              {COLORS.map(c => <Box key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid #000' : '3px solid transparent' }} />)}
            </Group>
          </Box>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Add Event</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
