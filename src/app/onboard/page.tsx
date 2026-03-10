'use client';
import { useState } from 'react';
import { Box, Text, Button, TextInput, Select, Stepper, Group, Title, Paper, SimpleGrid, Progress, Badge, Stack, Loader, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSchool, IconUser, IconSettings, IconCheck, IconArrowRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

const STEPS = ['School Info', 'Admin Account', 'Configuration', 'Complete'];

const PLAN_OPTIONS = [
  { value: 'basic', label: 'Basic — up to 500 students', color: 'blue' },
  { value: 'standard', label: 'Standard — up to 2,000 students', color: 'green' },
  { value: 'premium', label: 'Premium — unlimited students', color: 'violet' },
];

const TIME_ZONES = [
  { value: 'Asia/Karachi', label: 'PKT — Asia/Karachi' },
  { value: 'Asia/Dubai', label: 'GST — Asia/Dubai' },
  { value: 'Asia/Kolkata', label: 'IST — Asia/Kolkata' },
  { value: 'America/New_York', label: 'EST — America/New_York' },
  { value: 'Europe/London', label: 'GMT — Europe/London' },
  { value: 'UTC', label: 'UTC' },
];

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [school, setSchool] = useState({ name: '', code: '', address: '', phone: '', email: '', plan: 'standard', timezone: 'Asia/Karachi' });
  const [admin, setAdmin] = useState({ name: '', email: '', password: '', confirm: '' });

  const s = (k: string, v: string) => setSchool(p => ({ ...p, [k]: v }));
  const a = (k: string, v: string) => setAdmin(p => ({ ...p, [k]: v }));

  const canNext = () => {
    if (step === 0) return school.name && school.code && school.email;
    if (step === 1) return admin.name && admin.email && admin.password.length >= 8 && admin.password === admin.confirm;
    if (step === 2) return true;
    return false;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school, admin }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Setup failed');
      setDone(true);
      setStep(3);
      setTimeout(() => router.push('/login'), 3000);
    } catch (e: any) {
      notifications.show({ title: 'Error', message: e.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Paper shadow="xl" radius="xl" p={40} style={{ width: '100%', maxWidth: 600 }}>
        <Group justify="center" mb={8}>
          <Box style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconSchool size={24} color="white" />
          </Box>
        </Group>
        <Title order={2} ta="center" mb={4}>Set Up EduMaster</Title>
        <Text ta="center" c="dimmed" size="sm" mb={32}>Get your school management system ready in minutes</Text>

        <Progress value={(step / 3) * 100} mb={24} radius="xl" color={done ? 'green' : 'blue'} size={6} />

        <Group justify="center" mb={32} gap={4}>
          {STEPS.map((label, i) => (
            <Badge key={label} variant={i === step ? 'filled' : i < step ? 'light' : 'outline'} color={i < step ? 'green' : i === step ? 'blue' : 'gray'} size="sm" radius="xl">
              {i < step ? '✓ ' : ''}{label}
            </Badge>
          ))}
        </Group>

        {step === 0 && (
          <Stack gap={16}>
            <Text fw={600} size="lg">School Information</Text>
            <TextInput label="School Name *" placeholder="e.g. Al-Noor Academy" value={school.name} onChange={e => s('name', e.target.value)} />
            <TextInput label="School Code *" placeholder="e.g. ALN001" value={school.code} onChange={e => s('code', e.target.value.toUpperCase())} description="Short unique identifier for your school" />
            <TextInput label="Contact Email *" placeholder="principal@school.edu" value={school.email} onChange={e => s('email', e.target.value)} type="email" />
            <TextInput label="Phone" placeholder="+92-300-1234567" value={school.phone} onChange={e => s('phone', e.target.value)} />
            <TextInput label="Address" placeholder="123 School Road, City" value={school.address} onChange={e => s('address', e.target.value)} />
            <Select label="Plan" data={PLAN_OPTIONS.map(p => ({ value: p.value, label: p.label }))} value={school.plan} onChange={v => s('plan', v || 'standard')} />
          </Stack>
        )}

        {step === 1 && (
          <Stack gap={16}>
            <Text fw={600} size="lg">Administrator Account</Text>
            <TextInput label="Full Name *" placeholder="John Smith" value={admin.name} onChange={e => a('name', e.target.value)} />
            <TextInput label="Email *" placeholder="admin@yourschool.edu" value={admin.email} onChange={e => a('email', e.target.value)} type="email" />
            <TextInput label="Password *" placeholder="Min 8 characters" value={admin.password} onChange={e => a('password', e.target.value)} type="password" description="Must be at least 8 characters" />
            <TextInput label="Confirm Password *" placeholder="Repeat password" value={admin.confirm} onChange={e => a('confirm', e.target.value)} type="password" error={admin.confirm && admin.password !== admin.confirm ? "Passwords don't match" : undefined} />
          </Stack>
        )}

        {step === 2 && (
          <Stack gap={16}>
            <Text fw={600} size="lg">Configuration</Text>
            <Select label="Timezone" data={TIME_ZONES} value={school.timezone} onChange={v => s('timezone', v || 'UTC')} />
            <Paper withBorder p={16} radius="md" bg="#f8fafc">
              <Text fw={600} mb={8} size="sm">Setup Summary</Text>
              <SimpleGrid cols={2} spacing={8}>
                <Text size="sm" c="dimmed">School</Text><Text size="sm" fw={500}>{school.name}</Text>
                <Text size="sm" c="dimmed">Code</Text><Text size="sm" fw={500}>{school.code}</Text>
                <Text size="sm" c="dimmed">Plan</Text><Text size="sm" fw={500} tt="capitalize">{school.plan}</Text>
                <Text size="sm" c="dimmed">Admin</Text><Text size="sm" fw={500}>{admin.name}</Text>
                <Text size="sm" c="dimmed">Timezone</Text><Text size="sm" fw={500}>{school.timezone}</Text>
              </SimpleGrid>
            </Paper>
          </Stack>
        )}

        {step === 3 && (
          <Center py={32}>
            <Stack align="center" gap={16}>
              <Box style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconCheck size={32} color="#22c55e" />
              </Box>
              <Title order={3} c="green">Setup Complete!</Title>
              <Text ta="center" c="dimmed">Your EduMaster account for <strong>{school.name}</strong> is ready. Redirecting to login…</Text>
              <Loader size="sm" color="green" />
            </Stack>
          </Center>
        )}

        {step < 3 && (
          <Group justify="space-between" mt={32}>
            <Button variant="subtle" color="gray" onClick={() => setStep(s => s - 1)} disabled={step === 0}>Back</Button>
            {step < 2 ? (
              <Button rightSection={<IconArrowRight size={16} />} onClick={() => setStep(s => s + 1)} disabled={!canNext()}>Continue</Button>
            ) : (
              <Button rightSection={<IconCheck size={16} />} color="green" onClick={handleFinish} loading={loading} disabled={loading}>Create School</Button>
            )}
          </Group>
        )}
      </Paper>
    </Box>
  );
}
