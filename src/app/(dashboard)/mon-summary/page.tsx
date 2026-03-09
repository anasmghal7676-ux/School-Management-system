'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Loader, Stack, Progress, Table } from '@mantine/core';
import { notifications } from '@mantine/notifications';

export default function Page() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  async function load() {
    setLoading(true);
    try {
      const [fees, att, leaves, expenses] = await Promise.all([
        fetch('/api/fees/collection').then(r => r.json()),
        fetch('/api/attendance').then(r => r.json()),
        fetch('/api/leaves').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json()),
      ]);
      const feeData = fees.data || [];
      const attData = att.data || [];
      const leaveData = leaves.data || [];
      const expData = expenses.data || [];

      // Filter to current month
      const thisMonth = (items: any[]) => items.filter((i: any) => {
        const d = new Date(i.createdAt || i.date || Date.now());
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      setData({
        feeCollected: thisMonth(feeData).filter((f: any) => f.status === 'Paid').reduce((s: number, f: any) => s + (f.amount || 0), 0),
        feePending: thisMonth(feeData).filter((f: any) => f.status !== 'Paid').reduce((s: number, f: any) => s + (f.amount || 0), 0),
        totalFeeRecords: thisMonth(feeData).length,
        attendanceRate: attData.length > 0 ? Math.round((attData.filter((a: any) => a.status === 'Present').length / attData.length) * 100) : 0,
        leavesApproved: thisMonth(leaveData).filter((l: any) => l.status === 'Approved').length,
        leavesPending: thisMonth(leaveData).filter((l: any) => l.status === 'Pending').length,
        totalExpenses: thisMonth(expData).reduce((s: number, e: any) => s + (e.amount || 0), 0),
        expenseCount: thisMonth(expData).length,
      });
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Box p="xl"><Group justify="center" py={80}><Loader size="lg" /></Group></Box>;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Monthly Summary</Text>
          <Text size="sm" c="dimmed">{monthName} — key metrics & highlights</Text>
        </Box>
        <Badge size="lg" variant="light" color="blue">{monthName}</Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
        {[
          { label: 'Fee Collected', value: `Rs. ${(data.feeCollected || 0).toLocaleString()}`, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Fee Pending', value: `Rs. ${(data.feePending || 0).toLocaleString()}`, color: '#ef4444', bg: '#fef2f2' },
          { label: 'Attendance Rate', value: `${data.attendanceRate || 0}%`, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Total Expenses', value: `Rs. ${(data.totalExpenses || 0).toLocaleString()}`, color: '#f59e0b', bg: '#fffbeb' },
        ].map(item => (
          <Card key={item.label} shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9', background: item.bg }}>
            <Text size="xl" fw={800} c={item.color}>{item.value}</Text>
            <Text size="sm" c="dimmed" mt={4}>{item.label}</Text>
          </Card>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
          <Text fw={600} mb="lg">Fee Collection Progress</Text>
          <Stack gap="md">
            <Box>
              <Group justify="space-between" mb={4}><Text size="sm">Collected</Text><Text size="sm" fw={600} c="green">Rs. {(data.feeCollected || 0).toLocaleString()}</Text></Group>
              <Progress value={data.feeCollected + data.feePending > 0 ? (data.feeCollected / (data.feeCollected + data.feePending)) * 100 : 0} color="green" size="lg" radius="md" />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}><Text size="sm">Pending</Text><Text size="sm" fw={600} c="red">Rs. {(data.feePending || 0).toLocaleString()}</Text></Group>
              <Progress value={data.feeCollected + data.feePending > 0 ? (data.feePending / (data.feeCollected + data.feePending)) * 100 : 0} color="red" size="lg" radius="md" />
            </Box>
          </Stack>
        </Card>

        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
          <Text fw={600} mb="lg">Leave Summary</Text>
          <Table>
            <Table.Tbody>
              <Table.Tr><Table.Td>Approved Leaves</Table.Td><Table.Td><Badge color="green">{data.leavesApproved || 0}</Badge></Table.Td></Table.Tr>
              <Table.Tr><Table.Td>Pending Leaves</Table.Td><Table.Td><Badge color="orange">{data.leavesPending || 0}</Badge></Table.Td></Table.Tr>
              <Table.Tr><Table.Td>Expense Records</Table.Td><Table.Td><Badge color="blue">{data.expenseCount || 0}</Badge></Table.Td></Table.Tr>
              <Table.Tr><Table.Td>Attendance Rate</Table.Td><Table.Td><Badge color={data.attendanceRate >= 75 ? 'green' : 'red'}>{data.attendanceRate || 0}%</Badge></Table.Td></Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
