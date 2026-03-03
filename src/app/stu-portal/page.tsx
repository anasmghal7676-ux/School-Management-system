'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, GraduationCap, BookOpen, DollarSign, Star, TrendingUp, CalendarCheck, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtPKR  = (n: number) => `PKR ${n.toLocaleString()}`;
const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtMonth = (my: string) => { const [y, m] = my.split('-'); return `${MONTHS[parseInt(m)-1]} ${y.slice(2)}`; };

const ATT_DOT_COLORS: Record<string, string> = {
  Present: 'bg-green-500',
  Absent:  'bg-red-500',
  Late:    'bg-amber-500',
  Leave:   'bg-blue-400',
};

export default function StudentPortalPage() {
  const [searchMode, setSearchMode] = useState<'admission' | 'roll'>('admission');
  const [admissionNo, setAdmissionNo] = useState('');
  const [rollNo, setRollNo]     = useState('');
  const [classInput, setClassInput] = useState('');
  const [loading, setLoading]   = useState(false);
  const [data, setData]         = useState<any>(null);
  const [error, setError]       = useState('');

  const handleSearch = async () => {
    if (searchMode === 'admission' && !admissionNo) { toast({ title: 'Enter admission number', variant: 'destructive' }); return; }
    if (searchMode === 'roll' && (!rollNo || !classInput)) { toast({ title: 'Enter roll number and class', variant: 'destructive' }); return; }
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams();
      if (searchMode === 'admission') p.append('admissionNumber', admissionNo);
      else { p.append('rollNumber', rollNo); p.append('classId', classInput); }
      const r = await fetch(`/api/stu-portal?${p}`);
      const j = await r.json();
      if (j.success) setData(j.data);
      else { setError(j.message); setData(null); }
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  };

  const { student, attendance, fees, reportCards, homework, recentMarks, subjectPerformance, commendations } = data || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <GraduationCap className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold">Student Portal</h1>
            <p className="text-violet-100 text-sm">View your academic progress, attendance and homework</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Search */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Access Your Records</CardTitle>
            <CardDescription>Enter your admission number or roll number to view your information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant={searchMode === 'admission' ? 'default' : 'outline'} size="sm" onClick={() => setSearchMode('admission')}>Admission No.</Button>
              <Button variant={searchMode === 'roll' ? 'default' : 'outline'} size="sm" onClick={() => setSearchMode('roll')}>Roll No.</Button>
            </div>
            {searchMode === 'admission' ? (
              <div className="flex gap-2 max-w-sm">
                <Input placeholder="e.g. ADM-2024-001" value={admissionNo} onChange={e => setAdmissionNo(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <Input placeholder="Roll Number" value={rollNo} onChange={e => setRollNo(e.target.value)} className="w-36" />
                <Input placeholder="Class ID" value={classInput} onChange={e => setClassInput(e.target.value)} className="w-48" />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}Search
                </Button>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                <XCircle className="h-4 w-4 flex-shrink-0" />{error}
              </div>
            )}
          </CardContent>
        </Card>

        {data && student && (
          <>
            {/* Student Profile */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold flex-shrink-0">
                    {student.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold">{student.fullName}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-violet-100 text-sm">
                      <span>Adm# {student.admissionNumber}</span>
                      <span>Roll# {student.rollNumber || '—'}</span>
                      <span>{student.class} {student.section && `/ ${student.section}`}</span>
                      {student.bloodGroup && <span>Blood: {student.bloodGroup}</span>}
                    </div>
                    {student.parentName && <p className="text-violet-200 text-xs mt-1">Guardian: {student.parentName} · {student.parentPhone}</p>}
                  </div>
                  {reportCards?.[0] && (
                    <div className="text-right">
                      <p className="text-3xl font-black">{reportCards[0].gpa?.toFixed(2)}</p>
                      <p className="text-violet-200 text-xs">GPA · Grade {reportCards[0].grade}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {[
                { label: 'Attendance', value: `${attendance?.summary?.rate}%`, sub: `${attendance?.summary?.present}/${attendance?.summary?.total} days`, ok: attendance?.summary?.rate >= 75, icon: CalendarCheck },
                { label: 'Pending Fees', value: fees?.pending?.length || 0, sub: 'dues outstanding', ok: fees?.pending?.length === 0, icon: DollarSign },
                { label: 'Homework Due', value: homework?.length || 0, sub: 'upcoming tasks', ok: homework?.length === 0, icon: BookOpen },
                { label: 'Commendations', value: commendations?.length || 0, sub: 'good behavior', ok: true, icon: Star },
              ].map(({ label, value, sub, ok, icon: Icon }) => (
                <Card key={label} className="border-0 shadow-md">
                  <CardContent className="pt-4 pb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-2xl font-bold ${ok ? 'text-green-600' : 'text-red-600'}`}>{value}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                    <Icon className="h-6 w-6 text-muted-foreground opacity-50" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="performance">
              <TabsList className="w-full">
                <TabsTrigger value="performance" className="flex-1">Performance</TabsTrigger>
                <TabsTrigger value="attendance"  className="flex-1">Attendance</TabsTrigger>
                <TabsTrigger value="homework"    className="flex-1">Homework</TabsTrigger>
                <TabsTrigger value="fees"        className="flex-1">Fees</TabsTrigger>
              </TabsList>

              {/* PERFORMANCE */}
              <TabsContent value="performance" className="space-y-4">
                {subjectPerformance?.length > 0 && (
                  <Card className="border-0 shadow-md">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Subject Performance</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={subjectPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                          <Tooltip formatter={(v: number) => [`${v}%`, 'Score']} />
                          <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                            {subjectPerformance.map((_: any, i: number) => (
                              <Cell key={i} fill={_.percentage >= 80 ? '#22c55e' : _.percentage >= 60 ? '#3b82f6' : _.percentage >= 40 ? '#f59e0b' : '#ef4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
                {reportCards?.length > 0 && (
                  <Card className="border-0 shadow-md">
                    <CardHeader><CardTitle className="text-base">Report Cards</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportCards.map((rc: any) => (
                          <div key={rc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                            <div>
                              <p className="font-semibold">{rc.academicYear || 'Academic Year'}</p>
                              <p className="text-xs text-muted-foreground">Generated: {fmtDate(rc.generatedAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-violet-600">{rc.gpa?.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">Grade {rc.grade} · Rank #{rc.classRank || '—'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {recentMarks?.length > 0 && (
                  <Card className="border-0 shadow-md">
                    <CardHeader><CardTitle className="text-base">Recent Results</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {recentMarks.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between text-sm border-b pb-2">
                            <div>
                              <p className="font-medium">{m.examSchedule?.subject?.name}</p>
                              <p className="text-xs text-muted-foreground">{m.examSchedule?.exam?.title}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${(m.percentage || 0) >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                                {m.obtainedMarks}/{m.totalMarks}
                              </p>
                              <p className="text-xs text-muted-foreground">{m.percentage?.toFixed(1)}% · {m.grade}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ATTENDANCE */}
              <TabsContent value="attendance">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><CalendarCheck className="h-4 w-4" />Attendance Record</CardTitle>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-green-600 font-semibold">✓ {attendance?.summary?.present} Present</span>
                      <span className="text-red-600 font-semibold">✗ {attendance?.summary?.absent} Absent</span>
                      <span className="text-amber-600 font-semibold">⏱ {attendance?.summary?.late} Late</span>
                      <span className="font-bold">{attendance?.summary?.rate}% Rate</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Monthly summary */}
                    {attendance?.monthly?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-3 text-muted-foreground">Monthly Breakdown</p>
                        <div className="space-y-2">
                          {attendance.monthly.map((m: any) => {
                            const total = m.present + m.absent + m.late;
                            const rate  = total > 0 ? Math.round((m.present / total) * 100) : 0;
                            return (
                              <div key={m.month} className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground w-16 flex-shrink-0">{fmtMonth(m.month)}</span>
                                <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-xs font-semibold w-12 text-right">{rate}%</span>
                                <span className="text-xs text-muted-foreground w-16">{m.present}/{total}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Recent dots */}
                    {attendance?.recent?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-3 text-muted-foreground">Recent Days</p>
                        <div className="flex flex-wrap gap-2">
                          {attendance.recent.map((a: any) => (
                            <div key={a.id} className="flex flex-col items-center gap-1" title={`${fmtDate(a.date)}: ${a.status}`}>
                              <div className={`h-5 w-5 rounded-full ${ATT_DOT_COLORS[a.status] || 'bg-gray-300'}`} />
                              <span className="text-[9px] text-muted-foreground">{new Date(a.date).getDate()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                          {Object.entries(ATT_DOT_COLORS).map(([status, color]) => (
                            <span key={status} className="flex items-center gap-1"><span className={`inline-block h-3 w-3 rounded-full ${color}`} />{status}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {attendance?.summary?.rate < 75 && (
                      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Your attendance is below 75%. Please contact your class teacher.</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* HOMEWORK */}
              <TabsContent value="homework">
                <Card className="border-0 shadow-md">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Pending Homework</CardTitle></CardHeader>
                  <CardContent>
                    {!homework?.length ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
                        <p>No pending homework! Great job.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {homework.map((hw: any) => {
                          const dl = Math.ceil((new Date(hw.submissionDate).getTime() - Date.now()) / 86400000);
                          return (
                            <div key={hw.id} className={`rounded-xl border-l-4 p-4 ${dl <= 1 ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' : dl <= 3 ? 'border-l-amber-400 bg-amber-50 dark:bg-amber-950/20' : 'border-l-blue-400 bg-blue-50 dark:bg-blue-950/20'}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold">{hw.title}</p>
                                  {hw.subject && <p className="text-xs text-muted-foreground">{hw.subject.name}</p>}
                                  {hw.description && <p className="text-sm text-muted-foreground mt-1">{hw.description}</p>}
                                  {hw.totalMarks && <p className="text-xs text-muted-foreground mt-1">Marks: {hw.totalMarks}</p>}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-xs text-muted-foreground">Due</p>
                                  <p className="font-semibold text-sm">{fmtDate(hw.submissionDate)}</p>
                                  <p className={`text-xs font-bold ${dl <= 1 ? 'text-red-600' : dl <= 3 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                    {dl === 0 ? 'Today!' : dl < 0 ? 'Overdue' : `${dl}d left`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FEES */}
              <TabsContent value="fees">
                <Card className="border-0 shadow-md">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Fee Status</CardTitle></CardHeader>
                  <CardContent>
                    {!fees?.pending?.length ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
                        <p className="font-medium">All fees are paid — no outstanding dues!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-red-600">⚠️ {fees.pending.length} pending due(s)</p>
                        {fees.pending.map((fee: any) => (
                          <div key={fee.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200">
                            <div>
                              <p className="font-semibold text-sm text-red-700">{fmtPKR(fee.amountDue)}</p>
                              <p className="text-xs text-red-500">{fee.monthYear}</p>
                              {fee.dueDate && <p className="text-xs text-muted-foreground">Due: {fmtDate(fee.dueDate)}</p>}
                            </div>
                            <Badge variant="destructive" className="text-xs">Pending</Badge>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground text-center mt-2">Please visit the accounts office to clear dues</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground pb-4">Student Portal — For queries contact the school administration</p>
      </main>
    </div>
  );
}
