'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, Users, CheckCircle2, Clock, Loader2, Play,
  CreditCard, Download, RefreshCw, AlertCircle, Banknote,
  Search, Eye, Edit2, Trash2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

interface AllowancesData {
  houseRent: number;
  medical: number;
  transport: number;
  other: number;
}

interface DeductionsData {
  incomeTax: number;
  eobi: number;
  providentFund: number;
  other: number;
}

interface PayrollRecord {
  id: string;
  staffId: string;
  monthYear: string;
  basicSalary: number;
  grossSalary: number;
  netSalary: number;
  status: 'Pending' | 'Processed' | 'Paid';
  paymentDate: string | null;
  paymentMode: string | null;
  allowancesData: AllowancesData;
  deductionsData: DeductionsData;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation: string;
    bankAccount: string | null;
    bankName: string | null;
    department?: { name: string } | null;
  };
}

interface Summary {
  totalGross: number;
  totalNet: number;
  count: number;
  byStatus: { status: string; _count: number; _sum: { netSalary: number } }[];
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function getMonthYear(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthYear(my: string) {
  const [y, m] = my.split('-');
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
}

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  Processed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  Paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getMonthYear());
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialogs
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [detailRecord, setDetailRecord] = useState<PayrollRecord | null>(null);
  const [editRecord, setEditRecord] = useState<PayrollRecord | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payMode, setPayMode] = useState('Bank Transfer');

  // Edit form state
  const [editAllowances, setEditAllowances] = useState<AllowancesData>({
    houseRent: 0, medical: 0, transport: 0, other: 0,
  });
  const [editDeductions, setEditDeductions] = useState<DeductionsData>({
    incomeTax: 0, eobi: 0, providentFund: 0, other: 0,
  });

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ monthYear: selectedMonth, page: String(page), limit: '20' });
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/payroll?${params}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data.records);
        setSummary(json.data.summary);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch payroll data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, statusFilter, page]);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

  const handleGenerate = async () => {
    setGenerateLoading(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthYear: selectedMonth, generateAll: true }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Success', description: json.message });
        setGenerateOpen(false);
        fetchPayroll();
      } else {
        toast({ title: 'Error', description: json.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate payroll', variant: 'destructive' });
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleBatchProcess = async (action: 'process' | 'pay' | 'reset') => {
    if (!selectedIds.size) {
      toast({ title: 'No selection', description: 'Please select at least one record' });
      return;
    }
    setProcessLoading(true);
    try {
      const res = await fetch('/api/payroll/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action,
          paymentMode: action === 'pay' ? payMode : undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Success', description: json.message });
        setSelectedIds(new Set());
        setPayOpen(false);
        fetchPayroll();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to process', variant: 'destructive' });
    } finally {
      setProcessLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editRecord) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/payroll/${editRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicSalary: editRecord.basicSalary,
          allowances: editAllowances,
          deductions: editDeductions,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Updated', description: 'Payroll record updated' });
        setEditRecord(null);
        fetchPayroll();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payroll record?')) return;
    try {
      const res = await fetch(`/api/payroll/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Deleted', description: 'Payroll record deleted' });
        fetchPayroll();
      } else {
        toast({ title: 'Error', description: json.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const filtered = records.filter(r =>
    !search || `${r.staff.firstName} ${r.staff.lastName} ${r.staff.employeeCode}`.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = summary?.byStatus.find(s => s.status === 'Pending')?._count || 0;
  const processedCount = summary?.byStatus.find(s => s.status === 'Processed')?._count || 0;
  const paidCount = summary?.byStatus.find(s => s.status === 'Paid')?._count || 0;
  const totalNet = summary?.byStatus.find(s => s.status === 'Paid')?._sum?.netSalary || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
            <p className="text-muted-foreground">Process and manage staff salaries</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={v => { setSelectedMonth(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const my = getMonthYear(i - 11);
                  return (
                    <SelectItem key={my} value={my}>{formatMonthYear(my)}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button onClick={() => setGenerateOpen(true)}>
              <Play className="mr-2 h-4 w-4" />
              Generate Payroll
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.count || 0}</div>
              <p className="text-xs text-muted-foreground">{formatMonthYear(selectedMonth)}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Net Payable</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">PKR {(summary?.totalNet || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Gross: PKR {(summary?.totalGross || 0).toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{paidCount}</div>
              <p className="text-xs text-muted-foreground">PKR {totalNet.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Actions Bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 w-60"
                  />
                </div>
                <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processed">Processed</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchProcess('process')}
                    disabled={processLoading}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Mark Processed
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setPayOpen(true)}
                    disabled={processLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Banknote className="mr-1 h-3.5 w-3.5" />
                    Mark Paid
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBatchProcess('reset')}
                    disabled={processLoading}
                  >
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    Reset
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payroll Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-3" />
                <p className="text-lg font-medium">No payroll records found</p>
                <p className="text-sm">Generate payroll for {formatMonthYear(selectedMonth)} to get started</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedIds.size === records.length && records.length > 0}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead className="text-right">Basic</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(r => (
                      <TableRow key={r.id} className={selectedIds.has(r.id) ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(r.id)}
                            onCheckedChange={() => toggleSelect(r.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{r.staff.firstName} {r.staff.lastName}</p>
                            <p className="text-xs text-muted-foreground">{r.staff.employeeCode}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{r.staff.designation}</p>
                            {r.staff.department && (
                              <p className="text-xs text-muted-foreground">{r.staff.department.name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {r.basicSalary.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {r.grossSalary.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          -{(r.grossSalary - r.netSalary).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-green-700">
                          {r.netSalary.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[r.status]}`}>
                            {r.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {r.paymentDate ? (
                            <div className="text-xs">
                              <p>{r.paymentMode}</p>
                              <p className="text-muted-foreground">
                                {new Date(r.paymentDate).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7"
                              onClick={() => setDetailRecord(r)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {r.status !== 'Paid' && (
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditRecord(r);
                                  setEditAllowances(r.allowancesData);
                                  setEditDeductions(r.deductionsData);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {r.status === 'Pending' && (
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-700"
                                onClick={() => handleDelete(r.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Generate Payroll Dialog */}
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Payroll</DialogTitle>
              <DialogDescription>
                Generate payroll records for all active staff for {formatMonthYear(selectedMonth)}.
                Records that already exist will be skipped.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  This will auto-calculate salaries based on each staff member's base salary
                  with standard allowances (45% HRA, 10% Medical, 5% Transport) and
                  Pakistan income tax deductions.
                </p>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Month:</span>
                <span className="font-medium">{formatMonthYear(selectedMonth)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={generateLoading}>
                {generateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pay Dialog */}
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payment</DialogTitle>
              <DialogDescription>
                Mark {selectedIds.size} selected record(s) as Paid.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label>Payment Mode</Label>
                <Select value={payMode} onValueChange={setPayMode}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Online">Online Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleBatchProcess('pay')}
                disabled={processLoading}
              >
                {processLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail View Dialog */}
        {detailRecord && (
          <Dialog open={!!detailRecord} onOpenChange={() => setDetailRecord(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Payslip — {detailRecord.staff.firstName} {detailRecord.staff.lastName}</DialogTitle>
                <DialogDescription>{formatMonthYear(detailRecord.monthYear)} • {detailRecord.staff.employeeCode}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wide">Earnings</p>
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span className="font-mono">{detailRecord.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>House Rent</span>
                      <span className="font-mono">{detailRecord.allowancesData.houseRent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medical</span>
                      <span className="font-mono">{detailRecord.allowancesData.medical.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport</span>
                      <span className="font-mono">{detailRecord.allowancesData.transport.toLocaleString()}</span>
                    </div>
                    {detailRecord.allowancesData.other > 0 && (
                      <div className="flex justify-between">
                        <span>Other</span>
                        <span className="font-mono">{detailRecord.allowancesData.other.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Gross Salary</span>
                      <span className="font-mono">{detailRecord.grossSalary.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wide">Deductions</p>
                    <div className="flex justify-between text-red-600">
                      <span>Income Tax</span>
                      <span className="font-mono">{detailRecord.deductionsData.incomeTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>EOBI</span>
                      <span className="font-mono">{detailRecord.deductionsData.eobi.toLocaleString()}</span>
                    </div>
                    {detailRecord.deductionsData.providentFund > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Provident Fund</span>
                        <span className="font-mono">{detailRecord.deductionsData.providentFund.toLocaleString()}</span>
                      </div>
                    )}
                    {detailRecord.deductionsData.other > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Other</span>
                        <span className="font-mono">{detailRecord.deductionsData.other.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg font-bold text-lg">
                  <span>Net Salary</span>
                  <span className="text-green-700 font-mono">PKR {detailRecord.netSalary.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Status: <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[detailRecord.status]}`}>{detailRecord.status}</span></div>
                  {detailRecord.paymentMode && <div>Mode: {detailRecord.paymentMode}</div>}
                  {detailRecord.staff.bankName && <div>Bank: {detailRecord.staff.bankName}</div>}
                  {detailRecord.staff.bankAccount && <div>Account: {detailRecord.staff.bankAccount}</div>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailRecord(null)}>Close</Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Print Slip
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Dialog */}
        {editRecord && (
          <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Payroll</DialogTitle>
                <DialogDescription>
                  {editRecord.staff.firstName} {editRecord.staff.lastName} — {formatMonthYear(editRecord.monthYear)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Basic Salary (PKR)</Label>
                  <Input
                    type="number"
                    className="mt-1"
                    value={editRecord.basicSalary}
                    onChange={e => setEditRecord(r => r ? { ...r, basicSalary: Number(e.target.value) } : null)}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Allowances (PKR)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['houseRent', 'medical', 'transport', 'other'] as const).map(k => (
                      <div key={k}>
                        <Label className="text-xs capitalize">{k === 'houseRent' ? 'House Rent' : k}</Label>
                        <Input
                          type="number"
                          className="mt-1"
                          value={editAllowances[k]}
                          onChange={e => setEditAllowances(a => ({ ...a, [k]: Number(e.target.value) }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Deductions (PKR)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['incomeTax', 'eobi', 'providentFund', 'other'] as const).map(k => (
                      <div key={k}>
                        <Label className="text-xs capitalize">{k === 'incomeTax' ? 'Income Tax' : k === 'providentFund' ? 'Provident Fund' : k.toUpperCase()}</Label>
                        <Input
                          type="number"
                          className="mt-1"
                          value={editDeductions[k]}
                          onChange={e => setEditDeductions(d => ({ ...d, [k]: Number(e.target.value) }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
                <Button onClick={handleEditSave} disabled={editLoading}>
                  {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
