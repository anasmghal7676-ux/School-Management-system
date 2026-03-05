'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Plus, Edit, Trash2, RefreshCw, Download, DollarSign,
  Building2, TrendingUp, Copy, ChevronDown, ChevronRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const FREQ_COLORS: Record<string, string> = {
  Monthly: 'bg-blue-100 text-blue-700',
  Quarterly: 'bg-purple-100 text-purple-700',
  Yearly: 'bg-green-100 text-green-700',
  'One-time': 'bg-amber-100 text-amber-700',
  'Per-Exam': 'bg-red-100 text-red-700',
};

const FREQ_MULTIPLIER: Record<string, number> = {
  Monthly: 12, Quarterly: 4, Yearly: 1, 'One-time': 1, 'Per-Exam': 3,
};

const fmt = (n: number) => `PKR ${n.toLocaleString('en-PK')}`;

const emptyForm = {
  academicYearId: '', classId: '', feeTypeId: '', amount: '',
  frequency: 'Monthly', dueDateRule: '10', isMandatory: true, description: '',
};

export default function FeeBuilderPage() {
  const [structures, setStructures] = useState<any[]>([]);
  const [byClass, setByClass] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, totalMonthlyRevenue: 0, totalYearlyRevenue: 0, classCount: 0 });
  const [loading, setLoading] = useState(false);
  const [ayFilter, setAyFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyFrom, setCopyFrom] = useState('');
  const [copyTo, setCopyTo] = useState('');
  const [copying, setCopying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ academicYearId: ayFilter, classId: classFilter });
      const res = await fetch(`/api/fee-builder?${params}`);
      const data = await res.json();
      setStructures(data.structures || []);
      setByClass(data.byClass || []);
      if (data.classes) setClasses(data.classes);
      if (data.feeTypes) setFeeTypes(data.feeTypes);
      if (data.academicYears) {
        setAcademicYears(data.academicYears);
        if (!ayFilter && data.academicYears.length > 0) setAyFilter(data.academicYears[0].id);
      }
      if (data.summary) setSummary(data.summary);
      setExpandedClasses(new Set(data.byClass?.map((b: any) => b.class.id) || []));
    } catch {
      toast({ title: 'Error', description: 'Failed to load fee structures', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [ayFilter, classFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = (classId = '') => {
    setEditing(null);
    setForm({ ...emptyForm, academicYearId: ayFilter, classId });
    setShowDialog(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      academicYearId: s.academicYearId,
      classId: s.classId,
      feeTypeId: s.feeTypeId,
      amount: String(s.amount),
      frequency: s.frequency,
      dueDateRule: s.dueDateRule || '10',
      isMandatory: s.isMandatory,
      description: s.description || '',
    });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.academicYearId || !form.classId || !form.feeTypeId || !form.amount) {
      toast({ title: 'Validation', description: 'Academic year, class, fee type, and amount are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch('/api/fee-builder', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: editing ? 'Updated' : 'Fee structure added' });
      setShowDialog(false);
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteStructure = async (s: any) => {
    if (!confirm(`Remove "${s.feeType.name}" from ${s.class.name}?`)) return;
    await fetch('/api/fee-builder', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id }),
    });
    toast({ title: 'Removed' });
    load();
  };

  const copyStructure = async () => {
    if (!copyFrom || !copyTo) { toast({ title: 'Select source and destination classes', variant: 'destructive' }); return; }
    setCopying(true);
    try {
      const fromStructures = structures.filter(s => s.classId === copyFrom && s.academicYearId === ayFilter);
      for (const s of fromStructures) {
        await fetch('/api/fee-builder', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ academicYearId: ayFilter, classId: copyTo, feeTypeId: s.feeTypeId, amount: s.amount, frequency: s.frequency, dueDateRule: s.dueDateRule, isMandatory: s.isMandatory, description: s.description }),
        });
      }
      toast({ title: 'Copied!', description: `${fromStructures.length} fee structures copied` });
      setShowCopyDialog(false);
      load();
    } catch {
      toast({ title: 'Error copying structure', variant: 'destructive' });
    } finally {
      setCopying(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Class', 'Fee Type', 'Amount', 'Frequency', 'Due Day', 'Mandatory', 'Annual Total'];
    const rows = structures.map(s => [
      s.class.name, s.feeType.name, s.amount, s.frequency, s.dueDateRule || '',
      s.isMandatory ? 'Yes' : 'No', s.amount * (FREQ_MULTIPLIER[s.frequency] || 1),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fee-structure.csv'; a.click();
  };

  const toggleClassExpand = (cid: string) => {
    setExpandedClasses(prev => { const s = new Set(prev); s.has(cid) ? s.delete(cid) : s.add(cid); return s; });
  };

  const classTotal = (structs: any[]) =>
    structs.reduce((sum, s) => sum + s.amount * (FREQ_MULTIPLIER[s.frequency] || 1), 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Fee Structure Builder"
        description="Design and manage fee plans for each class and academic year"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCopyDialog(true)}><Copy className="h-4 w-4 mr-2" />Copy Structure</Button>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button size="sm" onClick={() => openAdd()}><Plus className="h-4 w-4 mr-2" />Add Fee</Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Structures', value: summary.total, color: 'border-l-slate-500', icon: <DollarSign className="h-4 w-4 text-slate-500" /> },
          { label: 'Classes Covered', value: summary.classCount, color: 'border-l-blue-500', icon: <Building2 className="h-4 w-4 text-blue-500" /> },
          { label: 'Monthly Revenue', value: `PKR ${(summary.totalMonthlyRevenue / 1000).toFixed(0)}K`, color: 'border-l-green-500', icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
          { label: 'Annual Revenue', value: `PKR ${(summary.totalYearlyRevenue / 100000).toFixed(1)}L`, color: 'border-l-indigo-500', icon: <TrendingUp className="h-4 w-4 text-indigo-500" /> },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">{c.icon}<span className="text-xl font-bold">{c.value}</span></div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={ayFilter} onValueChange={v => { setAyFilter(v); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select Academic Year" /></SelectTrigger>
              <SelectContent>{academicYears.map(ay => <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Fee Structure by Class */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
      ) : byClass.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No fee structures defined</p>
            <p className="text-sm mt-1">Select an academic year and start adding fee components</p>
            <Button size="sm" className="mt-4" onClick={() => openAdd()}><Plus className="h-4 w-4 mr-2" />Add First Fee</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {byClass.map(({ class: cls, structures: clsStructures }) => {
            const isExpanded = expandedClasses.has(cls.id);
            const annual = classTotal(clsStructures);
            return (
              <Card key={cls.id}>
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors card-hover"
                  onClick={() => toggleClassExpand(cls.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <span className="font-semibold">{cls.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">({clsStructures.length} fee types)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-700">{fmt(annual)}/year</div>
                      <div className="text-xs text-muted-foreground">{fmt(Math.round(annual / 12))}/month</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); openAdd(cls.id); }}>
                      <Plus className="h-3.5 w-3.5 mr-1" />Add Fee
                    </Button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Fee Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Due Day</TableHead>
                          <TableHead className="text-right">Annual</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clsStructures.map((s: any) => (
                          <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="font-medium text-sm">{s.feeType.name}</TableCell>
                            <TableCell className="text-right font-bold">{fmt(s.amount)}</TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${FREQ_COLORS[s.frequency] || ''}`}>{s.frequency}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{s.dueDateRule ? `Day ${s.dueDateRule}` : '—'}</TableCell>
                            <TableCell className="text-right text-sm text-green-700 font-medium">
                              {fmt(s.amount * (FREQ_MULTIPLIER[s.frequency] || 1))}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${s.isMandatory ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600'}`}>
                                {s.isMandatory ? 'Mandatory' : 'Optional'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Edit className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteStructure(s)}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/20 font-semibold">
                          <TableCell colSpan={4} className="text-sm">Class Total</TableCell>
                          <TableCell className="text-right text-sm text-green-700">{fmt(annual)}</TableCell>
                          <TableCell colSpan={2} />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Fee Structure' : 'Add Fee Structure'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editing && (
              <>
                <div className="space-y-1.5">
                  <Label>Academic Year *</Label>
                  <Select value={form.academicYearId} onValueChange={v => setForm({ ...form, academicYearId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>{academicYears.map(ay => <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Class *</Label>
                  <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fee Type *</Label>
                  <Select value={form.feeTypeId} onValueChange={v => setForm({ ...form, feeTypeId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select fee type" /></SelectTrigger>
                    <SelectContent>{feeTypes.map(ft => <SelectItem key={ft.id} value={ft.id}>{ft.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount (PKR) *</Label>
                <Input type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Due Day (of month)</Label>
                <Input type="number" min="1" max="28" placeholder="10" value={form.dueDateRule} onChange={e => setForm({ ...form, dueDateRule: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Monthly', 'Quarterly', 'Yearly', 'One-time', 'Per-Exam'].map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.amount && (
                <p className="text-xs text-muted-foreground">
                  Annual total: {fmt(parseFloat(form.amount || '0') * (FREQ_MULTIPLIER[form.frequency] || 1))}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="mandatory" checked={form.isMandatory} onCheckedChange={v => setForm({ ...form, isMandatory: !!v })} />
              <Label htmlFor="mandatory">Mandatory fee (cannot be waived)</Label>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Update' : 'Add Fee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Structure Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Copy Fee Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Copy all fee structures from one class to another within the same academic year.</p>
            <div className="space-y-1.5">
              <Label>Copy From (Source Class)</Label>
              <Select value={copyFrom} onValueChange={setCopyFrom}>
                <SelectTrigger><SelectValue placeholder="Select source class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Copy To (Target Class)</Label>
              <Select value={copyTo} onValueChange={setCopyTo}>
                <SelectTrigger><SelectValue placeholder="Select target class" /></SelectTrigger>
                <SelectContent>{classes.filter(c => c.id !== copyFrom).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyDialog(false)}>Cancel</Button>
            <Button onClick={copyStructure} disabled={copying}>
              {copying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Copy className="h-4 w-4 mr-2" />Copy Structure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
