'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, BookOpen, Save, RefreshCw, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, AlertTriangle, Download, Award,
  Users, Target, TrendingUp, FileText, Filter, Search,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import { generateTableReport } from '@/lib/pdf-generator';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

function getGrade(pct: number) {
  if (pct >= 90) return { grade: 'A+', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (pct >= 80) return { grade: 'A',  color: 'text-green-700 bg-green-50 border-green-200' };
  if (pct >= 70) return { grade: 'B',  color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (pct >= 60) return { grade: 'C',  color: 'text-teal-700 bg-teal-50 border-teal-200' };
  if (pct >= 50) return { grade: 'D',  color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return                 { grade: 'F',  color: 'text-red-700 bg-red-50 border-red-200' };
}

export default function MarkEntryPage() {
  // Step 1: selection
  const [exams,    setExams]    = useState<any[]>([]);
  const [classes,  setClasses]  = useState<any[]>([]);
  const [selExam,  setSelExam]  = useState('');
  const [selClass, setSelClass] = useState('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selSched,  setSelSched]  = useState('');

  // Step 2: mark entry
  const [students,  setStudents]  = useState<any[]>([]);
  const [markData,  setMarkData]  = useState<Record<string, { marks: string; absent: boolean; remarks: string }>>({});
  const [savedMap,  setSavedMap]  = useState<Record<string, any>>({});
  const [schedule,  setSchedule]  = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [enteredBy, setEnteredBy] = useState('');
  const [search,    setSearch]    = useState('');
  const [verifying, setVerifying] = useState(false);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { fetchExams(); fetchClasses(); }, []);
  useEffect(() => { if (selExam && selClass) fetchSchedules(); }, [selExam, selClass]);
  useEffect(() => { if (selSched) loadMarks(); }, [selSched]);

  const fetchExams = async () => {
    const r = await fetch('/api/exams?limit=50');
    const j = await r.json();
    if (j.success) setExams(j.data?.exams || j.data || []);
  };

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=60');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchSchedules = async () => {
    const r = await fetch(`/api/exam-schedules?examId=${selExam}&classId=${selClass}`);
    const j = await r.json();
    if (j.success) {
      const list = j.data?.schedules || j.data || [];
      setSchedules(list);
      if (list.length === 1) setSelSched(list[0].id);
    }
  };

  const loadMarks = async () => {
    if (!selSched || !selClass) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/marks?scheduleId=${selSched}&classId=${selClass}`);
      const j = await r.json();
      if (j.success) {
        const { students: studs, markMap, marks } = j.data;
        setStudents(studs);
        const sched = marks[0]?.examSchedule || schedules.find(s => s.id === selSched);
        setSchedule(sched);
        setSavedMap(markMap);
        // Init markData from saved
        const init: Record<string, any> = {};
        studs.forEach((s: any) => {
          const saved = markMap[s.id];
          init[s.id] = {
            marks:   saved?.marksObtained != null ? String(saved.marksObtained) : '',
            absent:  saved?.isAbsent      || false,
            remarks: saved?.remarks        || '',
          };
        });
        setMarkData(init);
      }
    } finally { setLoading(false); }
  };

  const handleMarkChange = (studentId: string, value: string) => {
    setMarkData(m => ({ ...m, [studentId]: { ...m[studentId], marks: value } }));
  };

  const handleAbsentToggle = (studentId: string) => {
    setMarkData(m => ({
      ...m,
      [studentId]: { ...m[studentId], absent: !m[studentId].absent, marks: !m[studentId].absent ? '' : m[studentId].marks },
    }));
  };

  const handleRemarksChange = (studentId: string, value: string) => {
    setMarkData(m => ({ ...m, [studentId]: { ...m[studentId], remarks: value } }));
  };

  const focusNext = (studentId: string) => {
    const ids      = filteredStudents.map(s => s.id);
    const idx      = ids.indexOf(studentId);
    const nextId   = ids[idx + 1];
    if (nextId && inputRefs.current[nextId]) inputRefs.current[nextId]?.focus();
  };

  const handleSave = async () => {
    if (!selSched) { toast({ title: 'Select exam schedule first', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const entries = students.map(s => ({
        studentId:     s.id,
        marksObtained: markData[s.id]?.absent ? null : (markData[s.id]?.marks !== '' ? markData[s.id]?.marks : null),
        isAbsent:      markData[s.id]?.absent || false,
        remarks:       markData[s.id]?.remarks || null,
      }));

      const r = await fetch('/api/marks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId: selSched, entries, enteredBy }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: `Marks saved`, description: `${j.data.saved} of ${j.data.total} entries saved` });
        loadMarks();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const markAllAbsent = () => {
    setMarkData(m => {
      const upd = { ...m };
      students.forEach(s => { upd[s.id] = { ...upd[s.id], absent: true, marks: '' }; });
      return upd;
    });
  };

  const clearAll = () => {
    setMarkData(m => {
      const upd = { ...m };
      students.forEach(s => { upd[s.id] = { marks: '', absent: false, remarks: '' }; });
      return upd;
    });
  };

  const exportCSV = () => {
    const maxM = schedule?.maxMarks || 100;
    const rows = [
      ['Roll No', 'Student Name', 'Admission No', 'Marks', 'Max Marks', '%', 'Grade', 'Status', 'Remarks'],
      ...students.map(s => {
        const d   = markData[s.id];
        const pct = d?.marks && !d?.absent ? ((parseFloat(d.marks) / maxM) * 100).toFixed(1) : '';
        const gr  = pct ? getGrade(parseFloat(pct)).grade : '';
        return [
          s.rollNumber || '', s.fullName, s.admissionNumber,
          d?.absent ? 'Absent' : d?.marks || '', maxM,
          pct, gr,
          d?.absent ? 'Absent' : d?.marks ? 'Entered' : 'Pending',
          d?.remarks || '',
        ];
      }),
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `marks-${selSched}.csv`;
    a.click();
  };

  // Derived stats
  const filteredStudents = students.filter(s =>
    !search || s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.includes(search) || s.admissionNumber?.includes(search)
  );

  const maxM      = schedule?.maxMarks || 100;
  const passM     = schedule?.passMarks ?? (maxM * 0.33);
  const entered   = students.filter(s => markData[s.id]?.marks !== '' || markData[s.id]?.absent).length;
  const absentCnt = students.filter(s => markData[s.id]?.absent).length;
  const passedCnt = students.filter(s => {
    const d = markData[s.id];
    return !d?.absent && d?.marks !== '' && parseFloat(d?.marks) >= passM;
  }).length;
  const enteredWithMarks = students.filter(s => !markData[s.id]?.absent && markData[s.id]?.marks !== '');
  const avgMark = enteredWithMarks.length > 0
    ? (enteredWithMarks.reduce((s, st) => s + parseFloat(markData[st.id].marks || '0'), 0) / enteredWithMarks.length)
    : null;
  const entryPct = students.length > 0 ? Math.round((entered / students.length) * 100) : 0;
  const passPct  = enteredWithMarks.length > 0 ? Math.round((passedCnt / enteredWithMarks.length) * 100) : 0;

  const selectedSchedule = schedules.find(s => s.id === selSched);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50"><BookOpen className="h-6 w-6 text-blue-600" /></span>
              Mark Entry
            </h1>
            <p className="text-muted-foreground mt-0.5">Enter and manage student exam marks</p>
          </div>
        </div>

        {/* Selection panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Filter className="h-4 w-4" />Select Exam & Class</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Exam *</Label>
                <Select value={selExam} onValueChange={v => { setSelExam(v); setSelSched(''); setSchedules([]); }}>
                  <SelectTrigger><SelectValue placeholder="Choose exam…" /></SelectTrigger>
                  <SelectContent>
                    {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.examType})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Class *</Label>
                <Select value={selClass} onValueChange={v => { setSelClass(v); setSelSched(''); setSchedules([]); }}>
                  <SelectTrigger><SelectValue placeholder="Choose class…" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Subject / Schedule *</Label>
                <Select value={selSched} onValueChange={setSelSched} disabled={!schedules.length}>
                  <SelectTrigger><SelectValue placeholder={schedules.length ? 'Choose subject…' : 'Select exam & class first'} /></SelectTrigger>
                  <SelectContent>
                    {schedules.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.subject?.name} — {fmtDate(s.examDate)} ({s.maxMarks} marks)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selSched && selectedSchedule && (
              <div className="mt-4 flex flex-wrap gap-4 p-3 bg-muted/30 rounded-xl text-sm">
                <div><span className="text-muted-foreground">Subject: </span><span className="font-semibold">{selectedSchedule.subject?.name}</span></div>
                <div><span className="text-muted-foreground">Date: </span><span className="font-semibold">{fmtDate(selectedSchedule.examDate)}</span></div>
                <div><span className="text-muted-foreground">Max Marks: </span><span className="font-semibold">{selectedSchedule.maxMarks}</span></div>
                <div><span className="text-muted-foreground">Pass Marks: </span><span className="font-semibold">{selectedSchedule.passMarks}</span></div>
                {selectedSchedule.roomNumber && <div><span className="text-muted-foreground">Room: </span><span className="font-semibold">{selectedSchedule.roomNumber}</span></div>}
              </div>
            )}
          </CardContent>
        </Card>

        {selSched && students.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', val: String(students.length), sub: `${entered} entered`, color: 'text-slate-700',  bg: 'bg-slate-50'  },
                { label: 'Entry Progress', val: `${entryPct}%`,          sub: `${entered}/${students.length}`, color: 'text-blue-700',  bg: 'bg-blue-50'  },
                { label: 'Pass Rate',      val: `${passPct}%`,           sub: `${passedCnt} passed`,           color: 'text-green-700', bg: 'bg-green-50' },
                { label: 'Class Average',  val: avgMark ? `${avgMark.toFixed(1)}` : '—', sub: avgMark ? `${((avgMark/maxM)*100).toFixed(0)}%` : 'No data', color: 'text-purple-700', bg: 'bg-purple-50' },
              ].map(({ label, val, sub, color, bg }) => (
                <Card key={label} className="overflow-hidden">
                  <CardContent className={`pt-4 pb-3 ${bg}`}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`text-2xl font-bold ${color} mt-0.5`}>{val}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground w-24 text-right">Entry progress</span>
              <Progress value={entryPct} className="flex-1 h-2" />
              <span className="font-semibold w-10">{entryPct}%</span>
            </div>

            {/* Controls */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-48">
                    <Label className="text-xs mb-1.5 block">Entered By (Teacher Name)</Label>
                    <Input value={enteredBy} onChange={e => setEnteredBy(e.target.value)} placeholder="Your name…" />
                  </div>
                  <div className="w-56">
                    <Label className="text-xs mb-1.5 block">Search Student</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, roll, admission…" className="pl-8" />
                    </div>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm" onClick={clearAll}>Clear All</Button>
                    <Button variant="outline" size="sm" onClick={markAllAbsent}>Mark All Absent</Button>
                    <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-1.5 h-3.5 w-3.5" />CSV</Button>
                    <Button variant="outline" size="sm" onClick={() => loadMarks()} disabled={loading}>
                      <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Reload
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Marks
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mark entry table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="pl-4 w-10">#</TableHead>
                        <TableHead className="w-12">Roll</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="w-32">Admission No</TableHead>
                        <TableHead className="w-36">
                          Marks <span className="text-muted-foreground font-normal">/ {maxM}</span>
                        </TableHead>
                        <TableHead className="w-24">Absent</TableHead>
                        <TableHead className="w-20">%</TableHead>
                        <TableHead className="w-16">Grade</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, idx) => {
                        const d         = markData[student.id] || { marks: '', absent: false, remarks: '' };
                        const isAbsent  = d.absent;
                        const markVal   = d.marks;
                        const markNum   = markVal !== '' && !isAbsent ? parseFloat(markVal) : null;
                        const pct       = markNum != null ? (markNum / maxM) * 100 : null;
                        const gradeInfo = pct != null ? getGrade(pct) : null;
                        const isPassed  = markNum != null && markNum >= passM;
                        const isSaved   = savedMap[student.id];
                        const isDirty   = isSaved && (
                          String(isSaved.marksObtained) !== markVal ||
                          isSaved.isAbsent !== isAbsent
                        );

                        return (
                          <TableRow key={student.id} className={`${isAbsent ? 'bg-red-50/40' : ''} hover:bg-muted/10`}>
                            <TableCell className="pl-4 text-xs text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="text-xs font-mono font-semibold">{student.rollNumber || '—'}</TableCell>
                            <TableCell>
                              <span className="font-medium text-sm">{student.fullName}</span>
                              {isDirty && <span className="ml-1.5 text-[10px] text-amber-600 font-semibold">unsaved</span>}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{student.admissionNumber}</TableCell>
                            <TableCell>
                              <Input
                                ref={el => { inputRefs.current[student.id] = el; }}
                                type="number"
                                min={0}
                                max={maxM}
                                value={isAbsent ? '' : markVal}
                                disabled={isAbsent}
                                onChange={e => handleMarkChange(student.id, e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); focusNext(student.id); } }}
                                placeholder={isAbsent ? 'Absent' : '0'}
                                className={`h-8 text-sm font-mono ${isAbsent ? 'bg-muted text-muted-foreground' : ''} ${markNum != null && markNum > maxM ? 'border-red-400' : ''}`}
                              />
                              {markNum != null && markNum > maxM && (
                                <p className="text-[10px] text-red-500 mt-0.5">Exceeds max</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => handleAbsentToggle(student.id)}
                                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${isAbsent ? 'bg-red-500 border-red-500 text-white' : 'border-muted-foreground/30 hover:border-red-400 hover:bg-red-50'}`}
                              >
                                {isAbsent ? <XCircle className="h-4 w-4" /> : <span className="text-xs text-muted-foreground">A</span>}
                              </button>
                            </TableCell>
                            <TableCell>
                              {isAbsent ? (
                                <span className="text-xs text-red-500 font-medium">Absent</span>
                              ) : pct != null ? (
                                <span className={`text-sm font-bold ${pct >= 33 ? 'text-green-600' : 'text-red-600'}`}>{pct.toFixed(0)}%</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {gradeInfo && !isAbsent ? (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${gradeInfo.color}`}>{gradeInfo.grade}</span>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              {isAbsent ? (
                                <span className="text-xs text-red-500">Absent</span>
                              ) : markNum != null ? (
                                isPassed
                                  ? <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Pass</span>
                                  : <span className="text-xs text-red-500 flex items-center gap-1"><XCircle className="h-3 w-3" />Fail</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Pending</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={d.remarks}
                                onChange={e => handleRemarksChange(student.id, e.target.value)}
                                placeholder="Optional…"
                                className="h-8 text-xs"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Grade distribution summary */}
            {enteredWithMarks.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" />Grade Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {['A+', 'A', 'B', 'C', 'D', 'F'].map(grade => {
                      const count = enteredWithMarks.filter(s => {
                        const pct = (parseFloat(markData[s.id].marks) / maxM) * 100;
                        return getGrade(pct).grade === grade;
                      }).length;
                      const gradeInfo = getGrade(grade === 'A+' ? 95 : grade === 'A' ? 85 : grade === 'B' ? 75 : grade === 'C' ? 65 : grade === 'D' ? 55 : 30);
                      return (
                        <div key={grade} className={`rounded-xl p-3 text-center border ${gradeInfo.color}`}>
                          <div className="text-2xl font-black">{grade}</div>
                          <div className="text-lg font-bold mt-0.5">{count}</div>
                          <div className="text-xs opacity-70">{enteredWithMarks.length > 0 ? `${Math.round((count/enteredWithMarks.length)*100)}%` : '0%'}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save button (sticky footer style) */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => loadMarks()} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Reload Saved
              </Button>
              <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 px-8">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save All Marks ({entered} entered)
              </Button>
            </div>
          </>
        )}

        {selSched && students.length === 0 && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-semibold">No students found in this class</p>
            </CardContent>
          </Card>
        )}

        {!selSched && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <BookOpen className="h-14 w-14 mb-4 text-blue-300" />
              <p className="font-bold text-lg text-blue-900">Select an Exam, Class, and Subject</p>
              <p className="text-sm text-blue-600 mt-2 max-w-md">
                Choose an exam, then select the class and subject/schedule to begin entering marks.
                Use the keyboard (Enter/Tab) to navigate quickly between cells.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
