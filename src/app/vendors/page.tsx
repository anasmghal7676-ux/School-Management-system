'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, Building2, ShoppingBag, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const VENDOR_CATS = ['Stationery', 'IT / Technology', 'Furniture', 'Food & Catering', 'Maintenance', 'Uniforms', 'Books & Printing', 'Sports Equipment', 'Laboratory', 'Electrical', 'Cleaning', 'Other'];
const PO_STATUSES = ['Pending', 'Approved', 'Ordered', 'Received', 'Cancelled'];
const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700', Approved: 'bg-blue-100 text-blue-700',
  Ordered: 'bg-purple-100 text-purple-700', Received: 'bg-green-100 text-green-700', Cancelled: 'bg-slate-100 text-slate-500',
};
const fmt = (n: number) => `PKR ${Math.round(n).toLocaleString()}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function VendorManagementPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [pos, setPOs] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalVendors: 0, totalPOs: 0, pending: 0, totalValue: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorDialog, setVendorDialog] = useState(false);
  const [poDialog, setPODialog] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [editingPO, setEditingPO] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyVendor = () => ({ name: '', category: 'Stationery', contactPerson: '', phone: '', email: '', address: '', taxId: '', bankDetails: '', paymentTerms: '30 days', notes: '' });
  const emptyPO = () => ({ vendorId: '', vendorName: '', description: '', amount: '', quantity: '', unit: '', deliveryDate: '', notes: '' });
  const [vendorForm, setVendorForm] = useState<any>(emptyVendor());
  const [poForm, setPOForm] = useState<any>(emptyPO());

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendors?view=vendors&search=${search}`);
      const data = await res.json();
      setVendors(data.items || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search]);

  const loadPOs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'pos', search, status: statusFilter });
      const res = await fetch(`/api/vendors?${params}`);
      const data = await res.json();
      setPOs(data.items || []); setSummary(data.summary || {});
      setVendors(v => v.length ? v : (data.vendors || []));
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { loadPOs(); }, [loadPOs]);

  const handleVendorSelect = (id: string) => {
    const v = vendors.find(x => x.id === id);
    setPOForm((f: any) => ({ ...f, vendorId: id, vendorName: v?.name || '' }));
  };

  const saveVendor = async () => {
    if (!vendorForm.name) { toast({ title: 'Vendor name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/vendors', { method: editingVendor ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingVendor ? { ...vendorForm, entity: 'vendor', id: editingVendor.id } : { ...vendorForm, entity: 'vendor' }) });
      toast({ title: editingVendor ? 'Vendor updated' : 'Vendor added' }); setVendorDialog(false); loadVendors(); loadPOs();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const savePO = async () => {
    if (!poForm.description || !poForm.amount) { toast({ title: 'Description and amount required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/vendors', { method: editingPO ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingPO ? { ...poForm, id: editingPO.id } : poForm) });
      toast({ title: editingPO ? 'PO updated' : 'Purchase order created' }); setPODialog(false); loadPOs();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const updatePOStatus = async (id: string, status: string) => {
    await fetch('/api/vendors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    toast({ title: `PO → ${status}` }); loadPOs();
  };

  const del = async (id: string, entity: string) => {
    if (!confirm('Delete?')) return;
    await fetch('/api/vendors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity }) });
    toast({ title: 'Deleted' }); entity === 'vendor' ? loadVendors() : loadPOs();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Vendor Management" description="Manage suppliers, vendors, purchase orders and procurement tracking"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingVendor(null); setVendorForm(emptyVendor()); setVendorDialog(true); }}><Building2 className="h-4 w-4 mr-2" />Add Vendor</Button>
          <Button size="sm" onClick={() => { setEditingPO(null); setPOForm(emptyPO()); setPODialog(true); }}><ShoppingBag className="h-4 w-4 mr-2" />New Purchase Order</Button>
        </div>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Vendors', value: summary.totalVendors, color: 'border-l-blue-500' },
          { label: 'Purchase Orders', value: summary.totalPOs, color: 'border-l-slate-500' },
          { label: 'Pending Approval', value: summary.pending, color: 'border-l-amber-500' },
          { label: 'Total PO Value', value: fmt(summary.totalValue), color: 'border-l-green-500', text: true },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4"><p className={`font-bold ${(c as any).text ? 'text-base' : 'text-2xl'}`}>{c.value}</p><p className="text-xs text-muted-foreground mt-1">{c.label}</p></CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pos">
        <TabsList>
          <TabsTrigger value="pos">📋 Purchase Orders</TabsTrigger>
          <TabsTrigger value="vendors" onClick={loadVendors}>🏢 Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4 space-y-4">
          <Card><CardContent className="p-4"><div className="flex gap-3">
            <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search POs..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{PO_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" onClick={loadPOs}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div></CardContent></Card>

          {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            pos.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No purchase orders yet</p><Button size="sm" className="mt-3" onClick={() => { setEditingPO(null); setPOForm(emptyPO()); setPODialog(true); }}><Plus className="h-4 w-4 mr-2" />Create First PO</Button></CardContent></Card> :
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>PO Number</TableHead><TableHead>Vendor</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Delivery</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pos.map(po => (
                    <TableRow key={po.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs font-medium">{po.poNumber}</TableCell>
                      <TableCell><div className="text-sm font-medium">{po.vendorName}</div></TableCell>
                      <TableCell className="max-w-xs"><p className="text-sm truncate">{po.description}</p>{po.quantity && <p className="text-xs text-muted-foreground">{po.quantity} {po.unit}</p>}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(Number(po.amount || 0))}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(po.deliveryDate)}</TableCell>
                      <TableCell><Badge className={`text-xs ${STATUS_COLORS[po.status] || ''}`}>{po.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {po.status === 'Pending' && <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-700" onClick={() => updatePOStatus(po.id, 'Approved')}>Approve</Button>}
                          {po.status === 'Approved' && <Button variant="ghost" size="sm" className="h-7 text-xs text-purple-700" onClick={() => updatePOStatus(po.id, 'Ordered')}>Mark Ordered</Button>}
                          {po.status === 'Ordered' && <Button variant="ghost" size="sm" className="h-7 text-xs text-green-700" onClick={() => updatePOStatus(po.id, 'Received')}><CheckCircle2 className="h-3 w-3 mr-1" />Received</Button>}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingPO(po); setPOForm(po); setPODialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(po.id, 'po')}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          }
        </TabsContent>

        <TabsContent value="vendors" className="mt-4">
          {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            vendors.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No vendors added yet</p><Button size="sm" className="mt-3" onClick={() => { setEditingVendor(null); setVendorForm(emptyVendor()); setVendorDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add First Vendor</Button></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map(v => (
                <Card key={v.id} className="hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary flex-shrink-0" /><span className="font-semibold">{v.name}</span></div>
                        <Badge variant="outline" className="text-xs mt-1">{v.category}</Badge>
                        <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                          {v.contactPerson && <p>👤 {v.contactPerson}</p>}
                          {v.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{v.phone}</p>}
                          {v.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{v.email}</p>}
                          {v.paymentTerms && <p>💳 {v.paymentTerms}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingVendor(v); setVendorForm(v); setVendorDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(v.id, 'vendor')}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>
      </Tabs>

      {/* Vendor Dialog */}
      <Dialog open={vendorDialog} onOpenChange={setVendorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Vendor Name *</Label><Input value={vendorForm.name} onChange={e => setVendorForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Category</Label><Select value={vendorForm.category} onValueChange={v => setVendorForm((f: any) => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VENDOR_CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Payment Terms</Label><Select value={vendorForm.paymentTerms} onValueChange={v => setVendorForm((f: any) => ({ ...f, paymentTerms: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Advance">Advance</SelectItem><SelectItem value="On Delivery">On Delivery</SelectItem><SelectItem value="15 days">15 days</SelectItem><SelectItem value="30 days">30 days</SelectItem><SelectItem value="60 days">60 days</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Contact Person</Label><Input value={vendorForm.contactPerson} onChange={e => setVendorForm((f: any) => ({ ...f, contactPerson: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={vendorForm.phone} onChange={e => setVendorForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Email</Label><Input type="email" value={vendorForm.email} onChange={e => setVendorForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Address</Label><Textarea value={vendorForm.address} onChange={e => setVendorForm((f: any) => ({ ...f, address: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Tax / NTN ID</Label><Input value={vendorForm.taxId} onChange={e => setVendorForm((f: any) => ({ ...f, taxId: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Bank Details</Label><Input value={vendorForm.bankDetails} onChange={e => setVendorForm((f: any) => ({ ...f, bankDetails: e.target.value }))} placeholder="Bank, Account No." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setVendorDialog(false)}>Cancel</Button><Button onClick={saveVendor} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingVendor ? 'Update' : 'Add Vendor'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PO Dialog */}
      <Dialog open={poDialog} onOpenChange={setPODialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingPO ? 'Edit Purchase Order' : 'New Purchase Order'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Vendor</Label><Select value={poForm.vendorId} onValueChange={handleVendorSelect}><SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger><SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Description / Items *</Label><Textarea value={poForm.description} onChange={e => setPOForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} placeholder="What is being purchased?" /></div>
            <div className="space-y-1.5"><Label>Amount (PKR) *</Label><Input type="number" value={poForm.amount} onChange={e => setPOForm((f: any) => ({ ...f, amount: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Quantity</Label><Input value={poForm.quantity} onChange={e => setPOForm((f: any) => ({ ...f, quantity: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Unit</Label><Input value={poForm.unit} onChange={e => setPOForm((f: any) => ({ ...f, unit: e.target.value }))} placeholder="pcs, kg, sets..." /></div>
            <div className="space-y-1.5"><Label>Expected Delivery</Label><Input type="date" value={poForm.deliveryDate} onChange={e => setPOForm((f: any) => ({ ...f, deliveryDate: e.target.value }))} /></div>
            {editingPO && <div className="col-span-2 space-y-1.5"><Label>Status</Label><Select value={poForm.status} onValueChange={v => setPOForm((f: any) => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PO_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>}
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea value={poForm.notes} onChange={e => setPOForm((f: any) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPODialog(false)}>Cancel</Button><Button onClick={savePO} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingPO ? 'Update' : 'Create PO'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Textarea({ value, onChange, rows, placeholder, className }: any) {
  return <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder} className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`} />;
}
