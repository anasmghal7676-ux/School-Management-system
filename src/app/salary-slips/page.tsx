'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Search, RefreshCw, Printer, Download, Eye,
  CheckCircle2, Clock, AlertCircle, Banknote, Users, FileText,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateSalarySlip } from '@/lib/pdf-generator';
import PageHeader from '@/components/page-header';

const fmt = (n: number) => `PKR ${n.toLocaleString('en-PK')}`;
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

function monthLabel(m: string) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  Paid: 'bg-green-100 text-green-700',
  Processed: 'bg-blue-100 text-blue-700',
  Pending: 'bg-amber-100 text-amber-700',
};

function PayslipPrint({ payroll, onClose }: { payroll: any; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const allowances = (() => {
    try { return JSON.parse(payroll.allowances || '{}'); } catch { return {}; }
  })();
  const deductions = (() => {
    try { return JSON.parse(payroll.deductions || '{}'); } catch { return {}; }
  })();

  const totalAllowances = Object.values(allowances).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
  const totalDeductions = Object.values(deductions).reduce((s: number, v: any) => s + (Number(v) || 0), 0);

  const downloadSalaryPDF = (slip?: any) => {
    const target = slip || (printRef.current ? null : null);
    const s = target || {};
    // Gather earnings/deductions from current view
    const earnings = [
      { label: 'Basic Salary', amount: parseFloat(s.basicSalary || s.salary || 0) },
      { label: 'House Rent Allowance', amount: parseFloat(s.hra || 0) },
      { label: 'Medical Allowance', amount: parseFloat(s.medical || 0) },
      { label: 'Conveyance', amount: parseFloat(s.conveyance || 0) },
    ].filter(e => e.amount > 0);
    const deductions = [
      { label: 'Income Tax', amount: parseFloat(s.incomeTax || 0) },
      { label: 'Provident Fund', amount: parseFloat(s.pf || 0) },
      { label: 'EOBI', amount: parseFloat(s.eobi || 0) },
      { label: 'Loan Deduction', amount: parseFloat(s.loanDeduction || 0) },
    ].filter(d => d.amount > 0);
    generateSalarySlip({
      staff: s.staff || s,
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear().toString(),
      earnings: earnings.length ? earnings : [{ label: 'Basic Salary', amount: parseFloat(s.netSalary || s.salary || 0) }],
      deductions,
      bankName: s.bankName,
      accountNo: s.accountNumber,
    });
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Salary Slip — ${payroll.staff.fullName} — ${monthLabel(payroll.monthYear)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
          body { padding: 20px; color: #1a1a1a; }
          .slip { max-width: 700px; margin: 0 auto; border: 2px solid #1e3a5f; border-radius: 8px; overflow: hidden; }
          .header { background: #1e3a5f; color: white; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
          .school-name { font-size: 20px; font-weight: bold; }
          .slip-title { text-align: right; font-size: 13px; opacity: 0.85; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
          .info-section { padding: 16px 24px; border-bottom: 1px solid #e5e7eb; }
          .info-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 10px; font-weight: 600; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
          .info-label { color: #6b7280; }
          .info-value { font-weight: 500; }
          .salary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
          .salary-section { padding: 16px 24px; }
          .salary-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 10px; font-weight: 600; }
          .divider { border-left: 1px solid #e5e7eb; }
          .sal-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
          .sal-label { color: #374151; }
          .sal-amount { font-weight: 500; }
          .sal-total { border-top: 1px solid #d1d5db; margin-top: 8px; padding-top: 8px; font-weight: 600; }
          .net-salary { background: #f0fdf4; padding: 16px 24px; border-top: 2px solid #1e3a5f; display: flex; justify-content: space-between; align-items: center; }
          .net-label { font-size: 14px; font-weight: 600; color: #1e3a5f; }
          .net-amount { font-size: 24px; font-weight: 700; color: #166534; }
          .footer { background: #f9fafb; padding: 12px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
          .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: ${payroll.status === 'Paid' ? '#dcfce7' : '#fef3c7'}; color: ${payroll.status === 'Paid' ? '#166534' : '#92400e'}; }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Salary Slip Preview</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => downloadSalaryPDF(payroll)}>
            <Download className="h-4 w-4 mr-2" />PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>

      <div ref={printRef}>
        <div className="slip border-2 border-blue-900 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
            <div>
              <div className="text-xl font-bold">School Management System</div>
              <div className="text-sm opacity-80">Official Salary Slip</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{monthLabel(payroll.monthYear)}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${payroll.status === 'Paid' ? 'bg-green-200 text-green-900' : 'bg-amber-200 text-amber-900'}`}>
                {payroll.status}
              </span>
            </div>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 border-b border-gray-200">
            <div className="p-4 border-r border-gray-200">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Employee Details</h3>
              {[
                ['Name', payroll.staff.fullName],
                ['Employee ID', payroll.staff.employeeCode],
                ['Designation', payroll.staff.designation],
                ['Department', payroll.staff.department?.name || '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Payment Details</h3>
              {[
                ['Month', monthLabel(payroll.monthYear)],
                ['Payment Date', fmtDate(payroll.paymentDate)],
                ['Payment Mode', payroll.paymentMode || '—'],
                ['Bank', payroll.staff.bankName || '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-2">
            <div className="p-4 border-r border-gray-200">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Earnings</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Basic Salary</span>
                <span className="font-medium">{fmt(payroll.basicSalary)}</span>
              </div>
              {Object.entries(allowances).map(([k, v]: any) => v > 0 ? (
                <div key={k} className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 capitalize">{k}</span>
                  <span>{fmt(Number(v))}</span>
                </div>
              ) : null)}
              <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
                <span>Gross Salary</span>
                <span className="text-blue-700">{fmt(payroll.grossSalary)}</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Deductions</h3>
              {Object.entries(deductions).length === 0 ? (
                <p className="text-sm text-gray-400">No deductions</p>
              ) : Object.entries(deductions).map(([k, v]: any) => v > 0 ? (
                <div key={k} className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 capitalize">{k}</span>
                  <span className="text-red-600">- {fmt(Number(v))}</span>
                </div>
              ) : null)}
              <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
                <span>Total Deductions</span>
                <span className="text-red-600">{fmt(totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="bg-green-50 px-6 py-4 border-t-2 border-blue-900 flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Net Salary Payable</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {payroll.processedBy ? `Processed by: ${payroll.processedBy}` : 'Pending processing'}
              </div>
            </div>
            <div className="text-3xl font-bold text-green-700">{fmt(payroll.netSalary)}</div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t flex justify-between text-xs text-gray-400">
            <span>Generated: {new Date().toLocaleDateString('en-PK')}</span>
            <span>This is a computer generated slip — no signature required</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalarySlipsPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, paid: 0, processed: 0, pending: 0, totalNetSalary: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewPayroll, setViewPayroll] = useState<any>(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search, monthYear: monthFilter, status: statusFilter,
        staffId: staffFilter, page: String(page), limit: String(limit),
      });
      const res = await fetch(`/api/salary-slips?${params}`);
      const data = await res.json();
      setPayrolls(data.payrolls || []);
      setTotal(data.total || 0);
      if (data.summary) setSummary(data.summary);
      if (data.months) setMonths(data.months);
      if (data.staff) setStaffList(data.staff);
    } catch {
      toast({ title: 'Error', description: 'Failed to load', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, monthFilter, statusFilter, staffFilter, page]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const headers = ['Employee', 'ID', 'Designation', 'Month', 'Basic', 'Gross', 'Deductions', 'Net', 'Status', 'Payment Date'];
    const rows = payrolls.map(p => [
      p.staff.fullName, p.staff.employeeCode, p.staff.designation,
      monthLabel(p.monthYear), p.basicSalary, p.grossSalary,
      p.grossSalary - p.netSalary, p.netSalary, p.status, fmtDate(p.paymentDate),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `salary-slips-${monthFilter || 'all'}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Salary Slips"
        description="Generate and view staff salary slips and payroll summaries"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Payrolls', value: summary.total, color: 'border-l-slate-500', icon: <Users className="h-4 w-4 text-slate-500" /> },
          { label: 'Paid', value: summary.paid, color: 'border-l-green-500', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
          { label: 'Processed', value: summary.processed, color: 'border-l-blue-500', icon: <FileText className="h-4 w-4 text-blue-500" /> },
          { label: 'Pending', value: summary.pending, color: 'border-l-amber-500', icon: <Clock className="h-4 w-4 text-amber-500" /> },
          { label: 'Total Net Salary', value: `PKR ${(summary.totalNetSalary / 1000).toFixed(0)}K`, color: 'border-l-indigo-500', icon: <Banknote className="h-4 w-4 text-indigo-500" /> },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">{c.icon}<span className="text-xl font-bold">{c.value}</span></div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, ID..." className="pl-8" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={monthFilter} onValueChange={v => { setMonthFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Months" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map(m => <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={staffFilter} onValueChange={v => { setStaffFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Staff" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {['Pending', 'Processed', 'Paid'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No salary records found</p>
              <p className="text-sm mt-1">Process payroll from the Payroll module to generate slips</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Basic Salary</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((p: any) => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium text-sm">{p.staff.fullName}</div>
                      <div className="text-xs text-muted-foreground">{p.staff.employeeCode} · {p.staff.designation}</div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{monthLabel(p.monthYear)}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(p.basicSalary)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmt(p.grossSalary)}</TableCell>
                    <TableCell className="text-right text-sm text-red-600">
                      {fmt(p.grossSalary - p.netSalary)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold text-green-700">{fmt(p.netSalary)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${STATUS_COLORS[p.status] || ''}`}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(p.paymentDate)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setViewPayroll(p)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />View Slip
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Payslip Dialog */}
      <Dialog open={!!viewPayroll} onOpenChange={open => !open && setViewPayroll(null)}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
          {viewPayroll && <PayslipPrint payroll={viewPayroll} onClose={() => setViewPayroll(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
