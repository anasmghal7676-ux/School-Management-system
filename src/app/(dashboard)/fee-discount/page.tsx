'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Percent, Trash2, RefreshCw, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const DISCOUNT_TYPES = ['Sibling', 'Merit', 'Financial', 'Staff-child', 'Special', 'Scholarship', 'Sports'];

const TYPE_COLORS: Record<string, string> = {
  Sibling:     'bg-blue-100 text-blue-700',
  Merit:       'bg-green-100 text-green-700',
  Financial:   'bg-amber-100 text-amber-700',
  'Staff-child':'bg-purple-100 text-purple-700',
  Special:     'bg-pink-100 text-pink-700',
  Scholarship: 'bg-teal-100 text-teal-700',
  Sports:      'bg-orange-100 text-orange-700',
};

const EMPTY = { studentId: '', discountType: 'Merit', percentage: '', fixedAmount: '', validFrom: new Date().toISOString().slice(0,10), validTo: '', approvedBy: '', reason: '' };

export default function FeeDiscountsPage() {
  const [discounts, setDiscounts]   = useState<any[]>([]);
  const [students, setStudents]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [typeCounts, setTypeCounts] = useState<any>({});

  const [addOpen, setAddOpen]       = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [form, setForm]             = useState<any>({ ...EMPTY });
  const [saving, setSaving]         = useState(false);

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { fetchDiscounts(); }, [typeFilter, activeFilter, page]);

  const fetchStudents = async () => {
    const r = await fetch('/api/students?limit=500&status=active');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || j.data || []);
  };

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '25' });
      if (typeFilter   !== 'all')  p.append('type',   typeFilter);
      if (activeFilter === 'active') p.append('active', 'true');
      const r = await fetch(`/api/fee-discount?${p}`);
      const j = await r.json();
      if (j.success) {
        setDiscounts(j.data.discounts);
        setTypeCounts(j.data.typeCounts || {});
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [typeFilter, activeFilter, page]);

  const handleSave = async () => {
    if (!form.studentId || !form.discountType) { toast({ title: 'Student and type required', variant: 'destructive' }); return; }
    if (!form.percentage && !form.fixedAmount) { toast({ title: 'Enter percentage or fixed amount', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/fee-discount', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Discount added' });
        setAddOpen(false); setForm({ ...EMPTY }); setSelectedStudent(null); setStudentSearch(''); fetchDiscounts();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleToggle = async (d: any) => {
    const r = await fetch(`/api/fee-discount/${d.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !d.isActive }),
    });
    const j = await r.json();
    if (j.success) { toast({ title: d.isActive ? 'Discount deactivated' : 'Discount activated' }); fetchDiscounts(); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/fee-discount/${deleteId}`, { method: 'DELETE' });
    toast({ title: 'Deleted' }); setDeleteId(null); fetchDiscounts();
  };

  const uf = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) || s.admissionNumber.includes(studentSearch)
  ).slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Percent className="h-7 w-7" />Fee Discounts</h1>
            <p className="text-muted-foreground">Manage student fee concessions and scholarship discounts</p>
          </div>
          <Button onClick={() => { setForm({ ...EMPTY }); setSelectedStudent(null); setStudentSearch(''); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Discount
          </Button>
        </div>

        {/* Type summary */}
        <div className="flex gap-3 flex-wrap">
          {DISCOUNT_TYPES.slice(0, 5).map(type => (
            <div
              key={type}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${typeFilter === type ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
            >
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${TYPE_COLORS[type]}`}>{type}</span>
              <span className="text-sm font-bold">{typeCounts[type] || 0}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DISCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={v => { setActiveFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchDiscounts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : discounts.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Percent className="h-12 w-12 mb-4 opacity-30" />
                <p className="font-medium">No discounts found</p>
                <Button className="mt-4" onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add First Discount</Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Valid From</TableHead>
                      <TableHead>Valid To</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.map((d: any) => (
                      <TableRow key={d.id} className={!d.isActive ? 'opacity-60' : ''}>
                        <TableCell>
                          <div className="font-medium text-sm">{d.student?.fullName || d.studentId}</div>
                          <div className="text-xs text-muted-foreground">{d.student?.admissionNumber} · {d.student?.class?.name}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[d.discountType] || 'bg-gray-100 text-gray-700'}`}>
                            {d.discountType}
                          </span>
                        </TableCell>
                        <TableCell>
                          {d.percentage > 0 ? (
                            <span className="font-bold text-green-600">{d.percentage}%</span>
                          ) : (
                            <span className="font-bold text-blue-600">PKR {d.fixedAmount?.toLocaleString()}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(d.validFrom)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {d.validTo ? fmtDate(d.validTo) : <span className="text-green-600 text-xs">Ongoing</span>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.approvedBy || '—'}</TableCell>
                        <TableCell>
                          <button onClick={() => handleToggle(d)} className="flex items-center gap-1">
                            {d.isActive
                              ? <><ToggleRight className="h-5 w-5 text-green-500" /><span className="text-xs text-green-600">Active</span></>
                              : <><ToggleLeft className="h-5 w-5 text-gray-400" /><span className="text-xs text-gray-500">Inactive</span></>
                            }
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteId(d.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} total</p>
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

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Fee Discount</DialogTitle>
            <DialogDescription>Assign a fee concession to a student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Student *</Label>
              <Input
                className="mt-1"
                placeholder="Search student..."
                value={studentSearch}
                onChange={e => { setStudentSearch(e.target.value); if (!e.target.value) { setSelectedStudent(null); uf('studentId', ''); } }}
              />
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
                <Label>Discount Type *</Label>
                <Select value={form.discountType} onValueChange={v => uf('discountType', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{DISCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Percentage (%)</Label>
                <Input className="mt-1" type="number" min="0" max="100" value={form.percentage} onChange={e => uf('percentage', e.target.value)} placeholder="e.g. 25" />
              </div>
            </div>
            <div>
              <Label>Fixed Amount (PKR) <span className="text-muted-foreground text-xs">— alternative to %</span></Label>
              <Input className="mt-1" type="number" value={form.fixedAmount} onChange={e => uf('fixedAmount', e.target.value)} placeholder="e.g. 5000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valid From *</Label><Input className="mt-1" type="date" value={form.validFrom} onChange={e => uf('validFrom', e.target.value)} /></div>
              <div><Label>Valid To <span className="text-xs text-muted-foreground">(blank = ongoing)</span></Label><Input className="mt-1" type="date" value={form.validTo} onChange={e => uf('validTo', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Approved By</Label><Input className="mt-1" value={form.approvedBy} onChange={e => uf('approvedBy', e.target.value)} placeholder="Principal / HOD" /></div>
              <div><Label>Reason</Label><Input className="mt-1" value={form.reason} onChange={e => uf('reason', e.target.value)} placeholder="Merit award, sibling, etc." /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Discount?</DialogTitle><DialogDescription>This will permanently remove the discount record.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
