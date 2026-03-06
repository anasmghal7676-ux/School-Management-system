'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Edit, Trash2, Calendar, Users, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Generate time slots
function genSlots(start: string, end: string, dur: number): string[] {
  if (!start || !end || !dur) return [];
  const slots: string[] = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  while (h * 60 + m + dur <= eh * 60 + em) {
    const s = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const em2 = m + dur, eh2 = h + Math.floor(em2 / 60);
    const em3 = em2 % 60;
    slots.push(`${s} - ${String(eh2).padStart(2,'0')}:${String(em3).padStart(2,'0')}`);
    m += dur; if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
  }
  return slots;
}

export default function ParentMeetingSchedulerPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [bookSummary, setBookSummary] = useState({ total: 0, attended: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [mtgDialog, setMtgDialog] = useState(false);
  const [bookDialog, setBookDialog] = useState(false);
  const [editingMtg, setEditingMtg] = useState<any>(null);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [saving, setSaving] = useState(false);

  const emptyMtg = () => ({ title: '', date: '', classId: '', className: '', teacherId: '', teacherName: '', venue: '', slotStart: '08:00', slotEnd: '12:00', slotDuration: '10', notes: '' });
  const emptyBook = () => ({ meetingId: '', studentId: '', studentName: '', parentName: '', parentPhone: '', slot: '', notes: '' });
  const [mtgForm, setMtgForm] = useState<any>(emptyMtg());
  const [bookForm, setBookForm] = useState<any>(emptyBook());

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parent-mtg?view=meetings');
      const data = await res.json();
      setMeetings(data.meetings || []); setClasses(data.classes || []); setStaff(data.staff || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'bookings', meetingId: selectedMeeting });
      const res = await fetch(`/api/parent-mtg?${params}`);
      const data = await res.json();
      setBookings(data.bookings || []); setStudents(data.students || []);
      setBookSummary(data.summary || {}); if (!meetings.length) setMeetings(data.meetings || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [selectedMeeting, meetings.length]);

  useEffect(() => { loadMeetings(); }, [loadMeetings]);

  const handleMtgTeacher = (id: string) => { const s = staff.find(x => x.id === id); setMtgForm((f: any) => ({ ...f, teacherId: id, teacherName: s?.fullName || '' })); };
  const handleMtgClass = (id: string) => { const c = classes.find(x => x.id === id); setMtgForm((f: any) => ({ ...f, classId: id, className: c?.name || '' })); };
  const handleBookStudent = (id: string) => { const s = students.find(x => x.id === id); setBookForm((f: any) => ({ ...f, studentId: id, studentName: s?.fullName || '', parentName: s?.fatherName || '', parentPhone: s?.fatherPhone || '' })); };
  const handleBookMeeting = (id: string) => { const m = meetings.find(x => x.id === id); setBookForm((f: any) => ({ ...f, meetingId: id, meetingTitle: m?.title || '' })); };

  const saveMtg = async () => {
    if (!mtgForm.title || !mtgForm.date) { toast({ title: 'Title and date required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/parent-mtg', { method: editingMtg ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingMtg ? { ...mtgForm, entity: 'meeting', id: editingMtg.id } : { ...mtgForm, entity: 'meeting' }) });
      toast({ title: editingMtg ? 'Updated' : 'Meeting created' }); setMtgDialog(false); loadMeetings();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveBook = async () => {
    if (!bookForm.studentId || !bookForm.meetingId || !bookForm.slot) { toast({ title: 'Student, meeting and slot required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/parent-mtg', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...bookForm, entity: 'booking', attended: false }) });
      toast({ title: 'Booking created' }); setBookDialog(false); loadBookings();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const toggleAttended = async (b: any) => {
    await fetch('/api/parent-mtg', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id, entity: 'booking', attended: !b.attended }) });
    loadBookings();
  };

  const slots = genSlots(mtgForm.slotStart, mtgForm.slotEnd, Number(mtgForm.slotDuration));
  const meetingSlots = bookForm.meetingId ? genSlots(meetings.find(m => m.id === bookForm.meetingId)?.slotStart || '', meetings.find(m => m.id === bookForm.meetingId)?.slotEnd || '', Number(meetings.find(m => m.id === bookForm.meetingId)?.slotDuration || 10)) : [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Parent Meeting Scheduler" description="Schedule parent-teacher meetings, manage slot bookings and track attendance"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingMtg(null); setMtgForm(emptyMtg()); setMtgDialog(true); }}><Plus className="h-4 w-4 mr-2" />New Meeting</Button>
          <Button size="sm" onClick={() => { setBookForm(emptyBook()); setBookDialog(true); }}><Calendar className="h-4 w-4 mr-2" />Book Slot</Button>
        </div>}
      />

      <Tabs defaultValue="meetings">
        <TabsList>
          <TabsTrigger value="meetings">📅 Meetings ({meetings.length})</TabsTrigger>
          <TabsTrigger value="bookings" onClick={loadBookings}>📋 Bookings ({bookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="meetings" className="mt-4 space-y-4">
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            meetings.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No meetings scheduled yet</p><Button size="sm" className="mt-3" onClick={() => { setEditingMtg(null); setMtgForm(emptyMtg()); setMtgDialog(true); }}><Plus className="h-4 w-4 mr-2" />Schedule First Meeting</Button></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {meetings.map(mtg => (
                <Card key={mtg.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><p className="font-semibold">{mtg.title}</p><p className="text-xs text-muted-foreground">📅 {fmtDate(mtg.date)}</p></div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingMtg(mtg); setMtgForm(mtg); setMtgDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { if (confirm('Delete?')) { await fetch('/api/parent-mtg', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: mtg.id, entity: 'meeting' }) }); loadMeetings(); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
                      {mtg.className && <p>🎓 Class: {mtg.className}</p>}
                      {mtg.teacherName && <p>👤 Teacher: {mtg.teacherName}</p>}
                      {mtg.venue && <p>📍 Venue: {mtg.venue}</p>}
                      <p>⏱ Slots: {mtg.slotStart}–{mtg.slotEnd} ({mtg.slotDuration} min each)</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />{mtg.bookingCount || 0} bookings</Badge>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => { setSelectedMeeting(mtg.id); document.querySelector('[value="bookings"]')?.dispatchEvent(new MouseEvent('click')); }}>View Bookings →</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>

        <TabsContent value="bookings" className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-l-4 border-l-slate-500"><CardContent className="p-3"><p className="text-2xl font-bold">{bookSummary.total}</p><p className="text-xs text-muted-foreground">Total Bookings</p></CardContent></Card>
            <Card className="border-l-4 border-l-green-500"><CardContent className="p-3"><p className="text-2xl font-bold text-green-700">{bookSummary.attended}</p><p className="text-xs text-muted-foreground">Attended</p></CardContent></Card>
            <Card className="border-l-4 border-l-amber-500"><CardContent className="p-3"><p className="text-2xl font-bold text-amber-700">{bookSummary.pending}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
          </div>
          <div className="flex gap-3">
            <Select value={selectedMeeting} onValueChange={v => setSelectedMeeting(v === 'all' ? '' : v)}><SelectTrigger className="w-60"><SelectValue placeholder="All Meetings" /></SelectTrigger><SelectContent><SelectItem value="all">All Meetings</SelectItem>{meetings.map(m => <SelectItem key={m.id} value={m.id}>{m.title} — {fmtDate(m.date)}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" onClick={loadBookings}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            bookings.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No bookings found</p></CardContent></Card> :
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Parent</TableHead><TableHead>Time Slot</TableHead><TableHead>Meeting</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {bookings.map(b => (
                    <TableRow key={b.id} className={`hover:bg-muted/20 ${b.attended ? 'opacity-60' : ''}`}>
                      <TableCell className="font-medium text-sm">{b.studentName}</TableCell>
                      <TableCell><div className="text-sm">{b.parentName}</div><div className="text-xs text-muted-foreground">{b.parentPhone}</div></TableCell>
                      <TableCell><Badge variant="outline" className="text-xs font-mono">{b.slot}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.meetingTitle || meetings.find(m => m.id === b.meetingId)?.title}</TableCell>
                      <TableCell><Badge className={`text-xs ${b.attended ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{b.attended ? '✓ Attended' : 'Pending'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleAttended(b)}>{b.attended ? 'Unmark' : 'Mark Attended'}</Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { if (confirm('Delete?')) { await fetch('/api/parent-mtg', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id, entity: 'booking' }) }); loadBookings(); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          }
        </TabsContent>
      </Tabs>

      {/* Meeting Dialog */}
      <Dialog open={mtgDialog} onOpenChange={setMtgDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingMtg ? 'Edit Meeting' : 'Schedule Meeting'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Title *</Label><Input value={mtgForm.title} onChange={e => setMtgForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="e.g. Class 5 PTM – Term 1" /></div>
            <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={mtgForm.date} onChange={e => setMtgForm((f: any) => ({ ...f, date: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Venue</Label><Input value={mtgForm.venue} onChange={e => setMtgForm((f: any) => ({ ...f, venue: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Class</Label><Select value={mtgForm.classId} onValueChange={handleMtgClass}><SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Teacher</Label><Select value={mtgForm.teacherId} onValueChange={handleMtgTeacher}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Slots Start</Label><Input type="time" value={mtgForm.slotStart} onChange={e => setMtgForm((f: any) => ({ ...f, slotStart: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Slots End</Label><Input type="time" value={mtgForm.slotEnd} onChange={e => setMtgForm((f: any) => ({ ...f, slotEnd: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Slot Duration (minutes)</Label><Select value={mtgForm.slotDuration} onValueChange={v => setMtgForm((f: any) => ({ ...f, slotDuration: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['5','10','15','20','30'].map(d => <SelectItem key={d} value={d}>{d} minutes</SelectItem>)}</SelectContent></Select></div>
            {slots.length > 0 && <div className="col-span-2 bg-blue-50 rounded p-2 text-xs text-blue-800"><p className="font-medium">Preview: {slots.length} slots</p><p>{slots.slice(0, 3).join(', ')}{slots.length > 3 ? ` ... +${slots.length - 3} more` : ''}</p></div>}
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea value={mtgForm.notes} onChange={e => setMtgForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMtgDialog(false)}>Cancel</Button><Button onClick={saveMtg} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingMtg ? 'Update' : 'Schedule'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookDialog} onOpenChange={setBookDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Book a Slot</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Meeting *</Label><Select value={bookForm.meetingId} onValueChange={handleBookMeeting}><SelectTrigger><SelectValue placeholder="Select meeting" /></SelectTrigger><SelectContent>{meetings.map(m => <SelectItem key={m.id} value={m.id}>{m.title} — {fmtDate(m.date)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Student *</Label><Select value={bookForm.studentId} onValueChange={handleBookStudent}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.class?.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Parent Name</Label><Input value={bookForm.parentName} onChange={e => setBookForm((f: any) => ({ ...f, parentName: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={bookForm.parentPhone} onChange={e => setBookForm((f: any) => ({ ...f, parentPhone: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Time Slot *</Label><Select value={bookForm.slot} onValueChange={v => setBookForm((f: any) => ({ ...f, slot: v }))}><SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger><SelectContent>{meetingSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Notes</Label><Input value={bookForm.notes} onChange={e => setBookForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBookDialog(false)}>Cancel</Button><Button onClick={saveBook} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Book</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
