'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Search, RefreshCw, Trash2, BookOpen, Users, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

export default function SubjectElectivesPage() {
  const [electives, setElectives] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedElective, setSelectedElective] = useState('');
  const [elDialog, setElDialog] = useState(false);
  const [enrDialog, setEnrDialog] = useState(false);
  const [editingEl, setEditingEl] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyEl = () => ({ name: '', subjectId: '', subject: '', teacherId: '', teacherName: '', eligibleClasses: [] as string[], maxSeats: '30', description: '', academicYear: '', term: '' });
  const emptyEnr = () => ({ electiveId: '', electiveName: '', studentId: '', studentName: '', className: '', enrolledAt: new Date().toISOString().slice(0, 10) });
  const [elForm, setElForm] = useState<any>(emptyEl());
  const [enrForm, setEnrForm] = useState<any>(emptyEnr());

  const loadElectives = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/electives?view=electives&search=${search}`);
      const data = await res.json();
      setElectives(data.items || []); setSubjects(data.subjects || []); setStaff(data.staff || []); setClasses(data.classes || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search]);

  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'enrollments', electiveId: selectedElective });
      const res = await fetch(`/api/electives?${params}`);
      const data = await res.json();
      setEnrollments(data.items || []); setStudents(data.students || []);
      if (!electives.length) setElectives(data.electives || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [selectedElective, electives.length]);

  useEffect(() => { loadElectives(); }, [loadElectives]);

  const saveElective = async () => {
    if (!elForm.name) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/electives', { method: editingEl ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingEl ? { ...elForm, entity: 'elective', id: editingEl.id } : { ...elForm, entity: 'elective' }) });
      toast({ title: editingEl ? 'Updated' : 'Elective created' }); setElDialog(false); loadElectives();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const enroll = async () => {
    if (!enrForm.studentId || !enrForm.electiveId) { toast({ title: 'Student and elective required', variant: 'destructive' }); return; }
    const el = electives.find(e => e.id === enrForm.electiveId);
    if (el?.maxSeats && el.enrolledCount >= Number(el.maxSeats)) { toast({ title: 'Elective is full', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/electives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...enrForm, entity: 'enrollment' }) });
      toast({ title: 'Student enrolled' }); setEnrDialog(false); loadEnrollments(); loadElectives();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleElForEnr = (id: string) => {
    const e = electives.find(x => x.id === id);
    setEnrForm((f: any) => ({ ...f, electiveId: id, electiveName: e?.name || '' }));
  };
  const handleStudentEnr = (id: string) => {
    const s = students.find(x => x.id === id);
    setEnrForm((f: any) => ({ ...f, studentId: id, studentName: s?.fullName || '', className: s?.class?.name || '' }));
  };

  const toggleEligible = (classId: string) => {
    setElForm((f: any) => ({
      ...f,
      eligibleClasses: f.eligibleClasses.includes(classId) ? f.eligibleClasses.filter((c: string) => c !== classId) : [...f.eligibleClasses, classId]
    }));
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Subject Electives" description="Manage elective offerings, seat limits and student enrollment"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingEl(null); setElForm(emptyEl()); setElDialog(true); }}><Plus className="h-4 w-4 mr-2" />New Elective</Button>
          <Button size="sm" onClick={() => { setEnrForm(emptyEnr()); setEnrDialog(true); }}><Users className="h-4 w-4 mr-2" />Enroll Student</Button>
        </div>}
      />

      <Tabs defaultValue="electives">
        <TabsList>
          <TabsTrigger value="electives">📚 Electives ({electives.length})</TabsTrigger>
          <TabsTrigger value="enrollments" onClick={loadEnrollments}>👥 Enrollments ({enrollments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="electives" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search electives..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Button variant="outline" size="icon" onClick={loadElectives}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            electives.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No electives created yet</p></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {electives.map(el => {
                const pct = el.maxSeats ? Math.round((el.enrolledCount / Number(el.maxSeats)) * 100) : 0;
                const isFull = el.enrolledCount >= Number(el.maxSeats || 9999);
                return (
                  <Card key={el.id} className={isFull ? 'opacity-75' : 'hover:shadow-sm'}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold">{el.name}</p>
                          {el.subject && <p className="text-xs text-muted-foreground">{el.subject}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingEl(el); setElForm(el); setElDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { if (confirm('Delete?')) { await fetch('/api/electives', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: el.id, entity: 'elective' }) }); loadElectives(); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      {el.teacherName && <p className="text-xs text-muted-foreground mb-1">👤 {el.teacherName}</p>}
                      {el.description && <p className="text-xs text-muted-foreground italic mb-2">{el.description}</p>}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs"><span>Enrollment</span><span className={isFull ? 'text-red-600 font-medium' : ''}>{el.enrolledCount} / {el.maxSeats || '∞'}</span></div>
                        {el.maxSeats && <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${isFull ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>}
                      </div>
                      {isFull && <Badge className="text-xs mt-2 bg-red-100 text-red-700">Full</Badge>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          }
        </TabsContent>

        <TabsContent value="enrollments" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <Select value={selectedElective} onValueChange={v => setSelectedElective(v === 'all' ? '' : v)}><SelectTrigger className="w-48"><SelectValue placeholder="All Electives" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{electives.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" onClick={loadEnrollments}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            enrollments.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No enrollments yet</p></CardContent></Card> :
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Elective</TableHead><TableHead>Enrolled On</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {enrollments.map(en => (
                    <TableRow key={en.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-sm">{en.studentName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{en.className}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{en.electiveName}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{en.enrolledAt ? new Date(en.enrolledAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { if (confirm('Remove enrollment?')) { await fetch('/api/electives', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: en.id, entity: 'enrollment' }) }); loadEnrollments(); loadElectives(); } }}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          }
        </TabsContent>
      </Tabs>

      {/* Elective Dialog */}
      <Dialog open={elDialog} onOpenChange={setElDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingEl ? 'Edit Elective' : 'New Elective'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Name *</Label><Input value={elForm.name} onChange={e => setElForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Subject</Label><Select value={elForm.subjectId} onValueChange={v => { const s = subjects.find(x => x.id === v); setElForm((f: any) => ({ ...f, subjectId: v, subject: s?.name || '' })); }}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Teacher</Label><Select value={elForm.teacherId} onValueChange={v => { const s = staff.find(x => x.id === v); setElForm((f: any) => ({ ...f, teacherId: v, teacherName: s?.fullName || '' })); }}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Max Seats</Label><Input type="number" value={elForm.maxSeats} onChange={e => setElForm((f: any) => ({ ...f, maxSeats: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Term / Year</Label><Input value={elForm.term} onChange={e => setElForm((f: any) => ({ ...f, term: e.target.value }))} placeholder="e.g. Term 1, 2024-25" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={elForm.description} onChange={e => setElForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="col-span-2 space-y-1.5">
              <Label>Eligible Classes</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                {classes.map(c => (
                  <button key={c.id} type="button" onClick={() => toggleEligible(c.id)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${(elForm.eligibleClasses || []).includes(c.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30 hover:border-primary'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setElDialog(false)}>Cancel</Button><Button onClick={saveElective} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingEl ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={enrDialog} onOpenChange={setEnrDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Enroll Student</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Elective *</Label><Select value={enrForm.electiveId} onValueChange={handleElForEnr}><SelectTrigger><SelectValue placeholder="Select elective" /></SelectTrigger><SelectContent>{electives.filter(e => e.enrolledCount < Number(e.maxSeats || 9999)).map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.enrolledCount}/{e.maxSeats})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Student *</Label><Select value={enrForm.studentId} onValueChange={handleStudentEnr}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.class?.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Enrollment Date</Label><Input type="date" value={enrForm.enrolledAt} onChange={e => setEnrForm((f: any) => ({ ...f, enrolledAt: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEnrDialog(false)}>Cancel</Button><Button onClick={enroll} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enroll</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
