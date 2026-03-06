'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  Tabs, Title, Text, Stack, Card, Grid, TextInput, Textarea,
  Select, Button, Group, Badge, Avatar, Box, Divider,
  SimpleGrid, ThemeIcon, NumberInput, Alert, Skeleton,
  Paper, ActionIcon, Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconSchool, IconUser, IconBell, IconShield, IconPalette,
  IconCheck, IconAlertCircle, IconEdit, IconBuilding,
  IconPhone, IconMail, IconMapPin, IconCalendar,
  IconBriefcase, IconBook, IconRefresh,
} from '@tabler/icons-react';

const BOARDS = [
  { value: 'fbise', label: 'FBISE (Federal Board)' },
  { value: 'bise_lahore', label: 'BISE Lahore' },
  { value: 'bise_karachi', label: 'BISE Karachi' },
  { value: 'bise_peshawar', label: 'BISE Peshawar' },
  { value: 'bise_quetta', label: 'BISE Quetta' },
  { value: 'cambridge', label: 'Cambridge (O/A Level)' },
  { value: 'aga_khan', label: 'Aga Khan Board' },
  { value: 'other', label: 'Other / Private' },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [school, setSchool] = useState<any>(null);

  const form = useForm({
    initialValues: {
      name: '', code: '', address: '', city: '', province: '',
      phone: '', email: '', website: '', board: '', affiliation: '',
      principalName: '', motto: '', schoolType: 'Private',
      mediumOfInstruction: 'English', registrationNumber: '',
    },
    validate: {
      name: (v) => !v.trim() ? 'School name required' : null,
      phone: (v) => !v.trim() ? 'Phone required' : null,
      email: (v) => !/^\S+@\S+\.\S+$/.test(v) ? 'Valid email required' : null,
    },
  });

  const fetchSchool = async () => {
    try {
      const res = await fetch('/api/school');
      const data = await res.json();
      if (data.success) {
        const s = data.data;
        setSchool(s);
        form.setValues({
          name: s.name || '',
          code: s.code || '',
          address: s.address || '',
          city: s.city || '',
          province: s.province || '',
          phone: s.phone || '',
          email: s.email || '',
          website: s.website || '',
          board: s.board || '',
          affiliation: s.affiliation || '',
          principalName: s.principalName || '',
          motto: s.motto || '',
          schoolType: s.schoolType || 'Private',
          mediumOfInstruction: s.mediumOfInstruction || 'English',
          registrationNumber: s.registrationNumber || '',
        });
      }
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Failed to load school data', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchool(); }, []);

  const handleSave = async (values: typeof form.values) => {
    setSaving(true);
    try {
      const res = await fetch('/api/school', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        notifications.show({ title: 'Saved!', message: 'School profile updated successfully', color: 'green', icon: <IconCheck size={16} /> });
        setSchool(data.data);
      } else {
        notifications.show({ title: 'Error', message: data.error || 'Save failed', color: 'red' });
      }
    } catch (e: any) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Box>
          <Title order={2}>Settings</Title>
          <Text c="dimmed" size="sm">Manage your school profile and system configuration</Text>
        </Box>
        <Tooltip label="Refresh">
          <ActionIcon variant="light" onClick={fetchSchool} loading={loading}>
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Tabs defaultValue="school" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="school" leftSection={<IconSchool size={16} />}>School Profile</Tabs.Tab>
          <Tabs.Tab value="academic" leftSection={<IconCalendar size={16} />}>Academic</Tabs.Tab>
          <Tabs.Tab value="notifications" leftSection={<IconBell size={16} />}>Notifications</Tabs.Tab>
          <Tabs.Tab value="security" leftSection={<IconShield size={16} />}>Security</Tabs.Tab>
        </Tabs.List>

        {/* ── School Profile Tab ─────────────────────── */}
        <Tabs.Panel value="school" pt="lg">
          {loading ? (
            <Stack gap="md">
              {[1,2,3,4].map(i => <Skeleton key={i} height={56} radius="md" />)}
            </Stack>
          ) : (
            <form onSubmit={form.onSubmit(handleSave)}>
              <Stack gap="lg">
                {/* School Identity Card */}
                <Card withBorder radius="md" padding="lg">
                  <Group mb="lg">
                    <ThemeIcon size="xl" radius="md" color="blue" variant="light">
                      <IconSchool size={24} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={700} size="lg">{school?.name || 'Your School'}</Text>
                      <Text size="sm" c="dimmed">School ID: {school?.id}</Text>
                    </Box>
                    {school && (
                      <Badge ml="auto" color="green" variant="light">Active</Badge>
                    )}
                  </Group>
                  <Divider mb="md" />
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 8 }}>
                      <TextInput
                        label="School Name"
                        placeholder="Full official name"
                        leftSection={<IconSchool size={16} />}
                        required
                        {...form.getInputProps('name')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        label="School Code"
                        placeholder="ABC-001"
                        {...form.getInputProps('code')}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Textarea
                        label="Address"
                        placeholder="Full street address"
                        rows={2}
                        leftSection={<IconMapPin size={16} />}
                        {...form.getInputProps('address')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput label="City" placeholder="Islamabad" {...form.getInputProps('city')} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Select
                        label="Province"
                        data={['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad Capital Territory', 'AJK', 'Gilgit-Baltistan']}
                        {...form.getInputProps('province')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        label="Registration No."
                        placeholder="REG-12345"
                        {...form.getInputProps('registrationNumber')}
                      />
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Contact Information */}
                <Card withBorder radius="md" padding="lg">
                  <Text fw={600} mb="md">Contact Information</Text>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Phone"
                        placeholder="+92 51 1234567"
                        leftSection={<IconPhone size={16} />}
                        required
                        {...form.getInputProps('phone')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Email"
                        placeholder="info@school.edu.pk"
                        leftSection={<IconMail size={16} />}
                        required
                        {...form.getInputProps('email')}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <TextInput
                        label="Website (optional)"
                        placeholder="https://www.school.edu.pk"
                        {...form.getInputProps('website')}
                      />
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Academic Details */}
                <Card withBorder radius="md" padding="lg">
                  <Text fw={600} mb="md">Academic Details</Text>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select
                        label="Affiliated Board"
                        data={BOARDS}
                        {...form.getInputProps('board')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select
                        label="School Type"
                        data={['Private', 'Public', 'Semi-Government', 'NGO']}
                        {...form.getInputProps('schoolType')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select
                        label="Medium of Instruction"
                        data={['English', 'Urdu', 'Both']}
                        {...form.getInputProps('mediumOfInstruction')}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Principal Name"
                        placeholder="Mr. / Mrs."
                        leftSection={<IconUser size={16} />}
                        {...form.getInputProps('principalName')}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <TextInput
                        label="School Motto (optional)"
                        placeholder="Education for Excellence"
                        {...form.getInputProps('motto')}
                      />
                    </Grid.Col>
                  </Grid>
                </Card>

                <Group justify="flex-end">
                  <Button variant="light" onClick={() => fetchSchool()}>Reset</Button>
                  <Button
                    type="submit"
                    loading={saving}
                    leftSection={<IconCheck size={16} />}
                    color="green"
                  >
                    Save School Profile
                  </Button>
                </Group>
              </Stack>
            </form>
          )}
        </Tabs.Panel>

        {/* ── Academic Tab ─────────────────────────────── */}
        <Tabs.Panel value="academic" pt="lg">
          <Card withBorder radius="md" padding="lg">
            <Stack gap="md">
              <Text fw={600}>Academic Year Settings</Text>
              {school?.academicYears?.[0] ? (
                <Alert icon={<IconCalendar size={16} />} color="blue" variant="light">
                  Current academic year: <strong>{school.academicYears[0].name}</strong>
                </Alert>
              ) : null}
              <Text c="dimmed" size="sm">
                Manage academic years, class structures, and exam periods from the dedicated modules.
              </Text>
              <Group>
                <Button variant="light" component="a" href="/acad-years">Manage Academic Years</Button>
                <Button variant="light" component="a" href="/classes">Manage Classes</Button>
                <Button variant="light" component="a" href="/sections">Manage Sections</Button>
              </Group>
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* ── Notifications Tab ────────────────────────── */}
        <Tabs.Panel value="notifications" pt="lg">
          <Card withBorder radius="md" padding="lg">
            <Stack gap="md">
              <Text fw={600}>Notification Preferences</Text>
              <Alert icon={<IconAlertCircle size={16} />} color="orange" variant="light">
                Notification configuration coming soon. You can configure SMS gateway from the SMS Gateway module.
              </Alert>
              <Button variant="light" component="a" href="/sms-gateway">Configure SMS Gateway</Button>
            </Stack>
          </Card>
        </Tabs.Panel>

        {/* ── Security Tab ─────────────────────────────── */}
        <Tabs.Panel value="security" pt="lg">
          <Card withBorder radius="md" padding="lg">
            <Stack gap="md">
              <Text fw={600}>Security Settings</Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Paper p="md" radius="md" withBorder>
                  <Group mb="xs">
                    <ThemeIcon color="blue" variant="light" size="md"><IconUser size={16} /></ThemeIcon>
                    <Text fw={600} size="sm">Users & Roles</Text>
                  </Group>
                  <Text size="xs" c="dimmed" mb="sm">Manage user accounts and role permissions</Text>
                  <Button size="xs" variant="light" component="a" href="/users">Manage Users</Button>
                </Paper>
                <Paper p="md" radius="md" withBorder>
                  <Group mb="xs">
                    <ThemeIcon color="red" variant="light" size="md"><IconShield size={16} /></ThemeIcon>
                    <Text fw={600} size="sm">Audit Logs</Text>
                  </Group>
                  <Text size="xs" c="dimmed" mb="sm">View all system activity and changes</Text>
                  <Button size="xs" variant="light" color="red" component="a" href="/audit-logs">View Audit Logs</Button>
                </Paper>
              </SimpleGrid>
            </Stack>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
