'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, Search, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Edit2, ShoppingCart, TrendingDown, Boxes } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['Stationery','Lab Equipment','Sports Equipment','IT Equipment','Furniture','Cleaning Supplies','Books & Manuals','Maintenance Tools','Medical Supplies','Kitchen Supplies','Other'];
const PRIORITIES = ['Low','Normal','High','Urgent'];
const STATUSES   = ['Pending','Approved','Ordered','Delivered','Rejected','Cancelled'];
const STATUS_STYLES: Record<string,string> = {
  'Pending':'bg-amber-100 text-amber-700','Approved':'bg-blue-100 text-blue-700',
  'Ordered':'bg-indigo-100 text-indigo-700','Delivered':'bg-green-100 text-green-700',
  'Rejected':'bg-red-100 text-red-600','Cancelled':'bg-gray-100 text-gray-500',
};
const EMPTY = { itemName:'', category:'Stationery', quantity:'', unit:'pcs', estimatedCost:'', priority:'Normal', requestedBy:'', department:'', purpose:'', preferredVendor:'', status:'Pending', notes:'' };

export default function InventoryRequestsPage() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('');
  const [dialog,  setDialog]  = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form,    setForm]    = useState<any>(EMPTY);
  const f = (k:string,v:string) => setForm((p:any) => ({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/inv-req?limit=200');
      const data = await res.json();
      if (data.success) setItems(data.data?.items ?? data.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (r:any) => { setEditing(r); setForm({...EMPTY,...r,quantity:String(r.quantity||''),estimatedCost:String(r.estimatedCost||'')}); setDialog(true); };

  const save = async () => {
    if (!form.itemName||!form.quantity||!form.requestedBy) { toast({title:'Item name, quantity and requester required',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const url  = editing ? `/api/inv-req/${editing.id}` : '/api/inv-req';
      const res  = await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,quantity:parseInt(form.quantity)||1,estimatedCost:parseFloat(form.estimatedCost)||0})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Request ${editing?'updated':'submitted'}`});
      setDialog(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const updateStatus = async (id:string, status:string) => {
    try {
      const res  = await fetch(`/api/inv-req/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Marked as ${status}`}); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const filtered = items.filter(r =>
    (!search||r.itemName?.toLowerCase().includes(search.toLowerCase())||r.requestedBy?.toLowerCase().includes(search.toLowerCase())||r.department?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusF||r.status===statusF)
  );

  const pending   = items.filter(r=>r.status==='Pending').length;
  const urgent    = items.filter(r=>r.priority==='Urgent').length;
  const delivered = items.filter(r=>r.status==='Delivered').length;
  const totalValue= items.filter(r=>['Approved','Ordered','Delivered'].includes(r.status)).reduce((s,r)=>s+parseFloat(r.estimatedCost||0),0);

  const byCat = CATEGORIES.map(c=>({name:c,count:items.filter(r=>r.category===c).length})).filter(c=>c.count>0).sort((a,b)=>b.count-a.count);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Inventory Requests" description="Submit and track stock requisitions and purchase requests"
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-2"/>New Request</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Pending',     value:pending,                  icon:Clock,        color:'text-amber-600', bg:'bg-amber-50'},
          {label:'Urgent',      value:urgent,                   icon:TrendingDown, color:'text-red-600',   bg:'bg-red-50'},
          {label:'Delivered',   value:delivered,                icon:CheckCircle2, color:'text-green-600', bg:'bg-green-50'},
          {label:'Total Value', value:`PKR ${totalValue.toLocaleString()}`, icon:ShoppingCart, color:'text-blue-600', bg:'bg-blue-50'},
        ].map(s=>(
          <Card key={s.label} className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`}/></div>
            <div><p className="font-bold text-lg">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="list">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="list">All Requests</TabsTrigger>
            <TabsTrigger value="pending">Pending {pending>0&&<Badge variant="destructive" className="ml-1 text-xs">{pending}</Badge>}</TabsTrigger>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 ml-auto">
            <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-8 w-52 h-9" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <Select value={statusF} onValueChange={setStatusF}><SelectTrigger className="w-36 h-9"><SelectValue placeholder="All status"/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="sm" className="h-9" onClick={load}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
          </div>
        </div>

        {(['list','pending'] as const).map(tab=>(
          <TabsContent key={tab} value={tab}>
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Qty</TableHead>
                  <TableHead>Est. Cost</TableHead><TableHead>Priority</TableHead><TableHead>Requester</TableHead>
                  <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading?Array.from({length:5}).map((_,i)=><TableRow key={i}><TableCell colSpan={8}><div className="h-8 bg-muted/40 rounded animate-pulse"/></TableCell></TableRow>)
                  :filtered.filter(r=>tab==='pending'?r.status==='Pending':true).length===0
                  ?<TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">{tab==='pending'?'No pending requests 🎉':'No requests found'}</TableCell></TableRow>
                  :filtered.filter(r=>tab==='pending'?r.status==='Pending':true).map((r:any)=>(
                    <TableRow key={r.id} className="group hover:bg-muted/30">
                      <TableCell>
                        <p className="font-medium text-sm">{r.itemName}</p>
                        {r.purpose&&<p className="text-xs text-muted-foreground line-clamp-1">{r.purpose}</p>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{r.category}</Badge></TableCell>
                      <TableCell className="text-sm font-medium">{r.quantity} {r.unit||'pcs'}</TableCell>
                      <TableCell className="text-sm">{r.estimatedCost?`PKR ${parseFloat(r.estimatedCost).toLocaleString()}`:'—'}</TableCell>
                      <TableCell><Badge className={`text-xs ${r.priority==='Urgent'?'bg-red-100 text-red-700':r.priority==='High'?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-600'}`}>{r.priority}</Badge></TableCell>
                      <TableCell>
                        <p className="text-sm">{r.requestedBy}</p>
                        {r.department&&<p className="text-xs text-muted-foreground">{r.department}</p>}
                      </TableCell>
                      <TableCell><Badge className={`text-xs ${STATUS_STYLES[r.status]||''}`}>{r.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {r.status==='Pending'&&<>
                            <Button variant="ghost" size="sm" className="h-7 text-green-600" onClick={()=>updateStatus(r.id,'Approved')} title="Approve"><CheckCircle2 className="h-3.5 w-3.5"/></Button>
                            <Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={()=>updateStatus(r.id,'Rejected')} title="Reject"><XCircle className="h-3.5 w-3.5"/></Button>
                          </>}
                          {r.status==='Approved'&&<Button variant="ghost" size="sm" className="h-7 text-blue-600" onClick={()=>updateStatus(r.id,'Ordered')} title="Mark Ordered"><Package className="h-3.5 w-3.5"/></Button>}
                          {r.status==='Ordered'&&<Button variant="ghost" size="sm" className="h-7 text-green-600" onClick={()=>updateStatus(r.id,'Delivered')} title="Mark Delivered"><CheckCircle2 className="h-3.5 w-3.5"/></Button>}
                          <Button variant="ghost" size="sm" className="h-7" onClick={()=>openEdit(r)}><Edit2 className="h-3.5 w-3.5"/></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          </TabsContent>
        ))}

        <TabsContent value="by-category">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {byCat.length===0?<p className="text-muted-foreground col-span-4">No requests yet</p>:byCat.map(c=>(
              <Card key={c.name} className="card-hover text-center"><CardContent className="p-4">
                <Boxes className="h-8 w-8 mx-auto mb-2 text-blue-500"/>
                <p className="text-2xl font-bold text-blue-600">{c.count}</p>
                <p className="text-sm font-medium mt-0.5">{c.name}</p>
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?'Edit Request':'New Inventory Request'}</DialogTitle><DialogDescription>Submit a requisition for stock or equipment</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Item Name *</Label><Input value={form.itemName} onChange={e=>f('itemName',e.target.value)} placeholder="Item description"/></div>
            <div className="space-y-1"><Label>Category</Label><Select value={form.category} onValueChange={v=>f('category',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Priority</Label><Select value={form.priority} onValueChange={v=>f('priority',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{PRIORITIES.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Quantity *</Label><Input type="number" value={form.quantity} onChange={e=>f('quantity',e.target.value)} placeholder="1"/></div>
            <div className="space-y-1"><Label>Unit</Label><Input value={form.unit} onChange={e=>f('unit',e.target.value)} placeholder="pcs / kg / litre"/></div>
            <div className="space-y-1"><Label>Est. Cost (PKR)</Label><Input type="number" value={form.estimatedCost} onChange={e=>f('estimatedCost',e.target.value)} placeholder="0"/></div>
            <div className="space-y-1"><Label>Preferred Vendor</Label><Input value={form.preferredVendor} onChange={e=>f('preferredVendor',e.target.value)} placeholder="Vendor name"/></div>
            <div className="space-y-1"><Label>Requested By *</Label><Input value={form.requestedBy} onChange={e=>f('requestedBy',e.target.value)} placeholder="Your name"/></div>
            <div className="space-y-1"><Label>Department</Label><Input value={form.department} onChange={e=>f('department',e.target.value)} placeholder="Department"/></div>
            <div className="col-span-2 space-y-1"><Label>Purpose / Justification</Label><Textarea rows={2} value={form.purpose} onChange={e=>f('purpose',e.target.value)} placeholder="Why is this needed?"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}{editing?'Save Changes':'Submit Request'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
