'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Receipt, Plus, Trash2, Edit, Loader2, Search, X,
  ChevronLeft, ChevronRight, TrendingDown, Tag, AlertCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

interface ExpCat  { id: string; name: string; description?: string | null; budgetAmount?: number | null; _count?: { expenses: number }; }
interface Expense {
  id: string; amount: number; expenseDate: string; paymentMode: string | null;
  description: string | null; billNumber: string | null; vendorName: string | null; approvedBy: string | null;
  expenseCategory: { id: string; name: string };
}
interface Summary { total: number; count: number; byCategory: { categoryId: string; categoryName: string; total: number; count: number }[]; }

const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'Cheque', 'Card', 'Online'];
const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];

const EMPTY_FORM = {
  expenseCategoryId: '', amount: '', expenseDate: new Date().toISOString().slice(0,10),
  paymentMode: 'Cash', description: '', billNumber: '', vendorName: '', approvedBy: '',
};

export default function ExpensesPage() {
  const [tab, setTab]             = useState('expenses');
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [categories, setCategories] = useState<ExpCat[]>([]);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchIn, setSearchIn]   = useState('');
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [fromDate, setFromDate]   = useState('');
  const [toDate, setToDate]       = useState('');

  // Form
  const [formOpen, setFormOpen]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  // Category form
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catForm, setCatForm]     = useState({ name: '', description: '', budgetAmount: '' });
  const [catSaving, setCatSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchIn), 400);
    return () => clearTimeout(t);
  }, [searchIn]);

  useEffect(() => { fetchExpenses(); }, [page, search, catFilter, modeFilter, fromDate, toDate]);

  const fetchCategories = async () => {
    const r = await fetch('/api/expenses/categories');
    const j = await r.json();
    if (j.success) setCategories(j.data);
  };

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (search)                p.append('search',      search);
      if (catFilter  !== 'all') p.append('categoryId',  catFilter);
      if (modeFilter !== 'all') p.append('paymentMode', modeFilter);
      if (fromDate)              p.append('fromDate',    fromDate);
      if (toDate)                p.append('toDate',      toDate);

      const r = await fetch(`/api/expenses?${p}`);
      const j = await r.json();
      if (j.success) {
        setExpenses(j.data.expenses);
        setSummary(j.data.summary);
        setTotalCount(j.data.pagination.total);
        setTotalPages(j.data.pagination.totalPages);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load expenses', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [page, search, catFilter, modeFilter, fromDate, toDate]);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditId(e.id);
    setForm({
      expenseCategoryId: e.expenseCategory.id,
      amount:      String(e.amount),
      expenseDate: e.expenseDate.slice(0,10),
      paymentMode: e.paymentMode || 'Cash',
      description: e.description || '',
      billNumber:  e.billNumber  || '',
      vendorName:  e.vendorName  || '',
      approvedBy:  e.approvedBy  || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.expenseCategoryId || !form.amount || !form.expenseDate) {
      toast({ title: 'Validation', description: 'Category, amount and date are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const url    = editId ? `/api/expenses/${editId}` : '/api/expenses';
      const method = editId ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Saved', description: editId ? 'Expense updated' : 'Expense recorded' });
        setFormOpen(false);
        fetchExpenses();
      } else {
        toast({ title: 'Error', description: j.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Save failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleCatSave = async () => {
    if (!catForm.name) {
      toast({ title: 'Validation', description: 'Category name required', variant: 'destructive' });
      return;
    }
    setCatSaving(true);
    try {
      const r = await fetch('/api/expenses/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...catForm, schoolId: 'default' }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Created', description: 'Category added' });
        setCatFormOpen(false);
        setCatForm({ name: '', description: '', budgetAmount: '' });
        fetchCategories();
      } else {
        toast({ title: 'Error', description: j.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create', variant: 'destructive' });
    } finally { setCatSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' });
      const j = await r.json();
      if (j.success) { toast({ title: 'Deleted' }); setDeleteId(null); fetchExpenses(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch {
      toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
    } finally { setDeleting(false); }
  };

  const clearFilters = () => {
    setSearchIn(''); setSearch(''); setCatFilter('all');
    setModeFilter('all'); setFromDate(''); setToDate(''); setPage(1);
  };

  const hasFilters = search || catFilter !== 'all' || modeFilter !== 'all' || fromDate || toDate;
  const uf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
            <p className="text-muted-foreground">Track and manage all school expenditures</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCatFormOpen(true)}>
              <Tag className="mr-2 h-4 w-4" />Add Category
            </Button>
            <Button onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" />Record Expense
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">PKR {summary.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{summary.count} records</p>
              </CardContent>
            </Card>
            {summary.byCategory.slice(0, 3).map((c, i) => (
              <Card key={c.categoryId} className="border-l-4" style={{ borderLeftColor: PIE_COLORS[i] }}>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">{c.categoryName}</p>
                  <p className="text-2xl font-bold">PKR {c.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{c.count} transactions</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="expenses">Expense Records</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* ── Expenses Tab ── */}
          <TabsContent value="expenses" className="space-y-4 pt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-44">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search description, vendor..." value={searchIn} onChange={e => setSearchIn(e.target.value)} />
                  </div>
                  <Select value={catFilter} onValueChange={v => { setCatFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={modeFilter} onValueChange={v => { setModeFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="All Modes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modes</SelectItem>
                      {PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="date" className="w-36" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
                  <span className="text-muted-foreground">–</span>
                  <Input type="date" className="w-36" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Receipt className="h-10 w-10 mb-3" />
                    <p className="font-medium">{hasFilters ? 'No expenses match filters' : 'No expenses recorded'}</p>
                    {!hasFilters && <Button className="mt-4" onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Record First Expense</Button>}
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Bill No</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead className="text-right">Amount (PKR)</TableHead>
                          <TableHead>Approved By</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map(e => (
                          <TableRow key={e.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="whitespace-nowrap">{new Date(e.expenseDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full px-2 py-0.5 font-medium">
                                {e.expenseCategory.name}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-40 truncate text-sm">{e.description || '—'}</TableCell>
                            <TableCell className="text-sm">{e.vendorName || '—'}</TableCell>
                            <TableCell className="font-mono text-xs">{e.billNumber || '—'}</TableCell>
                            <TableCell className="text-sm">{e.paymentMode || '—'}</TableCell>
                            <TableCell className="text-right font-mono font-semibold text-red-600">
                              {e.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{e.approvedBy || '—'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => setDeleteId(e.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        Showing {((page-1)*20)+1}–{Math.min(page*20,totalCount)} of {totalCount}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)}>
                          <ChevronLeft className="h-4 w-4"/>
                        </Button>
                        <span className="text-sm self-center">{page}/{totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>
                          <ChevronRight className="h-4 w-4"/>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics" className="space-y-4 pt-4">
            {summary && summary.byCategory.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Expense by Category</CardTitle>
                    <CardDescription>Total spending per category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={summary.byCategory} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize:11 }} />
                        <YAxis type="category" dataKey="categoryName" tick={{ fontSize:11 }} width={90} />
                        <Tooltip formatter={(v:number) => `PKR ${v.toLocaleString()}`} />
                        <Bar dataKey="total" name="Total" fill="#ef4444" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Expense Distribution</CardTitle>
                    <CardDescription>Category share of total</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={summary.byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="total" nameKey="categoryName">
                          {summary.byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v:number) => `PKR ${v.toLocaleString()}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader><CardTitle className="text-base">Category Breakdown</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Transactions</TableHead>
                          <TableHead className="text-right">Total Spent</TableHead>
                          <TableHead className="text-right">% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.byCategory.map((c, i) => (
                          <TableRow key={c.categoryId} className="hover:bg-muted/20 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="font-medium">{c.categoryName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{c.count}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">PKR {c.total.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {summary.total > 0 ? ((c.total / summary.total) * 100).toFixed(1) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <TrendingDown className="h-12 w-12 mb-4" />
                <p>No expense data available for analytics</p>
              </div>
            )}
          </TabsContent>

          {/* ── Categories Tab ── */}
          <TabsContent value="categories" className="pt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Expense Categories</CardTitle>
                  <CardDescription>Manage expense types for classification</CardDescription>
                </div>
                <Button size="sm" onClick={() => setCatFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Add Category
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {categories.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <Tag className="h-10 w-10 mb-3" />
                    <p>No categories yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Budget (PKR)</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map(c => (
                        <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.description || '—'}</TableCell>
                          <TableCell className="text-right font-mono">
                            {c.budgetAmount ? c.budgetAmount.toLocaleString() : '—'}
                          </TableCell>
                          <TableCell className="text-right">{c._count?.expenses ?? 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Expense Form Dialog ── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Expense' : 'Record Expense'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Category *</Label>
              <Select value={form.expenseCategoryId} onValueChange={v => uf('expenseCategoryId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (PKR) *</Label>
              <Input className="mt-1" type="number" min="0" value={form.amount} onChange={e => uf('amount', e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Date *</Label>
              <Input className="mt-1" type="date" value={form.expenseDate} onChange={e => uf('expenseDate', e.target.value)} />
            </div>
            <div>
              <Label>Payment Mode</Label>
              <Select value={form.paymentMode} onValueChange={v => uf('paymentMode', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bill Number</Label>
              <Input className="mt-1" value={form.billNumber} onChange={e => uf('billNumber', e.target.value)} placeholder="INV-001" />
            </div>
            <div>
              <Label>Vendor / Supplier</Label>
              <Input className="mt-1" value={form.vendorName} onChange={e => uf('vendorName', e.target.value)} placeholder="Vendor name" />
            </div>
            <div>
              <Label>Approved By</Label>
              <Input className="mt-1" value={form.approvedBy} onChange={e => uf('approvedBy', e.target.value)} placeholder="Principal" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Input className="mt-1" value={form.description} onChange={e => uf('description', e.target.value)} placeholder="Details about this expense..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? 'Update' : 'Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Category Form Dialog ── */}
      <Dialog open={catFormOpen} onOpenChange={setCatFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Expense Category</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name *</Label>
              <Input className="mt-1" value={catForm.name} onChange={e => setCatForm(f => ({...f, name:e.target.value}))} placeholder="e.g. Utilities" />
            </div>
            <div>
              <Label>Description</Label>
              <Input className="mt-1" value={catForm.description} onChange={e => setCatForm(f => ({...f, description:e.target.value}))} placeholder="Optional" />
            </div>
            <div>
              <Label>Monthly Budget (PKR)</Label>
              <Input className="mt-1" type="number" value={catForm.budgetAmount} onChange={e => setCatForm(f => ({...f, budgetAmount:e.target.value}))} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatFormOpen(false)}>Cancel</Button>
            <Button onClick={handleCatSave} disabled={catSaving}>
              {catSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Expense</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
