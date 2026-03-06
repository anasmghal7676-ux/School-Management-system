'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, Plus, Trash2, Edit, Loader2, AlertCircle, Settings,
  Tag, Copy, ChevronDown, ChevronRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

interface FeeType   { id: string; name: string; code: string; description?: string | null; }
interface FeeStruct {
  id: string; amount: number; frequency: string; isMandatory: boolean; description?: string | null;
  feeTypeId: string; classId: string; academicYearId: string | null;
  feeType: FeeType;
  class: { name: string; code: string } | null;
}
interface ClassGroup { classId: string; className: string; totalMonthly: number; structures: FeeStruct[]; }
interface AcYear    { id: string; name: string; isCurrent: boolean; }
interface ClassItem { id: string; name: string; code: string; }

const FREQUENCIES = ['Monthly', 'Quarterly', 'Yearly', 'One-time', 'Per-Exam'];

export default function FeeStructurePage() {
  const [tab, setTab]           = useState('structure');
  const [loading, setLoading]   = useState(false);
  const [byClass, setByClass]   = useState<ClassGroup[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [classes, setClasses]   = useState<ClassItem[]>([]);
  const [acYears, setAcYears]   = useState<AcYear[]>([]);

  const [selYear, setSelYear]   = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Fee Structure Dialog
  const [structOpen, setStructOpen] = useState(false);
  const [editStruct, setEditStruct] = useState<FeeStruct | null>(null);
  const [structSaving, setStructSaving] = useState(false);
  const [structForm, setStructForm] = useState({
    classId: '', feeTypeId: '', academicYearId: '',
    amount: '', frequency: 'Monthly', isMandatory: 'true', description: '',
  });

  // Fee Type Dialog
  const [ftOpen, setFtOpen]     = useState(false);
  const [ftSaving, setFtSaving] = useState(false);
  const [ftForm, setFtForm]     = useState({ name: '', code: '', description: '' });

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAcYears();
    fetchFeeTypes();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selYear) fetchStructures();
  }, [selYear]);

  const fetchAcYears = async () => {
    const r = await fetch('/api/acad-years');
    const j = await r.json();
    if (j.success) {
      setAcYears(j.data);
      const cur = j.data.find((y: AcYear) => y.isCurrent);
      if (cur) setSelYear(cur.id);
    }
  };

  const fetchFeeTypes = async () => {
    const r = await fetch('/api/fee-types');
    const j = await r.json();
    if (j.success) setFeeTypes(j.data);
  };

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=100');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchStructures = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (selYear) p.append('academicYearId', selYear);
      const r = await fetch(`/api/fee-structure?${p}`);
      const j = await r.json();
      if (j.success) setByClass(j.data.byClass || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load fee structures', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [selYear]);

  const openAdd = (classId = '') => {
    setEditStruct(null);
    setStructForm({ classId, feeTypeId: '', academicYearId: selYear, amount: '', frequency: 'Monthly', isMandatory: 'true', description: '' });
    setStructOpen(true);
  };

  const openEdit = (s: FeeStruct) => {
    setEditStruct(s);
    setStructForm({
      classId: s.classId, feeTypeId: s.feeTypeId, academicYearId: s.academicYearId || selYear,
      amount: String(s.amount), frequency: s.frequency,
      isMandatory: String(s.isMandatory), description: s.description || '',
    });
    setStructOpen(true);
  };

  const handleStructSave = async () => {
    if (!structForm.classId || !structForm.feeTypeId || !structForm.amount) {
      toast({ title: 'Validation', description: 'Class, fee type and amount are required', variant: 'destructive' });
      return;
    }
    setStructSaving(true);
    try {
      const url = editStruct ? `/api/fee-structure/${editStruct.id}` : '/api/fee-structure';
      const r = await fetch(url, {
        method: editStruct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...structForm,
          amount: parseFloat(structForm.amount),
          isMandatory: structForm.isMandatory === 'true',
        }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Saved', description: editStruct ? 'Fee structure updated' : 'Fee structure added' });
        setStructOpen(false);
        fetchStructures();
      } else {
        toast({ title: 'Error', description: j.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Save failed', variant: 'destructive' });
    } finally { setStructSaving(false); }
  };

  const handleFtSave = async () => {
    if (!ftForm.name || !ftForm.code) {
      toast({ title: 'Validation', description: 'Name and code required', variant: 'destructive' });
      return;
    }
    setFtSaving(true);
    try {
      const r = await fetch('/api/fee-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ftForm),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Created', description: 'Fee type added' });
        setFtOpen(false);
        setFtForm({ name: '', code: '', description: '' });
        fetchFeeTypes();
      } else {
        toast({ title: 'Error', description: j.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create fee type', variant: 'destructive' });
    } finally { setFtSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/fee-structure/${deleteId}`, { method: 'DELETE' });
      const j = await r.json();
      if (j.success) { toast({ title: 'Deleted' }); setDeleteId(null); fetchStructures(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch {
      toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
    } finally { setDeleting(false); }
  };

  const toggleExpand = (classId: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(classId) ? next.delete(classId) : next.add(classId);
      return next;
    });
  };

  const totalAnnual = byClass.reduce((sum, g) => sum + g.totalMonthly * 12, 0);

  const sf = (k: string, v: string) => setStructForm(f => ({ ...f, [k]: v }));

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fee Structure</h1>
            <p className="text-muted-foreground">Configure class-based fees, categories and amounts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFtOpen(true)}>
              <Tag className="mr-2 h-4 w-4" />Add Fee Type
            </Button>
            <Button onClick={() => openAdd()}>
              <Plus className="mr-2 h-4 w-4" />Add Fee Structure
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="structure">Fee Structure</TabsTrigger>
            <TabsTrigger value="types">Fee Types ({feeTypes.length})</TabsTrigger>
          </TabsList>

          {/* ── Fee Structure Tab ── */}
          <TabsContent value="structure" className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
              <div>
                <Label>Academic Year</Label>
                <Select value={selYear} onValueChange={setSelYear}>
                  <SelectTrigger className="mt-1 w-52">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {acYears.map(y => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name} {y.isCurrent && '(Current)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {byClass.length > 0 && (
                <div className="mt-6 text-sm text-muted-foreground">
                  <span className="font-medium">{byClass.length} classes</span> •{' '}
                  Estimated Annual Revenue:{' '}
                  <span className="font-bold text-foreground">PKR {totalAnnual.toLocaleString()}</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !selYear ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Settings className="h-12 w-12 mb-4" />
                <p>Select an academic year to view fee structures</p>
              </div>
            ) : byClass.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-3" />
                <p className="font-medium">No fee structures configured</p>
                <Button className="mt-4" onClick={() => openAdd()}>
                  <Plus className="mr-2 h-4 w-4" />Add First Fee Structure
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {byClass.map(group => (
                  <Card key={group.classId}>
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpand(group.classId)}
                    >
                      <div className="flex items-center gap-3">
                        {expanded.has(group.classId)
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <p className="font-semibold">Class {group.className}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.structures.length} fee types • Monthly: PKR {group.totalMonthly.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Annual: PKR {(group.totalMonthly * 12).toLocaleString()}
                        </span>
                        <Button
                          variant="outline" size="sm"
                          onClick={e => { e.stopPropagation(); openAdd(group.classId); }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />Add
                        </Button>
                      </div>
                    </div>

                    {expanded.has(group.classId) && (
                      <div className="border-t">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fee Type</TableHead>
                              <TableHead>Frequency</TableHead>
                              <TableHead className="text-right">Amount (PKR)</TableHead>
                              <TableHead>Mandatory</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.structures.map(s => (
                              <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.feeType.name}</TableCell>
                                <TableCell>
                                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full px-2 py-0.5 font-medium">
                                    {s.frequency}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-mono font-semibold">
                                  {s.amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <span className={s.isMandatory ? 'text-red-500 text-xs font-medium' : 'text-muted-foreground text-xs'}>
                                    {s.isMandatory ? 'Required' : 'Optional'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {s.description || '—'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost" size="icon"
                                      className="h-7 w-7 text-red-500 hover:text-red-700"
                                      onClick={() => setDeleteId(s.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Fee Types Tab ── */}
          <TabsContent value="types" className="pt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Fee Categories</CardTitle>
                  <CardDescription>Types of fees charged to students</CardDescription>
                </div>
                <Button size="sm" onClick={() => setFtOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />New Category
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {feeTypes.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <Tag className="h-10 w-10 mb-3" />
                    <p>No fee types yet</p>
                    <Button className="mt-3" onClick={() => setFtOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />Add Fee Type
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeTypes.map(ft => (
                        <TableRow key={ft.id}>
                          <TableCell className="font-medium">{ft.name}</TableCell>
                          <TableCell className="font-mono text-sm">{ft.code}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{ft.description || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Add/Edit Structure Dialog ── */}
      <Dialog open={structOpen} onOpenChange={setStructOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editStruct ? 'Edit Fee Structure' : 'Add Fee Structure'}</DialogTitle>
            <DialogDescription>Configure fee amount for a class and fee type</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Class *</Label>
              <Select value={structForm.classId} onValueChange={v => sf('classId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fee Type *</Label>
              <Select value={structForm.feeTypeId} onValueChange={v => sf('feeTypeId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {feeTypes.map(ft => <SelectItem key={ft.id} value={ft.id}>{ft.name} ({ft.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (PKR) *</Label>
                <Input className="mt-1" type="number" min="0" value={structForm.amount} onChange={e => sf('amount', e.target.value)} placeholder="e.g. 5000" />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={structForm.frequency} onValueChange={v => sf('frequency', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Mandatory</Label>
              <Select value={structForm.isMandatory} onValueChange={v => sf('isMandatory', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Required (Mandatory)</SelectItem>
                  <SelectItem value="false">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input className="mt-1" value={structForm.description} onChange={e => sf('description', e.target.value)} placeholder="Notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStructOpen(false)}>Cancel</Button>
            <Button onClick={handleStructSave} disabled={structSaving}>
              {structSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editStruct ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Fee Type Dialog ── */}
      <Dialog open={ftOpen} onOpenChange={setFtOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Fee Type</DialogTitle>
            <DialogDescription>Add a new fee category (e.g. Tuition, Transport, Library)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name *</Label>
              <Input className="mt-1" value={ftForm.name} onChange={e => setFtForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Tuition Fee" />
            </div>
            <div>
              <Label>Code *</Label>
              <Input
                className="mt-1" value={ftForm.code}
                onChange={e => setFtForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. TUITION"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input className="mt-1" value={ftForm.description} onChange={e => setFtForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFtOpen(false)}>Cancel</Button>
            <Button onClick={handleFtSave} disabled={ftSaving}>
              {ftSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Fee Structure</DialogTitle>
            <DialogDescription>This will remove this fee entry from the class. Existing payments won't be affected.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
