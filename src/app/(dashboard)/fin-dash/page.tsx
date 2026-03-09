'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Loader, Stack, Progress, Table, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

export default function Page() {
  const [data, setData] = useState<any>({ feeCollections: [], expenses: [], payroll: [] });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [fees, expenses, payroll] = await Promise.all([
        fetch('/api/fees/collection').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/payroll').then(r => r.json()),
      ]);
      setData({ feeCollections: fees.data || [], expenses: expenses.data || [], payroll: payroll.data || [] });
    } catch { notifications.show({ title: 'Error', message: 'Failed to load', color: 'red' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const totalRevenue = data.feeCollections.filter((f: any) => f.status === 'Paid').reduce((s: number, f: any) => s + (f.amount || 0), 0);
  const totalExpenses = data.expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const totalPayroll = data.payroll.filter((p: any) => p.status === 'Paid').reduce((s: number, p: any) => s + (p.netSalary || p.amount || 0), 0);
  const netBalance = totalRevenue - totalExpenses - totalPayroll;

  // Group expenses by category
  const expByCategory: Record<string, number> = {};
  data.expenses.forEach((e: any) => { expByCategory[e.category || 'Other'] = (expByCategory[e.category || 'Other'] || 0) + (e.amount || 0); });
  const expCategories = Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) return <Box p="xl"><Group justify="center" py={80}><Loader size="lg" /></Group></Box>;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Financial Dashboard</Text><Text size="sm" c="dimmed">School financial overview & summary</Text></Box>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9', background: '#f0fdf4' }}>
          <Group><IconTrendingUp size={20} color="#10b981" /><Text size="xs" c="dimmed">Total Revenue</Text></Group>
          <Text size="xl" fw={800} c="#10b981" mt="xs">Rs. {totalRevenue.toLocaleString()}</Text>
        </Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9', background: '#fef2f2' }}>
          <Group><IconTrendingDown size={20} color="#ef4444" /><Text size="xs" c="dimmed">Total Expenses</Text></Group>
          <Text size="xl" fw={800} c="#ef4444" mt="xs">Rs. {totalExpenses.toLocaleString()}</Text>
        </Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9', background: '#fef2f2' }}>
          <Group><IconTrendingDown size={20} color="#f59e0b" /><Text size="xs" c="dimmed">Payroll Paid</Text></Group>
          <Text size="xl" fw={800} c="#f59e0b" mt="xs">Rs. {totalPayroll.toLocaleString()}</Text>
        </Card>
        <Card shadow="xs" radius="md" p="lg" style={{ border: '1px solid #f1f5f9', background: netBalance >= 0 ? '#f0fdf4' : '#fef2f2' }}>
          <Text size="xs" c="dimmed">Net Balance</Text>
          <Text size="xl" fw={800} c={netBalance >= 0 ? '#10b981' : '#ef4444'} mt="xs">Rs. {netBalance.toLocaleString()}</Text>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="xl">
        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
          <Text fw={600} mb="lg">Fee Collection Status</Text>
          {data.feeCollections.length === 0 ? <Alert icon={<IconAlertCircle size={14} />} color="blue">No fee records yet.</Alert> : (
            <Stack gap="md">
              {[
                { label: 'Paid', color: 'green', count: data.feeCollections.filter((f: any) => f.status === 'Paid').length },
                { label: 'Pending', color: 'orange', count: data.feeCollections.filter((f: any) => f.status === 'Pending').length },
                { label: 'Overdue', color: 'red', count: data.feeCollections.filter((f: any) => f.status === 'Overdue').length },
              ].map(item => (
                <Box key={item.label}>
                  <Group justify="space-between" mb={4}><Text size="sm">{item.label}</Text><Badge color={item.color}>{item.count}</Badge></Group>
                  <Progress value={data.feeCollections.length > 0 ? (item.count / data.feeCollections.length) * 100 : 0} color={item.color} radius="md" />
                </Box>
              ))}
            </Stack>
          )}
        </Card>

        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
          <Text fw={600} mb="lg">Top Expense Categories</Text>
          {expCategories.length === 0 ? <Alert icon={<IconAlertCircle size={14} />} color="blue">No expense records yet.</Alert> : (
            <Table>
              <Table.Tbody>
                {expCategories.map(([cat, amt]) => (
                  <Table.Tr key={cat}>
                    <Table.Td><Text fw={500}>{cat}</Text></Table.Td>
                    <Table.Td><Text fw={600} c="red">Rs. {amt.toLocaleString()}</Text></Table.Td>
                    <Table.Td style={{ width: 100 }}>
                      <Progress value={totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0} color="red" size="sm" radius="md" />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
      </SimpleGrid>
    </Box>
  );
}
