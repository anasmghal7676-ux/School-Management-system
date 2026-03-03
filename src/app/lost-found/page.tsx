'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, RefreshCw, CheckCircle2, Package, Loader2, Edit2, MapPin, Tag } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['Electronics','Books & Stationery','Clothing','Bag / Backpack','Sports Equipment','Keys','Water Bottle','Lunch Box','Spectacles','Jewelry','Other'];
const STATUSES   = ['Found','Claimed','Donated','Disposed'];
const STATUS_STYLES: Record<string,string> = {
  'Found':'bg-blue-100 text-blue-700','Claimed':'bg-green-100 text-green-700',
  'Donated':'bg-purple-100 text-purple-700','Disposed':'bg-gray-100 text-gray-500',
};
const EMPTY = { itemName:'', category:'Other', description:'', foundLocation:'', foundDate:'', foundBy:'', storedAt:'', status:'Found', claimedBy:'', claimedDate:'', color:'', brand:'', notes:'' };

export default function LostFoundPage() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('Found');
  const [dialog,  setDialog]  = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form,    setForm]    = useState<any>(EMPTY);
  const f = (k:string,v:string) => setForm((p:any) => ({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/lost-found?limit=200');
      const data = await res.json();
      if (data.success) setItems(data.data?.items ?? data.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({...EMPTY,foundDate:new Date().toISOString().slice(0,10)}); setDialog(true); };
  const openEdit = (r:any) => { setEditing(r); setForm({...EMPTY,...r,foundDate:r.foundDate?r.foundDate.slice(0,10):'',claimedDate:r.claimedDate?r.claimedDate.slice(0,10):''}); setDialog(true); };

  const save = async () => {
    if (!form.itemName||!form.foundLocation||!form.foundBy) { toast({title:'Item, location and found-by required',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const url  = editing ? `/api/lost-found/${editing.id}` : '/api/lost-found';
      const res  = await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Item ${editing?'updated':'registered'}`});
      setDialog(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const markClaimed = async (id:string) => {
    const claimedBy = window.prompt('Claimed by (name):');
    if (!claimedBy) return;
    try {
      const res  = await fetch(`/api/lost-found/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'Claimed',claimedBy,claimedDate:new Date().toISOString()})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:'✅ Item marked as claimed'}); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const filtered = items.filter(r =>
    (!search||r.itemName?.toLowerCase().includes(search.toLowerCase())||r.foundLocation?.toLowerCase().includes(search.toLowerCase())||(r.description||'').toLowerCase().includes(search.toLowerCase())) &&
    (!statusF||r.status===statusF)
  );

  const found    = items.filter(r=>r.status==='Found').length;
  const claimed  = items.filter(r=>r.status==='Claimed').length;
  const daysOld  = items.filter(r=>r.status==='Found'&&r.foundDate&&(new Date().getTime()-new Date(r.foundDate).getTime())>30*86400000).length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Lost & Found" description="Register, track and manage found items in school premises"
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-2"/>Register Item</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Unclaimed Items', value:found,   icon:Package,     color:'text-blue-600',   bg:'bg-blue-50'},
          {label:'Claimed',         value:claimed, icon:CheckCircle2,color:'text-green-600',  bg:'bg-green-50'},
          {label:'30+ Days Old',    value:daysOld, icon:Tag,         color:'text-amber-600',  bg:'bg-amber-50'},
          {label:'Total Registered',value:items.length,icon:Search,  color:'text-purple-600', bg:'bg-purple-50'},
        ].map(s=>(
          <Card key={s.label} className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`}/></div>
            <div><p className="font-bold text-lg">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-8 h-9" placeholder="Search items..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="flex gap-1">
          {['','Found','Claimed','Donated','Disposed'].map(s=>(
            <Button key={s} variant={statusF===s?'default':'outline'} size="sm" className="h-9 text-xs" onClick={()=>setStatusF(s)}>{s||'All'}</Button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={load}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Found At</TableHead>
            <TableHead>Found By</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading?Array.from({length:5}).map((_,i)=><TableRow key={i}><TableCell colSpan={7}><div className="h-8 bg-muted/40 rounded animate-pulse"/></TableCell></TableRow>)
            :filtered.length===0?<TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No items found{statusF?' with status: '+statusF:''}</TableCell></TableRow>
            :filtered.map((r:any)=>(
              <TableRow key={r.id} className="group hover:bg-muted/30">
                <TableCell>
                  <p className="font-medium text-sm">{r.itemName}</p>
                  {(r.color||r.brand)&&<p className="text-xs text-muted-foreground">{[r.brand,r.color].filter(Boolean).join(' · ')}</p>}
                </TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{r.category}</Badge></TableCell>
                <TableCell><div className="flex items-center gap-1 text-sm"><MapPin className="h-3.5 w-3.5 text-muted-foreground"/>{r.foundLocation||'—'}</div></TableCell>
                <TableCell className="text-sm">{r.foundBy||'—'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.foundDate?new Date(r.foundDate).toLocaleDateString('en-PK'):'—'}</TableCell>
                <TableCell><Badge className={`text-xs ${STATUS_STYLES[r.status]||''}`}>{r.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    {r.status==='Found'&&<Button variant="ghost" size="sm" className="h-7 text-green-600" onClick={()=>markClaimed(r.id)} title="Mark as Claimed"><CheckCircle2 className="h-3.5 w-3.5"/></Button>}
                    <Button variant="ghost" size="sm" className="h-7" onClick={()=>openEdit(r)}><Edit2 className="h-3.5 w-3.5"/></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?'Edit Item':'Register Found Item'}</DialogTitle><DialogDescription>Record details of a lost item found in school</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Item Name *</Label><Input value={form.itemName} onChange={e=>f('itemName',e.target.value)} placeholder="e.g. Blue Umbrella, Samsung Phone"/></div>
            <div className="space-y-1"><Label>Category</Label><Select value={form.category} onValueChange={v=>f('category',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Status</Label><Select value={form.status} onValueChange={v=>f('status',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Color</Label><Input value={form.color} onChange={e=>f('color',e.target.value)} placeholder="Item color"/></div>
            <div className="space-y-1"><Label>Brand / Model</Label><Input value={form.brand} onChange={e=>f('brand',e.target.value)} placeholder="Brand name"/></div>
            <div className="space-y-1"><Label>Found Location *</Label><Input value={form.foundLocation} onChange={e=>f('foundLocation',e.target.value)} placeholder="Classroom / Playground..."/></div>
            <div className="space-y-1"><Label>Found Date</Label><Input type="date" value={form.foundDate} onChange={e=>f('foundDate',e.target.value)}/></div>
            <div className="space-y-1"><Label>Found By *</Label><Input value={form.foundBy} onChange={e=>f('foundBy',e.target.value)} placeholder="Person who found it"/></div>
            <div className="space-y-1"><Label>Stored At</Label><Input value={form.storedAt} onChange={e=>f('storedAt',e.target.value)} placeholder="Storage location"/></div>
            {(form.status==='Claimed')&&<><div className="space-y-1"><Label>Claimed By</Label><Input value={form.claimedBy} onChange={e=>f('claimedBy',e.target.value)} placeholder="Claimant name"/></div><div className="space-y-1"><Label>Claimed Date</Label><Input type="date" value={form.claimedDate} onChange={e=>f('claimedDate',e.target.value)}/></div></>}
            <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Additional details..."/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}{editing?'Save Changes':'Register Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
