'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Grid, Card, Text, Title, Group, Badge, Stack, Box,
  Paper, SimpleGrid, Skeleton, Button, ActionIcon,
  ThemeIcon, Progress, Table, Avatar, Divider, Alert,
  RingProgress, Tooltip,
} from '@mantine/core';
import {
  IconUsers, IconCurrencyDollar, IconCalendarCheck, IconTrendingUp,
  IconSchool, IconBus, IconBuildingCommunity, IconCreditCard,
  IconFileText, IconChartBar, IconPlus, IconClipboardList,
  IconAlertTriangle, IconClock, IconArrowRight, IconRefresh,
  IconBell, IconArrowUpRight, IconArrowDownRight, IconChartLine,
  IconUserPlus, IconReceipt,
} from '@tabler/icons-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Legend,
} from 'recharts';

const PIE_COLORS = ['#228be6', '#e64980', '#7950f2'];

const QUICK_ACTIONS = [
  { label: 'New Student', href: '/students', icon: IconUserPlus, color: 'blue' },
  { label: 'Collect Fee', href: '/fees/collection', icon: IconCurrencyDollar, color: 'green' },
  { label: 'Attendance', href: '/attendance', icon: IconCalendarCheck, color: 'orange' },
  { label: 'Reports', href: '/reports', icon: IconChartBar, color: 'violet' },
];

interface Stats {
  totalStudents: number;
  activeStaff: number;
  feeCollected: number;
  attendanceToday: number;
  studentGrowth: { month: string; count: number }[];
  attendanceTrend: { day: string; percent: number }[];
  genderBreakdown: { name: string; value: number }[];
  recentAdmissions: any[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.data ?? data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  const kpiCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: IconUsers,
      color: 'blue',
      suffix: '',
      trend: +2.4,
    },
    {
      title: 'Active Staff',
      value: stats?.activeStaff ?? 0,
      icon: IconSchool,
      color: 'green',
      suffix: '',
      trend: +0,
    },
    {
      title: 'Fee Collected',
      value: stats?.feeCollected ?? 0,
      icon: IconCurrencyDollar,
      color: 'violet',
      suffix: '',
      format: 'currency',
      trend: +8.1,
    },
    {
      title: "Today's Attendance",
      value: stats?.attendanceToday ?? 0,
      icon: IconCalendarCheck,
      color: 'orange',
      suffix: '%',
      trend: -1.2,
    },
  ];

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" align="flex-start">
        <Box>
          <Title order={2} fw={700}>{greeting}, {firstName}! 👋</Title>
          <Text c="dimmed" size="sm" mt={4}>
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </Box>
        <Button
          variant="light"
          size="sm"
          leftSection={<IconRefresh size={16} className={refreshing ? 'spin' : ''} />}
          onClick={() => fetchStats(true)}
          loading={refreshing}
        >
          Refresh
        </Button>
      </Group>

      {/* Quick Actions */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Paper
              key={action.href}
              component={Link}
              href={action.href}
              p="sm"
              radius="md"
              withBorder
              style={{
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
              }}
              className="quick-action-card"
            >
              <Group gap="sm">
                <ThemeIcon color={action.color} variant="light" size="lg" radius="md">
                  <Icon size={18} />
                </ThemeIcon>
                <Text size="sm" fw={600}>{action.label}</Text>
              </Group>
            </Paper>
          );
        })}
      </SimpleGrid>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.trend >= 0;
          const TrendIcon = isPositive ? IconArrowUpRight : IconArrowDownRight;
          return (
            <Card key={card.title} padding="lg" radius="md" withBorder style={{ position: 'relative', overflow: 'hidden' }}>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500} c="dimmed">{card.title}</Text>
                <ThemeIcon color={card.color} variant="light" size="md" radius="md">
                  <Icon size={16} />
                </ThemeIcon>
              </Group>
              {loading ? (
                <Skeleton height={36} radius="sm" />
              ) : (
                <Group align="flex-end" gap="xs">
                  <Title order={2} fw={800}>
                    {card.format === 'currency'
                      ? `PKR ${(card.value / 1000).toFixed(0)}K`
                      : card.value.toLocaleString()}{card.suffix}
                  </Title>
                  {card.trend !== 0 && (
                    <Badge
                      color={isPositive ? 'green' : 'red'}
                      variant="light"
                      size="sm"
                      leftSection={<TrendIcon size={12} />}
                      mb={4}
                    >
                      {Math.abs(card.trend)}%
                    </Badge>
                  )}
                </Group>
              )}
            </Card>
          );
        })}
      </SimpleGrid>

      {/* Charts Row 1 */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card padding="lg" radius="md" withBorder h="100%">
            <Title order={4} mb="md">Student Growth (12 Months)</Title>
            {loading ? (
              <Skeleton height={200} />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats?.studentGrowth ?? []}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#228be6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#228be6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ReTooltip />
                  <Area type="monotone" dataKey="count" stroke="#228be6" fill="url(#colorStudents)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card padding="lg" radius="md" withBorder h="100%">
            <Title order={4} mb="md">Gender Distribution</Title>
            {loading ? (
              <Skeleton height={200} />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={stats?.genderBreakdown ?? [{ name: 'Male', value: 1 }, { name: 'Female', value: 1 }]}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(stats?.genderBreakdown ?? []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Stack gap={6} mt="sm">
                  {(stats?.genderBreakdown ?? []).map((g: any, i: number) => (
                    <Group key={g.name} justify="space-between">
                      <Group gap="xs">
                        <Box w={10} h={10} style={{ borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <Text size="xs">{g.name}</Text>
                      </Group>
                      <Text size="xs" fw={600}>{g.value}</Text>
                    </Group>
                  ))}
                </Stack>
              </>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Charts Row 2 */}
      <Card padding="lg" radius="md" withBorder>
        <Title order={4} mb="md">Daily Attendance % (Last 7 Days)</Title>
        {loading ? (
          <Skeleton height={160} />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats?.attendanceTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <ReTooltip formatter={(v: any) => [`${v}%`, 'Attendance']} />
              <Bar dataKey="percent" fill="#40c057" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Recent Admissions */}
      <Card padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Recent Admissions</Title>
          <Button
            variant="subtle"
            size="xs"
            component={Link}
            href="/students"
            rightSection={<IconArrowRight size={14} />}
          >
            View All
          </Button>
        </Group>
        {loading ? (
          <Stack gap="xs">
            {[1,2,3].map(i => <Skeleton key={i} height={44} radius="sm" />)}
          </Stack>
        ) : (
          <Table striped highlightOnHover withTableBorder={false}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Student</Table.Th>
                <Table.Th>Admission #</Table.Th>
                <Table.Th>Class</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(stats?.recentAdmissions ?? []).length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" c="dimmed" size="sm" py="md">No recent admissions</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                (stats?.recentAdmissions ?? []).map((s: any) => (
                  <Table.Tr key={s.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" color="blue" radius="xl">
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </Avatar>
                        <Text size="sm" fw={500}>{s.firstName} {s.lastName}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{s.admissionNumber}</Text></Table.Td>
                    <Table.Td><Text size="sm">{s.class?.name ?? '—'}</Text></Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {s.admissionDate ? new Date(s.admissionDate).toLocaleDateString() : '—'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={s.status === 'active' ? 'green' : 'gray'} size="sm" variant="light">
                        {s.status ?? 'active'}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}
