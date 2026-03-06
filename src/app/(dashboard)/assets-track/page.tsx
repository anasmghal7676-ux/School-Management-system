'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
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
import { Monitor, Plus, Search, Edit, Trash2, RefreshCw, AlertTriangle, CheckCircle2, Wrench, QrCode } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['Furniture','Electronics','Lab Equipment','Sports Equipment','Library Books','Musical Instruments','Kitchen Equipment','Office Equipment','Classroom Supplies','Other'];
const CONDITIONS = ['Excellent','Good','Fair','Poor','Under Repair','Disposed'];

export default function AssetTrackingPage() {
  const [assets, setAssets]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState('');
  const [catFilter, setCat]   = useState('');
  const [condFilter, setCond] = useState('');
  const [dialog, setDialog]   = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const EMPTY = {
    assetName: '', assetCode: '', category: '', location: '', quantity: '1',
    condition: 'Good', purchaseDate: '', purchasePrice: '', supplier: '',
    warrantyExpiry: '', lastMaintenance: '', nextMaintenance: '',
    assignedTo: '', description: '', serialNumber: '',
  };
  const [form, setForm] = useState<any>(EMPTY);
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assets?limit=300');
      const data = await res.json();
      if (data.success) setAssets(data.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.assetName) { toast({ title: 'Asset name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/assets/${editing.id}` : '/api/assets';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `✅ Asset ${editing ? 'updated' : 'added'}` });
      setDialog(false); setEditing(null); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    toast({ title: '✅ Deleted' }); load();
  };

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const ms = !search || a.assetName?.toLowerCase().includes(q) || a.assetCode?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q);
    const mc = !catFilter || a.category === catFilter;
    const mcond = !condFilter || a.condition === condFilter;
    return ms && mc && mcond;
  });

  const totalValue = assets.reduce((s, a) => s + (parseFloat(a.purchasePrice || 0) * parseInt(a.quantity || 1)), 0);
  const needsMaintenance = assets.filter(a => a.nextMaintenance && new Date(a.nextMaintenance) <= new Date()).length;
  const poorCondition = assets.filter(a => ['Poor','Under Repair'].includes(a.condition)).length;

  const COND_COLOR: Record<string, string> = {
    Excellent: 'bg-emerald-100 text-emerald-700', Good: 'bg-green-100 text-green-700',
    Fair: 'bg-yellow-100 text-yellow-700', Poor: 'bg-orange-100 text-orange-700',
    'Under Repair': 'bg-red-100 text-red-700', Disposed: 'bg-gray-100 text-gray-600',
  };

  const byCat = CATEGORIES.map(cat => ({
    cat, count: assets.filter(a => a.category === cat).length,
    value: assets.filter(a => a.category === cat).reduce((s, a) => s + (parseFloat(a.purchasePrice || 0) * parseInt(a.quantity || 1)), 0),
  })).filter(x => x.count > 0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Asset Tracking"
        description="School asset inventory, maintenance schedules & condition monitoring"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm" onClick={() => { setEditing(null); setForm(EMPTY); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Asset</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Assets', value: assets.length, color: 'border-l-blue-500' },
          { label: 'Total Value', value: `PKR ${Math.round(totalValue/1000)}K`, color: 'border-l-green-500', text: true },
          { label: 'Needs Maintenance', value: needsMaintenance, color: 'border-l-amber-500' },
          { label: 'Poor Condition', value: poorCondition, color: 'border-l-red-500' },
        ].map(({ label, value, color, text }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4"><p className={`${text ? 'text-lg' : 'text-2xl'} font-bold`}>{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Asset List</TabsTrigger>
          <TabsTrigger value="summary">By Category</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Due ({needsMaintenance})</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-52"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Select value={catFilter} onValueChange={v => setCat(v === 'all' ? '' : v)}><SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            <Select value={condFilter} onValueChange={v => setCond(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="Condition" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
          </div>
          <Card><CardContent className="p-0">
            {loading ? <div className="divide-y">{[...Array(6)].map((_,i) => <div key={i} className="h-14 m-2 rounded animate-pulse bg-muted/30" />)}</div>
            : filtered.length === 0 ? <div className="py-16 text-center text-muted-foreground"><Monitor className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No assets found</p><Button size="sm" className="mt-3" onClick={() => { setEditing(null); setForm(EMPTY); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add First Asset</Button></div>
            : <Table>
                <TableHeader><TableRow className="bg-muted/40"><TableHead>Asset</TableHead><TableHead>Category</TableHead><TableHead>Location</TableHead><TableHead>Qty</TableHead><TableHead>Value</TableHead><TableHead>Condition</TableHead><TableHead>Next Service</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(a => (
                    <TableRow key={a.id} className="hover:bg-muted/20 transition-colors group">
                      <TableCell><div><p className="font-medium text-sm">{a.assetName}</p><p className="text-xs text-muted-foreground">{a.assetCode} {a.serialNumber && `· SN: ${a.serialNumber}`}</p></div></TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{a.category}</Badge></TableCell>
                      <TableCell className="text-sm">{a.location || '—'}</TableCell>
                      <TableCell className="text-sm font-medium">{a.quantity || 1}</TableCell>
                      <TableCell className="text-sm">{a.purchasePrice ? `PKR ${(parseFloat(a.purchasePrice) * parseInt(a.quantity || 1)).toLocaleString()}` : '—'}</TableCell>
                      <TableCell><Badge className={`text-xs ${COND_COLOR[a.condition] || ''}`}>{a.condition}</Badge></TableCell>
                      <TableCell className="text-sm">{a.nextMaintenance ? <span className={new Date(a.nextMaintenance) <= new Date() ? 'text-red-600 font-medium' : ''}>{new Date(a.nextMaintenance).toLocaleDateString('en-PK')}</span> : '—'}</TableCell>
                      <TableCell className="text-right"><div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(a); setForm({ ...EMPTY, ...a }); setDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {byCat.map(({ cat, count, value }) => (
              <Card key={cat} className="card-hover"><CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm">{cat}</h3>
                  <Badge variant="secondary" className="text-xs">{count} items</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Total Value: PKR {value.toLocaleString()}</p>
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <div className="grid gap-3">
            {assets.filter(a => a.nextMaintenance && new Date(a.nextMaintenance) <= new Date()).map(a => (
              <Card key={a.id} className="border-l-4 border-l-amber-400"><CardContent className="p-4 flex items-center justify-between">
                <div><p className="font-semibold">{a.assetName} <span className="text-sm font-normal text-muted-foreground">({a.assetCode})</span></p>
                  <p className="text-sm text-red-600">Maintenance due: {new Date(a.nextMaintenance).toLocaleDateString('en-PK')}</p>
                  <p className="text-xs text-muted-foreground">{a.location}</p></div>
                <Button size="sm" onClick={() => { setEditing(a); setForm({ ...EMPTY, ...a }); setDialog(true); }}><Wrench className="h-3.5 w-3.5 mr-1" />Schedule</Button>
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialog} onOpenChange={open => { setDialog(open); if (!open) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Asset</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Asset Name *</Label><Input value={form.assetName} onChange={e => f('assetName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Asset Code</Label><Input value={form.assetCode} onChange={e => f('assetCode', e.target.value)} placeholder="e.g. AST-001" /></div>
            <div className="space-y-1.5"><Label>Serial Number</Label><Input value={form.serialNumber} onChange={e => f('serialNumber', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onValueChange={v => f('category', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Condition</Label><Select value={form.condition} onValueChange={v => f('condition', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={e => f('location', e.target.value)} placeholder="Room/Block" /></div>
            <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" min="1" value={form.quantity} onChange={e => f('quantity', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Purchase Date</Label><Input type="date" value={form.purchaseDate} onChange={e => f('purchaseDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Purchase Price (PKR)</Label><Input type="number" value={form.purchasePrice} onChange={e => f('purchasePrice', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Supplier</Label><Input value={form.supplier} onChange={e => f('supplier', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Warranty Expiry</Label><Input type="date" value={form.warrantyExpiry} onChange={e => f('warrantyExpiry', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Last Maintenance</Label><Input type="date" value={form.lastMaintenance} onChange={e => f('lastMaintenance', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Next Maintenance</Label><Input type="date" value={form.nextMaintenance} onChange={e => f('nextMaintenance', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Assigned To</Label><Input value={form.assignedTo} onChange={e => f('assignedTo', e.target.value)} placeholder="Department or person" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description/Notes</Label><Textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}{editing ? 'Update' : 'Add Asset'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
