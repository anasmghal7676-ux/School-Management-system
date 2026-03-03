'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Search, User, CalendarCheck, BookOpen, DollarSign,
  TrendingUp, FileText, Heart, Star, AlertTriangle, CheckCircle2,
  Award, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell,
} from 'recharts';

const STATUS_DOT: Record<string, string> = {
  Present: 'bg-green-500',
  Absent:  'bg-red-500',
  Late:    'bg-amber-400',
  Leave:   'bg-blue-400',
};

const GRADE_COLOR: Record<string, string> = {
  'A+': 'text-emerald-600', A: 'text-green-600', 'B+': 'text-teal-600',
  B: 'text-blue-600', C: 'text-amber-600', D: 'text-orange-600', F: 'text-red-600',
};

const pctColor = (p: number) => p >= 80 ? '#10b981' : p >= 60 ? '#3b82f6' : p >= 40 ? '#f59e0b' : '#ef4444';

const fmtDate  = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtPKR   = (n: number) => `PKR ${n.toLocaleString()}`;

export default function StudentProgressPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showList, setShowList] = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    const r = await fetch('/api/students?limit=500&status=active');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || j.data || []);
  };

  const loadProgress = async (studentId: string) => {
    setFetching(true);
    setData(null);
    try {
      const r = await fetch(`/api/stu-progress?studentId=${studentId}`);
      const j = await r.json();
      if (j.success) setData(j.data);
      else toast({ title: 'Error loading progress', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setFetching(false); }
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) || s.admissionNumber.includes(search)
  ).slice(0, 12);

  const selectStudent = (s: any) => {
    setSelected(s); setSearch(s.fullName); setShowList(false); loadProgress(s.id);
  };

  // Prepare radar data
  const radarData = data?.marks?.subjectSummary?.slice(0, 7).map((s: any) => ({
    subject: s.name.split(' ')[0],
    score:   parseFloat(s.percentage.toFixed(1)),
    fullMark: 100,
  })) || [];

  const att = data?.attendance?.summary;
  const monthlyAtt = data?.attendance?.monthly
    ? Object.entries(data.attendance.monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]: any) => ({
          month: new Date(key + '-01').toLocaleString('default', { month: 'short' }),
          rate:  val.total > 0 ? parseFloat(((val.present / val.total) * 100).toFixed(1)) : 0,
          present: val.present, absent: val.absent,
        }))
    : [];

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-7 w-7" />Student Progress
            </h1>
            <p className="text-muted-foreground">Complete academic profile — marks, attendance, fees, behavior</p>
          </div>
          {selected && data && (
            <Button variant="outline" size="sm" onClick={() => loadProgress(selected.id)} disabled={fetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />Refresh
            </Button>
          )}
        </div>

        {/* Student Search */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student by name or admission number..."
                  value={search}
                  className="pl-9"
                  onChange={e => { setSearch(e.target.value); setShowList(true); }}
                  onFocus={() => setShowList(true)}
                />
                {showList && search && filteredStudents.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 border rounded-lg bg-background shadow-lg max-h-52 overflow-y-auto">
                    {filteredStudents.map(s => (
                      <button key={s.id} type="button" className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex justify-between items-center gap-2"
                        onClick={() => selectStudent(s)}>
                        <div>
                          <span className="font-medium text-sm">{s.fullName}</span>
                          <span className="text-xs text-muted-foreground ml-2">{s.admissionNumber}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{s.class?.name} {s.section?.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selected && (
                <div className="flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {selected.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selected.fullName}</p>
                    <p className="text-xs text-muted-foreground">{selected.admissionNumber} · {selected.class?.name} {selected.section?.name}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {fetching && (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Loading student profile…</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!fetching && !data && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-20 text-muted-foreground">
              <User className="h-14 w-14 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a student to view their progress</p>
              <p className="text-sm">Search above to find a student by name or admission number</p>
            </CardContent>
          </Card>
        )}

        {/* Student Profile */}
        {!fetching && data && (
          <>
            {/* Profile Header */}
            <Card className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0">
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-wrap items-center gap-5">
                  <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black">
                    {data.student.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{data.student.fullName}</h2>
                    <p className="text-indigo-200 text-sm">{data.student.admissionNumber} · {data.student.class?.name} {data.student.section?.name}</p>
                    <p className="text-indigo-200 text-sm">{data.student.gender} · Age {data.student.age} · {data.student.fatherName}</p>
                  </div>
                  {/* Quick stats */}
                  <div className="flex gap-4 flex-wrap">
                    {[
                      { label: 'Attendance', value: `${att?.rate || 0}%`, color: att?.rate >= 75 ? 'text-green-300' : 'text-red-300' },
                      { label: 'Subjects',  value: data.marks.subjectSummary.length, color: 'text-white' },
                      { label: 'Report Cards', value: data.reportCards.length, color: 'text-white' },
                      { label: 'Behavior', value: `+${data.behavior.positive}`, color: 'text-green-300' },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-indigo-200 text-xs">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="academics">
              <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                {[
                  { val: 'academics', icon: BookOpen, label: 'Academics' },
                  { val: 'attendance', icon: CalendarCheck, label: 'Attendance' },
                  { val: 'fees', icon: DollarSign, label: 'Fees' },
                  { val: 'homework', icon: FileText, label: 'Homework' },
                  { val: 'behavior', icon: Heart, label: 'Behavior' },
                  { val: 'documents', icon: FileText, label: 'Documents' },
                ].map(({ val, icon: Icon, label }) => (
                  <TabsTrigger key={val} value={val} className="flex items-center gap-1.5 text-xs px-3">
                    <Icon className="h-3.5 w-3.5" />{label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ── ACADEMICS TAB ─────────────────────────────────────────── */}
              <TabsContent value="academics" className="space-y-5 mt-4">
                <div className="grid gap-5 lg:grid-cols-2">
                  {/* Subject performance radar */}
                  <Card>
                    <CardHeader><CardTitle className="text-base">Subject Performance</CardTitle></CardHeader>
                    <CardContent>
                      {radarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                            <Radar dataKey="score" fill="#6366f1" fillOpacity={0.25} stroke="#6366f1" strokeWidth={2} />
                            <Tooltip formatter={(v: number) => `${v}%`} />
                          </RadarChart>
                        </ResponsiveContainer>
                      ) : <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No marks data</div>}
                    </CardContent>
                  </Card>

                  {/* Subject list */}
                  <Card>
                    <CardHeader><CardTitle className="text-base">Subject Scores</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {data.marks.subjectSummary.length > 0 ? data.marks.subjectSummary.map((s: any) => (
                        <div key={s.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{s.name}</span>
                            <span className="font-bold" style={{ color: pctColor(s.percentage) }}>{s.percentage}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.percentage}%`, backgroundColor: pctColor(s.percentage) }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.obtained} / {s.total} marks · {s.count} exam{s.count !== 1 ? 's' : ''}</p>
                        </div>
                      )) : <p className="text-sm text-muted-foreground py-8 text-center">No exam marks recorded</p>}
                    </CardContent>
                  </Card>
                </div>

                {/* Marks trend line chart */}
                {data.marks.trend.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Marks Trend</CardTitle><CardDescription>Percentage across recent exams</CardDescription></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data.marks.trend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => `${v}%`} />
                          <Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Report Cards */}
                {data.reportCards.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Report Cards</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {data.reportCards.map((rc: any) => (
                          <div key={rc.id} className="border rounded-xl p-4 text-center">
                            <p className="text-xs text-muted-foreground mb-1">{rc.exam?.title || 'Exam'}</p>
                            <p className="text-3xl font-black text-primary">{rc.gpa?.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">GPA</p>
                            <p className="text-lg font-bold mt-1">{rc.grade}</p>
                            {rc.classRank && <p className="text-xs text-muted-foreground">Rank #{rc.classRank}</p>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── ATTENDANCE TAB ────────────────────────────────────────── */}
              <TabsContent value="attendance" className="space-y-5 mt-4">
                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Present', val: att?.present || 0, color: 'text-green-600' },
                    { label: 'Absent',  val: att?.absent  || 0, color: 'text-red-600'   },
                    { label: 'Late',    val: att?.late    || 0, color: 'text-amber-600' },
                    { label: 'Rate',    val: `${att?.rate || 0}%`, color: att?.rate >= 75 ? 'text-green-600' : 'text-red-600' },
                  ].map(s => (
                    <Card key={s.label}>
                      <CardContent className="pt-3 pb-3 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {att?.rate < 75 && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    Attendance is below 75% threshold. Student may be at risk.
                  </div>
                )}

                {/* Monthly bar chart */}
                {monthlyAtt.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Monthly Attendance %</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyAtt}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => `${v}%`} />
                          <Bar dataKey="rate" fill="#10b981" radius={[4,4,0,0]}>
                            {monthlyAtt.map((m: any, i: number) => <Cell key={i} fill={m.rate >= 75 ? '#10b981' : '#ef4444'} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Dot grid — recent days */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Recent Attendance</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {data.attendance.recent.slice(0, 60).map((a: any) => (
                        <div key={a.id} title={`${fmtDate(a.date)} — ${a.status}`}
                          className={`h-4 w-4 rounded-sm ${STATUS_DOT[a.status] || 'bg-gray-200'} cursor-help`} />
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {Object.entries(STATUS_DOT).map(([k, v]) => (
                        <span key={k} className="flex items-center gap-1"><span className={`h-3 w-3 rounded-sm ${v}`} />{k}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── FEES TAB ──────────────────────────────────────────────── */}
              <TabsContent value="fees" className="space-y-5 mt-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-3 pb-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{fmtPKR(data.fees.summary.totalPaid)}</p>
                      <p className="text-xs text-muted-foreground">Total Paid</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-3 pb-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{data.fees.summary.transactions}</p>
                      <p className="text-xs text-muted-foreground">Transactions</p>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-3 pb-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{data.fees.summary.discounts.length}</p>
                      <p className="text-xs text-muted-foreground">Active Discounts</p>
                    </CardContent>
                  </Card>
                </div>

                {data.fees.summary.discounts.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Active Discounts</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {data.fees.summary.discounts.map((d: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                          <span className="font-medium">{d.discountType}</span>
                          <span className="text-green-600 font-bold">{d.percentage > 0 ? `${d.percentage}%` : fmtPKR(d.fixedAmount)}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
                  <CardContent>
                    {data.fees.payments.length > 0 ? (
                      <div className="space-y-2">
                        {data.fees.payments.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2.5">
                            <div>
                              <p className="font-medium">{fmtDate(p.paymentDate)}</p>
                              <p className="text-xs text-muted-foreground">{p.paymentMethod} · {p.status}</p>
                            </div>
                            <span className={`font-bold ${p.status === 'Success' ? 'text-green-600' : 'text-amber-600'}`}>
                              {fmtPKR(p.paidAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground py-8 text-center">No payment history in the last 6 months</p>}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── HOMEWORK TAB ──────────────────────────────────────────── */}
              <TabsContent value="homework" className="space-y-5 mt-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <Card><CardContent className="pt-3 pb-3 text-center">
                    <p className="text-2xl font-bold">{data.homework.stats.submitted}</p>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-3 pb-3 text-center">
                    <p className="text-2xl font-bold text-amber-600">{data.homework.stats.late}</p>
                    <p className="text-xs text-muted-foreground">Late Submissions</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-3 pb-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{data.homework.stats.avgMarks ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">Avg Marks</p>
                  </CardContent></Card>
                </div>
                <Card>
                  <CardContent className="pt-4">
                    {data.homework.submissions.length > 0 ? (
                      <div className="space-y-2">
                        {data.homework.submissions.map((h: any) => (
                          <div key={h.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2.5">
                            <div>
                              <p className="font-medium">{h.homework?.title || 'Homework'}</p>
                              <p className="text-xs text-muted-foreground">{h.homework?.subject?.name} · Due {h.homework?.dueDate ? fmtDate(h.homework.dueDate) : '—'}</p>
                            </div>
                            <div className="text-right">
                              {h.obtainedMarks != null ? <p className="font-bold">{h.obtainedMarks}/{h.homework?.totalMarks}</p> : null}
                              <p className="text-xs text-muted-foreground">Submitted {fmtDate(h.submittedAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground py-8 text-center">No homework submissions</p>}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── BEHAVIOR TAB ──────────────────────────────────────────── */}
              <TabsContent value="behavior" className="space-y-5 mt-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <Card className="border-l-4 border-l-green-500"><CardContent className="pt-3 pb-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{data.behavior.positive}</p>
                    <p className="text-xs text-muted-foreground">Positive</p>
                  </CardContent></Card>
                  <Card className="border-l-4 border-l-red-500"><CardContent className="pt-3 pb-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{data.behavior.negative}</p>
                    <p className="text-xs text-muted-foreground">Negative</p>
                  </CardContent></Card>
                  <Card className="border-l-4 border-l-blue-500"><CardContent className="pt-3 pb-3 text-center">
                    <p className="text-2xl font-bold">{data.behavior.total}</p>
                    <p className="text-xs text-muted-foreground">Total Records</p>
                  </CardContent></Card>
                </div>
                <Card>
                  <CardContent className="pt-4">
                    {data.behavior.logs.length > 0 ? (
                      <div className="space-y-2">
                        {data.behavior.logs.map((b: any) => (
                          <div key={b.id} className={`border rounded-lg px-3 py-2.5 ${['Good','Appreciation'].includes(b.behaviorType) ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10' : 'border-red-200 bg-red-50/50 dark:bg-red-950/10'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${['Good','Appreciation'].includes(b.behaviorType) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {b.behaviorType}
                              </span>
                              <span className="text-xs text-muted-foreground">{fmtDate(b.incidentDate)}</span>
                            </div>
                            <p className="text-sm">{b.description}</p>
                            {b.actionTaken && <p className="text-xs text-muted-foreground mt-1">Action: {b.actionTaken}</p>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground py-8 text-center">No behavior records</p>}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── DOCUMENTS TAB ─────────────────────────────────────────── */}
              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardContent className="pt-4">
                    {data.documents.length > 0 ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.documents.map((d: any) => (
                          <div key={d.id} className="border rounded-xl p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-lg flex-shrink-0">📄</div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{d.fileName}</p>
                              <p className="text-xs text-muted-foreground">{d.documentType}</p>
                              <p className="text-xs text-muted-foreground">{fmtDate(d.uploadDate)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <FileText className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm">No documents on file</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
