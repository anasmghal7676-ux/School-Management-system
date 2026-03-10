'use client';
export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';
import {
  Box, Text, Group, TextInput, Card, Stack, Badge, Loader, Center,
  Tabs, Avatar, Anchor,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect } from 'react';
import {
  IconSearch, IconUser, IconSchool, IconUsers, IconBook,
  IconCalendar, IconCurrencyDollar,
} from '@tabler/icons-react';
import Link from 'next/link';

type SearchResult = { id: string; label: string; sub?: string; href: string; type: string; };

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  student:   { icon: <IconUser size={16}/>,          color: 'blue',   label: 'Students' },
  staff:     { icon: <IconUsers size={16}/>,         color: 'violet', label: 'Staff' },
  class:     { icon: <IconSchool size={16}/>,        color: 'teal',   label: 'Classes' },
  subject:   { icon: <IconBook size={16}/>,          color: 'grape',  label: 'Subjects' },
  event:     { icon: <IconCalendar size={16}/>,      color: 'orange', label: 'Events' },
  fee:       { icon: <IconCurrencyDollar size={16}/>,color: 'green',  label: 'Fee Records' },
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 400);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { doSearch(debouncedQuery); }, [debouncedQuery, doSearch]);

  const types = ['all', ...Array.from(new Set(results.map(r => r.type)))];
  const filtered = activeTab === 'all' ? results : results.filter(r => r.type === activeTab);

  return (
    <Box p="xl" className="page-content">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="22px" fw={800} style={{ color: '#0f172a' }}>Global Search</Text>
          <Text c="dimmed" size="sm">Search across students, staff, classes, and more</Text>
        </Box>
      </Group>

      <Card withBorder radius="md" p="xl" mb="md">
        <TextInput
          leftSection={<IconSearch size={20}/>}
          placeholder="Search students, staff, classes, subjects..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          size="lg"
          radius="md"
          styles={{ input: { fontSize: 16 } }}
          autoFocus
        />
        {query.length > 0 && query.length < 2 && (
          <Text size="xs" c="dimmed" mt="xs">Type at least 2 characters to search</Text>
        )}
      </Card>

      {loading && <Center h={100}><Loader/></Center>}

      {!loading && results.length > 0 && (
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb="md">
            <Text fw={600}>{results.length} result{results.length !== 1 ? 's' : ''} for "{debouncedQuery}"</Text>
          </Group>
          <Tabs value={activeTab} onChange={v => setActiveTab(v || 'all')} mb="md">
            <Tabs.List>
              {types.map(t => (
                <Tabs.Tab key={t} value={t} leftSection={t !== 'all' ? TYPE_CONFIG[t]?.icon : undefined}>
                  {t === 'all' ? 'All' : TYPE_CONFIG[t]?.label || t}
                  <Badge ml={6} size="xs" variant="light" color={t === 'all' ? 'gray' : TYPE_CONFIG[t]?.color}>
                    {t === 'all' ? results.length : results.filter(r => r.type === t).length}
                  </Badge>
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
          <Stack gap="xs">
            {filtered.map(r => (
              <Anchor key={r.id} component={Link} href={r.href} underline="never">
                <Card withBorder p="sm" radius="sm" style={{ cursor: 'pointer' }}>
                  <Group>
                    <Avatar size="sm" color={TYPE_CONFIG[r.type]?.color || 'gray'} radius="xl">
                      {TYPE_CONFIG[r.type]?.icon}
                    </Avatar>
                    <Box flex={1}>
                      <Text fw={500} size="sm">{r.label}</Text>
                      {r.sub && <Text size="xs" c="dimmed">{r.sub}</Text>}
                    </Box>
                    <Badge size="xs" variant="light" color={TYPE_CONFIG[r.type]?.color || 'gray'}>
                      {TYPE_CONFIG[r.type]?.label || r.type}
                    </Badge>
                  </Group>
                </Card>
              </Anchor>
            ))}
          </Stack>
        </Card>
      )}

      {!loading && debouncedQuery.length >= 2 && results.length === 0 && (
        <Center h={200}>
          <Stack align="center">
            <IconSearch size={40} color="#94a3b8"/>
            <Text fw={600} c="dimmed">No results for "{debouncedQuery}"</Text>
            <Text size="sm" c="dimmed">Try searching with different keywords</Text>
          </Stack>
        </Center>
      )}

      {!query && (
        <Card withBorder radius="md" p="xl">
          <Stack align="center" gap="xs">
            <IconSearch size={48} color="#cbd5e1"/>
            <Text fw={600} size="lg" c="#64748b">Start Searching</Text>
            <Text c="dimmed" size="sm" ta="center" maw={400}>
              Search across all modules — students, staff, classes, subjects, events, fee records, and more.
            </Text>
            <Group mt="md" gap="xs">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <Badge key={key} leftSection={cfg.icon} color={cfg.color} variant="light">{cfg.label}</Badge>
              ))}
            </Group>
          </Stack>
        </Card>
      )}
    </Box>
  );
}
