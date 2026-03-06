'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trash2, Plus, Grid3X3, User, RefreshCw, AlertCircle, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SUBJECT_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-red-100 text-red-800 border-red-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
];

interface Slot { id: string; dayOfWeek: number; periodNumber: number; startTime: string; endTime: string; }
interface Entry {
  id: string; sectionId: string; slotId: string; subjectId: string | null; teacherId: string | null;
  roomNumber: string | null; slot: Slot;
  subject: { id: string; name: string; code: string } | null;
  staff: { firstName: string; lastName: string } | null;
}

export default function TimetablePage() {
  const [tab, setTab] = useState('builder');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [filtSections, setFiltSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [acYears, setAcYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selClass, setSelClass] = useState('');
  const [selSection, setSelSection] = useState('');
  const [selYear, setSelYear] = useState('');

  // Edit period dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<Slot | null>(null);
  const [existingEntry, setExistingEntry] = useState<Entry | null>(null);
  const [editForm, setEditForm] = useState({ subjectId: '', teacherId: '', roomNumber: '' });
  const [saving, setSaving] = useState(false);

  // Slot config dialog
  const [slotOpen, setSlotOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({ dayOfWeek: '1', periodNumber: '1', startTime: '08:00', endTime: '08:45' });

  useEffect(() => {
    fetchClasses(); fetchAllSections(); fetchSubjects(); fetchStaff(); fetchAcYears(); fetchSlots();
  }, []);

  useEffect(() => {
    setFiltSections(selClass ? sections.filter(s => s.classId === selClass) : []);
    setSelSection('');
  }, [selClass, sections]);

  useEffect(() => { if (selSection && selYear) fetchEntries(); }, [selSection, selYear]);

  const fetchClasses = async () => { const r = await fetch('/api/classes?limit=100'); const j = await r.json(); if (j.success) setClasses(j.data?.classes || j.data || []); };
  const fetchAllSections = async () => { const r = await fetch('/api/sections?limit=200'); const j = await r.json(); if (j.success) setSections(j.data?.sections || j.data || []); };
  const fetchSubjects = async () => { const r = await fetch('/api/subjects?limit=100'); const j = await r.json(); if (j.success) setSubjects(j.data?.subjects || j.data || []); };
  const fetchStaff = async () => { const r = await fetch('/api/staff?limit=200'); const j = await r.json(); if (j.success) setStaff(j.data?.staff || j.data || []); };
  const fetchAcYears = async () => {
    const r = await fetch('/api/acad-years'); const j = await r.json();
    if (j.success) { setAcYears(j.data); const cur = j.data.find((y: any) => y.isCurrent); if (cur) setSelYear(cur.id); }
  };
  const fetchSlots = async () => { const r = await fetch('/api/timetable/slots'); const j = await r.json(); if (j.success) setSlots(j.data); };
  const fetchEntries = useCallback(async () => {
    if (!selSection || !selYear) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/timetable/entries?sectionId=${selSection}&academicYearId=${selYear}`);
      const j = await r.json();
      if (j.success) setEntries(j.data);
    } catch { toast({ title: 'Error', description: 'Failed to load timetable', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [selSection, selYear]);

  const openEdit = (slot: Slot) => {
    const existing = entries.find(e => e.slotId === slot.id);
    setEditSlot(slot);
    setExistingEntry(existing || null);
    setEditForm({ subjectId: existing?.subjectId || '', teacherId: existing?.teacherId || '', roomNumber: existing?.roomNumber || '' });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editSlot) return;
    setSaving(true);
    try {
      const r = await fetch('/api/timetable/entries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: selSection, slotId: editSlot.id, academicYearId: selYear,
          subjectId: editForm.subjectId || null, teacherId: editForm.teacherId || null, roomNumber: editForm.roomNumber || null,
        }),
      });
      const j = await r.json();
      if (j.success) { toast({ title: 'Saved' }); setEditOpen(false); fetchEntries(); }
      else toast({ title: 'Conflict', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleClear = async () => {
    if (!existingEntry) return;
    setSaving(true);
    try {
      await fetch(`/api/timetable/entries/${existingEntry.id}`, { method: 'DELETE' });
      toast({ title: 'Cleared' }); setEditOpen(false); fetchEntries();
    } finally { setSaving(false); }
  };

  const handleAddSlot = async () => {
    const r = await fetch('/api/timetable/slots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(slotForm),
    });
    const j = await r.json();
    if (j.success) { toast({ title: 'Slot added' }); setSlotOpen(false); fetchSlots(); }
    else toast({ title: 'Error', description: j.message, variant: 'destructive' });
  };

  const handlePrint = () => {
    const className = classes.find(c => c.id === selClass)?.name || '';
    const sectionName = filtSections.find(s => s.id === selSection)?.name || '';
    window.open(`/api/pdf?type=timetable&sectionId=${selSection}&yearId=${selYear}&className=${encodeURIComponent(className + ' ' + sectionName)}`, '_blank');
  };

  // Build grid: periods × days
  const periods    = ([...new Set(slots.map(s => s.periodNumber))] as number[]).sort((a, b) => a - b);
  const activeDays = ([...new Set(slots.map(s => s.dayOfWeek))] as number[]).sort((a, b) => a - b);

  const getEntry = (day: number, period: number) => {
    const slot = slots.find(s => s.dayOfWeek === day && s.periodNumber === period);
    if (!slot) return null;
    return { slot, entry: entries.find(e => e.slotId === slot.id) };
  };

  // Unique subjects for color mapping
  const subjectColorMap: Record<string, string> = {};
  subjects.forEach((s, i) => { subjectColorMap[s.id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length]; });

  const hasSlots = slots.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Timetable Builder</h1>
            <p className="text-muted-foreground">Create and manage class schedules with clash detection</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSlotOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Add Period Slot
            </Button>
            {selSection && entries.length > 0 && (
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />Print
              </Button>
            )}
          </div>
        </div>

        {/* Selector Row */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label>Academic Year</Label>
                <Select value={selYear} onValueChange={setSelYear}>
                  <SelectTrigger className="mt-1 w-44"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{acYears.map((y: any) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class</Label>
                <Select value={selClass} onValueChange={setSelClass}>
                  <SelectTrigger className="mt-1 w-36"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Section</Label>
                <Select value={selSection} onValueChange={setSelSection} disabled={!selClass}>
                  <SelectTrigger className="mt-1 w-36"><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>{filtSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={fetchEntries} disabled={loading || !selSection}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timetable Grid */}
        {!hasSlots ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
              <Grid3X3 className="h-12 w-12 mb-4" />
              <p className="font-medium">No period slots configured</p>
              <p className="text-sm mb-4">Add period slots to define your school's daily schedule</p>
              <Button onClick={() => setSlotOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Period Slots</Button>
            </CardContent>
          </Card>
        ) : !selSection ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
              <Grid3X3 className="h-12 w-12 mb-4" />
              <p className="font-medium">Select a class and section to view timetable</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="pb-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                {classes.find(c => c.id === selClass)?.name} — {filtSections.find(s => s.id === selSection)?.name}
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border p-2 text-xs font-semibold text-muted-foreground w-20">Period</th>
                    {activeDays.map(d => (
                      <th key={d} className="border border-border p-2 text-xs font-semibold min-w-32">
                        {DAYS[d - 1]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(period => {
                    const slotForPeriod = slots.find(s => s.periodNumber === period);
                    return (
                      <tr key={period}>
                        <td className="border border-border p-2 text-center bg-muted/30">
                          <div className="font-semibold text-xs">P{period}</div>
                          {slotForPeriod && (
                            <div className="text-[10px] text-muted-foreground">
                              {slotForPeriod.startTime}–{slotForPeriod.endTime}
                            </div>
                          )}
                        </td>
                        {activeDays.map(day => {
                          const cell = getEntry(day, period);
                          if (!cell) return <td key={day} className="border border-border p-1 h-16" />;
                          const { slot, entry } = cell;
                          const colorClass = entry?.subjectId ? subjectColorMap[entry.subjectId] : '';
                          return (
                            <td
                              key={day}
                              className="border border-border p-1 h-16 cursor-pointer hover:bg-muted/40 transition-colors card-hover"
                              onClick={() => openEdit(slot)}
                            >
                              {entry && entry.subject ? (
                                <div className={`h-full rounded border p-1.5 ${colorClass}`}>
                                  <div className="font-semibold text-xs leading-tight">{entry.subject.name}</div>
                                  {entry.staff && (
                                    <div className="text-[10px] mt-0.5 opacity-75">
                                      {entry.staff.firstName} {entry.staff.lastName}
                                    </div>
                                  )}
                                  {entry.roomNumber && (
                                    <div className="text-[10px] opacity-60">Room {entry.roomNumber}</div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
                                  <Plus className="h-4 w-4" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        {entries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {([...new Set(entries.filter(e => e.subject).map(e => e.subjectId))] as string[]).map(sid => {
              const sub = subjects.find(s => s.id === sid);
              if (!sub) return null;
              return (
                <span key={sid} className={`text-xs rounded-full px-3 py-1 border font-medium ${subjectColorMap[sid]}`}>
                  {sub.name}
                </span>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Period Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editSlot && `${DAYS[editSlot.dayOfWeek - 1]} · Period ${editSlot.periodNumber}`}
            </DialogTitle>
            <DialogDescription>
              {editSlot && `${editSlot.startTime} – ${editSlot.endTime}`}
              {existingEntry && ' · Click Clear to remove'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Subject</Label>
              <Select value={editForm.subjectId} onValueChange={v => setEditForm(f => ({ ...f, subjectId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Free Period</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Teacher</Label>
              <Select value={editForm.teacherId} onValueChange={v => setEditForm(f => ({ ...f, teacherId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Assign teacher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No teacher</SelectItem>
                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.designation}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Room Number</Label>
              <Input className="mt-1" value={editForm.roomNumber} onChange={e => setEditForm(f => ({ ...f, roomNumber: e.target.value }))} placeholder="e.g. A-101" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {existingEntry && (
              <Button variant="destructive" size="sm" onClick={handleClear} disabled={saving}>
                <Trash2 className="mr-2 h-3.5 w-3.5" />Clear
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Slot Dialog */}
      <Dialog open={slotOpen} onOpenChange={setSlotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Period Slot</DialogTitle><DialogDescription>Define a time slot for a day and period number</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div>
              <Label>Day</Label>
              <Select value={slotForm.dayOfWeek} onValueChange={v => setSlotForm(f => ({ ...f, dayOfWeek: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d, i) => <SelectItem key={i + 1} value={String(i + 1)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Period #</Label>
              <Select value={slotForm.periodNumber} onValueChange={v => setSlotForm(f => ({ ...f, periodNumber: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5,6,7,8].map(n => <SelectItem key={n} value={String(n)}>Period {n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Start Time</Label><Input className="mt-1" type="time" value={slotForm.startTime} onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))} /></div>
            <div><Label>End Time</Label><Input className="mt-1" type="time" value={slotForm.endTime} onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSlot}>Add Slot</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
