'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, Stack, Button, TextInput, Textarea, Select, ActionIcon, Loader, Divider, Avatar, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconEdit, IconBuilding, IconMail, IconPhone, IconWorld } from '@tabler/icons-react';

const EMPTY = { name: '', address: '', city: '', country: 'Pakistan', phone: '', email: '', website: '', principalName: '', established: '', type: 'Private', description: '', motto: '' };

export default function Page() {
  const [profile, setProfile] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/school-profile').then(r => r.json());
      if (r.data) setProfile({ ...EMPTY, ...r.data });
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/school-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
      const data = await res.json();
      if (data.success) { notifications.show({ title: 'Saved', message: 'School profile updated', color: 'green' }); setEditing(false); }
      else throw new Error(data.error);
    } catch (e: any) { notifications.show({ title: 'Error', message: e.message, color: 'red' }); }
    finally { setSaving(false); }
  }

  if (loading) return <Box p="xl"><Group justify="center" py={80}><Loader size="lg" /></Group></Box>;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">School Profile</Text><Text size="sm" c="dimmed">Manage school information & settings</Text></Box>
        <Group>
          {editing ? (
            <>
              <Button variant="default" onClick={() => { setEditing(false); load(); }}>Cancel</Button>
              <Button leftSection={<IconDeviceFloppy size={16} />} onClick={save} loading={saving}>Save Changes</Button>
            </>
          ) : (
            <Button leftSection={<IconEdit size={16} />} onClick={() => setEditing(true)} variant="light">Edit Profile</Button>
          )}
        </Group>
      </Group>

      {!editing ? (
        // View Mode
        <Stack gap="xl">
          <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
            <Group gap="xl">
              <Avatar size={80} radius="md" color="blue"><IconBuilding size={40} /></Avatar>
              <Box>
                <Text size="xl" fw={800}>{profile.name || 'School Name Not Set'}</Text>
                {profile.motto && <Text size="sm" c="dimmed" fs="italic">"{profile.motto}"</Text>}
                <Group gap="xs" mt="xs">
                  <Badge variant="light" color="blue">{profile.type}</Badge>
                  {profile.established && <Badge variant="outline">Est. {profile.established}</Badge>}
                </Group>
              </Box>
            </Group>
          </Card>

          <SimpleGridView items={[
            { icon: <IconBuilding size={16} />, label: 'Address', value: [profile.address, profile.city, profile.country].filter(Boolean).join(', ') || '—' },
            { icon: <IconPhone size={16} />, label: 'Phone', value: profile.phone || '—' },
            { icon: <IconMail size={16} />, label: 'Email', value: profile.email || '—' },
            { icon: <IconWorld size={16} />, label: 'Website', value: profile.website || '—' },
          ]} />

          {profile.principalName && (
            <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
              <Text size="sm" c="dimmed">Principal</Text>
              <Text fw={600}>{profile.principalName}</Text>
            </Card>
          )}

          {profile.description && (
            <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
              <Text size="sm" c="dimmed" mb={4}>About</Text>
              <Text size="sm">{profile.description}</Text>
            </Card>
          )}
        </Stack>
      ) : (
        // Edit Mode
        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
          <Stack gap="md">
            <Group grow><TextInput label="School Name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required /><TextInput label="Principal Name" value={profile.principalName} onChange={e => setProfile(p => ({ ...p, principalName: e.target.value }))} /></Group>
            <TextInput label="Motto" value={profile.motto} onChange={e => setProfile(p => ({ ...p, motto: e.target.value }))} placeholder="School motto or tagline" />
            <Textarea label="Address" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} rows={2} />
            <Group grow>
              <TextInput label="City" value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} />
              <TextInput label="Country" value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))} />
            </Group>
            <Group grow>
              <TextInput label="Phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
              <TextInput label="Email" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
            </Group>
            <Group grow>
              <TextInput label="Website" value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} />
              <TextInput label="Established Year" value={profile.established} onChange={e => setProfile(p => ({ ...p, established: e.target.value }))} />
            </Group>
            <Select label="School Type" data={['Government', 'Private', 'Semi-Government', 'NGO'].map(t => ({ value: t, label: t }))} value={profile.type} onChange={v => setProfile(p => ({ ...p, type: v || 'Private' }))} />
            <Textarea label="About / Description" value={profile.description} onChange={e => setProfile(p => ({ ...p, description: e.target.value }))} rows={3} />
          </Stack>
        </Card>
      )}
    </Box>
  );
}

function SimpleGridView({ items }: { items: { icon: any; label: string; value: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {items.map(item => (
        <Card key={item.label} shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9' }}>
          <Group gap="xs" mb={4}>{item.icon}<Text size="xs" c="dimmed">{item.label}</Text></Group>
          <Text fw={500}>{item.value}</Text>
        </Card>
      ))}
    </div>
  );
}
