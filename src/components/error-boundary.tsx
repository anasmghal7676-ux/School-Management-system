'use client';
import React, { Component, ReactNode } from 'react';
import { Box, Text, Button, Stack, Center } from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconHome } from '@tabler/icons-react';
import Link from 'next/link';

interface Props { children: ReactNode; fallback?: ReactNode; pageName?: string; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('ErrorBoundary:', error, info); }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Center py="xl">
          <Stack align="center" gap="md" style={{ maxWidth: 400 }}>
            <Box style={{ width: 60, height: 60, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconAlertTriangle size={28} color="#ef4444" />
            </Box>
            <Text size="lg" fw={700}>Something went wrong</Text>
            <Text size="sm" c="dimmed" ta="center">{this.state.error?.message || 'An unexpected error occurred'}</Text>
            <Stack gap="xs" style={{ width: '100%' }}>
              <Button leftSection={<IconRefresh size={16} />} onClick={() => this.setState({ hasError: false })} variant="filled" color="blue" fullWidth>Try Again</Button>
              <Button leftSection={<IconHome size={16} />} component={Link} href="/" variant="outline" fullWidth>Go Home</Button>
            </Stack>
          </Stack>
        </Center>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
