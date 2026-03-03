'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, BarChart3, Download, Award, TrendingUp, Users,
  CheckCircle2, XCircle, Target, RefreshCw, Filter, BookOpen, Trophy,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import { generateTableReport } from '@/lib/pdf-generator';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
const GRADE_COLORS: Record<string, string> = {
  'A+': '#10b981', A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444',
};

function PctBadge({ pct }: { pct: string | number }) {
  const n = parseFloat(String(pct));
  const color = n >= 80 ? 'text-green-700 bg-green-50 border-green-200'
    : n >= 60 ? 'text-blue-700 bg-blue-50 border-blue-200'
    : n >= 40 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-red-700 bg-red-50 border-red-200';
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>{n.toFixed(1)}%</span>;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-amber-500 font-black text-base">🥇</span>;
  if (rank === 2) return <span className="text-slate-500 font-black text-base">🥈</span>;
  if (rank === 3) return <span className="text-amber-700 font-black text-base">🥉</span>;
  return <span className="text-xs font-mono font-bold text-muted-foreground">#{rank}</span>;
}

export default function ExamResultsPage() {
  const [exams,    setExams]    = useState<any[]>([]);
  const [classes,  setClasses]  = useState<any[]>([]);
  const [selExam,  setSelExam]  = useState('');
  const [selClass, setSelClass] = useState('');
  const [data,     setData]     = useState<any>(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => { fetchExams(); fetchClasses(); }, []);

  const fetchExams = async () => {
    const r = await fetch('/api/exams?limit=50');
    const j = await r.json();
    if (j.success) setExams(j.data?.exams || j.data || []);
  };

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=60');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchResults = async () => {
    if (!selExam) { toast({ title: 'Select an exam first', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const p = new URLSearchParams({ examId: selExam });
      if (selClass) p.set('classId', selClass);
      const r = await fetch(`/api/exam-results?${p}`);
      const j = await r.json();
      if (j.success) setData(j.data);
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['Rank', 'Student', 'Admission No', ...((data.subjectStats || []).map((s: any) => s.subject?.name)), 'Total', 'Max Total', '%'],
      ...(data.studentTotals || []).map((s: any) => [
        s.rank, s.student.fullName, s.student.admissionNumber,
        ...(s.subjects.map((sub: any) => sub.isAbsent ? 'Absent' : sub.obtained)),
        s.total, s.maxTotal, s.percentage,
      ]),
    ];
    const csv  = rows.map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `exam-results-${selExam}.csv`;
    a.click();
  };

  const subjectStats    = data?.subjectStats    || [];
  const studentTotals   = data?.studentTotals   || [];
  const examInfo        = data?.exam;

  // Radar chart for subject averages
  const radarData = subjectStats.map((s: any) => ({
    subject: s.subject?.name?.slice(0, 10),
    avg:     s.avg ? Math.round((s.avg / s.maxMarks) * 100) : 0,
    passRate: s.passRate || 0,
  }));

  // Grade distribution across all subjects
  const overallGradeDist = ['A+', 'A', 'B', 'C', 'D', 'F'].map(g => ({
    grade: g,
    count: subjectStats.reduce((sum: number, s: any) => sum + (s.gradeDist?.[g] || 0), 0),
    fill: GRADE_COLORS[g],
  }));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50"><Trophy className="h-6 w-6 text-indigo-600" /></span>
              Exam Results
            </h1>
            <p className="text-muted-foreground mt-0.5">Analyse exam performance across subjects and students</p>
          </div>
          {data && (
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />Export Results
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-52">
                <Select value={selExam} onValueChange={v => { setSelExam(v); setData(null); }}>
                  <SelectTrigger><SelectValue placeholder="Choose exam…" /></SelectTrigger>
                  <SelectContent>
                    {exams.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name} ({e.examType})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select value={selClass || 'all'} onValueChange={v => { setSelClass(v === 'all' ? '' : v); setData(null); }}>
                  <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchResults} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                Load Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex justify-center py-16"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>
        )}

        {data && !loading && (
          <>
            {/* Exam header */}
            {examInfo && (
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <Trophy className="h-8 w-8 text-indigo-500 flex-shrink-0" />
                <div>
                  <h2 className="font-bold text-xl text-indigo-900">{examInfo.name}</h2>
                  <p className="text-sm text-indigo-600">{examInfo.examType} · {fmtDate(examInfo.startDate)} — {fmtDate(examInfo.endDate)} · {data.scheduleCount} subjects</p>
                </div>
              </div>
            )}

            {/* Summary KPIs */}
            {subjectStats.length > 0 && (
              <div className="grid sm:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Avg Pass Rate',
                    val: `${Math.round(subjectStats.reduce((s: number, x: any) => s + (x.passRate || 0), 0) / subjectStats.length)}%`,
                    color: 'text-green-700', bg: 'bg-green-50',
                  },
                  {
                    label: 'Subjects Scheduled',
                    val: String(subjectStats.length),
                    color: 'text-blue-700', bg: 'bg-blue-50',
                  },
                  {
                    label: 'Students in Results',
                    val: String(studentTotals.length),
                    color: 'text-purple-700', bg: 'bg-purple-50',
                  },
                  {
                    label: 'Top Score',
                    val: studentTotals.length > 0 ? `${studentTotals[0].percentage}%` : '—',
                    color: 'text-amber-700', bg: 'bg-amber-50',
                  },
                ].map(({ label, val, color, bg }) => (
                  <Card key={label} className="overflow-hidden">
                    <CardContent className={`pt-4 pb-3 ${bg}`}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-2xl font-bold ${color} mt-0.5`}>{val}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Tabs defaultValue="subjects">
              <TabsList>
                <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
                {studentTotals.length > 0 && <TabsTrigger value="rankings">Student Rankings</TabsTrigger>}
                <TabsTrigger value="charts">Charts</TabsTrigger>
              </TabsList>

              {/* ── Subject Analysis ──────────────────────────────────── */}
              <TabsContent value="subjects" className="space-y-4">
                {subjectStats.length === 0 ? (
                  <Card><CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mb-3 opacity-20" />
                    <p>No marks entered yet for this exam</p>
                  </CardContent></Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="pl-4">Subject</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-center">Students</TableHead>
                            <TableHead className="text-center">Absent</TableHead>
                            <TableHead className="text-center">Avg</TableHead>
                            <TableHead className="text-center">Highest</TableHead>
                            <TableHead className="text-center">Lowest</TableHead>
                            <TableHead className="text-center">Pass Rate</TableHead>
                            <TableHead>Grade Distribution</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subjectStats.map((s: any) => (
                            <TableRow key={s.scheduleId} className="hover:bg-muted/10">
                              <TableCell className="pl-4 font-semibold">{s.subject?.name}</TableCell>
                              <TableCell className="text-sm">{s.class?.name}</TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(s.examDate)}</TableCell>
                              <TableCell className="text-center">{s.total}</TableCell>
                              <TableCell className="text-center text-red-500">{s.absentCnt}</TableCell>
                              <TableCell className="text-center font-bold">
                                {s.avg != null ? `${s.avg.toFixed(1)}` : '—'}
                              </TableCell>
                              <TableCell className="text-center text-green-600 font-bold">{s.highest ?? '—'}</TableCell>
                              <TableCell className="text-center text-red-500 font-bold">{s.lowest ?? '—'}</TableCell>
                              <TableCell className="text-center">
                                {s.passRate != null ? (
                                  <span className={`font-bold ${s.passRate >= 70 ? 'text-green-600' : s.passRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {s.passRate}%
                                  </span>
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {s.gradeDist && Object.entries(s.gradeDist as Record<string, number>).map(([g, cnt]) => cnt > 0 ? (
                                    <span key={g} className="text-[10px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: `${GRADE_COLORS[g]}22`, color: GRADE_COLORS[g] }}>
                                      {g}:{cnt}
                                    </span>
                                  ) : null)}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Student Rankings ──────────────────────────────────── */}
              {studentTotals.length > 0 && (
                <TabsContent value="rankings">
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="pl-4 w-16">Rank</TableHead>
                            <TableHead>Student</TableHead>
                            {subjectStats.slice(0, 6).map((s: any) => (
                              <TableHead key={s.scheduleId} className="text-center text-xs">{s.subject?.name?.slice(0,8)}</TableHead>
                            ))}
                            {subjectStats.length > 6 && <TableHead className="text-center text-xs">+{subjectStats.length - 6} more</TableHead>}
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">%</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentTotals.map((s: any) => (
                            <TableRow key={s.student.id} className={`hover:bg-muted/10 ${s.rank <= 3 ? 'bg-amber-50/30' : ''}`}>
                              <TableCell className="pl-4"><RankBadge rank={s.rank} /></TableCell>
                              <TableCell>
                                <div className="font-semibold text-sm">{s.student.fullName}</div>
                                <div className="text-xs text-muted-foreground">{s.student.rollNumber || s.student.admissionNumber}</div>
                              </TableCell>
                              {s.subjects.slice(0, 6).map((sub: any, i: number) => (
                                <TableCell key={i} className="text-center text-sm">
                                  {sub.isAbsent
                                    ? <span className="text-xs text-red-400">Ab</span>
                                    : <span className={sub.obtained >= subjectStats[i]?.passMarks ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{sub.obtained}</span>}
                                </TableCell>
                              ))}
                              {s.subjects.length > 6 && <TableCell className="text-center text-xs text-muted-foreground">…</TableCell>}
                              <TableCell className="text-right font-bold">{s.total}</TableCell>
                              <TableCell className="text-right"><PctBadge pct={s.percentage} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* ── Charts ────────────────────────────────────────────── */}
              <TabsContent value="charts" className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Pass rate bar */}
                  {subjectStats.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Pass Rate by Subject</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={subjectStats.map((s: any) => ({ name: s.subject?.name?.slice(0,10), passRate: s.passRate || 0, avg: s.avg ? Math.round((s.avg / s.maxMarks) * 100) : 0 }))}
                            margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number) => [`${v}%`]} />
                            <Bar dataKey="passRate" name="Pass Rate" radius={[4,4,0,0]} fill="#22c55e" />
                            <Bar dataKey="avg" name="Avg %" radius={[4,4,0,0]} fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Grade distribution */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Overall Grade Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={overallGradeDist} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" name="Students" radius={[4,4,0,0]}>
                            {overallGradeDist.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-3 mt-3 flex-wrap">
                        {overallGradeDist.map(d => (
                          <div key={d.grade} className="flex items-center gap-1.5 text-xs">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                            <span>{d.grade}: {d.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Radar: subject performance */}
                  {radarData.length >= 3 && (
                    <Card className="lg:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Subject Performance Radar</CardTitle>
                        <CardDescription>Average % and pass rate by subject</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                            <Radar name="Avg %" dataKey="avg" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                            <Radar name="Pass Rate" dataKey="passRate" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {!data && !loading && (
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Trophy className="h-14 w-14 mb-4 text-indigo-300" />
              <p className="font-bold text-lg text-indigo-900">Select an Exam to View Results</p>
              <p className="text-sm text-indigo-600 mt-2 max-w-md">
                Choose an exam and optionally a class, then click Load Results to see detailed performance analytics.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
