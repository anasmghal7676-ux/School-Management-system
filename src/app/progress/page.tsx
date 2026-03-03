'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Search, TrendingUp, CalendarCheck, DollarSign,
  BookOpen, Users, AlertTriangle, CheckCircle2, Star,
  FileText, ThumbsUp, ThumbsDown, ChevronDown, ChevronRight,
  Award, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-emerald-600', 'A': 'text-green-600', 'B+': 'text-teal-600',
  'B': 'text-blue-600', 'C': 'text-amber-600', 'D': 'text-orange-600', 'F': 'text-red-600',
};

const ATT_COLOR = (pct: number) =>
  pct >= 85 ? 'text-green-600' : pct >= 70 ? 'text-amber-600' : 'text-red-600';

const ATT_BAR = (pct: number) =>
  pct >= 85 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#ef4444';

export default function ProgressPage() {
  const [students, setStudents]   = useState<any[]>([]);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<any>(null);
  const [progress, setProgress]   = useState<any>(null);
  const [loading, setLoading]     = useState(false);
  const [progLoading, setProgLoading] = useState(false);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const r = await fetch('/api/students?limit=500&status=active');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || j.data || []);
    setLoading(false);
  };

  const loadProgress = async (s: any) => {
    setSelected(s); setProgress(null); setExpandedExam(null);
    setProgLoading(true);
    try {
      const r = await fetch(`/api/progress?studentId=${s.id}`);
      const j = await r.json();
      if (j.success) setProgress(j.data);
      else toast({ title: 'Error loading progress', variant: 'destructive' });
    } finally { setProgLoading(false); }
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNumber.includes(search)
  );

  // Radar chart data from latest exam
  const latestExam = progress?.exams?.[0];
  const radarData  = latestExam?.subjects?.map((s: any) => ({
    subject: s.subject.length > 10 ? s.subject.slice(0, 10) + '…' : s.subject,
    score:   s.percentage || 0,
  })) || [];

  const behaviorData = progress?.behavior?.summary
    ? Object.entries(progress.behavior.summary).map(([k, v]) => ({ name: k, count: v }))
    : [];

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 flex gap-0 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Sidebar — student list */}
        <div className="w-72 border-r flex flex-col bg-background flex-shrink-0">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />Student Progress
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search student..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : filteredStudents.map(s => (
              <button
                key={s.id}
                onClick={() => loadProgress(s)}
                className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors ${selected?.id === s.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {s.fullName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.admissionNumber} · {s.class?.name}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {!selected && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <TrendingUp className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a student</p>
              <p className="text-sm">Choose a student from the list to view their progress report</p>
            </div>
          )}

          {selected && progLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading progress data…</p>
              </div>
            </div>
          )}

          {selected && progress && !progLoading && (
            <div className="p-6 space-y-6 animate-fade-in">
              {/* Student header */}
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-2xl font-black text-primary">
                    {selected.fullName[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{progress.student.fullName}</h2>
                    <p className="text-muted-foreground">
                      {progress.student.admissionNumber} · {progress.student.class?.name} {progress.student.section?.name}
                    </p>
                    {progress.student.parents?.[0] && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        <Users className="inline h-3.5 w-3.5 mr-1" />
                        {progress.student.parents[0].relation}: {progress.student.parents[0].firstName} {progress.student.parents[0].lastName}
                        · {progress.student.parents[0].phone}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => loadProgress(selected)}>
                  <RefreshCw className="mr-2 h-4 w-4" />Refresh
                </Button>
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Attendance</p>
                        <p className={`text-2xl font-bold ${ATT_COLOR(progress.attendance.percentage)}`}>
                          {progress.attendance.percentage}%
                        </p>
                        <p className="text-xs text-muted-foreground">{progress.attendance.present}/{progress.attendance.total} days</p>
                      </div>
                      <CalendarCheck className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Latest Exam</p>
                        <p className={`text-2xl font-bold ${ATT_COLOR(latestExam?.overallPercentage || 0)}`}>
                          {latestExam?.overallPercentage || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">{latestExam?.examTitle || 'No exams'}</p>
                      </div>
                      <Award className="h-8 w-8 text-amber-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Fee Due</p>
                        <p className="text-2xl font-bold text-red-600">
                          PKR {(progress.fees.pendingAmount || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{progress.fees.pendingCount} pending</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Homework</p>
                        <p className="text-2xl font-bold text-green-600">{progress.homework.submitted}</p>
                        <p className="text-xs text-muted-foreground">{progress.homework.onTime} on time</p>
                      </div>
                      <BookOpen className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Attendance trend */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Attendance Trend (6 months)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={progress.attendance.trend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [`${v}%`, 'Attendance']} />
                        <Bar dataKey="pct" name="Attendance" radius={[4, 4, 0, 0]}
                          fill="#3b82f6"
                          label={{ position: 'top', fontSize: 9, formatter: (v: number) => v > 0 ? `${v}%` : '' }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Subject radar — latest exam */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Subject Performance — {latestExam?.examTitle || 'Latest Exam'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {radarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-44 text-muted-foreground text-sm">No exam data</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Exam History */}
              {progress.exams.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Award className="h-4 w-4" />Exam History ({progress.exams.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {progress.exams.map((exam: any) => (
                      <div key={exam.examId} className="border rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedExam(expandedExam === exam.examId ? null : exam.examId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`text-lg font-black ${ATT_COLOR(exam.overallPercentage)}`}>
                              {exam.overallPercentage}%
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold">{exam.examTitle}</p>
                              <p className="text-xs text-muted-foreground">{exam.examType} · {exam.academicYear}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{exam.subjects.length} subjects</span>
                            {expandedExam === exam.examId ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </button>
                        {expandedExam === exam.examId && (
                          <div className="border-t bg-muted/20">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b text-xs text-muted-foreground">
                                  <th className="text-left p-2 pl-4">Subject</th>
                                  <th className="text-center p-2">Marks</th>
                                  <th className="text-center p-2">%</th>
                                  <th className="text-center p-2">Grade</th>
                                  <th className="text-center p-2">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {exam.subjects.map((s: any, i: number) => (
                                  <tr key={i} className="border-b last:border-0">
                                    <td className="p-2 pl-4 font-medium">{s.subject}</td>
                                    <td className="p-2 text-center text-muted-foreground">
                                      {s.isAbsent ? '—' : `${s.obtained}/${s.total}`}
                                    </td>
                                    <td className="p-2 text-center font-semibold">{s.isAbsent ? 'Absent' : `${s.percentage}%`}</td>
                                    <td className="p-2 text-center">
                                      <span className={`font-bold ${GRADE_COLORS[s.grade] || 'text-gray-600'}`}>{s.grade || '—'}</span>
                                    </td>
                                    <td className="p-2 text-center">
                                      {s.isAbsent ? (
                                        <span className="text-xs text-gray-500">Absent</span>
                                      ) : s.isPassing ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                      ) : (
                                        <AlertTriangle className="h-4 w-4 text-red-500 mx-auto" />
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Fee & Behavior */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Fee summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />Fee Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {[
                      { label: 'Total Paid',    value: `PKR ${(progress.fees.totalPaid || 0).toLocaleString()}`, color: 'text-green-600' },
                      { label: 'Pending',       value: `PKR ${(progress.fees.pendingAmount || 0).toLocaleString()}`, color: 'text-red-600' },
                      { label: 'Fines',         value: `PKR ${(progress.fees.finesAmount || 0).toLocaleString()}`, color: 'text-amber-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                        <span className="text-muted-foreground">{label}</span>
                        <span className={`font-bold ${color}`}>{value}</span>
                      </div>
                    ))}
                    {progress.fees.discounts?.length > 0 && (
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground mb-1">Active Discounts</p>
                        <div className="flex gap-1 flex-wrap">
                          {progress.fees.discounts.map((d: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs text-green-600 border-green-300">
                              {d.discountType}: {d.percentage > 0 ? `${d.percentage}%` : `PKR ${d.fixedAmount}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Behavior */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="h-4 w-4" />Behavior Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {behaviorData.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No behavior records</p>
                    ) : (
                      <>
                        <div className="flex gap-2 flex-wrap mb-3">
                          {behaviorData.map(b => (
                            <div key={b.name} className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                              b.name === 'Good' || b.name === 'Appreciation' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {b.name === 'Good' || b.name === 'Appreciation'
                                ? <ThumbsUp className="h-3 w-3" />
                                : <ThumbsDown className="h-3 w-3" />}
                              {b.name}: {b.count as number}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {progress.behavior.recent?.slice(0, 3).map((b: any) => (
                            <div key={b.id} className="flex items-center gap-2 text-xs">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${b.incidentType === 'Good' || b.incidentType === 'Appreciation' ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-muted-foreground">{fmtDate(b.incidentDate)}</span>
                              <span className="truncate">{b.description}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Documents */}
              {progress.documents?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />Documents on File ({progress.documents.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2 flex-wrap">
                      {progress.documents.map((d: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{d.documentType}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
