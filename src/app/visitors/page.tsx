'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, UserCheck, Plus, Search, RefreshCw, LogOut,
  ChevronLeft, ChevronRight, Printer, Clock, Users,
  CheckCircle2, XCircle, MapPin, Phone, Badge, Car,
  Eye, Trash2, Filter, Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const PURPOSES = ['Meeting', 'Delivery', 'Interview', 'Parent', 'Vendor', 'Government', 'Maintenance', 'Other'];
const ID_TYPES  = ['CNIC', 'Passport', 'Driving License', 'Student ID', 'Employee ID'];

const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const duration = (checkIn: string, checkOut?: string) => {
  const start = new Date(checkIn).getTime();
  const end   = checkOut ? new Date(checkOut).getTime() : Date.now();
  const mins  = Math.round((end - start) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const PURPOSE_COLORS: Record<string, string> = {
  Meeting:    'bg-blue-100 text-blue-700',
  Delivery:   'bg-amber-100 text-amber-700',
  Interview:  'bg-purple-100 text-purple-700',
  Parent:     'bg-green-100 text-green-700',
  Vendor:     'bg-orange-100 text-orange-700',
  Government: 'bg-red-100 text-red-700',
  Maintenance:'bg-slate-100 text-slate-700',
  Other:      'bg-gray-100 text-gray-600',
};

const BLANK = {
  visitorName: '', visitorPhone: '', visitorCnic: '',
  purpose: 'Meeting', personToMeet: '', vehicleNo: '',
  idType: 'CNIC', idNumber: '', remarks: '', badgeNumber: '',
};

export default function VisitorsPage() {
  const [data,       setData]       = useState<any>(null);
  const [loading,    setLoading]    = useState(false);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [statusFilt, setStatusFilt] = useState('');
  const [dateFilt,   setDateFilt]   = useState(new Date().toISOString().slice(0, 10));
  const [addOpen,    setAddOpen]    = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected,   setSelected]   = useState<any>(null);
  const [form,       setForm]       = useState<any>({ ...BLANK });
  const [saving,     setSaving]     = useState(false);
  const [checkingOut, setCheckingOut] = useState('');
  const [staff,      setStaff]      = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchData(); }, [page, statusFilt, dateFilt]);
  useEffect(() => { fetchStaff(); }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '25' });
      if (statusFilt) p.set('status', statusFilt);
      if (dateFilt)   p.set('date',   dateFilt);
      if (search)     p.set('search', search);
      const r = await fetch(`/api/visitors?${p}`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally { setLoading(false); }
  }, [page, statusFilt, dateFilt, search]);

  const fetchStaff = async () => {
    const r = await fetch('/api/staff?limit=200&status=active');
    const j = await r.json();
    if (j.success) setStaff(j.data?.staff || j.data || []);
  };

  const handleCheckIn = async () => {
    if (!form.visitorName || !form.purpose || !form.personToMeet) {
      toast({ title: 'Name, purpose, and person to meet are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/visitors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: `${form.visitorName} checked in`, description: `Badge: ${j.data.badgeNumber || 'N/A'}` });
        setAddOpen(false);
        setForm({ ...BLANK });
        fetchData();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleCheckOut = async (id: string, name: string) => {
    setCheckingOut(id);
    try {
      const r = await fetch('/api/visitors', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'checkout' }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: `${name} checked out` });
        if (selected?.id === id) setSelected(j.data);
        fetchData();
      }
    } finally { setCheckingOut(''); }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/visitors?id=${id}`, { method: 'DELETE' });
    toast({ title: 'Record deleted' });
    if (detailOpen) setDetailOpen(false);
    fetchData();
  };

  const printBadge = (visitor: any) => {
    const win = window.open('', '_blank', 'width=400,height=300');
    if (!win) return;
    win.document.write(`
      <html><head><title>Visitor Badge</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;text-align:center}
      .badge{border:3px solid #1e40af;border-radius:12px;padding:20px;max-width:280px;margin:auto}
      h2{color:#1e40af;margin:0 0 8px}
      .name{font-size:22px;font-weight:bold;margin:10px 0}
      .field{font-size:12px;color:#666;margin:4px 0}
      .purpose{background:#dbeafe;color:#1e40af;padding:4px 12px;border-radius:20px;font-weight:bold;display:inline-block;margin:8px 0}
      .time{font-size:11px;color:#999;margin-top:12px;border-top:1px solid #eee;padding-top:8px}
      </style></head>
      <body onload="window.print()">
      <div class="badge">
        <h2>VISITOR PASS</h2>
        ${visitor.badgeNumber ? `<div class="field">Badge #${visitor.badgeNumber}</div>` : ''}
        <div class="name">${visitor.visitorName}</div>
        <div class="purpose">${visitor.purpose}</div>
        <div class="field">Meeting: ${visitor.personToMeet}</div>
        ${visitor.visitorPhone ? `<div class="field">📞 ${visitor.visitorPhone}</div>` : ''}
        <div class="time">Check-in: ${fmtDate(visitor.checkIn)} ${fmtTime(visitor.checkIn)}</div>
      </div></body></html>
    `);
  };

  const summary    = data?.summary    || {};
  const visitors   = data?.visitors   || [];
  const pagination = data?.pagination || {};

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50"><UserCheck className="h-6 w-6 text-blue-600" /></span>
              Visitor Management
            </h1>
            <p className="text-muted-foreground mt-0.5">Manage school entry and visitor log</p>
          </div>
          <Button onClick={() => { setForm({ ...BLANK }); setAddOpen(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />New Visitor
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Today's Visitors", val: summary.todayCount  || 0, icon: Calendar, color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-l-blue-500' },
            { label: 'Currently Inside',  val: summary.checkedIn   || 0, icon: Users,    color: 'text-green-600', bg: 'bg-green-50',  border: 'border-l-green-500' },
            { label: 'Total Logged',      val: summary.totalVisitors || 0, icon: CheckCircle2, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-l-slate-400' },
          ].map(({ label, val, icon: Icon, color, bg, border }) => (
            <Card key={label} className={`border-l-4 ${border} overflow-hidden`}>
              <CardContent className={`pt-4 pb-3 ${bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {loading
                      ? <div className="h-7 w-12 bg-muted animate-pulse rounded mt-1" />
                      : <p className={`text-3xl font-bold ${color} mt-0.5`}>{val}</p>}
                  </div>
                  <Icon className={`h-7 w-7 ${color} opacity-40`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="relative flex-1 min-w-52">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search visitor, person to meet, phone…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchData()}
                  className="pl-8"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Date</Label>
                <Input type="date" value={dateFilt} onChange={e => { setDateFilt(e.target.value); setPage(1); }} className="w-38" />
              </div>
              <Select value={statusFilt || 'all'} onValueChange={v => { setStatusFilt(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-38"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Checked-In">Checked In</SelectItem>
                  <SelectItem value="Checked-Out">Checked Out</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => fetchData()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visitor Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : visitors.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
                <UserCheck className="h-12 w-12 opacity-20" />
                <p className="font-semibold">No visitors logged</p>
                <p className="text-sm">Check in a new visitor to get started</p>
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />Check In Visitor
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="pl-4">Visitor</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Meeting</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitors.map((v: any) => (
                      <TableRow key={v.id} className="hover:bg-muted/20 cursor-pointer card-hover" onClick={() => { setSelected(v); setDetailOpen(true); }}>
                        <TableCell className="pl-4">
                          <div className="font-semibold text-sm">{v.visitorName}</div>
                          {v.visitorPhone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />{v.visitorPhone}
                            </div>
                          )}
                          {v.badgeNumber && <div className="text-xs text-blue-600">Badge #{v.badgeNumber}</div>}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PURPOSE_COLORS[v.purpose] || 'bg-gray-100 text-gray-600'}`}>
                            {v.purpose}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{v.personToMeet}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          <div>{fmtDate(v.checkIn)}</div>
                          <div className="font-medium text-foreground">{fmtTime(v.checkIn)}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {v.checkOut ? (
                            <div>
                              <div>{fmtDate(v.checkOut)}</div>
                              <div className="font-medium text-foreground">{fmtTime(v.checkOut)}</div>
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {duration(v.checkIn, v.checkOut)}
                        </TableCell>
                        <TableCell>
                          {v.status === 'Checked-In' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Inside
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              <XCircle className="h-3 w-3" />Exited
                            </span>
                          )}
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <div className="flex gap-0.5">
                            {v.status === 'Checked-In' && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" title="Check Out"
                                onClick={() => handleCheckOut(v.id, v.visitorName)} disabled={checkingOut === v.id}>
                                {checkingOut === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Print Badge"
                              onClick={() => printBadge(v)}>
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" title="Delete"
                              onClick={() => handleDelete(v.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                    <span className="text-xs text-muted-foreground">
                      {((page-1)*25)+1}–{Math.min(page*25, pagination.total)} of {pagination.total} visitors
                    </span>
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Purpose breakdown */}
        {summary.purposeBreakdown?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Visit Purpose Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {summary.purposeBreakdown.map((p: any) => (
                  <div key={p.purpose} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${PURPOSE_COLORS[p.purpose] || 'bg-gray-100 text-gray-600'}`}>
                    {p.purpose}
                    <span className="font-bold">{p._count.purpose}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* ── Check-In Dialog ───────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setForm({ ...BLANK }); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-blue-600" />Visitor Check-In</DialogTitle>
            <DialogDescription>Register a new visitor to the school premises</DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="sm:col-span-2">
              <Label>Visitor Name *</Label>
              <Input value={form.visitorName} onChange={e => setForm((f: any) => ({ ...f, visitorName: e.target.value }))}
                placeholder="Full name…" className="mt-1" autoFocus />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.visitorPhone} onChange={e => setForm((f: any) => ({ ...f, visitorPhone: e.target.value }))}
                placeholder="+92 300 1234567" className="mt-1" />
            </div>
            <div>
              <Label>Vehicle No</Label>
              <Input value={form.vehicleNo} onChange={e => setForm((f: any) => ({ ...f, vehicleNo: e.target.value }))}
                placeholder="e.g. LEA-1234" className="mt-1" />
            </div>
            <div>
              <Label>ID Type</Label>
              <Select value={form.idType} onValueChange={v => setForm((f: any) => ({ ...f, idType: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ID_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>ID Number</Label>
              <Input value={form.idNumber} onChange={e => setForm((f: any) => ({ ...f, idNumber: e.target.value }))}
                placeholder="e.g. 35201-1234567-1" className="mt-1" />
            </div>
            <div>
              <Label>Purpose *</Label>
              <Select value={form.purpose} onValueChange={v => setForm((f: any) => ({ ...f, purpose: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Person to Meet *</Label>
              <Select value={form.personToMeet} onValueChange={v => setForm((f: any) => ({ ...f, personToMeet: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select or type…" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => <SelectItem key={s.id} value={s.fullName}>{s.fullName} ({s.designation})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Badge Number</Label>
              <Input value={form.badgeNumber} onChange={e => setForm((f: any) => ({ ...f, badgeNumber: e.target.value }))}
                placeholder="e.g. V-001" className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label>Remarks</Label>
              <Textarea value={form.remarks} onChange={e => setForm((f: any) => ({ ...f, remarks: e.target.value }))}
                placeholder="Additional notes…" rows={2} className="mt-1 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCheckIn} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
              Check In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.visitorName}</DialogTitle>
                <DialogDescription>
                  Visitor Log — {fmtDate(selected.checkIn)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Purpose</p>
                    <p className="font-semibold">{selected.purpose}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Meeting</p>
                    <p className="font-semibold">{selected.personToMeet}</p>
                  </div>
                  {selected.visitorPhone && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <a href={`tel:${selected.visitorPhone}`} className="font-semibold text-blue-600 hover:underline">{selected.visitorPhone}</a>
                    </div>
                  )}
                  {selected.idType && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">{selected.idType}</p>
                      <p className="font-semibold">{selected.idNumber || '—'}</p>
                    </div>
                  )}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Check In</p>
                    <p className="font-semibold">{fmtTime(selected.checkIn)}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{selected.checkOut ? 'Check Out' : 'Still Inside'}</p>
                    <p className="font-semibold">{selected.checkOut ? fmtTime(selected.checkOut) : `${duration(selected.checkIn)} elapsed`}</p>
                  </div>
                  {selected.vehicleNo && (
                    <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-muted-foreground">Vehicle</p>
                      <p className="font-semibold">{selected.vehicleNo}</p>
                    </div>
                  )}
                </div>
                {selected.remarks && (
                  <div className="bg-muted/20 rounded-lg p-3 text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                    {selected.remarks}
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                {selected.status === 'Checked-In' && (
                  <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => handleCheckOut(selected.id, selected.visitorName)}>
                    <LogOut className="mr-1.5 h-4 w-4" />Check Out
                  </Button>
                )}
                <Button variant="outline" onClick={() => printBadge(selected)}>
                  <Printer className="mr-1.5 h-4 w-4" />Print Badge
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
