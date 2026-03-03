'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarCheck, Users, CheckCircle2, XCircle, Clock, Loader2, Save, UserCheck, UserX } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

interface ClassItem { id: string; name: string; }
interface SectionItem { id: string; name: string; classId: string; }
interface Student { id: string; fullName: string; rollNumber: string | null; admissionNumber: string; }
interface AttRecord { studentId: string; status: 'Present' | 'Absent' | 'Late' | 'Leave'; remarks: string; }

const STATUS_OPTS = ['Present','Absent','Late','Leave'] as const;
const STATUS_COLOR: Record<string, string> = {
  Present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  Late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  Leave: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [filteredSections, setFilteredSections] = useState<SectionItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttRecord>>({});
  const [existing, setExisting] = useState<any[]>([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, leave: 0 });

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => {
    setFilteredSections(selectedClass ? sections.filter(s => s.classId === selectedClass) : []);
    setSelectedSection('');
    setStudents([]);
    setAttendance({});
  }, [selectedClass, sections]);

  const fetchClasses = async () => {
    try {
      const r = await fetch('/api/classes?limit=100');
      const j = await r.json();
      if (j.success) setClasses(j.data?.classes || j.data || []);
    } catch {}
  };

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const r = await fetch('/api/sections?limit=200');
        const j = await r.json();
        if (j.success) setSections(j.data?.sections || j.data || []);
      } catch {}
    };
    fetchSections();
  }, []);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) return;
    setLoadingStudents(true);
    try {
      const params = new URLSearchParams({ classId: selectedClass, limit: '200', status: 'active' });
      if (selectedSection) params.append('sectionId', selectedSection);
      const r = await fetch(`/api/students?${params}`);
      const j = await r.json();
      if (j.success) {
        const list: Student[] = j.data.students;
        setStudents(list);
        // Init attendance map as Present by default
        const initial: Record<string, AttRecord> = {};
        list.forEach(s => { initial[s.id] = { studentId: s.id, status: 'Present', remarks: '' }; });
        setAttendance(initial);

        // Load existing attendance for this date
        const aParams = new URLSearchParams({ date, classId: selectedClass });
        if (selectedSection) aParams.append('sectionId', selectedSection);
        const ar = await fetch(`/api/attendance?${aParams}`);
        const aj = await ar.json();
        if (aj.success && aj.data.length) {
          setExisting(aj.data);
          const updated = { ...initial };
          aj.data.forEach((rec: any) => {
            if (updated[rec.studentId]) {
              updated[rec.studentId] = { studentId: rec.studentId, status: rec.status, remarks: rec.remarks || '' };
            }
          });
          setAttendance(updated);
        }
      }
    } catch { toast({ title: 'Error', description: 'Failed to load students', variant: 'destructive' }); }
    finally { setLoadingStudents(false); }
  }, [selectedClass, selectedSection, date]);

  useEffect(() => {
    const vals = Object.values(attendance) as AttRecord[];
    setStats({
      present: vals.filter(v => v.status === 'Present').length,
      absent: vals.filter(v => v.status === 'Absent').length,
      late: vals.filter(v => v.status === 'Late').length,
      leave: vals.filter(v => v.status === 'Leave').length,
    });
  }, [attendance]);

  const setStatus = (studentId: string, status: AttRecord['status']) => {
    setAttendance(a => ({ ...a, [studentId]: { ...a[studentId], status } }));
  };

  const markAll = (status: AttRecord['status']) => {
    setAttendance(a => {
      const u = { ...a };
      Object.keys(u).forEach(id => { u[id] = { ...u[id], status }; });
      return u;
    });
  };

  const handleSave = async () => {
    if (!selectedClass || !students.length) return;
    setSaving(true);
    try {
      const r = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          classId: selectedClass,
          sectionId: selectedSection || undefined,
          attendanceRecords: Object.values(attendance),
          markedBy: 'System',
        }),
      });
      const j = await r.json();
      if (j.success) toast({ title: 'Saved', description: `Attendance saved for ${j.data.stats.total} students` });
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const total = students.length;
  const pct = total ? Math.round((stats.present / total) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Attendance</h1>
            <p className="text-muted-foreground">Mark and track daily student attendance</p>
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" className="mt-1 w-44" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="mt-1 w-40"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                  <SelectTrigger className="mt-1 w-36"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sections</SelectItem>
                    {filteredSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={loadStudents} disabled={!selectedClass || loadingStudents}>
                {loadingStudents ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                Load Students
              </Button>
            </div>
          </CardContent>
        </Card>

        {students.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[
                { label: 'Present', count: stats.present, icon: UserCheck, color: 'border-l-green-500 text-green-600' },
                { label: 'Absent', count: stats.absent, icon: UserX, color: 'border-l-red-500 text-red-600' },
                { label: 'Late', count: stats.late, icon: Clock, color: 'border-l-yellow-500 text-yellow-600' },
                { label: 'On Leave', count: stats.leave, icon: CalendarCheck, color: 'border-l-blue-500 text-blue-600' },
              ].map(({ label, count, icon: Icon, color }) => (
                <Card key={label} className={`border-l-4 ${color.split(' ')[0]}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{count}</p></div>
                      <Icon className={`h-6 w-6 ${color.split(' ')[1]}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions + Progress */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Quick Mark:</span>
                    {STATUS_OPTS.map(s => (
                      <Button key={s} variant="outline" size="sm" onClick={() => markAll(s)}>
                        All {s}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium">{pct}% present</span>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Attendance
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{students.length} Students — {date}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s, i) => {
                      const rec = attendance[s.id];
                      return (
                        <TableRow key={s.id} className={rec?.status === 'Absent' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{s.rollNumber || s.admissionNumber}</TableCell>
                          <TableCell className="font-medium">{s.fullName}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {STATUS_OPTS.map(st => (
                                <button
                                  key={st}
                                  onClick={() => setStatus(s.id, st)}
                                  className={`px-2 py-0.5 rounded text-xs font-semibold border transition-all ${
                                    rec?.status === st
                                      ? STATUS_COLOR[st]
                                      : 'border-muted text-muted-foreground hover:bg-muted/50'
                                  }`}
                                >
                                  {st[0]}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-7 text-xs w-36"
                              placeholder="Remarks..."
                              value={rec?.remarks || ''}
                              onChange={e => setAttendance(a => ({ ...a, [s.id]: { ...a[s.id], remarks: e.target.value } }))}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {!students.length && selectedClass && !loadingStudents && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mb-3" />
            <p>No students found. Click "Load Students" to begin.</p>
          </div>
        )}

        {!selectedClass && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CalendarCheck className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Select a class to mark attendance</p>
          </div>
        )}
      </main>
    </div>
  );
}
