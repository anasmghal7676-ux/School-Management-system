'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Search, RefreshCw, ChevronLeft, Download, BookOpen,
  TrendingUp, TrendingDown, Minus, Printer,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmt = (n: number) => `PKR ${n.toLocaleString('en-PK')}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function StudentLedgerPage() {
  // List view state
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Ledger view state
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [ledgerSummary, setLedgerSummary] = useState({ totalCharged: 0, totalPaid: 0, outstanding: 0 });
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const limit = 25;

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, classId: classFilter, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/stu-ledger?${params}`);
      const data = await res.json();
      setStudents(data.students || []);
      setTotal(data.total || 0);
      if (data.classes) setClasses(data.classes);
    } catch {
      toast({ title: 'Error', description: 'Failed to load students', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, classFilter, page]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const openLedger = async (student: any) => {
    setSelectedStudent(student);
    setLedgerLoading(true);
    try {
      const res = await fetch(`/api/stu-ledger?studentId=${student.id}`);
      const data = await res.json();
      setLedger(data.ledger || []);
      setLedgerSummary(data.summary || { totalCharged: 0, totalPaid: 0, outstanding: 0 });
      if (data.student) setSelectedStudent(data.student);
    } catch {
      toast({ title: 'Error', description: 'Failed to load ledger', variant: 'destructive' });
    } finally {
      setLedgerLoading(false);
    }
  };

  const exportLedger = () => {
    if (!ledger.length) return;
    const headers = ['Date', 'Description', 'Reference', 'Debit (PKR)', 'Credit (PKR)', 'Balance (PKR)'];
    const rows = ledger.map(e => [fmtDate(e.date), e.description, e.reference || '', e.debit || 0, e.credit || 0, e.balance]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `ledger-${selectedStudent?.admissionNumber}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const printLedger = () => window.print();

  const totalPages = Math.ceil(total / limit);

  // LEDGER VIEW
  if (selectedStudent && !ledgerLoading) {
    const isDebt = ledgerSummary.outstanding > 0;
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>
            <ChevronLeft className="h-4 w-4 mr-1" />Back to List
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{selectedStudent.fullName}</h1>
            <p className="text-sm text-muted-foreground">{selectedStudent.admissionNumber} · {selectedStudent.class} {selectedStudent.section} · Father: {selectedStudent.fatherName}</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportLedger}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          <Button variant="outline" size="sm" onClick={printLedger}><Printer className="h-4 w-4 mr-2" />Print</Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Charged</p>
              <p className="text-2xl font-bold text-blue-700">{fmt(ledgerSummary.totalCharged)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-green-700">{fmt(ledgerSummary.totalPaid)}</p>
            </CardContent>
          </Card>
          <Card className={`border-l-4 ${isDebt ? 'border-l-red-500' : 'border-l-green-500'}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Outstanding Balance</p>
              <p className={`text-2xl font-bold ${isDebt ? 'text-red-700' : 'text-green-700'}`}>{fmt(Math.abs(ledgerSummary.outstanding))}</p>
              <p className="text-xs mt-0.5 text-muted-foreground">{isDebt ? '(Amount Due)' : ledgerSummary.outstanding < 0 ? '(Advance/Overpaid)' : '(Cleared)'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Ledger Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Statement</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ledger.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No transactions found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-32">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right w-36">Debit (Charges)</TableHead>
                    <TableHead className="text-right w-36">Credit (Payments)</TableHead>
                    <TableHead className="text-right w-36">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((entry, idx) => (
                    <TableRow key={idx} className={entry.type === 'payment' ? 'bg-green-50/30' : ''}>
                      <TableCell className="text-sm">{fmtDate(entry.date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.type === 'charge'
                            ? <TrendingDown className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                            : <TrendingUp className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
                          <span className="text-sm">{entry.description}</span>
                        </div>
                        {entry.mode && <span className="text-xs text-muted-foreground ml-5">{entry.mode}</span>}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{entry.reference || '—'}</TableCell>
                      <TableCell className="text-right">
                        {entry.debit > 0
                          ? <span className="text-red-700 font-medium">{fmt(entry.debit)}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit > 0
                          ? <span className="text-green-700 font-medium">{fmt(entry.credit)}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${entry.balance > 0 ? 'text-red-700' : entry.balance < 0 ? 'text-blue-700' : 'text-green-700'}`}>
                          {fmt(Math.abs(entry.balance))}
                          {entry.balance !== 0 && <span className="text-xs font-normal ml-1">{entry.balance > 0 ? 'Dr' : 'Cr'}</span>}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Final balance row */}
                  <TableRow className="bg-muted/50 font-semibold border-t-2">
                    <TableCell colSpan={3} className="text-sm">Closing Balance</TableCell>
                    <TableCell className="text-right text-sm">{fmt(ledgerSummary.totalCharged)}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(ledgerSummary.totalPaid)}</TableCell>
                    <TableCell className="text-right">
                      <span className={ledgerSummary.outstanding > 0 ? 'text-red-700' : 'text-green-700'}>
                        {fmt(Math.abs(ledgerSummary.outstanding))}
                        {ledgerSummary.outstanding !== 0 && <span className="text-xs font-normal ml-1">{ledgerSummary.outstanding > 0 ? 'Due' : 'Adv'}</span>}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedStudent && ledgerLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading ledger...</span>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Student Ledger"
        description="View detailed fee account statements per student"
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, admission no, father name..."
                className="pl-8"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={classFilter} onValueChange={v => { setClassFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadStudents}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No students found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Total Charged</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30 card-hover" onClick={() => openLedger(s)}>
                    <TableCell>
                      <div className="font-medium text-sm">{s.fullName}</div>
                      <div className="text-xs text-muted-foreground">{s.admissionNumber}</div>
                      {s.fatherName && <div className="text-xs text-muted-foreground">{s.fatherName}</div>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{s.class} {s.section}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">{fmt(s.totalCharged)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium text-green-700">{fmt(s.totalPaid)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-bold ${s.outstanding > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {fmt(Math.abs(s.outstanding))}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.outstanding <= 0
                        ? <Badge className="bg-green-100 text-green-700 border-green-200"><Minus className="h-3 w-3 mr-1" />Cleared</Badge>
                        : s.outstanding >= 50000
                        ? <Badge className="bg-red-100 text-red-700 border-red-200"><TrendingDown className="h-3 w-3 mr-1" />Critical</Badge>
                        : s.outstanding >= 10000
                        ? <Badge className="bg-amber-100 text-amber-700 border-amber-200">Overdue</Badge>
                        : <Badge className="bg-orange-100 text-orange-700 border-orange-200">Pending</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openLedger(s); }}>
                        View Ledger
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
    </div>
  );
}
