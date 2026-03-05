'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Printer, TrendingUp, TrendingDown, DollarSign, FileText , DownloadIcon} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateFeeReport } from '@/lib/pdf-generator';
import PageHeader from '@/components/page-header';

const fmt = (n: number) => `PKR ${Math.abs(n).toLocaleString('en-PK')}`;
const fmtK = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n/1000)}K` : String(Math.round(n));

export default function FinancialReportsPage() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [plData, setPlData] = useState<any>(null);
  const [feeData, setFeeData] = useState<any>(null);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const years = [String(new Date().getFullYear()), String(new Date().getFullYear()-1), String(new Date().getFullYear()-2)];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pl, fees, payroll] = await Promise.all([
        fetch(`/api/fin-reports?year=${year}&type=pl`).then(r => r.json()),
        fetch(`/api/fin-reports?year=${year}&type=fees`).then(r => r.json()),
        fetch(`/api/fin-reports?year=${year}&type=payroll`).then(r => r.json()),
      ]);
      if (pl.error) throw new Error(pl.error);
      setPlData(pl); setFeeData(fees); setPayrollData(payroll);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const printReport = () => window.print();

  return (
    <div className="p-6 space-y-6 print:p-4">
      <PageHeader title="Financial Reports" description="Profit & Loss statement, fee collection analysis, and payroll summary"
        actions={<div className="flex gap-2">
          <Select value={year} onValueChange={setYear}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => window.print()}><DownloadIcon className="h-4 w-4 mr-2" />Export PDF</Button>
              <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button variant="outline" size="sm" onClick={printReport}><Printer className="h-4 w-4 mr-2" />Print</Button>
        </div>}
      />

      {loading ? <div className="flex items-center justify-center h-64"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div> : (
        <Tabs defaultValue="pl">
          <TabsList className="print:hidden">
            <TabsTrigger value="pl">📊 Profit & Loss</TabsTrigger>
            <TabsTrigger value="fees">💰 Fee Collection</TabsTrigger>
            <TabsTrigger value="payroll">👥 Payroll Summary</TabsTrigger>
          </TabsList>

          {/* ── P&L Tab ── */}
          <TabsContent value="pl" className="mt-6 space-y-6">
            {plData && (
              <>
                {/* Summary Banner */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-green-500"><CardContent className="p-4">
                    <div className="flex items-center justify-between"><TrendingUp className="h-5 w-5 text-green-500" /><span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Revenue</span></div>
                    <p className="text-2xl font-bold text-green-700 mt-2">{fmt(plData.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Total Income {year}</p>
                  </CardContent></Card>
                  <Card className="border-l-4 border-l-red-500"><CardContent className="p-4">
                    <div className="flex items-center justify-between"><TrendingDown className="h-5 w-5 text-red-500" /><span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Expenses</span></div>
                    <p className="text-2xl font-bold text-red-700 mt-2">{fmt(plData.totalExpenses)}</p>
                    <p className="text-xs text-muted-foreground">Total Outgoings {year}</p>
                  </CardContent></Card>
                  <Card className={`border-l-4 ${plData.netProfit >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}><CardContent className="p-4">
                    <div className="flex items-center justify-between"><DollarSign className={`h-5 w-5 ${plData.netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} /><Badge className={`text-xs ${plData.netProfit >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{plData.netProfit >= 0 ? 'SURPLUS' : 'DEFICIT'}</Badge></div>
                    <p className={`text-2xl font-bold mt-2 ${plData.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{fmt(plData.netProfit)}</p>
                    <p className="text-xs text-muted-foreground">Net {plData.netProfit >= 0 ? 'Surplus' : 'Deficit'} {year}</p>
                  </CardContent></Card>
                </div>

                {/* P&L Statement */}
                <Card>
                  <CardHeader className="py-3 px-4 border-b flex items-center justify-between flex-row">
                    <CardTitle className="text-sm">Profit & Loss Statement — Year {year}</CardTitle>
                    <p className="text-xs text-muted-foreground">Figures in PKR</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-green-50 border-b"><td colSpan={2} className="p-3 font-bold text-green-800">INCOME</td></tr></thead>
                      <tbody>
                        {Object.entries(plData.revenueByType).sort(([,a],[,b]) => (b as number)-(a as number)).map(([name, amt]: [string, any]) => (
                          <tr key={name} className="border-b hover:bg-muted/20">
                            <td className="p-3 pl-6 text-muted-foreground">{name}</td>
                            <td className="p-3 text-right font-medium text-green-700">{fmt(amt)}</td>
                          </tr>
                        ))}
                        <tr className="bg-green-50 font-bold border-b-2">
                          <td className="p-3 text-green-800">Total Income</td>
                          <td className="p-3 text-right text-green-800">{fmt(plData.totalRevenue)}</td>
                        </tr>
                        <tr className="bg-red-50 border-b"><td colSpan={2} className="p-3 font-bold text-red-800">EXPENDITURE</td></tr>
                        {Object.entries(plData.expenseByCategory).sort(([,a],[,b]) => (b as number)-(a as number)).map(([name, amt]: [string, any]) => (
                          <tr key={name} className="border-b hover:bg-muted/20">
                            <td className="p-3 pl-6 text-muted-foreground">{name}</td>
                            <td className="p-3 text-right font-medium text-red-700">{fmt(amt)}</td>
                          </tr>
                        ))}
                        <tr className="bg-red-50 font-bold border-b-2">
                          <td className="p-3 text-red-800">Total Expenditure</td>
                          <td className="p-3 text-right text-red-800">{fmt(plData.totalExpenses)}</td>
                        </tr>
                        <tr className={`font-bold text-base ${plData.netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                          <td className={`p-3 ${plData.netProfit >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Net {plData.netProfit >= 0 ? 'Surplus' : 'Deficit'}</td>
                          <td className={`p-3 text-right ${plData.netProfit >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{fmt(plData.netProfit)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Quarterly */}
                <Card>
                  <CardHeader className="py-3 px-4 border-b"><CardTitle className="text-sm">Quarterly Breakdown</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/30"><th className="p-3 text-left">Quarter</th><th className="p-3 text-right text-green-700">Revenue</th><th className="p-3 text-right text-red-700">Expenses</th><th className="p-3 text-right">Net</th></tr></thead>
                      <tbody>{plData.quarters?.map((q: any) => (
                        <tr key={q.label} className="border-b hover:bg-muted/20">
                          <td className="p-3 font-medium">{q.label}</td>
                          <td className="p-3 text-right text-green-700">{q.revenue > 0 ? fmt(q.revenue) : '—'}</td>
                          <td className="p-3 text-right text-red-700">{q.expenses > 0 ? fmt(q.expenses) : '—'}</td>
                          <td className={`p-3 text-right font-bold ${q.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{q.net !== 0 ? fmt(q.net) : '—'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ── Fee Collection Tab ── */}
          <TabsContent value="fees" className="mt-6">
            {feeData && (
              <Card>
                <CardHeader className="py-3 px-4 border-b"><CardTitle className="text-sm">Fee Collection Report — {year}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/30">
                      <th className="p-3 text-left">Fee Type</th>
                      <th className="p-3 text-right text-green-700">Collected</th>
                      <th className="p-3 text-right text-green-700">Txns</th>
                      <th className="p-3 text-right text-amber-700">Pending</th>
                      <th className="p-3 text-right text-amber-700">Dues</th>
                      <th className="p-3 text-right">Collection %</th>
                    </tr></thead>
                    <tbody>
                      {feeData.feeTypes?.map((ft: any) => {
                        const total = ft.paidAmount + ft.pendingAmount;
                        const pct = total > 0 ? Math.round((ft.paidAmount / total) * 100) : 0;
                        return (
                          <tr key={ft.name} className="border-b hover:bg-muted/20">
                            <td className="p-3 font-medium">{ft.name}</td>
                            <td className="p-3 text-right text-green-700 font-medium">{ft.paidAmount > 0 ? fmt(ft.paidAmount) : '—'}</td>
                            <td className="p-3 text-right text-green-700">{ft.paidCount}</td>
                            <td className="p-3 text-right text-amber-700">{ft.pendingAmount > 0 ? fmt(ft.pendingAmount) : '—'}</td>
                            <td className="p-3 text-right text-amber-700">{ft.pendingCount}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} /></div>
                                <span className="text-xs font-medium">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="font-bold bg-muted/20 border-t-2">
                        <td className="p-3">Total</td>
                        <td className="p-3 text-right text-green-700">{fmt(feeData.feeTypes?.reduce((s: number, f: any) => s + f.paidAmount, 0))}</td>
                        <td className="p-3 text-right text-green-700">{feeData.feeTypes?.reduce((s: number, f: any) => s + f.paidCount, 0)}</td>
                        <td className="p-3 text-right text-amber-700">{fmt(feeData.feeTypes?.reduce((s: number, f: any) => s + f.pendingAmount, 0))}</td>
                        <td className="p-3 text-right text-amber-700">{feeData.feeTypes?.reduce((s: number, f: any) => s + f.pendingCount, 0)}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Payroll Summary Tab ── */}
          <TabsContent value="payroll" className="mt-6">
            {payrollData && (
              <Card>
                <CardHeader className="py-3 px-4 border-b"><CardTitle className="text-sm">Payroll Summary — {year}</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/30">
                      <th className="p-3 text-left">Month</th>
                      <th className="p-3 text-right">Gross</th>
                      <th className="p-3 text-right">Allowances</th>
                      <th className="p-3 text-right">Deductions</th>
                      <th className="p-3 text-right text-green-700">Net Pay</th>
                      <th className="p-3 text-right">Staff</th>
                      <th className="p-3 text-right">Paid</th>
                    </tr></thead>
                    <tbody>
                      {payrollData.months?.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No payroll data for {year}</td></tr>
                      ) : payrollData.months?.map((m: any) => (
                        <tr key={m.month} className="border-b hover:bg-muted/20">
                          <td className="p-3 font-medium">{m.month}</td>
                          <td className="p-3 text-right">{fmt(m.gross)}</td>
                          <td className="p-3 text-right text-green-700">+{fmt(m.allowances)}</td>
                          <td className="p-3 text-right text-red-700">-{fmt(m.deductions)}</td>
                          <td className="p-3 text-right font-bold text-green-700">{fmt(m.net)}</td>
                          <td className="p-3 text-right">{m.count}</td>
                          <td className="p-3 text-right"><Badge className={`text-xs ${m.paid === m.count ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{m.paid}/{m.count}</Badge></td>
                        </tr>
                      ))}
                      {payrollData.months?.length > 0 && (
                        <tr className="font-bold bg-muted/20 border-t-2">
                          <td className="p-3">Total</td>
                          <td className="p-3 text-right">{fmt(payrollData.months.reduce((s: number, m: any) => s + m.gross, 0))}</td>
                          <td className="p-3 text-right text-green-700">+{fmt(payrollData.months.reduce((s: number, m: any) => s + m.allowances, 0))}</td>
                          <td className="p-3 text-right text-red-700">-{fmt(payrollData.months.reduce((s: number, m: any) => s + m.deductions, 0))}</td>
                          <td className="p-3 text-right text-green-700">{fmt(payrollData.months.reduce((s: number, m: any) => s + m.net, 0))}</td>
                          <td colSpan={2} />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
