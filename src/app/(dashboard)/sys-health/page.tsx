'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, SimpleGrid, Card, Button, Loader, Center, Stack, Progress } from '@mantine/core';
import { IconDatabase, IconServer, IconRefresh, IconCheck, IconX, IconClock, IconUsers, IconSchool, IconActivity } from '@tabler/icons-react';

export default function SysHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sys-health');
      const data = await res.json();
      setHealth(data.data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const statusColor = (s: string) => s === 'healthy' ? 'green' : s === 'degraded' ? 'yellow' : 'red';

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">System Health</Text>
          <Text size="sm" c="dimmed">
            {lastRefresh ? `Last refreshed: ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
          </Text>
        </Box>
        <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={fetchHealth} loading={loading}>
          Refresh
        </Button>
      </Group>

      {loading && !health ? (
        <Center h={200}><Loader /></Center>
      ) : health ? (
        <Stack gap="lg">
          {/* Overall Status */}
          <Card shadow="xs" radius="md" p="lg" style={{ border: `2px solid ${health.status === 'healthy' ? '#22c55e' : '#f59e0b'}33` }}>
            <Group>
              <Box style={{ width: 52, height: 52, borderRadius: 14, background: health.status === 'healthy' ? '#22c55e' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconActivity size={26} color="white" />
              </Box>
              <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Overall Status</Text>
                <Group gap={8}>
                  <Text size="xl" fw={800} tt="capitalize">{health.status}</Text>
                  <Badge color={statusColor(health.status)} variant="light" size="lg">{health.status === 'healthy' ? '✓ All Systems Operational' : '⚠ Performance Degraded'}</Badge>
                </Group>
              </Box>
            </Group>
          </Card>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {/* Database */}
            <Card shadow="xs" radius="md" p="lg">
              <Group mb="sm">
                <Box style={{ width: 36, height: 36, borderRadius: 10, background: health.checks?.database?.status === 'healthy' ? '#dcfce7' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconDatabase size={18} color={health.checks?.database?.status === 'healthy' ? '#16a34a' : '#dc2626'} />
                </Box>
                <Text fw={600} size="sm">Database</Text>
              </Group>
              <Badge color={statusColor(health.checks?.database?.status || 'unknown')} variant="light" fullWidth>
                {health.checks?.database?.status || 'Unknown'}
              </Badge>
              {health.checks?.database?.responseTime && (
                <Text size="xs" c="dimmed" mt={4} ta="center">{health.checks.database.responseTime}ms response</Text>
              )}
            </Card>

            {/* Environment */}
            <Card shadow="xs" radius="md" p="lg">
              <Group mb="sm">
                <Box style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconServer size={18} color="#2563eb" />
                </Box>
                <Text fw={600} size="sm">Environment</Text>
              </Group>
              <Badge color="blue" variant="light" fullWidth tt="capitalize">{health.environment}</Badge>
              <Text size="xs" c="dimmed" mt={4} ta="center">v{health.version}</Text>
            </Card>

            {/* Uptime */}
            <Card shadow="xs" radius="md" p="lg">
              <Group mb="sm">
                <Box style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconClock size={18} color="#16a34a" />
                </Box>
                <Text fw={600} size="sm">Uptime</Text>
              </Group>
              <Text size="xl" fw={700} ta="center" c="green">
                {health.uptime > 3600 ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : `${Math.floor(health.uptime / 60)}m`}
              </Text>
              <Text size="xs" c="dimmed" mt={4} ta="center">Server process uptime</Text>
            </Card>

            {/* Users */}
            <Card shadow="xs" radius="md" p="lg">
              <Group mb="sm">
                <Box style={{ width: 36, height: 36, borderRadius: 10, background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconUsers size={18} color="#9333ea" />
                </Box>
                <Text fw={600} size="sm">Users</Text>
              </Group>
              <Text size="xl" fw={700} ta="center" c="violet">{health.checks?.records?.users ?? '--'}</Text>
              <Text size="xs" c="dimmed" mt={4} ta="center">Total accounts</Text>
            </Card>
          </SimpleGrid>

          {/* Record Counts */}
          {health.checks?.records && (
            <Card shadow="xs" radius="md" p="lg">
              <Text fw={600} mb="md">Database Records</Text>
              <SimpleGrid cols={{ base: 2, sm: 3 }}>
                {[
                  { label: 'Students', value: health.checks.records.students, color: '#3b82f6' },
                  { label: 'Staff', value: health.checks.records.staff, color: '#8b5cf6' },
                  { label: 'Users', value: health.checks.records.users, color: '#10b981' },
                ].map(({ label, value, color }) => (
                  <Box key={label} style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: `${color}11` }}>
                    <Text size="2xl" fw={800} style={{ color }}>{value?.toLocaleString() ?? 0}</Text>
                    <Text size="sm" c="dimmed">{label}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Card>
          )}

          {/* Timestamp */}
          <Text size="xs" c="dimmed" ta="center">System snapshot at {new Date(health.timestamp).toLocaleString()}</Text>
        </Stack>
      ) : (
        <Center h={200}>
          <Text c="red">Unable to fetch health data</Text>
        </Center>
      )}
    </Box>
  );
}
