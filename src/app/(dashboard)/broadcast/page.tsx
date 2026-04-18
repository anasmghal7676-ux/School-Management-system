'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, TextInput, Button, Modal, Grid, ActionIcon, Loader, Center, Card, Stack, Select, Textarea, Tabs, SimpleGrid } from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconBell, IconMail, IconMessage, IconRefresh } from '@tabler/icons-react';

const CHANNELS = ['Email', 'SMS', 'Push Notification', 'All'];
const AUDIENCES = ['All', 'Students', 'Parents', 'Staff', 'Teachers', 'Class'];
const PRIORITIES = ['Normal', 'Important', 'Urgent'];
const EMPTY = { title: '', message: '', channel: 'All', audience: 'All', priority: 'Normal', scheduledAt: '' };

export default function BroadcastPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const f = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/broadcast?limit=50');
      const data = await res.json();
      setBroadcasts(data.data || []);
    } catch { setBroadcasts([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) return notifications.show({ color: 'red', message: 'Title and message required' });
    setSaving(true);
    try {
      const res = await fetch('/api/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, sentAt: new Date().toISOString() }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: 'Broadcast sent!' });
      closeForm(); load();
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  const P_COLOR: Record<string, string> = { Normal: 'blue', Important: 'orange', Urgent: 'red' };
  const C_ICON: Record<string, any> = { Email: <IconMail size={14} />, SMS: <IconMessage size={14} />, 'Push Notification': <IconBell size={14} />, All: <IconBell size={14} /> };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Broadcast</Text><Text size="sm" c="dimmed">Send mass notifications to students, parents, and staff</Text></Box>
        <Button leftSection={<IconBell size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY }); openForm(); }} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>New Broadcast</Button>
      </Group>
      <SimpleGrid cols={{ base: 3 }} mb="xl">
        {[{ label: 'Total Sent', value: broadcasts.length, color: '#3b82f6' }, { label: 'Today', value: broadcasts.filter(b => b.sentAt && new Date(b.sentAt).toDateString() === new Date().toDateString()).length, color: '#10b981' }, { label: 'Urgent', value: broadcasts.filter(b => b.priority === 'Urgent').length, color: '#ef4444' }].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <Stack gap="sm">
          {broadcasts.map(b => (
            <Card key={b.id} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
              <Group justify="space-between">
                <Group gap={8}>
                  <Box style={{ width: 32, height: 32, borderRadius: 8, background: b.priority === 'Urgent' ? '#ef4444' : b.priority === 'Important' ? '#f97316' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    {C_ICON[b.channel] || <IconBell size={14} />}
                  </Box>
                  <Box>
                    <Text fw={600} size="sm">{b.title}</Text>
                    <Group gap={6}>
                      <Badge size="xs" variant="light" color={P_COLOR[b.priority] || 'blue'}>{b.priority}</Badge>
                      <Badge size="xs" variant="outline" color="gray">To: {b.audience}</Badge>
                      <Badge size="xs" variant="light" color="violet">{b.channel}</Badge>
                    </Group>
                  </Box>
                </Group>
                <Group gap={4}>
                  <Text size="xs" c="dimmed">{b.sentAt ? new Date(b.sentAt).toLocaleString() : ''}</Text>
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={async () => { if (!confirm('Delete?')) return; await fetch(`/api/broadcast/${b.id}`, { method: 'DELETE' }); load(); }}><IconTrash size={14} /></ActionIcon>
                </Group>
              </Group>
              <Text size="sm" c="dimmed" mt="xs" lineClamp={2}>{b.message}</Text>
            </Card>
          ))}
          {broadcasts.length === 0 && <Center py="xl"><Stack align="center" gap="xs"><IconBell size={40} color="#cbd5e1" /><Text c="dimmed">No broadcasts sent yet</Text></Stack></Center>}
        </Stack>
      )}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>Send Broadcast</Text>} radius="md" size="md">
        <Stack gap="sm">
          <TextInput label="Title / Subject" value={form.title} onChange={e => f('title', e.target.value)} required />
          <Textarea label="Message" value={form.message} onChange={e => f('message', e.target.value)} rows={4} required />
          <Grid>
            <Grid.Col span={6}><Select label="Send To" data={AUDIENCES.map(v => ({ value: v, label: v }))} value={form.audience} onChange={v => f('audience', v || 'All')} /></Grid.Col>
            <Grid.Col span={6}><Select label="Channel" data={CHANNELS.map(v => ({ value: v, label: v }))} value={form.channel} onChange={v => f('channel', v || 'All')} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><Select label="Priority" data={PRIORITIES.map(v => ({ value: v, label: v }))} value={form.priority} onChange={v => f('priority', v || 'Normal')} /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Schedule (optional)" type="datetime-local" value={form.scheduledAt} onChange={e => f('scheduledAt', e.target.value)} /></Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="sm"><Button variant="default" onClick={closeForm}>Cancel</Button><Button loading={saving} onClick={handleSend} leftSection={<IconBell size={14} />} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Send Now</Button></Group>
        </Stack>
      </Modal>
    </Box>
  );
}
