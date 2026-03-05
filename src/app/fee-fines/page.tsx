'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Plus, AlertTriangle, CheckCircle2, Trash2,
  RefreshCw, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight,
  DollarSign, Search,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmtDate  = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const EMPTY = { studentId: '', monthYear: '', fineAmount: '', reason: 'Late payment fine' };

// Generate last 12 months options
const MONTHS: string[] = [];
for (let i = 0; i < 12; i++) {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  MONTHS.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
}

const FINE_REASONS = [
  'Late payment fine', 'Overdue library book', 'Transport late payment',
  'Hostel fee delay', 'Lost ID card', 'Other',
];

export default function FeeFinePage() {
  const [fines, setFines]       = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [stats, setStats]       = useState<any>(null);
  const [waivedFilter, setWaivedFilter] = useState('all');
  const [monthFilter, setMonthFilter]   = useState('all');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);

  const [addOpen, setAddOpen]   = useState(false);
  const [waiverOpen, setWaiverOpen] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm]         = useState<any>({ ...EMPTY });
  const [waiverBy, setWaiverBy] = useState('');
  const [saving, setSaving]     = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { fetchFines(); }, [waivedFilter, monthFilter, page]);

  const fetchStudents = async () => {
    const r = await fetch('/api/students?limit=500&status=active');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || j.data || []);
  };

  const fetchFines = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '25' });
      if (waivedFilter !== 'all')  p.append('waived',    waivedFilter === 'waived' ? 'true' : 'false');
      if (monthFilter  !== 'all')  p.append('monthYear', monthFilter);
      const r = await fetch(`/api/fee-fines?${p}`);
      const j = await r.json();
      if (j.success) {
        setFines(j.data.fines);
        setStats(j.data.stats);
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [waivedFilter, monthFilter, page]);

  const handleAdd = async () => {
    if (!form.studentId || !form.monthYear || !form.fineAmount || !form.reason) {
      toast({ title: 'All fields required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/fee-fines', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Fine issued' });
        setAddOpen(false); setForm({ ...EMPTY }); setSelectedStudent(null); setStudentSearch(''); fetchFines();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleWaive = async () => {
    if (!waiverOpen) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/fee-fines/${waiverOpen.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waived: !waiverOpen.waived, waivedBy: waiverBy || null, waivedAt: new Date().toISOString() }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: waiverOpen.waived ? 'Waiver reversed' : 'Fine waived' });
        setWaiverOpen(null); setWaiverBy(''); fetchFines();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/fee-fines/${deleteId}`, { method: 'DELETE' });
    toast({ title: 'Deleted' }); setDeleteId(null); fetchFines();
  };

  const uf = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) || s.admissionNumber.includes(studentSearch)
  ).slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-7 w-7" />Fee Fines
            </h1>
            <p className="text-muted-foreground">Late payment penalties and fine management with waiver approvals</p>
          </div>
          <Button onClick={() => { setForm({ ...EMPTY }); setSelectedStudent(null); setStudentSearch(''); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Issue Fine
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-3 pb-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Pending Fines</p>
                <p className="text-2xl font-bold text-red-600">PKR {(stats?.pendingAmount || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stats?.pendingCount || 0} outstanding</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-3 pb-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Issued</p>
                <p className="text-2xl font-bold text-green-600">PKR {(stats?.totalAmount || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stats?.totalCount || 0} all time</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-500" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-3 pb-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Waived Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  PKR {Math.max(0, (stats?.totalAmount || 0) - (stats?.pendingAmount || 0)).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{Math.max(0, (stats?.totalCount || 0) - (stats?.pendingCount || 0))} waived</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-blue-500" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <Select value={waivedFilter} onValueChange={v => { setWaivedFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={v => { setMonthFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Months" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchFines} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : fines.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mb-4 opacity-30" />
                <p className="font-medium">No fines found</p>
                <Button className="mt-4" onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Issue First Fine</Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fines.map((f: any) => (
                      <TableRow key={f.id} className={f.waived ? 'opacity-60' : ''}>
                        <TableCell>
                          <p className="font-medium text-sm">{f.student?.fullName || f.studentId}</p>
                          <p className="text-xs text-muted-foreground">{f.student?.admissionNumber} · {f.student?.class?.name}</p>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{f.monthYear}</TableCell>
                        <TableCell className={`font-bold ${f.waived ? 'line-through text-muted-foreground' : 'text-red-600'}`}>
                          PKR {f.fineAmount?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-40 truncate">{f.reason}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(f.createdAt)}</TableCell>
                        <TableCell>
                          {f.waived ? (
                            <div>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Waived</span>
                              {f.waivedBy && <p className="text-xs text-muted-foreground mt-0.5">by {f.waivedBy}</p>}
                            </div>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="sm" className="h-7 text-xs"
                              onClick={() => { setWaiverOpen(f); setWaiverBy(''); }}
                            >
                              {f.waived ? <ToggleLeft className="mr-1 h-3 w-3" /> : <ToggleRight className="mr-1 h-3 w-3" />}
                              {f.waived ? 'Reverse' : 'Waive'}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteId(f.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">Page {page}/{totalPages} · {total} total</p>
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
      </main>

      {/* Issue Fine Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Fee Fine</DialogTitle>
            <DialogDescription>Add a penalty fine to a student's account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Student *</Label>
              <Input className="mt-1" placeholder="Search student..." value={studentSearch}
                onChange={e => { setStudentSearch(e.target.value); if (!e.target.value) { setSelectedStudent(null); uf('studentId', ''); } }} />
              {studentSearch && !selectedStudent && filteredStudents.length > 0 && (
                <div className="border rounded-md mt-1 max-h-36 overflow-y-auto bg-background shadow-md">
                  {filteredStudents.map(s => (
                    <button key={s.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setSelectedStudent(s); setStudentSearch(`${s.fullName} (${s.admissionNumber})`); uf('studentId', s.id); }}>
                      <span className="font-medium">{s.fullName}</span>
                      <span className="text-muted-foreground ml-2">{s.admissionNumber} · {s.class?.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Month *</Label>
                <Select value={form.monthYear} onValueChange={v => uf('monthYear', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select month..." /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fine Amount (PKR) *</Label>
                <Input className="mt-1" type="number" value={form.fineAmount} onChange={e => uf('fineAmount', e.target.value)} placeholder="e.g. 500" />
              </div>
            </div>
            <div>
              <Label>Reason *</Label>
              <Select value={form.reason} onValueChange={v => uf('reason', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{FINE_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Issue Fine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waiver Dialog */}
      <Dialog open={!!waiverOpen} onOpenChange={() => { setWaiverOpen(null); setWaiverBy(''); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{waiverOpen?.waived ? 'Reverse Waiver?' : 'Waive Fine?'}</DialogTitle>
            <DialogDescription>
              PKR {waiverOpen?.fineAmount?.toLocaleString()} fine for {waiverOpen?.student?.fullName}
              {waiverOpen?.waived ? ' — this will reinstate the fine.' : ' — this will mark the fine as waived.'}
            </DialogDescription>
          </DialogHeader>
          {!waiverOpen?.waived && (
            <div className="py-2">
              <Label>Waived By</Label>
              <Input className="mt-1" value={waiverBy} onChange={e => setWaiverBy(e.target.value)} placeholder="Principal / Admin name" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaiverOpen(null)}>Cancel</Button>
            <Button onClick={handleWaive} disabled={saving} className={waiverOpen?.waived ? '' : 'bg-green-600 hover:bg-green-700'}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {waiverOpen?.waived ? 'Reverse Waiver' : 'Confirm Waiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Fine?</DialogTitle><DialogDescription>This record will be permanently removed.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
