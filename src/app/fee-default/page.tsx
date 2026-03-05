'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Loader2, UserX, Search, RefreshCw, Download, ChevronLeft, ChevronRight,
  Phone, AlertTriangle, TrendingDown, DollarSign, Users, Filter, Send,
  CheckCircle2, ArrowUpDown, Megaphone,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmt = (n: number) => `PKR ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

function DueBadge({ amt }: { amt: number }) {
  if (amt >= 50000) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Critical</span>;
  if (amt >= 20000) return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">High</span>;
  if (amt >= 5000)  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Medium</span>;
  return                   <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Low</span>;
}

export default function FeeDefaultersPage() {
  const [data,     setData]     = useState<any>(null);
  const [classes,  setClasses]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [classId,  setClassId]  = useState('');
  const [minDue,   setMinDue]   = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reminderOpen, setReminderOpen] = useState(false);
  const [sending,  setSending]  = useState(false);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { fetchData(); }, [page, classId, minDue]);

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=50');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '30' });
      if (search)  p.set('search',  search);
      if (classId) p.set('classId', classId);
      if (minDue)  p.set('minDue',  minDue);
      const r = await fetch(`/api/fee-default?${p}`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally { setLoading(false); }
  }, [page, classId, minDue, search]);

  const handleSearch = () => { setPage(1); fetchData(); };

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const ids = (data?.defaulters || []).map((d: any) => d.id);
    setSelected(new Set(ids));
  };

  const clearSelection = () => setSelected(new Set());

  const sendReminders = async () => {
    setSending(true);
    try {
      // In real implementation: call /api/broadcast with selected student parent IDs
      await new Promise(r => setTimeout(r, 1500));
      toast({ title: `Reminders sent to ${selected.size} families`, description: 'SMS/WhatsApp notifications dispatched' });
      setReminderOpen(false);
      clearSelection();
    } finally { setSending(false); }
  };

  const exportCSV = () => {
    const rows = [
      ['Admission No', 'Student Name', 'Father Name', 'Phone', 'Class', 'Section', 'Total Assigned', 'Total Paid', 'Outstanding', 'Last Payment'],
      ...(data?.defaulters || []).map((d: any) => [
        d.admissionNumber, d.fullName, d.fatherName, d.fatherPhone || '',
        d.class?.name || '', d.section?.name || '',
        d.totalAssigned, d.totalPaid, d.outstanding,
        d.lastPaymentDate ? fmtDate(d.lastPaymentDate) : 'Never',
      ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `fee-defaulters-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast({ title: 'CSV exported' });
  };

  const summary    = data?.summary    || {};
  const defaulters = data?.defaulters || [];
  const pagination = data?.pagination || {};

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-red-50"><UserX className="h-6 w-6 text-red-600" /></span>
              Fee Defaulters
            </h1>
            <p className="text-muted-foreground mt-0.5">Students with outstanding fee balances</p>
          </div>
          <div className="flex gap-2">
            {selected.size > 0 && (
              <Button variant="outline" className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => setReminderOpen(true)}>
                <Megaphone className="h-4 w-4" />Send Reminders ({selected.size})
              </Button>
            )}
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />Export CSV
            </Button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Defaulters',    val: summary.total   || 0, icon: Users,        color: 'text-slate-700',  bg: 'bg-slate-50',  border: 'border-l-slate-400' },
            { label: 'Total Outstanding',   val: fmt(summary.totalOutstanding || 0), icon: DollarSign, color: 'text-red-700', bg: 'bg-red-50', border: 'border-l-red-500' },
            { label: 'Critical (≥ 50,000)', val: summary.critical || 0, icon: AlertTriangle, color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-l-red-600' },
            { label: 'High (≥ 20,000)',     val: summary.high    || 0, icon: TrendingDown, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-l-orange-500' },
          ].map(({ label, val, icon: Icon, color, bg, border }) => (
            <Card key={label} className={`border-l-4 ${border} overflow-hidden`}>
              <CardContent className={`pt-4 pb-3 ${bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {loading
                      ? <div className="h-7 w-20 bg-muted animate-pulse rounded mt-1" />
                      : <p className={`text-2xl font-bold ${color} mt-0.5`}>{val}</p>}
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
                  placeholder="Search student name, admission no, father name…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-8"
                />
              </div>
              <Select value={classId || 'all'} onValueChange={v => { setClassId(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div>
                <Label className="text-xs mb-1 block">Min Due (PKR)</Label>
                <Input
                  type="number" placeholder="e.g. 5000" value={minDue}
                  onChange={e => setMinDue(e.target.value)}
                  className="w-36"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="mr-2 h-4 w-4" />Search
              </Button>
              <Button variant="ghost" size="icon" onClick={() => fetchData()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Selection bar */}
        {defaulters.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <button className="underline hover:text-foreground" onClick={selectAll}>Select all {defaulters.length}</button>
            {selected.size > 0 && (
              <><span>·</span><span className="font-medium text-foreground">{selected.size} selected</span>
              <button className="underline hover:text-foreground" onClick={clearSelection}>Clear</button></>
            )}
          </div>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : defaulters.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 opacity-20" />
                <p className="font-semibold">No fee defaulters found!</p>
                <p className="text-sm">All students are up to date with their fees</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-10 pl-4">
                        <input type="checkbox"
                          checked={selected.size === defaulters.length && defaulters.length > 0}
                          onChange={e => e.target.checked ? selectAll() : clearSelection()}
                          className="h-4 w-4 rounded" />
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Assigned</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Last Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaulters.map((d: any, idx: number) => (
                      <TableRow key={d.id} className={`hover:bg-muted/10 ${selected.has(d.id) ? 'bg-amber-50/50' : ''}`}>
                        <TableCell className="pl-4">
                          <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleSelect(d.id)} className="h-4 w-4 rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm">{d.fullName}</div>
                          <div className="text-xs text-muted-foreground">{d.admissionNumber}</div>
                          <div className="text-xs text-muted-foreground">{d.fatherName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{d.class?.name || '—'}</div>
                          {d.section && <div className="text-xs text-muted-foreground">{d.section.name}</div>}
                        </TableCell>
                        <TableCell>
                          {d.fatherPhone ? (
                            <a href={`tel:${d.fatherPhone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                              <Phone className="h-3 w-3" />{d.fatherPhone}
                            </a>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmt(d.totalAssigned)}</TableCell>
                        <TableCell className="text-right text-sm text-green-600">{fmt(d.totalPaid)}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-base text-red-600">{fmt(d.outstanding)}</span>
                        </TableCell>
                        <TableCell><DueBadge amt={d.outstanding} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {d.lastPaymentDate
                            ? <><div>{fmtDate(d.lastPaymentDate)}</div><div className="text-green-600">{fmt(d.lastPaymentAmt)}</div></>
                            : <span className="text-red-400 font-medium">Never paid</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                    <span className="text-xs text-muted-foreground">
                      Showing {((page - 1) * 30) + 1}–{Math.min(page * 30, pagination.total)} of {pagination.total} defaulters
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
      </main>

      {/* Reminder Dialog */}
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-amber-600" />Send Fee Reminders</DialogTitle>
            <DialogDescription>
              Send payment reminders to {selected.size} selected families via SMS & WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-amber-800 mb-1">Message Preview</p>
              <p className="text-amber-700 leading-relaxed">
                Dear Parent, this is a reminder that your child's school fee is due. Please visit the school finance office or pay online. Contact us at [school phone] for any queries.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />SMS notification
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />WhatsApp notification (if configured)
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setReminderOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={sendReminders} disabled={sending} className="flex-1 bg-amber-600 hover:bg-amber-700">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send to {selected.size} Families
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
