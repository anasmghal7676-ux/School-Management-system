'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, BookOpen, Trash2, RefreshCw, CheckSquare, Square, Save, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const TYPE_COLORS: Record<string, string> = {
  Theory:    'bg-blue-100 text-blue-700',
  Practical: 'bg-green-100 text-green-700',
  Both:      'bg-purple-100 text-purple-700',
};

export default function ClassSubjectsPage() {
  const [classes, setClasses]       = useState<any[]>([]);
  const [subjects, setSubjects]     = useState<any[]>([]);
  const [staff, setStaff]           = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [selClass, setSelClass]     = useState('');
  const [saving, setSaving]         = useState(false);

  // Checkbox state for bulk assignment
  const [checkedSubjects, setCheckedSubjects] = useState<Set<any>>(new Set());

  // Teacher assignment dialog
  const [teacherDialogAssignment, setTeacherDialogAssignment] = useState<any>(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  useEffect(() => { fetchBase(); }, []);
  useEffect(() => { if (selClass) fetchAssignments(); }, [selClass]);

  const fetchBase = async () => {
    const [cr, sr, tr] = await Promise.all([
      fetch('/api/classes?limit=100').then(r => r.json()),
      fetch('/api/subjects?limit=200').then(r => r.json()),
      fetch('/api/staff?limit=200').then(r => r.json()),
    ]);
    if (cr.success) setClasses(cr.data?.classes || cr.data || []);
    if (sr.success) setSubjects(sr.data?.subjects || []);
    if (tr.success) setStaff(tr.data?.staff || tr.data || []);
  };

  const fetchAssignments = useCallback(async () => {
    if (!selClass) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/cls-subjects?classId=${selClass}`);
      const j = await r.json();
      if (j.success) {
        setAssignments(j.data.assignments);
        const assignedIds = new Set<any>(j.data.assignments.map((a: any) => a.subjectId));
        setCheckedSubjects(assignedIds);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [selClass]);

  const handleSaveBulk = async () => {
    if (!selClass) return;
    setSaving(true);
    try {
      const r = await fetch('/api/cls-subjects', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selClass, subjectIds: Array.from(checkedSubjects) }),
      });
      const j = await r.json();
      if (j.success) { toast({ title: `Saved — ${j.data.created} subject(s) assigned` }); fetchAssignments(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleRemove = async (id: string) => {
    const r = await fetch(`/api/cls-subjects/${id}`, { method: 'DELETE' });
    if ((await r.json()).success) { toast({ title: 'Removed' }); fetchAssignments(); }
  };

  const handleSetTeacher = async () => {
    if (!teacherDialogAssignment) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/cls-subjects/${teacherDialogAssignment.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: selectedTeacher || null }),
      });
      if ((await r.json()).success) { toast({ title: 'Teacher assigned' }); setTeacherDialogAssignment(null); fetchAssignments(); }
    } finally { setSaving(false); }
  };

  const toggleSubject = (id: string) => {
    setCheckedSubjects(prev => {
      const n = new Set<any>(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (checkedSubjects.size === subjects.length) setCheckedSubjects(new Set());
    else setCheckedSubjects(new Set<any>(subjects.map(s => s.id)));
  };

  const selClassName = classes.find(c => c.id === selClass)?.name || '';
  const assignedCount = assignments.length;
  const isDirty = selClass && (
    checkedSubjects.size !== assignments.length ||
    !assignments.every(a => checkedSubjects.has(a.subjectId))
  );

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-7 w-7" />Class-Subject Assignments
            </h1>
            <p className="text-muted-foreground">Assign subjects to classes and set subject teachers</p>
          </div>
        </div>

        {/* Class selector */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 max-w-xs">
                <Label className="text-xs text-muted-foreground">Select Class</Label>
                <Select value={selClass} onValueChange={setSelClass}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a class..." /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {selClass && (
                <>
                  <Badge variant="outline" className="text-sm">{assignedCount} subjects assigned</Badge>
                  <Button variant="outline" size="sm" onClick={fetchAssignments} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button onClick={handleSaveBulk} disabled={saving || !isDirty}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Assignments
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {!selClass && (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <BookOpen className="h-14 w-14 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a class to manage its subjects</p>
            <p className="text-sm">Use the dropdown above to choose a class</p>
          </div>
        )}

        {selClass && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Subject checklist */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Available Subjects</CardTitle>
                    <CardDescription>Check subjects to assign to {selClassName}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={toggleAll}>
                    {checkedSubjects.size === subjects.length ? (
                      <><CheckSquare className="mr-1.5 h-4 w-4" />Deselect All</>
                    ) : (
                      <><Square className="mr-1.5 h-4 w-4" />Select All</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {subjects.map(s => {
                      const checked = checkedSubjects.has(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${checked ? 'bg-primary/5' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSubject(s.id)}
                            className="rounded accent-primary h-4 w-4"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{s.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{s.code}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_COLORS[s.subjectType] || 'bg-gray-100 text-gray-600'}`}>
                              {s.subjectType}
                            </span>
                            <span className="text-xs text-muted-foreground">{s.maxMarks}m</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current assignments with teacher */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Assigned to {selClassName}</CardTitle>
                <CardDescription>Click the person icon to assign a teacher for each subject</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {assignments.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">No subjects assigned yet</p>
                    <p className="text-xs">Check subjects on the left and click Save</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {assignments.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{a.subject?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.teacher ? (
                              <span className="text-blue-600">{a.teacher.firstName} {a.teacher.lastName}</span>
                            ) : (
                              <span className="text-amber-500">No teacher assigned</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-blue-400 hover:text-blue-600"
                            title="Assign teacher"
                            onClick={() => { setTeacherDialogAssignment(a); setSelectedTeacher(a.teacherId || ''); }}
                          >
                            <User className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600"
                            onClick={() => handleRemove(a.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Teacher Assignment Dialog */}
      <Dialog open={!!teacherDialogAssignment} onOpenChange={() => setTeacherDialogAssignment(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Teacher</DialogTitle>
            <DialogDescription>
              Set the teacher for <strong>{teacherDialogAssignment?.subject?.name}</strong> in {selClassName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>Teacher</Label>
            <Select value={selectedTeacher || 'none'} onValueChange={v => setSelectedTeacher(v === 'none' ? '' : v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select teacher..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Not assigned —</SelectItem>
                {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.designation}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeacherDialogAssignment(null)}>Cancel</Button>
            <Button onClick={handleSetTeacher} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
