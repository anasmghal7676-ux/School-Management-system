'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, FileText, Trash2, RefreshCw, Search, ChevronLeft, ChevronRight, Download, File } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const DOC_TYPES = [
  'Birth Certificate', 'B-Form', 'CNIC', 'Transfer Certificate',
  'Report Card', 'Character Certificate', 'Medical Certificate',
  'Fee Receipt', 'Admission Form', 'Photographs', 'Other',
];

const DOC_ICONS: Record<string, string> = {
  'Birth Certificate': '🏥', 'B-Form': '📋', 'CNIC': '🪪',
  'Transfer Certificate': '📜', 'Report Card': '📊',
  'Character Certificate': '⭐', 'Medical Certificate': '💊',
  'Fee Receipt': '💰', 'Admission Form': '📝', 'Photographs': '📷', 'Other': '📄',
};

const TYPE_COLORS: Record<string, string> = {
  'Birth Certificate': 'bg-blue-100 text-blue-700',
  'B-Form':            'bg-teal-100 text-teal-700',
  'CNIC':              'bg-purple-100 text-purple-700',
  'Transfer Certificate': 'bg-amber-100 text-amber-700',
  'Report Card':       'bg-green-100 text-green-700',
  'Character Certificate': 'bg-pink-100 text-pink-700',
  'Other':             'bg-gray-100 text-gray-600',
};

const EMPTY = { studentId: '', documentType: 'Birth Certificate', fileName: '', uploadedBy: '' };

const fmtDate  = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtSize  = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export default function DocumentsPage() {
  const [docs, setDocs]             = useState<any[]>([]);
  const [students, setStudents]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});

  const [addOpen, setAddOpen]       = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [form, setForm]             = useState<any>({ ...EMPTY });
  const [saving, setSaving]         = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { fetchDocs(); }, [search, typeFilter, page]);

  const fetchStudents = async () => {
    const r = await fetch('/api/students?limit=500&status=active');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || j.data || []);
  };

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '25' });
      if (search)     p.append('search', search);
      if (typeFilter !== 'all') p.append('documentType', typeFilter);
      const r = await fetch(`/api/documents?${p}`);
      const j = await r.json();
      if (j.success) {
        setDocs(j.data.documents);
        setTypeCounts(j.data.typeCounts || {});
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, typeFilter, page]);

  const handleSave = async () => {
    if (!form.studentId || !form.documentType || !form.fileName) {
      toast({ title: 'Student, type and file name required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Document record added' });
        setAddOpen(false); setForm({ ...EMPTY }); setSelectedStudent(null); setStudentSearch(''); fetchDocs();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/documents/${deleteId}`, { method: 'DELETE' });
    toast({ title: 'Deleted' }); setDeleteId(null); fetchDocs();
  };

  const uf = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) || s.admissionNumber.includes(studentSearch)
  ).slice(0, 8);

  const topTypes = Object.entries(typeCounts).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><FileText className="h-7 w-7" />Student Documents</h1>
            <p className="text-muted-foreground">Track and manage student document records</p>
          </div>
          <Button onClick={() => { setForm({ ...EMPTY }); setSelectedStudent(null); setStudentSearch(''); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Record
          </Button>
        </div>

        {/* Type breakdown */}
        <div className="grid gap-3 sm:grid-cols-5">
          {topTypes.map(([type, count]) => (
            <Card
              key={type}
              className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${typeFilter === type ? 'border-l-primary' : 'border-l-transparent'}`}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
            >
              <CardContent className="pt-3 pb-3 text-center">
                <div className="text-2xl mb-1">{DOC_ICONS[type] || '📄'}</div>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs text-muted-foreground leading-tight">{type}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search student or file..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{DOC_ICONS[t]} {t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchDocs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-30" />
                <p className="font-medium">No documents found</p>
                <Button className="mt-4" onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add First Record</Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {docs.map((d: any) => (
                      <TableRow key={d.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="font-medium text-sm">{d.student?.fullName || d.studentId}</div>
                          <div className="text-xs text-muted-foreground">{d.student?.admissionNumber} · {d.student?.class?.name}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[d.documentType] || 'bg-gray-100 text-gray-600'}`}>
                            {DOC_ICONS[d.documentType]} {d.documentType}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate max-w-40">{d.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtSize(d.fileSize)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(d.uploadDate)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.uploadedBy || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Download">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteId(d.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} total</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Document Record</DialogTitle>
            <DialogDescription>Register a document in the student's file</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Student *</Label>
              <Input
                className="mt-1" placeholder="Search student..."
                value={studentSearch}
                onChange={e => { setStudentSearch(e.target.value); if (!e.target.value) { setSelectedStudent(null); uf('studentId', ''); } }}
              />
              {studentSearch && !selectedStudent && filteredStudents.length > 0 && (
                <div className="border rounded-md mt-1 max-h-36 overflow-y-auto bg-background shadow-md">
                  {filteredStudents.map(s => (
                    <button key={s.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setSelectedStudent(s); setStudentSearch(`${s.fullName} (${s.admissionNumber})`); uf('studentId', s.id); }}>
                      <span className="font-medium">{s.fullName}</span>
                      <span className="text-muted-foreground ml-2">{s.admissionNumber}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Document Type *</Label>
              <Select value={form.documentType} onValueChange={v => uf('documentType', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{DOC_ICONS[t]} {t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>File Name *</Label>
              <Input className="mt-1" value={form.fileName} onChange={e => uf('fileName', e.target.value)} placeholder="e.g. birth_certificate.pdf" />
            </div>
            <div>
              <Label>Uploaded By</Label>
              <Input className="mt-1" value={form.uploadedBy} onChange={e => uf('uploadedBy', e.target.value)} placeholder="Staff name or system" />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p>📌 In production, this form would include a file upload. Currently logging document metadata records only.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Document Record?</DialogTitle><DialogDescription>The database record will be removed. Physical files are not affected.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
