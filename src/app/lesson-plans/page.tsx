'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, Download, BookOpen, Eye, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected'];
const METHODS = ['Lecture', 'Discussion', 'Activity-Based', 'Project-Based', 'Demonstration', 'Flipped Classroom', 'Collaborative', 'Problem-Solving'];
const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-600',
  Submitted: 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Get week start (Monday) for a given date
const getWeekOf = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().slice(0, 10);
};

export default function LessonPlansPage() {
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [weekFilter, setWeekFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const emptyForm = () => ({
    teacherId: '', teacherName: '', classId: '', className: '', subjectId: '', subjectName: '',
    weekOf: getWeekOf(), topic: '', subtopic: '', duration: '40',
    objectives: '', teachingMethod: 'Lecture', materials: '', activities: '',
    assessment: '', homework: '', notes: '', status: 'Draft',
  });
  const [form, setForm] = useState<any>(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, classId: classFilter, subjectId: subjectFilter, week: weekFilter, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/lesson-plans?${params}`);
      const data = await res.json();
      setItems(data.items || []); setTotal(data.total || 0);
      if (data.classes) setClasses(data.classes);
      if (data.subjects) setSubjects(data.subjects);
      if (data.staff) setStaff(data.staff);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, classFilter, subjectFilter, weekFilter, page]);

  useEffect(() => { load(); }, [load]);

  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleTeacher = (id: string) => {
    const t = staff.find(s => s.id === id);
    setForm((p: any) => ({ ...p, teacherId: id, teacherName: t?.fullName || '' }));
  };
  const handleClass = (id: string) => {
    const c = classes.find(x => x.id === id);
    setForm((p: any) => ({ ...p, classId: id, className: c?.name || '' }));
  };
  const handleSubject = (id: string) => {
    const s = subjects.find(x => x.id === id);
    setForm((p: any) => ({ ...p, subjectId: id, subjectName: s?.name || '' }));
  };

  const save = async () => {
    if (!form.topic || !form.classId || !form.subjectId) { toast({ title: 'Topic, class and subject required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/lesson-plans', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) });
      toast({ title: editing ? 'Plan updated' : 'Lesson plan created' });
      setDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (item: any) => {
    if (!confirm('Delete lesson plan?')) return;
    await fetch('/api/lesson-plans', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
    toast({ title: 'Deleted' }); load();
  };

  const printPlan = (item: any) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Lesson Plan</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;font-size:12px} h1{font-size:16px;border-bottom:2px solid #000;padding-bottom:8px} .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px} .label{font-weight:bold;color:#555} .section{margin-bottom:12px;border:1px solid #ddd;padding:8px;border-radius:4px} .section h3{font-size:12px;font-weight:bold;margin:0 0 4px 0;color:#333}</style>
    </head><body>
    <h1>Lesson Plan — ${item.topic}</h1>
    <div class="grid">
      <div><span class="label">Teacher:</span> ${item.teacherName || '—'}</div>
      <div><span class="label">Class:</span> ${item.className}</div>
      <div><span class="label">Subject:</span> ${item.subjectName}</div>
      <div><span class="label">Week of:</span> ${fmtDate(item.weekOf)}</div>
      <div><span class="label">Duration:</span> ${item.duration} minutes</div>
      <div><span class="label">Method:</span> ${item.teachingMethod}</div>
    </div>
    ${item.objectives ? `<div class="section"><h3>Learning Objectives</h3><p>${item.objectives.replace(/\n/g,'<br>')}</p></div>` : ''}
    ${item.activities ? `<div class="section"><h3>Activities / Procedure</h3><p>${item.activities.replace(/\n/g,'<br>')}</p></div>` : ''}
    ${item.materials ? `<div class="section"><h3>Materials & Resources</h3><p>${item.materials}</p></div>` : ''}
    ${item.assessment ? `<div class="section"><h3>Assessment</h3><p>${item.assessment}</p></div>` : ''}
    ${item.homework ? `<div class="section"><h3>Homework</h3><p>${item.homework}</p></div>` : ''}
    ${item.notes ? `<div class="section"><h3>Notes</h3><p>${item.notes}</p></div>` : ''}
    </body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  const approved = items.filter(i => i.status === 'Approved').length;
  const pending = items.filter(i => i.status === 'Submitted').length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Lesson Plans" description="Create, submit, and track weekly lesson plans for all subjects and classes"
        actions={<Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />New Lesson Plan</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><div className="flex items-center justify-between"><BookOpen className="h-4 w-4 text-blue-500" /><span className="text-2xl font-bold">{total}</span></div><p className="text-xs text-muted-foreground mt-1">Total Plans</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><div className="flex items-center justify-between"><BookOpen className="h-4 w-4 text-green-500" /><span className="text-2xl font-bold text-green-700">{approved}</span></div><p className="text-xs text-muted-foreground mt-1">Approved</p></CardContent></Card>
        <Card className={`border-l-4 ${pending > 0 ? 'border-l-amber-500' : 'border-l-slate-300'}`}><CardContent className="p-4"><div className="flex items-center justify-between"><BookOpen className="h-4 w-4 text-amber-500" /><span className="text-2xl font-bold">{pending}</span></div><p className="text-xs text-muted-foreground mt-1">Awaiting Review</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4"><div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search topic or teacher..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="All Classes" /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={subjectFilter} onValueChange={v => setSubjectFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="All Subjects" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
        <Input type="week" value={weekFilter} onChange={e => { const val = e.target.value; setWeekFilter(val ? val + '-1' : ''); }} className="w-44" placeholder="Filter by week" />
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex justify-center items-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div> :
          items.length === 0 ? <div className="text-center py-16 text-muted-foreground"><BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No lesson plans found</p><Button size="sm" className="mt-3" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Create First Plan</Button></div> :
          <Table>
            <TableHeader><TableRow>
              <TableHead>Topic</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Class / Subject</TableHead>
              <TableHead>Week Of</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell><div className="font-medium text-sm">{item.topic}</div>{item.subtopic && <div className="text-xs text-muted-foreground">{item.subtopic}</div>}</TableCell>
                  <TableCell className="text-sm">{item.teacherName || '—'}</TableCell>
                  <TableCell><div className="text-sm font-medium">{item.className}</div><div className="text-xs text-muted-foreground">{item.subjectName}</div></TableCell>
                  <TableCell className="text-sm">{fmtDate(item.weekOf)}</TableCell>
                  <TableCell className="text-sm">{item.duration} min</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.teachingMethod}</Badge></TableCell>
                  <TableCell><Badge className={`text-xs ${STATUS_COLORS[item.status]}`}>{item.status}</Badge></TableCell>
                  <TableCell className="text-right"><div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setViewing(item); setViewDialog(true); }}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => printPlan(item)}><Download className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setForm(item); setDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
        {Math.ceil(total / limit) > 1 && <div className="flex items-center justify-between px-4 py-3 border-t"><p className="text-sm text-muted-foreground">{(page-1)*limit+1}–{Math.min(page*limit,total)} of {total}</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage(p=>p-1)} disabled={page===1}>Previous</Button><Button variant="outline" size="sm" onClick={() => setPage(p=>p+1)} disabled={page>=Math.ceil(total/limit)}>Next</Button></div></div>}
      </CardContent></Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Lesson Plan' : 'New Lesson Plan'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Topic *</Label><Input value={form.topic} onChange={e => f('topic', e.target.value)} placeholder="Main lesson topic" /></div>
            <div className="space-y-1.5"><Label>Subtopic / Chapter</Label><Input value={form.subtopic} onChange={e => f('subtopic', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Teacher</Label><Select value={form.teacherId} onValueChange={handleTeacher}><SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Class *</Label><Select value={form.classId} onValueChange={handleClass}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Subject *</Label><Select value={form.subjectId} onValueChange={handleSubject}><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Week Of</Label><Input type="date" value={form.weekOf} onChange={e => f('weekOf', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={form.duration} onChange={e => f('duration', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Teaching Method</Label><Select value={form.teachingMethod} onValueChange={v => f('teachingMethod', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={v => f('status', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Learning Objectives</Label><Textarea value={form.objectives} onChange={e => f('objectives', e.target.value)} rows={3} placeholder="By end of lesson, students will be able to..." /></div>
            <div className="col-span-2 space-y-1.5"><Label>Activities / Procedure</Label><Textarea value={form.activities} onChange={e => f('activities', e.target.value)} rows={3} placeholder="Step-by-step lesson procedure..." /></div>
            <div className="col-span-2 space-y-1.5"><Label>Materials & Resources</Label><Input value={form.materials} onChange={e => f('materials', e.target.value)} placeholder="Textbook, whiteboard, projector, worksheets..." /></div>
            <div className="space-y-1.5"><Label>Assessment</Label><Input value={form.assessment} onChange={e => f('assessment', e.target.value)} placeholder="Quiz, oral questions, etc." /></div>
            <div className="space-y-1.5"><Label>Homework</Label><Input value={form.homework} onChange={e => f('homework', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Save Plan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewing && <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewing.topic}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="grid grid-cols-2 gap-2 bg-muted/20 p-3 rounded-lg text-xs">
              <div><span className="text-muted-foreground">Teacher: </span><strong>{viewing.teacherName || '—'}</strong></div>
              <div><span className="text-muted-foreground">Class: </span><strong>{viewing.className}</strong></div>
              <div><span className="text-muted-foreground">Subject: </span>{viewing.subjectName}</div>
              <div><span className="text-muted-foreground">Week: </span>{fmtDate(viewing.weekOf)}</div>
              <div><span className="text-muted-foreground">Duration: </span>{viewing.duration} min</div>
              <div><span className="text-muted-foreground">Method: </span>{viewing.teachingMethod}</div>
            </div>
            {[['Learning Objectives', viewing.objectives], ['Activities / Procedure', viewing.activities], ['Materials', viewing.materials], ['Assessment', viewing.assessment], ['Homework', viewing.homework], ['Notes', viewing.notes]].map(([label, val]) => val ? (
              <div key={label as string}>
                <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                <p className="whitespace-pre-wrap text-sm">{val}</p>
              </div>
            ) : null)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => printPlan(viewing)}>Print</Button>
            <Button onClick={() => setViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
    </div>
  );
}
