'use client';

import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { SessionProvider } from 'next-auth/react';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: 'var(--font-jakarta), system-ui, sans-serif',
  colors: {
    blue: ['#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a'],
  },
  components: {
    Button: {
      defaultProps: { radius: 'md' },
    },
    TextInput: {
      defaultProps: { radius: 'md' },
      styles: {
        input: {
          '&:focus': {
            borderColor: '#3b82f6',
            boxShadow: '0 0 0 2px rgba(59,130,246,0.15)',
          },
        },
      },
    },
    Select: {
      defaultProps: { radius: 'md' },
    },
    Modal: {
      defaultProps: { radius: 'xl' },
    },
    Badge: {
      defaultProps: { radius: 'xl' },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
    <MantineProvider theme={theme}>
      <Notifications position="top-right" zIndex={9999} autoClose={4000} />
      {children}
    </MantineProvider>
    </SessionProvider>
  );
}
