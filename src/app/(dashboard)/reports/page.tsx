'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { Box, Text, Group, Card, SimpleGrid, Badge, Button, Stack, Select, ActionIcon, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconDownload, IconChartBar, IconUsers, IconCurrencyDollar, IconCalendar, IconBook, IconUserCheck } from '@tabler/icons-react';

const REPORT_TYPES = [
  { id: 'attendance', label: 'Attendance Report', icon: <IconCalendar size={24} />, color: '#3b82f6', desc: 'Daily/monthly attendance summary' },
  { id: 'financial', label: 'Financial Report', icon: <IconCurrencyDollar size={24} />, color: '#10b981', desc: 'Fee collection & expenses' },
  { id: 'academic', label: 'Academic Report', icon: <IconBook size={24} />, color: '#8b5cf6', desc: 'Marks & grade analysis' },
  { id: 'staff', label: 'Staff Report', icon: <IconUserCheck size={24} />, color: '#f59e0b', desc: 'Staff attendance & payroll' },
  { id: 'students', label: 'Student Report', icon: <IconUsers size={24} />, color: '#ec4899', desc: 'Student demographics & stats' },
  { id: 'performance', label: 'Performance Report', icon: <IconChartBar size={24} />, color: '#06b6d4', desc: 'School-wide performance metrics' },
];

export default function Page() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('this_month');

  async function generateReport(type: string) {
    setSelectedReport(type);
    setLoading(true);
    try {
      const endpoints: Record<string, string> = {
        attendance: '/api/attendance',
        financial: '/api/fees/collection',
        academic: '/api/marks',
        staff: '/api/staff',
        students: '/api/students',
        performance: '/api/results',
      };
      const r = await fetch(endpoints[type]).then(r => r.json());
      setReportData({ type, items: r.data || [], count: (r.data || []).length });
    } catch { notifications.show({ title: 'Error', message: 'Failed to generate report', color: 'red' }); }
    finally { setLoading(false); }
  }

  const summaries: Record<string, any> = {
    attendance: reportData ? {
      total: reportData.count,
      present: reportData.items.filter((i: any) => i.status === 'Present').length,
      absent: reportData.items.filter((i: any) => i.status === 'Absent').length,
    } : null,
    financial: reportData ? {
      total: reportData.count,
      collected: reportData.items.filter((i: any) => i.status === 'Paid').reduce((s: number, i: any) => s + (i.amount || 0), 0),
      pending: reportData.items.filter((i: any) => i.status !== 'Paid').reduce((s: number, i: any) => s + (i.amount || 0), 0),
    } : null,
    students: reportData ? {
      total: reportData.count,
      male: reportData.items.filter((i: any) => i.gender === 'Male').length,
      female: reportData.items.filter((i: any) => i.gender === 'Female').length,
    } : null,
  };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Reports</Text><Text size="sm" c="dimmed">Generate & download school reports</Text></Box>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mb="xl">
        {REPORT_TYPES.map(r => (
          <Card
            key={r.id}
            shadow="xs"
            radius="md"
            p="lg"
            style={{ border: `2px solid ${selectedReport === r.id ? r.color : '#f1f5f9'}`, cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => generateReport(r.id)}
          >
            <Group gap="md">
              <Box style={{ width: 48, height: 48, borderRadius: 12, background: r.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color }}>
                {r.icon}
              </Box>
              <Box style={{ flex: 1 }}>
                <Text fw={600}>{r.label}</Text>
                <Text size="xs" c="dimmed">{r.desc}</Text>
              </Box>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {selectedReport && (
        <Card shadow="xs" radius="md" p="xl" style={{ border: '1px solid #f1f5f9' }}>
          <Group justify="space-between" mb="lg">
            <Text fw={600}>{REPORT_TYPES.find(r => r.id === selectedReport)?.label}</Text>
            <Group>
              <Select data={[{ value: 'today', label: 'Today' }, { value: 'this_week', label: 'This Week' }, { value: 'this_month', label: 'This Month' }, { value: 'this_year', label: 'This Year' }]} value={period} onChange={v => setPeriod(v || 'this_month')} w={150} size="sm" />
              <Button leftSection={<IconDownload size={14} />} size="sm" variant="light">Export CSV</Button>
            </Group>
          </Group>

          {loading ? (
            <Group justify="center" py="xl"><Loader /></Group>
          ) : reportData && (
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Card p="lg" radius="md" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Text size="xl" fw={700} c="#3b82f6">{reportData.count}</Text>
                <Text size="sm" c="dimmed">Total Records</Text>
              </Card>

              {selectedReport === 'attendance' && summaries.attendance && (<>
                <Card p="lg" radius="md" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}><Text size="xl" fw={700} c="#10b981">{summaries.attendance.present}</Text><Text size="sm" c="dimmed">Present</Text></Card>
                <Card p="lg" radius="md" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}><Text size="xl" fw={700} c="#ef4444">{summaries.attendance.absent}</Text><Text size="sm" c="dimmed">Absent</Text></Card>
              </>)}

              {selectedReport === 'financial' && summaries.financial && (<>
                <Card p="lg" radius="md" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}><Text size="xl" fw={700} c="#10b981">Rs. {summaries.financial.collected.toLocaleString()}</Text><Text size="sm" c="dimmed">Collected</Text></Card>
                <Card p="lg" radius="md" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}><Text size="xl" fw={700} c="#ef4444">Rs. {summaries.financial.pending.toLocaleString()}</Text><Text size="sm" c="dimmed">Pending</Text></Card>
              </>)}

              {selectedReport === 'students' && summaries.students && (<>
                <Card p="lg" radius="md" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}><Text size="xl" fw={700} c="#3b82f6">{summaries.students.male}</Text><Text size="sm" c="dimmed">Male</Text></Card>
                <Card p="lg" radius="md" style={{ background: '#fdf4ff', border: '1px solid #f5d0fe' }}><Text size="xl" fw={700} c="#ec4899">{summaries.students.female}</Text><Text size="sm" c="dimmed">Female</Text></Card>
              </>)}
            </SimpleGrid>
          )}
        </Card>
      )}
    </Box>
  );
}
