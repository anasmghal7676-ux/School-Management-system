'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Text, Group, Badge, TextInput, Select, Button,
  Modal, Grid, ActionIcon, Tooltip, Loader, Center,
  Table, Card, Stack, SimpleGrid, Textarea, NumberInput,
  Tabs,
} from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconEye,
  IconRefresh, IconBook, IconBookOff, IconBookmark,
  IconChevronLeft, IconChevronRight, IconDownload,
} from '@tabler/icons-react';

const BOOK_CATEGORIES = ['Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Literature', 'Reference', 'Religious', 'Art', 'Sports', 'Technology'].map(v => ({ value: v, label: v }));
const STATUS_COLOR: Record<string, string> = { Available: 'green', Issued: 'blue', Lost: 'red', Reserved: 'yellow', Damaged: 'orange' };

const EMPTY_BOOK = { title: '', author: '', isbn: '', category: 'General', publisher: '', publishYear: '', copies: '1', shelfNumber: '', description: '' };

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState({ ...EMPTY_BOOK });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tab, setTab] = useState<string | null>('books');
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const LIMIT = 20;

  const f = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (debouncedSearch) p.set('search', debouncedSearch);
      if (categoryFilter) p.set('category', categoryFilter);
      const res = await fetch(`/api/library?${p}`);
      const data = await res.json();
      setBooks(data.data?.books || data.data || []);
      setTotal(data.total || data.data?.total || 0);
    } catch {
      notifications.show({ color: 'red', message: 'Failed to load books' });
    } finally { setLoading(false); }
  }, [page, debouncedSearch, categoryFilter]);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.author.trim()) return notifications.show({ color: 'red', message: 'Title and author required' });
    setSaving(true);
    try {
      const url = editId ? `/api/library/${editId}` : '/api/library';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, copies: parseInt(form.copies) || 1, publishYear: form.publishYear ? parseInt(form.publishYear) : null }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed');
      notifications.show({ color: 'green', message: editId ? 'Book updated' : 'Book added' });
      closeForm();
      loadBooks();
    } catch (e: any) {
      notifications.show({ color: 'red', message: e.message });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await fetch(`/api/library/${deleteId}`, { method: 'DELETE' });
      notifications.show({ color: 'green', message: 'Book removed' });
      closeDelete();
      loadBooks();
    } catch {
      notifications.show({ color: 'red', message: 'Delete failed' });
    } finally { setSaving(false); }
  };

  const totalCopies = books.reduce((s, b) => s + (b.copies || 0), 0);
  const availableBooks = books.filter(b => b.status !== 'Issued').length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700} c="#0f172a">Library</Text>
          <Text size="sm" c="dimmed">Manage books, issues and returns</Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditId(null); setForm({ ...EMPTY_BOOK }); openForm(); }}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          Add Book
        </Button>
      </Group>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
        {[
          { label: 'Total Books', value: total, color: '#3b82f6', icon: <IconBook size={20} /> },
          { label: 'Total Copies', value: totalCopies, color: '#8b5cf6', icon: <IconBookmark size={20} /> },
          { label: 'Available', value: availableBooks, color: '#10b981', icon: <IconBook size={20} /> },
          { label: 'Issued', value: books.filter(b => b.status === 'Issued').length, color: '#f59e0b', icon: <IconBookOff size={20} /> },
        ].map(s => (
          <Card key={s.label} shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9' }}>
            <Group>
              <Box style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</Box>
              <Box>
                <Text size="xl" fw={700} c={s.color}>{s.value}</Text>
                <Text size="xs" c="dimmed">{s.label}</Text>
              </Box>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Group mb="md" gap="sm">
        <TextInput leftSection={<IconSearch size={14} />} placeholder="Search by title, author, ISBN..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, maxWidth: 350 }} radius="md" />
        <Select data={[{ value: '', label: 'All Categories' }, ...BOOK_CATEGORIES]} value={categoryFilter} onChange={v => setCategoryFilter(v || '')} w={180} radius="md" clearable />
        <ActionIcon variant="default" onClick={loadBooks} radius="md" size="lg"><IconRefresh size={16} /></ActionIcon>
      </Group>

      {loading ? <Center py="xl"><Loader /></Center> : (
        <>
          <Box style={{ border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
            <Table highlightOnHover>
              <Table.Thead style={{ background: '#f8fafc' }}>
                <Table.Tr>
                  <Table.Th>Book</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>ISBN</Table.Th>
                  <Table.Th>Copies</Table.Th>
                  <Table.Th>Shelf</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {books.map(book => (
                  <Table.Tr key={book.id}>
                    <Table.Td>
                      <Group gap={8}>
                        <Box style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          <IconBook size={14} />
                        </Box>
                        <Box>
                          <Text size="sm" fw={600} lineClamp={1}>{book.title}</Text>
                          <Text size="xs" c="dimmed">{book.author}</Text>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td><Badge variant="light" color="blue" size="sm">{book.category || 'General'}</Badge></Table.Td>
                    <Table.Td><Text size="xs" c="dimmed">{book.isbn || '—'}</Text></Table.Td>
                    <Table.Td><Text size="sm" fw={500}>{book.copies || 1}</Text></Table.Td>
                    <Table.Td><Text size="sm">{book.shelfNumber || '—'}</Text></Table.Td>
                    <Table.Td><Badge color={STATUS_COLOR[book.status] || 'green'} variant="light" size="sm">{book.status || 'Available'}</Badge></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => { setEditId(book.id); setForm({ title: book.title, author: book.author, isbn: book.isbn || '', category: book.category || 'General', publisher: book.publisher || '', publishYear: book.publishYear ? String(book.publishYear) : '', copies: String(book.copies || 1), shelfNumber: book.shelfNumber || '', description: book.description || '' }); openForm(); }}><IconEdit size={14} /></ActionIcon></Tooltip>
                        <Tooltip label="Delete"><ActionIcon variant="subtle" color="red" size="sm" onClick={() => { setDeleteId(book.id); openDelete(); }}><IconTrash size={14} /></ActionIcon></Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {books.length === 0 && (
                  <Table.Tr><Table.Td colSpan={7}><Center py="xl">
                    <Stack align="center" gap="xs">
                      <IconBook size={40} color="#cbd5e1" />
                      <Text c="dimmed">No books in library</Text>
                    </Stack>
                  </Center></Table.Td></Table.Tr>
                )}
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

      {/* Form Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={<Text fw={700}>{editId ? 'Edit Book' : 'Add New Book'}</Text>} radius="md" size="lg">
        <Stack gap="sm">
          <Grid>
            <Grid.Col span={8}><TextInput label="Title" value={form.title} onChange={e => f('title', e.target.value)} required /></Grid.Col>
            <Grid.Col span={4}><TextInput label="ISBN" value={form.isbn} onChange={e => f('isbn', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={6}><TextInput label="Author" value={form.author} onChange={e => f('author', e.target.value)} required /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Publisher" value={form.publisher} onChange={e => f('publisher', e.target.value)} /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={4}><Select label="Category" data={BOOK_CATEGORIES} value={form.category} onChange={v => f('category', v || 'General')} /></Grid.Col>
            <Grid.Col span={4}><NumberInput label="Copies" value={parseInt(form.copies) || 1} onChange={v => f('copies', String(v))} min={1} /></Grid.Col>
            <Grid.Col span={4}><TextInput label="Shelf No." value={form.shelfNumber} onChange={e => f('shelfNumber', e.target.value)} placeholder="A-1" /></Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={4}><NumberInput label="Publish Year" value={parseInt(form.publishYear) || 0} onChange={v => f('publishYear', String(v))} min={1800} max={2030} /></Grid.Col>
            <Grid.Col span={8}><Textarea label="Description" value={form.description} onChange={e => f('description', e.target.value)} rows={2} /></Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeForm}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit} style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {editId ? 'Update' : 'Add'} Book
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={<Text fw={700} c="red">Remove Book</Text>} radius="md" size="sm">
        <Text size="sm" c="dimmed" mb="xl">Remove this book from the library?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>Cancel</Button>
          <Button color="red" loading={saving} onClick={handleDelete}>Remove</Button>
        </Group>
      </Modal>
    </Box>
  );
}
