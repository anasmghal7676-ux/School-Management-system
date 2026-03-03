'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Loader2, BarChart3, TrendingUp, Users, Star, Award,
  RefreshCw, BookOpen, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const GRADE_COLORS: Record<string, string> = {
  'A+': '#10b981', 'A': '#22c55e', 'B+': '#14b8a6', 'B': '#3b82f6',
  'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444',
};
const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AnalyticsPage() {
  const [overview, setOverview]   = useState<any>(null);
  const [exams, setExams]         = useState<any[]>([]);
  const [selExam, setSelExam]     = useState('');
  const [classData, setClassData] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [examLoading, setExamLoading] = useState(false);

  useEffect(() => { fetchOverview(); fetchExams(); }, []);
  useEffect(() => { if (selExam) fetchExamAnalytics(selExam); }, [selExam]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/analytics?type=overview');
      const j = await r.json();
      if (j.success) setOverview(j.data);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const fetchExams = async () => {
    const r = await fetch('/api/exams?limit=50');
    const j = await r.json();
    if (j.success) {
      const list = j.data?.exams || j.data || [];
      setExams(list);
      if (list.length > 0) setSelExam(list[0].id);
    }
  };

  const fetchExamAnalytics = async (examId: string) => {
    setExamLoading(true);
    try {
      const [classRes, subjectRes] = await Promise.all([
        fetch(`/api/analytics?type=class-comparison&examId=${examId}`).then(r => r.json()),
        fetch(`/api/analytics?type=subject-analysis&examId=${examId}`).then(r => r.json()),
      ]);
      if (classRes.success)   setClassData(classRes.data.classComparison   || []);
      if (subjectRes.success) setSubjectData(subjectRes.data.subjectAnalysis || []);
    } catch {} finally { setExamLoading(false); }
  };

  const ov = overview?.overview || {};
  const subjectPerf = overview?.subjectPerformance || [];
  const gradeDist   = overview?.gradeDistribution  || [];
  const att         = overview?.attendance || {};

  const attTotal = (att.present || 0) + (att.absent || 0) + (att.late || 0);
  const attPct   = attTotal > 0 ? ((att.present / attTotal) * 100).toFixed(1) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-7 w-7" />Academic Analytics
            </h1>
            <p className="text-muted-foreground">Performance insights across classes, subjects and exams</p>
          </div>
          <Button variant="outline" onClick={() => { fetchOverview(); if (selExam) fetchExamAnalytics(selExam); }} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>

        {/* Overview KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Students', value: (ov.totalStudents || 0).toLocaleString(), icon: Users,        color: 'border-l-blue-500',   text: 'text-blue-600' },
            { label: 'Total Exams',    value: (ov.totalExams    || 0).toLocaleString(), icon: BookOpen,     color: 'border-l-purple-500', text: 'text-purple-600' },
            { label: 'Overall Pass Rate', value: `${ov.passRate || 0}%`, icon: CheckCircle2, color: ov.passRate >= 70 ? 'border-l-green-500' : 'border-l-amber-500', text: ov.passRate >= 70 ? 'text-green-600' : 'text-amber-600' },
            { label: 'Attendance Rate', value: `${attPct}%`, icon: Star, color: Number(attPct) >= 80 ? 'border-l-emerald-500' : 'border-l-red-500', text: Number(attPct) >= 80 ? 'text-emerald-600' : 'text-red-600' },
          ].map(({ label, value, icon: Icon, color, text }) => (
            <Card key={label} className={`border-l-4 ${color}`}>
              <CardContent className="pt-4 pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mt-1" /> : <p className={`text-2xl font-bold ${text} mt-0.5`}>{value}</p>}
                  </div>
                  <Icon className={`h-5 w-5 ${text}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="exam">Exam Analysis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">

              {/* Grade Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4" />Grade Distribution
                  </CardTitle>
                  <CardDescription>Across all exams</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center h-52 items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : gradeDist.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={gradeDist}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" name="Students" radius={[4,4,0,0]}>
                          {gradeDist.map((g: any, i: number) => (
                            <Cell key={i} fill={GRADE_COLORS[g.grade] || '#6b7280'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">No mark data yet</div>
                  )}
                </CardContent>
              </Card>

              {/* Subject Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />Top Subject Performance
                  </CardTitle>
                  <CardDescription>Average percentage by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center h-52 items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : subjectPerf.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={subjectPerf.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="subjectName" tick={{ fontSize: 11 }} width={80} />
                        <Tooltip formatter={(v: number) => `${v}%`} />
                        <Bar dataKey="avgPercentage" name="Avg %" radius={[0,4,4,0]}>
                          {subjectPerf.slice(0,8).map((_: any, i: number) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-52 text-muted-foreground text-sm">No exam data yet</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Attendance Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">School-wide Attendance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Present', count: att.present || 0, color: 'bg-green-500', pct: attTotal > 0 ? ((att.present || 0)/attTotal*100).toFixed(1) : 0 },
                      { label: 'Absent',  count: att.absent  || 0, color: 'bg-red-500',   pct: attTotal > 0 ? ((att.absent  || 0)/attTotal*100).toFixed(1) : 0 },
                      { label: 'Late',    count: att.late    || 0, color: 'bg-amber-500', pct: attTotal > 0 ? ((att.late    || 0)/attTotal*100).toFixed(1) : 0 },
                    ].map(({ label, count, color, pct }) => (
                      <div key={label} className="p-4 rounded-xl border">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`h-3 w-3 rounded-full ${color}`} />
                          <span className="font-medium text-sm">{label}</span>
                        </div>
                        <p className="text-2xl font-bold">{count.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{pct}% of total</p>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exam Analysis Tab */}
          <TabsContent value="exam" className="space-y-6">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <Label className="whitespace-nowrap">Exam:</Label>
                  <Select value={selExam} onValueChange={setSelExam}>
                    <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select exam..." /></SelectTrigger>
                    <SelectContent>
                      {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.title} ({e.examType})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {examLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </CardContent>
            </Card>

            {examLoading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Class Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Class Performance Comparison</CardTitle>
                    <CardDescription>Average percentage and pass rate per class</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {classData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={classData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v: number) => `${v}%`} />
                            <Legend />
                            <Bar dataKey="avgPercentage" name="Avg %" fill="#3b82f6" radius={[4,4,0,0]} />
                            <Bar dataKey="passRate"      name="Pass %" fill="#10b981" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <Table className="mt-4">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Class</TableHead>
                              <TableHead>Students</TableHead>
                              <TableHead>Avg %</TableHead>
                              <TableHead>Pass Rate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {classData.sort((a: any, b: any) => b.avgPercentage - a.avgPercentage).map((c: any, i: number) => (
                              <TableRow key={c.classId} className="hover:bg-muted/20 transition-colors">
                                <TableCell className="font-medium">
                                  {i === 0 && <Star className="inline h-3.5 w-3.5 text-amber-400 mr-1" />}
                                  {c.className}
                                </TableCell>
                                <TableCell>{c.studentCount}</TableCell>
                                <TableCell>
                                  <span className={`font-bold ${c.avgPercentage >= 70 ? 'text-green-600' : c.avgPercentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {c.avgPercentage}%
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className={`font-semibold ${c.passRate >= 80 ? 'text-green-600' : c.passRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {c.passRate}%
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                        <div className="text-center">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          No class data for this exam
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Subject Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Subject-wise Analysis</CardTitle>
                    <CardDescription>Difficulty and performance per subject</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subjectData.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Avg %</TableHead>
                            <TableHead>Pass %</TableHead>
                            <TableHead>High / Low</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subjectData.sort((a: any, b: any) => b.avgPercentage - a.avgPercentage).map((s: any) => (
                            <TableRow key={s.subjectCode} className="hover:bg-muted/20 transition-colors">
                              <TableCell>
                                <div className="font-medium text-sm">{s.subjectName}</div>
                                <div className="text-xs text-muted-foreground font-mono">{s.subjectCode}</div>
                              </TableCell>
                              <TableCell>
                                <span className={`font-bold text-sm ${s.avgPercentage >= 70 ? 'text-green-600' : s.avgPercentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {s.avgPercentage}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`text-sm font-semibold ${s.passRate >= 80 ? 'text-green-600' : s.passRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {s.passRate}%
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                <span className="text-green-600">{s.highest}%</span> / <span className="text-red-600">{s.lowest}%</span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                        <div className="text-center">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          No subject data for this exam
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}
