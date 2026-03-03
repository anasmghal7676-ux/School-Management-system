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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, RefreshCw, Trash2, DollarSign, CheckCircle2, AlertTriangle, Clock, Calendar, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmt = (n: number) => `PKR ${Math.round(n).toLocaleString()}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const STATUS_COLORS: Record<string, string> = { Paid: 'bg-green-100 text-green-700', Pending: 'bg-amber-100 text-amber-700', Overdue: 'bg-red-100 text-red-700' };

export default function FeeInstallmentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0, overdue: 0, collected: 0, outstanding: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planDialog, setPlanDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyPlan = () => ({ planName: '', description: '', defaultInstallments: '6', defaultAmount: '', entity: 'plan' });
  const emptyAssign = () => ({ studentId: '', studentName: '', className: '', planId: '', planName: '', startDate: new Date().toISOString().slice(0, 10), totalAmount: '', installments: '4' });
  const [planForm, setPlanForm] = useState<any>(emptyPlan());
  const [assignForm, setAssignForm] = useState<any>(emptyAssign());

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'payments', search, status: statusFilter });
      const res = await fetch(`/api/fee-install?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPayments(data.items || []); setSummary(data.summary || {});
      setStudents(data.students || []); setPlans(data.plans || []);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  const loadPlans = useCallback(async () => {
    const res = await fetch('/api/fee-install?view=plans');
    const data = await res.json();
    setPlans(data.items || []); setClasses(data.classes || []);
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const handleStudent = (id: string) => {
    const s = students.find(x => x.id === id);
    setAssignForm((p: any) => ({ ...p, studentId: id, studentName: s?.fullName || '', className: s?.class?.name || '' }));
  };
  const handlePlan = (id: string) => {
    const p = plans.find(x => x.id === id);
    setAssignForm((f: any) => ({ ...f, planId: id, planName: p?.planName || '', totalAmount: p?.defaultAmount || f.totalAmount, installments: p?.defaultInstallments || f.installments }));
  };

  const savePlan = async () => {
    if (!planForm.planName) { toast({ title: 'Plan name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/fee-install', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(planForm) });
      toast({ title: 'Plan created' }); setPlanDialog(false); loadPlans(); loadPayments();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const assign = async () => {
    if (!assignForm.studentId || !assignForm.totalAmount || !assignForm.installments) { toast({ title: 'Student, amount and installments required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/fee-install', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assignForm) });
      const data = await res.json();
      toast({ title: `✅ ${data.items?.length} installments scheduled` }); setAssignDialog(false); loadPayments();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const markPaid = async (id: string) => {
    await fetch('/api/fee-install', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'Paid' }) });
    toast({ title: '✅ Marked as paid' }); loadPayments();
  };

  const del = async (id: string) => {
    if (!confirm('Delete installment?')) return;
    await fetch('/api/fee-install', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Deleted' }); loadPayments();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Fee Installments" description="Create payment plans, assign to students and track installment collections"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setPlanForm(emptyPlan()); setPlanDialog(true); loadPlans(); }}><Plus className="h-4 w-4 mr-2" />New Plan</Button>
          <Button size="sm" onClick={() => { setAssignForm(emptyAssign()); setAssignDialog(true); }}><Calendar className="h-4 w-4 mr-2" />Assign Installments</Button>
        </div>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: summary.total, color: 'border-l-slate-500' },
          { label: 'Paid', value: summary.paid, color: 'border-l-green-500' },
          { label: 'Pending', value: summary.pending, color: 'border-l-amber-500' },
          { label: 'Overdue', value: summary.overdue, color: 'border-l-red-500' },
          { label: 'Collected', value: fmt(summary.collected), color: 'border-l-blue-500', text: true },
          { label: 'Outstanding', value: fmt(summary.outstanding), color: 'border-l-orange-500', text: true },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}><CardContent className="p-3"><p className={`font-bold ${(c as any).text ? 'text-sm' : 'text-2xl'}`}>{c.value}</p><p className="text-xs text-muted-foreground mt-0.5">{c.label}</p></CardContent></Card>
        ))}
      </div>

      {summary.overdue > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" /><span><strong>{summary.overdue} overdue installments</strong> — {fmt(summary.outstanding)} outstanding total.</span>
        </div>
      )}

      <Tabs defaultValue="payments">
        <TabsList>
          <TabsTrigger value="payments">📋 Payment Schedule</TabsTrigger>
          <TabsTrigger value="plans" onClick={loadPlans}>📄 Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <Input placeholder="Search student..." className="flex-1 max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadPayments}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>

          {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            payments.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No installments scheduled yet</p><Button size="sm" className="mt-3" onClick={() => { setAssignForm(emptyAssign()); setAssignDialog(true); }}>Assign Installments</Button></CardContent></Card> :
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Plan</TableHead><TableHead>Installment</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payments.map(p => (
                    <TableRow key={p.id} className={`hover:bg-muted/20 ${p.isOverdue ? 'bg-red-50/30' : ''}`}>
                      <TableCell><div className="font-medium text-sm">{p.studentName}</div><div className="text-xs text-muted-foreground">{p.className}</div></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.planName || '—'}</TableCell>
                      <TableCell className="text-sm">{p.installmentNumber} / {p.totalInstallments}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(Number(p.amount || 0))}</TableCell>
                      <TableCell className={`text-sm ${p.isOverdue ? 'text-red-700 font-medium' : 'text-muted-foreground'}`}>{fmtDate(p.dueDate)}{p.isOverdue && ' ⚠️'}</TableCell>
                      <TableCell><Badge className={`text-xs ${STATUS_COLORS[p.isOverdue ? 'Overdue' : p.status] || ''}`}>{p.isOverdue ? 'Overdue' : p.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {p.status !== 'Paid' && <Button variant="ghost" size="sm" className="h-7 text-xs text-green-700" onClick={() => markPaid(p.id)}><CheckCircle2 className="h-3 w-3 mr-1" />Pay</Button>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          }
        </TabsContent>

        <TabsContent value="plans" className="mt-4">
          {plans.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><p>No plans created yet</p><Button size="sm" className="mt-3" onClick={() => { setPlanForm(emptyPlan()); setPlanDialog(true); }}>Create Plan</Button></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => (
                <Card key={plan.id} className="hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{plan.planName}</p>
                        {plan.description && <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>}
                        <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                          {plan.defaultInstallments && <p>📅 {plan.defaultInstallments} installments</p>}
                          {plan.defaultAmount && <p>💰 Default: {fmt(Number(plan.defaultAmount))}</p>}
                        </div>
                        <Badge className="text-xs mt-2 bg-green-100 text-green-700">Active</Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { if (confirm('Delete plan?')) { await fetch('/api/fee-install', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: plan.id, entity: 'plan' }) }); loadPlans(); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>
      </Tabs>

      {/* New Plan Dialog */}
      <Dialog open={planDialog} onOpenChange={setPlanDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Installment Plan</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Plan Name *</Label><Input value={planForm.planName} onChange={e => setPlanForm((f: any) => ({ ...f, planName: e.target.value }))} placeholder="e.g. Quarterly Plan, Monthly Plan" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={planForm.description} onChange={e => setPlanForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Default Installments</Label><Input type="number" value={planForm.defaultInstallments} onChange={e => setPlanForm((f: any) => ({ ...f, defaultInstallments: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Default Amount (PKR)</Label><Input type="number" value={planForm.defaultAmount} onChange={e => setPlanForm((f: any) => ({ ...f, defaultAmount: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPlanDialog(false)}>Cancel</Button><Button onClick={savePlan} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create Plan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign Installment Schedule</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Student *</Label><Select value={assignForm.studentId} onValueChange={handleStudent}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.class?.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Plan (optional)</Label><Select value={assignForm.planId} onValueChange={handlePlan}><SelectTrigger><SelectValue placeholder="Custom or select plan" /></SelectTrigger><SelectContent><SelectItem value="">Custom</SelectItem>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.planName}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Total Amount *</Label><Input type="number" value={assignForm.totalAmount} onChange={e => setAssignForm((f: any) => ({ ...f, totalAmount: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Installments *</Label><Input type="number" value={assignForm.installments} onChange={e => setAssignForm((f: any) => ({ ...f, installments: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={assignForm.startDate} onChange={e => setAssignForm((f: any) => ({ ...f, startDate: e.target.value }))} /></div>
            {assignForm.totalAmount && assignForm.installments && (
              <div className="bg-blue-50 rounded p-3 text-sm text-blue-800">
                <p>📅 {assignForm.installments} installments of ~<strong>{fmt(Math.round(Number(assignForm.totalAmount) / Number(assignForm.installments)))}</strong> each</p>
                <p className="text-xs mt-0.5 text-blue-600">Monthly, starting {fmtDate(assignForm.startDate)}</p>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAssignDialog(false)}>Cancel</Button><Button onClick={assign} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Schedule Installments</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
