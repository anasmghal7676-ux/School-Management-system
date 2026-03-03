'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, UserCheck, Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, Clock, XCircle, FileCheck, Printer, ClipboardList,
  Users, AlertTriangle, ChevronDown, Check, X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const DEPARTMENTS = [
  'Accounts', 'Library', 'Hostel', 'Transport', 'Sports', 'IT / Lab', 'Administration',
];

const DEPT_ICONS: Record<string, string> = {
  'Accounts':      '💰',
  'Library':       '📚',
  'Hostel':        '🏠',
  'Transport':     '🚌',
  'Sports':        '⚽',
  'IT / Lab':      '💻',
  'Administration':'📋',
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  cleared:  { label: 'Cleared',  color: 'text-green-700', bg: 'bg-green-100 border-green-300', icon: CheckCircle2 },
  pending:  { label: 'Pending',  color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', icon: Clock },
  blocked:  { label: 'Blocked',  color: 'text-red-700',   bg: 'bg-red-100 border-red-300',     icon: XCircle },
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });

export default function StudentClearancePage() {
  const [students,    setStudents]    = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [search,      setSearch]      = useState('');
  const [statusFilt,  setStatusFilt]  = useState('');
  const [summary,     setSummary]     = useState<any>({});

  // Clearance form
  const [selected,    setSelected]    = useState<any>(null);
  const [formOpen,    setFormOpen]    = useState(false);
  const [deptStatus,  setDeptStatus]  = useState<Record<string, string>>({});
  const [remarks,     setRemarks]     = useState('');
  const [leavingDate, setLeavingDate] = useState('');
  const [reason,      setReason]      = useState('');

  // Print
  const [printOpen,   setPrintOpen]   = useState(false);
  const [printTarget, setPrintTarget] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchData(); }, [page, statusFilt]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (search)     p.set('search', search);
      if (statusFilt) p.set('status', statusFilt);
      const r = await fetch(`/api/clearance?${p}`);
      const j = await r.json();
      if (j.success) {
        setStudents(j.data.students || []);
        setDepartments(j.data.departments || DEPARTMENTS);
        setTotal(j.data.pagination?.total || 0);
        setSummary(j.data.summary || {});
      }
    } finally { setLoading(false); }
  }, [page, search, statusFilt]);

  const handleSearch = () => { setPage(1); fetchData(); };

  const openClearance = (student: any) => {
    setSelected(student);
    const existing = student.clearance?.departmentStatuses || {};
    const init: Record<string, string> = {};
    DEPARTMENTS.forEach(d => { init[d] = existing[d] || 'pending'; });
    setDeptStatus(init);
    setRemarks(student.clearance?.remarks || '');
    setLeavingDate(student.clearance?.leavingDate?.slice(0, 10) || '');
    setReason(student.clearance?.reason || '');
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const r = await fetch('/api/clearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId:         selected.id,
          departmentStatuses: deptStatus,
          remarks, leavingDate, reason,
        }),
      });
      const j = await r.json();
      if (j.success) {
        const isCleared = j.data.isFullyCleared;
        toast({ title: isCleared ? '✅ Student fully cleared!' : 'Clearance saved', description: selected.fullName });
        setFormOpen(false);
        fetchData();
      } else toast({ title: 'Save failed', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const clearAll    = () => { const s: Record<string, string> = {}; DEPARTMENTS.forEach(d => { s[d] = 'cleared'; }); setDeptStatus(s); };
  const pendingAll  = () => { const s: Record<string, string> = {}; DEPARTMENTS.forEach(d => { s[d] = 'pending'; }); setDeptStatus(s); };

  const openPrint = (student: any) => {
    setPrintTarget(student);
    setPrintOpen(true);
  };

  const doPrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Clearance Certificate</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #000; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #000; padding: 8px 12px; }
        th { background: #f0f0f0; font-weight: bold; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
        .cleared { color: green; font-weight: bold; }
        .blocked { color: red; font-weight: bold; }
        .pending { color: #b45309; }
        @media print { button { display: none; } }
      </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 200);
  };

  const getClearanceStats = (student: any) => {
    if (!student.clearance) return { cleared: 0, total: DEPARTMENTS.length, pct: 0 };
    const statuses = student.clearance.departmentStatuses || {};
    const cleared  = DEPARTMENTS.filter(d => statuses[d] === 'cleared').length;
    return { cleared, total: DEPARTMENTS.length, pct: Math.round((cleared / DEPARTMENTS.length) * 100) };
  };

  const getOverallStatus = (student: any) => {
    if (!student.clearance)              return 'no-request';
    if (student.clearance.isFullyCleared) return 'cleared';
    const statuses = Object.values(student.clearance.departmentStatuses || {});
    if (statuses.some(s => s === 'blocked')) return 'blocked';
    return 'in-progress';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-50"><FileCheck className="h-6 w-6 text-teal-600" /></span>
              Student Clearance
            </h1>
            <p className="text-muted-foreground mt-0.5">Manage student leaving clearances from all departments</p>
          </div>
        </div>

        {/* KPI */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Students',  val: summary.total     || 0, color: 'text-slate-700',  bg: 'bg-slate-50',  border: 'border-l-slate-400' },
            { label: 'Fully Cleared',   val: summary.cleared   || 0, color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-l-green-500' },
            { label: 'In Progress',     val: summary.pending   || 0, color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-l-amber-500' },
            { label: 'No Request',      val: summary.noRequest || 0, color: 'text-slate-500',  bg: 'bg-slate-50',  border: 'border-l-slate-300' },
          ].map(({ label, val, color, bg, border }) => (
            <Card key={label} className={`border-l-4 ${border}`}>
              <CardContent className={`pt-4 pb-3 ${bg}`}>
                <p className="text-xs text-muted-foreground">{label}</p>
                {loading
                  ? <div className="h-7 w-12 bg-muted animate-pulse rounded mt-1" />
                  : <p className={`text-3xl font-bold ${color} mt-0.5`}>{val}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-52">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student name or admission number…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilt || 'all'} onValueChange={v => { setStatusFilt(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="cleared">Fully Cleared</SelectItem>
                  <SelectItem value="pending">In Progress</SelectItem>
                  <SelectItem value="no-request">No Request</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={loading}><Search className="mr-2 h-4 w-4" />Search</Button>
              <Button variant="ghost" size="icon" onClick={() => fetchData()} disabled={loading}>
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
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 opacity-20 mb-3" />
                <p className="font-semibold">No students found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="pl-4">Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Departments</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Leaving Date</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(student => {
                      const stats      = getClearanceStats(student);
                      const overallSt  = getOverallStatus(student);
                      const cls = student.clearance;
                      return (
                        <TableRow key={student.id} className="hover:bg-muted/10">
                          <TableCell className="pl-4">
                            <div className="font-semibold text-sm">{student.fullName}</div>
                            <div className="text-xs text-muted-foreground">{student.admissionNumber}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {student.currentClass?.name || '—'}
                            {student.currentSection && <span className="text-muted-foreground"> · {student.currentSection.name}</span>}
                          </TableCell>
                          <TableCell>
                            {overallSt === 'cleared'
                              ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-300"><CheckCircle2 className="h-3 w-3" />Cleared</span>
                              : overallSt === 'in-progress'
                                ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-300"><Clock className="h-3 w-3" />In Progress</span>
                                : overallSt === 'blocked'
                                  ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-300"><XCircle className="h-3 w-3" />Blocked</span>
                                  : <span className="text-xs text-muted-foreground">No request</span>}
                          </TableCell>
                          <TableCell>
                            {cls ? (
                              <div className="flex flex-wrap gap-1">
                                {DEPARTMENTS.map(dept => {
                                  const st = cls.departmentStatuses?.[dept] || 'pending';
                                  return (
                                    <span key={dept} title={`${dept}: ${st}`}
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                        st === 'cleared' ? 'bg-green-100 text-green-700 border-green-300' :
                                        st === 'blocked' ? 'bg-red-100 text-red-700 border-red-300' :
                                        'bg-amber-100 text-amber-700 border-amber-300'
                                      }`}>
                                      {DEPT_ICONS[dept]}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-32">
                            {cls ? (
                              <div className="space-y-1">
                                <Progress value={stats.pct} className="h-2" />
                                <p className="text-xs text-muted-foreground">{stats.cleared}/{stats.total} depts</p>
                              </div>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {cls?.leavingDate ? fmtDate(cls.leavingDate) : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openClearance(student)}>
                                <ClipboardList className="h-3 w-3" />Manage
                              </Button>
                              {cls?.isFullyCleared && (
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openPrint(student)}>
                                  <Printer className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {Math.ceil(total / 20) > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <span className="text-xs text-muted-foreground">{((page-1)*20)+1}–{Math.min(page*20, total)} of {total}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" disabled={page >= Math.ceil(total/20)} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Clearance form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-teal-600" />Department Clearance</DialogTitle>
            <DialogDescription>{selected?.fullName} · {selected?.admissionNumber}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 py-2">
            {/* Quick action buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-green-600 border-green-300 hover:bg-green-50" onClick={clearAll}>
                <CheckCircle2 className="h-3.5 w-3.5" />Clear All
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50" onClick={pendingAll}>
                <Clock className="h-3.5 w-3.5" />Reset All
              </Button>
            </div>

            {/* Department status grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {DEPARTMENTS.map(dept => {
                const st  = deptStatus[dept] || 'pending';
                return (
                  <div key={dept} className={`rounded-xl border-2 p-3 transition-all ${
                    st === 'cleared' ? 'border-green-300 bg-green-50' :
                    st === 'blocked' ? 'border-red-300 bg-red-50' :
                    'border-border bg-muted/10'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm flex items-center gap-1.5">
                        <span>{DEPT_ICONS[dept]}</span>{dept}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {(['cleared', 'pending', 'blocked'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => setDeptStatus(s => ({ ...s, [dept]: status }))}
                          className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all capitalize ${
                            st === status
                              ? status === 'cleared' ? 'bg-green-500 text-white' :
                                status === 'blocked' ? 'bg-red-500 text-white' :
                                'bg-amber-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {status === 'cleared' ? '✓ Cleared' : status === 'blocked' ? '✗ Blocked' : '⏳ Pending'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Student info */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Leaving Date</Label>
                <Input type="date" value={leavingDate} onChange={e => setLeavingDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Reason for Leaving</Label>
                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Transfer, Graduation, etc." className="mt-1" />
              </div>
              <div className="sm:col-span-2">
                <Label>Remarks</Label>
                <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Additional notes for clearance…" rows={2} className="mt-1 resize-none" />
              </div>
            </div>

            {/* Status summary */}
            <div className={`rounded-xl p-3 text-sm font-medium flex items-center gap-2 ${
              DEPARTMENTS.every(d => deptStatus[d] === 'cleared')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : DEPARTMENTS.some(d => deptStatus[d] === 'blocked')
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}>
              {DEPARTMENTS.every(d => deptStatus[d] === 'cleared')
                ? <><CheckCircle2 className="h-4 w-4" />All departments cleared — student can receive clearance certificate</>
                : DEPARTMENTS.some(d => deptStatus[d] === 'blocked')
                  ? <><XCircle className="h-4 w-4" />Clearance blocked by one or more departments</>
                  : <><Clock className="h-4 w-4" />{DEPARTMENTS.filter(d => deptStatus[d] === 'cleared').length}/{DEPARTMENTS.length} departments cleared</>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
              Save Clearance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print certificate dialog */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Clearance Certificate Preview</DialogTitle>
            <DialogDescription>Print or save the clearance certificate</DialogDescription>
          </DialogHeader>
          {printTarget && (
            <div className="max-h-[60vh] overflow-y-auto">
              <div ref={printRef} className="p-6 bg-white border-2 border-gray-800 rounded-lg text-sm font-sans">
                <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                  <h1 className="text-2xl font-black uppercase tracking-widest">Student Clearance Certificate</h1>
                  <p className="text-muted-foreground mt-1">This is to certify that the following student has been cleared</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                  <div><span className="font-semibold">Student Name:</span> {printTarget.fullName}</div>
                  <div><span className="font-semibold">Admission No:</span> {printTarget.admissionNumber}</div>
                  <div><span className="font-semibold">Class:</span> {printTarget.currentClass?.name || '—'}</div>
                  <div><span className="font-semibold">Leaving Date:</span> {printTarget.clearance?.leavingDate ? fmtDate(printTarget.clearance.leavingDate) : '—'}</div>
                  <div><span className="font-semibold">Reason:</span> {printTarget.clearance?.reason || '—'}</div>
                  <div><span className="font-semibold">Date Issued:</span> {fmtDate(new Date().toISOString())}</div>
                </div>
                <table className="w-full border-collapse mb-4">
                  <thead>
                    <tr>
                      <th className="border border-gray-400 py-2 px-3 text-left bg-gray-100">Department</th>
                      <th className="border border-gray-400 py-2 px-3">Status</th>
                      <th className="border border-gray-400 py-2 px-3">Authorized By</th>
                      <th className="border border-gray-400 py-2 px-3">Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEPARTMENTS.map(dept => (
                      <tr key={dept}>
                        <td className="border border-gray-400 py-2 px-3">{DEPT_ICONS[dept]} {dept}</td>
                        <td className="border border-gray-400 py-2 px-3 text-center font-bold cleared">✓ Cleared</td>
                        <td className="border border-gray-400 py-2 px-3"> </td>
                        <td className="border border-gray-400 py-2 px-3"> </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {printTarget.clearance?.remarks && (
                  <p className="text-xs text-muted-foreground mb-4"><strong>Remarks:</strong> {printTarget.clearance.remarks}</p>
                )}
                <div className="grid grid-cols-3 gap-8 mt-8 pt-6 border-t">
                  {['Principal', 'Admin Officer', 'Date'].map(sig => (
                    <div key={sig} className="text-center">
                      <div className="border-b border-gray-600 mb-1 h-8" />
                      <p className="text-xs font-semibold">{sig}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintOpen(false)}>Close</Button>
            <Button onClick={doPrint} className="gap-2">
              <Printer className="h-4 w-4" />Print Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
