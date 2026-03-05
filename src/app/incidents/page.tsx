'use client';

export const dynamic = "force-dynamic"

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
import { Separator } from '@/components/ui/separator';
import {
  Loader2, ShieldAlert, AlertTriangle, CheckCircle2, Clock, ChevronLeft, ChevronRight,
  Plus, Search, RefreshCw, Eye, Edit, Trash2, MapPin, Calendar, Bell, ArrowRight,
  XCircle, FileText, Users, TrendingDown, Activity, Filter,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// ── Config ────────────────────────────────────────────────────────────────────

const INCIDENT_TYPES = [
  'Bullying', 'Fighting', 'Vandalism', 'Theft', 'Misconduct',
  'Accident', 'Harassment', 'Substance Abuse', 'Unauthorized Absence', 'Other',
];

const SEVERITY: Record<string, { dot: string; badge: string }> = {
  Low:      { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  Medium:   { dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  High:     { dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  Critical: { dot: 'bg-red-600',    badge: 'bg-red-100 text-red-700 border-red-200' },
};

const STATUS: Record<string, { badge: string; icon: React.ElementType; next: string[] }> = {
  'Open':         { badge: 'bg-red-100 text-red-700 border-red-200',       icon: AlertTriangle,  next: ['Under-Review', 'Resolved'] },
  'Under-Review': { badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock,          next: ['Resolved', 'Closed'] },
  'Resolved':     { badge: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2,   next: ['Closed'] },
  'Closed':       { badge: 'bg-gray-100 text-gray-600 border-gray-200',    icon: XCircle,        next: [] },
};

const PIE_COLORS = ['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#06b6d4','#f97316','#6366f1','#84cc16'];

const BLANK = {
  title: '', incidentDate: new Date().toISOString().slice(0, 10),
  reportedBy: '', location: '', incidentType: 'Bullying', severity: 'Medium',
  description: '', witnesses: '', actionTaken: '', followUpDate: '', followUpNotes: '',
  parentNotified: false,
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtTs   = (d: string) => new Date(d).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Sub-components ────────────────────────────────────────────────────────────

function SevBadge({ s }: { s: string }) {
  const c = SEVERITY[s] || SEVERITY.Low;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${c.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{s}
    </span>
  );
}

function StatBadge({ s }: { s: string }) {
  const c = STATUS[s] || STATUS['Open'];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${c.badge}`}>
      <Icon className="h-3 w-3" />{s}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IncidentsPage() {
  // Data
  const [data,       setData]      = useState<any>(null);
  const [loading,    setLoading]   = useState(false);
  const [page,       setPage]      = useState(1);

  // Filters
  const [search,    setSearch]    = useState('');
  const [sfStatus,  setSfStatus]  = useState('');
  const [sfSev,     setSfSev]     = useState('');
  const [sfType,    setSfType]    = useState('');

  // Dialogs / panels
  const [addOpen,    setAddOpen]    = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected,   setSelected]   = useState<any>(null);

  // Form
  const [form,    setForm]    = useState<any>({ ...BLANK });
  const [saving,  setSaving]  = useState(false);
  const [deleting, setDeleting] = useState('');

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (search)   p.set('search',   search);
      if (sfStatus) p.set('status',   sfStatus);
      if (sfSev)    p.set('severity', sfSev);
      if (sfType)   p.set('type',     sfType);
      const r = await fetch(`/api/incidents?${p}`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally { setLoading(false); }
  }, [page, search, sfStatus, sfSev, sfType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const submit = async (editing = false) => {
    if (!form.title || !form.incidentDate || !form.reportedBy || !form.description) {
      toast({ title: 'Title, date, reporter and description are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const url    = editing ? `/api/incidents/${selected.id}` : '/api/incidents';
      const method = editing ? 'PATCH' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const j = await r.json();
      if (j.success) {
        toast({ title: editing ? 'Incident updated' : 'Incident filed', description: j.data.title });
        editing ? setEditOpen(false) : setAddOpen(false);
        setForm({ ...BLANK });
        if (detailOpen && editing) setSelected(j.data);
        fetchData();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const changeStatus = async (id: string, status: string) => {
    const r = await fetch(`/api/incidents/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const j = await r.json();
    if (j.success) {
      toast({ title: `Status → ${status}` });
      if (selected?.id === id) setSelected((s: any) => ({ ...s, status }));
      fetchData();
    }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/incidents/${id}`, { method: 'DELETE' });
      toast({ title: 'Incident deleted' });
      if (detailOpen && selected?.id === id) setDetailOpen(false);
      fetchData();
    } finally { setDeleting(''); }
  };

  const openAdd  = ()           => { setForm({ ...BLANK }); setAddOpen(true); };
  const openEdit = (inc: any)   => {
    setSelected(inc);
    setForm({
      title: inc.title, incidentDate: inc.incidentDate?.slice(0,10),
      reportedBy: inc.reportedBy, location: inc.location || '',
      incidentType: inc.incidentType, severity: inc.severity,
      description: inc.description, witnesses: inc.witnesses || '',
      actionTaken: inc.actionTaken || '', followUpDate: inc.followUpDate?.slice(0,10) || '',
      followUpNotes: inc.followUpNotes || '', parentNotified: inc.parentNotified,
    });
    setEditOpen(true);
  };
  const openDetail = (inc: any) => { setSelected(inc); setDetailOpen(true); };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const summary    = data?.summary    || {};
  const incidents  = data?.incidents  || [];
  const pagination = data?.pagination || {};
  const typeBreakdown = summary?.typeBreakdown || [];

  const pieData = typeBreakdown.map((t: any, i: number) => ({
    name: t.incidentType, value: t._count, fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const sevBreakdown = Object.keys(SEVERITY).map(sev => ({
    name: sev,
    value: incidents.filter((i: any) => i.severity === sev).length,
    fill: { Low: '#3b82f6', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' }[sev] || '#888',
  })).filter(s => s.value > 0);

  // ── Shared form renderer ────────────────────────────────────────────────────

  const IncidentForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="space-y-0 max-h-[68vh] overflow-y-auto pr-1">
      <div className="grid sm:grid-cols-2 gap-3 pb-4">
        <div className="sm:col-span-2">
          <Label>Title *</Label>
          <Input value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))}
            placeholder="Brief incident title…" className="mt-1" autoFocus />
        </div>
        <div>
          <Label>Date *</Label>
          <Input type="date" value={form.incidentDate}
            onChange={e => setForm((f: any) => ({ ...f, incidentDate: e.target.value }))} className="mt-1" />
        </div>
        <div>
          <Label>Reported By *</Label>
          <Input value={form.reportedBy} onChange={e => setForm((f: any) => ({ ...f, reportedBy: e.target.value }))}
            placeholder="Name of reporter…" className="mt-1" />
        </div>
        <div>
          <Label>Incident Type</Label>
          <Select value={form.incidentType} onValueChange={v => setForm((f: any) => ({ ...f, incidentType: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{INCIDENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Severity</Label>
          <Select value={form.severity} onValueChange={v => setForm((f: any) => ({ ...f, severity: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.keys(SEVERITY).map(s => (
                <SelectItem key={s} value={s}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full inline-block ${SEVERITY[s].dot}`} />{s}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Location</Label>
          <Input value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))}
            placeholder="Where did it happen? e.g. Classroom 5A, Playground…" className="mt-1" />
        </div>
        <div className="sm:col-span-2">
          <Label>Description *</Label>
          <Textarea value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
            placeholder="Detailed account of what happened…" rows={4} className="mt-1 resize-none" />
        </div>
        <div className="sm:col-span-2">
          <Label>Witnesses</Label>
          <Textarea value={form.witnesses} onChange={e => setForm((f: any) => ({ ...f, witnesses: e.target.value }))}
            placeholder="Names of people who witnessed the incident…" rows={2} className="mt-1 resize-none" />
        </div>
        <div className="sm:col-span-2">
          <Label>Immediate Action Taken</Label>
          <Textarea value={form.actionTaken} onChange={e => setForm((f: any) => ({ ...f, actionTaken: e.target.value }))}
            placeholder="What action was taken immediately after the incident…" rows={2} className="mt-1 resize-none" />
        </div>
        <div>
          <Label>Follow-up Date</Label>
          <Input type="date" value={form.followUpDate}
            onChange={e => setForm((f: any) => ({ ...f, followUpDate: e.target.value }))} className="mt-1" />
        </div>
        <div className="flex items-center gap-2 self-end pb-1">
          <input type="checkbox" id="pNotif" checked={form.parentNotified}
            onChange={e => setForm((f: any) => ({ ...f, parentNotified: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300" />
          <Label htmlFor="pNotif" className="cursor-pointer font-normal card-hover">Parents have been notified</Label>
        </div>
        {form.followUpDate && (
          <div className="sm:col-span-2">
            <Label>Follow-up Notes</Label>
            <Textarea value={form.followUpNotes} onChange={e => setForm((f: any) => ({ ...f, followUpNotes: e.target.value }))}
              placeholder="Notes for follow-up…" rows={2} className="mt-1 resize-none" />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
          Save Report
        </Button>
      </DialogFooter>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-red-100"><ShieldAlert className="h-6 w-6 text-red-600" /></span>
              Incident Management
            </h1>
            <p className="text-muted-foreground mt-1 ml-0.5">Track, investigate and resolve school incidents</p>
          </div>
          <Button onClick={openAdd} className="bg-red-600 hover:bg-red-700 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />Report Incident
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Open',         val: summary.open        || 0, Icon: AlertTriangle, border: 'border-l-red-500',    text: 'text-red-600',    bg: 'bg-red-50/60' },
            { label: 'Under Review', val: summary.underReview || 0, Icon: Clock,         border: 'border-l-amber-500',  text: 'text-amber-600',  bg: 'bg-amber-50/60' },
            { label: 'Resolved',     val: summary.resolved    || 0, Icon: CheckCircle2,  border: 'border-l-green-500',  text: 'text-green-600',  bg: 'bg-green-50/60' },
            { label: 'Critical',     val: summary.critical    || 0, Icon: ShieldAlert,   border: 'border-l-rose-600',   text: 'text-rose-700',   bg: 'bg-rose-50/60' },
          ].map(({ label, val, Icon, border, text, bg }) => (
            <Card key={label} className={`border-l-4 ${border} overflow-hidden`}>
              <CardContent className={`pt-4 pb-3 ${bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                    {loading
                      ? <div className="h-8 w-16 bg-muted animate-pulse rounded mt-1" />
                      : <p className={`text-3xl font-bold ${text} mt-0.5`}>{val}</p>}
                  </div>
                  <Icon className={`h-8 w-8 ${text} opacity-40`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="list">
          <TabsList className="mb-2">
            <TabsTrigger value="list" className="gap-1.5"><FileText className="h-4 w-4" />Incident List</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><Activity className="h-4 w-4" />Analytics</TabsTrigger>
          </TabsList>

          {/* ── LIST TAB ─────────────────────────────────────────────────── */}
          <TabsContent value="list" className="space-y-4">

            {/* Filters */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="relative flex-1 min-w-52">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search title, description, reporter, location…"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                      className="pl-8"
                    />
                  </div>
                  <Select value={sfStatus || 'all'} onValueChange={v => { setSfStatus(v === 'all' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="w-38"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.keys(STATUS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={sfSev || 'all'} onValueChange={v => { setSfSev(v === 'all' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="w-34"><SelectValue placeholder="Severity" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      {Object.keys(SEVERITY).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={sfType || 'all'} onValueChange={v => { setSfType(v === 'all' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {INCIDENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => fetchData()} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  {(search || sfStatus || sfSev || sfType) && (
                    <Button variant="outline" size="sm" onClick={() => { setSearch(''); setSfStatus(''); setSfSev(''); setSfType(''); setPage(1); }}>
                      Clear filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                  </div>
                ) : incidents.length === 0 ? (
                  <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
                    <div className="p-4 rounded-full bg-muted/50"><ShieldAlert className="h-10 w-10 opacity-30" /></div>
                    <p className="font-semibold">No incidents found</p>
                    <p className="text-sm">Adjust filters or file a new incident report</p>
                    <Button variant="outline" size="sm" onClick={openAdd}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />Report Incident
                    </Button>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="pl-4 w-[220px]">Incident</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Reporter</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Parents</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incidents.map((inc: any) => (
                          <TableRow
                            key={inc.id}
                            className="hover:bg-muted/20 cursor-pointer card-hover"
                            onClick={() => openDetail(inc)}
                          >
                            <TableCell className="pl-4">
                              <p className="font-semibold text-sm leading-tight truncate max-w-[200px]">{inc.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{inc.description}</p>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                                {inc.incidentType}
                              </span>
                            </TableCell>
                            <TableCell><SevBadge s={inc.severity} /></TableCell>
                            <TableCell><StatBadge s={inc.status} /></TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(inc.incidentDate)}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{inc.reportedBy}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {inc.location
                                ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3 flex-shrink-0" /><span className="truncate max-w-[100px]">{inc.location}</span></span>
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {inc.parentNotified
                                ? <span className="text-xs text-green-600 flex items-center gap-1 whitespace-nowrap"><CheckCircle2 className="h-3 w-3" />Yes</span>
                                : <span className="text-xs text-muted-foreground">No</span>}
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => openDetail(inc)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(inc)}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7 text-red-400 hover:text-red-600"
                                  title="Delete" onClick={() => remove(inc.id)}
                                  disabled={deleting === inc.id}
                                >
                                  {deleting === inc.id
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                        <span className="text-xs text-muted-foreground">
                          {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total} incidents
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ANALYTICS TAB ────────────────────────────────────────────── */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Type pie */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-base">Incidents by Type</CardTitle>
                  <CardDescription>Distribution across all incident types</CardDescription>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={85} innerRadius={40}
                          paddingAngle={2}>
                          {pieData.map((d: any, i: number) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip formatter={(v: number, n: string) => [v, n]} />
                        <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No incidents recorded yet</div>
                  )}
                </CardContent>
              </Card>

              {/* Severity bar */}
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-base">Incidents by Severity</CardTitle>
                  <CardDescription>Current page data</CardDescription>
                </CardHeader>
                <CardContent>
                  {sevBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={sevBreakdown} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" name="Incidents" radius={[5, 5, 0, 0]}>
                          {sevBreakdown.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No incidents recorded yet</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Type breakdown table */}
            {typeBreakdown.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Detailed Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Incident Type</TableHead>
                        <TableHead>Count</TableHead>
                        <TableHead>Share</TableHead>
                        <TableHead className="w-48">Visual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...typeBreakdown].sort((a: any, b: any) => b._count - a._count).map((t: any, i: number) => {
                        const pct = pagination.total > 0 ? (t._count / pagination.total) * 100 : 0;
                        return (
                          <TableRow key={t.incidentType} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="font-medium">{t.incidentType}</TableCell>
                            <TableCell className="font-bold text-lg">{t._count}</TableCell>
                            <TableCell className="text-muted-foreground">{pct.toFixed(1)}%</TableCell>
                            <TableCell>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ── ADD DIALOG ───────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setForm({ ...BLANK }); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />Report New Incident
            </DialogTitle>
            <DialogDescription>File a complete incident report for school records</DialogDescription>
          </DialogHeader>
          <IncidentForm onSave={() => submit(false)} onCancel={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ──────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={v => { setEditOpen(v); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Incident Report</DialogTitle>
            <DialogDescription>{selected?.title}</DialogDescription>
          </DialogHeader>
          <IncidentForm onSave={() => submit(true)} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* ── DETAIL DIALOG ────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selected && (() => {
            const scfg = STATUS[selected.status] || STATUS['Open'];
            const StatusIcon = scfg.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-xl leading-tight">{selected.title}</DialogTitle>
                      <div className="flex items-center flex-wrap gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />{fmtTs(selected.incidentDate)}
                        </span>
                        {selected.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />{selected.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                      <SevBadge s={selected.severity} />
                      <StatBadge s={selected.status} />
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto py-1 pr-1">
                  {/* Meta row */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Type</p>
                      <p className="font-semibold">{selected.incidentType}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Reported By</p>
                      <p className="font-semibold">{selected.reportedBy}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
                    <p className="text-sm leading-relaxed bg-muted/20 rounded-xl p-4 whitespace-pre-wrap">{selected.description}</p>
                  </div>

                  {selected.witnesses && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                        <Users className="h-3.5 w-3.5 inline mr-1" />Witnesses
                      </p>
                      <p className="text-sm bg-muted/20 rounded-xl p-4">{selected.witnesses}</p>
                    </div>
                  )}

                  {selected.actionTaken && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Action Taken</p>
                      <p className="text-sm bg-green-50 border border-green-200 rounded-xl p-4">{selected.actionTaken}</p>
                    </div>
                  )}

                  {(selected.followUpDate || selected.followUpNotes) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-blue-700 mb-1.5">Follow-up</p>
                      {selected.followUpDate && <p className="text-sm text-blue-600 font-medium">Scheduled: {fmtDate(selected.followUpDate)}</p>}
                      {selected.followUpNotes && <p className="text-sm text-blue-600 mt-1">{selected.followUpNotes}</p>}
                    </div>
                  )}

                  {/* Parent notification */}
                  <div className={`rounded-xl p-3 flex items-center gap-2 ${selected.parentNotified ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                    {selected.parentNotified
                      ? <><CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" /><span className="text-sm text-green-700 font-medium">Parents notified</span>
                          {selected.parentNotifiedAt && <span className="text-xs text-green-600 ml-1">on {fmtDate(selected.parentNotifiedAt)}</span>}</>
                      : <><Bell className="h-4 w-4 text-amber-600 flex-shrink-0" /><span className="text-sm text-amber-700">Parents not yet notified</span></>}
                  </div>

                  <Separator />

                  {/* Status workflow */}
                  {scfg.next.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Move to Status</p>
                      <div className="flex gap-2 flex-wrap">
                        {scfg.next.map(ns => (
                          <Button key={ns} variant="outline" size="sm" className="gap-1.5"
                            onClick={() => changeStatus(selected.id, ns)}>
                            <ArrowRight className="h-3.5 w-3.5" />Mark as {ns}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 mr-auto"
                    onClick={() => remove(selected.id)} disabled={!!deleting}>
                    {deleting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
                    Delete
                  </Button>
                  <Button variant="outline" onClick={() => { setDetailOpen(false); openEdit(selected); }}>
                    <Edit className="mr-1.5 h-4 w-4" />Edit
                  </Button>
                  <Button variant="ghost" onClick={() => setDetailOpen(false)}>Close</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
