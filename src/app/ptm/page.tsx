'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Users, Plus, Calendar, Clock, MapPin,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Edit, Trash2, Eye, RefreshCw, UserCheck, Phone,
  ArrowRight, Star,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmtDate    = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'short' });
const fmtDateSh  = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTime    = (t: string) => t;

const STATUS_BADGE: Record<string, string> = {
  Scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  Ongoing:   'bg-green-100 text-green-700 border-green-200',
  Completed: 'bg-gray-100 text-gray-600 border-gray-200',
  Cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const APT_STATUS: Record<string, string> = {
  Booked:    'bg-blue-100 text-blue-700',
  Attended:  'bg-green-100 text-green-700',
  Missed:    'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-600',
};

const BLANK_MEETING = {
  title: '', meetingDate: new Date().toISOString().slice(0, 10),
  startTime: '08:00', endTime: '12:00', venue: '', description: '',
  slots: '10', slotDuration: '10',
};

const BLANK_APT = {
  studentId: '', parentName: '', parentPhone: '',
  teacherName: '', slotTime: '', notes: '',
};

// Generate time slots given start, end and duration
function generateSlots(start: string, end: string, durationMin: number) {
  const slots: string[] = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let current = sh * 60 + sm;
  const endMins = eh * 60 + em;
  while (current + durationMin <= endMins) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    current += durationMin;
  }
  return slots;
}

export default function PTMPage() {
  const [data,        setData]        = useState<any>(null);
  const [loading,     setLoading]     = useState(false);
  const [page,        setPage]        = useState(1);
  const [meetingForm, setMeetingForm] = useState<any>({ ...BLANK_MEETING });
  const [aptForm,     setAptForm]     = useState<any>({ ...BLANK_APT });
  const [addMtgOpen,  setAddMtgOpen]  = useState(false);
  const [aptOpen,     setAptOpen]     = useState(false);
  const [viewOpen,    setViewOpen]    = useState(false);
  const [selected,    setSelected]    = useState<any>(null);
  const [aptData,     setAptData]     = useState<any>(null);
  const [aptLoading,  setAptLoading]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [students,    setStudents]    = useState<any[]>([]);
  const [staff,       setStaff]       = useState<any[]>([]);
  const [statusFilt,  setStatusFilt]  = useState('');

  useEffect(() => { fetchData(); }, [page, statusFilt]);
  useEffect(() => { fetchStudents(); fetchStaff(); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilt) p.set('status', statusFilt);
      const r = await fetch(`/api/ptm?${p}`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally { setLoading(false); }
  }, [page, statusFilt]);

  const fetchStudents = async () => {
    const r = await fetch('/api/students?status=active&limit=200');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || j.data || []);
  };

  const fetchStaff = async () => {
    const r = await fetch('/api/staff?status=active&limit=200');
    const j = await r.json();
    if (j.success) setStaff(j.data?.staff || j.data || []);
  };

  const fetchApts = async (meetingId: string) => {
    setAptLoading(true);
    try {
      const r = await fetch(`/api/ptm/${meetingId}`);
      const j = await r.json();
      if (j.success) setAptData(j.data);
    } finally { setAptLoading(false); }
  };

  const openView = (meeting: any) => {
    setSelected(meeting);
    setViewOpen(true);
    fetchApts(meeting.id);
  };

  const handleCreateMeeting = async () => {
    if (!meetingForm.title || !meetingForm.meetingDate || !meetingForm.startTime) {
      toast({ title: 'Title, date and start time are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/ptm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...meetingForm, slots: parseInt(meetingForm.slots), slotDuration: parseInt(meetingForm.slotDuration) }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'PTM scheduled', description: j.data.title });
        setAddMtgOpen(false);
        setMeetingForm({ ...BLANK_MEETING });
        fetchData();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleBookApt = async () => {
    if (!aptForm.studentId || !aptForm.parentName || !aptForm.teacherName || !aptForm.slotTime) {
      toast({ title: 'All required fields must be filled', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch(`/api/ptm/${selected.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(aptForm),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Appointment booked', description: `${aptForm.slotTime} — ${aptForm.teacherName}` });
        setAptOpen(false);
        setAptForm({ ...BLANK_APT });
        fetchApts(selected.id);
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const updateAptStatus = async (aptId: string, status: string) => {
    const r = await fetch(`/api/ptm/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId: aptId, status }),
    });
    const j = await r.json();
    if (j.success) { fetchApts(selected.id); fetchData(); }
  };

  const deleteMeeting = async (id: string) => {
    await fetch(`/api/ptm?id=${id}`, { method: 'DELETE' });
    toast({ title: 'Meeting deleted' });
    if (viewOpen) setViewOpen(false);
    fetchData();
  };

  const updateMeetingStatus = async (id: string, status: string) => {
    await fetch('/api/ptm', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    toast({ title: `Status → ${status}` });
    fetchData();
  };

  const meetings  = data?.meetings  || [];
  const summary   = data?.summary   || {};
  const pagination = data?.pagination || {};

  const slots = selected
    ? generateSlots(selected.startTime, selected.endTime, selected.slotDuration || 10)
    : [];

  const aptsBySlot = (slot: string) =>
    (aptData?.appointments || []).filter((a: any) => a.slotTime === slot);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-green-50"><Users className="h-6 w-6 text-green-600" /></span>
              Parent-Teacher Meetings
            </h1>
            <p className="text-muted-foreground mt-0.5">Schedule and manage PTM sessions</p>
          </div>
          <Button onClick={() => { setMeetingForm({ ...BLANK_MEETING }); setAddMtgOpen(true); }} className="gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4" />Schedule PTM
          </Button>
        </div>

        {/* Summary KPIs */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Upcoming',  val: summary.upcoming  || 0, icon: Calendar,     color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-l-blue-500' },
            { label: 'Scheduled', val: summary.scheduled || 0, icon: Clock,        color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-l-amber-500' },
            { label: 'Completed', val: summary.completed || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-l-green-500' },
          ].map(({ label, val, icon: Icon, color, bg, border }) => (
            <Card key={label} className={`border-l-4 ${border} overflow-hidden`}>
              <CardContent className={`pt-4 pb-3 ${bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label} Meetings</p>
                    {loading ? <div className="h-7 w-10 bg-muted animate-pulse rounded mt-1" /> :
                      <p className={`text-3xl font-bold ${color} mt-0.5`}>{val}</p>}
                  </div>
                  <Icon className={`h-7 w-7 ${color} opacity-40`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter + Meeting list */}
        <div className="flex gap-3 items-center flex-wrap">
          <Select value={statusFilt || 'all'} onValueChange={v => { setStatusFilt(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-38"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {['Scheduled', 'Ongoing', 'Completed', 'Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => fetchData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <Card><CardContent className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></CardContent></Card>
          ) : meetings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
                <Users className="h-12 w-12 opacity-20" />
                <p className="font-semibold">No meetings scheduled</p>
                <Button variant="outline" size="sm" onClick={() => setAddMtgOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />Schedule First PTM
                </Button>
              </CardContent>
            </Card>
          ) : meetings.map((mtg: any) => {
            const apptCount  = mtg._count?.appointments || 0;
            const statusCfg  = STATUS_BADGE[mtg.status] || STATUS_BADGE.Scheduled;
            const isPast     = new Date(mtg.meetingDate) < new Date();
            return (
              <Card key={mtg.id} className="hover:shadow-md transition-shadow cursor-pointer card-hover" onClick={() => openView(mtg)}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* Date block */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${isPast ? 'bg-muted' : 'bg-green-50'}`}>
                      <span className="text-xs text-muted-foreground">
                        {new Date(mtg.meetingDate).toLocaleDateString('en-PK', { month: 'short' })}
                      </span>
                      <span className={`text-2xl font-bold leading-none ${isPast ? 'text-muted-foreground' : 'text-green-700'}`}>
                        {new Date(mtg.meetingDate).getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg">{mtg.title}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusCfg}`}>
                          {mtg.status}
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-4 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{mtg.startTime} – {mtg.endTime}</span>
                        {mtg.venue && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{mtg.venue}</span>}
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{apptCount} appointments</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{mtg.slotDuration}min slots</span>
                      </div>
                      {mtg.description && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">{mtg.description}</p>}
                    </div>

                    <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <Button variant="outline" size="sm" onClick={() => openView(mtg)}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />View
                      </Button>
                      {mtg.status === 'Scheduled' && (
                        <Button variant="outline" size="sm" onClick={() => updateMeetingStatus(mtg.id, 'Completed')}>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Page {page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page>=pagination.totalPages} onClick={() => setPage(p=>p+1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Schedule Meeting Dialog ───────────────────────────────────────── */}
      <Dialog open={addMtgOpen} onOpenChange={v => { setAddMtgOpen(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-green-600" />Schedule PTM</DialogTitle>
            <DialogDescription>Set up a parent-teacher meeting session</DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3 py-2 max-h-[65vh] overflow-y-auto">
            <div className="sm:col-span-2">
              <Label>Meeting Title *</Label>
              <Input value={meetingForm.title} onChange={e => setMeetingForm((f: any) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Term 1 PTM — Class 9" className="mt-1" autoFocus />
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={meetingForm.meetingDate} onChange={e => setMeetingForm((f: any) => ({ ...f, meetingDate: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Venue</Label>
              <Input value={meetingForm.venue} onChange={e => setMeetingForm((f: any) => ({ ...f, venue: e.target.value }))}
                placeholder="e.g. Main Hall, Room 5" className="mt-1" />
            </div>
            <div>
              <Label>Start Time *</Label>
              <Input type="time" value={meetingForm.startTime} onChange={e => setMeetingForm((f: any) => ({ ...f, startTime: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={meetingForm.endTime} onChange={e => setMeetingForm((f: any) => ({ ...f, endTime: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Slot Duration (minutes)</Label>
              <Select value={meetingForm.slotDuration} onValueChange={v => setMeetingForm((f: any) => ({ ...f, slotDuration: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['5', '10', '15', '20', '30'].map(d => <SelectItem key={d} value={d}>{d} mins</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Slots per Teacher</Label>
              <Input type="number" min={1} max={50} value={meetingForm.slots}
                onChange={e => setMeetingForm((f: any) => ({ ...f, slots: e.target.value }))} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={meetingForm.description} onChange={e => setMeetingForm((f: any) => ({ ...f, description: e.target.value }))}
                placeholder="Agenda, instructions for parents…" rows={3} className="mt-1 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMtgOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateMeeting} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Meeting Detail / Appointments Dialog ─────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmtDate(selected.meetingDate)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{selected.startTime} – {selected.endTime}</span>
                  {selected.venue && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selected.venue}</span>}
                </DialogDescription>
              </DialogHeader>

              {aptLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
                  {/* Apt summary */}
                  {aptData && (
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Total', val: aptData.summary.total,     color: 'text-slate-700',  bg: 'bg-slate-50' },
                        { label: 'Attended', val: aptData.summary.attended, color: 'text-green-700', bg: 'bg-green-50' },
                        { label: 'Missed',   val: aptData.summary.missed,  color: 'text-red-700',   bg: 'bg-red-50' },
                        { label: 'Cancelled',val: aptData.summary.cancelled, color: 'text-gray-600', bg: 'bg-gray-50' },
                      ].map(({ label, val, color, bg }) => (
                        <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                          <div className="text-xs text-muted-foreground">{label}</div>
                          <div className={`text-xl font-bold ${color}`}>{val}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add appointment button */}
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => { setAptForm({ ...BLANK_APT }); setAptOpen(true); }} className="gap-2">
                      <Plus className="h-3.5 w-3.5" />Book Appointment
                    </Button>
                  </div>

                  {/* Slots grid */}
                  {slots.length > 0 ? (
                    <div className="space-y-2">
                      {slots.map(slot => {
                        const apts = aptsBySlot(slot);
                        return (
                          <div key={slot} className="border rounded-xl overflow-hidden">
                            <div className="bg-muted/30 px-3 py-1.5 flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground">{slot}</span>
                              <span className="text-xs text-muted-foreground">{apts.length} booked</span>
                            </div>
                            {apts.length > 0 && (
                              <div className="divide-y">
                                {apts.map((apt: any) => (
                                  <div key={apt.id} className="px-3 py-2 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm">{apt.student?.fullName}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Parent: {apt.parentName}
                                        {apt.parentPhone && ` · ${apt.parentPhone}`}
                                        {' · '}{apt.teacherName}
                                      </div>
                                    </div>
                                    <Select value={apt.status} onValueChange={v => updateAptStatus(apt.id, v)}>
                                      <SelectTrigger className="h-7 w-32 text-xs">
                                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${APT_STATUS[apt.status] || ''}`}>{apt.status}</span>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {['Booked', 'Attended', 'Missed', 'Cancelled'].map(s =>
                                          <SelectItem key={s} value={s}>{s}</SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No time slots generated — check start/end times
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="ghost" size="sm" className="text-red-500 mr-auto"
                  onClick={() => deleteMeeting(selected.id)}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
                </Button>
                <Button variant="ghost" onClick={() => setViewOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Book Appointment Dialog ───────────────────────────────────────── */}
      <Dialog open={aptOpen} onOpenChange={setAptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>{selected?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Student *</Label>
              <Select value={aptForm.studentId} onValueChange={v => {
                const stu = students.find(s => s.id === v);
                setAptForm((f: any) => ({ ...f, studentId: v, parentName: stu?.fatherName || f.parentName, parentPhone: stu?.fatherPhone || f.parentPhone }));
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select student…" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.currentClass?.name || '—'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Parent Name *</Label>
                <Input value={aptForm.parentName} onChange={e => setAptForm((f: any) => ({ ...f, parentName: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Parent Phone</Label>
                <Input value={aptForm.parentPhone} onChange={e => setAptForm((f: any) => ({ ...f, parentPhone: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Teacher *</Label>
              <Select value={aptForm.teacherName} onValueChange={v => setAptForm((f: any) => ({ ...f, teacherName: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select teacher…" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => <SelectItem key={s.id} value={s.fullName}>{s.fullName} ({s.designation})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Time Slot *</Label>
              <Select value={aptForm.slotTime} onValueChange={v => setAptForm((f: any) => ({ ...f, slotTime: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select slot…" /></SelectTrigger>
                <SelectContent>
                  {slots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={aptForm.notes} onChange={e => setAptForm((f: any) => ({ ...f, notes: e.target.value }))}
                placeholder="Any specific topics to discuss…" rows={2} className="mt-1 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAptOpen(false)}>Cancel</Button>
            <Button onClick={handleBookApt} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Book Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
