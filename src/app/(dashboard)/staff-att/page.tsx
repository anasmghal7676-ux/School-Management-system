'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, Select, Button, Loader, Center,
  Table, Card, Stack, SimpleGrid, Checkbox, ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSave, IconRefresh, IconCalendar, IconUsers } from '@tabler/icons-react';

const STATUS_OPTS = ['Present', 'Absent', 'Late', 'Half Day', 'Leave'];
const STATUS_COLOR: Record<string, string> = { Present: 'green', Absent: 'red', Late: 'orange', 'Half Day': 'yellow', Leave: 'violet' };

export default function StaffAttendancePage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptId, setDeptId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/departments?limit=100').then(r => r.json()).then(d => setDepartments(d.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: '200' });
    if (deptId) p.set('departmentId', deptId);
    fetch(`/api/staff?${p}`).then(r => r.json()).then(d => {
      const s = d.data || [];
      setStaff(s);
      const init: Record<string, string> = {};
      s.forEach((st: any) => { init[st.id] = 'Present'; });
      setStatuses(init);
    }).finally(() => setLoading(false));
  }, [deptId]);

  const markAll = (status: string) => {
    const updated: Record<string, string> = {};
    staff.forEach(s => { updated[s.id] = status; });
    setStatuses(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = staff.map(s => ({ staffId: s.id, date, status: statuses[s.id] || 'Present', schoolId: 'school_main' }));
      const res = await fetch('/api/staff-attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: `Saved attendance for ${staff.length} staff` });
    } catch (e: any) { notifications.show({ color: 'red', message: e.message }); }
    finally { setSaving(false); }
  };

  const presentCount = Object.values(statuses).filter(s => s === 'Present').length;
  const absentCount = Object.values(statuses).filter(s => s === 'Absent').length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Staff Attendance</Text><Text size="sm" c="dimmed">Daily staff attendance tracking</Text></Box>
        <Button leftSection={<IconSave size={16} />} onClick={handleSave} loading={saving} disabled={staff.length === 0} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>Save Attendance</Button>
      </Group>
      <Card shadow="xs" radius="md" p="md" mb="xl" style={{ border: '1px solid #f1f5f9' }}>
        <Group gap="sm" wrap="wrap">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
          <Select placeholder="All Departments" data={departments.map(d => ({ value: d.id, label: d.name }))} value={deptId} onChange={v => setDeptId(v || '')} w={200} radius="md" clearable />
          <Group gap={6} ml="auto">
            <Button size="xs" variant="light" color="green" onClick={() => markAll('Present')}>All Present</Button>
            <Button size="xs" variant="light" color="red" onClick={() => markAll('Absent')}>All Absent</Button>
          </Group>
        </Group>
      </Card>
      {staff.length > 0 && (
        <SimpleGrid cols={{ base: 2, sm: 4 }} mb="md">
          {[{ label: 'Total', value: staff.length, color: '#3b82f6' }, { label: 'Present', value: presentCount, color: '#10b981' }, { label: 'Absent', value: absentCount, color: '#ef4444' }, { label: 'Other', value: staff.length - presentCount - absentCount, color: '#f59e0b' }].map(s => (
            <Card key={s.label} shadow="xs" radius="md" p="sm" style={{ border: '1px solid #f1f5f9' }}>
              <Text size="lg" fw={700} c={s.color}>{s.value}</Text>
              <Text size="xs" c="dimmed">{s.label}</Text>
            </Card>
          ))}
        </SimpleGrid>
      )}
      {loading ? <Center py="xl"><Loader /></Center> : (
        <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
          <Table highlightOnHover>
            <Table.Thead style={{ background: '#f8fafc' }}>
              <Table.Tr><Table.Th>#</Table.Th><Table.Th>Staff Member</Table.Th><Table.Th>Department</Table.Th><Table.Th>Designation</Table.Th><Table.Th>Status</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {staff.map((s, idx) => (
                <Table.Tr key={s.id}>
                  <Table.Td><Text size="sm" c="dimmed">{idx + 1}</Text></Table.Td>
                  <Table.Td>
                    <Group gap={8}>
                      <Box style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>{(s.firstName || s.fullName || '?').charAt(0)}</Box>
                      <Box><Text size="sm" fw={500}>{s.fullName || `${s.firstName} ${s.lastName}`}</Text><Text size="xs" c="dimmed">{s.employeeId}</Text></Box>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm">{s.department?.name || '—'}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{s.designation || '—'}</Text></Table.Td>
                  <Table.Td>
                    <Select data={STATUS_OPTS.map(v => ({ value: v, label: v }))} value={statuses[s.id] || 'Present'} onChange={v => setStatuses(p => ({ ...p, [s.id]: v || 'Present' }))}
                      w={130} size="xs" radius="md"
                      styles={{ input: { color: STATUS_COLOR[statuses[s.id] || 'Present'] || 'inherit', fontWeight: 600 } }}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
              {staff.length === 0 && <Table.Tr><Table.Td colSpan={5}><Center py="xl"><Text c="dimmed">No staff found</Text></Center></Table.Td></Table.Tr>}
            </Table.Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
