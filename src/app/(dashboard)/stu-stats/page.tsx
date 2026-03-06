'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Search, BarChart3, User, BookOpen, Award } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const gradeColor = (pct: number) => pct >= 80 ? 'text-green-700' : pct >= 60 ? 'text-blue-700' : pct >= 40 ? 'text-amber-700' : 'text-red-700';
const gradeBar = (pct: number) => pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';

export default function StudentAnalyticsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [examStats, setExamStats] = useState<any[]>([]);
  const [performers, setPerformers] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);

  // Individual student
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  const loadClasses = useCallback(async () => {
    const res = await fetch('/api/stu-stats?view=class');
    const data = await res.json();
    setClasses(data.classes || []);
  }, []);

  const loadClass = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/stu-stats?view=class&classId=${selectedClass}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStudents(data.students || []);
      setExamStats(data.examStats || []);
      setPerformers(data.performers || []);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [selectedClass]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { loadClass(); }, [loadClass]);

  const searchedStudents = studentSearch.length > 1
    ? students.filter(s => s.fullName?.toLowerCase().includes(studentSearch.toLowerCase()) || s.admissionNumber?.includes(studentSearch))
    : [];

  const loadStudent = async (student: any) => {
    setSelectedStudent(student); setStudentSearch(''); setStudentLoading(true);
    try {
      const res = await fetch(`/api/stu-stats?view=student&studentId=${student.id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStudentData(data);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setStudentLoading(false); }
  };

  const maxExamAvg = Math.max(...examStats.map(e => e.avg), 1);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Student Performance Analytics" description="Multi-exam trends, subject breakdowns, class rankings and individual progress tracking" />

      <Tabs defaultValue="class">
        <TabsList>
          <TabsTrigger value="class">📊 Class Analytics</TabsTrigger>
          <TabsTrigger value="individual">👤 Individual Student</TabsTrigger>
        </TabsList>

        {/* CLASS TAB */}
        <TabsContent value="class" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select a class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            {selectedClass && <Button variant="outline" size="icon" onClick={loadClass}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>}
          </div>

          {!selectedClass ? (
            <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>Select a class to view analytics</p></CardContent></Card>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Exam Performance Trend */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Exam Performance Trend</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4">
                    {examStats.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No exam data available</p> : (
                      <div className="space-y-3">
                        {examStats.map((e, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium truncate max-w-xs">{e.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">Pass rate: {e.passRate}%</span>
                                <span className={`font-bold ${gradeColor(e.avg)}`}>{e.avg}%</span>
                              </div>
                            </div>
                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${gradeBar(e.avg)}`} style={{ width: `${e.avg}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stats Cards */}
                {examStats.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="border-l-4 border-l-blue-500"><CardContent className="p-3">
                      <p className={`text-2xl font-bold ${gradeColor(Math.round(examStats.reduce((s, e) => s + e.avg, 0) / examStats.length))}`}>{Math.round(examStats.reduce((s, e) => s + e.avg, 0) / examStats.length)}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Overall Avg Score</p>
                    </CardContent></Card>
                    <Card className="border-l-4 border-l-green-500"><CardContent className="p-3">
                      <p className="text-2xl font-bold text-green-700">{students.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Active Students</p>
                    </CardContent></Card>
                    <Card className="border-l-4 border-l-purple-500"><CardContent className="p-3">
                      <p className="text-2xl font-bold text-purple-700">{examStats.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">Exams Analyzed</p>
                    </CardContent></Card>
                  </div>
                )}
              </div>

              {/* Top Performers */}
              <Card>
                <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4 text-yellow-500" />Top Performers</CardTitle></CardHeader>
                <CardContent className="px-4 pb-4">
                  {performers.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No data yet</p> :
                    <div className="space-y-2">
                      {performers.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className={`text-sm font-bold w-5 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.fullName}</p>
                            <p className="text-xs text-muted-foreground">{p.admissionNumber}</p>
                          </div>
                          <span className={`text-sm font-bold ${gradeColor(p.avg)}`}>{p.avg}%</span>
                        </div>
                      ))}
                    </div>
                  }
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* INDIVIDUAL TAB */}
        <TabsContent value="individual" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search student name or admission no..." className="pl-8" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
            {searchedStudents.length > 0 && (
              <div className="absolute top-10 left-0 right-0 bg-white border shadow-lg rounded-lg z-10 max-h-48 overflow-y-auto">
                {searchedStudents.map(s => (
                  <button key={s.id} onClick={() => loadStudent(s)} className="w-full text-left px-4 py-2.5 hover:bg-muted/30 border-b last:border-0 text-sm">
                    <span className="font-medium">{s.fullName}</span><span className="text-muted-foreground ml-2 text-xs">{s.admissionNumber}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!selectedClass && !selectedStudent && <p className="text-sm text-muted-foreground">Select a class above first, then search for a student.</p>}

          {studentLoading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            selectedStudent && studentData ? (
              <div className="space-y-4">
                {/* Student Header */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center"><User className="h-6 w-6 text-blue-700" /></div>
                    <div>
                      <p className="text-lg font-bold">{studentData.student?.fullName}</p>
                      <p className="text-sm text-muted-foreground">{studentData.student?.admissionNumber} · {studentData.student?.class?.name}</p>
                    </div>
                    <div className="ml-auto flex gap-6 text-center">
                      <div><p className="text-2xl font-bold text-blue-700">{studentData.totalExams}</p><p className="text-xs text-muted-foreground">Exams</p></div>
                      <div><p className={`text-2xl font-bold ${gradeColor(studentData.attPct)}`}>{studentData.attPct}%</p><p className="text-xs text-muted-foreground">Attendance</p></div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Exam-by-exam */}
                  <Card>
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Exam Progress</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      {studentData.exams.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No exam marks recorded</p> :
                        <div className="space-y-3">
                          {studentData.exams.map((e: any, i: number) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{e.examName}</span>
                                <span className={`font-bold ${gradeColor(e.avgPct)}`}>{e.avgPct}%</span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full"><div className={`h-full rounded-full ${gradeBar(e.avgPct)}`} style={{ width: `${e.avgPct}%` }} /></div>
                            </div>
                          ))}
                        </div>
                      }
                    </CardContent>
                  </Card>

                  {/* Subject breakdown */}
                  <Card>
                    <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" />Subject Strengths</CardTitle></CardHeader>
                    <CardContent className="px-4 pb-4">
                      {studentData.subjects.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No data</p> :
                        <div className="space-y-2">
                          {studentData.subjects.map((s: any) => (
                            <div key={s.name} className="flex items-center gap-3">
                              <span className="text-sm w-28 truncate">{s.name}</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${gradeBar(s.avg)}`} style={{ width: `${s.avg}%` }} /></div>
                              <span className={`text-sm font-bold w-10 text-right ${gradeColor(s.avg)}`}>{s.avg}%</span>
                              {s.avg >= 80 ? <TrendingUp className="h-3.5 w-3.5 text-green-500 flex-shrink-0" /> : s.avg < 40 ? <TrendingDown className="h-3.5 w-3.5 text-red-500 flex-shrink-0" /> : <span className="w-3.5" />}
                            </div>
                          ))}
                        </div>
                      }
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : selectedStudent && !studentLoading ? (
              <p className="text-sm text-muted-foreground">No data found for this student.</p>
            ) : null
          }
        </TabsContent>
      </Tabs>
    </div>
  );
}
