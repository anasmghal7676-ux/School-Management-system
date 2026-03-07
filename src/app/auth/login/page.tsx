'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Container, Card, Title, Text, TextInput, PasswordInput,
  Button, Stack, Group, Alert, Badge, Divider, Center, Loader,
  Anchor, ThemeIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconSchool, IconAlertCircle, IconLock, IconUser,
  IconArrowRight, IconSettings, IconCheck,
} from '@tabler/icons-react';

const CSS = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes floatY  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }

  .logo-float { animation: floatY 3s ease-in-out infinite; }
  .card-in    { animation: fadeUp 0.5s cubic-bezier(.4,0,.2,1) forwards; }
  .shake      { animation: shake 0.4s ease; }
  .shimmer-btn {
    background: linear-gradient(90deg,#2563eb,#7c3aed,#2563eb,#7c3aed);
    background-size: 300% auto;
    animation: shimmer 2.5s linear infinite;
    border: none !important;
    font-weight: 700 !important;
    transition: transform .15s ease, box-shadow .15s ease !important;
  }
  .shimmer-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(37,99,235,.5) !important; }
  .shimmer-btn:active { transform: translateY(0); }

  .glass-input input, .glass-input textarea {
    background: rgba(255,255,255,.08) !important;
    border: 1px solid rgba(255,255,255,.18) !important;
    color: #fff !important;
    transition: all .2s ease !important;
  }
  .glass-input input::placeholder { color: rgba(255,255,255,.3) !important; }
  .glass-input input:focus {
    background: rgba(255,255,255,.12) !important;
    border-color: #60a5fa !important;
    box-shadow: 0 0 0 3px rgba(96,165,250,.2) !important;
  }
  .cred-badge {
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 12px;
    padding: 10px 16px;
    cursor: pointer;
    transition: all .2s ease;
  }
  .cred-badge:hover {
    background: rgba(255,255,255,.1);
    border-color: rgba(96,165,250,.4);
    transform: translateY(-1px);
  }
`;

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState('');
  const [checking,  setChecking] = useState(true);
  const [shakeKey,  setShakeKey] = useState(0);

  /* check setup + auth redirect */
  useEffect(() => {
    fetch('/api/setup').then(r => r.json()).then(d => {
      if (d.setupRequired) router.replace('/setup');
    }).catch(() => {}).finally(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    if (status === 'authenticated') {
      const cb = searchParams?.get('callbackUrl');
      router.replace(cb && cb.startsWith('/') && !cb.includes('login') ? cb : '/');
    }
  }, [status, router, searchParams]);

  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      username: (v) => !v.trim() ? 'Enter username or email' : null,
      password: (v) => !v       ? 'Enter password' : null,
    },
  });

  /* auto-fill credentials */
  const fillCreds = () => {
    form.setValues({ username: 'admin', password: 'admin123' });
  };

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        username: values.username.trim(),
        password: values.password,
        redirect: false,
      });
      if (result?.ok && !result?.error) {
        notifications.show({ title:'Welcome back!', message:'Signing you in…', color:'green', icon:<IconCheck size={16}/> });
        const cb = searchParams?.get('callbackUrl');
        router.push(cb && cb.startsWith('/') && !cb.includes('login') ? cb : '/');
        router.refresh();
      } else {
        setError('Incorrect username or password. Check your credentials and try again.');
        setShakeKey(k => k + 1);
        form.setFieldValue('password', '');
      }
    } catch {
      setError('Connection error. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || checking) {
    return (
      <Center h="100vh" style={{ background: 'linear-gradient(135deg,#0f0c29,#1a1b4b,#24243e)' }}>
        <Stack align="center" gap="md">
          <Loader size="lg" color="blue" type="dots" />
          <Text c="rgba(255,255,255,.5)" size="sm">Loading…</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f0c29 0%,#1a1b4b 45%,#24243e 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,position:'relative',overflow:'hidden'}}>
      <style>{CSS}</style>

      {/* bg orbs */}
      <Box style={{position:'absolute',top:'-10%',right:'-8%',width:420,height:420,borderRadius:'50%',background:'radial-gradient(circle,rgba(37,99,235,.15),transparent 70%)',pointerEvents:'none'}}/>
      <Box style={{position:'absolute',bottom:'-8%',left:'-6%',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.12),transparent 70%)',pointerEvents:'none'}}/>

      <Container size={420} w="100%">
        <Stack gap="xl" align="center">
          {/* Logo */}
          <Stack align="center" gap="xs">
            <Box className="logo-float">
              <Box w={76} h={76} style={{borderRadius:22,background:'linear-gradient(135deg,#2563eb,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 10px 40px rgba(37,99,235,.45)'}}>
                <IconSchool size={38} color="white"/>
              </Box>
            </Box>
            <Title order={1} c="white" fw={800} size="h2">EduManage Pro</Title>
            <Text c="rgba(255,255,255,.45)" size="sm">School Management System</Text>
          </Stack>

          {/* Card */}
          <Card radius="xl" padding="xl" w="100%" className="card-in"
            style={{background:'rgba(255,255,255,.06)',backdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,.1)',boxShadow:'0 24px 64px rgba(0,0,0,.5)'}}>
            <Stack gap="lg">
              <Stack gap={2}>
                <Title order={3} c="white" fw={700}>Welcome back</Title>
                <Text size="sm" c="rgba(255,255,255,.45)">Sign in to your account</Text>
              </Stack>

              {error && (
                <Alert key={shakeKey} icon={<IconAlertCircle size={16}/>} className="shake"
                  style={{background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.3)'}}
                  styles={{message:{color:'#fca5a5'}}}>
                  {error}
                </Alert>
              )}

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <TextInput
                    label={<Text size="sm" c="rgba(255,255,255,.7)" fw={500}>Username or Email</Text>}
                    placeholder="admin"
                    className="glass-input"
                    leftSection={<IconUser size={16} color="rgba(255,255,255,.4)"/>}
                    disabled={loading}
                    autoComplete="username"
                    {...form.getInputProps('username')}
                    styles={{error:{color:'#f87171'}}}
                  />
                  <PasswordInput
                    label={<Text size="sm" c="rgba(255,255,255,.7)" fw={500}>Password</Text>}
                    placeholder="••••••••"
                    className="glass-input"
                    leftSection={<IconLock size={16} color="rgba(255,255,255,.4)"/>}
                    disabled={loading}
                    autoComplete="current-password"
                    {...form.getInputProps('password')}
                    styles={{innerInput:{color:'white'},visibilityToggle:{color:'rgba(255,255,255,.4)'},error:{color:'#f87171'}}}
                  />
                  <Button type="submit" fullWidth size="md" loading={loading}
                    className="shimmer-btn"
                    rightSection={!loading && <IconArrowRight size={18}/>}
                    mt={4}>
                    Sign In
                  </Button>
                </Stack>
              </form>

              <Divider label={<Text size="xs" c="rgba(255,255,255,.25)">Quick access</Text>} labelPosition="center" color="rgba(255,255,255,.1)"/>

              {/* Clickable default credentials */}
              <Box className="cred-badge" onClick={fillCreds}>
                <Group justify="space-between" align="center">
                  <Stack gap={2}>
                    <Text size="xs" c="rgba(255,255,255,.5)" fw={500}>Default admin credentials</Text>
                    <Group gap="xs">
                      <Badge size="sm" variant="outline" color="blue" style={{borderColor:'rgba(96,165,250,.5)',color:'#93c5fd'}}>admin</Badge>
                      <Badge size="sm" variant="outline" color="violet" style={{borderColor:'rgba(167,139,250,.5)',color:'#c4b5fd'}}>admin123</Badge>
                    </Group>
                  </Stack>
                  <Text size="xs" c="rgba(255,255,255,.3)">Click to fill →</Text>
                </Group>
              </Box>

              <Button variant="subtle" size="xs" fullWidth
                leftSection={<IconSettings size={14}/>}
                onClick={() => router.push('/setup')}
                styles={{root:{color:'rgba(255,255,255,.4)','&:hover':{background:'rgba(255,255,255,.05)',color:'rgba(255,255,255,.7)'}}}}>
                First-time setup wizard
              </Button>
            </Stack>
          </Card>

          <Text size="xs" c="rgba(255,255,255,.18)" ta="center">
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
      <Center h="100vh" style={{background:'linear-gradient(135deg,#0f0c29,#1a1b4b,#24243e)'}}>
        <Loader color="blue" size="lg" type="dots"/>
      </Center>
    }>
      <LoginForm/>
    </Suspense>
  );
}
