'use client';

import { useEffect, useState } from 'react';
import {
  Grid, Paper, Text, Group, Box, RingProgress, Progress,
  Table, Badge, Avatar, SimpleGrid, ActionIcon, Tooltip,
  Skeleton, ThemeIcon, Divider,
} from '@mantine/core';
import {
  IconUsers, IconCurrencyDollar, IconCalendarCheck,
  IconAlertTriangle, IconArrowUpRight, IconArrowDownRight,
  IconSchool, IconUserCircle, IconBook, IconBus,
  IconTrendingUp, IconRefresh, IconClock,
  IconCircleCheck, IconCircleX,
} from '@tabler/icons-react';

interface DashStats {
  students: number; staff: number; classes: number;
  presentToday: number; absentToday: number;
  totalFees: number; collectedFees: number;
  recentStudents: any[]; recentPayments: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [studRes, staffRes, classRes, feeRes] = await Promise.allSettled([
        fetch('/api/students?limit=5'),
        fetch('/api/staff?limit=5'),
        fetch('/api/classes?limit=100'),
        fetch('/api/fees/collection?limit=5'),
      ]);

      const studData = studRes.status === 'fulfilled' ? await studRes.value.json() : { total: 0, data: [] };
      const staffData = staffRes.status === 'fulfilled' ? await staffRes.value.json() : { total: 0, data: [] };
      const classData = classRes.status === 'fulfilled' ? await classRes.value.json() : { total: 0, data: [] };
      const feeData = feeRes.status === 'fulfilled' ? await feeRes.value.json() : { total: 0, data: [], totalAmount: 0 };

      setStats({
        students: studData.total || studData.data?.length || 0,
        staff: staffData.total || staffData.data?.length || 0,
        classes: classData.total || classData.data?.length || 0,
        presentToday: Math.floor((studData.total || 0) * 0.87),
        absentToday: Math.floor((studData.total || 0) * 0.13),
        totalFees: feeData.totalAmount || 450000,
        collectedFees: feeData.collectedAmount || 320000,
        recentStudents: studData.data?.slice(0, 5) || [],
        recentPayments: feeData.data?.slice(0, 5) || [],
      });
      setLastRefresh(new Date());
    } catch {
      setStats({
        students: 0, staff: 0, classes: 0,
        presentToday: 0, absentToday: 0,
        totalFees: 0, collectedFees: 0,
        recentStudents: [], recentPayments: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const attRate = stats ? Math.round((stats.presentToday / Math.max(stats.students, 1)) * 100) : 0;
  const feeRate = stats ? Math.round((stats.collectedFees / Math.max(stats.totalFees, 1)) * 100) : 0;

  const StatCard = ({ title, value, icon: Icon, color, subtext, trend }: any) => (
    <Paper
      className={`stat-card stat-card-${color}`}
      style={{ cursor: 'default', position: 'relative', overflow: 'hidden' }}
      p="lg"
      radius="md"
    >
      <Box style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        borderRadius: '50%', background: `var(--mantine-color-${color === 'blue' ? 'blue' : color === 'green' ? 'teal' : color === 'orange' ? 'yellow' : color === 'red' ? 'red' : 'violet'}-1)`,
        opacity: 0.5,
      }} />
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text size="11px" fw={600} c="dimmed" tt="uppercase" ls="0.5px">{title}</Text>
          {loading ? (
            <Skeleton height={32} width={80} mt={4} radius="sm" />
          ) : (
            <Text size="28px" fw={800} c="#0f172a" lh={1.1} mt={4}>{value}</Text>
          )}
          {subtext && (
            <Text size="11px" c="dimmed" mt={4}>{subtext}</Text>
          )}
        </Box>
        <ThemeIcon
          size={44}
          radius="xl"
          variant="light"
          color={color === 'blue' ? 'blue' : color === 'green' ? 'teal' : color === 'orange' ? 'yellow' : color === 'red' ? 'red' : 'violet'}
        >
          <Icon size={22} />
        </ThemeIcon>
      </Group>
      {trend !== undefined && (
        <Group gap={4} mt={12}>
          {trend >= 0
            ? <IconArrowUpRight size={14} color="#10b981" />
            : <IconArrowDownRight size={14} color="#ef4444" />}
          <Text size="11px" c={trend >= 0 ? 'teal' : 'red'} fw={600}>
            {Math.abs(trend)}% vs last month
          </Text>
        </Group>
      )}
    </Paper>
  );

  return (
    <Box className="page-enter" p={{ base: 'sm', sm: 'md', lg: 'lg' }}>
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="22px" fw={800} c="#0f172a" style={{ letterSpacing: '-0.5px' }}>
            School Overview
          </Text>
          <Text size="13px" c="dimmed" mt={2}>
            Welcome back, Administrator · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </Box>
        <Group gap={8}>
          <Text size="11px" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconClock size={12} />
            Updated {lastRefresh.toLocaleTimeString()}
          </Text>
          <Tooltip label="Refresh data">
            <ActionIcon variant="light" color="blue" onClick={fetchStats} loading={loading} radius="md">
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md" mb="xl">
        <StatCard title="Total Students" value={stats?.students?.toLocaleString() || 0} icon={IconUsers} color="blue" trend={3.2} subtext="Enrolled" />
        <StatCard title="Staff Members" value={stats?.staff?.toLocaleString() || 0} icon={IconUserCircle} color="purple" trend={1.1} subtext="Active" />
        <StatCard title="Classes" value={stats?.classes?.toLocaleString() || 0} icon={IconBook} color="green" subtext="Running" />
        <StatCard title="Present Today" value={stats?.presentToday?.toLocaleString() || 0} icon={IconCalendarCheck} color="teal" subtext={`${attRate}% rate`} />
        <StatCard title="Absent Today" value={stats?.absentToday?.toLocaleString() || 0} icon={IconAlertTriangle} color="orange" subtext="Students" />
        <StatCard title="Fee Collected" value={`${feeRate}%`} icon={IconCurrencyDollar} color="green" subtext="This month" trend={5.4} />
      </SimpleGrid>

      {/* Charts Row */}
      <Grid mb="xl" gutter="md">
        {/* Attendance Ring */}
        <Grid.Col span={{ base: 12, sm: 4, lg: 3 }}>
          <Paper p="lg" radius="md" h="100%" style={{ border: '1px solid #f1f5f9' }}>
            <Text fw={700} size="sm" mb="md" c="#0f172a">Today's Attendance</Text>
            <Box style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <RingProgress
                size={160}
                thickness={16}
                roundCaps
                sections={[
                  { value: attRate, color: '#3b82f6', tooltip: `Present: ${stats?.presentToday}` },
                  { value: 100 - attRate, color: '#f1f5f9', tooltip: `Absent: ${stats?.absentToday}` },
                ]}
                label={
                  <Box style={{ textAlign: 'center' }}>
                    <Text fw={800} size="xl" c="#0f172a">{attRate}%</Text>
                    <Text size="10px" c="dimmed">Present</Text>
                  </Box>
                }
              />
            </Box>
            <SimpleGrid cols={2} spacing={8}>
              <Box style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: 8, textAlign: 'center' }}>
                <Text fw={700} size="lg" c="#3b82f6">{stats?.presentToday || 0}</Text>
                <Text size="10px" c="dimmed">Present</Text>
              </Box>
              <Box style={{ background: '#fef2f2', padding: '8px 12px', borderRadius: 8, textAlign: 'center' }}>
                <Text fw={700} size="lg" c="#ef4444">{stats?.absentToday || 0}</Text>
                <Text size="10px" c="dimmed">Absent</Text>
              </Box>
            </SimpleGrid>
          </Paper>
        </Grid.Col>

        {/* Fee Progress */}
        <Grid.Col span={{ base: 12, sm: 8, lg: 4 }}>
          <Paper p="lg" radius="md" h="100%" style={{ border: '1px solid #f1f5f9' }}>
            <Text fw={700} size="sm" mb="md" c="#0f172a">Fee Collection Progress</Text>
            <Box mb="lg">
              <Group justify="space-between" mb={6}>
                <Text size="12px" c="dimmed">Monthly Target</Text>
                <Text size="12px" fw={600}>PKR {(stats?.totalFees || 450000).toLocaleString()}</Text>
              </Group>
              <Progress value={feeRate} size="xl" radius="xl" color="blue" striped animated />
              <Group justify="space-between" mt={6}>
                <Text size="11px" c="teal" fw={600}>✓ Collected: PKR {(stats?.collectedFees || 320000).toLocaleString()}</Text>
                <Text size="11px" c="dimmed">{feeRate}%</Text>
              </Group>
            </Box>
            <Divider mb="md" />
            <SimpleGrid cols={3} spacing={8}>
              {[
                { label: 'Paid', value: stats?.students ? Math.floor(stats.students * 0.72) : 0, color: '#10b981' },
                { label: 'Partial', value: stats?.students ? Math.floor(stats.students * 0.15) : 0, color: '#f59e0b' },
                { label: 'Pending', value: stats?.students ? Math.floor(stats.students * 0.13) : 0, color: '#ef4444' },
              ].map(({ label, value, color }) => (
                <Box key={label} style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8 }}>
                  <Text fw={700} size="md" style={{ color }}>{value}</Text>
                  <Text size="10px" c="dimmed">{label}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Paper>
        </Grid.Col>

        {/* Quick Status */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper p="lg" radius="md" h="100%" style={{ border: '1px solid #f1f5f9' }}>
            <Text fw={700} size="sm" mb="md" c="#0f172a">Quick Status</Text>
            {[
              { label: 'Academic Year Active', status: true, detail: '2024-25' },
              { label: 'Fee Structure Set', status: true, detail: 'All classes' },
              { label: 'Timetables Published', status: true, detail: '12 classes' },
              { label: 'Exam Scheduled', status: false, detail: 'Not set' },
              { label: 'Library System', status: true, detail: 'Operational' },
              { label: 'Transport Routes', status: true, detail: '8 routes' },
            ].map(({ label, status, detail }) => (
              <Group key={label} justify="space-between" py={8} style={{ borderBottom: '1px solid #f8fafc' }}>
                <Group gap={8}>
                  {status
                    ? <IconCircleCheck size={16} color="#10b981" />
                    : <IconCircleX size={16} color="#ef4444" />}
                  <Text size="13px" c="#1e293b">{label}</Text>
                </Group>
                <Badge size="sm" variant="light" color={status ? 'teal' : 'red'}>{detail}</Badge>
              </Group>
            ))}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Recent Data Tables */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper radius="md" style={{ border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            <Box p="md" style={{ borderBottom: '1px solid #f8fafc', background: '#fafbfc' }}>
              <Group justify="space-between">
                <Text fw={700} size="sm" c="#0f172a">Recent Students</Text>
                <Badge variant="light" color="blue" size="sm">Live</Badge>
              </Group>
            </Box>
            {loading ? (
              <Box p="md">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} height={44} mb={8} radius="md" />)}
              </Box>
            ) : stats?.recentStudents?.length === 0 ? (
              <Box p="xl" style={{ textAlign: 'center' }}>
                <IconUsers size={40} color="#e2e8f0" />
                <Text c="dimmed" size="sm" mt={8}>No students yet</Text>
                <Text size="xs" c="dimmed">Add students from the Students module</Text>
              </Box>
            ) : (
              <Table className="erp-table">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Student</Table.Th>
                    <Table.Th>Class</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {stats?.recentStudents?.map((s: any) => (
                    <Table.Tr key={s.id}>
                      <Table.Td>
                        <Group gap={8}>
                          <Avatar size={30} radius="xl" color="blue">
                            {(s.firstName?.[0] || s.fullName?.[0] || '?').toUpperCase()}
                          </Avatar>
                          <Box>
                            <Text size="12px" fw={600}>{s.fullName || `${s.firstName} ${s.lastName}`}</Text>
                            <Text size="10px" c="dimmed">{s.admissionNumber}</Text>
                          </Box>
                        </Group>
                      </Table.Td>
                      <Table.Td><Text size="12px">{s.class?.name || 'N/A'}</Text></Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="light" color={s.status === 'active' ? 'teal' : 'gray'}>
                          {s.status || 'active'}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Paper radius="md" style={{ border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            <Box p="md" style={{ borderBottom: '1px solid #f8fafc', background: '#fafbfc' }}>
              <Group justify="space-between">
                <Text fw={700} size="sm" c="#0f172a">System Modules</Text>
                <Badge variant="light" color="green" size="sm">All Active</Badge>
              </Group>
            </Box>
            <SimpleGrid cols={3} spacing={1} style={{ gap: 0 }}>
              {[
                { label: 'Academics', icon: IconSchool, color: 'blue', href: '/students' },
                { label: 'Finance', icon: IconCurrencyDollar, color: 'green', href: '/fees/collection' },
                { label: 'HR & Staff', icon: IconUserCircle, color: 'purple', href: '/staff' },
                { label: 'Library', icon: IconBook, color: 'teal', href: '/library' },
                { label: 'Transport', icon: IconBus, color: 'orange', href: '/transport' },
                { label: 'Reports', icon: IconTrendingUp, color: 'red', href: '/analytics' },
              ].map(({ label, icon: Icon, color, href }) => (
                <Box
                  key={label}
                  component="a"
                  href={href}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '20px 8px', textDecoration: 'none', borderRight: '1px solid #f8fafc',
                    borderBottom: '1px solid #f8fafc', transition: 'all 150ms ease', cursor: 'pointer',
                  }}
                  className="dash-module-item"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <ThemeIcon size={40} radius="xl" variant="light" color={color} mb={8}>
                    <Icon size={20} />
                  </ThemeIcon>
                  <Text size="11px" fw={600} c="#475569" style={{ textAlign: 'center' }}>{label}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
