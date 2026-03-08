'use client';
export const dynamic = 'force-dynamic';
import { Box, Text, Group, Badge, Card, SimpleGrid, Stack } from '@mantine/core';
import { IconShield, IconUser, IconSchool, IconBook, IconCurrencyDollar, IconBuildingBank } from '@tabler/icons-react';

const ROLES = [
  { role: 'super_admin', label: 'Super Admin', desc: 'Full system access — all modules, all schools', color: '#ef4444', icon: IconShield, permissions: ['All permissions'] },
  { role: 'admin', label: 'Admin', desc: 'School-level admin access', color: '#f97316', icon: IconBuildingBank, permissions: ['Manage students', 'Manage staff', 'View reports', 'Manage settings'] },
  { role: 'principal', label: 'Principal', desc: 'Academic leadership access', color: '#8b5cf6', icon: IconSchool, permissions: ['View all modules', 'Manage academics', 'Staff oversight', 'Reports'] },
  { role: 'teacher', label: 'Teacher', desc: 'Teaching staff access', color: '#3b82f6', icon: IconBook, permissions: ['Attendance', 'Marks entry', 'Homework', 'Timetable view'] },
  { role: 'accountant', label: 'Accountant', desc: 'Finance module access', color: '#10b981', icon: IconCurrencyDollar, permissions: ['Fee collection', 'Payroll', 'Expenses', 'Financial reports'] },
  { role: 'parent', label: 'Parent', desc: 'Parent portal access', color: '#06b6d4', icon: IconUser, permissions: ['View child progress', 'Fee status', 'Communication', 'Attendance view'] },
  { role: 'student', label: 'Student', desc: 'Student portal access', color: '#84cc16', icon: IconUser, permissions: ['View timetable', 'View results', 'Submit homework', 'View notices'] },
];

export default function RolesPage() {
  return (
    <Box p="xl">
      <Box mb="xl">
        <Text size="xl" fw={700} c="#0f172a">Roles & Permissions</Text>
        <Text size="sm" c="dimmed">System role definitions and their access levels</Text>
      </Box>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} gap="md">
        {ROLES.map(({ role, label, desc, color, icon: Icon, permissions }) => (
          <Card key={role} shadow="xs" radius="md" p="lg" style={{ border: `1px solid ${color}22` }}>
            <Group mb="sm">
              <Box style={{ width: 40, height: 40, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Icon size={20} />
              </Box>
              <Box>
                <Text fw={700}>{label}</Text>
                <Badge size="xs" color="gray" variant="light">{role}</Badge>
              </Box>
            </Group>
            <Text size="sm" c="dimmed" mb="md">{desc}</Text>
            <Stack gap={4}>
              {permissions.map(p => (
                <Group key={p} gap={6}>
                  <Box style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                  <Text size="xs">{p}</Text>
                </Group>
              ))}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}
