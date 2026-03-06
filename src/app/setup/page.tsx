'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container, Stepper, Title, Text, TextInput, Textarea, Select,
  Group, Button, Card, Stack, Grid, Box, ThemeIcon, Paper,
  FileInput, ColorInput, NumberInput, Divider, Badge,
  SimpleGrid, Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconSchool, IconUser, IconSettings, IconCheck,
  IconBuilding, IconPhone, IconMail, IconMapPin,
  IconCalendar, IconCurrencyDollar, IconUpload, IconAlertCircle,
} from '@tabler/icons-react';

const STEPS = [
  { label: 'School Info', description: 'Basic details', icon: IconSchool },
  { label: 'Admin Account', description: 'Your credentials', icon: IconUser },
  { label: 'Academic Setup', description: 'Year & classes', icon: IconCalendar },
  { label: 'Complete', description: 'All done!', icon: IconCheck },
];

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

const MONTHS = [
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' }, { value: '4', label: 'April' },
  { value: '5', label: 'May' }, { value: '6', label: 'June' },
  { value: '7', label: 'July' }, { value: '8', label: 'August' },
  { value: '9', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

export default function SetupPage() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      // School Info
      schoolName: '',
      schoolCode: '',
      address: '',
      city: '',
      province: '',
      phone: '',
      email: '',
      website: '',
      board: '',
      establishedYear: new Date().getFullYear(),
      // Admin Account
      adminName: '',
      adminEmail: '',
      adminUsername: 'admin',
      adminPassword: '',
      // Academic Setup
      academicYearStart: '4', // April
      currentYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      classes: ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      sectionsPerClass: '2',
    },
    validate: {
      schoolName: (v) => v.trim().length < 3 ? 'School name is required' : null,
      phone: (v) => !v.trim() ? 'Phone is required' : null,
      email: (v) => !/^\S+@\S+\.\S+$/.test(v) ? 'Valid email required' : null,
      adminName: (v, vals) => active < 1 ? null : (!v.trim() ? 'Admin name required' : null),
      adminEmail: (v, vals) => active < 1 ? null : (!/^\S+@\S+\.\S+$/.test(v) ? 'Valid email required' : null),
      adminPassword: (v, vals) => active < 1 ? null : (v.length < 8 ? 'Min 8 characters' : null),
    },
  });

  const nextStep = () => {
    const valid = form.validate();
    if (!valid.hasErrors) setActive((a) => Math.min(a + 1, 3));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.values),
      });
      const data = await res.json();
      if (data.success) {
        setActive(3);
        notifications.show({
          title: 'Setup Complete!',
          message: 'Your school system is ready. Redirecting to login…',
          color: 'green',
          icon: <IconCheck size={16} />,
        });
        setTimeout(() => router.push('/auth/login'), 2500);
      } else {
        notifications.show({ title: 'Error', message: data.error || 'Setup failed', color: 'red' });
      }
    } catch (e: any) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1b4b 0%, #1565c0 50%, #0d47a1 100%)',
        display: 'flex',
        alignItems: 'center',
        padding: '24px 16px',
      }}
    >
      <Container size="lg" w="100%">
        {/* Header */}
        <Stack align="center" mb="xl" gap="xs">
          <Box
            w={72} h={72}
            bg="white"
            style={{ borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
          >
            <IconSchool size={36} color="#1565c0" />
          </Box>
          <Title c="white" order={1} fw={800}>EduManage Pro</Title>
          <Text c="rgba(255,255,255,0.7)" size="sm">First-time Setup Wizard</Text>
        </Stack>

        <Card radius="xl" shadow="xl" p={{ base: 'md', sm: 'xl' }}>
          {/* Stepper */}
          <Stepper active={active} mb="xl" size="sm" color="blue">
            {STEPS.map((step) => (
              <Stepper.Step
                key={step.label}
                label={step.label}
                description={step.description}
                icon={<step.icon size={16} />}
              />
            ))}
          </Stepper>

          {/* Step 0 — School Info */}
          {active === 0 && (
            <Stack gap="md">
              <Title order={3}>School Information</Title>
              <Text c="dimmed" size="sm">Enter your school's details. These will appear on reports, fee receipts, and certificates.</Text>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 8 }}>
                  <TextInput
                    label="School Name"
                    placeholder="Al-Huda Public School"
                    required
                    leftSection={<IconSchool size={16} />}
                    {...form.getInputProps('schoolName')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <TextInput
                    label="School Code (optional)"
                    placeholder="AHS-001"
                    {...form.getInputProps('schoolCode')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label="Address"
                    placeholder="Street address, area"
                    rows={2}
                    leftSection={<IconMapPin size={16} />}
                    {...form.getInputProps('address')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput label="City" placeholder="Islamabad" {...form.getInputProps('city')} />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Province"
                    placeholder="Select province"
                    data={['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad Capital Territory', 'AJK', 'Gilgit-Baltistan']}
                    {...form.getInputProps('province')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Phone" placeholder="+92 51 1234567"
                    leftSection={<IconPhone size={16} />}
                    required
                    {...form.getInputProps('phone')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Email" placeholder="info@school.edu.pk"
                    leftSection={<IconMail size={16} />}
                    required
                    {...form.getInputProps('email')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Affiliated Board"
                    placeholder="Select board"
                    data={BOARDS}
                    {...form.getInputProps('board')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <NumberInput
                    label="Established Year"
                    placeholder="1990"
                    min={1900}
                    max={new Date().getFullYear()}
                    {...form.getInputProps('establishedYear')}
                  />
                </Grid.Col>
              </Grid>
              <Group justify="flex-end" mt="md">
                <Button onClick={nextStep} size="md">Continue →</Button>
              </Group>
            </Stack>
          )}

          {/* Step 1 — Admin Account */}
          {active === 1 && (
            <Stack gap="md">
              <Title order={3}>Admin Account</Title>
              <Text c="dimmed" size="sm">Create your super admin account. You can add more users later.</Text>
              <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                Save these credentials carefully — you'll use them to log in every time.
              </Alert>
              <Grid>
                <Grid.Col span={12}>
                  <TextInput
                    label="Full Name"
                    placeholder="Muhammad Ahmad"
                    required
                    leftSection={<IconUser size={16} />}
                    {...form.getInputProps('adminName')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Email"
                    placeholder="admin@school.edu.pk"
                    required
                    leftSection={<IconMail size={16} />}
                    {...form.getInputProps('adminEmail')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Username"
                    placeholder="admin"
                    required
                    {...form.getInputProps('adminUsername')}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput
                    label="Password"
                    type="password"
                    placeholder="Min 8 characters"
                    required
                    {...form.getInputProps('adminPassword')}
                  />
                </Grid.Col>
              </Grid>
              <Group justify="space-between" mt="md">
                <Button variant="subtle" onClick={() => setActive(0)}>← Back</Button>
                <Button onClick={nextStep} size="md">Continue →</Button>
              </Group>
            </Stack>
          )}

          {/* Step 2 — Academic Setup */}
          {active === 2 && (
            <Stack gap="md">
              <Title order={3}>Academic Configuration</Title>
              <Text c="dimmed" size="sm">Set up your academic year and class structure.</Text>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Current Academic Year"
                    placeholder="2025-2026"
                    {...form.getInputProps('currentYear')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Academic Year Starts"
                    data={MONTHS}
                    {...form.getInputProps('academicYearStart')}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Sections per Class"
                    data={['1', '2', '3', '4', '5']}
                    {...form.getInputProps('sectionsPerClass')}
                  />
                </Grid.Col>
              </Grid>
              <Text fw={600} size="sm" mt="sm">Classes to create:</Text>
              <SimpleGrid cols={{ base: 3, sm: 6 }} spacing="xs">
                {form.values.classes.map((cls) => (
                  <Badge key={cls} variant="light" color="blue" size="lg">Class {cls}</Badge>
                ))}
              </SimpleGrid>
              <Text c="dimmed" size="xs">These classes and sections will be automatically created. You can add more later.</Text>
              <Group justify="space-between" mt="md">
                <Button variant="subtle" onClick={() => setActive(1)}>← Back</Button>
                <Button onClick={handleSubmit} loading={loading} size="md" color="green">
                  Complete Setup ✓
                </Button>
              </Group>
            </Stack>
          )}

          {/* Step 3 — Done */}
          {active === 3 && (
            <Stack align="center" gap="lg" py="xl">
              <ThemeIcon size={80} radius="xl" color="green" variant="light">
                <IconCheck size={40} />
              </ThemeIcon>
              <Title order={2} ta="center">Setup Complete!</Title>
              <Text c="dimmed" ta="center">
                Your school management system is ready. Redirecting you to the login page…
              </Text>
              <Paper p="md" radius="md" bg="blue.0" w="100%" maw={400}>
                <Stack gap={4}>
                  <Text size="sm" fw={700} c="blue">Your Login Credentials:</Text>
                  <Text size="sm">Username: <strong>{form.values.adminUsername}</strong></Text>
                  <Text size="sm">Password: <strong>{form.values.adminPassword}</strong></Text>
                </Stack>
              </Paper>
              <Button component="a" href="/auth/login" size="md">Go to Login →</Button>
            </Stack>
          )}
        </Card>
      </Container>
    </Box>
  );
}
