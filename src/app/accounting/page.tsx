'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Loader2,
  RefreshCw, ChevronLeft, ChevronRight, Download,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

interface LedgerEntry {
  id: string; date: string; type: 'income' | 'expense';
  category: string; description: string; reference: string | null;
  amount: number; mode: string | null;
}
interface Summary { totalIncome: number; totalExpense: number; netBalance: number; }
interface MonthlyPoint { month: string; income: number; expense: number; net: number; }

const fmtPKR = (n: number) => `PKR ${Math.abs(n).toLocaleString()}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AccountingPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // filters
  const currentYear = new Date().getFullYear();
  const [fromDate, setFromDate] = useState(`${currentYear}-01-01`);
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { fetchLedger(); }, [page, typeFilter]);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        fromDate, toDate, type: typeFilter, page: String(page), limit: '30',
      });
      const r = await fetch(`/api/accounting/ledger?${p}`);
      const j = await r.json();
      if (j.success) {
        setEntries(j.data.entries);
        setSummary(j.data.summary);
        setMonthly(j.data.monthlyChart);
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load ledger', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [fromDate, toDate, typeFilter, page]);

  const handleApply = () => { setPage(1); fetchLedger(); };

  const exportCSV = () => {
    const rows = [
      ['Date', 'Type', 'Category', 'Description', 'Reference', 'Amount', 'Mode'],
      ...entries.map(e => [
        fmtDate(e.date), e.type, e.category, e.description,
        e.reference || '', e.amount, e.mode || '',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `ledger-${fromDate}-${toDate}.csv`;
    a.click();
  };

  const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtMonth = (my: string) => { const [y, m] = my.split('-'); return `${MONTHS_SHORT[parseInt(m)-1]} ${y.slice(2)}`; };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Accounting Ledger</h1>
            <p className="text-muted-foreground">Income, expenses and net balance overview</p>
          </div>
          <Button variant="outline" onClick={exportCSV} disabled={entries.length === 0}>
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">{fmtPKR(summary.totalIncome)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Fee collections</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{fmtPKR(summary.totalExpense)}</p>
                    <p className="text-xs text-muted-foreground mt-1">All outgoing</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className={`border-l-4 ${summary.netBalance >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Balance</p>
                    <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {summary.netBalance < 0 ? '-' : ''}{fmtPKR(summary.netBalance)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.netBalance >= 0 ? 'Surplus' : 'Deficit'}
                    </p>
                  </div>
                  <DollarSign className={`h-8 w-8 opacity-60 ${summary.netBalance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label>From</Label>
                <Input className="mt-1 w-36" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div>
                <Label>To</Label>
                <Input className="mt-1 w-36" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
                  <SelectTrigger className="mt-1 w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entries</SelectItem>
                    <SelectItem value="income">Income Only</SelectItem>
                    <SelectItem value="expense">Expense Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleApply} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="journal">
          <TabsList>
            <TabsTrigger value="journal">Journal ({total})</TabsTrigger>
            <TabsTrigger value="chart">Monthly Chart</TabsTrigger>
          </TabsList>

          {/* Journal */}
          <TabsContent value="journal">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
                ) : entries.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mb-4" />
                    <p>No entries for selected period</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map(e => (
                          <TableRow key={e.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="text-sm whitespace-nowrap">{fmtDate(e.date)}</TableCell>
                            <TableCell>
                              <Badge variant={e.type === 'income' ? 'default' : 'destructive'} className="text-xs capitalize">
                                {e.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{e.category}</TableCell>
                            <TableCell className="text-sm max-w-xs truncate">{e.description}</TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">{e.reference || '—'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{e.mode || '—'}</TableCell>
                            <TableCell className={`text-right font-mono font-semibold ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {e.type === 'expense' ? '-' : '+'}{fmtPKR(e.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t">
                        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Chart */}
          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income vs Expense</CardTitle>
                <CardDescription>Bar chart comparison with net balance line</CardDescription>
              </CardHeader>
              <CardContent>
                {monthly.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-muted-foreground">No data for selected range</div>
                ) : (
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart data={monthly.map(m => ({ ...m, month: fmtMonth(m.month) }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number, n: string) => [`PKR ${v.toLocaleString()}`, n]} />
                      <Legend />
                      <ReferenceLine y={0} stroke="#6b7280" />
                      <Bar dataKey="income"  name="Income"   fill="#22c55e" radius={[4,4,0,0]} />
                      <Bar dataKey="expense" name="Expense"  fill="#ef4444" radius={[4,4,0,0]} />
                      <Bar dataKey="net"     name="Net"      fill="#3b82f6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* Monthly table */}
                {monthly.length > 0 && (
                  <div className="mt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right text-green-600">Income</TableHead>
                          <TableHead className="text-right text-red-600">Expense</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthly.map(m => (
                          <TableRow key={m.month} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="font-medium">{fmtMonth(m.month)}</TableCell>
                            <TableCell className="text-right text-green-600 font-mono">{fmtPKR(m.income)}</TableCell>
                            <TableCell className="text-right text-red-600 font-mono">{fmtPKR(m.expense)}</TableCell>
                            <TableCell className={`text-right font-mono font-bold ${m.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                              {m.net < 0 ? '-' : '+'}{fmtPKR(m.net)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totals row */}
                        {summary && (
                          <TableRow className="bg-muted/50 font-bold">
                            <TableCell>TOTAL</TableCell>
                            <TableCell className="text-right text-green-700 font-mono">{fmtPKR(summary.totalIncome)}</TableCell>
                            <TableCell className="text-right text-red-700 font-mono">{fmtPKR(summary.totalExpense)}</TableCell>
                            <TableCell className={`text-right font-mono ${summary.netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                              {summary.netBalance < 0 ? '-' : '+'}{fmtPKR(summary.netBalance)}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
