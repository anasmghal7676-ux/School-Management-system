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
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, Download, TrendingUp, Award } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const INCREMENT_TYPES = ['Annual Increment', 'Merit Increment', 'Promotion', 'Special Allowance', 'Salary Revision', 'Demotion', 'Adjustment'];
const fmt = (n: number) => `PKR ${Number(n).toLocaleString('en-PK')}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyForm = {
  staffId: '', staffName: '', staffCode: '', designation: '',
  incrementType: 'Annual Increment', effectiveDate: '',
  previousSalary: '', newSalary: '', incrementAmount: '', incrementPercent: '',
  approvedBy: '', remarks: '',
};

export default function IncrementHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, staffId: staffFilter, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/increments?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      if (data.staff) setStaff(data.staff);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, staffFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowDialog(true); };
  const openEdit = (l: any) => { setEditing(l); setForm({ ...l }); setShowDialog(true); };

  const handleStaffSelect = (id: string) => {
    const s = staff.find(x => x.id === id);
    if (s) setForm({ ...form, staffId: s.id, staffName: s.fullName, staffCode: s.employeeCode, designation: s.designation });
  };

  const calcIncrement = (prev: string, next: string) => {
    const p = parseFloat(prev) || 0;
    const n = parseFloat(next) || 0;
    if (p && n) {
      const amt = n - p;
      const pct = p ? ((amt / p) * 100).toFixed(1) : '0';
      setForm((f: any) => ({ ...f, incrementAmount: String(amt), incrementPercent: pct }));
    }
  };

  const save = async () => {
    if (!form.staffId || !form.effectiveDate || !form.newSalary) {
      toast({ title: 'Required fields missing', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const method = editing ? 'PATCH' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      await fetch('/api/increments', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      toast({ title: editing ? 'Updated' : 'Increment recorded' });
      setShowDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (l: any) => {
    if (!confirm('Delete this increment record?')) return;
    await fetch('/api/increments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: l.id }) });
    toast({ title: 'Deleted' }); load();
  };

  const exportCsv = () => {
    const headers = ['Staff', 'ID', 'Designation', 'Type', 'Effective Date', 'Previous Salary', 'New Salary', 'Increment', '%', 'Approved By'];
    const rows = logs.map(l => [l.staffName, l.staffCode, l.designation, l.incrementType, fmtDate(l.effectiveDate), l.previousSalary, l.newSalary, l.incrementAmount, `${l.incrementPercent}%`, l.approvedBy]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'increment-history.csv'; a.click();
  };

  const TYPE_COLORS: Record<string, string> = {
    'Annual Increment': 'bg-green-100 text-green-700',
    'Merit Increment': 'bg-blue-100 text-blue-700',
    'Promotion': 'bg-purple-100 text-purple-700',
    'Special Allowance': 'bg-amber-100 text-amber-700',
    'Salary Revision': 'bg-teal-100 text-teal-700',
    'Demotion': 'bg-red-100 text-red-700',
    'Adjustment': 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Staff Increment History"
        description="Track salary revisions, increments, and promotions for all staff"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Increment</Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by staff name or ID..." className="pl-8" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={staffFilter} onValueChange={v => { setStaffFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Staff" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Award className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No increment records found</p>
              <Button size="sm" className="mt-4" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add First Increment</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead className="text-right">Previous Salary</TableHead>
                  <TableHead className="text-right">New Salary</TableHead>
                  <TableHead className="text-right">Increment</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l: any) => {
                  const isPositive = l.incrementType !== 'Demotion';
                  return (
                    <TableRow key={l.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-medium text-sm">{l.staffName}</div>
                        <div className="text-xs text-muted-foreground">{l.staffCode} · {l.designation}</div>
                      </TableCell>
                      <TableCell><Badge className={`text-xs ${TYPE_COLORS[l.incrementType] || ''}`}>{l.incrementType}</Badge></TableCell>
                      <TableCell className="text-sm">{fmtDate(l.effectiveDate)}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{l.previousSalary ? fmt(l.previousSalary) : '—'}</TableCell>
                      <TableCell className="text-right text-sm font-bold">{fmt(l.newSalary)}</TableCell>
                      <TableCell className="text-right">
                        <div className={`font-semibold text-sm ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                          {isPositive ? '+' : '-'}{fmt(Math.abs(l.incrementAmount || 0))}
                        </div>
                        {l.incrementPercent && <div className="text-xs text-muted-foreground">{isPositive ? '+' : ''}{l.incrementPercent}%</div>}
                      </TableCell>
                      <TableCell className="text-sm">{l.approvedBy || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(l)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(l)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {Math.ceil(total / limit) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Increment' : 'Record Salary Increment'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Staff Member *</Label>
              <Select value={form.staffId} onValueChange={handleStaffSelect}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.designation}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Increment Type</Label>
              <Select value={form.incrementType} onValueChange={v => setForm({ ...form, incrementType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INCREMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Effective Date *</Label>
              <Input type="date" value={form.effectiveDate} onChange={e => setForm({ ...form, effectiveDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Previous Salary (PKR)</Label>
              <Input type="number" placeholder="0" value={form.previousSalary} onChange={e => { setForm({ ...form, previousSalary: e.target.value }); calcIncrement(e.target.value, form.newSalary); }} />
            </div>
            <div className="space-y-1.5">
              <Label>New Salary (PKR) *</Label>
              <Input type="number" placeholder="0" value={form.newSalary} onChange={e => { setForm({ ...form, newSalary: e.target.value }); calcIncrement(form.previousSalary, e.target.value); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Increment Amount (PKR)</Label>
              <Input type="number" value={form.incrementAmount} onChange={e => setForm({ ...form, incrementAmount: e.target.value })} placeholder="Auto-calculated" />
            </div>
            <div className="space-y-1.5">
              <Label>Increment %</Label>
              <Input type="number" step="0.1" value={form.incrementPercent} onChange={e => setForm({ ...form, incrementPercent: e.target.value })} placeholder="Auto-calculated" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Approved By</Label>
              <Input placeholder="Principal / Management" value={form.approvedBy} onChange={e => setForm({ ...form, approvedBy: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Remarks</Label>
              <Textarea placeholder="Reason for increment / notes" rows={2} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Update' : 'Record Increment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
