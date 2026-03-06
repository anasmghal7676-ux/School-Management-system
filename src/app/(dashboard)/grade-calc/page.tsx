'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, RefreshCw, Calculator, TrendingUp, Award, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const GRADE_SCALES = [
  { label: 'Standard Pakistani (90/80/70/60/50)', grades: [{ min: 90, letter: 'A+', gpa: 4.0, desc: 'Outstanding' }, { min: 80, letter: 'A', gpa: 3.7, desc: 'Excellent' }, { min: 70, letter: 'B', gpa: 3.0, desc: 'Good' }, { min: 60, letter: 'C', gpa: 2.0, desc: 'Satisfactory' }, { min: 50, letter: 'D', gpa: 1.0, desc: 'Pass' }, { min: 0, letter: 'F', gpa: 0.0, desc: 'Fail' }] },
  { label: 'Board (A1/A/B/C/D/E/F)', grades: [{ min: 85, letter: 'A1', gpa: 4.0, desc: 'Outstanding' }, { min: 75, letter: 'A', gpa: 3.7, desc: 'Excellent' }, { min: 65, letter: 'B', gpa: 3.0, desc: 'Good' }, { min: 55, letter: 'C', gpa: 2.0, desc: 'Average' }, { min: 45, letter: 'D', gpa: 1.5, desc: 'Below Avg' }, { min: 33, letter: 'E', gpa: 1.0, desc: 'Pass' }, { min: 0, letter: 'F', gpa: 0.0, desc: 'Fail' }] },
  { label: 'O-Level (A*/A/B/C/D/E/F)', grades: [{ min: 90, letter: 'A*', gpa: 4.0, desc: 'Outstanding' }, { min: 80, letter: 'A', gpa: 3.7, desc: 'Excellent' }, { min: 70, letter: 'B', gpa: 3.3, desc: 'Good' }, { min: 60, letter: 'C', gpa: 2.7, desc: 'Satisfactory' }, { min: 50, letter: 'D', gpa: 2.0, desc: 'Passing' }, { min: 40, letter: 'E', gpa: 1.0, desc: 'Marginal Pass' }, { min: 0, letter: 'F', gpa: 0.0, desc: 'Fail' }] },
];

interface Subject { name: string; marks: string; totalMarks: string; creditHours: string }

function getGrade(pct: number, scale: typeof GRADE_SCALES[0]) {
  for (const g of scale.grades) {
    if (pct >= g.min) return g;
  }
  return scale.grades[scale.grades.length - 1];
}

const GRADE_COLORS: Record<string, string> = { 'A+': 'bg-emerald-100 text-emerald-800', 'A': 'bg-green-100 text-green-800', 'A*': 'bg-emerald-100 text-emerald-800', 'A1': 'bg-emerald-100 text-emerald-800', 'B': 'bg-blue-100 text-blue-800', 'C': 'bg-yellow-100 text-yellow-800', 'D': 'bg-orange-100 text-orange-800', 'E': 'bg-red-100 text-red-800', 'F': 'bg-red-200 text-red-900' };

export default function GradeCalculatorPage() {
  const [scaleIdx, setScaleIdx] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([
    { name: 'Urdu', marks: '', totalMarks: '100', creditHours: '1' },
    { name: 'English', marks: '', totalMarks: '100', creditHours: '1' },
    { name: 'Mathematics', marks: '', totalMarks: '100', creditHours: '1' },
    { name: 'Science', marks: '', totalMarks: '100', creditHours: '1' },
    { name: 'Social Studies', marks: '', totalMarks: '100', creditHours: '1' },
  ]);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [classResults, setClassResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'calculator' | 'class-rank'>('calculator');

  useEffect(() => {
    fetch('/api/classes?limit=100').then(r => r.json()).then(d => setClasses(d.data || d.classes || [])).catch(() => {});
    fetch('/api/exams?limit=50').then(r => r.json()).then(d => setExams(d.data || d.exams || [])).catch(() => {});
  }, []);

  const loadClassResults = useCallback(async () => {
    if (!selectedClass || !selectedExam) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/exam-results?classId=${selectedClass}&examId=${selectedExam}&limit=200`);
      const data = await res.json();
      setClassResults(data.results || data.data || []);
    } catch { toast({ title: 'Error loading results', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [selectedClass, selectedExam]);

  useEffect(() => { loadClassResults(); }, [loadClassResults]);

  const scale = GRADE_SCALES[scaleIdx];

  const calculated = subjects.map(s => {
    const m = parseFloat(s.marks);
    const t = parseFloat(s.totalMarks) || 100;
    const ch = parseFloat(s.creditHours) || 1;
    if (isNaN(m) || s.marks === '') return { ...s, pct: null, grade: null, gpa: null, ch };
    const pct = Math.min(100, Math.round((m / t) * 100 * 100) / 100);
    const g = getGrade(pct, scale);
    return { ...s, pct, grade: g.letter, gpa: g.gpa, desc: g.desc, ch, m, t };
  }).filter(s => s.pct !== null) as any[];

  const totalMarks = calculated.reduce((s, c) => s + (c.m || 0), 0);
  const totalMax = calculated.reduce((s, c) => s + (c.t || 0), 0);
  const overallPct = totalMax > 0 ? Math.round((totalMarks / totalMax) * 100 * 100) / 100 : 0;
  const overallGrade = calculated.length > 0 ? getGrade(overallPct, scale) : null;
  const totalCH = calculated.reduce((s, c) => s + c.ch, 0);
  const weightedGPA = totalCH > 0 ? (calculated.reduce((s, c) => s + c.gpa * c.ch, 0) / totalCH) : 0;

  const updateSubject = (i: number, k: keyof Subject, v: string) => {
    setSubjects(prev => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  };
  const addSubject = () => setSubjects(prev => [...prev, { name: `Subject ${prev.length + 1}`, marks: '', totalMarks: '100', creditHours: '1' }]);
  const delSubject = (i: number) => setSubjects(prev => prev.filter((_, idx) => idx !== i));

  // Class rank calculation
  const rankedResults = classResults.map(r => {
    const marks = r.marksObtained || r.totalMarks || 0;
    const maxMarks = r.totalPossible || r.maxMarks || 600;
    const pct = maxMarks > 0 ? Math.round((marks / maxMarks) * 1000) / 10 : 0;
    const g = getGrade(pct, scale);
    return { ...r, pct, grade: g.letter, gpa: g.gpa };
  }).sort((a, b) => b.pct - a.pct).map((r, i) => ({ ...r, rank: i + 1 }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Grade Calculator" description="Calculate grades, GPA and percentage — or view class ranking for any exam" />

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="calculator">🧮 Grade Calculator</TabsTrigger>
          <TabsTrigger value="class-rank">📊 Class Ranking</TabsTrigger>
          <TabsTrigger value="scale">📋 Grade Scale Reference</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="mt-4 space-y-4">
          <div className="flex gap-3 items-center flex-wrap">
            <Select value={String(scaleIdx)} onValueChange={v => setScaleIdx(Number(v))}>
              <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
              <SelectContent>{GRADE_SCALES.map((s, i) => <SelectItem key={i} value={String(i)}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={addSubject}><Plus className="h-4 w-4 mr-2" />Add Subject</Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Table */}
            <div className="lg:col-span-2 space-y-3">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Enter Marks</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Marks</TableHead><TableHead>Total</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                      {subjects.map((s, i) => {
                        const c = calculated.find((x: any, xi: number) => xi === i - (subjects.length - calculated.length));
                        const raw = s.marks ? parseFloat(s.marks) : null;
                        const total = parseFloat(s.totalMarks) || 100;
                        const pct = raw !== null ? Math.min(100, Math.round((raw / total) * 1000) / 10) : null;
                        const g = pct !== null ? getGrade(pct, scale) : null;
                        return (
                          <TableRow key={i} className="hover:bg-muted/20 transition-colors">
                            <TableCell>
                              <Input value={s.name} onChange={e => updateSubject(i, 'name', e.target.value)} className="h-8 border-0 bg-transparent p-0 text-sm font-medium focus:bg-muted/30 focus:border rounded" />
                            </TableCell>
                            <TableCell>
                              <Input type="number" value={s.marks} onChange={e => updateSubject(i, 'marks', e.target.value)} className="h-8 w-20 text-center" placeholder="0" min="0" max={s.totalMarks} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" value={s.totalMarks} onChange={e => updateSubject(i, 'totalMarks', e.target.value)} className="h-8 w-16 text-center" />
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                              {pct !== null ? <span className={pct >= 50 ? 'text-green-700' : 'text-red-600'}>{pct}%</span> : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              {g ? <Badge className={`text-xs ${GRADE_COLORS[g.letter] || ''}`}>{g.letter}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => delSubject(i)}><Trash2 className="h-3 w-3" /></Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="space-y-4">
              {overallGrade && (
                <Card className="border-2 animate-fade-in-scale" style={{ borderColor: overallPct >= 80 ? '#16a34a' : overallPct >= 60 ? '#2563eb' : overallPct >= 50 ? '#d97706' : '#dc2626' }}>
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="text-5xl font-bold" style={{ color: overallPct >= 80 ? '#16a34a' : overallPct >= 60 ? '#2563eb' : overallPct >= 50 ? '#d97706' : '#dc2626' }}>
                      {overallPct}%
                    </div>
                    <Badge className={`text-lg px-4 py-1 ${GRADE_COLORS[overallGrade.letter] || ''}`}>{overallGrade.letter} — {overallGrade.desc}</Badge>
                    <div className="text-sm text-muted-foreground">
                      <p>{totalMarks} / {totalMax} marks</p>
                      <p className="font-medium">GPA: {weightedGPA.toFixed(2)} / 4.00</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Subject Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {subjects.map((s, i) => {
                    const raw = s.marks ? parseFloat(s.marks) : null;
                    const total = parseFloat(s.totalMarks) || 100;
                    const pct = raw !== null ? Math.min(100, (raw / total) * 100) : null;
                    const g = pct !== null ? getGrade(pct, scale) : null;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1 text-xs truncate font-medium">{s.name}</div>
                        {pct !== null ? (
                          <>
                            <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#16a34a' : pct >= 60 ? '#2563eb' : pct >= 50 ? '#d97706' : '#dc2626' }} />
                            </div>
                            <Badge className={`text-[10px] px-1 ${g ? GRADE_COLORS[g.letter] || '' : ''}`}>{g?.letter}</Badge>
                          </>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="class-rank" className="mt-4 space-y-4">
          <div className="flex gap-3 flex-wrap items-center">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Select Exam" /></SelectTrigger>
              <SelectContent>{exams.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadClassResults} disabled={!selectedClass || !selectedExam}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>

          {loading ? <div className="flex justify-center py-12"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div> :
            rankedResults.length === 0 ? (
              <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>Select class and exam to view rankings</p></CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/40"><TableHead className="w-16">Rank</TableHead><TableHead>Student</TableHead><TableHead>Marks</TableHead><TableHead>%</TableHead><TableHead>Grade</TableHead><TableHead>GPA</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {rankedResults.map(r => (
                        <TableRow key={r.id} className={`transition-colors ${r.rank <= 3 ? 'bg-amber-50/50' : 'hover:bg-muted/20'}`}>
                          <TableCell>
                            <div className={`font-bold text-lg ${r.rank === 1 ? 'text-yellow-600' : r.rank === 2 ? 'text-slate-500' : r.rank === 3 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                              {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{r.studentName || r.student?.fullName}</TableCell>
                          <TableCell>{r.marksObtained || r.totalMarks} / {r.totalPossible || r.maxMarks}</TableCell>
                          <TableCell className="font-semibold">{r.pct}%</TableCell>
                          <TableCell><Badge className={`text-xs ${GRADE_COLORS[r.grade] || ''}`}>{r.grade}</Badge></TableCell>
                          <TableCell className="font-medium">{r.gpa.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          }
        </TabsContent>

        <TabsContent value="scale" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GRADE_SCALES.map((scale, i) => (
              <Card key={i} className="animate-fade-in">
                <CardHeader className="pb-3"><CardTitle className="text-sm">{scale.label}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Grade</TableHead><TableHead>Min %</TableHead><TableHead>GPA</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {scale.grades.map(g => (
                        <TableRow key={g.letter} className="hover:bg-muted/20">
                          <TableCell><Badge className={`text-xs ${GRADE_COLORS[g.letter] || ''}`}>{g.letter}</Badge></TableCell>
                          <TableCell className="text-sm">{g.min}+</TableCell>
                          <TableCell className="font-medium text-sm">{g.gpa.toFixed(1)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{g.desc}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
