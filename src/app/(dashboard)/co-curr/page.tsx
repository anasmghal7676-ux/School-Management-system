'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, Users, ChevronDown, ChevronRight, Trophy, Music, Palette, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CATEGORIES = ['Sports', 'Arts & Crafts', 'Music & Performing Arts', 'Debate & Public Speaking', 'Science Club', 'Literary Club', 'Community Service', 'Technology & Robotics', 'Environmental Club', 'Cultural Activities', 'Other'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CAT_ICONS: Record<string, string> = { Sports: '⚽', 'Arts & Crafts': '🎨', 'Music & Performing Arts': '🎵', 'Debate & Public Speaking': '🎤', 'Science Club': '🔬', 'Literary Club': '📚', 'Community Service': '🤝', 'Technology & Robotics': '🤖', 'Environmental Club': '🌿', 'Cultural Activities': '🎭', Other: '⭐' };

export default function CoCurricularPage() {
  const [items, setItems] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState(false);
  const [enrollDialog, setEnrollDialog] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState('');

  const emptyForm = () => ({ name: '', category: 'Sports', coordinatorId: '', coordinator: '', schedule: '', venue: '', maxCapacity: '30', description: '', status: 'Active', fee: '', days: [] as string[] });
  const [form, setForm] = useState<any>(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, category: catFilter, page: '1', limit: '50' });
      const res = await fetch(`/api/co-curr?${params}`);
      const data = await res.json();
      setItems(data.items || []); setTotal(data.total || 0);
      if (data.staff) setStaff(data.staff);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => {
    load();
    fetch('/api/students?limit=300').then(r => r.json()).then(d => setStudents(d.students || []));
  }, [load]);

  const toggle = (id: string) => { const n = new Set(expanded); n.has(id) ? n.delete(id) : n.add(id); setExpanded(n); };

  const handleCoordinator = (id: string) => {
    const s = staff.find(x => x.id === id);
    setForm((f: any) => ({ ...f, coordinatorId: id, coordinator: s?.fullName || '' }));
  };

  const toggleDay = (day: string) => {
    setForm((f: any) => ({ ...f, days: f.days.includes(day) ? f.days.filter((d: string) => d !== day) : [...f.days, day] }));
  };

  const save = async () => {
    if (!form.name || !form.category) { toast({ title: 'Name and category required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/co-curr', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) });
      toast({ title: editing ? 'Updated' : 'Activity created' });
      setDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const enroll = async () => {
    if (!enrollStudentId) return;
    const student = students.find(s => s.id === enrollStudentId);
    if (!student) return;
    setSaving(true);
    try {
      await fetch('/api/co-curr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enroll', activityId: enrollDialog.id, studentId: student.id, studentName: student.fullName, admissionNo: student.admissionNumber, className: student.class?.name }) });
      toast({ title: 'Student enrolled' });
      setEnrollDialog(null); setEnrollStudentId(''); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete activity?')) return;
    await fetch('/api/co-curr', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Deleted' }); load();
  };

  const active = items.filter(i => i.status === 'Active').length;
  const totalEnrolled = items.reduce((s, i) => s + (i.enrollments?.length || 0), 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Co-curricular Activities" description="Manage clubs, sports teams, cultural activities and student enrollment"
        actions={<Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Activity</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><div className="flex items-center justify-between"><Trophy className="h-4 w-4 text-blue-500" /><span className="text-2xl font-bold">{total}</span></div><p className="text-xs text-muted-foreground mt-1">Total Activities</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><div className="flex items-center justify-between"><Trophy className="h-4 w-4 text-green-500" /><span className="text-2xl font-bold text-green-700">{active}</span></div><p className="text-xs text-muted-foreground mt-1">Active</p></CardContent></Card>
        <Card className="border-l-4 border-l-purple-500"><CardContent className="p-4"><div className="flex items-center justify-between"><Users className="h-4 w-4 text-purple-500" /><span className="text-2xl font-bold">{totalEnrolled}</span></div><p className="text-xs text-muted-foreground mt-1">Total Enrolled</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4"><div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search activities..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={catFilter} onValueChange={v => setCatFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{CAT_ICONS[c]} {c}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
      </div></CardContent></Card>

      {loading ? <div className="flex items-center justify-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div> :
        items.length === 0 ? (
          <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No activities yet</p>
            <Button size="sm" className="mt-3" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add First Activity</Button>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const exp = expanded.has(item.id);
              const enrolled = item.enrollments?.length || 0;
              const cap = parseInt(item.maxCapacity) || 0;
              return (
                <Card key={item.id} className="overflow-hidden">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 card-hover" onClick={() => toggle(item.id)}>
                    <div className="flex items-center gap-3">
                      {exp ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-2xl">{CAT_ICONS[item.category] || '⭐'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.name}</span>
                          <Badge className={`text-xs ${item.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{item.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-3 mt-0.5">
                          <span>{item.category}</span>
                          {item.coordinator && <span>Coordinator: {item.coordinator}</span>}
                          {item.days?.length > 0 && <span>{item.days.join(', ')}</span>}
                          {item.venue && <span>📍 {item.venue}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                      <div className="text-right text-xs text-muted-foreground">
                        <div className="font-medium">{enrolled}{cap > 0 ? `/${cap}` : ''} enrolled</div>
                        {cap > 0 && <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((enrolled/cap)*100,100)}%` }} /></div>}
                      </div>
                      <Button variant="outline" size="sm" className="h-7" onClick={() => { setEnrollDialog(item); setEnrollStudentId(''); }}>+ Enroll</Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setForm({ ...item, days: item.days || [] }); setDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  {exp && (
                    <div className="border-t p-4 bg-muted/5">
                      {item.description && <p className="text-sm text-muted-foreground mb-3">{item.description}</p>}
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Enrolled Students ({enrolled})</h4>
                      {enrolled === 0 ? <p className="text-xs text-muted-foreground italic">No students enrolled yet</p> : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {item.enrollments.map((e: any) => (
                            <div key={e.studentId} className="bg-white border rounded p-2 text-xs">
                              <div className="font-medium">{e.studentName}</div>
                              <div className="text-muted-foreground">{e.admissionNo} · {e.className}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      }

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Activity' : 'Add Co-curricular Activity'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Activity Name *</Label><Input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Football Team, Drama Club" /></div>
            <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onValueChange={v => setForm((f: any) => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{CAT_ICONS[c]} {c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm((f: any) => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem><SelectItem value="Seasonal">Seasonal</SelectItem></SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Coordinator / Coach</Label><Select value={form.coordinatorId} onValueChange={handleCoordinator}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent><SelectItem value="">None</SelectItem>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Venue / Location</Label><Input value={form.venue} onChange={e => setForm((f: any) => ({ ...f, venue: e.target.value }))} placeholder="Ground, Hall, Room 5" /></div>
            <div className="space-y-1.5"><Label>Max Capacity</Label><Input type="number" value={form.maxCapacity} onChange={e => setForm((f: any) => ({ ...f, maxCapacity: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Schedule / Time</Label><Input value={form.schedule} onChange={e => setForm((f: any) => ({ ...f, schedule: e.target.value }))} placeholder="3:00 PM – 4:30 PM" /></div>
            <div className="space-y-1.5"><Label>Activity Fee (PKR)</Label><Input type="number" value={form.fee} onChange={e => setForm((f: any) => ({ ...f, fee: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5">
              <Label>Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${form.days?.includes(day) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted/30'}`}>{day.slice(0,3)}</button>
                ))}
              </div>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={!!enrollDialog} onOpenChange={o => !o && setEnrollDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Enroll Student — {enrollDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Select Student</Label>
              <Select value={enrollStudentId} onValueChange={setEnrollStudentId}>
                <SelectTrigger><SelectValue placeholder="Search and select student" /></SelectTrigger>
                <SelectContent>
                  {students.slice(0,100).filter(s => !enrollDialog?.enrollments?.find((e: any) => e.studentId === s.id)).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.class?.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {enrollDialog?.maxCapacity && (
              <p className="text-xs text-muted-foreground">{enrollDialog.enrollments?.length || 0} / {enrollDialog.maxCapacity} slots filled</p>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEnrollDialog(null)}>Cancel</Button><Button onClick={enroll} disabled={saving || !enrollStudentId}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Enroll</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
