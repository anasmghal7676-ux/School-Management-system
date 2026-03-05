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
import { Loader2, Plus, Trash2, Calendar, Users, MapPin, Clock, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const EVENT_TYPES = ['Annual Day', 'Sports Day', 'Science Fair', 'Parent-Teacher Meeting', 'Exam', 'Holiday', 'Workshop', 'Competition', 'Trip', 'Ceremony', 'Cultural Event', 'Other'];
const TYPE_COLORS: Record<string, string> = { 'Annual Day': 'bg-purple-100 text-purple-700', 'Sports Day': 'bg-green-100 text-green-700', 'Science Fair': 'bg-blue-100 text-blue-700', 'Exam': 'bg-red-100 text-red-700', 'Holiday': 'bg-amber-100 text-amber-700', 'Workshop': 'bg-cyan-100 text-cyan-700' };
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtShort = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—';

export default function EventManagementPage() {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, upcoming: 0, past: 0 });
  const [loading, setLoading] = useState(false);
  const [evDialog, setEvDialog] = useState(false);
  const [regDialog, setRegDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyEv = () => ({ title: '', eventType: 'Other', eventDate: '', startTime: '', endTime: '', venue: '', description: '', organizer: '', maxCapacity: '', targetAudience: 'All', classIds: [] as string[], notes: '' });
  const emptyReg = () => ({ eventId: '', eventTitle: '', participantType: 'Student', studentId: '', studentName: '', staffId: '', staffName: '', className: '', role: 'Participant', notes: '' });
  const [evForm, setEvForm] = useState<any>(emptyEv());
  const [regForm, setRegForm] = useState<any>(emptyReg());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events-mgmt?view=events');
      const data = await res.json();
      setUpcoming(data.upcoming || []); setPast(data.past || []); setClasses(data.classes || []); setSummary(data.summary || {});
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  const loadRegs = useCallback(async (event: any) => {
    setSelectedEvent(event); setLoading(true);
    try {
      const res = await fetch(`/api/events-mgmt?view=registrations&eventId=${event.id}`);
      const data = await res.json();
      setRegistrations(data.registrations || []); setStudents(data.students || []); setStaff(data.staff || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRegStudent = (id: string) => { const s = students.find(x => x.id === id); setRegForm((f: any) => ({ ...f, studentId: id, studentName: s?.fullName || '', className: s?.class?.name || '' })); };
  const handleRegStaff = (id: string) => { const s = staff.find(x => x.id === id); setRegForm((f: any) => ({ ...f, staffId: id, staffName: s?.fullName || '' })); };

  const saveEvent = async () => {
    if (!evForm.title || !evForm.eventDate) { toast({ title: 'Title and date required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/events-mgmt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...evForm, entity: 'event' }) });
      toast({ title: 'Event created' }); setEvDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveReg = async () => {
    if (!regForm.eventId) { toast({ title: 'Event required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/events-mgmt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...regForm, entity: 'registration' }) });
      toast({ title: 'Registered' }); setRegDialog(false); if (selectedEvent) loadRegs(selectedEvent);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const openRegDialog = (event: any) => {
    setRegForm({ ...emptyReg(), eventId: event.id, eventTitle: event.title });
    setRegDialog(true);
    if (!students.length) loadRegs(event);
  };

  const delEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await fetch('/api/events-mgmt', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity: 'event' }) });
    if (selectedEvent?.id === id) setSelectedEvent(null); load();
  };

  const delReg = async (id: string) => {
    await fetch('/api/events-mgmt', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity: 'registration' }) });
    if (selectedEvent) loadRegs(selectedEvent);
  };

  const EventCard = ({ event }: { event: any }) => {
    const isPast = event.eventDate < new Date().toISOString().slice(0, 10);
    return (
      <Card className={`hover:shadow-md transition-all ${isPast ? 'opacity-70' : ''}`}>
        <div className="h-1.5 rounded-t-lg" style={{ backgroundColor: event.eventType === 'Exam' ? '#ef4444' : event.eventType === 'Holiday' ? '#f59e0b' : '#3b82f6' }} />
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-xs ${TYPE_COLORS[event.eventType] || 'bg-gray-100 text-gray-700'}`}>{event.eventType}</Badge>
              </div>
              <p className="font-semibold mt-1.5 truncate">{event.title}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => delEvent(event.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{fmtDate(event.eventDate)}</p>
            {event.startTime && <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}</p>}
            {event.venue && <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{event.venue}</p>}
            {event.organizer && <p>Organizer: {event.organizer}</p>}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />{event.registrationCount || 0} registered</Badge>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openRegDialog(event)}>+ Register</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => loadRegs(event)}>View <ChevronRight className="h-3 w-3" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Event Management" description="Plan, schedule and track school events with registration and attendance"
        actions={<Button size="sm" onClick={() => { setEvForm(emptyEv()); setEvDialog(true); }}><Plus className="h-4 w-4 mr-2" />Create Event</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-2xl font-bold">{summary.upcoming}</p><p className="text-xs text-muted-foreground">Upcoming Events</p></CardContent></Card>
        <Card className="border-l-4 border-l-gray-400"><CardContent className="p-4"><p className="text-2xl font-bold text-gray-600">{summary.past}</p><p className="text-xs text-muted-foreground">Past Events</p></CardContent></Card>
        <Card className="border-l-4 border-l-slate-500"><CardContent className="p-4"><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs text-muted-foreground">Total Events</p></CardContent></Card>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">📅 Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">📁 Past ({past.length})</TabsTrigger>
          <TabsTrigger value="registrations" disabled={!selectedEvent}>👥 {selectedEvent ? selectedEvent.title.slice(0, 20) + '…' : 'Registrations'}</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            upcoming.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No upcoming events</p><Button size="sm" className="mt-3" onClick={() => { setEvForm(emptyEv()); setEvDialog(true); }}>Create Event</Button></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{upcoming.map(e => <EventCard key={e.id} event={e} />)}</div>
          }
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><p>No past events</p></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{past.map(e => <EventCard key={e.id} event={e} />)}</div>
          }
        </TabsContent>

        <TabsContent value="registrations" className="mt-4">
          {!selectedEvent ? <p className="text-center text-muted-foreground py-8 animate-fade-in">Click "View" on an event to see its registrations</p> :
            loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedEvent.title}</h3>
                  <p className="text-xs text-muted-foreground">{fmtDate(selectedEvent.eventDate)} · {registrations.length} registered</p>
                </div>
                <Button size="sm" onClick={() => openRegDialog(selectedEvent)}><Plus className="h-4 w-4 mr-2" />Add Registration</Button>
              </div>
              {registrations.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-8 text-muted-foreground"><p>No registrations yet</p></CardContent></Card> :
                <Card><CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Participant</TableHead><TableHead>Type</TableHead><TableHead>Class</TableHead><TableHead>Role</TableHead><TableHead>Registered</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {registrations.map(r => (
                        <TableRow key={r.id} className="hover:bg-muted/20">
                          <TableCell className="font-medium text-sm">{r.studentName || r.staffName}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{r.participantType}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.className}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.role}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{r.registeredAt ? fmtShort(r.registeredAt) : '—'}</TableCell>
                          <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => delReg(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent></Card>
              }
            </div>
          }
        </TabsContent>
      </Tabs>

      {/* Event Dialog */}
      <Dialog open={evDialog} onOpenChange={setEvDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Event Title *</Label><Input value={evForm.title} onChange={e => setEvForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="e.g. Annual Sports Day 2025" /></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={evForm.eventType} onValueChange={v => setEvForm((f: any) => ({ ...f, eventType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={evForm.eventDate} onChange={e => setEvForm((f: any) => ({ ...f, eventDate: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" value={evForm.startTime} onChange={e => setEvForm((f: any) => ({ ...f, startTime: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>End Time</Label><Input type="time" value={evForm.endTime} onChange={e => setEvForm((f: any) => ({ ...f, endTime: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Venue</Label><Input value={evForm.venue} onChange={e => setEvForm((f: any) => ({ ...f, venue: e.target.value }))} placeholder="e.g. Main Hall, Ground" /></div>
            <div className="space-y-1.5"><Label>Max Capacity</Label><Input type="number" value={evForm.maxCapacity} onChange={e => setEvForm((f: any) => ({ ...f, maxCapacity: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Audience</Label><Select value={evForm.targetAudience} onValueChange={v => setEvForm((f: any) => ({ ...f, targetAudience: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem><SelectItem value="Students">Students</SelectItem><SelectItem value="Staff">Staff</SelectItem><SelectItem value="Parents">Parents</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Organizer</Label><Input value={evForm.organizer} onChange={e => setEvForm((f: any) => ({ ...f, organizer: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={evForm.description} onChange={e => setEvForm((f: any) => ({ ...f, description: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEvDialog(false)}>Cancel</Button><Button onClick={saveEvent} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create Event</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={regDialog} onOpenChange={setRegDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Register for Event</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {regForm.eventTitle && <div className="bg-blue-50 text-blue-800 text-xs rounded px-3 py-2 font-medium">{regForm.eventTitle}</div>}
            <div className="space-y-1.5"><Label>Participant Type</Label><Select value={regForm.participantType} onValueChange={v => setRegForm((f: any) => ({ ...f, participantType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Student">Student</SelectItem><SelectItem value="Staff">Staff</SelectItem><SelectItem value="External">External</SelectItem></SelectContent></Select></div>
            {regForm.participantType === 'Student' && <div className="space-y-1.5"><Label>Student</Label><Select value={regForm.studentId} onValueChange={handleRegStudent}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.class?.name}</SelectItem>)}</SelectContent></Select></div>}
            {regForm.participantType === 'Staff' && <div className="space-y-1.5"><Label>Staff</Label><Select value={regForm.staffId} onValueChange={handleRegStaff}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></div>}
            {regForm.participantType === 'External' && <div className="space-y-1.5"><Label>Name</Label><Input value={regForm.studentName} onChange={e => setRegForm((f: any) => ({ ...f, studentName: e.target.value }))} /></div>}
            <div className="space-y-1.5"><Label>Role</Label><Select value={regForm.role} onValueChange={v => setRegForm((f: any) => ({ ...f, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Participant">Participant</SelectItem><SelectItem value="Organizer">Organizer</SelectItem><SelectItem value="Volunteer">Volunteer</SelectItem><SelectItem value="Judge">Judge</SelectItem><SelectItem value="Speaker">Speaker</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRegDialog(false)}>Cancel</Button><Button onClick={saveReg} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Register</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
