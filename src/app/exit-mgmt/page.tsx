'use client';
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
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, Download, UserMinus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const EXIT_REASONS = ['Resignation', 'Retirement', 'Termination', 'End of Contract', 'Transfer', 'Mutual Agreement', 'Death', 'Absconding'];
const STATUSES = ['Pending', 'In Process', 'Approved', 'Completed', 'Rejected'];
const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700', 'In Process': 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700', Completed: 'bg-slate-100 text-slate-600', Rejected: 'bg-red-100 text-red-700',
};
const fmt = (n: number) => n ? `PKR ${Number(n).toLocaleString('en-PK')}` : '—';
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ExitManagementPage() {
  const [items, setItems] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, completed: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ staffId: '', staffName: '', staffCode: '', designation: '', reason: 'Resignation', applicationDate: '', lastWorkingDate: '', noticePeriod: '30', basicSalary: '', gratuity: '', leavesEncashed: '', bonuses: '', deductions: '', totalSettlement: '', status: 'Pending', clearance: { library: false, it: false, accounts: false, hr: false }, remarks: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter, page: String(page), limit: '20' });
      const res = await fetch(`/api/exit-mgmt?${params}`);
      const data = await res.json();
      setItems(data.items || []); setTotal(data.total || 0);
      if (data.staff) setStaff(data.staff);
      if (data.summary) setSummary(data.summary);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleStaffSelect = (id: string) => {
    const s = staff.find(x => x.id === id);
    if (s) setForm((f: any) => ({ ...f, staffId: s.id, staffName: s.fullName, staffCode: s.employeeCode, designation: s.designation, basicSalary: s.basicSalary || '' }));
  };

  const calcSettlement = () => {
    const g = parseFloat(form.gratuity) || 0;
    const l = parseFloat(form.leavesEncashed) || 0;
    const b = parseFloat(form.bonuses) || 0;
    const d = parseFloat(form.deductions) || 0;
    setForm((f: any) => ({ ...f, totalSettlement: String(g + l + b - d) }));
  };

  const save = async () => {
    if (!form.staffId || !form.applicationDate) { toast({ title: 'Staff and date required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/exit-mgmt', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) });
      toast({ title: editing ? 'Updated' : 'Exit process initiated' });
      setShowDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (item: any) => {
    if (!confirm('Delete this exit record?')) return;
    await fetch('/api/exit-mgmt', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
    toast({ title: 'Deleted' }); load();
  };

  const openNew = () => {
    setEditing(null);
    setForm({ staffId: '', staffName: '', staffCode: '', designation: '', reason: 'Resignation', applicationDate: new Date().toISOString().slice(0,10), lastWorkingDate: '', noticePeriod: '30', basicSalary: '', gratuity: '', leavesEncashed: '', bonuses: '', deductions: '', totalSettlement: '', status: 'Pending', clearance: { library: false, it: false, accounts: false, hr: false }, remarks: '' });
    setShowDialog(true);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Exit Management" description="Manage staff resignations, clearances, and final settlement processing"
        actions={<Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-2" />Initiate Exit</Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Exits', value: summary.total, color: 'border-l-slate-500', icon: <UserMinus className="h-4 w-4 text-slate-500" /> },
          { label: 'Pending', value: summary.pending, color: 'border-l-amber-500', icon: <Clock className="h-4 w-4 text-amber-500" /> },
          { label: 'Approved', value: summary.approved, color: 'border-l-green-500', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
          { label: 'Completed', value: summary.completed, color: 'border-l-blue-500', icon: <CheckCircle2 className="h-4 w-4 text-blue-500" /> },
        ].map(c => <Card key={c.label} className={`border-l-4 ${c.color}`}><CardContent className="p-4"><div className="flex items-center justify-between">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div><p className="text-xs text-muted-foreground mt-1">{c.label}</p></CardContent></Card>)}
      </div>

      <Card><CardContent className="p-4"><div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or ID..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex justify-center items-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div> :
          items.length === 0 ? <div className="text-center py-12 text-muted-foreground"><UserMinus className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No exit records</p></div> :
          <Table>
            <TableHeader><TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Application Date</TableHead>
              <TableHead>Last Working Day</TableHead>
              <TableHead>Clearance</TableHead>
              <TableHead className="text-right">Settlement</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((item: any) => {
                const cl = item.clearance || {};
                const cleared = [cl.library, cl.it, cl.accounts, cl.hr].filter(Boolean).length;
                return (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell><div className="font-medium text-sm">{item.staffName}</div><div className="text-xs text-muted-foreground">{item.staffCode} · {item.designation}</div></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{item.reason}</Badge></TableCell>
                    <TableCell className="text-sm">{fmtDate(item.applicationDate)}</TableCell>
                    <TableCell className="text-sm">{item.lastWorkingDate ? fmtDate(item.lastWorkingDate) : <span className="text-muted-foreground">TBD</span>}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium">{cleared}/4</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${(cleared/4)*100}%` }} /></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">{fmt(item.totalSettlement)}</TableCell>
                    <TableCell><Badge className={`text-xs ${STATUS_COLORS[item.status] || ''}`}>{item.status}</Badge></TableCell>
                    <TableCell className="text-right"><div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setForm(item); setShowDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        }
      </CardContent></Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Update Exit Process' : 'Initiate Staff Exit'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Staff Member *</Label>
              <Select value={form.staffId} onValueChange={handleStaffSelect}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.designation}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Exit Reason</Label><Select value={form.reason} onValueChange={v => setForm({ ...form, reason: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXIT_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Application Date *</Label><Input type="date" value={form.applicationDate} onChange={e => setForm({ ...form, applicationDate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Last Working Date</Label><Input type="date" value={form.lastWorkingDate} onChange={e => setForm({ ...form, lastWorkingDate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Notice Period (days)</Label><Input type="number" value={form.noticePeriod} onChange={e => setForm({ ...form, noticePeriod: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Basic Salary</Label><Input type="number" value={form.basicSalary} onChange={e => setForm({ ...form, basicSalary: e.target.value })} /></div>

            {/* Settlement */}
            <div className="col-span-2"><div className="font-semibold text-sm border-b pb-1 mb-2">Final Settlement</div></div>
            <div className="space-y-1.5"><Label>Gratuity (PKR)</Label><Input type="number" value={form.gratuity} onChange={e => { setForm({ ...form, gratuity: e.target.value }); }} onBlur={calcSettlement} /></div>
            <div className="space-y-1.5"><Label>Leaves Encashed (PKR)</Label><Input type="number" value={form.leavesEncashed} onChange={e => setForm({ ...form, leavesEncashed: e.target.value })} onBlur={calcSettlement} /></div>
            <div className="space-y-1.5"><Label>Bonuses / Other</Label><Input type="number" value={form.bonuses} onChange={e => setForm({ ...form, bonuses: e.target.value })} onBlur={calcSettlement} /></div>
            <div className="space-y-1.5"><Label>Deductions</Label><Input type="number" value={form.deductions} onChange={e => setForm({ ...form, deductions: e.target.value })} onBlur={calcSettlement} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Total Settlement (PKR)</Label><Input type="number" value={form.totalSettlement} onChange={e => setForm({ ...form, totalSettlement: e.target.value })} className="font-bold text-green-700" /></div>

            {/* Clearance Checklist */}
            <div className="col-span-2"><div className="font-semibold text-sm border-b pb-1 mb-3">Clearance Checklist</div>
              <div className="grid grid-cols-4 gap-3">
                {[['library', 'Library'], ['it', 'IT / Assets'], ['accounts', 'Accounts'], ['hr', 'HR']].map(([k, label]) => (
                  <label key={k} className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer ${form.clearance?.[k] ? 'bg-green-50 border-green-300' : 'hover:bg-muted/30'}`}>
                    <input type="checkbox" checked={!!form.clearance?.[k]} onChange={e => setForm({ ...form, clearance: { ...form.clearance, [k]: e.target.checked } })} className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-span-2 space-y-1.5"><Label>Remarks</Label><Textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Submit'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
