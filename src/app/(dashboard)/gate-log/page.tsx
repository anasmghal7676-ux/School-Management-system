'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Plus, Search, RefreshCw, Trash2, Download, LogIn, LogOut,
  Users, User, Car, Shield, Clock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const PERSON_TYPES = ['Student', 'Staff', 'Parent', 'Visitor', 'Vendor', 'Delivery', 'Other'];
const PURPOSES = ['Regular Entry', 'Late Entry', 'Early Exit', 'Delivery', 'Meeting', 'Event', 'Maintenance', 'Emergency', 'Other'];
const GATES = ['Main Gate', 'Back Gate', 'Side Gate', 'Emergency Exit'];

const TYPE_COLORS: Record<string, string> = {
  Student: 'bg-blue-100 text-blue-700',
  Staff: 'bg-green-100 text-green-700',
  Parent: 'bg-purple-100 text-purple-700',
  Visitor: 'bg-amber-100 text-amber-700',
  Vendor: 'bg-orange-100 text-orange-700',
  Delivery: 'bg-cyan-100 text-cyan-700',
  Other: 'bg-slate-100 text-slate-600',
};

const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('en-PK', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
}) : '—';

const emptyForm = {
  personName: '', personType: 'Student', admissionOrId: '', phone: '',
  entryType: 'Entry', purpose: 'Regular Entry', gate: 'Main Gate',
  vehicle: '', vehicleNumber: '', dateTime: new Date().toISOString().slice(0, 16),
  authorizedBy: '', remarks: '',
};

export default function GateLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState({ todayTotal: 0, todayIn: 0, todayOut: 0, todayStudents: 0, todayVisitors: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [entryFilter, setEntryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, personType: typeFilter, entryType: entryFilter, date: dateFilter, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/gate-log?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      if (data.summary) setSummary(data.summary);
    } catch {
      toast({ title: 'Error', description: 'Failed to load', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, entryFilter, dateFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openQuickEntry = (entryType: string) => {
    setForm({ ...emptyForm, entryType, dateTime: new Date().toISOString().slice(0, 16) });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.personName) {
      toast({ title: 'Validation', description: 'Person name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await fetch('/api/gate-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      toast({ title: `${form.entryType} logged`, description: `${form.personName} — ${form.personType}` });
      setShowDialog(false);
      load();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteLog = async (log: any) => {
    if (!confirm('Delete this entry?')) return;
    await fetch('/api/gate-log', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: log.id }) });
    toast({ title: 'Deleted' });
    load();
  };

  const exportCsv = () => {
    const headers = ['Date/Time', 'Person', 'Type', 'ID/Admission', 'Phone', 'Entry/Exit', 'Purpose', 'Gate', 'Vehicle', 'Authorized By'];
    const rows = logs.map(l => [fmtDateTime(l.dateTime), l.personName, l.personType, l.admissionOrId, l.phone, l.entryType, l.purpose, l.gate, `${l.vehicle || ''} ${l.vehicleNumber || ''}`.trim(), l.authorizedBy]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `gate-log-${dateFilter}.csv`; a.click();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Gate Log"
        description="Track entry and exit of students, staff, and visitors"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50" onClick={() => openQuickEntry('Entry')}>
              <LogIn className="h-4 w-4 mr-2" />Log Entry
            </Button>
            <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => openQuickEntry('Exit')}>
              <LogOut className="h-4 w-4 mr-2" />Log Exit
            </Button>
          </div>
        }
      />

      {/* Today's Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Today's Total", value: summary.todayTotal, color: 'border-l-slate-500', icon: <Shield className="h-4 w-4 text-slate-500" /> },
          { label: 'Entries Today', value: summary.todayIn, color: 'border-l-green-500', icon: <LogIn className="h-4 w-4 text-green-500" /> },
          { label: 'Exits Today', value: summary.todayOut, color: 'border-l-red-500', icon: <LogOut className="h-4 w-4 text-red-500" /> },
          { label: 'Students', value: summary.todayStudents, color: 'border-l-blue-500', icon: <User className="h-4 w-4 text-blue-500" /> },
          { label: 'Visitors', value: summary.todayVisitors, color: 'border-l-amber-500', icon: <Users className="h-4 w-4 text-amber-500" /> },
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
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, ID, vehicle..." className="pl-8" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} className="w-38" />
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {PERSON_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={entryFilter} onValueChange={v => { setEntryFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Entry/Exit" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Entry">Entry</SelectItem>
                <SelectItem value="Exit">Exit</SelectItem>
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
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No gate logs for this filter</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button size="sm" variant="outline" onClick={() => openQuickEntry('Entry')}><LogIn className="h-4 w-4 mr-1" />Log Entry</Button>
                <Button size="sm" variant="outline" onClick={() => openQuickEntry('Exit')}><LogOut className="h-4 w-4 mr-1" />Log Exit</Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entry/Exit</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Authorized By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium text-sm">{fmtDateTime(log.dateTime)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{log.personName}</div>
                      {log.admissionOrId && <div className="text-xs text-muted-foreground">{log.admissionOrId}</div>}
                      {log.phone && <div className="text-xs text-muted-foreground">{log.phone}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${TYPE_COLORS[log.personType] || ''}`}>{log.personType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1.5 font-medium text-sm ${log.entryType === 'Entry' ? 'text-green-700' : 'text-red-700'}`}>
                        {log.entryType === 'Entry' ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                        {log.entryType}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{log.purpose}</TableCell>
                    <TableCell className="text-sm">{log.gate}</TableCell>
                    <TableCell>
                      {log.vehicle ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Car className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{log.vehicle} {log.vehicleNumber}</span>
                        </div>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">{log.authorizedBy || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteLog(log)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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

      {/* Log Entry/Exit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${form.entryType === 'Entry' ? 'text-green-700' : 'text-red-700'}`}>
              {form.entryType === 'Entry' ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
              Log {form.entryType}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 flex gap-2">
              <Button
                variant={form.entryType === 'Entry' ? 'default' : 'outline'}
                size="sm" className={form.entryType === 'Entry' ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => setForm({ ...form, entryType: 'Entry' })}
              ><LogIn className="h-4 w-4 mr-1" />Entry</Button>
              <Button
                variant={form.entryType === 'Exit' ? 'default' : 'outline'}
                size="sm" className={form.entryType === 'Exit' ? 'bg-red-600 hover:bg-red-700' : ''}
                onClick={() => setForm({ ...form, entryType: 'Exit' })}
              ><LogOut className="h-4 w-4 mr-1" />Exit</Button>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Person Name *</Label>
              <Input placeholder="Full name" value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Person Type</Label>
              <Select value={form.personType} onValueChange={v => setForm({ ...form, personType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PERSON_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Admission / ID No.</Label>
              <Input placeholder="Roll no. / Staff ID" value={form.admissionOrId} onChange={e => setForm({ ...form, admissionOrId: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="Contact number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Purpose</Label>
              <Select value={form.purpose} onValueChange={v => setForm({ ...form, purpose: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Gate</Label>
              <Select value={form.gate} onValueChange={v => setForm({ ...form, gate: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GATES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={form.dateTime} onChange={e => setForm({ ...form, dateTime: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle Type</Label>
              <Input placeholder="Car, Bike, Rickshaw..." value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle Number</Label>
              <Input placeholder="License plate" value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Authorized By</Label>
              <Input placeholder="Gate guard / Admin name" value={form.authorizedBy} onChange={e => setForm({ ...form, authorizedBy: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className={form.entryType === 'Entry' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : form.entryType === 'Entry' ? <LogIn className="h-4 w-4 mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
              Confirm {form.entryType}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
