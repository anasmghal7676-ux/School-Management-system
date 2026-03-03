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
  Loader2, Plus, Star, AlertTriangle, ThumbsUp, ThumbsDown,
  ChevronLeft, ChevronRight, Trash2, RefreshCw, Search,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const INCIDENT_TYPES = [
  { key: 'Good',         label: 'Good Behavior',  icon: ThumbsUp,   color: 'bg-green-100 text-green-800',  badge: 'bg-green-100 text-green-700' },
  { key: 'Appreciation', label: 'Appreciation',   icon: Star,        color: 'bg-blue-100 text-blue-800',   badge: 'bg-blue-100 text-blue-700' },
  { key: 'Warning',      label: 'Warning',        icon: AlertTriangle, color: 'bg-amber-100 text-amber-800', badge: 'bg-amber-100 text-amber-700' },
  { key: 'Bad',          label: 'Misconduct',     icon: ThumbsDown, color: 'bg-red-100 text-red-800',     badge: 'bg-red-100 text-red-700' },
];

const EMPTY_FORM = {
  studentId: '', incidentType: 'Good', incidentDate: new Date().toISOString().slice(0, 10),
  description: '', actionTaken: '', reportedBy: '',
};

export default function BehaviorPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});

  const [classFilter, setClassFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchIn, setSearchIn] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClasses(); fetchStudents(); }, []);
  useEffect(() => { const t = setTimeout(() => setSearch(searchIn), 400); return () => clearTimeout(t); }, [searchIn]);
  useEffect(() => { fetchLogs(); }, [classFilter, typeFilter, page]);

  const fetchClasses = async () => { const r = await fetch('/api/classes?limit=100'); const j = await r.json(); if (j.success) setClasses(j.data?.classes || j.data || []); };
  const fetchStudents = async () => { const r = await fetch('/api/students?limit=500&status=active'); const j = await r.json(); if (j.success) setStudents(j.data?.students || j.data || []); };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '25' });
      if (classFilter !== 'all') p.append('classId', classFilter);
      if (typeFilter  !== 'all') p.append('type',    typeFilter);
      const r = await fetch(`/api/behavior?${p}`);
      const j = await r.json();
      if (j.success) {
        setLogs(j.data.logs);
        setTypeCounts(j.data.typeCounts || {});
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [classFilter, typeFilter, page]);

  const handleAdd = async () => {
    if (!form.studentId || !form.description || !form.reportedBy) {
      toast({ title: 'Required', description: 'Student, description and reporter required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/behavior', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) { toast({ title: 'Log added' }); setAddOpen(false); setForm(EMPTY_FORM); setSelectedStudent(null); setStudentSearch(''); fetchLogs(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/behavior/${deleteId}`, { method: 'DELETE' });
      toast({ title: 'Deleted' }); setDeleteId(null); fetchLogs();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const getType = (key: string) => INCIDENT_TYPES.find(t => t.key === key) || INCIDENT_TYPES[0];
  const uf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.admissionNumber.includes(studentSearch)
  ).slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Behavior Log</h1>
            <p className="text-muted-foreground">Track student conduct, good behavior, warnings and incidents</p>
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setSelectedStudent(null); setStudentSearch(''); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Log Entry
          </Button>
        </div>

        {/* Type stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {INCIDENT_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => { setTypeFilter(typeFilter === t.key ? 'all' : t.key); setPage(1); }}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${typeFilter === t.key ? 'border-current' : 'border-transparent'} ${t.color}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <span className="text-2xl font-black">{typeCounts[t.key] || 0}</span>
                </div>
                <p className="text-sm font-semibold mt-1">{t.label}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={classFilter} onValueChange={v => { setClassFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
              : logs.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <Star className="h-12 w-12 mb-4" />
                  <p className="font-medium">No behavior logs recorded</p>
                  <Button className="mt-4" onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add First Entry</Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead>
                        <TableHead>Type</TableHead><TableHead>Incident</TableHead>
                        <TableHead>Action Taken</TableHead><TableHead>Reported By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log: any) => {
                        const t = getType(log.incidentType);
                        return (
                          <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="text-sm whitespace-nowrap">{fmtDate(log.incidentDate)}</TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">{log.student?.fullName}</div>
                              <div className="text-xs text-muted-foreground">{log.student?.admissionNumber}</div>
                            </TableCell>
                            <TableCell className="text-sm">{log.student?.class?.name || '—'}</TableCell>
                            <TableCell>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.badge}`}>
                                {t.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm max-w-xs truncate">{log.description}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{log.actionTaken || '—'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{log.reportedBy}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteId(log.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Behavior Log Entry</DialogTitle><DialogDescription>Record a student behavior incident or commendation</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Student *</Label>
              <Input className="mt-1" placeholder="Search student..." value={studentSearch} onChange={e => { setStudentSearch(e.target.value); if (!e.target.value) { setSelectedStudent(null); setForm(f => ({ ...f, studentId: '' })); } }} />
              {studentSearch && !selectedStudent && filteredStudents.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto bg-background shadow-md mt-1">
                  {filteredStudents.map(s => (
                    <button key={s.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setSelectedStudent(s); setStudentSearch(`${s.fullName} (${s.admissionNumber})`); setForm(f => ({ ...f, studentId: s.id })); }}>
                      <span className="font-medium">{s.fullName}</span>
                      <span className="text-muted-foreground ml-2">{s.admissionNumber}</span>
                      {s.class && <span className="text-muted-foreground ml-2">· {s.class.name}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Incident Type *</Label>
                <Select value={form.incidentType} onValueChange={v => uf('incidentType', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{INCIDENT_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input className="mt-1" type="date" value={form.incidentDate} onChange={e => uf('incidentDate', e.target.value)} /></div>
            </div>
            <div>
              <Label>Description *</Label>
              <textarea className="mt-1 w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={form.description} onChange={e => uf('description', e.target.value)} placeholder="Describe the incident or commendation..." />
            </div>
            <div><Label>Action Taken</Label><Input className="mt-1" value={form.actionTaken} onChange={e => uf('actionTaken', e.target.value)} placeholder="Optional — warning issued, merit points, etc." /></div>
            <div><Label>Reported By *</Label><Input className="mt-1" value={form.reportedBy} onChange={e => uf('reportedBy', e.target.value)} placeholder="Teacher or staff name" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Log Entry?</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
