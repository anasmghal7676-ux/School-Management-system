'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import {
  Container, Title, Group, Button, TextInput, Table, Badge,
  ActionIcon, Text, Card, Grid, Loader, Center, Pagination, Tooltip,
} from '@mantine/core';
import { IconSearch, IconPlus, IconEdit, IconTrash, IconRefresh } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

const PAGE_SIZE = 20;

export default function StuProgressPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [search, setSearch]   = useState('');
  const [debouncedSearch]     = useDebouncedValue(search, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE),
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res  = await fetch('/api/stu-progress?' + params);
      const data = await res.json();
      if (data.success !== false) {
        setRecords(data.data || data.records || []);
        setTotal(data.pagination?.total || (data.data || data.records || []).length);
      }
    } catch {
      notifications.show({ message: 'Failed to load data', color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this record?')) return;
    const res  = await fetch(`/api/stu-progress/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      notifications.show({ message: 'Deleted successfully', color: 'orange' });
      fetchData();
    }
  }

  const stats = [
    { label: 'Total Records', value: total },
    { label: 'This Month', value: records.filter((r: any) => { const d = new Date(r.createdAt || r.date || r.updatedAt || Date.now()); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length },
    { label: 'Active', value: records.filter((r: any) => r.status === 'Active' || r.status === 'Approved' || r.isActive === true).length },
  ];

  const pages = Math.ceil(total / PAGE_SIZE);
  const cols  = ['Student', 'Term', 'Subject', 'Score', 'Trend'];

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Student Progress</Title>
        <Group gap="sm">
          <ActionIcon variant="default" size="lg" onClick={fetchData} title="Refresh">
            <IconRefresh size={16} />
          </ActionIcon>
          
        </Group>
      </Group>

      <Grid mb="lg">
        {stats.map(s => (
          <Grid.Col key={s.label} span={{ base: 12, sm: 4 }}>
            <Card withBorder radius="md" p="md">
              <Text size="xl" fw={700} c="green">{}</Text>
              <Text size="xs" c="dimmed">{s.label}</Text>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Group mb="md">
        <TextInput
          placeholder="Search..."
          leftSection={<IconSearch size={16} />}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
      </Group>

      {loading ? (
        <Center py="xl"><Loader /></Center>
      ) : (
        <Card withBorder radius="md" p={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {cols.map((c: string) => <Table.Th key={c}>{c}</Table.Th>)}
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={cols.length + 1}>
                    <Center py="xl"><Text c="dimmed">No student progress records found</Text></Center>
                  </Table.Td>
                </Table.Tr>
              ) : records.map((r: any, i: number) => (
                <Table.Tr key={r.id || i}>
                  {cols.map((c: string, ci: number) => {
                    const keys = Object.keys(r).filter(k => k !== 'id');
                    const val  = r[keys[ci]] ?? r[c.toLowerCase().replace(/[^a-z]/g, '')] ?? '—';
                    const str  = typeof val === 'object' ? JSON.stringify(val) : String(val);
                    return (
                      <Table.Td key={c}>
                        {ci === 0 ? <Text fw={500} size="sm">{str}</Text> :
                          str.length < 20 && (str === 'Active' || str === 'Approved' || str === 'Present' || str === 'Paid') ?
                          <Badge size="sm" color="green" variant="light">{str}</Badge> :
                          str.length < 20 && (str === 'Inactive' || str === 'Rejected' || str === 'Absent' || str === 'Overdue') ?
                          <Badge size="sm" color="red" variant="light">{str}</Badge> :
                          <Text size="sm" c={ci > 2 ? "dimmed" : undefined}>{str.length > 40 ? str.slice(0, 40) + '…' : str}</Text>
                        }
                      </Table.Td>
                    );
                  })}
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label="Edit">
                        <ActionIcon variant="light" color="blue" size="sm">
                          <IconEdit size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <ActionIcon variant="light" color="red" size="sm" onClick={() => handleDelete(r.id)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {pages > 1 && (
        <Center mt="md">
          <Pagination total={pages} value={page} onChange={setPage} />
        </Center>
      )}
    </Container>
  );
}
