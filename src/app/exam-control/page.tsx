'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, RefreshCw, Eye, Trash2, BookOpen, BarChart3, CheckCircle2, Globe, EyeOff, TrendingUp, Award } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const EXAM_TYPES = ['Unit Test', 'Monthly', 'Mid-Term', 'Terminal', 'Annual', 'Mock', 'Pre-Board', 'Board'];
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ExamControlPage() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [marks, setMarks] = useState<any[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dialog, setDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [examForm, setExamForm] = useState({ name: '', examType: 'Terminal', startDate: '', endDate: '', description: '' });
  const [tab, setTab] = useState('overview');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exam-control?view=overview');
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData(d);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadStats = async (exam: any) => {
    setSelectedExam(exam); setStats(null); setStatsLoading(true);
    try {
      const res = await fetch(`/api/exam-control?view=stats&examId=${exam.id}`);
      const d = await res.json();
      setStats(d.stats);
    } finally { setStatsLoading(false); }
  };

  const loadMarks = async (examId: string) => {
    setMarksLoading(true);
    try {
      const params = new URLSearchParams({ view: 'marks', examId, classId: classFilter, subjectId: subjectFilter });
      const res = await fetch(`/api/exam-control?${params}`);
      const d = await res.json();
      setMarks(d.marks || []);
    } finally { setMarksLoading(false); }
  };

  useEffect(() => {
    if (selectedExam && tab === 'marks') loadMarks(selectedExam.id);
  }, [selectedExam, tab, classFilter, subjectFilter]);

  const togglePublish = async (examId: string) => {
    await fetch('/api/exam-control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle_publish', examId }) });
    toast({ title: 'Published status updated' }); load();
  };

  const deleteExam = async (examId: string) => {
    if (!confirm('Delete this exam and ALL marks? This cannot be undone.')) return;
    await fetch('/api/exam-control', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ examId }) });
    toast({ title: 'Exam deleted' }); setSelectedExam(null); load();
  };

  const createExam = async () => {
    if (!examForm.name || !examForm.startDate) { toast({ title: 'Name and start date required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/exam-control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_exam', ...examForm }) });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      toast({ title: 'Exam created' }); setDialog(false); load();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const exams = data.exams || [];
  const published = exams.filter((e: any) => e.isPublished).length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Exam Control Panel" description="Centralized exam management — create exams, view marks, manage results publication"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button size="sm" onClick={() => { setExamForm({ name: '', examType: 'Terminal', startDate: '', endDate: '', description: '' }); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />New Exam</Button>
        </div>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><div className="flex items-center justify-between"><BookOpen className="h-4 w-4 text-blue-500" /><span className="text-2xl font-bold">{exams.length}</span></div><p className="text-xs text-muted-foreground mt-1">Total Exams</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><div className="flex items-center justify-between"><Globe className="h-4 w-4 text-green-500" /><span className="text-2xl font-bold text-green-700">{published}</span></div><p className="text-xs text-muted-foreground mt-1">Published Results</p></CardContent></Card>
        <Card className="border-l-4 border-l-purple-500"><CardContent className="p-4"><div className="flex items-center justify-between"><TrendingUp className="h-4 w-4 text-purple-500" /><span className="text-2xl font-bold">{data.totalMarks || 0}</span></div><p className="text-xs text-muted-foreground mt-1">Total Marks Entered</p></CardContent></Card>
        <Card className="border-l-4 border-l-slate-500"><CardContent className="p-4"><div className="flex items-center justify-between"><Award className="h-4 w-4 text-slate-500" /><span className="text-2xl font-bold">{data.totalStudents || 0}</span></div><p className="text-xs text-muted-foreground mt-1">Active Students</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">All Exams</h3>
          {loading ? <div className="flex justify-center py-8"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div> :
            exams.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-8 text-muted-foreground text-sm"><BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No exams created yet</p></CardContent></Card> :
            exams.map((exam: any) => (
              <Card
                key={exam.id}
                className={`cursor-pointer hover:shadow-sm transition-all ${selectedExam?.id === exam.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => { setSelectedExam(exam); loadStats(exam); setTab('overview'); }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{exam.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs py-0">{exam.examType}</Badge>
                        <span>{fmtDate(exam.startDate)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{exam._count?.marks || 0} marks · {exam._count?.schedules || 0} schedules</div>
                    </div>
                    <div className="flex flex-col gap-1 items-end" onClick={e => e.stopPropagation()}>
                      <Badge className={`text-xs ${exam.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{exam.isPublished ? 'Published' : 'Draft'}</Badge>
                      <div className="flex gap-0.5">
                        <button onClick={() => togglePublish(exam.id)} className="text-muted-foreground hover:text-primary p-0.5" title={exam.isPublished ? 'Unpublish' : 'Publish'}>
                          {exam.isPublished ? <EyeOff className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                        </button>
                        <button onClick={() => deleteExam(exam.id)} className="text-muted-foreground hover:text-red-500 p-0.5"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>

        {/* Exam Detail */}
        <div className="lg:col-span-2">
          {!selectedExam ? (
            <Card className="h-full border-dashed"><CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm"><div className="text-center"><Eye className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>Select an exam to view details</p></div></CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="py-3 px-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{selectedExam.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={`${selectedExam.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{selectedExam.isPublished ? 'Published' : 'Draft'}</Badge>
                    <Button variant="outline" size="sm" className="h-7" onClick={() => togglePublish(selectedExam.id)}>
                      {selectedExam.isPublished ? <><EyeOff className="h-3.5 w-3.5 mr-1" />Unpublish</> : <><Globe className="h-3.5 w-3.5 mr-1" />Publish</>}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="rounded-none border-b w-full justify-start h-9 px-4 bg-transparent">
                  <TabsTrigger value="overview" className="h-8">Overview</TabsTrigger>
                  <TabsTrigger value="marks" className="h-8" onClick={() => loadMarks(selectedExam.id)}>Marks</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Type: </span>{selectedExam.examType}</div>
                    <div><span className="text-muted-foreground">Marks entered: </span><strong>{selectedExam._count?.marks || 0}</strong></div>
                    <div><span className="text-muted-foreground">Start: </span>{fmtDate(selectedExam.startDate)}</div>
                    <div><span className="text-muted-foreground">End: </span>{fmtDate(selectedExam.endDate)}</div>
                  </div>
                  {statsLoading ? <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> :
                    stats && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          {[{ label: 'Students', value: stats.total }, { label: 'Present', value: stats.present }, { label: 'Absent', value: stats.absent }].map(k => (
                            <div key={k.label} className="bg-muted/20 rounded-lg p-3 text-center"><p className="text-xl font-bold">{k.value}</p><p className="text-xs text-muted-foreground">{k.label}</p></div>
                          ))}
                        </div>
                        <div className="bg-muted/20 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Average Score</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.avgPct}%` }} /></div>
                            <span className="font-bold text-blue-700">{stats.avgPct}%</span>
                          </div>
                        </div>
                        {Object.keys(stats.grades || {}).length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Grade Distribution</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(stats.grades || {}).sort().map(([grade, count]: [string, any]) => (
                                <div key={grade} className="bg-blue-50 border border-blue-200 rounded px-3 py-1.5 text-center">
                                  <p className="font-bold text-blue-800 text-sm">{grade}</p>
                                  <p className="text-xs text-muted-foreground">{count} students</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {stats.topMarks?.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Top Performers</p>
                            <div className="space-y-1.5">
                              {stats.topMarks.map((m: any, i: number) => (
                                <div key={m.id} className="flex items-center justify-between text-sm bg-muted/20 rounded p-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold w-5 text-center">{i+1}</span>
                                    <span>{m.student?.fullName}</span>
                                    <span className="text-xs text-muted-foreground">{m.student?.admissionNumber}</span>
                                  </div>
                                  <Badge className="bg-green-100 text-green-700">{m.obtainedMarks}/{m.totalMarks}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }
                </TabsContent>

                <TabsContent value="marks" className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="All Classes" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(data.classes||[]).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                    <Select value={subjectFilter} onValueChange={v => setSubjectFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="All Subjects" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(data.subjects||[]).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
                    <Button variant="outline" size="sm" onClick={() => loadMarks(selectedExam.id)}><RefreshCw className="h-3.5 w-3.5" /></Button>
                  </div>
                  {marksLoading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> :
                    marks.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">No marks found for selected filters</div> :
                    <div className="overflow-auto max-h-[50vh]">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b bg-muted/30 sticky top-0">
                          <th className="p-2 text-left">Student</th><th className="p-2 text-left">Class</th><th className="p-2 text-left">Subject</th>
                          <th className="p-2 text-right">Obtained</th><th className="p-2 text-right">Total</th><th className="p-2 text-center">%</th><th className="p-2 text-center">Grade</th>
                        </tr></thead>
                        <tbody>
                          {marks.map((m: any) => {
                            const pct = m.totalMarks > 0 ? Math.round((m.obtainedMarks / m.totalMarks) * 100) : 0;
                            return (
                              <tr key={m.id} className="border-b hover:bg-muted/20">
                                <td className="p-2 font-medium">{m.student?.fullName}</td>
                                <td className="p-2 text-muted-foreground">{m.student?.class?.name}</td>
                                <td className="p-2">{m.subject?.name}</td>
                                <td className="p-2 text-right">{m.isAbsent ? <span className="text-red-600">Absent</span> : m.obtainedMarks}</td>
                                <td className="p-2 text-right">{m.totalMarks}</td>
                                <td className="p-2 text-center">{m.isAbsent ? '—' : `${pct}%`}</td>
                                <td className="p-2 text-center"><Badge className="text-xs py-0">{m.grade || '—'}</Badge></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  }
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create New Exam</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Exam Name *</Label><Input value={examForm.name} onChange={e => setExamForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mid-Term Examination 2026" /></div>
            <div className="space-y-1.5"><Label>Exam Type</Label><Select value={examForm.examType} onValueChange={v => setExamForm(f => ({ ...f, examType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start Date *</Label><Input type="date" value={examForm.startDate} onChange={e => setExamForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={examForm.endDate} onChange={e => setExamForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={createExam} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
