'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Loader, Select, Stack, Progress, RingProgress, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';

export default function Page() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [students, staff, fees, attendance] = await Promise.all([
        fetch('/api/students').then(r => r.json()),
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/fees/collection').then(r => r.json()),
        fetch('/api/attendance').then(r => r.json()),
      ]);
      const s = students.data || [];
      const st = staff.data || [];
      const f = fees.data || [];
      const a = attendance.data || [];
      const presentToday = a.filter((x: any) => x.status === 'Present').length;
      const totalToday = a.length;
      setStats({
        students: s.length,
        staff: st.length,
        feeCollected: f.filter((x: any) => x.status === 'Paid').reduce((sum: number, x: any) => sum + (x.amount || 0), 0),
        feePending: f.filter((x: any) => x.status !== 'Paid').reduce((sum: number, x: any) => sum + (x.amount || 0), 0),
        attendanceRate: totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0,
        presentToday,
        totalToday,
        maleStudents: s.filter((x: any) => x.gender === 'Male').length,
        femaleStudents: s.filter((x: any) => x.gender === 'Female').length,
      });
    } catch { notifications.show({ title: 'Error', message: 'Failed to load analytics', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Box p="xl"><Group justify="center" py={80}><Loader size="lg" /></Group></Box>;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Analytics Dashboard</Text><Text size="sm" c="dimmed">School-wide metrics & insights</Text></Box>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
        {[
          { label: 'Total Students', value: stats.students, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Total Staff', value: stats.staff, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Fee Collected', value: `Rs. ${(stats.feeCollected || 0).toLocaleString()}`, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Fee Pending', value: `Rs. ${(stats.feePending || 0).toLocaleString()}`, color: '#ef4444', bg: '#fef2f2' },
        ].map(item => (
          <Card key={item.label} shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9', background: item.bg }}>
            <Text size="xl" fw={800} c={item.color}>{item.value}</Text>
            <Text size="sm" c="dimmed" mt={4}>{item.label}</Text>
          </Card>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="xl">
        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
          <Text fw={600} mb="lg">Today's Attendance</Text>
          <Group justify="center" mb="md">
            <RingProgress size={160} thickness={16} roundCaps sections={[
              { value: stats.attendanceRate || 0, color: '#10b981' },
              { value: 100 - (stats.attendanceRate || 0), color: '#f1f5f9' },
            ]} label={<Center><Text fw={700} size="xl">{stats.attendanceRate}%</Text></Center>} />
          </Group>
          <Stack gap="xs">
            <Group justify="space-between"><Text size="sm">Present</Text><Badge color="green">{stats.presentToday}</Badge></Group>
            <Group justify="space-between"><Text size="sm">Absent</Text><Badge color="red">{stats.totalToday - stats.presentToday}</Badge></Group>
            <Group justify="space-between"><Text size="sm">Total</Text><Badge color="blue">{stats.totalToday}</Badge></Group>
          </Stack>
        </Card>

        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
          <Text fw={600} mb="lg">Student Gender Distribution</Text>
          <Stack gap="md" mt="xl">
            <Box>
              <Group justify="space-between" mb={4}><Text size="sm">Male</Text><Text size="sm" fw={600}>{stats.maleStudents}</Text></Group>
              <Progress value={stats.students > 0 ? (stats.maleStudents / stats.students) * 100 : 0} color="blue" size="lg" radius="md" />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}><Text size="sm">Female</Text><Text size="sm" fw={600}>{stats.femaleStudents}</Text></Group>
              <Progress value={stats.students > 0 ? (stats.femaleStudents / stats.students) * 100 : 0} color="pink" size="lg" radius="md" />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}><Text size="sm">Other / Not Specified</Text><Text size="sm" fw={600}>{stats.students - stats.maleStudents - stats.femaleStudents}</Text></Group>
              <Progress value={stats.students > 0 ? ((stats.students - stats.maleStudents - stats.femaleStudents) / stats.students) * 100 : 0} color="violet" size="lg" radius="md" />
            </Box>
          </Stack>
        </Card>
      </SimpleGrid>

      <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Text fw={600} mb="lg">Fee Collection Overview</Text>
        <Stack gap="md">
          <Box>
            <Group justify="space-between" mb={4}><Text size="sm">Collected</Text><Text size="sm" fw={600} c="green">Rs. {(stats.feeCollected || 0).toLocaleString()}</Text></Group>
            <Progress value={stats.feeCollected + stats.feePending > 0 ? (stats.feeCollected / (stats.feeCollected + stats.feePending)) * 100 : 0} color="green" size="xl" radius="md" />
          </Box>
          <Box>
            <Group justify="space-between" mb={4}><Text size="sm">Pending</Text><Text size="sm" fw={600} c="red">Rs. {(stats.feePending || 0).toLocaleString()}</Text></Group>
            <Progress value={stats.feeCollected + stats.feePending > 0 ? (stats.feePending / (stats.feeCollected + stats.feePending)) * 100 : 0} color="red" size="xl" radius="md" />
          </Box>
        </Stack>
      </Card>
    </Box>
  );
}
