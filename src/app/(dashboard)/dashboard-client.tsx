'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Grid, Text, Box, Group, Badge, SimpleGrid, Progress,
  Center, Skeleton,
} from '@mantine/core';
import {
  IconUsers, IconUserCheck, IconCurrencyDollar, IconTrendingUp,
  IconArrowUpRight, IconArrowDownRight, IconSchool, IconCalendarCheck,
  IconAlertCircle, IconBook, IconReceipt, IconBuildingCommunity,
  IconClock, IconChevronRight, IconCircleDot, IconStar,
  IconBell, IconUserPlus, IconTrendingDown, IconActivity,
} from '@tabler/icons-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export default function DashboardClient() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/dashboard/stats').then(r => r.json());
        if (res.success && res.data) {
          const d = res.data;
          setStats({
            totalStudents: d.totalStudents,
            activeStudents: d.totalStudents,
            totalStaff: d.totalStaff,
            totalClasses: 0,
            attendancePercent: d.attendanceRate,
            attendanceToday: d.attendanceRate,
            feeCollectedMonth: d.monthlyFeeCollection,
            feeOverdue: 0,
            recentStudents: d.recentStudents || [],
            classChartData: [],
            monthlyFees: (d.monthlyChart || []).map((m: any) => ({
              month: m.month,
              collected: m.amount,
              expected: m.amount * 1.1,
            })),
            genderBreakdown: [
              { name: 'Male', value: 0, color: '#3b82f6' },
              { name: 'Female', value: 0, color: '#ec4899' },
            ],
            upcomingEvents: d.upcomingEvents || [],
            studentGrowth: d.studentGrowth ?? 0,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtCurrency = (n: number) =>
    n >= 100000 ? `Rs ${(n / 100000).toFixed(1)}L` : `Rs ${n.toLocaleString()}`;

  const KPI_CARDS = stats ? [
    {
      title: 'Total Students', value: stats.totalStudents, icon: IconUsers,
      sub: `${stats.activeStudents} active`,
      trend: stats.studentGrowth !== 0 ? `${stats.studentGrowth > 0 ? '+' : ''}${stats.studentGrowth}%` : 'Stable',
      up: stats.studentGrowth >= 0,
      color: '#3b82f6', bg: '#eff6ff', href: '/students',
    },
    {
      title: 'Total Staff', value: stats.totalStaff, icon: IconUserCheck,
      sub: 'Teaching & non-teaching', trend: 'Active', up: true,
      color: '#10b981', bg: '#ecfdf5', href: '/staff',
    },
    {
      title: 'Fee Collected', value: fmtCurrency(stats.feeCollectedMonth), icon: IconCurrencyDollar,
      sub: 'This month', trend: stats.feeCollectedMonth > 0 ? '+collected' : 'No payments', up: stats.feeCollectedMonth > 0,
      color: '#f59e0b', bg: '#fffbeb', href: '/fees/collection',
    },
    {
      title: 'Attendance Today', value: `${stats.attendancePercent}%`, icon: IconCalendarCheck,
      sub: 'Present today', trend: stats.attendancePercent >= 80 ? 'Good' : 'Low', up: stats.attendancePercent >= 80,
      color: '#8b5cf6', bg: '#f5f3ff', href: '/attendance',
    },
    {
      title: 'Classes', value: stats.totalClasses, icon: IconBuildingCommunity,
      sub: 'Active classes', trend: 'Stable', up: true,
      color: '#06b6d4', bg: '#ecfeff', href: '/classes',
    },
    {
      title: 'Upcoming Events', value: stats.upcomingEvents?.length ?? 0, icon: IconBook,
      sub: stats.upcomingEvents?.[0]?.title ?? 'No upcoming events', trend: 'Scheduled', up: true,
      color: '#ef4444', bg: '#fef2f2', href: '/calendar',
    },
  ] : [];

  const QUICK_ACTIONS = [
    { label: 'Add Student', icon: IconUserPlus, href: '/students', color: '#3b82f6' },
    { label: 'Mark Attendance', icon: IconCalendarCheck, href: '/attendance', color: '#10b981' },
    { label: 'Collect Fee', icon: IconCurrencyDollar, href: '/fees/collection', color: '#f59e0b' },
    { label: 'Add Notice', icon: IconBell, href: '/notices', color: '#8b5cf6' },
  ];

  const RECENT_ACTIVITIES = stats?.recentStudents?.map((s: any) => ({
    text: `New student ${s.firstName} ${s.lastName} admitted (${s.admissionNumber})`,
    time: new Date(s.createdAt).toLocaleDateString('en-PK'),
    icon: IconUserPlus,
    color: '#3b82f6',
  })) ?? [];

  if (loading) return (
    <Box p="lg">
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mb="lg">
        {[...Array(6)].map((_, i) => <Skeleton key={i} height={100} radius="lg" />)}
      </SimpleGrid>
      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}><Skeleton height={280} radius="lg" /></Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}><Skeleton height={280} radius="lg" /></Grid.Col>
      </Grid>
    </Box>
  );

  return (
    <Box style={{ padding: '20px 20px 40px' }}>
      {/* Welcome Banner */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          overflow: 'hidden', position: 'relative',
        }}
      >
        <Box style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <Box style={{ position: 'absolute', top: 20, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <Box>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋
          </Text>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
            EduMaster School ERP
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </Box>
        <Box visibleFrom="sm" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {[
            { label: 'Academic Year', value: '2024-25' },
            { label: 'School Days', value: '142' },
            { label: 'Next Holiday', value: 'Jun 15' },
          ].map(item => (
            <Box key={item.label} style={{ textAlign: 'center' }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 800 }}>{item.value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{item.label}</Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md" mb="md">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Box
              key={card.title}
              component={Link}
              href={card.href}
              style={{
                background: 'white', borderRadius: 14, padding: '18px 20px',
                border: '1.5px solid #f1f5f9', textDecoration: 'none',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                transition: 'all 200ms ease', cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.1)`;
                (e.currentTarget as HTMLElement).style.borderColor = card.color;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                (e.currentTarget as HTMLElement).style.borderColor = '#f1f5f9';
              }}
            >
              <Box
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: card.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={22} color={card.color} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {card.title}
                </Text>
                <Text style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                  {card.value}
                </Text>
                <Group gap={6} mt={2}>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>{card.sub}</Text>
                  <Badge
                    size="xs"
                    variant="light"
                    color={card.up ? 'green' : 'red'}
                    leftSection={card.up ? <IconArrowUpRight size={9} /> : <IconArrowDownRight size={9} />}
                  >
                    {card.trend}
                  </Badge>
                </Group>
              </Box>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* Quick Actions */}
      <Box style={{ background: 'white', borderRadius: 14, padding: '16px 20px', border: '1.5px solid #f1f5f9', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Text style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Quick Actions</Text>
        <Group gap={10}>
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <Box
                key={action.label}
                component={Link}
                href={action.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 24,
                  border: `1.5px solid ${action.color}20`,
                  background: `${action.color}08`,
                  textDecoration: 'none',
                  transition: 'all 150ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = `${action.color}15`;
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = `${action.color}08`;
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }}
              >
                <Icon size={15} color={action.color} />
                <Text style={{ fontSize: 13, fontWeight: 600, color: action.color }}>{action.label}</Text>
              </Box>
            );
          })}
        </Group>
      </Box>

      {/* Charts Row */}
      <Grid gutter="md" mb="md">
        {/* Fee Collection Trend */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Box style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1.5px solid #f1f5f9', height: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <Group justify="space-between" mb="md">
              <Box>
                <Text style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Fee Collection Trend</Text>
                <Text size="11px" c="dimmed">Monthly collection vs expected</Text>
              </Box>
              <Badge variant="light" color="blue" size="sm">2024-25</Badge>
            </Group>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats?.monthlyFees || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  formatter={(v: any) => [`Rs ${(v / 1000).toFixed(0)}K`, '']}
                  contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="expected" stroke="#e2e8f0" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="Expected" />
                <Area type="monotone" dataKey="collected" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorCollected)" name="Collected" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Grid.Col>

        {/* Gender Breakdown */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Box style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1.5px solid #f1f5f9', height: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <Text style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Student Distribution</Text>
            <Text size="11px" c="dimmed" mb="md">Gender breakdown</Text>
            <Center>
              <Box style={{ position: 'relative', width: 160, height: 160 }}>
                <PieChart width={160} height={160}>
                  <Pie
                    data={stats?.genderBreakdown || [{ name: 'N/A', value: 1, color: '#e2e8f0' }]}
                    cx={75} cy={75} innerRadius={50} outerRadius={72}
                    dataKey="value" nameKey="name"
                  >
                    {(stats?.genderBreakdown || [{ name: 'N/A', value: 1, color: '#e2e8f0' }]).map((g: any, i: number) => (
                      <Cell key={i} fill={g.color} />
                    ))}
                  </Pie>
                </PieChart>
                <Box style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{stats?.totalStudents}</Text>
                  <Text size="11px" c="dimmed">Total</Text>
                </Box>
              </Box>
            </Center>
            <Group justify="center" gap="xl" mt="md">
              {stats?.genderBreakdown?.map((g: any) => (
                <Box key={g.name} style={{ textAlign: 'center' }}>
                  <Group gap={6} mb={2} justify="center">
                    <Box style={{ width: 8, height: 8, borderRadius: '50%', background: g.color }} />
                    <Text size="12px" fw={600} c="#0f172a">{g.name}</Text>
                  </Group>
                  <Text size="13px" fw={800} c="#0f172a">{g.value}</Text>
                </Box>
              ))}
            </Group>
          </Box>
        </Grid.Col>
      </Grid>

      {/* Bottom Row */}
      <Grid gutter="md">
        {/* Class-wise Students */}
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Box style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1.5px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <Group justify="space-between" mb="md">
              <Text style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Class-wise Enrollment</Text>
              <Box component={Link} href="/classes" style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                View all <IconChevronRight size={12} />
              </Box>
            </Group>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats?.classChartData || []} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="students" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Grid.Col>

        {/* Recent Activity */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Box style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1.5px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <Group justify="space-between" mb="md">
              <Text style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Activity</Text>
              <Badge size="xs" variant="dot" color="green">Live</Badge>
            </Group>
            <Box style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {RECENT_ACTIVITIES.map((activity, i) => {
                const Icon = activity.icon;
                return (
                  <Group key={i} gap={10} style={{ alignItems: 'flex-start' }}>
                    <Box
                      style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: `${activity.color}12`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Icon size={14} color={activity.color} />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: '#334155', lineHeight: 1.4, fontWeight: 500 }}>{activity.text}</Text>
                      <Text size="11px" c="dimmed">{activity.time}</Text>
                    </Box>
                  </Group>
                );
              })}
            </Box>
          </Box>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
