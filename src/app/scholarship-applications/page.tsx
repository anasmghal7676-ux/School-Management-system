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
import { Loader2, Plus, Search, RefreshCw, Trash2, GraduationCap, CheckCircle2, XCircle, Clock, Award, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const SCHOLARSHIP_TYPES = ['Merit-based', 'Need-based', 'Sports Excellence', 'Orphan / Special Case', 'Sibling Discount', 'Staff Child', 'Zakat Fund', 'Donor Scholarship', 'Government Scheme', 'Other'];
const STATUSES = ['Pending', 'Under Review', 'Approved', 'Rejected'];
const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  'Under Review': 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};
const fmt = (n: number) => `PKR ${Math.round(n).toLocaleString()}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ScholarshipApplicationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, totalAwarded: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialog, setDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState<any>(null);
  const [reviewDialog, setReviewDialog] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAmount, setReviewAmount] = useState('');

  const emptyForm = () => ({ studentId: '', studentName: '', className: '', admissionNumber: '', scholarshipType: 'Merit-based', requestedAmount: '', reason: '', guardianIncome: '', marks: '', siblings: '', documents: '', academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1) });
  const [form, setForm] = useState<any>(emptyForm());
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter });
      const res = await fetch(`/api/scholarships?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items || []); setSummary(data.summary || {}); setStudents(data.students || []);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStudent = (id: string) => {
    const s = students.find(x => x.id === id);
    setForm((p: any) => ({ ...p, studentId: id, studentName: s?.fullName || '', className: s?.class?.name || '', admissionNumber: s?.admissionNumber || '' }));
  };

  const save = async () => {
    if (!form.studentName || !form.reason) { toast({ title: 'Student and reason required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/scholarships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      toast({ title: 'Application submitted' }); setDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const decide = async (status: 'Approved' | 'Rejected') => {
    if (!reviewDialog) return;
    setSaving(true);
    try {
      await fetch('/api/scholarships', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewDialog.id, status, amount: status === 'Approved' ? reviewAmount || reviewDialog.requestedAmount : 0, reviewNote, reviewedAt: new Date().toISOString() })
      });
      toast({ title: status === 'Approved' ? '✅ Scholarship approved' : '❌ Application rejected' });
      setReviewDialog(null); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    await fetch('/api/scholarships', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Deleted' }); load();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Scholarship Applications" description="Student scholarship applications — submit, review by committee and award"
        actions={<Button size="sm" onClick={() => { setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />New Application</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: summary.total, color: 'border-l-slate-500', icon: <GraduationCap className="h-4 w-4 text-slate-500" /> },
          { label: 'Pending', value: summary.pending, color: 'border-l-amber-500', icon: <Clock className="h-4 w-4 text-amber-500" /> },
          { label: 'Approved', value: summary.approved, color: 'border-l-green-500', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
          { label: 'Rejected', value: summary.rejected, color: 'border-l-red-500', icon: <XCircle className="h-4 w-4 text-red-500" /> },
          { label: 'Total Awarded', value: fmt(summary.totalAwarded), color: 'border-l-blue-500', icon: <Award className="h-4 w-4 text-blue-500" />, text: true },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-3"><div className="flex items-center justify-between">{c.icon}<span className={`font-bold ${(c as any).text ? 'text-sm' : 'text-2xl'}`}>{c.value}</span></div><p className="text-xs text-muted-foreground mt-1">{c.label}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card><CardContent className="p-4"><div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search student or scholarship type..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
          items.length === 0 ? <div className="text-center py-16 text-muted-foreground"><GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No applications yet</p><Button size="sm" className="mt-3" onClick={() => { setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Submit First Application</Button></div> :
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Type</TableHead>
              <TableHead className="text-right">Requested</TableHead><TableHead className="text-right">Awarded</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/20">
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(item.createdAt)}</TableCell>
                  <TableCell><div className="font-medium text-sm">{item.studentName}</div><div className="text-xs text-muted-foreground">{item.className} · {item.admissionNumber}</div></TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.scholarshipType}</Badge></TableCell>
                  <TableCell className="text-right text-sm">{item.requestedAmount ? fmt(Number(item.requestedAmount)) : '—'}</TableCell>
                  <TableCell className="text-right">{item.amount && item.status === 'Approved' ? <span className="font-semibold text-green-700">{fmt(Number(item.amount))}</span> : '—'}</TableCell>
                  <TableCell><Badge className={`text-xs ${STATUS_COLORS[item.status] || ''}`}>{item.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewDialog(item)}><Eye className="h-3.5 w-3.5" /></Button>
                      {item.status === 'Pending' && <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-700" onClick={() => { setReviewDialog(item); setReviewNote(''); setReviewAmount(item.requestedAmount || ''); }}>Review</Button>}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      </CardContent></Card>

      {/* New Application Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Scholarship Application</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Student *</Label>
              <Select value={form.studentId} onValueChange={handleStudent}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.class?.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Scholarship Type</Label><Select value={form.scholarshipType} onValueChange={v => f('scholarshipType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SCHOLARSHIP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Academic Year</Label><Input value={form.academicYear} onChange={e => f('academicYear', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Requested Amount (PKR)</Label><Input type="number" value={form.requestedAmount} onChange={e => f('requestedAmount', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Guardian Monthly Income</Label><Input type="number" value={form.guardianIncome} onChange={e => f('guardianIncome', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Last Exam Marks (%)</Label><Input type="number" value={form.marks} onChange={e => f('marks', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>No. of Siblings in School</Label><Input type="number" value={form.siblings} onChange={e => f('siblings', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Reason / Justification *</Label><Textarea value={form.reason} onChange={e => f('reason', e.target.value)} rows={3} placeholder="Explain why this student deserves the scholarship..." /></div>
            <div className="col-span-2 space-y-1.5"><Label>Supporting Documents</Label><Input value={form.documents} onChange={e => f('documents', e.target.value)} placeholder="e.g. Income certificate, Report card" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit Application</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={o => !o && setViewDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Application Details</DialogTitle></DialogHeader>
          {viewDialog && <div className="space-y-3 py-2 text-sm">
            <div className="flex gap-2"><Badge className={STATUS_COLORS[viewDialog.status] || ''}>{viewDialog.status}</Badge><Badge variant="outline">{viewDialog.scholarshipType}</Badge></div>
            <p className="font-semibold text-base">{viewDialog.studentName} <span className="font-normal text-muted-foreground text-sm">— {viewDialog.className}</span></p>
            {viewDialog.requestedAmount && <p>Requested: <strong>{fmt(Number(viewDialog.requestedAmount))}</strong></p>}
            {viewDialog.guardianIncome && <p>Guardian Income: <strong>{fmt(Number(viewDialog.guardianIncome))}/month</strong></p>}
            {viewDialog.marks && <p>Last Marks: <strong>{viewDialog.marks}%</strong></p>}
            {viewDialog.siblings && <p>Siblings in School: <strong>{viewDialog.siblings}</strong></p>}
            <div className="bg-muted/20 rounded p-3"><p className="font-medium mb-1">Reason</p><p>{viewDialog.reason}</p></div>
            {viewDialog.documents && <p className="text-muted-foreground text-xs">📎 {viewDialog.documents}</p>}
            {viewDialog.reviewNote && <div className="bg-blue-50 border border-blue-200 rounded p-3"><p className="font-medium text-blue-700 text-xs mb-1">Committee Decision Note</p><p>{viewDialog.reviewNote}</p>{viewDialog.amount && viewDialog.status === 'Approved' && <p className="text-green-700 font-semibold mt-1">Awarded: {fmt(Number(viewDialog.amount))}</p>}</div>}
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setViewDialog(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={o => !o && setReviewDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Review Application</DialogTitle></DialogHeader>
          {reviewDialog && <div className="space-y-4 py-2">
            <div className="bg-muted/20 rounded p-3 text-sm"><p className="font-medium">{reviewDialog.studentName}</p><p className="text-muted-foreground">{reviewDialog.scholarshipType}</p>{reviewDialog.requestedAmount && <p className="font-semibold mt-1">Requested: {fmt(Number(reviewDialog.requestedAmount))}</p>}</div>
            <div className="space-y-1.5"><Label>Amount to Award (PKR)</Label><Input type="number" value={reviewAmount} onChange={e => setReviewAmount(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Committee Decision Note</Label><Textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3} placeholder="Reason for approval or rejection..." /></div>
          </div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => decide('Rejected')} disabled={saving}><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
            <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => decide('Approved')} disabled={saving}>{saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}<CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
