'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, GraduationCap, Plus, Search, RefreshCw, Edit, Trash2,
  Award, Users, ChevronLeft, ChevronRight, CheckCircle2, Clock,
  DollarSign, BookOpen, Star, ArrowRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const TYPES     = ['Merit', 'Need-based', 'Sports', 'Government', 'Disability', 'Cultural', 'Other'];
const VAL_TYPES = ['Percentage', 'Fixed'];
const STATUS    = ['Open', 'Closed', 'Awarded'];

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtAmt  = (n: number) => `PKR ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

const TYPE_COLORS: Record<string, string> = {
  Merit:      'bg-blue-100 text-blue-700',
  'Need-based':'bg-amber-100 text-amber-700',
  Sports:     'bg-green-100 text-green-700',
  Government: 'bg-red-100 text-red-700',
  Disability: 'bg-purple-100 text-purple-700',
  Cultural:   'bg-teal-100 text-teal-700',
  Other:      'bg-gray-100 text-gray-600',
};

const BLANK_SCH = {
  name: '', type: 'Merit', valueType: 'Percentage', value: '',
  maxAmount: '', description: '', eligibility: '', academicYear: '',
  totalSlots: '', applicationDeadline: '',
};

const BLANK_AWARD = {
  studentId: '', startDate: new Date().toISOString().slice(0, 10),
  endDate: '', amountAwarded: '', awardedBy: '', remarks: '',
};

export default function ScholarshipsPage() {
  const [data,      setData]      = useState<any>(null);
  const [awards,    setAwards]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [page,      setPage]      = useState(1);
  const [awardPage, setAwardPage] = useState(1);
  const [tab,       setTab]       = useState<'scholarships' | 'awards'>('scholarships');
  const [statusFil, setStatusFil] = useState('');
  const [typeFil,   setTypeFil]   = useState('');
  const [addOpen,   setAddOpen]   = useState(false);
  const [awardOpen, setAwardOpen] = useState(false);
  const [selected,  setSelected]  = useState<any>(null);
  const [form,      setForm]      = useState<any>({ ...BLANK_SCH });
  const [awardForm, setAwardForm] = useState<any>({ ...BLANK_AWARD });
  const [saving,    setSaving]    = useState(false);
  const [students,  setStudents]  = useState<any[]>([]);

  useEffect(() => { fetchData(); }, [page, statusFil, typeFil]);
  useEffect(() => { if (tab === 'awards') fetchAwards(); }, [tab, awardPage]);
  useEffect(() => { fetchStudents(); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20', mode: 'scholarships' });
      if (statusFil) p.set('status', statusFil);
      if (typeFil)   p.set('type',   typeFil);
      const r = await fetch(`/api/scholarships?${p}`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally { setLoading(false); }
  }, [page, statusFil, typeFil]);

  const fetchAwards = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/scholarships?mode=awards&page=${awardPage}&limit=20`);
      const j = await r.json();
      if (j.success) setAwards(j.data.awards || []);
    } finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    const r = await fetch('/api/students?status=active&limit=300');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || j.data || []);
  };

  const saveScholarship = async () => {
    if (!form.name || !form.value) {
      toast({ title: 'Name and value are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/scholarships', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Scholarship created', description: j.data.name });
        setAddOpen(false);
        setForm({ ...BLANK_SCH });
        fetchData();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const saveAward = async () => {
    if (!awardForm.studentId || !awardForm.startDate || !awardForm.amountAwarded) {
      toast({ title: 'Student, start date, and amount are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/scholarships', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'award', scholarshipId: selected.id, ...awardForm }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Scholarship awarded', description: `${j.data.student?.fullName} — ${selected.name}` });
        setAwardOpen(false);
        setAwardForm({ ...BLANK_AWARD });
        fetchData();
        if (tab === 'awards') fetchAwards();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const deleteSch = async (id: string) => {
    await fetch(`/api/scholarships?id=${id}`, { method: 'DELETE' });
    toast({ title: 'Scholarship deleted' });
    fetchData();
  };

  const scholarships = data?.scholarships || [];
  const summary      = data?.summary      || {};
  const pagination   = data?.pagination   || {};

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-yellow-50"><GraduationCap className="h-6 w-6 text-yellow-600" /></span>
              Scholarship Management
            </h1>
            <p className="text-muted-foreground mt-0.5">Create and manage student scholarships and financial aid</p>
          </div>
          <Button onClick={() => { setForm({ ...BLANK_SCH }); setAddOpen(true); }} className="gap-2 bg-yellow-600 hover:bg-yellow-700">
            <Plus className="h-4 w-4" />New Scholarship
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Schemes',    val: summary.total       || 0, icon: BookOpen,      color: 'text-slate-600', bg: 'bg-slate-50',  border: 'border-l-slate-400' },
            { label: 'Open',             val: summary.open        || 0, icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-green-50',  border: 'border-l-green-500' },
            { label: 'Awarded',          val: summary.awarded     || 0, icon: Award,         color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-l-blue-500' },
            { label: 'Active Students',  val: summary.totalAwards || 0, icon: Users,         color: 'text-purple-600',bg: 'bg-purple-50', border: 'border-l-purple-500' },
          ].map(({ label, val, icon: Icon, color, bg, border }) => (
            <Card key={label} className={`border-l-4 ${border} overflow-hidden`}>
              <CardContent className={`pt-4 pb-3 ${bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {loading ? <div className="h-7 w-10 bg-muted animate-pulse rounded mt-1" /> :
                      <p className={`text-2xl font-bold ${color} mt-0.5`}>{val}</p>}
                  </div>
                  <Icon className={`h-7 w-7 ${color} opacity-40`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <div className="flex items-center gap-4 flex-wrap">
            <TabsList>
              <TabsTrigger value="scholarships" className="gap-1.5"><BookOpen className="h-4 w-4" />Scholarship Schemes</TabsTrigger>
              <TabsTrigger value="awards" className="gap-1.5"><Award className="h-4 w-4" />Awarded Students</TabsTrigger>
            </TabsList>
            {tab === 'scholarships' && (
              <div className="flex gap-2 ml-auto">
                <Select value={statusFil || 'all'} onValueChange={v => { setStatusFil(v === 'all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={typeFil || 'all'} onValueChange={v => { setTypeFil(v === 'all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* ── Scholarships Tab ─────────────────────────────────────── */}
          <TabsContent value="scholarships" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : scholarships.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-20 text-muted-foreground gap-3">
                  <GraduationCap className="h-12 w-12 opacity-20" />
                  <p className="font-semibold">No scholarships yet</p>
                  <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />Create First Scholarship
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {scholarships.map((sch: any) => {
                  const filled   = sch.filledSlots || 0;
                  const total    = sch.totalSlots;
                  const fillPct  = total ? Math.round((filled / total) * 100) : null;
                  const deadline = sch.applicationDeadline;
                  const isPast   = deadline && new Date(deadline) < new Date();
                  return (
                    <Card key={sch.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h3 className="font-bold text-base leading-snug">{sch.name}</h3>
                            {sch.academicYear && <p className="text-xs text-muted-foreground">{sch.academicYear}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              sch.status === 'Open' ? 'bg-green-100 text-green-700' :
                              sch.status === 'Awarded' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'}`}>
                              {sch.status}
                            </span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_COLORS[sch.type] || ''}`}>
                              {sch.type}
                            </span>
                          </div>
                        </div>

                        <div className="bg-muted/30 rounded-xl p-3 mb-3">
                          <div className="text-2xl font-bold text-blue-700">
                            {sch.valueType === 'Percentage' ? `${sch.value}%` : fmtAmt(sch.value)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {sch.valueType === 'Percentage' ? 'of total fees' : 'fixed amount'}
                            {sch.maxAmount && ` (max ${fmtAmt(sch.maxAmount)})`}
                          </div>
                        </div>

                        {sch.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{sch.description}</p>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />
                            {filled}{total ? `/${total}` : ''} students
                          </span>
                          {deadline && (
                            <span className={`flex items-center gap-1 ${isPast ? 'text-red-500' : ''}`}>
                              <Clock className="h-3 w-3" />
                              {isPast ? 'Deadline passed' : `Due ${fmtDate(deadline)}`}
                            </span>
                          )}
                        </div>

                        {total && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(fillPct || 0, 100)}%` }} />
                            </div>
                            <div className="text-[10px] text-right text-muted-foreground mt-0.5">{fillPct}% filled</div>
                          </div>
                        )}
                      </CardContent>
                      <div className="px-4 pb-3 flex gap-1 border-t pt-2">
                        {sch.status === 'Open' && (
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => { setSelected(sch); setAwardForm({ ...BLANK_AWARD }); setAwardOpen(true); }}>
                            <Award className="h-3.5 w-3.5" />Award
                          </Button>
                        )}
                        <div className="ml-auto flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteSch(sch.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">Page {page}/{pagination.totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" disabled={page>=pagination.totalPages} onClick={() => setPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Awards Tab ───────────────────────────────────────────── */}
          <TabsContent value="awards" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : awards.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-muted-foreground">
                    <Award className="h-10 w-10 opacity-20 mb-2" />
                    <p>No awards yet — award scholarships to students from the Schemes tab</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="pl-4">Student</TableHead>
                        <TableHead>Scholarship</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Awarded</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {awards.map((aw: any) => (
                        <TableRow key={aw.id} className="hover:bg-muted/20">
                          <TableCell className="pl-4">
                            <div className="font-semibold text-sm">{aw.student?.fullName}</div>
                            <div className="text-xs text-muted-foreground">{aw.student?.admissionNumber} · {aw.student?.currentClass?.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{aw.scholarship?.name}</div>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_COLORS[aw.scholarship?.type] || ''}`}>
                              {aw.scholarship?.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-700">{fmtAmt(aw.amountAwarded)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fmtDate(aw.awardedDate)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {fmtDate(aw.startDate)}{aw.endDate ? ` → ${fmtDate(aw.endDate)}` : ' (ongoing)'}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              aw.status === 'Active'  ? 'bg-green-100 text-green-700' :
                              aw.status === 'Expired' ? 'bg-gray-100 text-gray-600'  :
                              'bg-red-100 text-red-700'}`}>
                              {aw.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Scholarship Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setForm({ ...BLANK_SCH }); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-yellow-600" />New Scholarship Scheme</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <Label>Scholarship Name *</Label>
              <Input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Academic Excellence Award" className="mt-1" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm((f: any) => ({ ...f, type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Year</Label>
                <Input value={form.academicYear} onChange={e => setForm((f: any) => ({ ...f, academicYear: e.target.value }))} placeholder="2024-25" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Value Type</Label>
                <Select value={form.valueType} onValueChange={v => setForm((f: any) => ({ ...f, valueType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{VAL_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value *</Label>
                <Input type="number" value={form.value} onChange={e => setForm((f: any) => ({ ...f, value: e.target.value }))}
                  placeholder={form.valueType === 'Percentage' ? '50' : '10000'} className="mt-1" />
              </div>
              {form.valueType === 'Percentage' && (
                <div>
                  <Label>Max Amount</Label>
                  <Input type="number" value={form.maxAmount} onChange={e => setForm((f: any) => ({ ...f, maxAmount: e.target.value }))} placeholder="Cap (PKR)" className="mt-1" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Total Slots</Label>
                <Input type="number" value={form.totalSlots} onChange={e => setForm((f: any) => ({ ...f, totalSlots: e.target.value }))} placeholder="Leave empty for unlimited" className="mt-1" />
              </div>
              <div>
                <Label>Application Deadline</Label>
                <Input type="date" value={form.applicationDeadline} onChange={e => setForm((f: any) => ({ ...f, applicationDeadline: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Eligibility Criteria</Label>
              <Textarea value={form.eligibility} onChange={e => setForm((f: any) => ({ ...f, eligibility: e.target.value }))} placeholder="Who qualifies for this scholarship…" rows={2} className="mt-1 resize-none" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} placeholder="Additional details…" rows={2} className="mt-1 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={saveScholarship} disabled={saving} className="bg-yellow-600 hover:bg-yellow-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
              Create Scholarship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Dialog */}
      <Dialog open={awardOpen} onOpenChange={v => { setAwardOpen(v); if (!v) setAwardForm({ ...BLANK_AWARD }); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-blue-600" />Award Scholarship</DialogTitle>
            <DialogDescription>{selected?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Student *</Label>
              <Select value={awardForm.studentId} onValueChange={v => setAwardForm((f: any) => ({ ...f, studentId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select student…" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.currentClass?.name || '—'})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={awardForm.startDate} onChange={e => setAwardForm((f: any) => ({ ...f, startDate: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={awardForm.endDate} onChange={e => setAwardForm((f: any) => ({ ...f, endDate: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount Awarded (PKR) *</Label>
                <Input type="number" value={awardForm.amountAwarded} onChange={e => setAwardForm((f: any) => ({ ...f, amountAwarded: e.target.value }))}
                  placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label>Awarded By</Label>
                <Input value={awardForm.awardedBy} onChange={e => setAwardForm((f: any) => ({ ...f, awardedBy: e.target.value }))} placeholder="Principal…" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea value={awardForm.remarks} onChange={e => setAwardForm((f: any) => ({ ...f, remarks: e.target.value }))} rows={2} className="mt-1 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardOpen(false)}>Cancel</Button>
            <Button onClick={saveAward} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Award className="mr-2 h-4 w-4" />}
              Award Scholarship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
