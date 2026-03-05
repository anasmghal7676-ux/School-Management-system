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
import { Loader2, Plus, RefreshCw, Edit, Trash2, CalendarDays, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const EVENT_TYPES = ['Exam', 'Holiday', 'Event / Function', 'Sports Day', 'Parent Meeting', 'Teacher Training', 'Result Day', 'Enrollment / Admission', 'Fee Deadline', 'Trip / Excursion', 'Milestone', 'Other'];
const STATUS = ['Planned', 'In Progress', 'Completed', 'Cancelled', 'Postponed'];
const STATUS_COLORS: Record<string, string> = {
  Planned: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-slate-100 text-slate-500',
  Postponed: 'bg-purple-100 text-purple-700',
};
const TYPE_ICONS: Record<string, string> = { Exam: '📝', Holiday: '🎉', 'Event / Function': '🎪', 'Sports Day': '⚽', 'Parent Meeting': '👨‍👩‍👧', 'Teacher Training': '📚', 'Result Day': '🏆', Fee: '💰', Trip: '✈️', Milestone: '🎯', Other: '📌' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '';
const yearOpts = [String(new Date().getFullYear()), String(new Date().getFullYear() + 1), String(new Date().getFullYear() - 1)];
const today = new Date().toISOString().slice(0, 10);

export default function AcademicPlannerPage() {
  const [items, setItems] = useState<any[]>([]);
  const [months, setMonths] = useState<Record<string, any[]>>({});
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [overdue, setOverdue] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [typeFilter, setTypeFilter] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'timeline' | 'list'>('timeline');

  const emptyForm = () => ({ title: '', type: 'Milestone', startDate: today, endDate: '', responsibleId: '', responsibleName: '', classId: '', className: '', description: '', status: 'Planned', academicYear: year, priority: 'Normal' });
  const [form, setForm] = useState<any>(emptyForm());
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year, type: typeFilter });
      const res = await fetch(`/api/acad-planner?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items || []);
      setMonths(data.months || {});
      setUpcoming(data.upcoming || []);
      setOverdue(data.overdue || []);
      setStaff(data.staff || []);
      setClasses(data.classes || []);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [year, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleResponsible = (id: string) => {
    const s = staff.find(x => x.id === id);
    setForm((p: any) => ({ ...p, responsibleId: id, responsibleName: s?.fullName || '' }));
  };
  const handleClass = (id: string) => {
    const c = classes.find(x => x.id === id);
    setForm((p: any) => ({ ...p, classId: id, className: c?.name || '' }));
  };

  const save = async () => {
    if (!form.title || !form.startDate) { toast({ title: 'Title and start date required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/acad-planner', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...form, id: editing.id } : { ...form, academicYear: year }),
      });
      toast({ title: editing ? 'Updated' : 'Event added to planner' });
      setDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const markDone = async (id: string) => {
    await fetch('/api/acad-planner', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'Completed' }) });
    toast({ title: '✓ Marked complete' }); load();
  };

  const del = async (id: string) => {
    if (!confirm('Remove from planner?')) return;
    await fetch('/api/acad-planner', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Removed' }); load();
  };

  const completed = items.filter(i => i.status === 'Completed').length;
  const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Academic Planner" description="Plan the academic year — exams, events, milestones and deadlines in one timeline"
        actions={<div className="flex gap-2">
          <Select value={year} onValueChange={setYear}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{yearOpts.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
          <Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Event</Button>
        </div>}
      />

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Academic Year {year} Progress</span>
            <span className="text-sm font-bold text-primary">{progress}% Complete</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>{completed} completed · {items.filter(i => i.status === 'In Progress').length} in progress</span>
            <span>{items.length} total events</span>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">{overdue.length} overdue event{overdue.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-red-600 mt-0.5">{overdue.map(e => e.title).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</h3>
            <Select value={typeFilter} onValueChange={v => setTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {upcoming.length === 0 ? <p className="text-sm text-muted-foreground italic">No upcoming events</p> :
            upcoming.map(ev => (
              <Card key={ev.id} className="hover:shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{TYPE_ICONS[ev.type] || '📌'}</span>
                      <div>
                        <p className="font-medium text-sm">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(ev.startDate)}{ev.endDate && ev.endDate !== ev.startDate ? ` – ${fmtDate(ev.endDate)}` : ''}</p>
                        <Badge className={`text-xs mt-1 ${STATUS_COLORS[ev.status]}`}>{ev.status}</Badge>
                      </div>
                    </div>
                    <button onClick={() => markDone(ev.id)} className="text-muted-foreground hover:text-green-600 transition-colors mt-0.5" title="Mark complete">
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          }
          <Button variant="outline" size="sm" className="w-full" onClick={load}><RefreshCw className="h-3.5 w-3.5 mr-2" />Refresh</Button>
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2">
          {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            Object.keys(months).length === 0 ? (
              <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No events planned for {year}</p>
                <Button size="sm" className="mt-3" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add First Event</Button>
              </CardContent></Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(months).map(([monthKey, monthItems]) => {
                  const [mYear, mMonth] = monthKey.split('-');
                  const monthName = MONTHS[parseInt(mMonth) - 1] + ' ' + mYear;
                  return (
                    <div key={monthKey}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-sm">{monthName}</h3>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">{monthItems.length} event{monthItems.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="space-y-2">
                        {(monthItems as any[]).map((ev: any) => (
                          <div key={ev.id} className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/10 transition-colors ${ev.status === 'Completed' ? 'opacity-60' : ''} ${ev.endDate && ev.endDate < today && ev.status !== 'Completed' ? 'border-red-200 bg-red-50/30' : 'bg-card'}`}>
                            <span className="text-xl flex-shrink-0">{TYPE_ICONS[ev.type] || '📌'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium text-sm ${ev.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{ev.title}</span>
                                <Badge className={`text-xs py-0 ${STATUS_COLORS[ev.status]}`}>{ev.status}</Badge>
                                {ev.priority === 'High' && <Badge className="text-xs py-0 bg-red-100 text-red-700">High Priority</Badge>}
                              </div>
                              <div className="text-xs text-muted-foreground flex gap-3 mt-0.5 flex-wrap">
                                <span><CalendarDays className="h-3 w-3 inline mr-0.5" />{fmtDate(ev.startDate)}{ev.endDate && ev.endDate !== ev.startDate ? ` – ${fmtDate(ev.endDate)}` : ''}</span>
                                {ev.responsibleName && <span>👤 {ev.responsibleName}</span>}
                                {ev.className && <span>🏫 {ev.className}</span>}
                              </div>
                              {ev.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.description}</p>}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {ev.status !== 'Completed' && <button onClick={() => markDone(ev.id)} className="text-muted-foreground hover:text-green-600 p-1" title="Complete"><CheckCircle2 className="h-3.5 w-3.5" /></button>}
                              <button onClick={() => { setEditing(ev); setForm(ev); setDialog(true); }} className="text-muted-foreground hover:text-primary p-1"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={() => del(ev.id)} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Event' : 'Add to Academic Planner'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Event Title *</Label><Input value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. Annual Exams, Sports Day" /></div>
            <div className="space-y-1.5"><Label>Type</Label>
              <Select value={form.type} onValueChange={v => f('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{TYPE_ICONS[t] || '📌'} {t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => f('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Normal">Normal</SelectItem><SelectItem value="High">High</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Start Date *</Label><Input type="date" value={form.startDate} onChange={e => f('startDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => f('endDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Responsible</Label>
              <Select value={form.responsibleId} onValueChange={handleResponsible}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent><SelectItem value="">—</SelectItem>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>For Class</Label>
              <Select value={form.classId} onValueChange={handleClass}>
                <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent><SelectItem value="">All</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => f('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Description / Notes</Label><Textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Add to Planner'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
