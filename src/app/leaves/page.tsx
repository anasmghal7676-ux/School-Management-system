'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Plus, CalendarOff, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, RefreshCw, User, Eye,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const LEAVE_TYPES = ['Casual', 'Sick', 'Annual', 'Maternity', 'Paternity', 'Emergency', 'Study', 'Unpaid'];
const STATUS_COLORS: Record<string, string> = {
  Pending:  'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled:'bg-gray-100 text-gray-700',
};

const EMPTY_FORM = {
  applicantId: '', leaveType: 'Casual', fromDate: '', toDate: '',
  reason: '', emergencyContact: '',
};

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [balances, setBalances] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [remarks, setRemarks] = useState('');

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => { fetchLeaves(); }, [statusFilter, typeFilter, staffFilter, page]);
  useEffect(() => {
    if (staffFilter !== 'all') fetchBalance(staffFilter);
    else setBalances(null);
  }, [staffFilter]);

  const fetchStaff = async () => {
    const r = await fetch('/api/staff?limit=200');
    const j = await r.json();
    if (j.success) setStaff(j.data?.staff || j.data || []);
  };

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '25' });
      if (statusFilter !== 'all') p.append('status',    statusFilter);
      if (typeFilter   !== 'all') p.append('leaveType', typeFilter);
      if (staffFilter  !== 'all') p.append('staffId',   staffFilter);
      const r = await fetch(`/api/leaves?${p}`);
      const j = await r.json();
      if (j.success) {
        setLeaves(j.data?.leaves || j.data || []);
        setTotalPages(j.data?.pagination?.totalPages || 1);
        setTotal(j.data?.pagination?.total || 0);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [statusFilter, typeFilter, staffFilter, page]);

  const fetchBalance = async (sId: string) => {
    try {
      const r = await fetch(`/api/leaves/balance?staffId=${sId}`);
      const j = await r.json();
      if (j.success) setBalances(j.data);
    } catch {}
  };

  const handleAdd = async () => {
    if (!form.applicantId || !form.fromDate || !form.toDate || !form.reason) {
      toast({ title: 'Required', description: 'Staff, dates and reason are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, applicantType: 'Staff' }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Leave application submitted' });
        setAddOpen(false);
        setForm(EMPTY_FORM);
        fetchLeaves();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleUpdateStatus = async (status: 'Approved' | 'Rejected') => {
    if (!selected) return;
    setUpdating(true);
    try {
      const r = await fetch(`/api/leaves/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: `Leave ${status}` });
        setViewOpen(false);
        setSelected(null);
        setRemarks('');
        fetchLeaves();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setUpdating(false); }
  };

  const uf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const diffDays = (from: string, to: string) => Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1;

  const counts = {
    pending:  leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    rejected: leaves.filter(l => l.status === 'Rejected').length,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <CalendarOff className="h-7 w-7" />Leave Management
            </h1>
            <p className="text-muted-foreground">Staff leave applications and approval workflow</p>
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Apply Leave
          </Button>
        </div>

        {/* Status overview */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Pending',  count: counts.pending,  color: 'border-l-amber-500', textColor: 'text-amber-600',  icon: Clock },
            { label: 'Approved', count: counts.approved, color: 'border-l-green-500', textColor: 'text-green-600',  icon: CheckCircle2 },
            { label: 'Rejected', count: counts.rejected, color: 'border-l-red-500',   textColor: 'text-red-600',    icon: XCircle },
          ].map(({ label, count, color, textColor, icon: Icon }) => (
            <Card key={label} className={`border-l-4 ${color} cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => { setStatusFilter(statusFilter === label ? 'all' : label); setPage(1); }}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
                </div>
                <Icon className={`h-5 w-5 ${textColor}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leave Balance for selected staff */}
        {balances && (
          <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Leave Balance — {staff.find(s => s.id === staffFilter)?.firstName} {staff.find(s => s.id === staffFilter)?.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {Object.entries(balances).map(([type, balance]: [string, any]) => (
                  <div key={type} className="text-center bg-white dark:bg-gray-900 rounded-lg p-2">
                    <p className="text-lg font-bold">{balance.remaining ?? balance}</p>
                    <p className="text-xs text-muted-foreground">{type}</p>
                    {balance.total && <p className="text-xs text-muted-foreground">of {balance.total}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {['Pending','Approved','Rejected','Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={staffFilter} onValueChange={v => { setStaffFilter(v); setPage(1); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Staff" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchLeaves} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : leaves.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <CalendarOff className="h-12 w-12 mb-4" />
                <p className="font-medium">No leave applications found</p>
                <Button className="mt-4" onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />Apply First Leave
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map((leave: any) => {
                      const days = diffDays(leave.fromDate, leave.toDate);
                      return (
                        <TableRow key={leave.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="font-medium text-sm">
                              {leave.staff?.firstName || leave.applicantId} {leave.staff?.lastName || ''}
                            </div>
                            <div className="text-xs text-muted-foreground">{leave.staff?.designation || leave.staff?.employeeCode || ''}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{leave.leaveType}</Badge>
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{fmtDate(leave.fromDate)}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{fmtDate(leave.toDate)}</TableCell>
                          <TableCell className="text-center font-bold">{days}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate text-muted-foreground">{leave.reason}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[leave.status] || 'bg-gray-100 text-gray-700'}`}>
                              {leave.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(leave.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => { setSelected(leave); setRemarks(''); setViewOpen(true); }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} total</p>
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

      {/* Apply Leave Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Submit a new leave application for a staff member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Staff Member *</Label>
              <Select value={form.applicantId} onValueChange={v => uf('applicantId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} — {s.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Leave Type *</Label>
              <Select value={form.leaveType} onValueChange={v => uf('leaveType', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t} Leave</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>From Date *</Label><Input className="mt-1" type="date" value={form.fromDate} onChange={e => uf('fromDate', e.target.value)} /></div>
              <div><Label>To Date *</Label><Input className="mt-1" type="date" value={form.toDate} onChange={e => uf('toDate', e.target.value)} /></div>
            </div>
            {form.fromDate && form.toDate && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2">
                Duration: <strong>{diffDays(form.fromDate, form.toDate)} day(s)</strong>
              </p>
            )}
            <div>
              <Label>Reason *</Label>
              <textarea
                className="mt-1 w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                value={form.reason}
                onChange={e => uf('reason', e.target.value)}
                placeholder="Reason for leave..."
              />
            </div>
            <div>
              <Label>Emergency Contact</Label>
              <Input className="mt-1" value={form.emergencyContact} onChange={e => uf('emergencyContact', e.target.value)} placeholder="Phone number during leave" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / Approve Dialog */}
      <Dialog open={viewOpen} onOpenChange={() => { setViewOpen(false); setSelected(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave Application</DialogTitle>
            <DialogDescription>
              {selected?.staff?.firstName} {selected?.staff?.lastName} · {selected?.leaveType} Leave
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">From:</span> <strong>{fmtDate(selected.fromDate)}</strong></div>
                <div><span className="text-muted-foreground">To:</span> <strong>{fmtDate(selected.toDate)}</strong></div>
                <div><span className="text-muted-foreground">Days:</span> <strong>{diffDays(selected.fromDate, selected.toDate)}</strong></div>
                <div><span className="text-muted-foreground">Status:</span>
                  <span className={`ml-1 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">Reason:</p>
                <p>{selected.reason}</p>
              </div>
              {selected.remarks && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">Remarks:</p>
                  <p>{selected.remarks}</p>
                </div>
              )}
              {selected.status === 'Pending' && (
                <>
                  <div>
                    <Label>Remarks (optional)</Label>
                    <Input
                      className="mt-1"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Add remarks before approving/rejecting..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateStatus('Approved')}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleUpdateStatus('Rejected')}
                      disabled={updating}
                    >
                      {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                      Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewOpen(false); setSelected(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
