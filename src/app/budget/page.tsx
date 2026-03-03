'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, Plus, Edit, Trash2, RefreshCw, Download, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle2, PiggyBank } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CATEGORIES = ['Academic', 'Infrastructure', 'Staff & HR', 'IT & Technology', 'Sports & Co-curricular', 'Library', 'Transport', 'Hostel', 'Marketing', 'Utilities', 'Maintenance', 'Admin & Office', 'Other'];
const fmt = (n: number) => `PKR ${Number(n).toLocaleString('en-PK')}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const currentYear = new Date().getFullYear().toString();
const emptyHead = { name: '', category: 'Academic', allocated: '', description: '', year: currentYear };
const emptyTxn = { budgetHeadId: '', description: '', amount: '', date: new Date().toISOString().slice(0, 10), reference: '', year: currentYear };

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalAllocated: 0, totalSpent: 0, totalRemaining: 0, utilizationPct: 0, headCount: 0 });
  const [years, setYears] = useState<string[]>([currentYear]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState(currentYear);
  const [catFilter, setCatFilter] = useState('');
  const [showHeadDialog, setShowHeadDialog] = useState(false);
  const [showTxnDialog, setShowTxnDialog] = useState(false);
  const [editingHead, setEditingHead] = useState<any>(null);
  const [headForm, setHeadForm] = useState<any>(emptyHead);
  const [txnForm, setTxnForm] = useState<any>(emptyTxn);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: yearFilter, category: catFilter });
      const res = await fetch(`/api/budget?${params}`);
      const data = await res.json();
      setBudgets(data.budgets || []);
      setTransactions(data.transactions || []);
      if (data.summary) setSummary(data.summary);
      if (data.years) setYears(data.years);
      if (data.categories) setCategories(data.categories);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [yearFilter, catFilter]);

  useEffect(() => { load(); }, [load]);

  const saveHead = async () => {
    if (!headForm.name || !headForm.allocated) { toast({ title: 'Name and amount required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const body = editingHead ? { ...headForm, id: editingHead.id, entityType: 'head' } : { ...headForm, year: yearFilter };
      const res = await fetch('/api/budget', { method: editingHead ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: editingHead ? 'Updated' : 'Budget head added' });
      setShowHeadDialog(false); load();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveTxn = async () => {
    if (!txnForm.budgetHeadId || !txnForm.amount || !txnForm.description) { toast({ title: 'All fields required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/budget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...txnForm, type: 'transaction', year: yearFilter }) });
      toast({ title: 'Expense recorded' });
      setShowTxnDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const deleteHead = async (b: any) => {
    if (!confirm(`Delete "${b.name}" budget head?`)) return;
    await fetch('/api/budget', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id, entityType: 'head' }) });
    toast({ title: 'Deleted' }); load();
  };

  const deleteTxn = async (t: any) => {
    if (!confirm('Delete this transaction?')) return;
    await fetch('/api/budget', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, entityType: 'transaction' }) });
    toast({ title: 'Deleted' }); load();
  };

  const exportCsv = () => {
    const rows = [['Head', 'Category', 'Allocated', 'Spent', 'Remaining', 'Utilization %'],
      ...budgets.map(b => [b.name, b.category, b.allocated, b.spent, b.remaining, b.utilization + '%'])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `budget-${yearFilter}.csv`; a.click();
  };

  const chartData = categories.length > 0
    ? CATEGORIES.filter(c => budgets.some(b => b.category === c)).map(cat => ({
        name: cat.split(' ')[0],
        Allocated: budgets.filter(b => b.category === cat).reduce((s, b) => s + Number(b.allocated), 0) / 1000,
        Spent: budgets.filter(b => b.category === cat).reduce((s, b) => s + b.spent, 0) / 1000,
      }))
    : [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Budget Planning"
        description="Allocate, track, and analyze school budgets by category"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button variant="outline" size="sm" onClick={() => { setTxnForm({ ...emptyTxn, year: yearFilter }); setShowTxnDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Record Expense
            </Button>
            <Button size="sm" onClick={() => { setEditingHead(null); setHeadForm({ ...emptyHead, year: yearFilter }); setShowHeadDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Add Budget Head
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Allocated', value: fmt(summary.totalAllocated), color: 'border-l-blue-500', icon: <PiggyBank className="h-4 w-4 text-blue-500" /> },
          { label: 'Total Spent', value: fmt(summary.totalSpent), color: 'border-l-red-500', icon: <TrendingDown className="h-4 w-4 text-red-500" /> },
          { label: 'Remaining', value: fmt(summary.totalRemaining), color: 'border-l-green-500', icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
          { label: 'Utilization', value: `${summary.utilizationPct}%`, color: summary.utilizationPct > 90 ? 'border-l-red-500' : summary.utilizationPct > 70 ? 'border-l-amber-500' : 'border-l-green-500', icon: <DollarSign className="h-4 w-4 text-indigo-500" /> },
          { label: 'Budget Heads', value: summary.headCount, color: 'border-l-slate-500', icon: <CheckCircle2 className="h-4 w-4 text-slate-500" /> },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">{c.icon}<span className="text-lg font-bold">{c.value}</span></div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex gap-3 flex-wrap">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['2022', '2023', '2024', '2025', '2026'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={catFilter} onValueChange={v => setCatFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Budget Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="chart">Chart Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {loading ? (
            <div className="flex justify-center items-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
          ) : budgets.length === 0 ? (
            <Card><CardContent className="text-center py-16 text-muted-foreground">
              <PiggyBank className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No budget heads for {yearFilter}</p>
              <Button size="sm" className="mt-4" onClick={() => { setEditingHead(null); setHeadForm({ ...emptyHead, year: yearFilter }); setShowHeadDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />Add First Budget Head
              </Button>
            </CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Budget Head</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Allocated</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="w-40">Utilization</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map(b => {
                    const isOverBudget = b.spent > b.allocated;
                    const isNearLimit = b.utilization >= 80 && !isOverBudget;
                    return (
                      <TableRow key={b.id} className={isOverBudget ? 'bg-red-50/50' : ''}>
                        <TableCell>
                          <div className="font-medium text-sm">{b.name}</div>
                          {b.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{b.description}</div>}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{b.category}</Badge></TableCell>
                        <TableCell className="text-right font-medium text-sm">{fmt(b.allocated)}</TableCell>
                        <TableCell className="text-right text-sm text-red-600 font-medium">{fmt(b.spent)}</TableCell>
                        <TableCell className={`text-right text-sm font-bold ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
                          {isOverBudget ? `(${fmt(Math.abs(b.remaining))})` : fmt(b.remaining)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={Math.min(b.utilization, 100)} className={`h-1.5 ${isOverBudget ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`} />
                            <div className="flex items-center gap-1">
                              {isOverBudget && <AlertTriangle className="h-3 w-3 text-red-500" />}
                              <span className={`text-xs font-medium ${isOverBudget ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                {b.utilization}%
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setTxnForm({ ...emptyTxn, budgetHeadId: b.id, year: yearFilter }); setShowTxnDialog(true); }}>
                              + Expense
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingHead(b); setHeadForm({ name: b.name, category: b.category, allocated: b.allocated, description: b.description || '', year: b.year }); setShowHeadDialog(true); }}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteHead(b)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card><CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No transactions recorded yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Budget Head</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(t => {
                    const head = budgets.find(b => b.id === t.budgetHeadId);
                    return (
                      <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="text-sm">{fmtDate(t.date)}</TableCell>
                        <TableCell className="font-medium text-sm">{t.description}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{head?.name || '—'}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.reference || '—'}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">{fmt(t.amount)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTxn(t)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        {/* Chart Tab */}
        <TabsContent value="chart">
          <Card>
            <CardHeader><CardTitle className="text-sm">Allocated vs Spent by Category (PKR Thousands)</CardTitle></CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No data to chart</div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}K`} />
                    <Tooltip formatter={(v: any) => [`PKR ${v}K`, '']} />
                    <Legend />
                    <Bar dataKey="Allocated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Spent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Budget Head Dialog */}
      <Dialog open={showHeadDialog} onOpenChange={setShowHeadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingHead ? 'Edit Budget Head' : 'Add Budget Head'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Head Name *</Label>
              <Input placeholder="e.g. Teacher Salaries, Lab Equipment" value={headForm.name} onChange={e => setHeadForm({ ...headForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={headForm.category} onValueChange={v => setHeadForm({ ...headForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Allocated Amount (PKR) *</Label>
                <Input type="number" placeholder="0" value={headForm.allocated} onChange={e => setHeadForm({ ...headForm, allocated: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Brief description..." rows={2} value={headForm.description} onChange={e => setHeadForm({ ...headForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHeadDialog(false)}>Cancel</Button>
            <Button onClick={saveHead} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingHead ? 'Update' : 'Add Head'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={showTxnDialog} onOpenChange={setShowTxnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Budget Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Budget Head *</Label>
              <Select value={txnForm.budgetHeadId} onValueChange={v => setTxnForm({ ...txnForm, budgetHeadId: v })}>
                <SelectTrigger><SelectValue placeholder="Select budget head" /></SelectTrigger>
                <SelectContent>{budgets.map(b => <SelectItem key={b.id} value={b.id}>{b.name} (Rem: {fmt(b.remaining)})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Input placeholder="What was this expense for?" value={txnForm.description} onChange={e => setTxnForm({ ...txnForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount (PKR) *</Label>
                <Input type="number" placeholder="0" value={txnForm.amount} onChange={e => setTxnForm({ ...txnForm, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={txnForm.date} onChange={e => setTxnForm({ ...txnForm, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reference / Voucher No.</Label>
              <Input placeholder="Voucher or receipt number" value={txnForm.reference} onChange={e => setTxnForm({ ...txnForm, reference: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTxnDialog(false)}>Cancel</Button>
            <Button onClick={saveTxn} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Record Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
