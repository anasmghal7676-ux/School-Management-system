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
import {
  Loader2, Plus, Users, Edit, Trash2, RefreshCw,
  Search, ChevronLeft, ChevronRight, Phone, Mail,
  Star, DollarSign,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const RELATIONS = ['Father', 'Mother', 'Guardian', 'Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Other'];

const RELATION_COLORS: Record<string, string> = {
  Father:      'bg-blue-100 text-blue-700',
  Mother:      'bg-pink-100 text-pink-700',
  Guardian:    'bg-purple-100 text-purple-700',
  Grandfather: 'bg-amber-100 text-amber-700',
  Grandmother: 'bg-orange-100 text-orange-700',
  Other:       'bg-gray-100 text-gray-600',
};

const EMPTY = {
  studentId: '', relation: 'Father', firstName: '', lastName: '',
  phone: '', alternatePhone: '', email: '', occupation: '',
  annualIncome: '', cnicNumber: '', officeAddress: '',
  isPrimaryContact: false, isFeeResponsible: false,
};

export default function ParentsPage() {
  const [parents, setParents]   = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [relationFilter, setRelationFilter] = useState('all');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);
  const [counts, setCounts]     = useState<Record<string, number>>({});

  const [addOpen, setAddOpen]   = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm]         = useState<any>({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { fetchParents(); }, [search, relationFilter, page]);

  const fetchStudents = async () => {
    const r = await fetch('/api/students?limit=500&status=active');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || j.data || []);
  };

  const fetchParents = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '25' });
      if (search) p.append('search', search);
      const r = await fetch(`/api/parents?${p}`);
      const j = await r.json();
      if (j.success) {
        let list = j.data.parents;
        if (relationFilter !== 'all') list = list.filter((p: any) => p.relation === relationFilter);
        setParents(list);
        setCounts(j.data.relationCounts || {});
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, relationFilter, page]);

  const handleSave = async () => {
    if (!form.studentId || !form.relation || !form.firstName || !form.lastName || !form.phone) {
      toast({ title: 'Student, relation, name and phone are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const url    = editItem ? `/api/parents/${editItem.id}` : '/api/parents';
      const method = editItem ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const j = await r.json();
      if (j.success) {
        toast({ title: editItem ? 'Updated' : 'Parent record added' });
        setAddOpen(false); setEditItem(null); setForm({ ...EMPTY }); setSelectedStudent(null); setStudentSearch(''); fetchParents();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/parents/${deleteId}`, { method: 'DELETE' });
    toast({ title: 'Deleted' }); setDeleteId(null); fetchParents();
  };

  const openEdit = (p: any) => {
    setForm({
      studentId: p.studentId, relation: p.relation,
      firstName: p.firstName, lastName: p.lastName,
      phone: p.phone, alternatePhone: p.alternatePhone || '',
      email: p.email || '', occupation: p.occupation || '',
      annualIncome: p.annualIncome ? String(p.annualIncome) : '',
      cnicNumber: p.cnicNumber || '', officeAddress: p.officeAddress || '',
      isPrimaryContact: p.isPrimaryContact, isFeeResponsible: p.isFeeResponsible,
    });
    setStudentSearch(p.student ? `${p.student.fullName} (${p.student.admissionNumber})` : '');
    setSelectedStudent(p.student);
    setEditItem(p); setAddOpen(true);
  };

  const uf = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
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
              <Users className="h-7 w-7" />Parents & Guardians
            </h1>
            <p className="text-muted-foreground">Manage parent and guardian contact information linked to students</p>
          </div>
          <Button onClick={() => { setForm({ ...EMPTY }); setEditItem(null); setSelectedStudent(null); setStudentSearch(''); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Parent
          </Button>
        </div>

        {/* Relation filter pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setRelationFilter('all'); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${relationFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted/50'}`}
          >
            All ({Object.values(counts).reduce((a: number, b) => a + (b as number), 0)})
          </button>
          {['Father', 'Mother', 'Guardian'].map(rel => (
            <button
              key={rel}
              onClick={() => { setRelationFilter(rel === relationFilter ? 'all' : rel); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${relationFilter === rel ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted/50'}`}
            >
              {rel} ({counts[rel] || 0})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, phone, CNIC..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Button variant="outline" size="icon" onClick={fetchParents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : parents.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-30" />
                <p className="font-medium">No parent records found</p>
                <Button className="mt-4" onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add First Parent</Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent / Guardian</TableHead>
                      <TableHead>Relation</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Occupation</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parents.map((p: any) => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted/30 card-hover" onClick={() => setViewItem(p)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                              {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{p.firstName} {p.lastName}</p>
                              {p.cnicNumber && <p className="text-xs text-muted-foreground">{p.cnicNumber}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RELATION_COLORS[p.relation] || 'bg-gray-100 text-gray-600'}`}>
                            {p.relation}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{p.student?.fullName}</p>
                          <p className="text-xs text-muted-foreground">{p.student?.admissionNumber} · {p.student?.class?.name}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3 text-muted-foreground" />{p.phone}
                          </div>
                          {p.email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Mail className="h-3 w-3" />{p.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.occupation || '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {p.isPrimaryContact && (
                              <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                <Star className="h-3 w-3" />Primary
                              </span>
                            )}
                            {p.isFeeResponsible && (
                              <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                <DollarSign className="h-3 w-3" />Fee
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteId(p.id)}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) { setEditItem(null); setSelectedStudent(null); setStudentSearch(''); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Parent Record' : 'Add Parent / Guardian'}</DialogTitle>
            <DialogDescription>Link a parent or guardian to a student with full contact details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Student */}
            <div>
              <Label>Student *</Label>
              <Input className="mt-1" placeholder="Search student name or admission number..."
                value={studentSearch}
                onChange={e => { setStudentSearch(e.target.value); if (!e.target.value) { setSelectedStudent(null); uf('studentId', ''); } }}
                disabled={!!editItem}
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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Relation *</Label>
                <Select value={form.relation} onValueChange={v => uf('relation', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{RELATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>First Name *</Label>
                <Input className="mt-1" value={form.firstName} onChange={e => uf('firstName', e.target.value)} placeholder="Ahmed" />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input className="mt-1" value={form.lastName} onChange={e => uf('lastName', e.target.value)} placeholder="Khan" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone *</Label>
                <Input className="mt-1" value={form.phone} onChange={e => uf('phone', e.target.value)} placeholder="0300-1234567" />
              </div>
              <div>
                <Label>Alternate Phone</Label>
                <Input className="mt-1" value={form.alternatePhone} onChange={e => uf('alternatePhone', e.target.value)} placeholder="0311-7654321" />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1" type="email" value={form.email} onChange={e => uf('email', e.target.value)} placeholder="ahmed@email.com" />
              </div>
              <div>
                <Label>CNIC Number</Label>
                <Input className="mt-1" value={form.cnicNumber} onChange={e => uf('cnicNumber', e.target.value)} placeholder="35202-1234567-1" />
              </div>
              <div>
                <Label>Occupation</Label>
                <Input className="mt-1" value={form.occupation} onChange={e => uf('occupation', e.target.value)} placeholder="Engineer, Teacher..." />
              </div>
              <div>
                <Label>Annual Income (PKR)</Label>
                <Input className="mt-1" type="number" value={form.annualIncome} onChange={e => uf('annualIncome', e.target.value)} placeholder="e.g. 600000" />
              </div>
            </div>

            <div>
              <Label>Office / Work Address</Label>
              <Input className="mt-1" value={form.officeAddress} onChange={e => uf('officeAddress', e.target.value)} placeholder="Work address..." />
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer card-hover">
                <input type="checkbox" checked={form.isPrimaryContact} onChange={e => uf('isPrimaryContact', e.target.checked)} className="rounded" />
                <Star className="h-3.5 w-3.5 text-amber-500" />Primary Contact
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer card-hover">
                <input type="checkbox" checked={form.isFeeResponsible} onChange={e => uf('isFeeResponsible', e.target.checked)} className="rounded" />
                <DollarSign className="h-3.5 w-3.5 text-green-500" />Fee Responsible
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editItem ? 'Update' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewItem && (
        <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {viewItem.firstName[0]}{viewItem.lastName[0]}
                </div>
                {viewItem.firstName} {viewItem.lastName}
              </DialogTitle>
              <DialogDescription>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RELATION_COLORS[viewItem.relation] || 'bg-gray-100 text-gray-600'}`}>
                  {viewItem.relation}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Student', `${viewItem.student?.fullName} (${viewItem.student?.admissionNumber})`],
                  ['Class', viewItem.student?.class?.name || '—'],
                  ['Phone', viewItem.phone],
                  ['Alt. Phone', viewItem.alternatePhone || '—'],
                  ['Email', viewItem.email || '—'],
                  ['CNIC', viewItem.cnicNumber || '—'],
                  ['Occupation', viewItem.occupation || '—'],
                  ['Annual Income', viewItem.annualIncome ? `PKR ${viewItem.annualIncome.toLocaleString()}` : '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="font-medium">{v}</p>
                  </div>
                ))}
              </div>
              {viewItem.officeAddress && (
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground">Office Address</p>
                  <p>{viewItem.officeAddress}</p>
                </div>
              )}
              <div className="flex gap-3">
                {viewItem.isPrimaryContact && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    <Star className="h-3 w-3" />Primary Contact
                  </span>
                )}
                {viewItem.isFeeResponsible && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <DollarSign className="h-3 w-3" />Fee Responsible
                  </span>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
              <Button onClick={() => { setViewItem(null); openEdit(viewItem); }}>
                <Edit className="mr-2 h-4 w-4" />Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Parent Record?</DialogTitle><DialogDescription>This contact will be removed from the system.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
