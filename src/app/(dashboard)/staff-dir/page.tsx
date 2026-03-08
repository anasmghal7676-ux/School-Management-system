'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, TextInput, Select, Loader, Center, Card, SimpleGrid, Stack, ActionIcon, Avatar } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconPhone, IconMail, IconRefresh, IconUsers } from '@tabler/icons-react';

export default function StaffDirectoryPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [deptFilter, setDeptFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '200' });
      if (debouncedSearch) p.set('search', debouncedSearch);
      if (deptFilter) p.set('departmentId', deptFilter);
      const res = await fetch(`/api/staff?${p}`);
      const data = await res.json();
      setStaff(data.data || []);
    } catch {} finally { setLoading(false); }
  }, [debouncedSearch, deptFilter]);

  useEffect(() => {
    fetch('/api/departments?limit=100').then(r => r.json()).then(d => setDepartments(d.data || []));
    load();
  }, [load]);

  const DEPT_COLORS = ['blue', 'green', 'violet', 'orange', 'teal', 'pink', 'red', 'cyan'];

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Staff Directory</Text><Text size="sm" c="dimmed">{staff.length} staff members</Text></Box>
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      <Group mb="xl" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search by name, designation..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 350 }} radius="md" />
        <Select data={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d.id, label: d.name }))]} value={deptFilter} onChange={v => setDeptFilter(v || '')} w={200} radius="md" clearable />
      </Group>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} gap="md">
          {staff.map((s, idx) => (
            <Card key={s.id} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9', textAlign: 'center' }}>
              <Stack align="center" gap="sm">
                <Box style={{ width: 56, height: 56, borderRadius: '50%', background: `var(--mantine-color-${DEPT_COLORS[idx % DEPT_COLORS.length]}-6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 700 }}>
                  {(s.firstName || s.fullName || '?').charAt(0).toUpperCase()}
                </Box>
                <Box>
                  <Text fw={700} size="sm">{s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim()}</Text>
                  <Text size="xs" c="dimmed">{s.designation || 'Staff'}</Text>
                </Box>
                {s.department && <Badge size="xs" variant="light" color={DEPT_COLORS[idx % DEPT_COLORS.length]}>{s.department.name}</Badge>}
                <Stack gap={4} style={{ width: '100%' }}>
                  {s.contactNumber && <Group gap={6} justify="center"><IconPhone size={12} color="#64748b" /><Text size="xs" c="dimmed">{s.contactNumber}</Text></Group>}
                  {s.email && <Group gap={6} justify="center"><IconMail size={12} color="#64748b" /><Text size="xs" c="dimmed" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{s.email}</Text></Group>}
                </Stack>
              </Stack>
            </Card>
          ))}
          {staff.length === 0 && (
            <Box style={{ gridColumn: '1/-1' }}>
              <Center py="xl"><Stack align="center" gap="xs"><IconUsers size={40} color="#cbd5e1" /><Text c="dimmed">No staff found</Text></Stack></Center>
            </Box>
          )}
        </SimpleGrid>
      )}
    </Box>
  );
}
