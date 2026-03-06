'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Play, FileText, Filter, RefreshCw, Printer, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const REPORT_TYPES = [
  { value: 'students', label: '🎓 Student List', description: 'Complete student roster with class, section, contact info' },
  { value: 'attendance', label: '📅 Attendance Report', description: 'Student attendance records with status breakdown' },
  { value: 'fees', label: '💰 Fee Payments', description: 'Fee collection records with receipt and payment details' },
  { value: 'staff', label: '👥 Staff Directory', description: 'Staff list with designation, department, contact details' },
  { value: 'exam_results', label: '📝 Exam Results', description: 'Student marks and grades per exam and subject' },
  { value: 'payroll', label: '💵 Payroll Register', description: 'Staff payroll with salary breakdown per month' },
  { value: 'library', label: '📚 Library Issues', description: 'Book issue/return records with fine information' },
];

const STATUS_BY_TYPE: Record<string, string[]> = {
  students: ['Active', 'Inactive', 'Left', 'Graduated'],
  attendance: ['Present', 'Absent', 'Late', 'Leave', 'Half-day'],
  fees: ['Paid', 'Partial', 'Pending', 'Overdue'],
  staff: ['Active', 'Inactive', 'On Leave', 'Terminated'],
  payroll: ['Paid', 'Processed', 'Pending'],
  library: ['Issued', 'Returned', 'Overdue', 'Lost'],
};

export default function ReportBuilderPage() {
  const [reportType, setReportType] = useState('students');
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [limitVal, setLimitVal] = useState('500');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [count, setCount] = useState(0);
  const [sortCol, setSortCol] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    fetch('/api/rpt-builder').then(r => r.json()).then(d => {
      setClasses(d.classes || []);
      setExams(d.exams || []);
      setMonths(d.months || []);
    });
  }, []);

  const runReport = async () => {
    setLoading(true);
    setHasRun(true);
    try {
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (examFilter) filters.examId = examFilter;
      if (monthFilter) filters.monthYear = monthFilter;
      const res = await fetch('/api/rpt-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, classId: classFilter, dateFrom, dateTo, filters, limit: parseInt(limitVal) || 500 }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result.data || []);
      setHeaders(result.headers || []);
      setCount(result.count || 0);
      setSortCol('');
      toast({ title: 'Report generated', description: `${result.count} records found` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sortedFiltered = React.useMemo(() => {
    let rows = [...data];
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(s)));
    }
    if (sortCol) {
      rows.sort((a, b) => {
        const av = String(a[sortCol] || '');
        const bv = String(b[sortCol] || '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [data, search, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const exportCsv = () => {
    const csv = [headers, ...sortedFiltered.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`))]
      .map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const printReport = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const reportLabel = REPORT_TYPES.find(r => r.value === reportType)?.label || reportType;
    w.document.write(`
      <html><head><title>${reportLabel}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 16px; }
        h2 { font-size: 14px; margin-bottom: 4px; }
        p { color: #666; font-size: 10px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e3a5f; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
        td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
        tr:nth-child(even) td { background: #f9fafb; }
      </style></head><body>
      <h2>${reportLabel}</h2>
      <p>Generated: ${new Date().toLocaleString()} · ${sortedFiltered.length} records</p>
      <table>
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${sortedFiltered.map(r => `<tr>${headers.map(h => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const selectedReport = REPORT_TYPES.find(r => r.value === reportType);
  const needsDates = ['attendance', 'fees', 'library'].includes(reportType);
  const needsClass = ['students', 'attendance', 'exam_results'].includes(reportType);
  const needsExam = reportType === 'exam_results';
  const needsMonth = reportType === 'payroll';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Custom Report Builder"
        description="Generate dynamic reports from any data module with custom filters"
        actions={
          data.length > 0 ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={printReport}><Printer className="h-4 w-4 mr-2" />Print</Button>
              <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            </div>
          ) : null
        }
      />

      {/* Report Type Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {REPORT_TYPES.map(rt => (
          <button
            key={rt.value}
            onClick={() => { setReportType(rt.value); setData([]); setHasRun(false); }}
            className={`p-3 rounded-lg border text-left transition-all hover:shadow-sm ${reportType === rt.value ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border hover:border-primary/30'}`}
          >
            <div className="font-medium text-sm">{rt.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{rt.description}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Report Filters — {selectedReport?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {needsDates && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">From Date</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To Date</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
              </>
            )}
            {needsClass && (
              <div className="space-y-1.5">
                <Label className="text-xs">Class</Label>
                <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {needsExam && (
              <div className="space-y-1.5">
                <Label className="text-xs">Exam</Label>
                <Select value={examFilter} onValueChange={v => setExamFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="All Exams" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {needsMonth && (
              <div className="space-y-1.5">
                <Label className="text-xs">Month</Label>
                <Select value={monthFilter} onValueChange={v => setMonthFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="All Months" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {STATUS_BY_TYPE[reportType] && (
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {STATUS_BY_TYPE[reportType].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Max Records</Label>
              <Select value={limitVal} onValueChange={setLimitVal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['100', '250', '500', '1000', '5000'].map(l => <SelectItem key={l} value={l}>{l} rows</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={runReport} disabled={loading} className="px-8">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {loading ? 'Generating...' : 'Run Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasRun && (
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Results
                {count > 0 && <Badge variant="outline" className="ml-1">{sortedFiltered.length} of {count}</Badge>}
              </CardTitle>
              {data.length > 0 && (
                <div className="flex items-center gap-2">
                  <Input placeholder="Search results..." value={search} onChange={e => setSearch(e.target.value)} className="h-7 w-48 text-xs" />
                  <Button variant="outline" size="sm" className="h-7" onClick={exportCsv}><Download className="h-3.5 w-3.5 mr-1" />CSV</Button>
                  <Button variant="outline" size="sm" className="h-7" onClick={printReport}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                <span className="ml-2 text-muted-foreground text-sm">Generating report...</span>
              </div>
            ) : sortedFiltered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No records found</p>
                <p className="text-sm mt-1">Try adjusting your filters and running the report again</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center text-xs">#</TableHead>
                      {headers.map(h => (
                        <TableHead key={h} className="cursor-pointer hover:bg-muted/50 select-none card-hover" onClick={() => handleSort(h)}>
                          <div className="flex items-center gap-1 text-xs">
                            {h}
                            {sortCol === h ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFiltered.slice(0, 200).map((row, i) => (
                      <TableRow key={i} className="hover:bg-muted/20">
                        <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                        {headers.map(h => (
                          <TableCell key={h} className="text-xs max-w-[200px] truncate" title={String(row[h] ?? '')}>
                            {String(row[h] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {sortedFiltered.length > 200 && (
                  <div className="text-center py-3 text-sm text-muted-foreground border-t bg-muted/10">
                    Showing first 200 rows of {sortedFiltered.length}. Export CSV to see all records.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!hasRun && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Select a report type and click Run Report</p>
              <p className="text-sm mt-1">Use filters to narrow your data, then export or print</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
