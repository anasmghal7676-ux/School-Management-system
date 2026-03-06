'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, BookOpen, Edit, Trash2, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const TYPE_COLORS: Record<string, string> = {
  Theory:    'bg-blue-100 text-blue-700',
  Practical: 'bg-green-100 text-green-700',
  Both:      'bg-purple-100 text-purple-700',
};

const EMPTY = { name: '', code: '', subjectType: 'Theory', maxMarks: '100', passMarks: '33', isCore: true, isOptional: false, description: '' };

export default function SubjectsPage() {
  const [subjects, setSubjects]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [classes, setClasses]     = useState<any[]>([]);
  const [classAssignments, setClassAssignments] = useState<Record<string, string[]>>({});

  const [addOpen, setAddOpen]     = useState(false);
  const [editItem, setEditItem]   = useState<any>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [form, setForm]           = useState<any>({ ...EMPTY });
  const [saving, setSaving]       = useState(false);

  const LIMIT = 20;

  useEffect(() => { fetchSubjects(); fetchClasses(); }, []);
  useEffect(() => { fetchSubjects(); }, [search, typeFilter, page]);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: String(LIMIT), page: String(page) });
      if (search) p.append('search', search);
      const r = await fetch(`/api/subjects?${p}`);
      const j = await r.json();
      if (j.success) {
        const list = j.data?.subjects || j.data || [];
        const filtered = typeFilter !== 'all' ? list.filter((s: any) => s.subjectType === typeFilter) : list;
        setSubjects(filtered);
        setTotal(j.data?.total || filtered.length);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, typeFilter, page]);

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=50');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast({ title: 'Name and code required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const school = await fetch('/api/settings/school').then(r => r.json()).catch(() => ({ data: { id: 'default' } }));
      const payload = { ...form, schoolId: school?.data?.id || 'default', maxMarks: parseFloat(form.maxMarks), passMarks: parseFloat(form.passMarks) };
      const url    = editItem ? `/api/subjects/${editItem.id}` : '/api/subjects';
      const method = editItem ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j.success) {
        toast({ title: editItem ? 'Subject updated' : 'Subject created' });
        setAddOpen(false); setEditItem(null); setForm({ ...EMPTY }); fetchSubjects();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const r = await fetch(`/api/subjects/${deleteId}`, { method: 'DELETE' });
      const j = await r.json();
      if (j.success) { toast({ title: 'Deleted' }); fetchSubjects(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setDeleteId(null); }
  };

  const openEdit = (s: any) => {
    setForm({ name: s.name, code: s.code, subjectType: s.subjectType, maxMarks: String(s.maxMarks), passMarks: String(s.passMarks), isCore: s.isCore, isOptional: s.isOptional, description: s.description || '' });
    setEditItem(s); setAddOpen(true);
  };

  const uf = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const typeCount = (type: string) => subjects.filter(s => s.subjectType === type).length;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><BookOpen className="h-7 w-7" />Subjects</h1>
            <p className="text-muted-foreground">Manage school subjects, types and mark schemes</p>
          </div>
          <Button onClick={() => { setForm({ ...EMPTY }); setEditItem(null); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Subject
          </Button>
        </div>

        {/* Type summary cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Theory',    color: 'border-l-blue-500',   text: 'text-blue-600' },
            { label: 'Practical', color: 'border-l-green-500',  text: 'text-green-600' },
            { label: 'Both',      color: 'border-l-purple-500', text: 'text-purple-600' },
          ].map(({ label, color, text }) => (
            <Card key={label} className={`border-l-4 ${color} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => setTypeFilter(typeFilter === label ? 'all' : label)}>
              <CardContent className="pt-3 pb-3 flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${text}`}>{typeCount(label)}</p>
                </div>
                <BookOpen className={`h-5 w-5 ${text}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search subjects..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {['Theory', 'Practical', 'Both'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchSubjects} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : subjects.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <BookOpen className="h-12 w-12 mb-4 opacity-30" />
                <p className="font-medium">No subjects found</p>
                <Button className="mt-4" onClick={() => { setForm({ ...EMPTY }); setEditItem(null); setAddOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />Add First Subject
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Max Marks</TableHead>
                      <TableHead>Pass Marks</TableHead>
                      <TableHead>Attributes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((s: any) => (
                      <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="font-medium">{s.name}</div>
                          {s.description && <div className="text-xs text-muted-foreground truncate max-w-48">{s.description}</div>}
                        </TableCell>
                        <TableCell><span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{s.code}</span></TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[s.subjectType] || 'bg-gray-100 text-gray-700'}`}>
                            {s.subjectType}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">{s.maxMarks}</TableCell>
                        <TableCell className="text-muted-foreground">{s.passMarks}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {s.isCore     && <Badge variant="outline" className="text-xs">Core</Badge>}
                            {s.isOptional && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Optional</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteId(s.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">{subjects.length} subjects</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
            <DialogDescription>Configure subject details and marking scheme</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subject Name *</Label>
                <Input className="mt-1" value={form.name} onChange={e => uf('name', e.target.value)} placeholder="e.g. Mathematics" />
              </div>
              <div>
                <Label>Code *</Label>
                <Input className="mt-1" value={form.code} onChange={e => uf('code', e.target.value.toUpperCase())} placeholder="e.g. MATH-01" />
              </div>
            </div>
            <div>
              <Label>Subject Type</Label>
              <Select value={form.subjectType} onValueChange={v => uf('subjectType', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Theory', 'Practical', 'Both'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Max Marks</Label>
                <Input className="mt-1" type="number" value={form.maxMarks} onChange={e => uf('maxMarks', e.target.value)} />
              </div>
              <div>
                <Label>Pass Marks</Label>
                <Input className="mt-1" type="number" value={form.passMarks} onChange={e => uf('passMarks', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer card-hover">
                <input type="checkbox" checked={form.isCore} onChange={e => uf('isCore', e.target.checked)} className="rounded" />
                Core Subject
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer card-hover">
                <input type="checkbox" checked={form.isOptional} onChange={e => uf('isOptional', e.target.checked)} className="rounded" />
                Optional
              </label>
            </div>
            <div>
              <Label>Description</Label>
              <Input className="mt-1" value={form.description} onChange={e => uf('description', e.target.value)} placeholder="Brief description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editItem ? 'Update' : 'Create'} Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Subject?</DialogTitle><DialogDescription>This will remove the subject and all class assignments. Cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
