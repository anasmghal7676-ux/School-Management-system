'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Save, BookOpen, CheckCircle2, AlertTriangle,
  RefreshCw, Download, ChevronDown,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import { generateTableReport } from '@/lib/pdf-generator';

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-green-600 font-black', 'A': 'text-green-600 font-bold',
  'B':  'text-blue-600 font-bold',   'C': 'text-amber-600 font-bold',
  'D':  'text-orange-600 font-bold', 'F': 'text-red-600 font-bold',
};

const calcGrade = (pct: number) =>
  pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';

export default function GradeBookPage() {
  const [exams, setExams]           = useState<any[]>([]);
  const [classes, setClasses]       = useState<any[]>([]);
  const [sections, setSections]     = useState<any[]>([]);
  const [schedules, setSchedules]   = useState<any[]>([]);

  const [selExam, setSelExam]       = useState('');
  const [selClass, setSelClass]     = useState('');
  const [selSection, setSelSection] = useState('');
  const [selSchedule, setSelSchedule] = useState('');

  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [gradeData, setGradeData]   = useState<any>(null);
  const [marks, setMarks]           = useState<Record<string, { obtained: string | number; absent: boolean }>>({});
  const [dirty, setDirty]           = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { fetchExams(); fetchClasses(); }, []);
  useEffect(() => { if (selClass) fetchSections(selClass); }, [selClass]);
  useEffect(() => { if (selExam && (selSection || selClass)) fetchGradeBook(); }, [selExam, selSection, selClass]);

  const fetchExams = async () => {
    const r = await fetch('/api/exams?limit=50');
    const j = await r.json();
    if (j.success) setExams(j.data?.exams || j.data || []);
  };

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=50');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchSections = async (classId: string) => {
    const r = await fetch(`/api/sections?classId=${classId}&limit=50`);
    const j = await r.json();
    if (j.success) setSections(j.data?.sections || j.data || []);
  };

  const fetchGradeBook = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ examId: selExam });
      if (selSection) p.append('sectionId', selSection);
      else if (selClass) p.append('classId', selClass);
      const r = await fetch(`/api/grade-book?${p}`);
      const j = await r.json();
      if (j.success) {
        const data = j.data;
        setSchedules(data.schedules || []);
        setGradeData(data);
        // If only 1 schedule, auto-select it
        if (data.schedules?.length === 1) {
          setSelSchedule(data.schedules[0].schedule.id);
          initMarks(data.schedules[0].students);
        } else {
          setSelSchedule('');
          setMarks({});
        }
      }
    } catch { toast({ title: 'Error loading grade book', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [selExam, selSection, selClass]);

  const initMarks = (students: any[]) => {
    const init: Record<string, { obtained: string | number; absent: boolean }> = {};
    students.forEach(s => {
      init[s.studentId] = {
        obtained: s.obtainedMarks ?? '',
        absent:   s.isAbsent ?? false,
      };
    });
    setMarks(init);
    setDirty(false);
  };

  // When schedule selection changes
  const handleScheduleChange = (schedId: string) => {
    setSelSchedule(schedId);
    const sched = schedules.find(s => s.schedule.id === schedId);
    if (sched) initMarks(sched.students);
  };

  const currentSchedule = schedules.find(s => s.schedule.id === selSchedule);
  const maxMarks = currentSchedule?.schedule.maxMarks || 100;

  const setObtained = (studentId: string, val: string) => {
    setMarks(m => ({ ...m, [studentId]: { ...m[studentId], obtained: val, absent: false } }));
    setDirty(true);
  };

  const toggleAbsent = (studentId: string) => {
    setMarks(m => ({ ...m, [studentId]: { ...m[studentId], absent: !m[studentId]?.absent, obtained: '' } }));
    setDirty(true);
  };

  // Keyboard nav — Enter moves to next row
  const handleKeyDown = (e: React.KeyboardEvent, idx: number, studentIds: string[]) => {
    if (e.key === 'Enter' && idx < studentIds.length - 1) {
      e.preventDefault();
      inputRefs.current[studentIds[idx + 1]]?.focus();
    }
  };

  const handleSave = async () => {
    if (!selSchedule || !currentSchedule) return;
    setSaving(true);
    try {
      const marksArr = currentSchedule.students.map((s: any) => ({
        studentId:    s.studentId,
        obtainedMarks: marks[s.studentId]?.absent ? null : parseFloat(String(marks[s.studentId]?.obtained)) || null,
        isAbsent:     marks[s.studentId]?.absent || false,
      }));

      const r = await fetch('/api/grade-book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examScheduleId: selSchedule, marks: marksArr }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: `Saved — ${j.data.created} new, ${j.data.updated} updated` });
        setDirty(false);
        fetchGradeBook();
      } else toast({ title: 'Save failed', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const exportCSV = () => {
    if (!currentSchedule) return;
    const rows = [
      ['Roll No', 'Adm No', 'Name', 'Obtained', 'Max', 'Percentage', 'Grade', 'Absent'],
      ...currentSchedule.students.map((s: any) => {
        const obt = marks[s.studentId]?.absent ? '' : (marks[s.studentId]?.obtained ?? s.obtainedMarks ?? '');
        const pct = obt !== '' ? ((parseFloat(String(obt)) / maxMarks) * 100).toFixed(1) : '';
        const grade = pct !== '' ? calcGrade(parseFloat(pct)) : '';
        return [s.rollNumber, s.admissionNumber, s.fullName, obt, maxMarks, pct ? `${pct}%` : '', grade, marks[s.studentId]?.absent ? 'Yes' : 'No'];
      }),
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `marks_${currentSchedule.schedule.subjectName}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const enteredCount = currentSchedule ? currentSchedule.students.filter((s: any) =>
    marks[s.studentId]?.absent || marks[s.studentId]?.obtained !== ''
  ).length : 0;
  const totalStudents = currentSchedule?.students.length || 0;
  const absentCount   = currentSchedule ? currentSchedule.students.filter((s: any) => marks[s.studentId]?.absent).length : 0;
  const enteredMarks  = currentSchedule ? currentSchedule.students.filter((s: any) =>
    !marks[s.studentId]?.absent && marks[s.studentId]?.obtained !== ''
  ).map((s: any) => parseFloat(String(marks[s.studentId]?.obtained))).filter(v => !isNaN(v)) : [];
  const classAvg = enteredMarks.length > 0 ? (enteredMarks.reduce((a, b) => a + b, 0) / enteredMarks.length).toFixed(1) : '—';

  const studentIds = currentSchedule?.students.map((s: any) => s.studentId) || [];

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-7 w-7" />Grade Book
            </h1>
            <p className="text-muted-foreground">Bulk marks entry for exams — enter scores, mark absences, auto-calculate grades</p>
          </div>
          <div className="flex gap-2">
            {dirty && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                <AlertTriangle className="mr-1 h-3 w-3" />Unsaved changes
              </Badge>
            )}
            {currentSchedule && <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />Export CSV</Button>}
            {currentSchedule && <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => window.print()}><Download className="h-4 w-4 mr-2" />PDF</Button>}
            {currentSchedule && (
              <Button onClick={handleSave} disabled={saving || !dirty}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Marks
              </Button>
            )}
          </div>
        </div>

        {/* Selection Controls */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-52">
                <Label className="text-xs text-muted-foreground">Exam *</Label>
                <Select value={selExam} onValueChange={v => { setSelExam(v); setSelSchedule(''); setGradeData(null); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select exam..." /></SelectTrigger>
                  <SelectContent>
                    {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs text-muted-foreground">Class *</Label>
                <Select value={selClass} onValueChange={v => { setSelClass(v); setSelSection(''); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select class..." /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Label className="text-xs text-muted-foreground">Section</Label>
                <Select value={selSection} onValueChange={setSelSection} disabled={!selClass}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="All sections" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sections</SelectItem>
                    {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" onClick={fetchGradeBook} disabled={loading || !selExam}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && <div className="flex justify-center py-16"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>}

        {/* Subject tabs */}
        {!loading && schedules.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {schedules.map(s => (
              <button
                key={s.schedule.id}
                onClick={() => handleScheduleChange(s.schedule.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${selSchedule === s.schedule.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted hover:border-muted-foreground/30'}`}
              >
                {s.schedule.subjectName}
              </button>
            ))}
          </div>
        )}

        {/* Grade entry table */}
        {currentSchedule && (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Students', value: totalStudents, color: 'text-foreground' },
                { label: 'Entered', value: `${enteredCount}/${totalStudents}`, color: 'text-blue-600' },
                { label: 'Absent', value: absentCount, color: 'text-red-600' },
                { label: 'Class Avg', value: classAvg !== '—' ? `${classAvg}/${maxMarks}` : '—', color: 'text-green-600' },
              ].map(s => (
                <Card key={s.label} className="border-0 shadow-sm">
                  <CardContent className="pt-3 pb-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{currentSchedule.schedule.subjectName}</CardTitle>
                    <CardDescription>Max Marks: {maxMarks} · Passing: {currentSchedule.schedule.passingMarks}</CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Press <kbd className="px-1.5 py-0.5 rounded border text-xs">Enter</kbd> to move to next student
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-12">#</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-16">Roll</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Student Name</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-36">Marks (/{maxMarks})</th>
                        <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-20">Absent</th>
                        <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-20">%</th>
                        <th className="text-center px-4 py-2.5 font-medium text-muted-foreground w-16">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSchedule.students.map((s: any, idx: number) => {
                        const isAbsent  = marks[s.studentId]?.absent || false;
                        const obtained  = isAbsent ? '' : (marks[s.studentId]?.obtained ?? '');
                        const numObt    = typeof obtained === 'string' ? parseFloat(obtained) : obtained;
                        const pct       = (!isAbsent && !isNaN(numObt) && String(obtained) !== '') ? (numObt / maxMarks) * 100 : null;
                        const grade     = pct != null ? calcGrade(pct) : null;
                        const isPassing = pct != null ? pct >= ((currentSchedule.schedule.passingMarks / maxMarks) * 100) : null;
                        const rowBg     = isAbsent ? 'bg-red-50/60 dark:bg-red-950/10' : '';

                        return (
                          <tr key={s.studentId} className={`border-b hover:bg-muted/20 ${rowBg}`}>
                            <td className="px-4 py-2 text-muted-foreground text-xs">{idx + 1}</td>
                            <td className="px-4 py-2 font-mono text-xs">{s.rollNumber || '—'}</td>
                            <td className="px-4 py-2 font-medium">{s.fullName}</td>
                            <td className="px-4 py-2">
                              <Input
                                ref={el => { inputRefs.current[s.studentId] = el; }}
                                type="number"
                                min={0}
                                max={maxMarks}
                                step={0.5}
                                value={isAbsent ? '' : obtained}
                                disabled={isAbsent}
                                onChange={e => setObtained(s.studentId, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, idx, studentIds)}
                                placeholder={isAbsent ? 'Absent' : `0–${maxMarks}`}
                                className={`h-8 w-28 text-sm ${isAbsent ? 'opacity-40' : ''}`}
                              />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => toggleAbsent(s.studentId)}
                                className={`h-5 w-5 rounded border-2 mx-auto flex items-center justify-center transition-colors ${
                                  isAbsent
                                    ? 'bg-red-500 border-red-500'
                                    : 'border-gray-300 hover:border-red-400'
                                }`}
                              >
                                {isAbsent && <span className="text-white text-xs font-black">✕</span>}
                              </button>
                            </td>
                            <td className="px-4 py-2 text-center text-xs">
                              {pct != null ? (
                                <span className={isPassing ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                                  {pct.toFixed(1)}%
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {grade ? (
                                <span className={`text-sm font-bold ${GRADE_COLORS[grade] || ''}`}>{grade}</span>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Floating save button for long tables */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={fetchGradeBook} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />Reload
              </Button>
              <Button onClick={handleSave} disabled={saving || !dirty} className="px-8">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save {totalStudents} Marks
              </Button>
            </div>
          </>
        )}

        {!loading && !selExam && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
              <BookOpen className="h-14 w-14 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select an exam and class to begin</p>
              <p className="text-sm">Choose from the dropdowns above to load the grade sheet</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
