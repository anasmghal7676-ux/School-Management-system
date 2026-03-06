'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Plus, Search, Edit, RefreshCw, TrendingUp, Award, Users, BookOpen } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const CRITERIA = ['Teaching Quality','Student Engagement','Subject Knowledge','Punctuality','Administrative Compliance','Communication','Professional Development','Student Results'];

export default function TeacherPerformancePage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [staff, setStaff]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState('');
  const [dialog, setDialog]           = useState(false);
  const [editing, setEditing]         = useState<any>(null);

  const EMPTY = {
    staffId: '', evaluatorName: '', evaluationDate: new Date().toISOString().slice(0,10),
    period: 'Term 1', scores: CRITERIA.reduce((acc, c) => ({ ...acc, [c]: 3 }), {}),
    strengths: '', improvements: '', overallComments: '', recommendation: 'Satisfactory',
  };
  const [form, setForm] = useState<any>(EMPTY);
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const setScore = (criterion: string, score: number) => setForm((p: any) => ({ ...p, scores: { ...p.scores, [criterion]: score } }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, sRes] = await Promise.all([
        fetch('/api/teacher-perf?limit=200'),
        fetch('/api/staff?limit=200&status=active&staffType=Teacher'),
      ]);
      const [eData, sData] = await Promise.all([eRes.json(), sRes.json()]);
      if (eData.success) setEvaluations(eData.data || []);
      if (sData.success) setStaff(sData.data?.staff || sData.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (e: any) => { setEditing(e); setForm({ ...EMPTY, ...e, scores: e.scores || EMPTY.scores }); setDialog(true); };

  const save = async () => {
    if (!form.staffId) { toast({ title: 'Please select a teacher', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const avg = Object.values(form.scores as Record<string, number> || {}).reduce((s: number, v: number) => s + Number(v), 0) / CRITERIA.length;
      const payload = { ...form, overallScore: Math.round(avg * 20) };  // convert 1-5 to 1-100
      const url = editing ? `/api/teacher-perf/${editing.id}` : '/api/teacher-perf';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `✅ Evaluation ${editing ? 'updated' : 'submitted'}` });
      setDialog(false); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const filtered = evaluations.filter(e => {
    const q = search.toLowerCase();
    return !search || e.staff?.fullName?.toLowerCase().includes(q);
  });

  // Compute average scores per teacher
  const teacherScores = staff.map(s => {
    const evals = evaluations.filter(e => e.staffId === s.id);
    const avg = evals.length > 0 ? Math.round(evals.reduce((sum, e) => sum + (e.overallScore || 0), 0) / evals.length) : 0;
    return { ...s, avgScore: avg, evalCount: evals.length };
  }).sort((a, b) => b.avgScore - a.avgScore);

  const excellent  = teacherScores.filter(t => t.avgScore >= 80).length;
  const satisfactory = teacherScores.filter(t => t.avgScore >= 60 && t.avgScore < 80).length;
  const needsWork  = teacherScores.filter(t => t.avgScore > 0 && t.avgScore < 60).length;

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', cls: 'bg-emerald-100 text-emerald-700' };
    if (score >= 80) return { grade: 'A', cls: 'bg-green-100 text-green-700' };
    if (score >= 70) return { grade: 'B', cls: 'bg-blue-100 text-blue-700' };
    if (score >= 60) return { grade: 'C', cls: 'bg-amber-100 text-amber-700' };
    if (score > 0)   return { grade: 'D', cls: 'bg-red-100 text-red-700' };
    return { grade: '—', cls: 'bg-gray-100 text-gray-500' };
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`text-xl transition-transform hover:scale-110 ${n <= value ? 'text-amber-400' : 'text-gray-200'}`}>★</button>
      ))}
      <span className="text-sm text-muted-foreground ml-1">{value}/5</span>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Teacher Performance"
        description="Evaluate teachers, track performance metrics and give feedback"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />New Evaluation</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Evaluations', value: evaluations.length, icon: Star, color: 'border-l-amber-500' },
          { label: 'Excellent (80+)', value: excellent, icon: Award, color: 'border-l-green-500' },
          { label: 'Satisfactory', value: satisfactory, icon: TrendingUp, color: 'border-l-blue-500' },
          { label: 'Needs Improvement', value: needsWork, icon: BookOpen, color: 'border-l-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              <Icon className="h-6 w-6 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="teachers">
        <TabsList>
          <TabsTrigger value="teachers">Teacher Scores</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations ({filtered.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="teachers" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-muted/40"><TableHead>Teacher</TableHead><TableHead>Designation</TableHead><TableHead className="text-center">Evaluations</TableHead><TableHead>Score</TableHead><TableHead className="text-center">Grade</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {teacherScores.map(t => {
                    const { grade, cls } = getGrade(t.avgScore);
                    return (
                      <TableRow key={t.id} className="hover:bg-muted/20 transition-colors group">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">{t.fullName?.[0]}</div>
                            <div><p className="font-medium text-sm">{t.fullName}</p><p className="text-xs text-muted-foreground">{t.department?.name}</p></div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.designation}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline">{t.evalCount}</Badge></TableCell>
                        <TableCell className="w-44">
                          <div className="flex items-center gap-2">
                            <Progress value={t.avgScore} className="flex-1 h-2" />
                            <span className="text-sm font-medium w-10 text-right">{t.avgScore > 0 ? `${t.avgScore}%` : '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center"><Badge className={`text-xs ${cls}`}>{grade}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setForm({...EMPTY, staffId: t.id}); setDialog(true); }}>
                            <Plus className="h-3.5 w-3.5 mr-1" />Evaluate
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search teacher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="grid gap-3">
            {filtered.map(e => {
              const { grade, cls } = getGrade(e.overallScore || 0);
              return (
                <Card key={e.id} className="card-hover">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{e.staff?.fullName}</p>
                        <Badge variant="outline" className="text-xs">{e.period}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Evaluated on {e.evaluationDate ? new Date(e.evaluationDate).toLocaleDateString('en-PK') : '—'} by {e.evaluatorName || 'Admin'}</p>
                      {e.strengths && <p className="text-xs text-muted-foreground mt-1 truncate">💪 {e.strengths}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{e.overallScore || 0}%</p>
                        <p className="text-xs text-muted-foreground">{e.recommendation}</p>
                      </div>
                      <Badge className={`text-sm ${cls} w-10 h-10 rounded-full flex items-center justify-center font-bold`}>{grade}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Edit className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'New'} Teacher Evaluation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Teacher *</Label>
                <Select value={form.staffId} onValueChange={v => f('staffId', v)} disabled={!!editing}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Period</Label>
                <Select value={form.period} onValueChange={v => f('period', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Term 1','Term 2','Term 3','Mid Year','Annual'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Evaluation Date</Label><Input type="date" value={form.evaluationDate} onChange={e => f('evaluationDate', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Evaluator Name</Label><Input value={form.evaluatorName} onChange={e => f('evaluatorName', e.target.value)} /></div>
            </div>

            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
              <p className="font-medium text-sm">Performance Criteria (Rate 1-5 ★)</p>
              {CRITERIA.map(c => (
                <div key={c} className="flex items-center justify-between gap-4">
                  <span className="text-sm min-w-0 flex-1">{c}</span>
                  <StarRating value={form.scores?.[c] || 3} onChange={v => setScore(c, v)} />
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Overall Score</span>
                  <span className="font-bold text-blue-600">
                    {Math.round(Object.values(form.scores as Record<string,number> || {}).reduce((s: any, v: any) => s + Number(v), 0) / CRITERIA.length * 20)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5"><Label>Key Strengths</Label><Textarea value={form.strengths} onChange={e => f('strengths', e.target.value)} rows={2} /></div>
            <div className="space-y-1.5"><Label>Areas for Improvement</Label><Textarea value={form.improvements} onChange={e => f('improvements', e.target.value)} rows={2} /></div>
            <div className="space-y-1.5"><Label>Recommendation</Label>
              <Select value={form.recommendation} onValueChange={v => f('recommendation', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Excellent','Satisfactory','Needs Improvement','Probation','Termination Recommended'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              {editing ? 'Update' : 'Submit Evaluation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
