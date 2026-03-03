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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Users, Calendar, Clock, Phone, Plus, Search, RefreshCw,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, Trash2, Edit,
  MessageSquare, User, BookOpen, Download,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

const SLOTS = [
  '8:00 AM – 8:20 AM', '8:20 AM – 8:40 AM', '8:40 AM – 9:00 AM',
  '9:00 AM – 9:20 AM', '9:20 AM – 9:40 AM', '9:40 AM – 10:00 AM',
  '10:30 AM – 10:50 AM', '10:50 AM – 11:10 AM', '11:10 AM – 11:30 AM',
  '11:30 AM – 11:50 AM', '2:00 PM – 2:20 PM', '2:20 PM – 2:40 PM',
  '2:40 PM – 3:00 PM', '3:00 PM – 3:20 PM',
];

const STATUS_CFG: Record<string, { badge: string; icon: React.ElementType }> = {
  Scheduled: { badge: 'bg-blue-100 text-blue-700 border-blue-200',   icon: Clock },
  Completed: { badge: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  Cancelled: { badge: 'bg-red-100 text-red-700 border-red-200',      icon: XCircle },
};

const BLANK = {
  parentName: '', parentPhone: '', studentName: '', admissionNo: '',
  teacherName: '', subject: '', className: '', meetingDate: new Date().toISOString().slice(0, 10),
  slot: SLOTS[0], purpose: '', notes: '',
};

function StatBadge({ s }: { s: string }) {
  const c = STATUS_CFG[s] || STATUS_CFG.Scheduled;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${c.badge}`}>
      <Icon className="h-3 w-3" />{s}
    </span>
  );
}

export default function MeetingsPage() {
  const [data,       setData]       = useState<any>(null);
  const [loading,    setLoading]    = useState(false);
  const [page,       setPage]       = useState(1);
  const [status,     setStatus]     = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [addOpen,    setAddOpen]    = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [selected,   setSelected]   = useState<any>(null);
  const [form,       setForm]       = useState<any>({ ...BLANK });
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState('');
  const [staff,      setStaff]      = useState<any[]>([]);
  const [view,       setView]       = useState<'list' | 'calendar'>('list');

  useEffect(() => { fetchData(); fetchStaff(); }, []);
  useEffect(() => { fetchData(); }, [page, status, dateFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '25' });
      if (status)     p.set('status', status);
      if (dateFilter) p.set('date',   dateFilter);
      const r = await fetch(`/api/meetings?${p}`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally { setLoading(false); }
  }, [page, status, dateFilter]);

  const fetchStaff = async () => {
    const r = await fetch('/api/staff?limit=100&status=active');
    const j = await r.json();
    if (j.success) setStaff(j.data?.staff || j.data || []);
  };

  const handleAdd = async () => {
    if (!form.parentName || !form.teacherName || !form.meetingDate || !form.slot) {
      toast({ title: 'Parent name, teacher, date and slot required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/meetings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Meeting scheduled', description: `${form.parentName} with ${form.teacherName}` });
        setAddOpen(false); setForm({ ...BLANK }); fetchData();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const updateStatus = async (id: string, newStatus: string, outcome?: string) => {
    const r = await fetch('/api/meetings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus, outcome }),
    });
    const j = await r.json();
    if (j.success) { toast({ title: `Meeting ${newStatus}` }); fetchData(); }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/meetings?id=${id}`, { method: 'DELETE' });
      toast({ title: 'Meeting deleted' });
      fetchData();
    } finally { setDeleting(''); }
  };

  const openEdit = (m: any) => {
    setSelected(m);
    setForm({ ...m });
    setEditOpen(true);
  };

  const exportCSV = () => {
    const meetings = data?.meetings || [];
    const rows = [
      ['Date', 'Slot', 'Student', 'Class', 'Parent', 'Phone', 'Teacher', 'Subject', 'Purpose', 'Status', 'Outcome'],
      ...meetings.map((m: any) => [
        m.meetingDate, m.slot, m.studentName, m.className, m.parentName, m.parentPhone,
        m.teacherName, m.subject, m.purpose, m.status, m.outcome || '',
      ]),
    ];
    const csv  = rows.map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `meetings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const summary    = data?.summary    || {};
  const meetings   = data?.meetings   || [];
  const pagination = data?.pagination || {};

  // Calendar view: group by date
  const byDate = meetings.reduce((acc: any, m: any) => {
    if (!acc[m.meetingDate]) acc[m.meetingDate] = [];
    acc[m.meetingDate].push(m);
    return acc;
  }, {});

  const MeetingForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="space-y-0 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid sm:grid-cols-2 gap-3 pb-4">
        <div>
          <Label>Parent Name *</Label>
          <Input value={form.parentName} onChange={e => setForm((f: any) => ({ ...f, parentName: e.target.value }))} placeholder="Father / Mother name…" className="mt-1" autoFocus />
        </div>
        <div>
          <Label>Parent Phone</Label>
          <Input value={form.parentPhone} onChange={e => setForm((f: any) => ({ ...f, parentPhone: e.target.value }))} placeholder="+92-300-…" className="mt-1" />
        </div>
        <div>
          <Label>Student Name</Label>
          <Input value={form.studentName} onChange={e => setForm((f: any) => ({ ...f, studentName: e.target.value }))} placeholder="Student's full name…" className="mt-1" />
        </div>
        <div>
          <Label>Class</Label>
          <Input value={form.className} onChange={e => setForm((f: any) => ({ ...f, className: e.target.value }))} placeholder="e.g. Grade 5A" className="mt-1" />
        </div>
        <div>
          <Label>Teacher *</Label>
          <Select value={form.teacherName} onValueChange={v => setForm((f: any) => ({ ...f, teacherName: v }))}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select teacher…" /></SelectTrigger>
            <SelectContent>
              {staff.map(s => (
                <SelectItem key={s.id} value={s.fullName}>{s.fullName} — {s.designation}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Subject</Label>
          <Input value={form.subject} onChange={e => setForm((f: any) => ({ ...f, subject: e.target.value }))} placeholder="Subject of concern…" className="mt-1" />
        </div>
        <div>
          <Label>Meeting Date *</Label>
          <Input type="date" value={form.meetingDate} onChange={e => setForm((f: any) => ({ ...f, meetingDate: e.target.value }))} className="mt-1" />
        </div>
        <div>
          <Label>Time Slot *</Label>
          <Select value={form.slot} onValueChange={v => setForm((f: any) => ({ ...f, slot: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{SLOTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Purpose / Agenda</Label>
          <Textarea value={form.purpose} onChange={e => setForm((f: any) => ({ ...f, purpose: e.target.value }))}
            placeholder="Reason for meeting, concerns to discuss…" rows={2} className="mt-1 resize-none" />
        </div>
        <div className="sm:col-span-2">
          <Label>Additional Notes</Label>
          <Textarea value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))}
            placeholder="Extra notes or instructions…" rows={2} className="mt-1 resize-none" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
          Schedule Meeting
        </Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-50"><Users className="h-6 w-6 text-teal-600" /></span>
              Parent-Teacher Meetings
            </h1>
            <p className="text-muted-foreground mt-0.5">Schedule and manage PTM sessions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} className="gap-2"><Download className="h-4 w-4" />Export</Button>
            <Button onClick={() => { setForm({ ...BLANK }); setAddOpen(true); }} className="gap-2 bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4" />Schedule Meeting
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Today',       val: summary.today     || 0, color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-l-blue-500' },
            { label: 'Scheduled',   val: summary.scheduled || 0, color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-l-amber-500' },
            { label: 'Completed',   val: summary.completed || 0, color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-l-green-500' },
            { label: 'Cancelled',   val: summary.cancelled || 0, color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-l-red-500' },
          ].map(({ label, val, color, bg, border }) => (
            <Card key={label} className={`border-l-4 ${border} overflow-hidden`}>
              <CardContent className={`pt-4 pb-3 ${bg}`}>
                <p className="text-xs text-muted-foreground">{label}</p>
                {loading
                  ? <div className="h-7 w-12 bg-muted animate-pulse rounded mt-1" />
                  : <p className={`text-3xl font-bold ${color} mt-0.5`}>{val}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div>
                <Label className="text-xs mb-1 block">From Date</Label>
                <Input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} className="w-40" />
              </div>
              <Select value={status || 'all'} onValueChange={v => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-36 mt-4"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.keys(STATUS_CFG).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {(status || dateFilter) && (
                <Button variant="ghost" size="sm" className="mt-4" onClick={() => { setStatus(''); setDateFilter(''); setPage(1); }}>
                  Clear filters
                </Button>
              )}
              <Button variant="ghost" size="icon" className="mt-4" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="ml-auto mt-4 flex gap-1">
                {(['list', 'calendar'] as const).map(v => (
                  <Button key={v} variant={view === v ? 'default' : 'outline'} size="sm" onClick={() => setView(v)}>
                    {v === 'list' ? 'List' : 'Calendar'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
        ) : view === 'list' ? (

          <Card>
            <CardContent className="p-0">
              {meetings.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <Calendar className="h-12 w-12 mb-3 opacity-20" />
                  <p className="font-semibold">No meetings found</p>
                  <p className="text-sm mt-1">Schedule your first parent-teacher meeting</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => { setForm({ ...BLANK }); setAddOpen(true); }}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />Schedule Meeting
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="pl-4">Date & Slot</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-28">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {meetings.map((m: any) => (
                        <TableRow key={m.id} className="hover:bg-muted/10">
                          <TableCell className="pl-4">
                            <div className="font-medium text-sm">{fmtDate(m.meetingDate)}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />{m.slot}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{m.parentName}</div>
                            {m.parentPhone && (
                              <a href={`tel:${m.parentPhone}`} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                                <Phone className="h-3 w-3" />{m.parentPhone}
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{m.studentName || '—'}</div>
                            {m.className && <div className="text-xs text-muted-foreground">{m.className}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{m.teacherName}</div>
                            {m.subject && <div className="text-xs text-muted-foreground">{m.subject}</div>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-32 truncate">{m.purpose || '—'}</TableCell>
                          <TableCell><StatBadge s={m.status} /></TableCell>
                          <TableCell>
                            <div className="flex gap-0.5">
                              {m.status === 'Scheduled' && <>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600 hover:text-green-700"
                                  onClick={() => updateStatus(m.id, 'Completed')}>Done</Button>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600"
                                  onClick={() => updateStatus(m.id, 'Cancelled')}>Cancel</Button>
                              </>}
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600"
                                onClick={() => remove(m.id)} disabled={deleting === m.id}>
                                {deleting === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                      <span className="text-xs text-muted-foreground">{meetings.length} of {pagination.total} meetings</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

        ) : (

          /* Calendar View */
          <div className="space-y-3">
            {Object.keys(byDate).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No meetings to display</CardContent></Card>
            ) : Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, dayMeetings]: [string, any]) => (
              <Card key={date}>
                <CardHeader className="py-3 px-4 border-b bg-muted/20">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    {fmtDate(date)}
                    <span className="text-muted-foreground font-normal">({dayMeetings.length} meetings)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {dayMeetings.sort((a: any, b: any) => a.slot.localeCompare(b.slot)).map((m: any) => (
                      <div key={m.id} className="px-4 py-3 flex items-start gap-4 hover:bg-muted/10">
                        <div className="text-xs font-mono text-muted-foreground w-36 flex-shrink-0 pt-0.5">{m.slot}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{m.parentName}</span>
                            <span className="text-muted-foreground text-xs">re: {m.studentName || 'student'}</span>
                            <span className="text-muted-foreground text-xs">with {m.teacherName}</span>
                          </div>
                          {m.purpose && <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.purpose}</p>}
                        </div>
                        <StatBadge s={m.status} />
                        {m.status === 'Scheduled' && (
                          <Button variant="outline" size="sm" className="h-7 text-xs flex-shrink-0"
                            onClick={() => updateStatus(m.id, 'Completed')}>Mark Done</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setForm({ ...BLANK }); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-teal-600" />Schedule Meeting</DialogTitle>
            <DialogDescription>Book a parent-teacher meeting slot</DialogDescription>
          </DialogHeader>
          <MeetingForm onSave={handleAdd} onCancel={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>{selected?.parentName} with {selected?.teacherName}</DialogDescription>
          </DialogHeader>
          <MeetingForm onSave={handleAdd} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
