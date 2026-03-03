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
import { Loader2, Plus, Trash2, Wallet, TrendingUp, HandCoins, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CONTRIB_TYPES = ['Monthly', 'Voluntary', 'Special'];
const LOAN_PURPOSES = ['Medical Emergency', 'Education', 'Marriage', 'House Repair', 'Business', 'Other'];
const fmt = (n: number) => `PKR ${Math.round(n || 0).toLocaleString()}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function WelfareFundPage() {
  const [staffSummary, setStaffSummary] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [fundSummary, setFundSummary] = useState({ totalFund: 0, totalDisbursed: 0, balance: 0, contributors: 0 });
  const [loanSummary, setLoanSummary] = useState({ total: 0, active: 0, pending: 0, totalDisbursed: 0 });
  const [config, setConfig] = useState({ monthlyContribution: 500, maxLoanMultiplier: 6, interestRate: 0 });
  const [loading, setLoading] = useState(false);
  const [contribDialog, setContribDialog] = useState(false);
  const [loanDialog, setLoanDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyContrib = () => ({ staffId: '', staffName: '', amount: '', month: new Date().toISOString().slice(0, 7), contribType: 'Monthly', notes: '' });
  const emptyLoan = () => ({ staffId: '', staffName: '', amount: '', purpose: 'Medical Emergency', installments: '12', requestDate: new Date().toISOString().slice(0, 10), notes: '' });
  const [contribForm, setContribForm] = useState<any>(emptyContrib());
  const [loanForm, setLoanForm] = useState<any>(emptyLoan());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/welfare-fund?view=summary');
      const data = await res.json();
      setStaffSummary(data.staffSummary || []); setStaff(data.staff || []); setFundSummary(data.fundSummary || {}); setConfig(data.config || {});
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  const loadLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/welfare-fund?view=loans');
      const data = await res.json();
      setLoans(data.loans || []); setLoanSummary(data.loanSummary || {}); setStaff(data.staff || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleContribStaff = (id: string) => { const s = staff.find(x => x.id === id); setContribForm((f: any) => ({ ...f, staffId: id, staffName: s?.fullName || '' })); };
  const handleLoanStaff = (id: string) => { const s = staff.find(x => x.id === id); setLoanForm((f: any) => ({ ...f, staffId: id, staffName: s?.fullName || '' })); };

  const saveContrib = async () => {
    if (!contribForm.staffId || !contribForm.amount) { toast({ title: 'Staff and amount required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/welfare-fund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...contribForm, entity: 'contribution' }) });
      toast({ title: '✅ Contribution recorded' }); setContribDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveLoan = async () => {
    if (!loanForm.staffId || !loanForm.amount) { toast({ title: 'Staff and amount required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/welfare-fund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...loanForm, entity: 'loan' }) });
      toast({ title: '✅ Loan application submitted' }); setLoanDialog(false); loadLoans();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const updateLoan = async (id: string, status: string) => {
    await fetch('/api/welfare-fund', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity: 'loan', status, approvedAt: status !== 'Pending' ? new Date().toISOString() : undefined }) });
    toast({ title: `Loan ${status}` }); loadLoans();
  };

  const delLoan = async (id: string) => {
    if (!confirm('Delete this loan record?')) return;
    await fetch('/api/welfare-fund', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity: 'loan' }) });
    loadLoans();
  };

  const LOAN_STATUS_COLORS: Record<string, string> = { Pending: 'bg-amber-100 text-amber-700', Active: 'bg-green-100 text-green-700', Paid: 'bg-blue-100 text-blue-700', Rejected: 'bg-red-100 text-red-700' };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Welfare Fund" description="Manage staff welfare fund — track contributions, loan applications and disbursements"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setContribForm(emptyContrib()); setContribDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Contribution</Button>
          <Button size="sm" onClick={() => { setLoanForm(emptyLoan()); setLoanDialog(true); }}><HandCoins className="h-4 w-4 mr-2" />Apply for Loan</Button>
        </div>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-lg font-bold text-green-700">{fmt(fundSummary.totalFund)}</p><p className="text-xs text-muted-foreground">Total Fund</p></CardContent></Card>
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-lg font-bold text-blue-700">{fmt(fundSummary.balance)}</p><p className="text-xs text-muted-foreground">Available Balance</p></CardContent></Card>
        <Card className="border-l-4 border-l-orange-500"><CardContent className="p-4"><p className="text-lg font-bold text-orange-700">{fmt(fundSummary.totalDisbursed)}</p><p className="text-xs text-muted-foreground">Disbursed</p></CardContent></Card>
        <Card className="border-l-4 border-l-purple-500"><CardContent className="p-4"><p className="text-2xl font-bold text-purple-700">{fundSummary.contributors}</p><p className="text-xs text-muted-foreground">Contributors</p></CardContent></Card>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">👥 Members & Contributions</TabsTrigger>
          <TabsTrigger value="loans" onClick={loadLoans}>💰 Loans ({loanSummary.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Staff Member</TableHead><TableHead>Department</TableHead><TableHead>Contributions</TableHead><TableHead>Total Contributed</TableHead><TableHead>Active Loan</TableHead></TableRow></TableHeader>
                <TableBody>
                  {staffSummary.filter(s => s.totalContributed > 0 || s.activeLoans > 0).map(s => (
                    <TableRow key={s.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="font-medium text-sm">{s.fullName}</div>
                        <div className="text-xs text-muted-foreground">{s.designation}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.department}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{s.contribCount} payments</Badge></TableCell>
                      <TableCell className="font-medium text-green-700">{fmt(s.totalContributed)}</TableCell>
                      <TableCell>{s.activeLoans > 0 ? <span className="text-orange-700 font-medium text-sm">{fmt(s.activeLoans)}</span> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                    </TableRow>
                  ))}
                  {staffSummary.filter(s => s.totalContributed > 0 || s.activeLoans > 0).length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground"><Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No contributions recorded yet</p></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent></Card>
          }
        </TabsContent>

        <TabsContent value="loans" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-3"><p className="text-xl font-bold">{loanSummary.total}</p><p className="text-xs text-muted-foreground">Total Loans</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-xl font-bold text-amber-700">{loanSummary.pending}</p><p className="text-xs text-muted-foreground">Pending Approval</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-xl font-bold text-green-700">{loanSummary.active}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-lg font-bold text-orange-700">{fmt(loanSummary.totalDisbursed)}</p><p className="text-xs text-muted-foreground">Total Disbursed</p></CardContent></Card>
          </div>

          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            loans.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><HandCoins className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No loan applications yet</p></CardContent></Card> :
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Ref No.</TableHead><TableHead>Staff</TableHead><TableHead>Amount</TableHead><TableHead>Purpose</TableHead><TableHead>Installments</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loans.map(loan => (
                    <TableRow key={loan.id} className="hover:bg-muted/20">
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{loan.refNo}</Badge></TableCell>
                      <TableCell className="font-medium text-sm">{loan.staffName}</TableCell>
                      <TableCell className="font-medium text-emerald-700">{fmt(Number(loan.amount))}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{loan.purpose}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{loan.installments} months</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(loan.requestDate || loan.createdAt)}</TableCell>
                      <TableCell><Badge className={`text-xs ${LOAN_STATUS_COLORS[loan.status] || ''}`}>{loan.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {loan.status === 'Pending' && <>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-green-700" onClick={() => updateLoan(loan.id, 'Active')}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-700" onClick={() => updateLoan(loan.id, 'Rejected')}><XCircle className="h-3 w-3 mr-1" />Reject</Button>
                          </>}
                          {loan.status === 'Active' && <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-700" onClick={() => updateLoan(loan.id, 'Paid')}>Mark Paid</Button>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => delLoan(loan.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          }
        </TabsContent>
      </Tabs>

      {/* Contribution Dialog */}
      <Dialog open={contribDialog} onOpenChange={setContribDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Contribution</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Staff Member *</Label><Select value={contribForm.staffId} onValueChange={handleContribStaff}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Amount (PKR) *</Label><Input type="number" value={contribForm.amount} onChange={e => setContribForm((f: any) => ({ ...f, amount: e.target.value }))} placeholder={String(config.monthlyContribution)} /></div>
              <div className="space-y-1.5"><Label>Month</Label><Input type="month" value={contribForm.month} onChange={e => setContribForm((f: any) => ({ ...f, month: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={contribForm.contribType} onValueChange={v => setContribForm((f: any) => ({ ...f, contribType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONTRIB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Notes</Label><Input value={contribForm.notes} onChange={e => setContribForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setContribDialog(false)}>Cancel</Button><Button onClick={saveContrib} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Dialog */}
      <Dialog open={loanDialog} onOpenChange={setLoanDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Loan Application</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Staff Member *</Label><Select value={loanForm.staffId} onValueChange={handleLoanStaff}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Amount (PKR) *</Label><Input type="number" value={loanForm.amount} onChange={e => setLoanForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Installments</Label><Input type="number" value={loanForm.installments} onChange={e => setLoanForm((f: any) => ({ ...f, installments: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Purpose</Label><Select value={loanForm.purpose} onValueChange={v => setLoanForm((f: any) => ({ ...f, purpose: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LOAN_PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Request Date</Label><Input type="date" value={loanForm.requestDate} onChange={e => setLoanForm((f: any) => ({ ...f, requestDate: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Notes / Reason</Label><Textarea value={loanForm.notes} onChange={e => setLoanForm((f: any) => ({ ...f, notes: e.target.value }))} rows={3} /></div>
            {loanForm.amount && config.monthlyContribution && <div className="bg-blue-50 text-blue-700 text-xs rounded px-3 py-2">Monthly repayment: {fmt(Math.round(Number(loanForm.amount) / Number(loanForm.installments || 12)))}</div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setLoanDialog(false)}>Cancel</Button><Button onClick={saveLoan} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
