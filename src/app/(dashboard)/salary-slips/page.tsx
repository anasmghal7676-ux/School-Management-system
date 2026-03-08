'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, Select, Button, Loader, Center, Table, Stack, Card, SimpleGrid, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDownload, IconRefresh, IconEye, IconReceipt2 } from '@tabler/icons-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function SalarySlipsPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [deptId, setDeptId] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/departments?limit=100').then(r => r.json()).then(d => setDepartments(d.data || []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ month, year, limit: '200' });
      if (deptId) p.set('departmentId', deptId);
      const res = await fetch(`/api/payroll?${p}`);
      const data = await res.json();
      setPayroll(data.data || []);
    } catch { notifications.show({ color: 'red', message: 'Failed to load' }); }
    finally { setLoading(false); }
  }, [month, year, deptId]);
  useEffect(() => { load(); }, [load]);

  const totalBasic = payroll.reduce((s, p) => s + (p.basicSalary || 0), 0);
  const totalNet = payroll.reduce((s, p) => s + ((p.basicSalary || 0) + (p.allowances || 0) + (p.bonus || 0) - (p.deductions || 0)), 0);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Salary Slips</Text><Text size="sm" c="dimmed">Generate and view staff salary slips</Text></Box>
        <Button leftSection={<IconDownload size={16} />} variant="outline" color="green">Export All</Button>
      </Group>
      <Card shadow="xs" radius="md" p="md" mb="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group gap="sm" wrap="wrap">
          <Select label="Month" data={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))} value={month} onChange={v => setMonth(v || '1')} w={150} radius="md" />
          <Select label="Year" data={['2023','2024','2025','2026'].map(y => ({ value: y, label: y }))} value={year} onChange={v => setYear(v || '2025')} w={110} radius="md" />
          <Select label="Department" data={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d.id, label: d.name }))]} value={deptId} onChange={v => setDeptId(v || '')} w={200} radius="md" />
          <ActionIcon variant="default" onClick={load} radius="md" size="lg" mt={24}><IconRefresh size={16} /></ActionIcon>
        </Group>
      </Card>
      <SimpleGrid cols={{ base: 2, sm: 3 }} mb="xl">
        {[{ label: 'Total Staff', value: payroll.length, color: '#3b82f6' }, { label: 'Total Basic', value: `Rs ${totalBasic.toLocaleString()}`, color: '#10b981' }, { label: 'Total Net Pay', value: `Rs ${totalNet.toLocaleString()}`, color: '#8b5cf6' }].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr><Table.Th>Staff Member</Table.Th><Table.Th>Designation</Table.Th><Table.Th>Basic</Table.Th><Table.Th>Allowances</Table.Th><Table.Th>Deductions</Table.Th><Table.Th>Net Pay</Table.Th><Table.Th>Actions</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {payroll.map(p => {
                const net = (p.basicSalary || 0) + (p.allowances || 0) + (p.bonus || 0) - (p.deductions || 0);
                return (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Group gap={8}>
                        <Box style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 700 }}>
                          {(p.staff?.firstName || p.staffName || '?').charAt(0)}
                        </Box>
                        <Box>
                          <Text size="sm" fw={500}>{p.staff?.fullName || p.staff?.firstName || p.staffName || '—'}</Text>
                          <Text size="xs" c="dimmed">{p.staff?.employeeId}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm">{p.staff?.designation || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">Rs {(p.basicSalary || 0).toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="green">+Rs {(p.allowances || 0).toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="red">-Rs {(p.deductions || 0).toLocaleString()}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={700} c="#10b981">Rs {net.toLocaleString()}</Text></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <ActionIcon variant="subtle" color="blue" size="sm"><IconEye size={14} /></ActionIcon>
                        <ActionIcon variant="subtle" color="green" size="sm"><IconDownload size={14} /></ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
              {payroll.length === 0 && <Table.Tr><Table.Td colSpan={7}><Center py="xl"><Stack align="center" gap="xs"><IconReceipt2 size={40} color="#cbd5e1" /><Text c="dimmed">No payroll data for selected period</Text></Stack></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
