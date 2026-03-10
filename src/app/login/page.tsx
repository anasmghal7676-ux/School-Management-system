'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Box, Button, TextInput, PasswordInput, Text, Card, Stack, Alert, Group, Title, Badge } from '@mantine/core';
import { IconSchool, IconAlertCircle, IconLogin } from '@tabler/icons-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Email and password required'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid credentials or account locked.');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Box style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <Card shadow="xl" radius="xl" p="xl" style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.97)' }}>
        <Stack gap="lg">
          {/* Logo */}
          <Stack align="center" gap="xs">
            <Box style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconSchool size={32} color="white" />
            </Box>
            <Title order={2} ta="center" c="#0f172a">School ERP</Title>
            <Text size="sm" c="dimmed" ta="center">Sign in to your account</Text>
          </Stack>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md">
              {error}
            </Alert>
          )}

          <Stack gap="sm">
            <TextInput
              label="Email or Username"
              placeholder="admin@school.com"
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              size="md"
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              size="md"
            />
          </Stack>

          <Button
            fullWidth
            size="md"
            leftSection={<IconLogin size={18} />}
            onClick={handleLogin}
            loading={loading}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            Sign In
          </Button>

          {/* Demo credentials */}
          <Card radius="md" p="sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Text size="xs" fw={600} c="dimmed" mb={6}>Demo Credentials</Text>
            <Group gap="xs">
              <Badge size="sm" color="blue" variant="light">admin@school.com</Badge>
              <Badge size="sm" color="gray" variant="light">Admin@123!</Badge>
            </Group>
          </Card>
        </Stack>
      </Card>
    </Box>
  );
}
