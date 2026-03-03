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
import { Progress } from '@/components/ui/progress';
import {
  Loader2, Plus, Edit, Trash2, RefreshCw, Search, BookOpen,
  CheckCircle2, Clock, Circle, ChevronDown, ChevronRight, Download,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const TOPIC_STATUSES = ['Pending', 'In Progress', 'Completed'];
const TOPIC_STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-amber-100 text-amber-700',
  Completed: 'bg-green-100 text-green-700',
};
const TOPIC_STATUS_ICONS: Record<string, React.ReactNode> = {
  Pending: <Circle className="h-3.5 w-3.5 text-slate-400" />,
  'In Progress': <Clock className="h-3.5 w-3.5 text-amber-500" />,
  Completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
};

const TERMS = ['Annual', 'Term 1', 'Term 2', 'Term 3', 'Semester 1', 'Semester 2'];
const newTopic = () => ({ id: Date.now().toString(), name: '', description: '', estimatedHours: '', status: 'Pending', completedDate: '' });

function SyllabusProgress({ topics }: { topics: any[] }) {
  if (!topics?.length) return <div className="text-xs text-muted-foreground">No topics added</div>;
  const done = topics.filter(t => t.status === 'Completed').length;
  const pct = Math.round((done / topics.length) * 100);
  return (
    <div className="space-y-1">
      <Progress value={pct} className={`h-1.5 ${pct === 100 ? '[&>div]:bg-green-500' : pct > 50 ? '[&>div]:bg-blue-500' : '[&>div]:bg-amber-500'}`} />
      <p className="text-xs text-muted-foreground">{done}/{topics.length} topics · {pct}%</p>
    </div>
  );
}

const emptySyllabus = { classId: '', subjectId: '', academicYearId: '', title: '', term: 'Annual', textbook: '', objectives: '', topics: [] };

export default function SyllabusPage() {
  const [syllabi, setSyllabi] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, completed: 0, inProgress: 0, notStarted: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [ayFilter, setAyFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptySyllabus);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ classId: classFilter, subjectId: subjectFilter, academicYearId: ayFilter, search });
      const res = await fetch(`/api/syllabus?${params}`);
      const data = await res.json();
      setSyllabi(data.syllabi || []);
      if (data.classes) setClasses(data.classes);
      if (data.subjects) setSubjects(data.subjects);
      if (data.academicYears) setAcademicYears(data.academicYears);
      if (data.summary) setSummary(data.summary);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [classFilter, subjectFilter, ayFilter, search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ ...emptySyllabus }); setShowDialog(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ ...s }); setShowDialog(true); };

  const save = async () => {
    if (!form.classId || !form.subjectId || !form.title) {
      toast({ title: 'Class, subject and title required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch('/api/syllabus', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: editing ? 'Updated' : 'Syllabus created' });
      setShowDialog(false); load();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const updateTopicStatus = async (syllabus: any, topicId: string, status: string) => {
    const topics = syllabus.topics.map((t: any) =>
      t.id === topicId ? { ...t, status, completedDate: status === 'Completed' ? new Date().toISOString().slice(0, 10) : t.completedDate } : t
    );
    await fetch('/api/syllabus', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: syllabus.id, topics }) });
    load();
  };

  const deleteSyllabus = async (s: any) => {
    if (!confirm(`Delete syllabus "${s.title}"?`)) return;
    await fetch('/api/syllabus', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id }) });
    toast({ title: 'Deleted' }); load();
  };

  const addTopic = () => setForm((f: any) => ({ ...f, topics: [...(f.topics || []), newTopic()] }));
  const removeTopic = (id: string) => setForm((f: any) => ({ ...f, topics: f.topics.filter((t: any) => t.id !== id) }));
  const updateTopic = (id: string, field: string, value: string) =>
    setForm((f: any) => ({ ...f, topics: f.topics.map((t: any) => t.id === id ? { ...t, [field]: value } : t) }));

  const toggleExpand = (id: string) => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const exportCsv = () => {
    const rows = [['Class', 'Subject', 'Title', 'Term', 'Total Topics', 'Completed', 'Progress %']];
    syllabi.forEach(s => {
      const done = s.topics?.filter((t: any) => t.status === 'Completed').length || 0;
      const total = s.topics?.length || 0;
      rows.push([classes.find(c => c.id === s.classId)?.name || s.classId, subjects.find(x => x.id === s.subjectId)?.name || s.subjectId, s.title, s.term, total, done, total > 0 ? Math.round((done / total) * 100) + '%' : '0%']);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'syllabus-progress.csv'; a.click();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Syllabus Manager"
        description="Define curriculum topics and track coverage progress per subject"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Syllabus</Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Syllabi', value: summary.total, color: 'border-l-slate-500', icon: <BookOpen className="h-4 w-4 text-slate-500" /> },
          { label: 'Completed', value: summary.completed, color: 'border-l-green-500', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
          { label: 'In Progress', value: summary.inProgress, color: 'border-l-amber-500', icon: <Clock className="h-4 w-4 text-amber-500" /> },
          { label: 'Not Started', value: summary.notStarted, color: 'border-l-red-400', icon: <Circle className="h-4 w-4 text-red-400" /> },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search topics or title..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={ayFilter} onValueChange={v => setAyFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Years" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map(ay => <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={subjectFilter} onValueChange={v => setSubjectFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Subjects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Syllabus Cards */}
      {loading ? (
        <div className="flex justify-center items-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
      ) : syllabi.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No syllabi found</p>
          <Button size="sm" className="mt-4" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Create First Syllabus</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {syllabi.map(s => {
            const cls = classes.find(c => c.id === s.classId);
            const subj = subjects.find(x => x.id === s.subjectId);
            const isExpanded = expanded.has(s.id);
            const topics = s.topics || [];
            const done = topics.filter((t: any) => t.status === 'Completed').length;
            const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;

            return (
              <Card key={s.id}>
                <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/20 card-hover" onClick={() => toggleExpand(s.id)}>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <BookOpen className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{s.title}</span>
                      <Badge variant="outline" className="text-xs">{cls?.name || s.classId}</Badge>
                      <Badge variant="outline" className="text-xs bg-blue-50">{subj?.name || s.subjectId}</Badge>
                      <Badge variant="outline" className="text-xs">{s.term}</Badge>
                    </div>
                    <div className="mt-1.5 max-w-md">
                      <SyllabusProgress topics={topics} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-bold ${pct === 100 ? 'text-green-600' : pct > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{pct}%</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(s); }}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); deleteSyllabus(s); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                {isExpanded && topics.length > 0 && (
                  <div className="border-t">
                    {s.textbook && <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/20">📖 Textbook: {s.textbook}</div>}
                    <div className="divide-y">
                      {topics.map((topic: any, idx: number) => (
                        <div key={topic.id} className="flex items-center gap-3 px-4 py-3">
                          <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">{idx + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{topic.name}</div>
                            {topic.description && <div className="text-xs text-muted-foreground truncate">{topic.description}</div>}
                            {topic.estimatedHours && <div className="text-xs text-muted-foreground">{topic.estimatedHours} hrs</div>}
                          </div>
                          {topic.completedDate && topic.status === 'Completed' && (
                            <span className="text-xs text-muted-foreground">{new Date(topic.completedDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</span>
                          )}
                          <div className="shrink-0">
                            <Select value={topic.status} onValueChange={v => updateTopicStatus(s, topic.id, v)}>
                              <SelectTrigger className="h-7 w-32 text-xs">
                                <div className="flex items-center gap-1">
                                  {TOPIC_STATUS_ICONS[topic.status]}
                                  <span>{topic.status}</span>
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {TOPIC_STATUSES.map(st => (
                                  <SelectItem key={st} value={st}>
                                    <div className="flex items-center gap-1">{TOPIC_STATUS_ICONS[st]}<span>{st}</span></div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isExpanded && topics.length === 0 && (
                  <div className="border-t px-4 py-4 text-sm text-muted-foreground text-center">
                    No topics added yet. <button className="text-primary underline" onClick={() => openEdit(s)}>Edit to add topics</button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Syllabus' : 'Create Syllabus'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Class *</Label>
                <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Select value={form.subjectId} onValueChange={v => setForm({ ...form, subjectId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Academic Year</Label>
                <Select value={form.academicYearId} onValueChange={v => setForm({ ...form, academicYearId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{academicYears.map(ay => <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Term</Label>
                <Select value={form.term} onValueChange={v => setForm({ ...form, term: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Syllabus Title *</Label>
              <Input placeholder="e.g. Mathematics Grade 5 Annual Syllabus" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Textbook / Reference</Label>
              <Input placeholder="Textbook name and edition" value={form.textbook} onChange={e => setForm({ ...form, textbook: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Learning Objectives</Label>
              <Textarea placeholder="Key learning outcomes..." rows={2} value={form.objectives} onChange={e => setForm({ ...form, objectives: e.target.value })} />
            </div>

            {/* Topics */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Topics / Chapters ({form.topics?.length || 0})</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTopic}><Plus className="h-3.5 w-3.5 mr-1" />Add Topic</Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(form.topics || []).map((topic: any, idx: number) => (
                  <div key={topic.id} className="flex gap-2 items-start border rounded-lg p-2 bg-muted/20">
                    <span className="text-xs font-mono text-muted-foreground mt-2 w-5 shrink-0">{idx + 1}.</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input className="h-8 text-sm" placeholder="Topic name *" value={topic.name} onChange={e => updateTopic(topic.id, 'name', e.target.value)} />
                      <Input className="h-8 text-sm" placeholder="Estimated hours" type="number" value={topic.estimatedHours} onChange={e => updateTopic(topic.id, 'estimatedHours', e.target.value)} />
                      <Input className="h-8 text-sm col-span-2" placeholder="Brief description (optional)" value={topic.description} onChange={e => updateTopic(topic.id, 'description', e.target.value)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0 mt-0.5" onClick={() => removeTopic(topic.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {(form.topics || []).length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground border rounded-lg border-dashed">Click "Add Topic" to define curriculum topics</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Create Syllabus'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
