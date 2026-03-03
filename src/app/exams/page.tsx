'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Plus, Search, Loader2, Edit, Trash2, CalendarDays, ClipboardList, Award, X, MoreHorizontal, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

interface Exam {
  id: string;
  name: string;
  examType: string;
  startDate: string;
  endDate: string;
  passingPercentage: number;
  description: string | null;
  academicYear: { name: string } | null;
  schedules: any[];
  _count: { schedules: number };
}

const EXAM_TYPES = ['Unit Test', 'Mid-Term', 'Send-Up', 'Final Examination', 'Board Exam', 'Practice Test'];
const STATUS_COLOR: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'In Progress': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  Completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

function getExamStatus(exam: Exam): string {
  const now = new Date();
  const start = new Date(exam.startDate);
  const end = new Date(exam.endDate);
  if (now < start) return 'Scheduled';
  if (now > end) return 'Completed';
  return 'In Progress';
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', examType: '', startDate: '', endDate: '', passingPercentage: '33', description: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Marks entry
  const [marksExam, setMarksExam] = useState<Exam | null>(null);
  const [marksClass, setMarksClass] = useState('');
  const [marksSubject, setMarksSubject] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, { obtained: string; absent: boolean }>>({});
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  useEffect(() => { fetchExams(); fetchClasses(); }, []);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.append('search', search);
      const r = await fetch(`/api/exams?${p}`);
      const j = await r.json();
      if (j.success) setExams(j.data.exams || []);
    } catch { toast({ title: 'Error', description: 'Failed to load exams', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(fetchExams, 400); return () => clearTimeout(t); }, [search, fetchExams]);

  const fetchClasses = async () => {
    try {
      const r = await fetch('/api/classes?limit=100');
      const j = await r.json();
      if (j.success) setClasses(j.data?.classes || j.data || []);
    } catch {}
  };

  const fetchSubjectsForClass = async (classId: string) => {
    try {
      const r = await fetch(`/api/subjects?classId=${classId}&limit=50`);
      const j = await r.json();
      if (j.success) setSubjects(j.data?.subjects || j.data || []);
    } catch {}
  };

  const loadStudentsForMarks = async () => {
    if (!marksClass) return;
    setLoadingStudents(true);
    try {
      const r = await fetch(`/api/students?classId=${marksClass}&status=active&limit=100`);
      const j = await r.json();
      if (j.success) {
        const list = j.data.students;
        setStudents(list);
        const init: Record<string, { obtained: string; absent: boolean }> = {};
        list.forEach((s: any) => { init[s.id] = { obtained: '', absent: false }; });
        setMarks(init);
      }
    } catch {} finally { setLoadingStudents(false); }
  };

  useEffect(() => { if (marksClass) { fetchSubjectsForClass(marksClass); loadStudentsForMarks(); } }, [marksClass]);

  const openAdd = () => { setEditExam(null); setForm({ name: '', examType: '', startDate: '', endDate: '', passingPercentage: '33', description: '' }); setDialogOpen(true); };
  const openEdit = (e: Exam) => { setEditExam(e); setForm({ name: e.name, examType: e.examType, startDate: e.startDate?.slice(0,10)||'', endDate: e.endDate?.slice(0,10)||'', passingPercentage: String(e.passingPercentage), description: e.description||'' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.examType || !form.startDate) {
      toast({ title: 'Validation', description: 'Name, type, and start date required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const url = editExam ? `/api/exams/${editExam.id}` : '/api/exams';
      const r = await fetch(url, {
        method: editExam ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, passingPercentage: parseFloat(form.passingPercentage) }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Success', description: editExam ? 'Exam updated' : 'Exam created' });
        setDialogOpen(false); fetchExams();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Save failed', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const r = await fetch(`/api/exams/${deleteId}`, { method: 'DELETE' });
      const j = await r.json();
      if (j.success) { toast({ title: 'Deleted' }); setDeleteId(null); fetchExams(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' }); }
  };

  const handleSaveMarks = async () => {
    if (!marksExam || !marksSubject) return;
    setSavingMarks(true);
    try {
      const marksArray = Object.entries(marks).map(([studentId, m]) => {
        const mk = m as { absent: boolean; obtained: string };
        return {
          studentId,
          marksObtained: mk.absent ? 0 : parseFloat(mk.obtained) || 0,
          isAbsent: mk.absent,
        };
      });
      // Need examScheduleId - try to find or create
      const r = await fetch('/api/exams-marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: marksExam.id, classId: marksClass, subjectId: marksSubject, marks: marksArray, enteredBy: 'System' }),
      });
      const j = await r.json();
      if (j.success) toast({ title: 'Marks Saved', description: `Saved for ${marksArray.length} students` });
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to save marks', variant: 'destructive' }); }
    finally { setSavingMarks(false); }
  };

  const filtered = exams.filter(e => typeFilter === 'all' || e.examType === typeFilter);
  const scheduled = exams.filter(e => getExamStatus(e) === 'Scheduled').length;
  const inProgress = exams.filter(e => getExamStatus(e) === 'In Progress').length;
  const completed = exams.filter(e => getExamStatus(e) === 'Completed').length;

  const uf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div><h1 className="text-3xl font-bold tracking-tight">Exams & Marks</h1><p className="text-muted-foreground">Schedule exams and manage student results</p></div>
          <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Schedule Exam</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label:'Scheduled', count:scheduled, color:'border-l-blue-500 text-blue-600' },
            { label:'In Progress', count:inProgress, color:'border-l-amber-500 text-amber-600' },
            { label:'Completed', count:completed, color:'border-l-green-500 text-green-600' },
          ].map(({ label, count, color }) => (
            <Card key={label} className={`border-l-4 ${color.split(' ')[0]}`}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div><p className="text-sm text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{count}</p></div>
                <CalendarDays className={`h-6 w-6 ${color.split(' ')[1]}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="list">
          <TabsList><TabsTrigger value="list">Exam Schedule</TabsTrigger><TabsTrigger value="marks">Enter Marks</TabsTrigger></TabsList>

          <TabsContent value="list" className="space-y-4 pt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <BookOpen className="h-10 w-10 mb-3" />
                    <p className="font-medium">No exams found</p>
                    <Button className="mt-4" onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Schedule First Exam</Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Schedules</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(e => {
                        const status = getExamStatus(e);
                        return (
                          <TableRow key={e.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="font-medium">{e.name}</TableCell>
                            <TableCell><span className="text-sm">{e.examType}</span></TableCell>
                            <TableCell>{new Date(e.startDate).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(e.endDate).toLocaleDateString()}</TableCell>
                            <TableCell>{e.academicYear?.name || '—'}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[status] || STATUS_COLOR.Scheduled}`}>
                                {status}
                              </span>
                            </TableCell>
                            <TableCell>{e._count?.schedules || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}><Edit className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marks" className="space-y-4 pt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <Label>Exam</Label>
                    <Select value={marksExam?.id || ''} onValueChange={v => setMarksExam(exams.find(e => e.id === v) || null)}>
                      <SelectTrigger className="mt-1 w-52"><SelectValue placeholder="Select exam" /></SelectTrigger>
                      <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Class</Label>
                    <Select value={marksClass} onValueChange={setMarksClass}>
                      <SelectTrigger className="mt-1 w-40"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Select value={marksSubject} onValueChange={setMarksSubject} disabled={!marksClass}>
                      <SelectTrigger className="mt-1 w-44"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {students.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{students.length} Students</CardTitle>
                  <Button onClick={handleSaveMarks} disabled={savingMarks}>
                    {savingMarks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Marks
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead className="w-36">Marks Obtained</TableHead>
                        <TableHead className="w-24">Absent</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s, i) => {
                        const m = marks[s.id];
                        const obtained = parseFloat(m?.obtained) || 0;
                        const grade = obtained >= 80 ? 'A+' : obtained >= 70 ? 'A' : obtained >= 60 ? 'B' : obtained >= 50 ? 'C' : obtained >= 40 ? 'D' : 'F';
                        const gradeColor = grade === 'A+' || grade === 'A' ? 'text-green-600' : grade === 'F' ? 'text-red-600' : '';
                        return (
                          <TableRow key={s.id} className={m?.absent ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                            <TableCell className="text-muted-foreground">{i+1}</TableCell>
                            <TableCell className="font-medium">{s.fullName}</TableCell>
                            <TableCell className="font-mono text-sm">{s.rollNumber || s.admissionNumber}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0" max="100"
                                className="h-8 w-28"
                                disabled={m?.absent}
                                value={m?.obtained || ''}
                                onChange={e => setMarks(prev => ({ ...prev, [s.id]: { ...prev[s.id], obtained: e.target.value } }))}
                                placeholder="0–100"
                              />
                            </TableCell>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={m?.absent || false}
                                onChange={e => setMarks(prev => ({ ...prev, [s.id]: { ...prev[s.id], absent: e.target.checked, obtained: '' } }))}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </TableCell>
                            <TableCell>
                              {m?.absent ? (
                                <span className="text-red-500 text-sm font-medium">ABS</span>
                              ) : obtained > 0 ? (
                                <span className={`font-bold ${gradeColor}`}>{grade}</span>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {!marksClass && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Select exam and class to enter marks</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editExam ? 'Edit Exam' : 'Schedule New Exam'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Exam Name *</Label>
              <Input className="mt-1" value={form.name} onChange={e => uf('name', e.target.value)} placeholder="Mid-Term Examination 2025" />
            </div>
            <div>
              <Label>Exam Type *</Label>
              <Select value={form.examType} onValueChange={v => uf('examType', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{EXAM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input className="mt-1" type="date" value={form.startDate} onChange={e => uf('startDate', e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input className="mt-1" type="date" value={form.endDate} onChange={e => uf('endDate', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Passing Percentage (%)</Label>
              <Input className="mt-1" type="number" min="0" max="100" value={form.passingPercentage} onChange={e => uf('passingPercentage', e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea className="mt-1" value={form.description} onChange={e => uf('description', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editExam ? 'Update' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Exam</DialogTitle><DialogDescription>This will delete the exam and all associated schedules and marks.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
