'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2, Phone, Mail, MessageSquare, Users, Plus, Search, RefreshCw,
  Edit, Trash2, CheckCircle2, Clock, AlertCircle, ArrowDownLeft, ArrowUpRight,
  Download, Filter,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const TYPES = ['Call', 'Email', 'SMS', 'Meeting', 'WhatsApp', 'Letter'];
const DIRECTIONS = ['Incoming', 'Outgoing'];
const OUTCOMES = ['Resolved', 'Follow-up Required', 'No Answer', 'Voicemail', 'Escalated', 'Informational'];
const REGARDING = ['Fee Payment', 'Attendance', 'Academic Performance', 'Behavior', 'Admission', 'General Inquiry', 'Complaint', 'Transport', 'Health', 'Other'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Call: <Phone className="h-3.5 w-3.5" />,
  Email: <Mail className="h-3.5 w-3.5" />,
  SMS: <MessageSquare className="h-3.5 w-3.5" />,
  Meeting: <Users className="h-3.5 w-3.5" />,
  WhatsApp: <MessageSquare className="h-3.5 w-3.5" />,
  Letter: <Mail className="h-3.5 w-3.5" />,
};

const TYPE_COLORS: Record<string, string> = {
  Call: 'bg-blue-100 text-blue-700 border-blue-200',
  Email: 'bg-purple-100 text-purple-700 border-purple-200',
  SMS: 'bg-green-100 text-green-700 border-green-200',
  Meeting: 'bg-amber-100 text-amber-700 border-amber-200',
  WhatsApp: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Letter: 'bg-slate-100 text-slate-700 border-slate-200',
};

const OUTCOME_COLORS: Record<string, string> = {
  'Resolved': 'bg-green-100 text-green-700',
  'Follow-up Required': 'bg-amber-100 text-amber-700',
  'No Answer': 'bg-slate-100 text-slate-600',
  'Voicemail': 'bg-blue-100 text-blue-600',
  'Escalated': 'bg-red-100 text-red-700',
  'Informational': 'bg-cyan-100 text-cyan-700',
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d: string) => d ? new Date(d).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '';

const empty = {
  date: new Date().toISOString().slice(0, 16),
  type: 'Call',
  direction: 'Outgoing',
  personName: '',
  personRole: 'Parent',
  studentName: '',
  contactNumber: '',
  subject: '',
  regarding: '',
  notes: '',
  outcome: 'Resolved',
  followUpRequired: false,
  followUpDate: '',
  followUpDone: false,
  staffMember: '',
  duration: '',
};

export default function CommunicationLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, calls: 0, emails: 0, meetings: 0, sms: 0, followUpNeeded: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dirFilter, setDirFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [detailLog, setDetailLog] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(limit),
        search, type: typeFilter, direction: dirFilter, outcome: outcomeFilter,
      });
      const res = await fetch(`/api/comm-log?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      if (data.summary) setSummary(data.summary);
    } catch {
      toast({ title: 'Error', description: 'Failed to load', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, dirFilter, outcomeFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...empty, date: new Date().toISOString().slice(0, 16) });
    setShowDialog(true);
  };

  const openEdit = (log: any) => {
    setEditing(log);
    setForm({ ...log, date: log.date ? new Date(log.date).toISOString().slice(0, 16) : '' });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.personName || !form.subject || !form.type) {
      toast({ title: 'Validation', description: 'Person name, subject, and type are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await fetch('/api/comm-log', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: editing.id }) });
        toast({ title: 'Updated', description: 'Communication log updated' });
      } else {
        await fetch('/api/comm-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        toast({ title: 'Logged', description: 'Communication recorded successfully' });
      }
      setShowDialog(false);
      load();
    } catch {
      toast({ title: 'Error', description: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deletLog = async (log: any) => {
    if (!confirm(`Delete this ${log.type} log?`)) return;
    await fetch('/api/comm-log', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: log.id }) });
    toast({ title: 'Deleted' });
    load();
  };

  const markFollowUp = async (log: any) => {
    await fetch('/api/comm-log', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: log.id, followUpDone: true }),
    });
    toast({ title: 'Follow-up marked done' });
    load();
  };

  const exportCsv = () => {
    const headers = ['Date', 'Type', 'Direction', 'Person', 'Role', 'Student', 'Contact', 'Subject', 'Regarding', 'Outcome', 'Staff', 'Notes'];
    const rows = logs.map(l => [
      fmtDate(l.date), l.type, l.direction, l.personName, l.personRole, l.studentName,
      l.contactNumber, l.subject, l.regarding, l.outcome, l.staffMember, `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `communication-log-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Communication Log"
        description="Track all parent, staff, and stakeholder communications"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Log Communication</Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Logs', value: summary.total, color: 'border-l-slate-500', icon: <Filter className="h-4 w-4 text-slate-500" /> },
          { label: 'Calls', value: summary.calls, color: 'border-l-blue-500', icon: <Phone className="h-4 w-4 text-blue-500" /> },
          { label: 'Emails', value: summary.emails, color: 'border-l-purple-500', icon: <Mail className="h-4 w-4 text-purple-500" /> },
          { label: 'Meetings', value: summary.meetings, color: 'border-l-amber-500', icon: <Users className="h-4 w-4 text-amber-500" /> },
          { label: 'SMS', value: summary.sms, color: 'border-l-green-500', icon: <MessageSquare className="h-4 w-4 text-green-500" /> },
          { label: 'Follow-ups Due', value: summary.followUpNeeded, color: 'border-l-red-500', icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search person, student, subject..." className="pl-8" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dirFilter} onValueChange={v => { setDirFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Directions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {DIRECTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={outcomeFilter} onValueChange={v => { setOutcomeFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Outcomes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                {OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No communication logs found</p>
              <p className="text-sm mt-1">Start logging communications to track history</p>
              <Button size="sm" className="mt-4" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Log First Communication</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Regarding</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id} className="cursor-pointer hover:bg-muted/30 card-hover" onClick={() => { setDetailLog(log); setShowDetail(true); }}>
                    <TableCell>
                      <div className="font-medium text-sm">{fmtDate(log.date)}</div>
                      <div className="text-xs text-muted-foreground">{fmtTime(log.date)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`${TYPE_COLORS[log.type]} gap-1 text-xs`}>
                          {TYPE_ICONS[log.type]}{log.type}
                        </Badge>
                        {log.direction === 'Incoming'
                          ? <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />
                          : <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{log.personName}</div>
                      <div className="text-xs text-muted-foreground">{log.personRole}</div>
                    </TableCell>
                    <TableCell className="text-sm">{log.studentName || '—'}</TableCell>
                    <TableCell>
                      <div className="text-sm max-w-[160px] truncate font-medium">{log.subject}</div>
                    </TableCell>
                    <TableCell>
                      {log.regarding && <Badge variant="outline" className="text-xs">{log.regarding}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${OUTCOME_COLORS[log.outcome] || 'bg-slate-100 text-slate-700'}`}>
                        {log.outcome}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      {log.followUpRequired ? (
                        log.followUpDone
                          ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" />Done</span>
                          : (
                            <button
                              onClick={() => markFollowUp(log)}
                              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 hover:underline"
                            >
                              <Clock className="h-3.5 w-3.5" />
                              {log.followUpDate ? fmtDate(log.followUpDate) : 'Pending'}
                            </button>
                          )
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(log)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletLog(log)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Communication Log' : 'Log New Communication'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Date & Time *</Label>
              <Input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select value={form.direction} onValueChange={v => setForm({ ...form, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DIRECTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Regarding</Label>
              <Select value={form.regarding} onValueChange={v => setForm({ ...form, regarding: v })}>
                <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                <SelectContent>{REGARDING.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Person Name *</Label>
              <Input placeholder="Parent / Visitor name" value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Person Role</Label>
              <Select value={form.personRole} onValueChange={v => setForm({ ...form, personRole: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Parent', 'Guardian', 'Student', 'Staff', 'Vendor', 'Other'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Student Name</Label>
              <Input placeholder="Related student (if any)" value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Number</Label>
              <Input placeholder="03XX-XXXXXXX" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Subject *</Label>
              <Input placeholder="Brief subject / topic" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Outcome</Label>
              <Select value={form.outcome} onValueChange={v => setForm({ ...form, outcome: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Staff Member</Label>
              <Input placeholder="Who handled this?" value={form.staffMember} onChange={e => setForm({ ...form, staffMember: e.target.value })} />
            </div>
            {(form.type === 'Call' || form.type === 'Meeting') && (
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Input placeholder="e.g. 15 minutes" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
              </div>
            )}
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Detailed notes about the communication..." rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="followUp" checked={form.followUpRequired} onCheckedChange={v => setForm({ ...form, followUpRequired: !!v })} />
                <Label htmlFor="followUp">Follow-up required</Label>
              </div>
              {form.followUpRequired && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Follow-up Date</Label>
                    <Input type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} />
                  </div>
                  <div className="flex items-center space-x-2 mt-5">
                    <Checkbox id="followUpDone" checked={form.followUpDone} onCheckedChange={v => setForm({ ...form, followUpDone: !!v })} />
                    <Label htmlFor="followUpDone">Follow-up completed</Label>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? 'Update' : 'Save Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Communication Detail</DialogTitle>
          </DialogHeader>
          {detailLog && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${TYPE_COLORS[detailLog.type]} gap-1`}>
                  {TYPE_ICONS[detailLog.type]}{detailLog.type}
                </Badge>
                <Badge variant="outline">{detailLog.direction}</Badge>
                <Badge className={OUTCOME_COLORS[detailLog.outcome] || ''}>{detailLog.outcome}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{fmtDate(detailLog.date)} {fmtTime(detailLog.date)}</span></div>
                <div><span className="text-muted-foreground">Staff:</span> <span className="font-medium">{detailLog.staffMember || '—'}</span></div>
                <div><span className="text-muted-foreground">Person:</span> <span className="font-medium">{detailLog.personName} ({detailLog.personRole})</span></div>
                <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{detailLog.contactNumber || '—'}</span></div>
                {detailLog.studentName && <div className="col-span-2"><span className="text-muted-foreground">Student:</span> <span className="font-medium">{detailLog.studentName}</span></div>}
                {detailLog.regarding && <div><span className="text-muted-foreground">Regarding:</span> <span className="font-medium">{detailLog.regarding}</span></div>}
                {detailLog.duration && <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{detailLog.duration}</span></div>}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Subject</p>
                <p className="text-sm bg-muted/50 rounded-lg p-3">{detailLog.subject}</p>
              </div>
              {detailLog.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">{detailLog.notes}</p>
                </div>
              )}
              {detailLog.followUpRequired && (
                <div className={`rounded-lg p-3 ${detailLog.followUpDone ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {detailLog.followUpDone
                      ? <><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-green-700">Follow-up Completed</span></>
                      : <><Clock className="h-4 w-4 text-amber-600" /><span className="text-amber-700">Follow-up Required</span></>
                    }
                  </div>
                  {detailLog.followUpDate && <p className="text-xs mt-1 text-muted-foreground">Due: {fmtDate(detailLog.followUpDate)}</p>}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {detailLog?.followUpRequired && !detailLog?.followUpDone && (
              <Button variant="outline" onClick={() => { markFollowUp(detailLog); setShowDetail(false); }}>
                <CheckCircle2 className="h-4 w-4 mr-2" />Mark Follow-up Done
              </Button>
            )}
            <Button variant="outline" onClick={() => { setShowDetail(false); openEdit(detailLog); }}>
              <Edit className="h-4 w-4 mr-2" />Edit
            </Button>
            <Button onClick={() => setShowDetail(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
