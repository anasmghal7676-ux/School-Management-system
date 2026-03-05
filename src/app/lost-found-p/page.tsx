'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, RefreshCw, Trash2, CheckCircle2, Package, HelpCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CATEGORIES = ['Electronics', 'Books & Stationery', 'Clothing', 'Bag / Backpack', 'Water Bottle', 'ID Card', 'Keys', 'Spectacles', 'Sports Equipment', 'Money', 'Jewellery', 'Other'];
const LOCATIONS = ['Classroom', 'Playground', 'Library', 'Cafeteria', 'Washroom', 'Sports Ground', 'Parking Area', 'Main Gate', 'Admin Office', 'Other'];
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function LostFoundPortalPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, lost: 0, found: 0, resolved: 0, open: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Open');
  const [dialog, setDialog] = useState(false);
  const [resolveDialog, setResolveDialog] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [claimedBy, setClaimedBy] = useState('');

  const emptyForm = () => ({ type: 'Found', itemName: '', category: 'Other', description: '', foundLostDate: new Date().toISOString().slice(0, 10), location: '', color: '', brand: '', reportedBy: '', reportedByPhone: '', notes: '' });
  const [form, setForm] = useState<any>(emptyForm());
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, type: typeFilter, status: statusFilter });
      const res = await fetch(`/api/lost-found-p?${params}`);
      const data = await res.json();
      setItems(data.items || []); setSummary(data.summary || {});
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.itemName || !form.type) { toast({ title: 'Item name and type required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/lost-found-p', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      toast({ title: '✅ Item reported' }); setDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const resolve = async () => {
    if (!resolveDialog) return;
    setSaving(true);
    try {
      await fetch('/api/lost-found-p', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: resolveDialog.id, status: 'Resolved', claimedBy, resolutionNotes, resolvedAt: new Date().toISOString() }) });
      toast({ title: '✅ Resolved' }); setResolveDialog(null); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    await fetch('/api/lost-found-p', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Lost & Found Portal" description="Report lost or found items on campus and track claims and resolutions"
        actions={<Button size="sm" onClick={() => { setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Report Item</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: summary.total, color: 'border-l-slate-500' },
          { label: 'Lost', value: summary.lost, color: 'border-l-red-500' },
          { label: 'Found', value: summary.found, color: 'border-l-green-500' },
          { label: 'Open', value: summary.open, color: 'border-l-amber-500' },
          { label: 'Resolved', value: summary.resolved, color: 'border-l-blue-500' },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}><CardContent className="p-3"><p className="text-2xl font-bold">{c.value}</p><p className="text-xs text-muted-foreground">{c.label}</p></CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-4"><div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search item, description, reporter..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-28"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Lost">Lost</SelectItem><SelectItem value="Found">Found</SelectItem></SelectContent></Select>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="Resolved">Resolved</SelectItem></SelectContent></Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
      </div></CardContent></Card>

      {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
        items.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No items reported</p><Button size="sm" className="mt-3" onClick={() => { setForm(emptyForm()); setDialog(true); }}>Report an Item</Button></CardContent></Card> :
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id} className={`hover:shadow-md transition-all ${item.type === 'Lost' ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-green-400'} ${item.status === 'Resolved' ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs ${item.type === 'Lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.type}</Badge>
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      {item.status === 'Resolved' && <Badge className="text-xs bg-blue-100 text-blue-700">✓ Resolved</Badge>}
                    </div>
                    <p className="font-semibold mt-2 truncate">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.refNo}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => del(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                  {item.description && <p className="italic line-clamp-2">{item.description}</p>}
                  <p>📅 {fmtDate(item.foundLostDate)}</p>
                  {item.location && <p>📍 {item.location}</p>}
                  {item.color && <p>🎨 Color: {item.color}{item.brand ? ` · ${item.brand}` : ''}</p>}
                  {item.reportedBy && <p>👤 Reported by: {item.reportedBy}</p>}
                </div>
                {item.status === 'Open' && (
                  <Button size="sm" className="mt-3 w-full h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => { setResolveDialog(item); setResolutionNotes(''); setClaimedBy(''); }}>
                    <CheckCircle2 className="h-3 w-3 mr-1.5" />Mark as Resolved / Claimed
                  </Button>
                )}
                {item.status === 'Resolved' && item.claimedBy && <p className="text-xs text-green-700 mt-2">✓ Claimed by: {item.claimedBy}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      }

      {/* Report Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Report Item</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Type *</Label><Select value={form.type} onValueChange={v => f('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Lost">🔴 Lost</SelectItem><SelectItem value="Found">🟢 Found</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onValueChange={v => f('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Item Name *</Label><Input value={form.itemName} onChange={e => f('itemName', e.target.value)} placeholder="e.g. Blue Backpack, Nokia Phone" /></div>
            <div className="space-y-1.5"><Label>Color</Label><Input value={form.color} onChange={e => f('color', e.target.value)} placeholder="e.g. Blue, Black" /></div>
            <div className="space-y-1.5"><Label>Brand / Model</Label><Input value={form.brand} onChange={e => f('brand', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.foundLostDate} onChange={e => f('foundLostDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Select value={form.location} onValueChange={v => f('location', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Reported By</Label><Input value={form.reportedBy} onChange={e => f('reportedBy', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.reportedByPhone} onChange={e => f('reportedByPhone', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3} placeholder="Additional details to help identify the item..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveDialog} onOpenChange={o => !o && setResolveDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Resolve — {resolveDialog?.itemName}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/20 rounded p-3 text-xs text-muted-foreground"><p>{resolveDialog?.type} · {resolveDialog?.category} · {fmtDate(resolveDialog?.foundLostDate)}</p></div>
            <div className="space-y-1.5"><Label>Claimed By</Label><Input value={claimedBy} onChange={e => setClaimedBy(e.target.value)} placeholder="Name of person who claimed it" /></div>
            <div className="space-y-1.5"><Label>Resolution Notes</Label><Textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={3} placeholder="How was the item returned/resolved?" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setResolveDialog(null)}>Cancel</Button><Button className="bg-green-600 hover:bg-green-700" onClick={resolve} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}<CheckCircle2 className="h-4 w-4 mr-2" />Mark Resolved</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
