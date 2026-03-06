'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, BookOpen, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—';
const today = new Date().toISOString().slice(0, 10);

export default function HomeworkTrackerPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, overdue: 0 });
  const [classFilter, setClassFilter] = useState('');
  const [selectedHw, setSelectedHw] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hwDialog, setHwDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyHw = () => ({ title: '', description: '', classId: '', className: '', subjectId: '', subjectName: '', teacherId: '', teacherName: '', assignedDate: today, dueDate: '', maxMarks: '10', instructions: '' });
  const [hwForm, setHwForm] = useState<any>(emptyHw());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ classId: classFilter });
      const res = await fetch(`/api/hw-tracker?${params}`);
      const data = await res.json();
      setAssignments(data.assignments || []); setClasses(data.classes || []); setSubjects(data.subjects || []); setStaff(data.staff || []); setSummary(data.summary || {});
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [classFilter]);

  const loadSubmissions = useCallback(async (hw: any) => {
    setSelectedHw(hw); setLoading(true);
    try {
      const res = await fetch(`/api/hw-tracker?view=submissions&hwId=${hw.id}&classId=${hw.classId}`);
      const data = await res.json();
      setSubmissions(data.submissions || []); setStudents(data.students || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleHwClass = (id: string) => { const c = classes.find(x => x.id === id); setHwForm((f: any) => ({ ...f, classId: id, className: c?.name || '' })); };
  const handleHwSubject = (id: string) => { const s = subjects.find(x => x.id === id); setHwForm((f: any) => ({ ...f, subjectId: id, subjectName: s?.name || '' })); };
  const handleHwTeacher = (id: string) => { const s = staff.find(x => x.id === id); setHwForm((f: any) => ({ ...f, teacherId: id, teacherName: s?.fullName || '' })); };

  const saveHw = async () => {
    if (!hwForm.title || !hwForm.classId || !hwForm.dueDate) { toast({ title: 'Title, class and due date required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/hw-tracker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...hwForm, entity: 'assignment' }) });
      toast({ title: 'Homework assigned' }); setHwDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const markSubmission = async (student: any, submittedDate: string, marks?: string) => {
    const existing = submissions.find(s => s.studentId === student.id && s.hwId === selectedHw.id);
    if (existing) {
      await fetch('/api/hw-tracker', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existing.id, entity: 'submission', submittedAt: submittedDate, marksAwarded: marks, status: 'Submitted' }) });
    } else {
      await fetch('/api/hw-tracker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hwId: selectedHw.id, studentId: student.id, studentName: student.fullName, className: student.class?.name, submittedAt: submittedDate, marksAwarded: marks, status: 'Submitted', entity: 'submission' }) });
    }
    loadSubmissions(selectedHw);
  };

  const delHw = async (id: string) => {
    if (!confirm('Delete assignment?')) return;
    await fetch('/api/hw-tracker', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity: 'assignment' }) });
    toast({ title: 'Deleted' }); if (selectedHw?.id === id) setSelectedHw(null); load();
  };

  const isOverdue = (hw: any) => hw.dueDate < today;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Homework Tracker" description="Assign homework to classes, track submissions and record marks"
        actions={<Button size="sm" onClick={() => { setHwForm(emptyHw()); setHwDialog(true); }}><Plus className="h-4 w-4 mr-2" />Assign Homework</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><BookOpen className="h-3 w-3" />Total Assignments</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-2xl font-bold text-green-700">{summary.active}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Active (due soon)</p></CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="p-4"><p className="text-2xl font-bold text-red-700">{summary.overdue}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Overdue</p></CardContent></Card>
      </div>

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">📚 Assignments ({assignments.length})</TabsTrigger>
          <TabsTrigger value="submissions" disabled={!selectedHw}>📋 Submissions {selectedHw ? `— ${selectedHw.title}` : ''}</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-44"><SelectValue placeholder="All Classes" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>

          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            assignments.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No homework assigned yet</p></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {assignments.map(hw => {
                const overdueFlag = isOverdue(hw);
                return (
                  <Card key={hw.id} className={`hover:shadow-md transition-all ${overdueFlag ? 'border-red-200' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{hw.title}</p>
                          <div className="flex gap-1.5 flex-wrap mt-1">
                            <Badge variant="secondary" className="text-xs">{hw.className}</Badge>
                            {hw.subjectName && <Badge className="text-xs bg-blue-100 text-blue-700">{hw.subjectName}</Badge>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => delHw(hw.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                        {hw.teacherName && <p>👤 {hw.teacherName}</p>}
                        <p>📅 Assigned: {fmtDate(hw.assignedDate)}</p>
                        <p className={overdueFlag ? 'text-red-600 font-medium' : ''}>⏰ Due: {fmtDate(hw.dueDate)} {overdueFlag && '⚠️ OVERDUE'}</p>
                        <p>Max Marks: {hw.maxMarks}</p>
                      </div>
                      {hw.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">{hw.description}</p>}
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{hw.submissionCount || 0} submitted</Badge>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => loadSubmissions(hw)}>View Submissions →</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          }
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          {!selectedHw ? <p className="text-muted-foreground text-center py-8">Select an assignment to view submissions</p> :
            loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <p className="font-semibold">{selectedHw.title}</p>
                <p className="text-muted-foreground text-xs">{selectedHw.className} · Due: {fmtDate(selectedHw.dueDate)} · Max: {selectedHw.maxMarks} marks</p>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-green-700 font-medium">✓ {submissions.length} submitted</span>
                  <span className="text-amber-700">⏳ {students.length - submissions.length} pending</span>
                </div>
              </div>

              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Roll #</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead className="text-right">Marks / Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {students.map(s => {
                      const sub = submissions.find(x => x.studentId === s.id);
                      return (
                        <TableRow key={s.id} className={`hover:bg-muted/20 ${sub ? '' : 'opacity-70'}`}>
                          <TableCell className="font-medium text-sm">{s.fullName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{s.rollNumber}</TableCell>
                          <TableCell><Badge className={`text-xs ${sub ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{sub ? '✓ Submitted' : 'Pending'}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{sub ? fmtDate(sub.submittedAt) : '—'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              {sub && <span className="text-xs font-medium">{sub.marksAwarded || '—'}/{selectedHw.maxMarks}</span>}
                              {!sub ? (
                                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => markSubmission(s, today)}>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />Mark Submitted
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { const m = prompt(`Marks for ${s.fullName} (max ${selectedHw.maxMarks}):`); if (m !== null) markSubmission(s, sub.submittedAt || today, m); }}>Edit Marks</Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </div>
          }
        </TabsContent>
      </Tabs>

      <Dialog open={hwDialog} onOpenChange={setHwDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Homework</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Title *</Label><Input value={hwForm.title} onChange={e => setHwForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 5 Exercise" /></div>
            <div className="space-y-1.5"><Label>Class *</Label><Select value={hwForm.classId} onValueChange={handleHwClass}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Subject</Label><Select value={hwForm.subjectId} onValueChange={handleHwSubject}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Teacher</Label><Select value={hwForm.teacherId} onValueChange={handleHwTeacher}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Max Marks</Label><Input type="number" value={hwForm.maxMarks} onChange={e => setHwForm((f: any) => ({ ...f, maxMarks: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Assigned Date</Label><Input type="date" value={hwForm.assignedDate} onChange={e => setHwForm((f: any) => ({ ...f, assignedDate: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Due Date *</Label><Input type="date" value={hwForm.dueDate} onChange={e => setHwForm((f: any) => ({ ...f, dueDate: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description / Instructions</Label><Textarea value={hwForm.description} onChange={e => setHwForm((f: any) => ({ ...f, description: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setHwDialog(false)}>Cancel</Button><Button onClick={saveHw} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
