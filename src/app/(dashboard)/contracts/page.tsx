'use client';

export const dynamic = "force-dynamic"
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
import { FileText, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Edit2, Clock, DollarSign, Calendar } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const CONTRACT_TYPES = ['Vendor','Staff Employment','Service Agreement','Lease','Maintenance','Catering','Security','IT Services','Utility','Consulting','Other'];
const STATUSES = ['Active','Expiring Soon','Expired','Terminated','Pending Signature','Under Negotiation'];
const STATUS_STYLES: Record<string,string> = {
  'Active':'bg-green-100 text-green-700','Expiring Soon':'bg-amber-100 text-amber-700',
  'Expired':'bg-red-100 text-red-600','Terminated':'bg-gray-100 text-gray-500',
  'Pending Signature':'bg-blue-100 text-blue-700','Under Negotiation':'bg-indigo-100 text-indigo-700',
};
const EMPTY = { title:'', contractType:'Vendor', partyName:'', partyContact:'', value:'', startDate:'', endDate:'', description:'', status:'Pending Signature', signedBy:'', autoRenew:false, noticeDays:30, notes:'' };

export default function ContractManagementPage() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('');
  const [dialog,  setDialog]  = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form,    setForm]    = useState<any>(EMPTY);
  const f = (k:string,v:any) => setForm((p:any) => ({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/contracts?limit=200');
      const data = await res.json();
      if (data.success) setItems(data.data?.items ?? data.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getDaysToExpiry = (endDate:string) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate).getTime()-new Date().getTime())/86400000);
  };

  const enriched = items.map(r => {
    const days = getDaysToExpiry(r.endDate);
    let autoStatus = r.status;
    if (r.status==='Active'&&days!==null&&days<=30) autoStatus='Expiring Soon';
    if (r.status==='Active'&&days!==null&&days<0) autoStatus='Expired';
    return {...r, daysToExpiry:days, displayStatus:autoStatus};
  });

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (r:any) => { setEditing(r); setForm({...EMPTY,...r,startDate:r.startDate?r.startDate.slice(0,10):'',endDate:r.endDate?r.endDate.slice(0,10):'',value:String(r.value||''),noticeDays:r.noticeDays||30}); setDialog(true); };

  const save = async () => {
    if (!form.title||!form.partyName||!form.endDate) { toast({title:'Title, party name and end date required',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const url  = editing ? `/api/contracts/${editing.id}` : '/api/contracts';
      const res  = await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,value:parseFloat(form.value)||0,noticeDays:parseInt(form.noticeDays)||30})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Contract ${editing?'updated':'created'}`});
      setDialog(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const filtered = enriched.filter(r =>
    (!search||r.title?.toLowerCase().includes(search.toLowerCase())||r.partyName?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusF||r.displayStatus===statusF||r.status===statusF)
  );

  const active    = enriched.filter(r=>r.displayStatus==='Active').length;
  const expiring  = enriched.filter(r=>r.displayStatus==='Expiring Soon').length;
  const expired   = enriched.filter(r=>r.displayStatus==='Expired').length;
  const totalValue= enriched.filter(r=>r.displayStatus==='Active').reduce((s,r)=>s+parseFloat(r.value||0),0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Contract Management" description="Track vendor agreements, renewals and contract expiries"
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-2"/>New Contract</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Active',         value:active,   icon:CheckCircle2, color:'text-green-600', bg:'bg-green-50'},
          {label:'Expiring (30d)', value:expiring, icon:AlertTriangle, color:'text-amber-600', bg:'bg-amber-50'},
          {label:'Expired',        value:expired,  icon:Clock,         color:'text-red-600',   bg:'bg-red-50'},
          {label:'Active Value',   value:`PKR ${(totalValue/1000).toFixed(0)}K`, icon:DollarSign, color:'text-blue-600', bg:'bg-blue-50'},
        ].map(s=>(
          <Card key={s.label} className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`}/></div>
            <div><p className="font-bold text-lg">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {expiring>0&&<div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0"/>
        <p className="text-sm text-amber-700"><strong>{expiring} contract{expiring>1?'s':''}</strong> expiring within 30 days — review and renew</p>
      </div>}

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-8 h-9" placeholder="Search contracts..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <Select value={statusF} onValueChange={setStatusF}><SelectTrigger className="w-44 h-9"><SelectValue placeholder="All status"/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="sm" className="h-9" onClick={load}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Contract</TableHead><TableHead>Type</TableHead><TableHead>Party</TableHead>
            <TableHead>Value</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading?Array.from({length:5}).map((_,i)=><TableRow key={i}><TableCell colSpan={7}><div className="h-8 bg-muted/40 rounded animate-pulse"/></TableCell></TableRow>)
            :filtered.length===0?<TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No contracts found</TableCell></TableRow>
            :filtered.map((r:any)=>(
              <TableRow key={r.id} className="group hover:bg-muted/30">
                <TableCell>
                  <p className="font-medium text-sm">{r.title}</p>
                  {r.description&&<p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>}
                </TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{r.contractType}</Badge></TableCell>
                <TableCell>
                  <p className="text-sm">{r.partyName}</p>
                  {r.partyContact&&<p className="text-xs text-muted-foreground">{r.partyContact}</p>}
                </TableCell>
                <TableCell className="text-sm font-medium">{r.value?`PKR ${parseFloat(r.value).toLocaleString()}`:'—'}</TableCell>
                <TableCell>
                  <div className="text-sm">{r.endDate?new Date(r.endDate).toLocaleDateString('en-PK'):'—'}</div>
                  {r.daysToExpiry!==null&&r.daysToExpiry<=30&&r.daysToExpiry>=0&&(
                    <p className="text-xs text-amber-600 font-medium">{r.daysToExpiry}d left</p>
                  )}
                </TableCell>
                <TableCell><Badge className={`text-xs ${STATUS_STYLES[r.displayStatus||r.status]||''}`}>{r.displayStatus||r.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-7" onClick={()=>openEdit(r)}><Edit2 className="h-3.5 w-3.5"/></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?'Edit Contract':'New Contract'}</DialogTitle><DialogDescription>Add a vendor or service agreement to track renewals</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Contract Title *</Label><Input value={form.title} onChange={e=>f('title',e.target.value)} placeholder="Brief contract name"/></div>
            <div className="space-y-1"><Label>Type</Label><Select value={form.contractType} onValueChange={v=>f('contractType',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{CONTRACT_TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Status</Label><Select value={form.status} onValueChange={v=>f('status',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Party / Vendor Name *</Label><Input value={form.partyName} onChange={e=>f('partyName',e.target.value)} placeholder="Vendor / company name"/></div>
            <div className="space-y-1"><Label>Contact</Label><Input value={form.partyContact} onChange={e=>f('partyContact',e.target.value)} placeholder="Phone or email"/></div>
            <div className="space-y-1"><Label>Contract Value (PKR)</Label><Input type="number" value={form.value} onChange={e=>f('value',e.target.value)} placeholder="Annual value"/></div>
            <div className="space-y-1"><Label>Notice Period (days)</Label><Input type="number" value={form.noticeDays} onChange={e=>f('noticeDays',e.target.value)} placeholder="30"/></div>
            <div className="space-y-1"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e=>f('startDate',e.target.value)}/></div>
            <div className="space-y-1"><Label>End Date *</Label><Input type="date" value={form.endDate} onChange={e=>f('endDate',e.target.value)}/></div>
            <div className="space-y-1"><Label>Signed By</Label><Input value={form.signedBy} onChange={e=>f('signedBy',e.target.value)} placeholder="Authorized signatory"/></div>
            <div className="flex items-center gap-2 col-span-2 mt-1">
              <input type="checkbox" checked={form.autoRenew} onChange={e=>f('autoRenew',e.target.checked)} className="h-4 w-4"/>
              <Label>Auto-renew on expiry</Label>
            </div>
            <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Contract scope and key terms..."/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}{editing?'Save Changes':'Create Contract'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
