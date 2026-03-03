'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, BookOpen, CheckCircle2, Clock, RefreshCw, Star,
  FileText, Users, Edit, Download, TrendingUp, Award,
  BarChart3, Search, AlertCircle, XCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const isPast  = (d: string) => new Date(d) < new Date();

type StatusFilter = 'all' | 'submitted' | 'graded' | 'pending' | 'late';

const GRADE_RANGES = [
  { label: '90–100%', min: 90, max: 100, color: '#10b981' },
  { label: '75–89%',  min: 75, max: 89,  color: '#3b82f6' },
  { label: '60–74%',  min: 60, max: 74,  color: '#f59e0b' },
  { label: '40–59%',  min: 40, max: 59,  color: '#f97316' },
  { label: '0–39%',   min: 0,  max: 39,  color: '#ef4444' },
];

export default function SubmissionsPage() {
  const [homeworks,   setHomeworks]   = useState<any[]>([]);
  const [hwSearch,    setHwSearch]    = useState('');
  const [hwClass,     setHwClass]     = useState('');
  const [classes,     setClasses]     = useState<any[]>([]);
  const [selHW,       setSelHW]       = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [grading,     setGrading]     = useState<any>(null);
  const [gradeForm,   setGradeForm]   = useState({ marksObtained: '', evaluatedBy: '', remarks: '' });
  const [saving,      setSaving]      = useState(false);
  const [bulkGrades,  setBulkGrades]  = useState<Record<string, string>>({});
  const [bulkMode,    setBulkMode]    = useState(false);
  const [bulkSaving,  setBulkSaving]  = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [statusFilter, setStatusFilter]  = useState<StatusFilter>('all');

  useEffect(() => { fetchHomeworks(); fetchClasses(); }, []);
  useEffect(() => { if (selHW) { fetchSubmissions(); fetchStudents(); } }, [selHW, statusFilter]);

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=50');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchHomeworks = async () => {
    const params = new URLSearchParams({ limit: '100' });
    if (hwClass) params.set('classId', hwClass);
    const r = await fetch(`/api/homework?${params}`);
    const j = await r.json();
    if (j.success) {
      const list = j.data?.homeworks || j.data || [];
      setHomeworks(list);
      if (list.length > 0 && !selHW) setSelHW(list[0]);
    }
  };

  const fetchSubmissions = useCallback(async () => {
    if (!selHW) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/submissions?homeworkId=${selHW.id}&limit=200`);
      const j = await r.json();
      if (j.success) setSubmissions(j.data.submissions || []);
    } finally { setLoading(false); }
  }, [selHW]);

  const fetchStudents = async () => {
    if (!selHW?.classId) return;
    const r = await fetch(`/api/students?classId=${selHW.classId}&status=active&limit=200`);
    const j = await r.json();
    if (j.success) setAllStudents(j.data?.students || j.data || []);
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const submissionMap = Object.fromEntries(submissions.map(s => [s.studentId, s]));
  const submittedIds  = new Set(submissions.map(s => s.studentId));

  const allRows = allStudents.map(stu => ({
    student:    stu,
    submission: submissionMap[stu.id] || null,
  }));

  const pendingRows   = allRows.filter(r => !r.submission?.submissionDate);
  const submittedRows = allRows.filter(r => r.submission?.submissionDate && r.submission?.marksObtained == null);
  const gradedRows    = allRows.filter(r => r.submission?.marksObtained != null);
  const lateRows      = allRows.filter(r =>
    r.submission?.submissionDate && selHW?.submissionDate &&
    new Date(r.submission.submissionDate) > new Date(selHW.submissionDate)
  );

  const displayRows = statusFilter === 'pending' ? pendingRows
    : statusFilter === 'submitted' ? submittedRows
    : statusFilter === 'graded'    ? gradedRows
    : statusFilter === 'late'      ? lateRows
    : allRows;

  const total       = allStudents.length;
  const subCount    = submittedIds.size;
  const gradedCount = gradedRows.length;
  const subPct      = total > 0 ? Math.round((subCount / total) * 100) : 0;
  const gradedPct   = subCount > 0 ? Math.round((gradedCount / subCount) * 100) : 0;
  const avgMark     = gradedRows.length > 0
    ? (gradedRows.reduce((s, r) => s + (r.submission.marksObtained || 0), 0) / gradedRows.length).toFixed(1)
    : null;
  const avgPct = avgMark && selHW?.totalMarks
    ? ((parseFloat(avgMark) / selHW.totalMarks) * 100).toFixed(0)
    : null;
  const topScore = gradedRows.length > 0
    ? Math.max(...gradedRows.map(r => r.submission.marksObtained || 0))
    : null;

  const chartData = GRADE_RANGES.map(range => ({
    ...range,
    count: gradedRows.filter(r => {
      const pct = selHW?.totalMarks ? (r.submission.marksObtained / selHW.totalMarks) * 100 : 0;
      return pct >= range.min && pct <= range.max;
    }).length,
  }));

  // ── Actions ───────────────────────────────────────────────────────────────

  const openGrade = (row: any) => {
    const sub = row.submission;
    setGrading(row);
    setGradeForm({
      marksObtained: sub?.marksObtained != null ? String(sub.marksObtained) : '',
      evaluatedBy:   sub?.evaluatedBy || '',
      remarks:       sub?.remarks     || '',
    });
  };

  const handleGrade = async () => {
    if (!grading || !selHW) return;
    setSaving(true);
    try {
      const r = await fetch('/api/submissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeworkId:    selHW.id,
          studentId:     grading.student.id,
          submissionDate: grading.submission?.submissionDate || new Date().toISOString().slice(0, 10),
          marksObtained: gradeForm.marksObtained !== '' ? gradeForm.marksObtained : undefined,
          evaluatedBy:   gradeForm.evaluatedBy   || undefined,
          remarks:       gradeForm.remarks        || undefined,
        }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Grade saved', description: `${grading.student.fullName} — ${gradeForm.marksObtained}${selHW.totalMarks ? `/${selHW.totalMarks}` : ''} marks` });
        setGrading(null);
        fetchSubmissions();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleBulkSave = async () => {
    if (!selHW) return;
    const entries = Object.entries(bulkGrades).filter(([, v]) => v !== '');
    if (!entries.length) { toast({ title: 'No grades entered', variant: 'destructive' }); return; }
    setBulkSaving(true);
    let saved = 0;
    for (const [studentId, marks] of entries) {
      try {
        await fetch('/api/submissions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ homeworkId: selHW.id, studentId, submissionDate: new Date().toISOString().slice(0, 10), marksObtained: marks }),
        });
        saved++;
      } catch {}
    }
    toast({ title: `Saved ${saved} grades successfully` });
    setBulkGrades({});
    setBulkMode(false);
    setBulkSaving(false);
    fetchSubmissions();
  };

  const exportCSV = () => {
    const rows = [
      ['Roll No', 'Student Name', 'Admission No', 'Status', 'Submitted Date', 'Marks', 'Total Marks', '%', 'Remarks'],
      ...allRows.map(r => {
        const sub = r.submission;
        const pct = sub?.marksObtained != null && selHW?.totalMarks
          ? ((sub.marksObtained / selHW.totalMarks) * 100).toFixed(1) : '';
        return [
          r.student.rollNumber || '', r.student.fullName, r.student.admissionNumber,
          !sub ? 'Pending' : sub.marksObtained != null ? 'Graded' : 'Submitted',
          sub?.submissionDate ? fmtDate(sub.submissionDate) : '',
          sub?.marksObtained ?? '', selHW?.totalMarks || '', pct, sub?.remarks || '',
        ];
      }),
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `${selHW?.title || 'homework'}-submissions.csv`;
    a.click();
  };

  const filteredHW = homeworks.filter(hw =>
    (!hwSearch || hw.title.toLowerCase().includes(hwSearch.toLowerCase()) || hw.class?.name?.toLowerCase().includes(hwSearch.toLowerCase())) &&
    (!hwClass  || hw.classId === hwClass)
  );

  const STATUS_TABS: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all',       label: 'All',       count: total },
    { key: 'submitted', label: 'Submitted', count: submittedRows.length },
    { key: 'graded',    label: 'Graded',    count: gradedCount },
    { key: 'pending',   label: 'Pending',   count: pendingRows.length },
    { key: 'late',      label: 'Late',      count: lateRows.length },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />Homework Submissions
            </h1>
            <p className="text-muted-foreground mt-0.5">Track, grade and analyse student homework</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

          {/* ── Homework Sidebar ─────────────────────────────────────────── */}
          <aside className="space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search homework…" value={hwSearch} onChange={e => setHwSearch(e.target.value)} className="pl-8 h-9 text-sm" />
              </div>
              <Select value={hwClass || 'all'} onValueChange={v => { setHwClass(v === 'all' ? '' : v); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Filter by class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Card className="overflow-hidden">
              <CardHeader className="py-2 px-3 bg-muted/40 border-b">
                <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {filteredHW.length} Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[60vh] overflow-y-auto divide-y">
                {filteredHW.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No homework found</div>
                ) : filteredHW.map(hw => {
                  const isSelected = selHW?.id === hw.id;
                  const isOverdue  = isPast(hw.submissionDate);
                  const subCnt     = hw._count?.submissions || 0;
                  return (
                    <button key={hw.id} onClick={() => { setSelHW(hw); setStatusFilter('all'); setBulkMode(false); setBulkGrades({}); }}
                      className={`w-full text-left px-3 py-2.5 transition-colors ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'}`}>
                      <div className="font-semibold text-sm truncate">{hw.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{hw.class?.name} · {hw.subject?.name || 'General'}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>Due {fmtDate(hw.submissionDate)}</span>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${subCnt > 0 ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground'}`}>{subCnt}</span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          {/* ── Main Panel ───────────────────────────────────────────────── */}
          <div className="space-y-4">
            {!selHW ? (
              <Card className="bg-muted/20">
                <CardContent className="flex flex-col items-center py-24 text-muted-foreground">
                  <BookOpen className="h-16 w-16 mb-4 opacity-20" />
                  <p className="font-semibold text-lg">Select a homework assignment</p>
                  <p className="text-sm mt-1">Choose from the list on the left to manage submissions</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Info + KPIs */}
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold truncate">{selHW.title}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {selHW.class?.name}{selHW.subject && ` · ${selHW.subject.name}`}
                          {selHW.totalMarks && ` · ${selHW.totalMarks} marks`}
                          {' · Due: '}<span className={isPast(selHW.submissionDate) ? 'text-red-500 font-medium' : ''}>{fmtDate(selHW.submissionDate)}</span>
                        </p>
                        {selHW.description && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{selHW.description}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => setShowAnalytics(a => !a)}>
                          <BarChart3 className="mr-1.5 h-3.5 w-3.5" />{showAnalytics ? 'Hide' : 'Analytics'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportCSV}>
                          <Download className="mr-1.5 h-3.5 w-3.5" />Export CSV
                        </Button>
                        <Button variant={bulkMode ? 'default' : 'outline'} size="sm"
                          onClick={() => { setBulkMode(m => !m); setBulkGrades({}); }}>
                          <Edit className="mr-1.5 h-3.5 w-3.5" />{bulkMode ? 'Cancel Bulk' : 'Bulk Grade'}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {[
                        { label: 'Submitted', value: `${subCount}/${total}`, sub: `${subPct}%`, color: 'text-blue-600',   bg: 'bg-blue-50' },
                        { label: 'Graded',    value: `${gradedCount}/${subCount}`, sub: `${gradedPct}%`, color: 'text-green-600',  bg: 'bg-green-50' },
                        { label: 'Avg Score', value: avgMark ? `${avgMark}` : '—', sub: avgPct ? `${avgPct}%` : '', color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Top Score', value: topScore != null ? String(topScore) : '—', sub: selHW.totalMarks ? `/${selHW.totalMarks}` : '', color: 'text-amber-600',  bg: 'bg-amber-50' },
                      ].map(({ label, value, sub, color, bg }) => (
                        <div key={label} className={`${bg} rounded-xl px-3 py-2.5`}>
                          <div className="text-xs text-muted-foreground">{label}</div>
                          <div className={`text-xl font-bold ${color}`}>{value}</div>
                          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-24 text-muted-foreground text-right">Submission rate</span>
                        <Progress value={subPct} className="flex-1 h-2" />
                        <span className="w-10 font-semibold">{subPct}%</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-24 text-muted-foreground text-right">Graded rate</span>
                        <Progress value={gradedPct} className="flex-1 h-2" />
                        <span className="w-10 font-semibold">{gradedPct}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analytics */}
                {showAnalytics && gradedRows.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Score Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number) => [`${v} students`, 'Count']} />
                            <Bar dataKey="count" radius={[4,4,0,0]}>
                              {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="space-y-2.5">
                          {chartData.map(d => (
                            <div key={d.label} className="flex items-center gap-3 text-sm">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                              <span className="flex-1 text-muted-foreground">{d.label}</span>
                              <span className="font-semibold">{d.count} students</span>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {subCount > 0 ? `${Math.round((d.count / subCount) * 100)}%` : '0%'}
                              </span>
                            </div>
                          ))}
                          {gradedRows.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">🏆 Top Performers</p>
                              <div className="space-y-1">
                                {[...gradedRows]
                                  .sort((a, b) => (b.submission.marksObtained || 0) - (a.submission.marksObtained || 0))
                                  .slice(0, 4)
                                  .map((r, i) => (
                                    <div key={r.student.id} className="flex items-center gap-2 text-xs">
                                      <span className={`font-bold w-5 ${i === 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>{i + 1}.</span>
                                      <span className="flex-1 truncate">{r.student.fullName}</span>
                                      <span className="font-bold text-green-600">{r.submission.marksObtained}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Submissions Table */}
                <Card>
                  <CardHeader className="pb-0 pt-3 px-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex gap-1 flex-wrap">
                        {STATUS_TABS.map(tab => (
                          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${statusFilter === tab.key ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'hover:bg-muted/60 text-muted-foreground'}`}>
                            {tab.label}
                            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === tab.key ? 'bg-white/20' : 'bg-muted'}`}>{tab.count}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 items-center">
                        {bulkMode && (
                          <Button size="sm" className="h-8" onClick={handleBulkSave} disabled={bulkSaving}>
                            {bulkSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                            Save {Object.values(bulkGrades).filter(Boolean).length} Grades
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchSubmissions} disabled={loading}>
                          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 mt-2">
                    {loading ? (
                      <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
                    ) : displayRows.length === 0 ? (
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <BookOpen className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm">No {statusFilter !== 'all' ? statusFilter : ''} submissions</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="w-10 pl-4">#</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Roll</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>{bulkMode ? 'Enter Marks' : 'Marks'}</TableHead>
                            {selHW.totalMarks && <TableHead>%</TableHead>}
                            <TableHead>Remarks</TableHead>
                            <TableHead className="w-24">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayRows.map((row, idx) => {
                            const sub      = row.submission;
                            const isGraded = sub?.marksObtained != null;
                            const isLate   = sub?.submissionDate && selHW.submissionDate &&
                              new Date(sub.submissionDate) > new Date(selHW.submissionDate);
                            const pct      = isGraded && selHW.totalMarks
                              ? (sub.marksObtained / selHW.totalMarks) * 100 : null;
                            const pctColor = pct != null
                              ? pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'
                              : '';
                            return (
                              <TableRow key={row.student.id} className="hover:bg-muted/20">
                                <TableCell className="pl-4 text-xs text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell>
                                  <div className="font-medium text-sm">{row.student.fullName}</div>
                                  <div className="text-xs text-muted-foreground">{row.student.admissionNumber}</div>
                                </TableCell>
                                <TableCell className="text-xs font-mono text-muted-foreground">{row.student.rollNumber || '—'}</TableCell>
                                <TableCell>
                                  {!sub?.submissionDate ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                      <XCircle className="h-3 w-3" />Pending
                                    </span>
                                  ) : isGraded ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                      <CheckCircle2 className="h-3 w-3" />Graded
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                      <Clock className="h-3 w-3" />Submitted
                                    </span>
                                  )}
                                  {isLate && <span className="ml-1 text-[10px] font-semibold text-amber-600">(Late)</span>}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {sub?.submissionDate ? fmtDate(sub.submissionDate) : '—'}
                                </TableCell>
                                <TableCell>
                                  {bulkMode ? (
                                    <Input
                                      type="number" min={0} max={selHW.totalMarks || 100}
                                      value={bulkGrades[row.student.id] || (isGraded ? String(sub.marksObtained) : '')}
                                      onChange={e => setBulkGrades(g => ({ ...g, [row.student.id]: e.target.value }))}
                                      placeholder="0"
                                      className="h-7 w-20 text-xs"
                                    />
                                  ) : isGraded ? (
                                    <span className="font-bold text-sm">{sub.marksObtained}</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                {selHW.totalMarks && (
                                  <TableCell>
                                    {pct != null
                                      ? <span className={`font-semibold text-sm ${pctColor}`}>{pct.toFixed(0)}%</span>
                                      : '—'}
                                  </TableCell>
                                )}
                                <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                                  {sub?.remarks || '—'}
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openGrade(row)}>
                                    <Star className="mr-1 h-3 w-3" />{isGraded ? 'Edit' : 'Grade'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Grade Dialog */}
      <Dialog open={!!grading} onOpenChange={() => setGrading(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              {grading?.student?.fullName} — {selHW?.title}
              {selHW?.totalMarks && ` (out of ${selHW.totalMarks})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Marks Obtained *</Label>
              <Input
                type="number" min={0} max={selHW?.totalMarks || 100}
                value={gradeForm.marksObtained}
                onChange={e => setGradeForm(f => ({ ...f, marksObtained: e.target.value }))}
                placeholder={`0 – ${selHW?.totalMarks || 100}`}
                className="mt-1" autoFocus
              />
              {gradeForm.marksObtained && selHW?.totalMarks && (
                <p className="text-xs text-muted-foreground mt-1">
                  = {((parseFloat(gradeForm.marksObtained) / selHW.totalMarks) * 100).toFixed(1)}%
                </p>
              )}
            </div>
            <div>
              <Label>Evaluated By</Label>
              <Input value={gradeForm.evaluatedBy} onChange={e => setGradeForm(f => ({ ...f, evaluatedBy: e.target.value }))} placeholder="Teacher name…" className="mt-1" />
            </div>
            <div>
              <Label>Feedback / Remarks</Label>
              <Textarea value={gradeForm.remarks} onChange={e => setGradeForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Write feedback for the student…" rows={3} className="mt-1 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrading(null)}>Cancel</Button>
            <Button onClick={handleGrade} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Save Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
