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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2, Search, X, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, Clock, TrendingDown,
  DollarSign, Users, RefreshCw, Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

interface StudentInstallment {
  student: { id: string; fullName: string; admissionNumber: string; rollNumber: string | null; class: { name: string } | null; section: { name: string } | null };
  monthlyFee: number;
  currentMonthPaid: boolean;
  totalPaid: number;
  outstanding: number;
  dueSummary: { monthYear: string; monthlyFee: number; paid: boolean; overdue: boolean }[];
}

interface Summary {
  totalStudents: number;
  totalMonthlyDue: number;
  totalPaid: number;
  totalPending: number;
  totalOutstanding: number;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = (my: string) => { const [y, m] = my.split('-'); return `${MONTHS[parseInt(m)-1]} ${y}`; };

export default function FeeInstallmentsPage() {
  const [installments, setInstallments] = useState<StudentInstallment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);

  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchIn, setSearchIn] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [collectOpen, setCollectOpen] = useState(false);
  const [collectStudent, setCollectStudent] = useState<StudentInstallment | null>(null);
  const [collectMonth, setCollectMonth] = useState('');
  const [collectMode, setCollectMode] = useState('Cash');
  const [collectAmount, setCollectAmount] = useState('');
  const [collecting, setCollecting] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<StudentInstallment | null>(null);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { const t = setTimeout(() => setSearch(searchIn), 400); return () => clearTimeout(t); }, [searchIn]);
  useEffect(() => { fetchInstallments(); }, [classFilter, statusFilter, currentMonth, search, page]);

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=100');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchInstallments = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ monthYear: currentMonth, page: String(page), limit: '30' });
      if (classFilter !== 'all') p.append('classId', classFilter);
      if (statusFilter !== 'all') p.append('status', statusFilter);
      const r = await fetch(`/api/fee-install?${p}`);
      const j = await r.json();
      if (j.success) {
        setInstallments(j.data.installments);
        setSummary(j.data.summary);
        setTotalPages(j.data.pagination.totalPages);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load installments', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [classFilter, statusFilter, currentMonth, search, page]);

  const openCollect = (inst: StudentInstallment) => {
    setCollectStudent(inst);
    setCollectMonth(currentMonth);
    setCollectAmount(String(inst.monthlyFee));
    setCollectMode('Cash');
    setCollectOpen(true);
  };

  const handleCollect = async () => {
    if (!collectStudent || !collectAmount) return;
    setCollecting(true);
    try {
      const r = await fetch('/api/fees-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId:   collectStudent.student.id,
          monthYear:   collectMonth,
          amount:      parseFloat(collectAmount),
          paymentMode: collectMode,
          feeTypes:    ['tuition'],
        }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Collected', description: `PKR ${collectAmount} received from ${collectStudent.student.fullName}` });
        setCollectOpen(false);
        fetchInstallments();
      } else {
        toast({ title: 'Error', description: j.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Collection failed', variant: 'destructive' });
    } finally { setCollecting(false); }
  };

  const displayed = search
    ? installments.filter(i =>
        i.student.fullName.toLowerCase().includes(search.toLowerCase()) ||
        i.student.admissionNumber.includes(search)
      )
    : installments;

  const changeMonth = (delta: number) => {
    const d = new Date(currentMonth + '-01');
    d.setMonth(d.getMonth() + delta);
    setCurrentMonth(d.toISOString().slice(0, 7));
    setPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fee Installments</h1>
            <p className="text-muted-foreground">Monthly dues tracker and payment collection</p>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm min-w-28 text-center">{fmt(currentMonth)}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Total Students', value: summary.totalStudents, icon: Users, color: 'border-l-blue-500', text: '' },
              { label: 'Monthly Due', value: `PKR ${summary.totalMonthlyDue.toLocaleString()}`, icon: DollarSign, color: 'border-l-purple-500', text: '' },
              { label: 'Paid', value: summary.totalPaid, icon: CheckCircle2, color: 'border-l-green-500', text: 'text-green-600' },
              { label: 'Pending', value: summary.totalPending, icon: Clock, color: 'border-l-amber-500', text: 'text-amber-600' },
              { label: 'Outstanding', value: `PKR ${summary.totalOutstanding.toLocaleString()}`, icon: TrendingDown, color: 'border-l-red-500', text: 'text-red-600' },
            ].map(({ label, value, icon: Icon, color, text }) => (
              <Card key={label} className={`border-l-4 ${color}`}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-xl font-bold ${text}`}>{value}</p>
                    </div>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search student..." value={searchIn} onChange={e => setSearchIn(e.target.value)} />
              </div>
              <Select value={classFilter} onValueChange={v => { setClassFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Has Arrears</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchInstallments} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-3" />
                <p>No students found matching filters</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Monthly Fee</TableHead>
                      <TableHead className="text-center">This Month</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-center">Last 6 Months</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.map(inst => (
                      <TableRow key={inst.student.id} className={inst.outstanding > 0 && !inst.currentMonthPaid ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{inst.student.fullName}</p>
                            <p className="text-xs text-muted-foreground">{inst.student.admissionNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {inst.student.class?.name}
                          {inst.student.section && <span className="text-muted-foreground"> ({inst.student.section.name})</span>}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {inst.monthlyFee > 0 ? `PKR ${inst.monthlyFee.toLocaleString()}` : <span className="text-muted-foreground text-xs">Not set</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {inst.currentMonthPaid ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900 rounded-full px-2 py-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 dark:bg-amber-900 rounded-full px-2 py-0.5">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {inst.outstanding > 0
                            ? <span className="text-red-600 font-semibold">PKR {inst.outstanding.toLocaleString()}</span>
                            : <span className="text-green-600 text-sm">✓ Clear</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-0.5">
                            {inst.dueSummary.map(d => (
                              <div
                                key={d.monthYear}
                                title={`${fmt(d.monthYear)}: ${d.paid ? 'Paid' : d.overdue ? 'Overdue' : 'Pending'}`}
                                className={`h-4 w-4 rounded-sm text-[9px] flex items-center justify-center font-bold cursor-default
                                  ${d.paid ? 'bg-green-500 text-white' : d.overdue ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}
                              >
                                {d.monthYear.slice(5)}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost" size="sm" className="h-7 text-xs"
                              onClick={() => { setDetailStudent(inst); setDetailOpen(true); }}
                            >
                              History
                            </Button>
                            {!inst.currentMonthPaid && inst.monthlyFee > 0 && (
                              <Button size="sm" className="h-7 text-xs" onClick={() => openCollect(inst)}>
                                Collect
                              </Button>
                            )}
                          </div>
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
      </main>

      {/* Collect Payment Dialog */}
      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collect Fee Payment</DialogTitle>
            <DialogDescription>{collectStudent?.student.fullName} — {collectStudent?.student.admissionNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Month</Label>
              <Select value={collectMonth} onValueChange={setCollectMonth}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {collectStudent?.dueSummary.filter(d => !d.paid).map(d => (
                    <SelectItem key={d.monthYear} value={d.monthYear}>{fmt(d.monthYear)}</SelectItem>
                  ))}
                  <SelectItem value={currentMonth}>{fmt(currentMonth)} (Current)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (PKR)</Label>
              <Input className="mt-1" type="number" value={collectAmount} onChange={e => setCollectAmount(e.target.value)} />
            </div>
            <div>
              <Label>Payment Mode</Label>
              <Select value={collectMode} onValueChange={setCollectMode}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Cash', 'Bank Transfer', 'Cheque', 'JazzCash', 'EasyPaisa', 'Card'].map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {collectStudent && collectStudent.outstanding > collectStudent.monthlyFee && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">Arrears outstanding</p>
                <p className="text-amber-700 dark:text-amber-300">Total due: PKR {collectStudent.outstanding.toLocaleString()}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectOpen(false)}>Cancel</Button>
            <Button onClick={handleCollect} disabled={collecting}>
              {collecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Collect PKR {collectAmount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment History — {detailStudent?.student.fullName}</DialogTitle>
            <DialogDescription>{detailStudent?.student.admissionNumber} · {detailStudent?.student.class?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-80 overflow-y-auto">
            {detailStudent?.dueSummary.map(d => (
              <div key={d.monthYear} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${d.paid ? 'bg-green-100 text-green-700' : d.overdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    {d.paid ? '✓' : d.overdue ? '!' : '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{fmt(d.monthYear)}</p>
                    <p className="text-xs text-muted-foreground">{d.paid ? 'Paid' : d.overdue ? 'Overdue' : 'Pending'}</p>
                  </div>
                </div>
                <span className={`font-mono text-sm font-semibold ${d.paid ? 'text-green-600' : 'text-red-600'}`}>
                  PKR {d.monthlyFee.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
