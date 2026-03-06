'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Container, Card, Title, Text, TextInput, PasswordInput,
  Button, Group, Stack, ThemeIcon, Alert, Anchor, Center,
  Paper, Divider, Badge, Loader,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconSchool, IconAlertCircle, IconLock, IconUser,
  IconArrowRight, IconSettings,
} from '@tabler/icons-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  // Check if first-run setup is needed
  useEffect(() => {
    fetch('/api/setup')
      .then(r => r.json())
      .then(d => {
        if (d.setupRequired) {
          router.replace('/setup');
        } else {
          setSetupRequired(false);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingSetup(false));
  }, [router]);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      const cb = searchParams?.get('callbackUrl');
      router.replace(cb && cb.startsWith('/') ? cb : '/');
    }
  }, [status, router, searchParams]);

  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      username: (v) => !v.trim() ? 'Username required' : null,
      password: (v) => !v ? 'Password required' : null,
    },
  });

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        username: values.username.trim(),
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username or password. Account may be locked after 5 failed attempts.');
        form.setFieldValue('password', '');
      } else if (result?.ok) {
        const cb = searchParams?.get('callbackUrl');
        router.push(cb && cb.startsWith('/') ? cb : '/');
        router.refresh();
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || checkingSetup) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" color="blue" />
          <Text c="rgba(255,255,255,0.7)" size="sm">Loading…</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1b4b 40%, #24243e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        style={{
          position: 'absolute', top: -100, right: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container size={420} w="100%">
        <Stack gap="xl" align="center">
          {/* Logo */}
          <Stack align="center" gap="xs">
            <Box
              w={72} h={72}
              style={{
                borderRadius: 20,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
              }}
            >
              <IconSchool size={36} color="white" />
            </Box>
            <Title order={1} c="white" fw={800} size="h2">EduManage Pro</Title>
            <Text c="rgba(255,255,255,0.5)" size="sm">School Management System</Text>
          </Stack>

          {/* Card */}
          <Card
            radius="xl"
            p="xl"
            w="100%"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Stack gap="lg">
              <Stack gap={4}>
                <Title order={3} c="white" fw={700}>Welcome back</Title>
                <Text size="sm" c="rgba(255,255,255,0.5)">Sign in to your account</Text>
              </Stack>

              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  variant="filled"
                  radius="md"
                  style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}
                >
                  <Text size="sm" c="white">{error}</Text>
                </Alert>
              )}

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <TextInput
                    label={<Text size="sm" c="rgba(255,255,255,0.7)" fw={500}>Username or Email</Text>}
                    placeholder="admin"
                    leftSection={<IconUser size={16} color="rgba(255,255,255,0.4)" />}
                    styles={{
                      input: {
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'white',
                        '&::placeholder': { color: 'rgba(255,255,255,0.3)' },
                        '&:focus': { borderColor: '#3b82f6' },
                      },
                    }}
                    {...form.getInputProps('username')}
                    disabled={loading}
                    autoComplete="username"
                  />

                  <PasswordInput
                    label={<Text size="sm" c="rgba(255,255,255,0.7)" fw={500}>Password</Text>}
                    placeholder="••••••••"
                    leftSection={<IconLock size={16} color="rgba(255,255,255,0.4)" />}
                    styles={{
                      input: {
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'white',
                      },
                      innerInput: { color: 'white' },
                    }}
                    {...form.getInputProps('password')}
                    disabled={loading}
                    autoComplete="current-password"
                  />

                  <Button
                    type="submit"
                    fullWidth
                    size="md"
                    loading={loading}
                    rightSection={!loading && <IconArrowRight size={18} />}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                      border: 'none',
                      marginTop: 4,
                    }}
                  >
                    Sign In
                  </Button>
                </Stack>
              </form>

              <Divider
                label={<Text size="xs" c="rgba(255,255,255,0.3)">OR</Text>}
                labelPosition="center"
                color="rgba(255,255,255,0.1)"
              />

              <Button
                variant="subtle"
                fullWidth
                leftSection={<IconSettings size={16} />}
                onClick={() => router.push('/setup')}
                styles={{ root: { color: 'rgba(255,255,255,0.5)', '&:hover': { background: 'rgba(255,255,255,0.05)' } } }}
                size="sm"
              >
                First-time Setup
              </Button>
            </Stack>
          </Card>

          {/* Default credentials hint */}
          <Paper
            p="sm"
            radius="md"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', width: '100%' }}
          >
            <Group gap="xs" justify="center">
              <Text size="xs" c="rgba(255,255,255,0.4)">Default:</Text>
              <Badge size="sm" variant="outline" color="blue" style={{ borderColor: 'rgba(59,130,246,0.4)' }}>
                admin
              </Badge>
              <Badge size="sm" variant="outline" color="violet" style={{ borderColor: 'rgba(124,58,237,0.4)' }}>
                admin123
              </Badge>
            </Group>
          </Paper>

          <Text size="xs" c="rgba(255,255,255,0.2)" ta="center">
            © {new Date().getFullYear()} EduManage Pro — All rights reserved
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Center h="100vh" style={{ background: 'linear-gradient(135deg, #0f0c29, #1a1b4b, #24243e)' }}>
        <Loader color="blue" size="lg" />
      </Center>
    }>
      <LoginForm />
    </Suspense>
  );
}
