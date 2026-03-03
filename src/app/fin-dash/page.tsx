'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown, DollarSign, RefreshCw, Users, GraduationCap, AlertCircle, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const PIE_COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#059669'];
const fmt = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n);
const fmtFull = (n: number) => `PKR ${Number(n).toLocaleString('en-PK')}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-xs space-y-1">
      <p className="font-semibold text-sm">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {fmtFull(p.value)}</p>
      ))}
    </div>
  );
};

export default function FinancialDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const years = [String(new Date().getFullYear()), String(new Date().getFullYear() - 1), String(new Date().getFullYear() - 2)];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fin-dash?year=${year}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData(d);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) {
    return (
      <div className="p-6">
        <PageHeader title="Financial Dashboard" description="Comprehensive revenue, expense, and profit overview" />
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  const { kpis, monthly, feeTypeBreakdown, expenseBreakdown } = data;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Financial Dashboard"
        description="Comprehensive revenue, expense, and profit overview"
        actions={
          <div className="flex gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print</Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Revenue</span>
            </div>
            <p className="text-2xl font-bold mt-2">{fmt(kpis.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Total {year} Fee Collection</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">Expenses</span>
            </div>
            <p className="text-2xl font-bold mt-2">{fmt(kpis.totalExpenses)}</p>
            <p className="text-xs text-muted-foreground">Expenses + Payroll {year}</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${kpis.netProfit >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className={`h-5 w-5 ${kpis.netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
              <Badge className={`text-xs ${kpis.netProfit >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{kpis.netProfit >= 0 ? 'Surplus' : 'Deficit'}</Badge>
            </div>
            <p className={`text-2xl font-bold mt-2 ${kpis.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{fmt(Math.abs(kpis.netProfit))}</p>
            <p className="text-xs text-muted-foreground">Net {year} {kpis.netProfit >= 0 ? 'Surplus' : 'Deficit'}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">{kpis.pendingCount} dues</span>
            </div>
            <p className="text-2xl font-bold mt-2">{fmt(kpis.pendingAmount)}</p>
            <p className="text-xs text-muted-foreground">Pending Fee Collection</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'This Month Revenue', value: fmtFull(kpis.thisMonthRevenue), icon: '📅' },
          { label: 'Active Students', value: kpis.studentCount.toLocaleString(), icon: '🎓' },
          { label: 'Active Staff', value: kpis.staffCount.toLocaleString(), icon: '👥' },
          { label: 'Revenue per Student', value: kpis.studentCount > 0 ? fmtFull(Math.round(kpis.totalRevenue / kpis.studentCount)) : '—', icon: '📊' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-2xl">{k.icon}</span>
              <div>
                <p className="font-semibold text-sm">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Revenue vs Expense Chart */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm">Monthly Revenue vs Expenses — {year}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[3,3,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Net Profit Line */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm">Monthly Net Surplus / Deficit — {year}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="profit" name="Net Surplus" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fee Type Breakdown */}
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm">Revenue by Fee Type</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {feeTypeBreakdown.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No fee data</div>
            ) : (
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={feeTypeBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="amount" nameKey="name">
                      {feeTypeBreakdown.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtFull(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {feeTypeBreakdown.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-medium">{fmt(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {expenseBreakdown.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No expense data</div>
            ) : (
              <div className="space-y-2">
                {expenseBreakdown.map((item: any, i: number) => {
                  const max = expenseBreakdown[0].amount;
                  const pct = Math.round((item.amount / max) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs w-28 truncate">{item.name}</span>
                      <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                        <div className="h-full rounded flex items-center pl-1.5" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}>
                          <span className="text-white text-xs font-medium whitespace-nowrap">{fmt(item.amount)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Table */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm">Monthly Summary Table — {year}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/30">
              <th className="text-left p-3 text-xs font-semibold">Month</th>
              <th className="text-right p-3 text-xs font-semibold text-green-700">Revenue</th>
              <th className="text-right p-3 text-xs font-semibold text-red-700">Expenses</th>
              <th className="text-right p-3 text-xs font-semibold text-blue-700">Net</th>
            </tr></thead>
            <tbody>
              {monthly.map((m: any, i: number) => (
                <tr key={i} className={`border-b hover:bg-muted/20 ${i % 2 === 0 ? '' : 'bg-muted/5'}`}>
                  <td className="p-3 font-medium">{m.month}</td>
                  <td className="p-3 text-right text-green-700 font-medium">{m.revenue > 0 ? fmtFull(m.revenue) : '—'}</td>
                  <td className="p-3 text-right text-red-700">{m.expenses > 0 ? fmtFull(m.expenses) : '—'}</td>
                  <td className={`p-3 text-right font-bold ${m.profit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{m.profit !== 0 ? fmtFull(Math.abs(m.profit)) : '—'}</td>
                </tr>
              ))}
              <tr className="border-t-2 bg-muted/20 font-bold">
                <td className="p-3">Total</td>
                <td className="p-3 text-right text-green-700">{fmtFull(kpis.totalRevenue)}</td>
                <td className="p-3 text-right text-red-700">{fmtFull(kpis.totalExpenses)}</td>
                <td className={`p-3 text-right ${kpis.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{fmtFull(Math.abs(kpis.netProfit))}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
