'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Group, Badge, TextInput, Select, Loader, Center, Table, Stack, Card, SimpleGrid, ActionIcon } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconRefresh, IconDownload, IconReceipt2, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (debouncedSearch) p.set('search', debouncedSearch);
      if (statusFilter) p.set('status', statusFilter);
      const res = await fetch(`/api/fee-payments?${p}`);
      const data = await res.json();
      setReceipts(data.data || []);
      setTotal(data.total || 0);
    } catch { setReceipts([]); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, statusFilter]);
  useEffect(() => { load(); }, [load]);

  const totalAmount = receipts.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box><Text size="xl" fw={700} c="#0f172a">Fee Receipts</Text><Text size="sm" c="dimmed">Payment receipts and history</Text></Box>
        <ActionIcon variant="default" onClick={load} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 3 }} mb="xl">
        {[{ label: 'Total Receipts', value: total, color: '#3b82f6' }, { label: 'Amount (page)', value: `Rs ${totalAmount.toLocaleString()}`, color: '#10b981' }, { label: 'This Month', value: receipts.filter(r => { const d = new Date(r.paymentDate || r.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length, color: '#8b5cf6' }].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
            <Text size="xs" c="dimmed">{s.label}</Text>
          </Card>
        ))}
      </SimpleGrid>
      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search by student, receipt..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 300 }} radius="md" />
        <Select data={[{ value: '', label: 'All Status' }, { value: 'paid', label: 'Paid' }, { value: 'partial', label: 'Partial' }, { value: 'overdue', label: 'Overdue' }]} value={statusFilter} onChange={v => setStatusFilter(v || '')} w={140} radius="md" />
      </Group>
      {loading ? <Center py="xl"><Loader /></Center> : (
        <>
          <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
            <Table highlightOnHover>
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr><Table.Th>Receipt #</Table.Th><Table.Th>Student</Table.Th><Table.Th>Amount</Table.Th><Table.Th>Method</Table.Th><Table.Th>Date</Table.Th><Table.Th>Status</Table.Th><Table.Th>Download</Table.Th></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {receipts.map((r, idx) => (
                  <Table.Tr key={r.id}>
                    <Table.Td><Text size="sm" fw={500} c="blue">#{r.receiptNumber || String((page - 1) * LIMIT + idx + 1).padStart(4, '0')}</Text></Table.Td>
                    <Table.Td>
                      <Box>
                        <Text size="sm" fw={500}>{r.student?.fullName || r.student?.firstName || '—'}</Text>
                        <Text size="xs" c="dimmed">{r.student?.admissionNumber}</Text>
                      </Box>
                    </Table.Td>
                    <Table.Td><Text size="sm" fw={600} c="#10b981">Rs {(r.amount || 0).toLocaleString()}</Text></Table.Td>
                    <Table.Td><Badge variant="light" size="sm">{r.paymentMethod || r.method || 'Cash'}</Badge></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</Text></Table.Td>
                    <Table.Td><Badge color={r.status === 'paid' ? 'green' : r.status === 'partial' ? 'yellow' : 'blue'} variant="light" size="sm">{r.status || 'Paid'}</Badge></Table.Td>
                    <Table.Td><ActionIcon variant="subtle" color="blue" size="sm"><IconDownload size={14} /></ActionIcon></Table.Td>
                  </Table.Tr>
                ))}
                {receipts.length === 0 && <Table.Tr><Table.Td colSpan={7}><Center py="xl"><Stack align="center" gap="xs"><IconReceipt2 size={40} color="#cbd5e1" /><Text c="dimmed">No receipts found</Text></Stack></Center></Table.Td></Table.Tr>}
              </Table.Tbody>
            </Table>
          </Box>
          {total > LIMIT && (
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">Page {page} of {Math.ceil(total / LIMIT)}</Text>
              <Group gap={8}>
                <ActionIcon variant="default" disabled={page === 1} onClick={() => setPage(p => p - 1)}><IconChevronLeft size={14} /></ActionIcon>
                <ActionIcon variant="default" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}><IconChevronRight size={14} /></ActionIcon>
              </Group>
            </Group>
          )}
        </>
      )}
    </Box>
  );
}
