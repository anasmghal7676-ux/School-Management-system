'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Search, Receipt, CreditCard, Loader2, ChevronLeft, ChevronRight, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

interface Student { id: string; fullName: string; admissionNumber: string; fatherName: string; class: { name: string } | null; section: { name: string } | null; }
interface Payment { id: string; receiptNumber: string; paymentDate: string; paidAmount: number; totalAmount: number; discount: number; fine: number; paymentMode: string; status: string; student: Student & { class: any; section: any }; }
interface PaySummary { totalCollected: number; count: number; byMode: { paymentMode: string; _count: number; _sum: { paidAmount: number } }[]; }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'Cheque', 'Online', 'Card'];

export default function FeeCollectionPage() {
  const [tab, setTab] = useState('collect');
  // Collection form
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [discount, setDiscount] = useState('0');
  const [fine, setFine] = useState('0');
  const [payMode, setPayMode] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);
  // History
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaySummary | null>(null);
  const [histSearch, setHistSearch] = useState('');
  const [histSearchInput, setHistSearchInput] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loadingHist, setLoadingHist] = useState(false);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [histTotalPages, setHistTotalPages] = useState(1);

  const currentYear = new Date().getFullYear();
  const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return { value: `${currentYear}-${m}`, label: `${MONTHS[i]} ${currentYear}` };
  });

  // Debounce student search
  useEffect(() => {
    const t = setTimeout(() => setHistSearch(histSearchInput), 400);
    return () => clearTimeout(t);
  }, [histSearchInput]);

  useEffect(() => {
    if (studentSearch.length > 2) searchStudents();
    else setStudentResults([]);
  }, [studentSearch]);

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab, histSearch, fromDate, toDate, histPage]);

  const searchStudents = async () => {
    setSearching(true);
    try {
      const r = await fetch(`/api/students?search=${encodeURIComponent(studentSearch)}&limit=10`);
      const j = await r.json();
      if (j.success) setStudentResults(j.data.students);
    } catch {} finally { setSearching(false); }
  };

  const fetchHistory = useCallback(async () => {
    setLoadingHist(true);
    try {
      const p = new URLSearchParams({ page: String(histPage), limit: '20' });
      if (histSearch) p.append('search', histSearch);
      if (fromDate) p.append('fromDate', fromDate);
      if (toDate) p.append('toDate', toDate);
      const r = await fetch(`/api/fee-payments?${p}`);
      const j = await r.json();
      if (j.success) {
        setPayments(j.data.payments);
        setSummary(j.data.summary);
        setHistTotal(j.data.pagination.total);
        setHistTotalPages(j.data.pagination.totalPages);
      }
    } catch {} finally { setLoadingHist(false); }
  }, [histSearch, fromDate, toDate, histPage]);

  const toggleMonth = (m: string) => {
    setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleCollect = async () => {
    if (!selectedStudent || !selectedMonths.length) {
      toast({ title: 'Validation', description: 'Select a student and at least one month', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/fees-collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          months: selectedMonths,
          discount: parseFloat(discount) || 0,
          fine: parseFloat(fine) || 0,
          paymentMode: payMode,
          remarks,
          receivedBy: 'Cashier',
        }),
      });
      const j = await r.json();
      if (j.success) {
        setReceipt(j.data);
        toast({ title: 'Payment Recorded', description: `Receipt: ${j.data.receiptNumber}` });
        setSelectedStudent(null); setSelectedMonths([]); setDiscount('0'); setFine('0'); setRemarks(''); setStudentSearch('');
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to process payment', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const estimatedTotal = selectedMonths.length * 5000; // placeholder until fee structure loaded
  const net = estimatedTotal - (parseFloat(discount) || 0) + (parseFloat(fine) || 0);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold tracking-tight">Fee Management</h1><p className="text-muted-foreground">Collect and track student fee payments</p></div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList><TabsTrigger value="collect">Collect Fee</TabsTrigger><TabsTrigger value="history">Payment History</TabsTrigger></TabsList>

          {/* Collect Tab */}
          <TabsContent value="collect" className="space-y-4 pt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left: Student Search */}
              <Card>
                <CardHeader><CardTitle className="text-base">Find Student</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search by name, admission no, father name..."
                      value={studentSearch}
                      onChange={e => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
                    />
                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>

                  {studentResults.length > 0 && !selectedStudent && (
                    <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                      {studentResults.map(s => (
                        <button key={s.id} className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors" onClick={() => { setSelectedStudent(s); setStudentResults([]); setStudentSearch(s.fullName); }}>
                          <p className="font-medium">{s.fullName}</p>
                          <p className="text-xs text-muted-foreground">{s.admissionNumber} • {s.class?.name} • Father: {s.fatherName}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedStudent && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{selectedStudent.fullName}</p>
                          <p className="text-sm text-muted-foreground">{selectedStudent.admissionNumber} | Class: {selectedStudent.class?.name || '—'} {selectedStudent.section?.name ? `(${selectedStudent.section.name})` : ''}</p>
                          <p className="text-sm text-muted-foreground">Father: {selectedStudent.fatherName}</p>
                        </div>
                        <button onClick={() => { setSelectedStudent(null); setStudentSearch(''); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right: Payment Form */}
              <Card>
                <CardHeader><CardTitle className="text-base">Payment Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Months</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {MONTH_OPTIONS.slice(0, 6).map(m => (
                        <button
                          key={m.value}
                          onClick={() => toggleMonth(m.value)}
                          className={`text-xs px-2 py-1.5 rounded border font-medium transition-all ${selectedMonths.includes(m.value) ? 'bg-primary text-primary-foreground border-primary' : 'border-muted hover:bg-muted/50'}`}
                        >
                          {m.label.split(' ')[0].slice(0, 3)} {currentYear}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Discount (PKR)</Label>
                      <Input className="mt-1" type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} />
                    </div>
                    <div>
                      <Label>Fine (PKR)</Label>
                      <Input className="mt-1" type="number" min="0" value={fine} onChange={e => setFine(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label>Payment Mode</Label>
                    <Select value={payMode} onValueChange={setPayMode}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Remarks</Label>
                    <Input className="mt-1" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional notes..." />
                  </div>

                  {selectedMonths.length > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm space-y-1">
                      <div className="flex justify-between"><span>Months:</span><span>{selectedMonths.length}</span></div>
                      <div className="flex justify-between"><span>Discount:</span><span className="text-red-600">-PKR {(parseFloat(discount)||0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span>Fine:</span><span className="text-amber-600">+PKR {(parseFloat(fine)||0).toLocaleString()}</span></div>
                      <div className="flex justify-between font-bold text-base border-t pt-1"><span>Net Payable:</span><span className="text-green-700">PKR {net.toLocaleString()}</span></div>
                    </div>
                  )}

                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleCollect} disabled={submitting || !selectedStudent || !selectedMonths.length}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Collect Payment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 pt-4">
            {summary && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Collected</p>
                    <p className="text-2xl font-bold">PKR {(summary.totalCollected||0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{summary.count} payments</p>
                  </CardContent>
                </Card>
                {summary.byMode.slice(0, 2).map(m => (
                  <Card key={m.paymentMode} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">{m.paymentMode}</p>
                      <p className="text-2xl font-bold">PKR {(m._sum.paidAmount||0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{m._count} transactions</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search receipt, student..." value={histSearchInput} onChange={e => setHistSearchInput(e.target.value)} className="pl-9" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="date" className="w-36" value={fromDate} onChange={e => setFromDate(e.target.value)} placeholder="From date" />
                    <span className="text-muted-foreground">–</span>
                    <Input type="date" className="w-36" value={toDate} onChange={e => setToDate(e.target.value)} placeholder="To date" />
                  </div>
                  {(fromDate || toDate || histSearch) && (
                    <Button variant="ghost" size="sm" onClick={() => { setHistSearchInput(''); setFromDate(''); setToDate(''); setHistPage(1); }}>
                      <X className="h-4 w-4 mr-1" />Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {loadingHist ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Receipt className="h-10 w-10 mb-3" />
                    <p>No payment records found</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt No</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-sm font-medium">{p.receiptNumber}</TableCell>
                            <TableCell>
                              <p className="font-medium">{p.student?.fullName}</p>
                              <p className="text-xs text-muted-foreground">{p.student?.admissionNumber}</p>
                            </TableCell>
                            <TableCell>{p.student?.class?.name}</TableCell>
                            <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">PKR {p.paidAmount.toLocaleString()}</TableCell>
                            <TableCell>{p.paymentMode}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {p.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <p className="text-sm text-muted-foreground">Showing {((histPage-1)*20)+1}–{Math.min(histPage*20,histTotal)} of {histTotal}</p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={histPage===1} onClick={() => setHistPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm">{histPage}/{histTotalPages}</span>
                        <Button variant="outline" size="sm" disabled={histPage===histTotalPages} onClick={() => setHistPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Receipt Dialog */}
      {receipt && (
        <Dialog open onOpenChange={() => setReceipt(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-600" />Payment Successful</DialogTitle>
              <DialogDescription>Receipt No: {receipt.receiptNumber || receipt.payment?.receiptNumber}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-700">PKR {(receipt.paidAmount || receipt.payment?.paidAmount || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">Payment recorded successfully</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Mode:</div><div className="font-medium">{receipt.paymentMode || receipt.payment?.paymentMode}</div>
                <div className="text-muted-foreground">Date:</div><div className="font-medium">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReceipt(null)}>Close</Button>
              <Button onClick={() => setReceipt(null)}>Print Receipt</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
