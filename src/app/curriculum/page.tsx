'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, RefreshCw, Edit, Trash2, BookOpen, CheckCircle2, Clock, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Full Year'];
const STATUS_ICONS: Record<string, React.ReactNode> = {
  Completed: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  'In Progress': <Clock className="h-4 w-4 text-blue-600" />,
  Pending: <Circle className="h-4 w-4 text-slate-400" />,
};
const STATUS_COLORS: Record<string, string> = {
  Completed: 'border-l-green-500 bg-green-50/30',
  'In Progress': 'border-l-blue-500 bg-blue-50/30',
  Pending: 'border-l-slate-300',
};

export default function CurriculumBuilderPage() {
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [collapsedUnits, setCollapsedUnits] = useState<Set<string>>(new Set());

  const emptyForm = () => ({ classId: '', className: '', subjectId: '', subject: '', unitTitle: '', unitNumber: '', topic: '', subtopics: '', learningOutcomes: '', resources: '', teachingMethod: '', assessmentType: '', term: 'Term 1', estimatedPeriods: '', order: items.length + 1, status: 'Pending' });
  const [form, setForm] = useState<any>(emptyForm());
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ classId: classFilter, subjectId: subjectFilter });
      const res = await fetch(`/api/curriculum?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items || []); setClasses(data.classes || []);
      setSubjects(data.subjects || []); setSummary(data.summary || {});
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [classFilter, subjectFilter]);

  useEffect(() => { load(); }, [load]);

  const handleClass = (id: string) => {
    const c = classes.find(x => x.id === id);
    setForm((p: any) => ({ ...p, classId: id, className: c?.name || '' }));
  };
  const handleSubject = (id: string) => {
    const s = subjects.find(x => x.id === id);
    setForm((p: any) => ({ ...p, subjectId: id, subject: s?.name || '' }));
  };

  const save = async () => {
    if (!form.unitTitle || !form.classId || !form.subjectId) { toast({ title: 'Unit title, class and subject required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/curriculum', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) });
      toast({ title: editing ? 'Updated' : 'Topic added' }); setDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/curriculum', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this topic?')) return;
    await fetch('/api/curriculum', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Deleted' }); load();
  };

  // Group by unit
  const grouped: Record<string, any[]> = {};
  items.forEach(item => {
    const key = item.unitTitle || 'Ungrouped';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  const completionPct = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0;

  const toggleUnit = (unit: string) => {
    setCollapsedUnits(prev => {
      const next = new Set(prev);
      next.has(unit) ? next.delete(unit) : next.add(unit);
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Curriculum Builder" description="Plan and track curriculum units, topics and learning outcomes by class and subject"
        actions={<Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Topic</Button>}
      />

      {/* Progress Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-slate-500 md:col-span-1"><CardContent className="p-4"><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs text-muted-foreground mt-1">Total Topics</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-2xl font-bold text-green-700">{summary.completed}</p><p className="text-xs text-muted-foreground mt-1">Completed</p></CardContent></Card>
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-2xl font-bold text-blue-700">{summary.inProgress}</p><p className="text-xs text-muted-foreground mt-1">In Progress</p></CardContent></Card>
        <Card className="border-l-4 border-l-slate-300"><CardContent className="p-4"><p className="text-2xl font-bold text-slate-600">{summary.pending}</p><p className="text-xs text-muted-foreground mt-1">Pending</p></CardContent></Card>
      </div>

      {summary.total > 0 && (
        <Card><CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2"><span className="font-medium">Overall Curriculum Completion</span><span className="font-bold text-primary">{completionPct}%</span></div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
          </div>
        </CardContent></Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={v => setSubjectFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Subjects" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Subjects</SelectItem>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
      </div>

      {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
        items.length === 0 ? (
          <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No curriculum topics added yet</p>
            <Button size="sm" className="mt-3" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add First Topic</Button>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([unit, topics]) => {
              const unitComplete = topics.filter(t => t.status === 'Completed').length;
              const unitPct = Math.round((unitComplete / topics.length) * 100);
              const collapsed = collapsedUnits.has(unit);
              return (
                <Card key={unit} className="overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b cursor-pointer hover:bg-muted/40 transition-colors card-hover" onClick={() => toggleUnit(unit)}>
                    <div className="flex items-center gap-3">
                      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="font-semibold">{unit}</span>
                      <Badge variant="outline" className="text-xs">{topics.length} topics</Badge>
                      {topics[0]?.subject && <Badge variant="secondary" className="text-xs">{topics[0].subject}</Badge>}
                      {topics[0]?.className && <Badge variant="secondary" className="text-xs">{topics[0].className}</Badge>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${unitPct === 100 ? 'bg-green-500' : unitPct > 0 ? 'bg-blue-500' : 'bg-slate-300'}`} style={{ width: `${unitPct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{unitPct}%</span>
                      </div>
                    </div>
                  </div>
                  {!collapsed && (
                    <div className="divide-y">
                      {topics.map(topic => (
                        <div key={topic.id} className={`flex items-start gap-3 px-4 py-3 border-l-4 ${STATUS_COLORS[topic.status || 'Pending']}`}>
                          <button onClick={() => {
                            const next = topic.status === 'Pending' ? 'In Progress' : topic.status === 'In Progress' ? 'Completed' : 'Pending';
                            updateStatus(topic.id, next);
                          }} className="mt-0.5 flex-shrink-0 hover:opacity-70">
                            {STATUS_ICONS[topic.status || 'Pending']}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {topic.unitNumber && <span className="text-xs text-muted-foreground font-mono">{topic.unitNumber}</span>}
                              <span className="font-medium text-sm">{topic.topic || topic.unitTitle}</span>
                              {topic.term && <Badge variant="outline" className="text-xs">{topic.term}</Badge>}
                              {topic.estimatedPeriods && <span className="text-xs text-muted-foreground">📅 {topic.estimatedPeriods} periods</span>}
                            </div>
                            {topic.subtopics && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">• {topic.subtopics}</p>}
                            {topic.learningOutcomes && <p className="text-xs text-muted-foreground line-clamp-1 italic">🎯 {topic.learningOutcomes}</p>}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Select value={topic.status || 'Pending'} onValueChange={v => updateStatus(topic.id, v)}>
                              <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(topic); setForm(topic); setDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(topic.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      }

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Topic' : 'Add Curriculum Topic'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Class *</Label><Select value={form.classId} onValueChange={handleClass}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Subject *</Label><Select value={form.subjectId} onValueChange={handleSubject}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Unit Title *</Label><Input value={form.unitTitle} onChange={e => f('unitTitle', e.target.value)} placeholder="e.g. Unit 1: Introduction to Algebra" /></div>
            <div className="space-y-1.5"><Label>Unit Number</Label><Input value={form.unitNumber} onChange={e => f('unitNumber', e.target.value)} placeholder="1.1, 1.2..." /></div>
            <div className="space-y-1.5"><Label>Term</Label><Select value={form.term} onValueChange={v => f('term', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Topic / Lesson</Label><Input value={form.topic} onChange={e => f('topic', e.target.value)} placeholder="Specific topic or lesson name" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Subtopics</Label><Input value={form.subtopics} onChange={e => f('subtopics', e.target.value)} placeholder="Sub-topics covered" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Learning Outcomes</Label><Textarea value={form.learningOutcomes} onChange={e => f('learningOutcomes', e.target.value)} rows={2} placeholder="What students will be able to do..." /></div>
            <div className="space-y-1.5"><Label>Estimated Periods</Label><Input type="number" value={form.estimatedPeriods} onChange={e => f('estimatedPeriods', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Teaching Method</Label><Input value={form.teachingMethod} onChange={e => f('teachingMethod', e.target.value)} placeholder="e.g. Discussion, Lab, Lecture" /></div>
            <div className="space-y-1.5"><Label>Assessment Type</Label><Input value={form.assessmentType} onChange={e => f('assessmentType', e.target.value)} placeholder="e.g. Quiz, Project, Exam" /></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={v => f('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Resources</Label><Input value={form.resources} onChange={e => f('resources', e.target.value)} placeholder="Textbook pages, links, materials..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Add Topic'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
