'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Plus, Search, ChevronLeft, ChevronRight,
  HeartPulse, Stethoscope, RefreshCw, Eye,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const EMPTY_FORM = {
  studentId: '', checkupDate: new Date().toISOString().slice(0, 10),
  doctorName: '', heightCm: '', weightKg: '', bloodPressure: '',
  medicalObservations: '', prescriptions: '', nextCheckupDate: '',
};

const bmi = (h: number, w: number) => {
  const b = w / ((h / 100) ** 2);
  const label = b < 18.5 ? 'Underweight' : b < 25 ? 'Normal' : b < 30 ? 'Overweight' : 'Obese';
  const color = b < 18.5 ? 'text-blue-600' : b < 25 ? 'text-green-600' : b < 30 ? 'text-amber-600' : 'text-red-600';
  return { value: b.toFixed(1), label, color };
};

export default function MedicalPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [classFilter, setClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchIn, setSearchIn] = useState('');
  const [selStudent, setSelStudent] = useState('all');

  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState<any>(null);
  const [viewRecords, setViewRecords] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filtStudents, setFiltStudents] = useState<any[]>([]);

  useEffect(() => { fetchClasses(); fetchStudents(); }, []);
  useEffect(() => { const t = setTimeout(() => setSearch(searchIn), 400); return () => clearTimeout(t); }, [searchIn]);
  useEffect(() => { fetchRecords(); }, [selStudent, page]);
  useEffect(() => {
    setFiltStudents(
      classFilter !== 'all'
        ? students.filter(s => s.currentClassId === classFilter || s.class?.id === classFilter)
        : students
    );
  }, [classFilter, students]);

  const fetchClasses = async () => { const r = await fetch('/api/classes?limit=100'); const j = await r.json(); if (j.success) setClasses(j.data?.classes || j.data || []); };
  const fetchStudents = async () => {
    const r = await fetch('/api/students?limit=300&status=active');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || []);
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '25' });
      if (selStudent !== 'all') p.append('studentId', selStudent);
      const r = await fetch(`/api/medical-records?${p}`);
      const j = await r.json();
      if (j.success) {
        setRecords(j.data.records);
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [selStudent, page]);

  const openStudentHistory = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setViewStudent(student);
    const r = await fetch(`/api/medical-records?studentId=${studentId}&limit=50`);
    const j = await r.json();
    if (j.success) setViewRecords(j.data.records);
    setViewOpen(true);
  };

  const handleAdd = async () => {
    if (!form.studentId || !form.checkupDate) {
      toast({ title: 'Student and checkup date required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/medical-records', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Record added' }); setAddOpen(false); setForm(EMPTY_FORM); fetchRecords();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const uf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  // Enrich records with student info
  const enriched = records.map(rec => ({
    ...rec,
    studentInfo: students.find(s => s.id === rec.studentId),
  }));

  const displayed = search
    ? enriched.filter(r =>
        r.studentInfo?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        r.studentInfo?.admissionNumber?.includes(search)
      )
    : enriched;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <HeartPulse className="h-7 w-7 text-red-500" />Medical Records
            </h1>
            <p className="text-muted-foreground">Student health checkups, vitals and medical history</p>
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Record
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Records', value: total, icon: Stethoscope, color: 'border-l-blue-500' },
            { label: 'Students with Records', value: new Set(records.map(r => r.studentId)).size, icon: HeartPulse, color: 'border-l-green-500' },
            { label: 'Due for Checkup', value: records.filter(r => r.nextCheckupDate && new Date(r.nextCheckupDate) <= new Date()).length, icon: RefreshCw, color: 'border-l-amber-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className={`border-l-4 ${color}`}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search student..." value={searchIn} onChange={e => setSearchIn(e.target.value)} />
              </div>
              <Select value={classFilter} onValueChange={v => { setClassFilter(v); setSelStudent('all'); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selStudent} onValueChange={v => { setSelStudent(v); setPage(1); }}>
                <SelectTrigger className="w-52"><SelectValue placeholder="All Students" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {filtStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchRecords} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <HeartPulse className="h-12 w-12 mb-4 text-red-400" />
                <p className="font-medium">No medical records found</p>
                <Button className="mt-4" onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />Add First Record
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Checkup Date</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Height / Weight</TableHead>
                      <TableHead>BMI</TableHead>
                      <TableHead>BP</TableHead>
                      <TableHead>Next Checkup</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.map(rec => {
                      const bmiData = rec.heightCm && rec.weightKg ? bmi(rec.heightCm, rec.weightKg) : null;
                      const nextDue = rec.nextCheckupDate && new Date(rec.nextCheckupDate) <= new Date();
                      return (
                        <TableRow key={rec.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="font-medium text-sm">{rec.studentInfo?.fullName || rec.studentId}</div>
                            <div className="text-xs text-muted-foreground">{rec.studentInfo?.admissionNumber}</div>
                          </TableCell>
                          <TableCell className="text-sm">{fmtDate(rec.checkupDate)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{rec.doctorName || '—'}</TableCell>
                          <TableCell className="text-sm font-mono">
                            {rec.heightCm && rec.weightKg
                              ? `${rec.heightCm}cm / ${rec.weightKg}kg`
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            {bmiData
                              ? <span className={`text-sm font-semibold ${bmiData.color}`}>{bmiData.value} <span className="text-xs font-normal">({bmiData.label})</span></span>
                              : <span className="text-muted-foreground text-sm">—</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{rec.bloodPressure || '—'}</TableCell>
                          <TableCell className={`text-sm ${nextDue ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                            {rec.nextCheckupDate ? fmtDate(rec.nextCheckupDate) : '—'}
                            {nextDue && <span className="ml-1 text-xs">⚠️</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openStudentHistory(rec.studentId)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} records</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Record Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Medical Record</DialogTitle><DialogDescription>Record student health checkup details</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Student *</Label>
              <Select value={form.studentId} onValueChange={v => uf('studentId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Checkup Date *</Label><Input className="mt-1" type="date" value={form.checkupDate} onChange={e => uf('checkupDate', e.target.value)} /></div>
            <div><Label>Doctor Name</Label><Input className="mt-1" value={form.doctorName} onChange={e => uf('doctorName', e.target.value)} /></div>
            <div><Label>Height (cm)</Label><Input className="mt-1" type="number" value={form.heightCm} onChange={e => uf('heightCm', e.target.value)} placeholder="e.g. 165" /></div>
            <div><Label>Weight (kg)</Label><Input className="mt-1" type="number" value={form.weightKg} onChange={e => uf('weightKg', e.target.value)} placeholder="e.g. 55" /></div>
            <div><Label>Blood Pressure</Label><Input className="mt-1" value={form.bloodPressure} onChange={e => uf('bloodPressure', e.target.value)} placeholder="e.g. 120/80" /></div>
            <div><Label>Next Checkup</Label><Input className="mt-1" type="date" value={form.nextCheckupDate} onChange={e => uf('nextCheckupDate', e.target.value)} /></div>
            <div className="col-span-2"><Label>Medical Observations</Label>
              <textarea className="mt-1 w-full min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={form.medicalObservations} onChange={e => uf('medicalObservations', e.target.value)} placeholder="Any observations or findings..." />
            </div>
            <div className="col-span-2"><Label>Prescriptions</Label>
              <textarea className="mt-1 w-full min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={form.prescriptions} onChange={e => uf('prescriptions', e.target.value)} placeholder="Medications or advice..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student History Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-red-500" />{viewStudent?.fullName}</DialogTitle>
            <DialogDescription>{viewStudent?.admissionNumber} · {viewStudent?.class?.name} · Blood Group: {viewStudent?.bloodGroup || 'Unknown'}</DialogDescription>
          </DialogHeader>
          {viewRecords.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No records for this student</p>
          ) : (
            <div className="space-y-3">
              {viewRecords.map(rec => {
                const bmiData = rec.heightCm && rec.weightKg ? bmi(rec.heightCm, rec.weightKg) : null;
                return (
                  <div key={rec.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{fmtDate(rec.checkupDate)}</span>
                      {rec.doctorName && <span className="text-xs text-muted-foreground">Dr. {rec.doctorName}</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      {rec.heightCm && <div><span className="text-muted-foreground">Height</span><br /><span className="font-medium">{rec.heightCm} cm</span></div>}
                      {rec.weightKg && <div><span className="text-muted-foreground">Weight</span><br /><span className="font-medium">{rec.weightKg} kg</span></div>}
                      {bmiData && <div><span className="text-muted-foreground">BMI</span><br /><span className={`font-semibold ${bmiData.color}`}>{bmiData.value} ({bmiData.label})</span></div>}
                      {rec.bloodPressure && <div><span className="text-muted-foreground">BP</span><br /><span className="font-medium">{rec.bloodPressure}</span></div>}
                    </div>
                    {rec.medicalObservations && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Observations: </span>{rec.medicalObservations}</p>}
                    {rec.prescriptions && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Prescriptions: </span>{rec.prescriptions}</p>}
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
