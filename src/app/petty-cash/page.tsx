'use client';

export const dynamic = "force-dynamic"
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
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, Download, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CATEGORIES = ['Office Supplies', 'Cleaning', 'Refreshments', 'Courier', 'Utilities', 'Repairs', 'Transport', 'Printing', 'Miscellaneous', 'Opening Balance', 'Replenishment'];
const fmt = (n: number) => `PKR ${Number(n || 0).toLocaleString('en-PK')}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function PettyCashPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ type: 'Expense', date: new Date().toISOString().slice(0, 10), amount: '', category: 'Office Supplies', description: '', voucherNo: '', handledBy: '' });
  const [saving, setSaving] = useState(false);
  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, filter: typeFilter, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/petty-cash?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, typeFilter, page]);

  useEffect(() => { load(); }, [load]);

  // Running balance calc
  const sorted = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let runningBalance = 0;
  const withBalance = sorted.map(item => {
    if (item.type === 'Income' || item.type === 'Replenishment' || item.type === 'Opening Balance') runningBalance += Number(item.amount || 0);
    else runningBalance -= Number(item.amount || 0);
    return { ...item, balance: runningBalance };
  }).reverse();

  const totalIn = items.filter(i => ['Income', 'Replenishment', 'Opening Balance'].includes(i.type)).reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalOut = items.filter(i => !['Income', 'Replenishment', 'Opening Balance'].includes(i.type)).reduce((s, i) => s + Number(i.amount || 0), 0);
  const balance = totalIn - totalOut;

  const save = async () => {
    if (!form.amount || !form.date) { toast({ title: 'Amount and date required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const method = editing ? 'PATCH' : 'POST';
      const body = editing ? { ...form, id: editing.id } : form;
      await fetch('/api/petty-cash', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      toast({ title: editing ? 'Updated' : 'Entry added' });
      setShowDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (i: any) => {
    if (!confirm('Delete entry?')) return;
    await fetch('/api/petty-cash', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: i.id }) });
    toast({ title: 'Deleted' }); load();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Petty Cash" description="Manage daily petty cash receipts, payments, and balances"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditing(null); setForm({ ...form, type: 'Replenishment', category: 'Replenishment' }); setShowDialog(true); }}>+ Replenish</Button>
          <Button size="sm" onClick={() => { setEditing(null); setForm({ type: 'Expense', date: new Date().toISOString().slice(0, 10), amount: '', category: 'Office Supplies', description: '', voucherNo: '', handledBy: '' }); setShowDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Entry</Button>
        </div>}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4">
          <div className="flex items-center justify-between"><ArrowDownCircle className="h-5 w-5 text-green-500" /><span className="text-2xl font-bold text-green-700">{fmt(totalIn)}</span></div>
          <p className="text-xs text-muted-foreground mt-1">Total In (Replenishments)</p>
        </CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="p-4">
          <div className="flex items-center justify-between"><ArrowUpCircle className="h-5 w-5 text-red-500" /><span className="text-2xl font-bold text-red-700">{fmt(totalOut)}</span></div>
          <p className="text-xs text-muted-foreground mt-1">Total Expenses</p>
        </CardContent></Card>
        <Card className={`border-l-4 ${balance >= 0 ? 'border-l-blue-500' : 'border-l-red-500'}`}><CardContent className="p-4">
          <div className="flex items-center justify-between"><Wallet className={`h-5 w-5 ${balance >= 0 ? 'text-blue-500' : 'text-red-500'}`} /><span className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fmt(balance)}</span></div>
          <p className="text-xs text-muted-foreground mt-1">Current Balance</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Expense">Expense</SelectItem>
              <SelectItem value="Replenishment">Replenishment</SelectItem>
              <SelectItem value="Opening Balance">Opening Balance</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
        </div>
      </CardContent></Card>

      {/* Table */}
      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div> :
          items.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No entries yet</p></div> :
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead>Type/Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
                <TableHead className="text-right">Payment</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Handled By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withBalance.map((item: any) => {
                const isIn = ['Income', 'Replenishment', 'Opening Balance'].includes(item.type);
                return (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm">{fmtDate(item.date)}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{item.voucherNo || '—'}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${isIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.category || item.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{item.description}</TableCell>
                    <TableCell className="text-right text-sm text-green-700 font-medium">{isIn ? fmt(item.amount) : ''}</TableCell>
                    <TableCell className="text-right text-sm text-red-700 font-medium">{!isIn ? fmt(item.amount) : ''}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-bold ${item.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fmt(item.balance)}</span>
                    </TableCell>
                    <TableCell className="text-sm">{item.handledBy || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setForm(item); setShowDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        }
      </CardContent></Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Entry' : 'Add Petty Cash Entry'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Entry Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Expense">Expense (Payment)</SelectItem>
                  <SelectItem value="Replenishment">Replenishment (Receipt)</SelectItem>
                  <SelectItem value="Opening Balance">Opening Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (PKR) *</Label>
              <Input type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Voucher No.</Label>
              <Input placeholder="PCV-001" value={form.voucherNo} onChange={e => setForm({ ...form, voucherNo: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Handled By</Label>
              <Input placeholder="Staff name" value={form.handledBy} onChange={e => setForm({ ...form, handledBy: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Details about this entry..." rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Add Entry'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
