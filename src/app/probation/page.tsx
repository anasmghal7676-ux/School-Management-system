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
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, UserCheck, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const REASONS = ['New Hire', 'Performance Issues', 'Disciplinary Action', 'Role Change', 'Return from Absence', 'Other'];
const STATUS_COLORS: Record<string, string> = {
  'On Probation': 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-green-100 text-green-700',
  Extended: 'bg-blue-100 text-blue-700',
  Terminated: 'bg-red-100 text-red-700',
};
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ProbationTrackingPage() {
  const [items, setItems] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, dueSoon: 0, confirmed: 0, terminated: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialog, setDialog] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [reviewOutcome, setReviewOutcome] = useState('Confirmed');
  const [reviewNotes, setReviewNotes] = useState('');
  const [extendDate, setExtendDate] = useState('');

  const emptyForm = () => ({ staffId: '', staffName: '', employeeCode: '', designation: '', department: '', reason: 'New Hire', startDate: new Date().toISOString().slice(0, 10), reviewDate: '', probationPeriodMonths: '3', conditions: '', supervisorId: '', supervisorName: '', notes: '' });
  const [form, setForm] = useState<any>(emptyForm());
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter });
      const res = await fetch(`/api/probation?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items || []); setStaff(data.staff || []); setSummary(data.summary || {});
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStaff = (id: string) => {
    const s = staff.find(x => x.id === id);
    setForm((p: any) => ({ ...p, staffId: id, staffName: s?.fullName || '', employeeCode: s?.employeeCode || '', designation: s?.designation || '', department: s?.department || '' }));
  };

  const autoReviewDate = (start: string, months: string) => {
    if (!start || !months) return '';
    const d = new Date(start);
    d.setMonth(d.getMonth() + Number(months));
    return d.toISOString().slice(0, 10);
  };

  const save = async () => {
    if (!form.staffId || !form.startDate) { toast({ title: 'Staff and start date required', variant: 'destructive' }); return; }
    const payload = { ...form, reviewDate: form.reviewDate || autoReviewDate(form.startDate, form.probationPeriodMonths) };
    setSaving(true);
    try {
      await fetch('/api/probation', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...payload, id: editing.id } : payload) });
      toast({ title: editing ? 'Updated' : 'Probation record created' }); setDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const review = async () => {
    if (!reviewDialog) return;
    setSaving(true);
    try {
      const updates: any = { status: reviewOutcome === 'Extended' ? 'Extended' : reviewOutcome, reviewNotes, reviewedAt: new Date().toISOString() };
      if (reviewOutcome === 'Extended' && extendDate) updates.reviewDate = extendDate;
      await fetch('/api/probation', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reviewDialog.id, ...updates }) });
      toast({ title: `✅ ${reviewOutcome === 'Confirmed' ? 'Staff confirmed' : reviewOutcome === 'Terminated' ? 'Terminated' : 'Probation extended'}` });
      setReviewDialog(null); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete probation record?')) return;
    await fetch('/api/probation', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Deleted' }); load();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Probation Tracking" description="Monitor staff probation periods, schedule reviews and record outcomes"
        actions={<Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Probation</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: summary.total, icon: <UserCheck className="h-4 w-4 text-slate-500" />, color: 'border-l-slate-500' },
          { label: 'On Probation', value: summary.active, icon: <Clock className="h-4 w-4 text-amber-500" />, color: 'border-l-amber-500' },
          { label: 'Review Due ≤7d', value: summary.dueSoon, icon: <AlertTriangle className="h-4 w-4 text-orange-500" />, color: 'border-l-orange-500' },
          { label: 'Confirmed', value: summary.confirmed, icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'border-l-green-500' },
          { label: 'Terminated', value: summary.terminated, icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'border-l-red-500' },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-3"><div className="flex items-center justify-between">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div><p className="text-xs text-muted-foreground mt-1">{c.label}</p></CardContent>
          </Card>
        ))}
      </div>

      {summary.dueSoon > 0 && (
        <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /><span><strong>{summary.dueSoon} probation review{summary.dueSoon > 1 ? 's' : ''}</strong> due within 7 days — action needed.</span>
        </div>
      )}

      <Card><CardContent className="p-4"><div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search staff..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="On Probation">On Probation</SelectItem><SelectItem value="Confirmed">Confirmed</SelectItem><SelectItem value="Extended">Extended</SelectItem><SelectItem value="Terminated">Terminated</SelectItem></SelectContent></Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
      </div></CardContent></Card>

      {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
        items.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No probation records</p></CardContent></Card> :
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Reason</TableHead><TableHead>Start Date</TableHead><TableHead>Review Date</TableHead><TableHead>Days Left</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id} className={`hover:bg-muted/20 ${item.isDueSoon && item.status === 'On Probation' ? 'bg-orange-50/30' : ''}`}>
                  <TableCell>
                    <div className="font-medium text-sm">{item.staffName}</div>
                    <div className="text-xs text-muted-foreground">{item.designation} · {item.department}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.reason}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(item.startDate)}</TableCell>
                  <TableCell className={`text-sm ${item.isDueSoon && item.status === 'On Probation' ? 'text-orange-700 font-medium' : 'text-muted-foreground'}`}>{fmtDate(item.reviewDate)}</TableCell>
                  <TableCell>
                    {item.status === 'On Probation' && item.daysLeft !== null ? (
                      <span className={`text-sm font-medium ${item.daysLeft < 0 ? 'text-red-600' : item.daysLeft <= 7 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                        {item.daysLeft < 0 ? `${Math.abs(item.daysLeft)}d overdue` : `${item.daysLeft}d`}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell><Badge className={`text-xs ${STATUS_COLORS[item.status] || ''}`}>{item.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {item.status === 'On Probation' || item.status === 'Extended' ? (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-700" onClick={() => { setReviewDialog(item); setReviewOutcome('Confirmed'); setReviewNotes(''); setExtendDate(''); }}>Review</Button>
                      ) : null}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setForm(item); setDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      }

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Probation' : 'New Probation Record'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Staff Member *</Label>
              <Select value={form.staffId} onValueChange={handleStaff}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.employeeCode})</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Reason</Label><Select value={form.reason} onValueChange={v => f('reason', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Period (months)</Label><Input type="number" value={form.probationPeriodMonths} onChange={e => { f('probationPeriodMonths', e.target.value); setForm((p: any) => ({ ...p, reviewDate: autoReviewDate(p.startDate, e.target.value) })); }} /></div>
            <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => { f('startDate', e.target.value); setForm((p: any) => ({ ...p, reviewDate: autoReviewDate(e.target.value, p.probationPeriodMonths) })); }} /></div>
            <div className="space-y-1.5"><Label>Review Date</Label><Input type="date" value={form.reviewDate} onChange={e => f('reviewDate', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Conditions / Expectations</Label><Textarea value={form.conditions} onChange={e => f('conditions', e.target.value)} rows={2} placeholder="Performance targets, behavioral expectations..." /></div>
            <div className="col-span-2 space-y-1.5"><Label>Supervisor</Label><Input value={form.supervisorName} onChange={e => f('supervisorName', e.target.value)} placeholder="Supervisor name" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={o => !o && setReviewDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Probation Review</DialogTitle></DialogHeader>
          {reviewDialog && <div className="space-y-4 py-2">
            <div className="bg-muted/20 rounded p-3 text-sm"><p className="font-medium">{reviewDialog.staffName}</p><p className="text-muted-foreground">{reviewDialog.designation} · {reviewDialog.department}</p><p className="text-xs mt-1">Probation since {fmtDate(reviewDialog.startDate)}</p></div>
            <div className="space-y-1.5"><Label>Review Outcome</Label>
              <Select value={reviewOutcome} onValueChange={setReviewOutcome}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Confirmed">✅ Confirm Employment</SelectItem><SelectItem value="Extended">⏳ Extend Probation</SelectItem><SelectItem value="Terminated">❌ Terminate</SelectItem></SelectContent></Select>
            </div>
            {reviewOutcome === 'Extended' && <div className="space-y-1.5"><Label>New Review Date</Label><Input type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)} /></div>}
            <div className="space-y-1.5"><Label>Review Notes</Label><Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3} placeholder="Performance assessment, basis for decision..." /></div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setReviewDialog(null)}>Cancel</Button>
            <Button className={reviewOutcome === 'Terminated' ? 'bg-red-600 hover:bg-red-700' : reviewOutcome === 'Confirmed' ? 'bg-green-600 hover:bg-green-700' : ''} onClick={review} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
