'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Loader2, Receipt, Printer, Search, ChevronLeft, ChevronRight,
  Eye, Download, CheckCircle2, XCircle, RefreshCw,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmt = (n: number) => `PKR ${n.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });

function ReceiptView({ payment, school }: { payment: any; school: any }) {
  const items = payment.paymentItems || [];
  const schoolName = school.school_name || 'School Name';

  return (
    <div id={`receipt-${payment.id}`} className="bg-white text-black p-6 font-serif" style={{ width: '5.5in', minHeight: '4in' }}>
      {/* Header */}
      <div className="border-b-4 border-double border-gray-800 pb-3 mb-4">
        <div className="text-center">
          <h1 className="text-xl font-bold uppercase tracking-wide">{schoolName}</h1>
          {school.school_address && <p className="text-xs mt-0.5 text-gray-600">{school.school_address}</p>}
          <div className="text-xs mt-0.5 text-gray-600 flex justify-center gap-4 flex-wrap">
            {school.school_phone && <span>Tel: {school.school_phone}</span>}
            {school.school_email && <span>Email: {school.school_email}</span>}
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="text-sm font-bold uppercase tracking-widest border border-gray-800 px-3 py-0.5">Fee Receipt</span>
        </div>
      </div>

      {/* Receipt Meta */}
      <div className="grid grid-cols-2 gap-x-8 text-xs mb-4">
        <div className="space-y-1">
          <div className="flex"><span className="w-24 font-bold">Receipt No:</span><span className="font-mono">{payment.receiptNumber || payment.id.slice(0, 8).toUpperCase()}</span></div>
          <div className="flex"><span className="w-24 font-bold">Date:</span><span>{fmtDate(payment.paymentDate)}</span></div>
          <div className="flex"><span className="w-24 font-bold">Mode:</span><span className="capitalize">{payment.paymentMode?.replace('_', ' ')}</span></div>
          {payment.transactionId && <div className="flex"><span className="w-24 font-bold">Trans. ID:</span><span className="font-mono">{payment.transactionId}</span></div>}
        </div>
        <div className="space-y-1">
          <div className="flex"><span className="w-24 font-bold">Student:</span><span className="font-semibold">{payment.student?.fullName}</span></div>
          <div className="flex"><span className="w-24 font-bold">Father:</span><span>{payment.student?.fatherName}</span></div>
          <div className="flex"><span className="w-24 font-bold">Class:</span><span>{payment.student?.currentClass?.name} {payment.student?.currentSection?.name || ''}</span></div>
          <div className="flex"><span className="w-24 font-bold">Adm No:</span><span className="font-mono">{payment.student?.admissionNumber}</span></div>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-xs border-collapse mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">#</th>
            <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">Fee Description</th>
            <th className="border border-gray-400 px-2 py-1.5 text-right font-bold">Amount (PKR)</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((item: any, i: number) => (
            <tr key={item.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-2 py-1">{i + 1}</td>
              <td className="border border-gray-300 px-2 py-1">{item.feeType?.name || 'Fee'}</td>
              <td className="border border-gray-300 px-2 py-1 text-right">{item.amount?.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
            </tr>
          )) : (
            <tr>
              <td className="border border-gray-300 px-2 py-1">1</td>
              <td className="border border-gray-300 px-2 py-1">Fee Payment</td>
              <td className="border border-gray-300 px-2 py-1 text-right">{payment.totalAmount?.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          {payment.lateFine > 0 && (
            <tr>
              <td colSpan={2} className="border border-gray-300 px-2 py-1 text-right font-semibold text-red-600">Late Fine:</td>
              <td className="border border-gray-300 px-2 py-1 text-right text-red-600">{payment.lateFine?.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
            </tr>
          )}
          {payment.discountAmount > 0 && (
            <tr>
              <td colSpan={2} className="border border-gray-300 px-2 py-1 text-right font-semibold text-green-700">Discount:</td>
              <td className="border border-gray-300 px-2 py-1 text-right text-green-700">-{payment.discountAmount?.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
            </tr>
          )}
          <tr className="bg-gray-200 font-bold">
            <td colSpan={2} className="border border-gray-500 px-2 py-1.5 text-right">TOTAL RECEIVED:</td>
            <td className="border border-gray-500 px-2 py-1.5 text-right font-mono text-base">{payment.totalAmount?.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>

      {/* Amount in words */}
      <div className="text-xs mb-4 border border-gray-300 p-2 bg-gray-50">
        <span className="font-bold">Amount in Words: </span>
        <span className="italic">PKR {payment.totalAmount?.toLocaleString()} only</span>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end mt-6 pt-4 border-t border-gray-300 text-xs">
        <div>
          <div className="mt-8 border-t border-gray-500 pt-1 w-40 text-center text-gray-600">Parent / Guardian Signature</div>
        </div>
        <div className="text-center">
          <p className={`font-bold text-sm ${payment.status === 'Paid' ? 'text-green-700' : 'text-red-600'}`}>
            {payment.status?.toUpperCase() || 'PAID'}
          </p>
          <p className="text-gray-500 mt-0.5">System Generated Receipt</p>
        </div>
        <div>
          <div className="mt-8 border-t border-gray-500 pt-1 w-40 text-center text-gray-600">Authorized Signature</div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptsPage() {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [preview, setPreview]   = useState<any>(null);

  useEffect(() => { fetchReceipts(); }, [page]);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const r = await fetch(`/api/receipts?${params}`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally { setLoading(false); }
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchReceipts(); };

  const printReceipt = (payment: any) => {
    const el = document.getElementById(`print-receipt-${payment.id}`);
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt ${payment.receiptNumber || ''}</title>
    <style>body{margin:0;padding:20px;font-family:serif;}@media print{body{padding:0;}}</style></head>
    <body>${el.innerHTML}<script>window.onload=function(){window.print();}</script></body></html>`);
    win.document.close();
  };

  const payments   = data?.payments || [];
  const school     = data?.school   || {};
  const totalPages = data?.pagination?.totalPages || 1;
  const total      = data?.pagination?.total      || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Receipt className="h-7 w-7" />Fee Receipts
            </h1>
            <p className="text-muted-foreground">Search, preview and print fee payment receipts</p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by receipt number, student name or admission number..."
                className="flex-1"
              />
              <Button type="submit"><Search className="mr-2 h-4 w-4" />Search</Button>
              <Button type="button" variant="outline" onClick={() => fetchReceipts()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{total.toLocaleString()} Payment Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Receipt className="h-12 w-12 mb-3 opacity-20" />
                <p className="font-medium">No receipts found</p>
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
                      <TableHead>Mode</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p: any) => (
                      <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-mono text-xs">{p.receiptNumber || p.id.slice(0, 8).toUpperCase()}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{p.student?.fullName}</div>
                          <div className="text-xs text-muted-foreground">{p.student?.admissionNumber}</div>
                        </TableCell>
                        <TableCell className="text-sm">{p.student?.currentClass?.name}</TableCell>
                        <TableCell className="text-sm">{fmtDate(p.paymentDate)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{p.paymentMode?.replace('_', ' ') || 'Cash'}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{fmt(p.totalAmount)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${p.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {p.status === 'Paid' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {p.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPreview(p)}>
                              <Eye className="mr-1 h-3 w-3" />View
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => printReceipt(p)}>
                              <Printer className="mr-1 h-3 w-3" />Print
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Hidden print divs */}
                <div className="hidden">
                  {payments.map((p: any) => (
                    <div key={p.id} id={`print-receipt-${p.id}`}>
                      <ReceiptView payment={p} school={school} />
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center px-4 py-3 border-t">
                    <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-3xl p-0 overflow-auto max-h-[90vh]">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="flex items-center justify-between">
                <span>Receipt Preview</span>
                <Button size="sm" onClick={() => printReceipt(preview)} className="mr-8">
                  <Printer className="mr-2 h-4 w-4" />Print
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-gray-100 overflow-auto">
              <div className="shadow-lg">
                {preview && <ReceiptView payment={preview} school={school} />}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
