'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Building2, Edit, Trash2, RefreshCw, Search, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const EMPTY = { name: '', code: '', headOfDepartmentId: '', description: '' };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [staff, setStaff]             = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [addOpen, setAddOpen]         = useState(false);
  const [editItem, setEditItem]       = useState<any>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [form, setForm]               = useState<any>({ ...EMPTY });
  const [saving, setSaving]           = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [deptRes, staffRes] = await Promise.all([
        fetch('/api/departments').then(r => r.json()),
        fetch('/api/staff?limit=200').then(r => r.json()),
      ]);
      if (deptRes.success) setDepartments(deptRes.data?.departments || []);
      if (staffRes.success) setStaff(staffRes.data?.staff || staffRes.data || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const filtered = departments.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name || !form.code) { toast({ title: 'Name and code required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = { ...form, headOfDepartmentId: form.headOfDepartmentId || null };
      const url    = editItem ? `/api/departments/${editItem.id}` : '/api/departments';
      const method = editItem ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j.success) {
        toast({ title: editItem ? 'Department updated' : 'Department created' });
        setAddOpen(false); setEditItem(null); setForm({ ...EMPTY }); fetchAll();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const r = await fetch(`/api/departments/${deleteId}`, { method: 'DELETE' });
      const j = await r.json();
      if (j.success) { toast({ title: 'Deleted' }); fetchAll(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setDeleteId(null); }
  };

  const openEdit = (d: any) => {
    setForm({ name: d.name, code: d.code, headOfDepartmentId: d.headOfDepartmentId || '', description: d.description || '' });
    setEditItem(d); setAddOpen(true);
  };

  const uf = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Building2 className="h-7 w-7" />Departments</h1>
            <p className="text-muted-foreground">Manage staff departments and heads of department</p>
          </div>
          <Button onClick={() => { setForm({ ...EMPTY }); setEditItem(null); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Department
          </Button>
        </div>

        {/* Summary */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-3 pb-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Departments</p>
                <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
              </div>
              <Building2 className="h-5 w-5 text-blue-500" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-3 pb-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">With HOD Assigned</p>
                <p className="text-2xl font-bold text-green-600">{departments.filter(d => d.headOfDepartmentId).length}</p>
              </div>
              <Users className="h-5 w-5 text-green-500" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-3 pb-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Staff Assigned</p>
                <p className="text-2xl font-bold text-amber-600">{departments.reduce((s, d) => s + (d.staffCount || 0), 0)}</p>
              </div>
              <Users className="h-5 w-5 text-amber-500" />
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" size="icon" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Building2 className="h-12 w-12 mb-4 opacity-30" />
                <p className="font-medium">No departments found</p>
                <Button className="mt-4" onClick={() => { setForm({ ...EMPTY }); setEditItem(null); setAddOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />Add First Department
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Head of Department</TableHead>
                    <TableHead>Staff Count</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d: any) => (
                    <TableRow key={d.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell><span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{d.code}</span></TableCell>
                      <TableCell>
                        {d.headOfDepartment ? (
                          <div>
                            <p className="text-sm font-medium">{d.headOfDepartment.firstName} {d.headOfDepartment.lastName}</p>
                            <p className="text-xs text-muted-foreground">{d.headOfDepartment.designation}</p>
                          </div>
                        ) : <span className="text-muted-foreground text-sm">Not assigned</span>}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />{d.staffCount || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-48 truncate">{d.description || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteId(d.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Department' : 'Add Department'}</DialogTitle>
            <DialogDescription>Configure department details and assign a head</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Department Name *</Label><Input className="mt-1" value={form.name} onChange={e => uf('name', e.target.value)} placeholder="e.g. Science" /></div>
              <div><Label>Code *</Label><Input className="mt-1" value={form.code} onChange={e => uf('code', e.target.value.toUpperCase())} placeholder="e.g. SCI" /></div>
            </div>
            <div>
              <Label>Head of Department</Label>
              <Select value={form.headOfDepartmentId || 'none'} onValueChange={v => uf('headOfDepartmentId', v === 'none' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select HOD..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Not assigned —</SelectItem>
                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.designation}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input className="mt-1" value={form.description} onChange={e => uf('description', e.target.value)} placeholder="Brief description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Department?</DialogTitle><DialogDescription>Staff in this department will become unassigned.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
