'use client';
export const dynamic = 'force-dynamic';
import { Box, Text, Group, Card, Stack, Switch, Select, TextInput, Button, Divider, Badge, ActionIcon } from '@mantine/core';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy, IconBell, IconPalette, IconShield, IconDatabase, IconMail } from '@tabler/icons-react';

export default function Page() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    autoBackup: true,
    backupFrequency: 'daily',
    language: 'en',
    timezone: 'Asia/Karachi',
    dateFormat: 'DD/MM/YYYY',
    currency: 'PKR',
    theme: 'light',
    sessionTimeout: '30',
    twoFactor: false,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    notifications.show({ title: 'Settings Saved', message: 'All settings have been updated', color: 'green' });
    setSaving(false);
  }

  const Section = ({ title, icon, children }: any) => (
    <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
      <Group gap="xs" mb="lg">
        <Box style={{ color: '#3b82f6' }}>{icon}</Box>
        <Text fw={600}>{title}</Text>
      </Group>
      <Divider mb="lg" />
      <Stack gap="md">{children}</Stack>
    </Card>
  );

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Settings</Text><Text size="sm" c="dimmed">System preferences & configuration</Text></Box>
        <Button leftSection={<IconDeviceFloppy size={16} />} onClick={save} loading={saving} radius="md">Save Settings</Button>
      </Group>

      <Stack gap="lg">
        <Section title="Notifications" icon={<IconBell size={20} />}>
          <Group justify="space-between"><Box><Text fw={500}>Email Notifications</Text><Text size="xs" c="dimmed">Receive alerts via email</Text></Box><Switch checked={settings.emailNotifications} onChange={e => setSettings(s => ({ ...s, emailNotifications: e.target.checked }))} /></Group>
          <Group justify="space-between"><Box><Text fw={500}>SMS Notifications</Text><Text size="xs" c="dimmed">Receive alerts via SMS</Text></Box><Switch checked={settings.smsNotifications} onChange={e => setSettings(s => ({ ...s, smsNotifications: e.target.checked }))} /></Group>
        </Section>

        <Section title="Localization" icon={<IconPalette size={20} />}>
          <Group grow>
            <Select label="Language" data={[{ value: 'en', label: 'English' }, { value: 'ur', label: 'Urdu' }]} value={settings.language} onChange={v => setSettings(s => ({ ...s, language: v || 'en' }))} />
            <Select label="Timezone" data={['Asia/Karachi', 'Asia/Lahore', 'UTC'].map(t => ({ value: t, label: t }))} value={settings.timezone} onChange={v => setSettings(s => ({ ...s, timezone: v || 'Asia/Karachi' }))} />
          </Group>
          <Group grow>
            <Select label="Date Format" data={['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map(f => ({ value: f, label: f }))} value={settings.dateFormat} onChange={v => setSettings(s => ({ ...s, dateFormat: v || 'DD/MM/YYYY' }))} />
            <Select label="Currency" data={['PKR', 'USD', 'EUR', 'GBP'].map(c => ({ value: c, label: c }))} value={settings.currency} onChange={v => setSettings(s => ({ ...s, currency: v || 'PKR' }))} />
          </Group>
        </Section>

        <Section title="Security" icon={<IconShield size={20} />}>
          <Group justify="space-between"><Box><Text fw={500}>Two-Factor Authentication</Text><Text size="xs" c="dimmed">Extra layer of security for admin accounts</Text></Box><Switch checked={settings.twoFactor} onChange={e => setSettings(s => ({ ...s, twoFactor: e.target.checked }))} /></Group>
          <Select label="Session Timeout" data={['15', '30', '60', '120'].map(m => ({ value: m, label: `${m} minutes` }))} value={settings.sessionTimeout} onChange={v => setSettings(s => ({ ...s, sessionTimeout: v || '30' }))} />
        </Section>

        <Section title="Backup & Data" icon={<IconDatabase size={20} />}>
          <Group justify="space-between"><Box><Text fw={500}>Automatic Backups</Text><Text size="xs" c="dimmed">Automatically backup database</Text></Box><Switch checked={settings.autoBackup} onChange={e => setSettings(s => ({ ...s, autoBackup: e.target.checked }))} /></Group>
          {settings.autoBackup && <Select label="Backup Frequency" data={[{ value: 'hourly', label: 'Hourly' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]} value={settings.backupFrequency} onChange={v => setSettings(s => ({ ...s, backupFrequency: v || 'daily' }))} />}
        </Section>
      </Stack>
    </Box>
  );
}
