'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, Trash2, RefreshCw, Search, GraduationCap, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

export default function ClassTeachersPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [assignmentMap, setAssignmentMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ classId: '', sectionId: '', staffId: '', academicYear: String(new Date().getFullYear()), notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cls-teachers');
      const data = await res.json();
      setClasses(data.classes || []);
      setStaff(data.staff || []);
      setAssignmentMap(data.assignmentMap || {});
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getAssignment = (classId: string, sectionId?: string) =>
    assignmentMap[classId + '_' + (sectionId || '')] || assignmentMap[classId + '_'];

  const assignedCount = Object.keys(assignmentMap).length;
  const totalSections = classes.reduce((s, c) => s + (c.sections?.length || 1), 0);
  const unassigned = totalSections - assignedCount;

  const openAssign = (cls: any, section?: any) => {
    const existing = getAssignment(cls.id, section?.id);
    setEditing({ cls, section });
    setForm({
      classId: cls.id,
      sectionId: section?.id || '',
      staffId: existing?.staffId || '',
      academicYear: existing?.academicYear || String(new Date().getFullYear()),
      notes: existing?.notes || '',
    });
    setDialog(true);
  };

  const save = async () => {
    if (!form.classId || !form.staffId) { toast({ title: 'Class and teacher required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const teacher = staff.find(s => s.id === form.staffId);
      await fetch('/api/cls-teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, staffName: teacher?.fullName }),
      });
      toast({ title: 'Class teacher assigned' });
      setDialog(false);
      load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const remove = async (classId: string, sectionId?: string) => {
    if (!confirm('Remove class teacher assignment?')) return;
    await fetch('/api/cls-teachers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId, sectionId: sectionId || '' }),
    });
    toast({ title: 'Assignment removed' });
    load();
  };

  const filteredClasses = classes.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Class Teacher Assignment"
        description="Assign form/class teachers to each class and section for the academic year"
        actions={<Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>}
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4">
          <div className="flex items-center justify-between"><GraduationCap className="h-4 w-4 text-blue-500" /><span className="text-2xl font-bold">{classes.length}</span></div>
          <p className="text-xs text-muted-foreground mt-1">Total Classes</p>
        </CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4">
          <div className="flex items-center justify-between"><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-2xl font-bold text-green-700">{assignedCount}</span></div>
          <p className="text-xs text-muted-foreground mt-1">Assigned</p>
        </CardContent></Card>
        <Card className={`border-l-4 ${unassigned > 0 ? 'border-l-amber-500' : 'border-l-green-500'}`}><CardContent className="p-4">
          <div className="flex items-center justify-between">
            {unassigned > 0 ? <AlertCircle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
            <span className={`text-2xl font-bold ${unassigned > 0 ? 'text-amber-700' : 'text-green-700'}`}>{unassigned}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Unassigned Sections</p>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search class..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map(cls => {
            const hasSections = cls.sections?.length > 0;
            return (
              <Card key={cls.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                <CardHeader className="py-3 px-4 bg-muted/10 border-b">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    {cls.name}
                    {cls.sections?.length > 0 && <Badge variant="outline" className="text-xs ml-auto">{cls.sections.length} sections</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y">
                  {hasSections ? (
                    cls.sections.map((section: any) => {
                      const assignment = getAssignment(cls.id, section.id);
                      const teacher = assignment ? staff.find(s => s.id === assignment.staffId) : null;
                      return (
                        <div key={section.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground w-16">Section {section.name}</span>
                            {assignment ? (
                              <div className="flex items-center gap-1.5">
                                <User className="h-3 w-3 text-green-500" />
                                <span className="text-sm font-medium">{teacher?.fullName || assignment.staffName}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-amber-600 italic">Not assigned</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => openAssign(cls, section)}>
                              {assignment ? <Edit className="h-3 w-3" /> : 'Assign'}
                            </Button>
                            {assignment && (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove(cls.id, section.id)}><Trash2 className="h-3 w-3" /></Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    (() => {
                      const assignment = getAssignment(cls.id);
                      const teacher = assignment ? staff.find(s => s.id === assignment.staffId) : null;
                      return (
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2">
                            {assignment ? (
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-green-500" />
                                <div>
                                  <p className="text-sm font-medium">{teacher?.fullName || assignment.staffName}</p>
                                  <p className="text-xs text-muted-foreground">{teacher?.designation}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-amber-600 italic">No class teacher assigned</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-7" onClick={() => openAssign(cls)}>
                              {assignment ? <><Edit className="h-3.5 w-3.5 mr-1" />Change</> : 'Assign Teacher'}
                            </Button>
                            {assignment && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(cls.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignment Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Class Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/20 rounded-lg p-3 text-sm">
              <span className="font-medium">{editing?.cls?.name}</span>
              {editing?.section && <span className="text-muted-foreground"> — Section {editing.section.name}</span>}
            </div>
            <div className="space-y-1.5">
              <Label>Class Teacher *</Label>
              <Select value={form.staffId} onValueChange={v => setForm(f => ({ ...f, staffId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName} — {s.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Academic Year</Label>
              <Input value={form.academicYear} onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="2025-2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
