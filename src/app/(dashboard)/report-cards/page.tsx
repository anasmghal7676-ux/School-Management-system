'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import {
  Container, Title, Group, Button, TextInput, Select, Table, Badge,
  ActionIcon, Text, Card, Grid, Loader, Center, Pagination, Tooltip,
} from '@mantine/core';
import {
  IconSearch, IconDownload, IconEye, IconRefresh,
  IconUserCheck, IconTrendingUp, IconAward, IconX,
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { generateReportCard } from '@/lib/pdf-generator';

const PAGE_SIZE = 15;

export default function ReportCardsPage() {
  const [records, setRecords]     = useState<any[]>([]);
  const [classes, setClasses]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [search, setSearch]       = useState('');
  const [debouncedSearch]         = useDebouncedValue(search, 300);
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [termFilter, setTermFilter]   = useState<string | null>(null);
  const [pdfLoading, setPdfLoading]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(classFilter && { classId: classFilter }),
        ...(termFilter && { term: termFilter }),
      });
      const res = await fetch('/api/report-cards?' + params);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, classFilter, termFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [debouncedSearch, classFilter, termFilter]);

  useEffect(() => {
    fetch('/api/classes?limit=100').then(r => r.json()).then(d =>
      setClasses((d.data || []).map((c: any) => ({ value: c.id, label: c.name })))
    );
  }, []);

  async function handleDownloadPDF(record: any) {
    setPdfLoading(record.id);
    try {
      const studentId = record.studentId || record.student?.id;
      const term = record.term || '';
      const res = await fetch(`/api/pdf?type=report-card&studentId=${studentId}&term=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.success) {
        generateReportCard(data.data);
        notifications.show({ message: 'Report card PDF generated', color: 'teal' });
      } else {
        notifications.show({ message: 'Could not load report card data', color: 'red' });
      }
    } catch {
      notifications.show({ message: 'PDF generation failed', color: 'red' });
    } finally {
      setPdfLoading(null);
    }
  }

  const passed  = records.filter(r => (r.percentage || 0) >= 40).length;
  const failed  = records.length - passed;
  const avgPct  = records.length > 0
    ? Math.round(records.reduce((s, r) => s + (r.percentage || 0), 0) / records.length)
    : 0;
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Report Cards</Title>
        <ActionIcon variant="default" size="lg" onClick={fetchData} title="Refresh">
          <IconRefresh size={16} />
        </ActionIcon>
      </Group>

      <Grid mb="lg">
        {[
          { label: 'Total Reports', value: total, icon: <IconUserCheck size={22} />, color: 'blue' },
          { label: 'Passed', value: passed, icon: <IconAward size={22} />, color: 'green' },
          { label: 'Failed', value: failed, icon: <IconX size={22} />, color: 'red' },
          { label: 'Average %', value: avgPct + '%', icon: <IconTrendingUp size={22} />, color: 'violet' },
        ].map(s => (
          <Grid.Col key={s.label} span={{ base: 6, sm: 3 }}>
            <Card withBorder radius="md" p="md">
              <Group>
                <Text c={s.color}>{s.icon}</Text>
                <div>
                  <Text size="xl" fw={700}>{s.value}</Text>
                  <Text size="xs" c="dimmed">{s.label}</Text>
                </div>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Group mb="md" gap="sm">
        <TextInput
          placeholder="Search student..."
          leftSection={<IconSearch size={16} />}
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <Select placeholder="Class" data={classes} value={classFilter} onChange={setClassFilter} clearable w={160} />
        <Select
          placeholder="Term"
          data={['Term 1', 'Term 2', 'Term 3', 'Mid Term', 'Final']}
          value={termFilter} onChange={setTermFilter} clearable w={140}
        />
      </Group>

      {loading ? (
        <Center py="xl"><Loader /></Center>
      ) : (
        <Card withBorder radius="md" p={0}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Roll No</Table.Th>
                <Table.Th>Student</Table.Th>
                <Table.Th>Class</Table.Th>
                <Table.Th>Term</Table.Th>
                <Table.Th>Marks</Table.Th>
                <Table.Th>%</Table.Th>
                <Table.Th>Grade</Table.Th>
                <Table.Th>Result</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9}>
                    <Center py="xl"><Text c="dimmed">No report cards found</Text></Center>
                  </Table.Td>
                </Table.Tr>
              ) : records.map(r => {
                const pct  = r.percentage || 0;
                const pass = pct >= 40;
                return (
                  <Table.Tr key={r.id}>
                    <Table.Td>
                      <Badge variant="outline" size="sm">{r.student?.rollNumber || r.student?.admissionNumber || '—'}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500} size="sm">{r.student?.fullName || `${r.student?.firstName || ''} ${r.student?.lastName || ''}`.trim() || '—'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue" size="sm">{r.class?.name || r.student?.class?.name || '—'}</Badge>
                    </Table.Td>
                    <Table.Td><Text size="sm">{r.term || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{r.obtainedMarks || 0}/{r.totalMarks || 0}</Text></Table.Td>
                    <Table.Td>
                      <Text fw={600} c={pass ? 'green' : 'red'} size="sm">{pct}%</Text>
                    </Table.Td>
                    <Table.Td><Badge color="violet" variant="light" size="sm">{r.grade || '—'}</Badge></Table.Td>
                    <Table.Td>
                      <Badge color={pass ? 'green' : 'red'} variant="light" size="sm">
                        {pass ? 'Pass' : 'Fail'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label="Download PDF">
                          <ActionIcon
                            variant="light" color="teal" size="sm"
                            loading={pdfLoading === r.id}
                            onClick={() => handleDownloadPDF(r)}
                          >
                            <IconDownload size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <ActionIcon variant="light" color="blue" size="sm" title="View">
                          <IconEye size={14} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
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
