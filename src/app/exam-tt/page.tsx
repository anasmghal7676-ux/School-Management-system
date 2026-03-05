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
import {
  Loader2, Plus, RefreshCw, Edit, Trash2, Download, Calendar,
  Clock, MapPin, User, BookOpen, Printer,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateShort = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });

const emptyForm = {
  examId: '', classId: '', subjectId: '', examDate: '',
  startTime: '09:00', endTime: '11:00', venue: '', invigilator: '',
  totalMarks: '100', passingMarks: '40', instructions: '',
};

export default function ExamTimetablePage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [byDate, setByDate] = useState<Record<string, any[]>>({});
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [examFilter, setExamFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ examId: examFilter, classId: classFilter });
      const res = await fetch(`/api/exam-tt?${params}`);
      const data = await res.json();
      setSchedules(data.schedules || []);
      setByDate(data.byDate || {});
      if (data.exams) setExams(data.exams);
      if (data.classes) setClasses(data.classes);
    } catch {
      toast({ title: 'Error', description: 'Failed to load', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [examFilter, classFilter]);

  const loadSubjects = useCallback(async () => {
    if (!form.classId) return;
    try {
      const res = await fetch(`/api/cls-subjects?classId=${form.classId}`);
      const data = await res.json();
      setSubjects(data.subjects || data.classSubjects?.map((cs: any) => cs.subject) || []);
    } catch {
      // try plain subjects
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setSubjects(data.subjects || []);
    }
  }, [form.classId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (form.classId) loadSubjects(); }, [form.classId, loadSubjects]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, examId: examFilter, classId: classFilter });
    setShowDialog(true);
  };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      examId: s.examId, classId: s.classId, subjectId: s.subjectId,
      examDate: s.examDate?.slice(0, 10) || '',
      startTime: s.startTime || '09:00', endTime: s.endTime || '11:00',
      venue: s.venue || '', invigilator: s.invigilator || '',
      totalMarks: String(s.totalMarks || 100), passingMarks: String(s.passingMarks || 40),
      instructions: s.instructions || '',
    });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.examId || !form.classId || !form.subjectId || !form.examDate) {
      toast({ title: 'Validation', description: 'Exam, class, subject, and date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await fetch('/api/exam-tt', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: editing.id }) });
        toast({ title: 'Updated' });
      } else {
        await fetch('/api/exam-tt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        toast({ title: 'Schedule added' });
      }
      setShowDialog(false);
      load();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteSchedule = async (s: any) => {
    if (!confirm('Remove this exam schedule?')) return;
    await fetch('/api/exam-tt', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id }) });
    toast({ title: 'Removed' });
    load();
  };

  const exportCsv = () => {
    const headers = ['Date', 'Day', 'Start', 'End', 'Subject', 'Class', 'Venue', 'Invigilator', 'Total Marks'];
    const rows = schedules.map(s => [
      s.examDate?.slice(0, 10), DAY_NAMES[new Date(s.examDate).getDay()],
      s.startTime, s.endTime, s.subject?.name, s.class?.name, s.venue, s.invigilator, s.totalMarks,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `exam-timetable.csv`; a.click();
  };

  const printTimetable = () => window.print();

  const sortedDates = Object.keys(byDate).sort();

  const SUBJECT_COLORS = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700', 'bg-red-100 text-red-700', 'bg-teal-100 text-teal-700', 'bg-indigo-100 text-indigo-700', 'bg-orange-100 text-orange-700'];

  const subjectColorMap: Record<string, string> = {};
  let colorIdx = 0;
  schedules.forEach(s => {
    if (!subjectColorMap[s.subjectId]) {
      subjectColorMap[s.subjectId] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
      colorIdx++;
    }
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Exam Timetable"
        description="Schedule and manage examination dates and venues"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button variant="outline" size="sm" onClick={printTimetable}><Printer className="h-4 w-4 mr-2" />Print</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Schedule</Button>
          </div>
        }
      />

      {/* Filters & View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={examFilter} onValueChange={v => { setExamFilter(v === 'all' ? '' : v); }}>
              <SelectTrigger className="w-56"><SelectValue placeholder="All Exams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.type})</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={v => { setClassFilter(v === 'all' ? '' : v); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="ml-auto flex gap-2">
              <div className="flex rounded-lg border overflow-hidden">
                <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                  Calendar
                </button>
                <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                  List
                </button>
              </div>
              <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No exam schedules found</p>
            <p className="text-sm mt-1">{examFilter ? 'No schedules for this exam yet' : 'Select an exam or add schedules'}</p>
            <Button size="sm" className="mt-4" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add First Schedule</Button>
          </CardContent>
        </Card>
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="space-y-4">
          {sortedDates.map(date => {
            const daySchedules = byDate[date];
            const dayName = DAY_NAMES[new Date(date).getDay()];
            return (
              <Card key={date}>
                <CardHeader className="py-3 px-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{new Date(date).getDate()}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{dayName}</div>
                      <div className="text-xs text-muted-foreground">{fmtDate(date)}</div>
                    </div>
                    <Badge variant="outline" className="ml-auto">{daySchedules.length} exam{daySchedules.length !== 1 ? 's' : ''}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {daySchedules.map((s: any) => (
                      <div key={s.id} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={`text-xs ${subjectColorMap[s.subjectId] || 'bg-slate-100 text-slate-700'}`}>
                            {s.subject?.name}
                          </Badge>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-muted"><Edit className="h-3.5 w-3.5 text-muted-foreground" /></button>
                            <button onClick={() => deleteSchedule(s)} className="p-1 rounded hover:bg-muted"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3 w-3" />
                            <span className="font-medium text-foreground">{s.class?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>{s.startTime} — {s.endTime}</span>
                          </div>
                          {s.venue && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /><span>{s.venue}</span></div>}
                          {s.invigilator && <div className="flex items-center gap-1.5"><User className="h-3 w-3" /><span>{s.invigilator}</span></div>}
                          {s.totalMarks && <div className="text-xs font-medium text-slate-500">Marks: {s.totalMarks} (Pass: {s.passingMarks})</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Invigilator</TableHead>
                  <TableHead className="text-right">Marks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s: any) => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium text-sm">{fmtDateShort(s.examDate)}</div>
                      <div className="text-xs text-muted-foreground">{DAY_NAMES[new Date(s.examDate).getDay()]}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${subjectColorMap[s.subjectId] || ''}`}>{s.subject?.name}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{s.class?.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {s.startTime} — {s.endTime}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.venue || '—'}</TableCell>
                    <TableCell className="text-sm">{s.invigilator || '—'}</TableCell>
                    <TableCell className="text-right text-sm">
                      {s.totalMarks ? <span>{s.totalMarks} <span className="text-muted-foreground text-xs">(Pass: {s.passingMarks})</span></span> : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSchedule(s)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Exam Schedule' : 'Add Exam Schedule'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Exam *</Label>
              <Select value={form.examId} onValueChange={v => setForm({ ...form, examId: v })}>
                <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Class *</Label>
              <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v, subjectId: '' })}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Select value={form.subjectId} onValueChange={v => setForm({ ...form, subjectId: v })}>
                <SelectTrigger><SelectValue placeholder={form.classId ? 'Select subject' : 'Select class first'} /></SelectTrigger>
                <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Exam Date *</Label>
              <Input type="date" value={form.examDate} onChange={e => setForm({ ...form, examDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Venue / Room</Label>
              <Input placeholder="e.g. Hall A, Room 301" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Invigilator</Label>
              <Input placeholder="Supervising teacher" value={form.invigilator} onChange={e => setForm({ ...form, invigilator: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Total Marks</Label>
              <Input type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Passing Marks</Label>
              <Input type="number" value={form.passingMarks} onChange={e => setForm({ ...form, passingMarks: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Special Instructions</Label>
              <Textarea placeholder="Any special instructions for students..." rows={2} value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Update' : 'Add Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
