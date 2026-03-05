'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, Globe, Eye, EyeOff, CheckCircle2, XCircle,
  BarChart3, Users, Award, TrendingDown, RefreshCw,
  BookOpen, Search, ArrowUpRight, Lock, Unlock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

const GRADE_RANGES = [
  { label: 'A+ (90–100)', min: 90, max: 100, color: '#10b981', grade: 'A+' },
  { label: 'A  (80–89)',  min: 80, max: 89,  color: '#3b82f6', grade: 'A'  },
  { label: 'B  (70–79)',  min: 70, max: 79,  color: '#8b5cf6', grade: 'B'  },
  { label: 'C  (60–69)',  min: 60, max: 69,  color: '#f59e0b', grade: 'C'  },
  { label: 'D  (50–59)',  min: 50, max: 59,  color: '#f97316', grade: 'D'  },
  { label: 'F  (0–49)',   min: 0,  max: 49,  color: '#ef4444', grade: 'F'  },
];

function getGrade(score: number, max: number): string {
  const pct = (score / max) * 100;
  return GRADE_RANGES.find(r => pct >= r.min && pct <= r.max)?.grade || 'F';
}

export default function ResultPublishingPage() {
  const [exams,       setExams]       = useState<any[]>([]);
  const [selected,    setSelected]    = useState<any>(null);
  const [examResults, setExamResults] = useState<any>(null);
  const [loading,     setLoading]     = useState(false);
  const [resLoading,  setResLoading]  = useState(false);
  const [publishing,  setPublishing]  = useState<string | null>(null);
  const [search,      setSearch]      = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes,     setClasses]     = useState<any[]>([]);

  useEffect(() => { fetchExams(); fetchClasses(); }, []);
  useEffect(() => { if (selected) fetchResults(selected.id); }, [selected]);

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=50');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (classFilter) p.set('classId', classFilter);
      const r = await fetch(`/api/results?${p}`);
      const j = await r.json();
      if (j.success) {
        setExams(j.data.exams || []);
        if (!selected && (j.data.exams || []).length > 0) setSelected(j.data.exams[0]);
      }
    } finally { setLoading(false); }
  }, [classFilter]);

  const fetchResults = async (examId: string) => {
    setResLoading(true);
    try {
      const r = await fetch(`/api/results?examId=${examId}`);
      const j = await r.json();
      if (j.success) setExamResults(j.data.examResults);
    } finally { setResLoading(false); }
  };

  const togglePublish = async (exam: any) => {
    const newState = !exam.isPublished;
    setPublishing(exam.id);
    try {
      const r = await fetch('/api/results', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: exam.id, publish: newState }),
      });
      const j = await r.json();
      if (j.success) {
        toast({
          title: newState ? 'Results Published' : 'Results Unpublished',
          description: `${exam.class?.name} — ${exam.subject?.name}`,
        });
        setExams(prev => prev.map(e => e.id === exam.id ? { ...e, isPublished: newState } : e));
        if (selected?.id === exam.id) setSelected((s: any) => ({ ...s, isPublished: newState }));
      } else toast({ title: 'Failed to update', variant: 'destructive' });
    } finally { setPublishing(null); }
  };

  // Filtered exams
  const filteredExams = exams.filter(e =>
    (!search || e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.class?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.subject?.name?.toLowerCase().includes(search.toLowerCase())) &&
    (!classFilter || e.classId === classFilter)
  );

  const publishedCount   = exams.filter(e => e.isPublished).length;
  const unpublishedCount = exams.length - publishedCount;

  // Grade distribution
  const marks       = examResults?.marks    || [];
  const stats       = examResults?.stats    || {};
  const maxMarks    = stats.maxMarks         || 100;
  const passPercent = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  const gradeData = GRADE_RANGES.map(range => ({
    ...range,
    count: marks.filter((m: any) => {
      const pct = (m.marksObtained / maxMarks) * 100;
      return pct >= range.min && pct <= range.max;
    }).length,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-violet-50"><Globe className="h-6 w-6 text-violet-600" /></span>
              Result Publishing
            </h1>
            <p className="text-muted-foreground mt-0.5">Publish exam results to student and parent portals</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Exams',   val: exams.length,        icon: BookOpen,     color: 'text-slate-600',  bg: 'bg-slate-50',  border: 'border-l-slate-400' },
            { label: 'Published',     val: publishedCount,       icon: Globe,        color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-l-green-500' },
            { label: 'Unpublished',   val: unpublishedCount,     icon: Lock,         color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-l-amber-500' },
          ].map(({ label, val, icon: Icon, color, bg, border }) => (
            <Card key={label} className={`border-l-4 ${border} overflow-hidden`}>
              <CardContent className={`pt-4 pb-3 ${bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {loading ? <div className="h-7 w-12 bg-muted animate-pulse rounded mt-1" /> :
                      <p className={`text-3xl font-bold ${color} mt-0.5`}>{val}</p>}
                  </div>
                  <Icon className={`h-7 w-7 ${color} opacity-40`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">

          {/* Exam list */}
          <aside className="space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search exams…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
              </div>
              <Select value={classFilter || 'all'} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Card className="overflow-hidden">
              <CardHeader className="py-2 px-3 bg-muted/40 border-b">
                <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {filteredExams.length} Exams
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[65vh] overflow-y-auto divide-y">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : filteredExams.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No exams found</div>
                ) : filteredExams.map(exam => {
                  const isSelected = selected?.id === exam.id;
                  const marksCount = exam._count?.marks || 0;
                  return (
                    <button key={exam.id} onClick={() => setSelected(exam)}
                      className={`w-full text-left px-3 py-2.5 transition-colors ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{exam.title || `${exam.subject?.name} Exam`}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{exam.class?.name} · {exam.subject?.name}</div>
                          <div className="text-xs text-muted-foreground">{exam.examDate ? fmtDate(exam.examDate) : '—'}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {exam.isPublished ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-0.5">
                              <Globe className="h-2.5 w-2.5" />Live
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-0.5">
                              <Lock className="h-2.5 w-2.5" />Draft
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{marksCount} results</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          {/* Right panel */}
          <div className="space-y-4">
            {!selected ? (
              <Card className="bg-muted/20">
                <CardContent className="flex flex-col items-center py-24 text-muted-foreground">
                  <Globe className="h-16 w-16 mb-4 opacity-20" />
                  <p className="font-semibold text-lg">Select an exam</p>
                  <p className="text-sm mt-1">Choose an exam from the list to view and publish results</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Exam info + publish toggle */}
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <h2 className="text-xl font-bold">{selected.title || `${selected.subject?.name} Exam`}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {selected.class?.name} · {selected.subject?.name}
                          {selected.examDate && ` · ${fmtDate(selected.examDate)}`}
                          {selected.totalMarks && ` · ${selected.totalMarks} marks`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{selected.isPublished ? 'Visible to students' : 'Hidden from students'}</p>
                          <p className={`text-sm font-semibold ${selected.isPublished ? 'text-green-600' : 'text-amber-600'}`}>
                            {selected.isPublished ? '🌐 Published' : '🔒 Unpublished'}
                          </p>
                        </div>
                        <Button
                          onClick={() => togglePublish(selected)}
                          disabled={!!publishing}
                          className={selected.isPublished
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-green-600 hover:bg-green-700'}
                          size="sm"
                        >
                          {publishing === selected.id
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : selected.isPublished
                              ? <><EyeOff className="mr-2 h-4 w-4" />Unpublish</>
                              : <><Globe className="mr-2 h-4 w-4" />Publish Results</>}
                        </Button>
                      </div>
                    </div>

                    {/* Stats */}
                    {stats.total > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {[
                          { label: 'Students', val: stats.total,    color: 'text-slate-700',  bg: 'bg-slate-50' },
                          { label: 'Passed',   val: stats.passed,   color: 'text-green-700',  bg: 'bg-green-50' },
                          { label: 'Failed',   val: stats.failed,   color: 'text-red-700',    bg: 'bg-red-50' },
                          { label: 'Avg Mark', val: `${stats.avgMark}/${maxMarks}`, color: 'text-blue-700', bg: 'bg-blue-50' },
                        ].map(({ label, val, color, bg }) => (
                          <div key={label} className={`${bg} rounded-xl px-3 py-2.5`}>
                            <div className="text-xs text-muted-foreground">{label}</div>
                            <div className={`text-xl font-bold ${color}`}>{val}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {stats.total > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="w-20 text-muted-foreground text-right">Pass Rate</span>
                          <Progress value={passPercent} className="flex-1 h-2" />
                          <span className={`w-12 font-semibold ${passPercent >= 70 ? 'text-green-600' : passPercent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {passPercent}%
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Grade distribution chart */}
                {marks.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />Grade Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={gradeData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number) => [`${v} students`, 'Count']} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {gradeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">
                          {gradeData.map(d => (
                            <div key={d.grade} className="flex items-center gap-3 text-sm">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                              <span className="flex-1 text-xs text-muted-foreground">{d.label}</span>
                              <span className="font-bold text-sm">{d.count}</span>
                              <span className="text-xs text-muted-foreground w-10 text-right">
                                {marks.length > 0 ? `${Math.round((d.count / marks.length) * 100)}%` : '0%'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Results table */}
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">Student Results</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {resLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : marks.length === 0 ? (
                      <div className="text-center py-10 text-sm text-muted-foreground">
                        No marks entered for this exam yet
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="pl-4 w-10">Rank</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead className="text-right">Marks</TableHead>
                            <TableHead className="text-right">%</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {marks.map((m: any, idx: number) => {
                            const pct     = Math.round((m.marksObtained / maxMarks) * 100);
                            const grade   = getGrade(m.marksObtained, maxMarks);
                            const passing = examResults?.exam?.passingMarks || 0;
                            const passed  = m.marksObtained >= passing;
                            const gradeColor = grade.startsWith('A') ? 'text-green-700 bg-green-50' : grade === 'B' ? 'text-blue-700 bg-blue-50' : grade === 'C' ? 'text-amber-700 bg-amber-50' : grade === 'D' ? 'text-orange-700 bg-orange-50' : 'text-red-700 bg-red-50';
                            return (
                              <TableRow key={m.id} className="hover:bg-muted/20">
                                <TableCell className="pl-4 text-xs text-muted-foreground">
                                  {idx + 1 <= 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-sm">{m.student?.fullName}</div>
                                  <div className="text-xs text-muted-foreground">{m.student?.admissionNumber}</div>
                                </TableCell>
                                <TableCell className="text-right font-bold">{m.marksObtained}/{maxMarks}</TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-semibold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {pct}%
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeColor}`}>{grade}</span>
                                </TableCell>
                                <TableCell>
                                  {passed
                                    ? <span className="text-xs font-semibold text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Pass</span>
                                    : <span className="text-xs font-semibold text-red-600 flex items-center gap-1"><XCircle className="h-3 w-3" />Fail</span>}
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
    </div>
  );
}
