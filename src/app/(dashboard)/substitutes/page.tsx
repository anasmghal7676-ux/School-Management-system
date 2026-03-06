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
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Plus, Users, RefreshCw, Calendar, CheckCircle2,
  Clock, XCircle, ChevronLeft, ChevronRight, Trash2, BookOpen,
  AlertCircle, UserCheck,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  Pending:   { color: 'bg-amber-100 text-amber-700 border-amber-200',  icon: Clock },
  Confirmed: { color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle2 },
  Cancelled: { color: 'bg-red-100 text-red-700 border-red-200',        icon: XCircle },
};

const PERIODS = Array.from({ length: 10 }, (_, i) => i + 1);

const EMPTY = {
  date: today(), absentTeacherId: '', substituteId: '', classId: '',
  sectionId: '', subjectId: '', period: '', reason: '', notes: '',
};

export default function SubstitutionsPage() {
  const [data, setData]         = useState<any>(null);
  const [staff, setStaff]       = useState<any[]>([]);
  const [classes, setClasses]   = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [addOpen, setAddOpen]   = useState(false);
  const [form, setForm]         = useState<any>({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [dateFilter, setDateFilter] = useState(today());
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]         = useState(1);

  useEffect(() => { fetchData(); }, [dateFilter, statusFilter, page]);
  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { if (form.classId) fetchSections(form.classId); }, [form.classId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (dateFilter)   params.set('date', dateFilter);
      if (statusFilter) params.set('status', statusFilter);
      const r = await fetch(`/api/substitutes?${params}`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally { setLoading(false); }
  }, [dateFilter, statusFilter, page]);

  const fetchMeta = async () => {
    const [sr, cr, subr] = await Promise.all([
      fetch('/api/staff?limit=200').then(r => r.json()),
      fetch('/api/classes?limit=50').then(r => r.json()),
      fetch('/api/subjects?limit=100').then(r => r.json()),
    ]);
    if (sr.success)   setStaff(sr.data?.staff || sr.data || []);
    if (cr.success)   setClasses(cr.data?.classes || cr.data || []);
    if (subr.success) setSubjects(subr.data?.subjects || subr.data || []);
  };

  const fetchSections = async (classId: string) => {
    const r = await fetch(`/api/sections?classId=${classId}&limit=20`);
    const j = await r.json();
    if (j.success) setSections(j.data?.sections || j.data || []);
  };

  const handleAdd = async () => {
    if (!form.absentTeacherId || !form.substituteId || !form.classId) {
      toast({ title: 'Absent teacher, substitute and class are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/substitutes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Substitution assigned', description: `${j.data.substitute?.fullName} will cover for ${j.data.absentTeacher?.fullName}` });
        setAddOpen(false); setForm({ ...EMPTY }); fetchData();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/substitutes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    toast({ title: `Substitution ${status.toLowerCase()}` });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/substitutes/${id}`, { method: 'DELETE' });
    toast({ title: 'Substitution removed' }); fetchData();
  };

  const summary = data?.summary || {};
  const subs    = data?.substitutions || [];
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <UserCheck className="h-7 w-7" />Substitution Management
            </h1>
            <p className="text-muted-foreground">Assign substitute teachers when staff is absent</p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Assign Substitute
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Today's Substitutions", value: summary.today   || 0, icon: Calendar,      color: 'border-l-blue-500',  text: 'text-blue-600' },
            { label: 'Pending Confirmation',  value: summary.pending  || 0, icon: Clock,         color: 'border-l-amber-500', text: 'text-amber-600' },
            { label: 'Confirmed',             value: summary.confirmed|| 0, icon: CheckCircle2,  color: 'border-l-green-500', text: 'text-green-600' },
          ].map(({ label, value, icon: Icon, color, text }) => (
            <Card key={label} className={`border-l-4 ${color}`}>
              <CardContent className="pt-4 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${text}`}>{value}</p>
                </div>
                <Icon className={`h-5 w-5 ${text}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3">
              <div>
                <Label className="text-xs mb-1 block">Date</Label>
                <Input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} className="w-40" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Status</Label>
                <Select value={statusFilter || 'all'} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="self-end" onClick={() => fetchData()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : subs.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <UserCheck className="h-12 w-12 mb-3 opacity-20" />
                <p className="font-medium">No substitutions found</p>
                <p className="text-sm mt-1">Assign a substitute teacher when staff is absent</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Absent Teacher</TableHead>
                      <TableHead>Substitute</TableHead>
                      <TableHead>Class / Section</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subs.map((s: any) => {
                      const cfg  = STATUS_CONFIG[s.status] || STATUS_CONFIG.Pending;
                      const Icon = cfg.icon;
                      return (
                        <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="text-sm font-medium">{fmtDate(s.date)}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{s.absentTeacher?.fullName}</div>
                            <div className="text-xs text-muted-foreground">{s.absentTeacher?.designation}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-green-700">{s.substitute?.fullName}</div>
                            <div className="text-xs text-muted-foreground">{s.substitute?.designation}</div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm">{s.class?.name}</span>
                            {s.section && <span className="text-xs text-muted-foreground ml-1">— {s.section.name}</span>}
                          </TableCell>
                          <TableCell>{s.period ? `P${s.period}` : <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-32 truncate">{s.reason || '—'}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                              <Icon className="h-3 w-3" />{s.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {s.status === 'Pending' && (
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600 hover:text-green-700"
                                  onClick={() => updateStatus(s.id, 'Confirmed')}>
                                  Confirm
                                </Button>
                              )}
                              {s.status !== 'Cancelled' && (
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700"
                                  onClick={() => updateStatus(s.id, 'Cancelled')}>
                                  Cancel
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600"
                                onClick={() => handleDelete(s.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center px-4 py-3 border-t">
                    <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
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

        {/* Add Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign Substitute Teacher</DialogTitle>
              <DialogDescription>Fill in the substitution details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Absent Teacher *</Label>
                <Select value={form.absentTeacherId} onValueChange={v => setForm({ ...form, absentTeacherId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select absent teacher..." /></SelectTrigger>
                  <SelectContent>
                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.employeeCode})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Substitute Teacher *</Label>
                <Select value={form.substituteId} onValueChange={v => setForm({ ...form, substituteId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select substitute..." /></SelectTrigger>
                  <SelectContent>
                    {staff.filter(s => s.id !== form.absentTeacherId).map(s =>
                      <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.employeeCode})</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Class *</Label>
                  <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v, sectionId: '' })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Class..." /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section</Label>
                  <Select value={form.sectionId || 'all'} onValueChange={v => setForm({ ...form, sectionId: v === 'all' ? '' : v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Section..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Period</Label>
                  <Select value={form.period || 'none'} onValueChange={v => setForm({ ...form, period: v === 'none' ? '' : v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Period..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Periods</SelectItem>
                      {PERIODS.map(p => <SelectItem key={p} value={String(p)}>Period {p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Select value={form.subjectId || 'none'} onValueChange={v => setForm({ ...form, subjectId: v === 'none' ? '' : v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Subject..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any Subject</SelectItem>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Reason for Absence</Label>
                <Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Sick leave, personal emergency..." className="mt-1" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional instructions..." rows={2} className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                Assign Substitute
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
