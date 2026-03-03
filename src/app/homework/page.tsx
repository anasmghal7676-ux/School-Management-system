'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Plus, BookOpen, Clock, CheckCircle2,
  AlertTriangle, Eye, Trash2, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

interface Homework {
  id: string; title: string; description: string | null; classId: string; sectionId: string | null;
  subjectId: string | null; assignedBy: string; homeworkDate: string; submissionDate: string;
  totalMarks: number | null; isOverdue: boolean;
  class: { name: string }; section: { name: string } | null;
  subject: { name: string } | null; _count: { submissions: number };
}

const EMPTY_FORM = {
  classId: '', sectionId: '', subjectId: '', assignedBy: '',
  homeworkDate: new Date().toISOString().slice(0, 10),
  submissionDate: '', title: '', description: '', totalMarks: '',
};

export default function HomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [filtSections, setFiltSections] = useState<any[]>([]);

  const [classFilter, setClassFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClasses(); fetchAllSections(); fetchSubjects(); }, []);
  useEffect(() => {
    setFiltSections(form.classId ? sections.filter(s => s.classId === form.classId) : []);
    setForm(f => ({ ...f, sectionId: '' }));
  }, [form.classId, sections]);
  useEffect(() => { fetchHomework(); }, [classFilter, page]);

  const fetchClasses = async () => { const r = await fetch('/api/classes?limit=100'); const j = await r.json(); if (j.success) setClasses(j.data?.classes || j.data || []); };
  const fetchAllSections = async () => { const r = await fetch('/api/sections?limit=200'); const j = await r.json(); if (j.success) setSections(j.data?.sections || j.data || []); };
  const fetchSubjects = async () => { const r = await fetch('/api/subjects?limit=100'); const j = await r.json(); if (j.success) setSubjects(j.data?.subjects || j.data || []); };

  const fetchHomework = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (classFilter !== 'all') p.append('classId', classFilter);
      const r = await fetch(`/api/homework?${p}`);
      const j = await r.json();
      if (j.success) {
        setHomeworks(j.data.homeworks);
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [classFilter, page]);

  const openDetail = async (id: string) => {
    setViewOpen(true);
    setDetailLoading(true);
    try {
      const r = await fetch(`/api/homework/${id}`);
      const j = await r.json();
      if (j.success) setDetail(j.data);
    } finally { setDetailLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.classId || !form.title || !form.submissionDate || !form.assignedBy) {
      toast({ title: 'Required fields missing', description: 'Class, title, submission date and assigned by are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/homework', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) { toast({ title: 'Homework assigned' }); setAddOpen(false); setForm(EMPTY_FORM); fetchHomework(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/homework/${deleteId}`, { method: 'DELETE' });
      toast({ title: 'Deleted' });
      setDeleteId(null);
      fetchHomework();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const uf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const daysLeft = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    return `${diff}d left`;
  };

  // Stats
  const overdueCount = homeworks.filter(h => h.isOverdue).length;
  const dueThisWeek = homeworks.filter(h => {
    const days = Math.ceil((new Date(h.submissionDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 7;
  }).length;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Homework</h1>
            <p className="text-muted-foreground">Assign and track homework submissions by class</p>
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Assign Homework
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Assignments', value: total, icon: BookOpen, color: 'border-l-blue-500', textColor: '' },
            { label: 'Due This Week', value: dueThisWeek, icon: Clock, color: 'border-l-amber-500', textColor: 'text-amber-600' },
            { label: 'Overdue', value: overdueCount, icon: AlertTriangle, color: 'border-l-red-500', textColor: 'text-red-600' },
          ].map(({ label, value, icon: Icon, color, textColor }) => (
            <Card key={label} className={`border-l-4 ${color}`}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={classFilter} onValueChange={v => { setClassFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchHomework} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : homeworks.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <BookOpen className="h-12 w-12 mb-4" />
                <p className="font-medium">No homework assigned yet</p>
                <Button className="mt-4" onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />Assign First Homework
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {homeworks.map(hw => (
                      <TableRow key={hw.id} className={hw.isOverdue ? 'bg-red-50/40 dark:bg-red-950/20' : ''}>
                        <TableCell>
                          <div className="font-medium">{hw.title}</div>
                          {hw.totalMarks && <div className="text-xs text-muted-foreground">Total: {hw.totalMarks} marks</div>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {hw.class.name}
                          {hw.section && <span className="text-muted-foreground"> / {hw.section.name}</span>}
                        </TableCell>
                        <TableCell className="text-sm">{hw.subject?.name || <span className="text-muted-foreground">General</span>}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(hw.homeworkDate)}</TableCell>
                        <TableCell className="text-sm">
                          <div className={hw.isOverdue ? 'text-red-600 font-medium' : ''}>
                            {fmtDate(hw.submissionDate)}
                          </div>
                          <div className={`text-xs ${hw.isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {daysLeft(hw.submissionDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {hw.isOverdue
                            ? <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            : <Badge variant="secondary" className="text-xs">Active</Badge>}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{hw._count.submissions}</span>
                          <span className="text-xs text-muted-foreground"> submitted</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(hw.id)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => setDeleteId(hw.id)}>
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

      {/* Assign Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Assign Homework</DialogTitle><DialogDescription>Create a new homework assignment for a class</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div><Label>Title *</Label><Input className="mt-1 col-span-2" value={form.title} onChange={e => uf('title', e.target.value)} placeholder="Homework title" /></div>
            <div>
              <Label>Class *</Label>
              <Select value={form.classId} onValueChange={v => uf('classId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Section</Label>
              <Select value={form.sectionId} onValueChange={v => uf('sectionId', v)} disabled={!form.classId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="All sections" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sections</SelectItem>
                  {filtSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={form.subjectId} onValueChange={v => uf('subjectId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="General" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Total Marks</Label><Input className="mt-1" type="number" value={form.totalMarks} onChange={e => uf('totalMarks', e.target.value)} placeholder="Optional" /></div>
            <div><Label>Assigned Date</Label><Input className="mt-1" type="date" value={form.homeworkDate} onChange={e => uf('homeworkDate', e.target.value)} /></div>
            <div><Label>Due Date *</Label><Input className="mt-1" type="date" value={form.submissionDate} onChange={e => uf('submissionDate', e.target.value)} /></div>
            <div className="col-span-2"><Label>Assigned By *</Label><Input className="mt-1" value={form.assignedBy} onChange={e => uf('assignedBy', e.target.value)} placeholder="Teacher name" /></div>
            <div className="col-span-2">
              <Label>Instructions</Label>
              <textarea
                className="mt-1 w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                value={form.description} onChange={e => uf('description', e.target.value)}
                placeholder="Homework instructions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={viewOpen} onOpenChange={() => { setViewOpen(false); setDetail(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
            <DialogDescription>
              {detail?.class?.name}{detail?.section ? ` / ${detail.section.name}` : ''} · Due {detail && new Date(detail.submissionDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
          ) : detail ? (
            <div className="space-y-4">
              {detail.description && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">{detail.description}</div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Submission Rate', `${detail.submissionRate}%`],
                  ['Submitted', `${detail.submittedCount} / ${detail.totalStudents}`],
                  ['Total Marks', detail.totalMarks || 'N/A'],
                ].map(([l, v]) => (
                  <div key={l} className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{v}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
              {detail.submissions?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Submissions</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.submissions.map((s: any) => (
                        <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="font-medium text-sm">{s.student.fullName}</div>
                            <div className="text-xs text-muted-foreground">{s.student.admissionNumber}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {s.submissionDate ? new Date(s.submissionDate).toLocaleDateString() : <span className="text-muted-foreground">Not submitted</span>}
                          </TableCell>
                          <TableCell className="text-sm">{s.marksObtained ?? '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.remarks || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewOpen(false); setDetail(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Homework?</DialogTitle><DialogDescription>This will also delete all submissions. Cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
