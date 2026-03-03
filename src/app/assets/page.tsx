'use client';

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
import {
  Loader2, Plus, Search, RefreshCw, Edit, Trash2, Download,
  Package, CheckCircle2, Wrench, Archive, DollarSign,
  Monitor, BookOpen, Dumbbell, FlaskConical, Truck, Sofa, Printer as PrinterIcon,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CATEGORIES = ['IT Equipment', 'Furniture', 'Lab Equipment', 'Sports Equipment', 'Library', 'Vehicle', 'Office Equipment', 'Kitchen Equipment', 'CCTV/Security', 'Other'];
const STATUSES = ['Active', 'Under Maintenance', 'Disposed', 'Lost/Stolen', 'Reserved'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];
const LOCATIONS = ['Principal Office', 'Admin Block', 'Classroom', 'Computer Lab', 'Science Lab', 'Library', 'Gymnasium', 'Canteen', 'Hostel', 'Rooftop', 'Store', 'Staff Room'];

const CAT_ICONS: Record<string, React.ReactNode> = {
  'IT Equipment': <Monitor className="h-4 w-4 text-blue-500" />,
  'Furniture': <Sofa className="h-4 w-4 text-amber-500" />,
  'Lab Equipment': <FlaskConical className="h-4 w-4 text-green-500" />,
  'Sports Equipment': <Dumbbell className="h-4 w-4 text-orange-500" />,
  'Library': <BookOpen className="h-4 w-4 text-purple-500" />,
  'Vehicle': <Truck className="h-4 w-4 text-slate-500" />,
  'Office Equipment': <PrinterIcon className="h-4 w-4 text-teal-500" />,
};

const STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-green-100 text-green-700',
  'Under Maintenance': 'bg-amber-100 text-amber-700',
  'Disposed': 'bg-slate-100 text-slate-600',
  'Lost/Stolen': 'bg-red-100 text-red-700',
  'Reserved': 'bg-blue-100 text-blue-700',
};

const COND_COLORS: Record<string, string> = {
  'Excellent': 'text-green-700',
  'Good': 'text-blue-700',
  'Fair': 'text-amber-700',
  'Poor': 'text-orange-700',
  'Damaged': 'text-red-700',
};

const fmt = (n: number) => `PKR ${n.toLocaleString('en-PK')}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyForm = {
  name: '', category: '', brand: '', model: '', serialNumber: '',
  location: '', quantity: 1, condition: 'Good', status: 'Active',
  purchaseDate: '', purchasePrice: '', supplier: '', warrantyExpiry: '',
  maintenanceSchedule: '', assignedTo: '', notes: '',
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, maintenance: 0, disposed: 0, totalValue: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, category: catFilter, status: statusFilter, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/assets?${params}`);
      const data = await res.json();
      setAssets(data.assets || []);
      setTotal(data.total || 0);
      if (data.summary) setSummary(data.summary);
    } catch {
      toast({ title: 'Error', description: 'Failed to load assets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, catFilter, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setShowDialog(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ ...a }); setShowDialog(true); };

  const save = async () => {
    if (!form.name || !form.category) {
      toast({ title: 'Validation', description: 'Name and category are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await fetch('/api/assets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: editing.id }) });
        toast({ title: 'Updated' });
      } else {
        await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        toast({ title: 'Asset added' });
      }
      setShowDialog(false);
      load();
    } catch {
      toast({ title: 'Error', description: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteAsset = async (a: any) => {
    if (!confirm(`Delete asset "${a.name}"?`)) return;
    await fetch('/api/assets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id }) });
    toast({ title: 'Deleted' });
    load();
  };

  const exportCsv = () => {
    const headers = ['Asset Code', 'Name', 'Category', 'Brand/Model', 'Location', 'Qty', 'Condition', 'Status', 'Purchase Date', 'Purchase Price', 'Warranty Expiry'];
    const rows = assets.map(a => [a.assetCode, a.name, a.category, `${a.brand || ''} ${a.model || ''}`.trim(), a.location, a.quantity, a.condition, a.status, fmtDate(a.purchaseDate), a.purchasePrice || '', fmtDate(a.warrantyExpiry)]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `assets-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Asset Management"
        description="Track school furniture, equipment, and infrastructure"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Asset</Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Assets', value: summary.total, color: 'border-l-slate-500', icon: <Package className="h-4 w-4 text-slate-500" /> },
          { label: 'Active', value: summary.active, color: 'border-l-green-500', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
          { label: 'In Maintenance', value: summary.maintenance, color: 'border-l-amber-500', icon: <Wrench className="h-4 w-4 text-amber-500" /> },
          { label: 'Disposed', value: summary.disposed, color: 'border-l-slate-400', icon: <Archive className="h-4 w-4 text-slate-400" /> },
          { label: 'Total Value', value: `PKR ${(summary.totalValue / 1000).toFixed(0)}K`, color: 'border-l-indigo-500', icon: <DollarSign className="h-4 w-4 text-indigo-500" /> },
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
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, code, brand, location..." className="pl-8" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={catFilter} onValueChange={v => { setCatFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
          ) : assets.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No assets found</p>
              <Button size="sm" className="mt-4" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add First Asset</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((a: any) => {
                  const isWarrantyExpiring = a.warrantyExpiry && new Date(a.warrantyExpiry) < new Date(Date.now() + 30 * 24 * 3600 * 1000);
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-medium text-sm">{a.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{a.assetCode}</div>
                        {a.brand && <div className="text-xs text-muted-foreground">{a.brand} {a.model}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {CAT_ICONS[a.category] || <Package className="h-4 w-4 text-slate-400" />}
                          <span className="text-sm">{a.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{a.location || '—'}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{a.quantity || 1}</TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${COND_COLORS[a.condition] || ''}`}>{a.condition}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[a.status] || ''}`}>{a.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{fmtDate(a.purchaseDate)}</div>
                        {a.warrantyExpiry && (
                          <div className={`text-xs ${isWarrantyExpiring ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                            Warranty: {fmtDate(a.warrantyExpiry)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {a.purchasePrice ? fmt(Number(a.purchasePrice)) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAsset(a)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Asset Name *</Label>
              <Input placeholder="e.g. HP ProBook Laptop, Science Lab Microscope" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Select value={form.location} onValueChange={v => setForm({ ...form, location: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>{LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Brand</Label>
              <Input placeholder="e.g. HP, Samsung, ACCO" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input placeholder="Model number" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Serial Number</Label>
              <Input placeholder="Serial / asset number" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Purchase Date</Label>
              <Input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Purchase Price (PKR)</Label>
              <Input type="number" placeholder="0" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Input placeholder="Supplier / vendor name" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Warranty Expiry</Label>
              <Input type="date" value={form.warrantyExpiry} onChange={e => setForm({ ...form, warrantyExpiry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Input placeholder="Person or department" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Maintenance Schedule</Label>
              <Input placeholder="e.g. Every 6 months" value={form.maintenanceSchedule} onChange={e => setForm({ ...form, maintenanceSchedule: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? 'Update Asset' : 'Add Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
