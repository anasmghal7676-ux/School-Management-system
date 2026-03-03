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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCheck, Plus, Search, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Edit2, ArrowRight, Building2 } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const TRANSFER_TYPES = ['Department Transfer','Role Change','School Transfer','Promotion','Demotion','Secondment'];
const REASONS = ['Operational Need','Staff Request','Performance','Disciplinary','Restructuring','Medical','Mutual Agreement','Other'];
const STATUSES = ['Pending','Approved','Rejected','Completed','Cancelled'];
const STATUS_STYLES: Record<string,string> = {
  'Pending':'bg-amber-100 text-amber-700','Approved':'bg-blue-100 text-blue-700',
  'Rejected':'bg-red-100 text-red-600','Completed':'bg-green-100 text-green-700','Cancelled':'bg-gray-100 text-gray-500',
};
const EMPTY = { staffId:'', transferType:'Department Transfer', fromDept:'', toDept:'', fromRole:'', toRole:'', reason:'Operational Need', effectiveDate:'', description:'', initiatedBy:'', status:'Pending', approvedBy:'' };

export default function StaffTransferPage() {
  const [items,  setItems]  = useState<any[]>([]);
  const [staff,  setStaff]  = useState<any[]>([]);
  const [depts,  setDepts]  = useState<any[]>([]);
  const [loading,setLoading]= useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editing,setEditing]= useState<any>(null);
  const [form,   setForm]   = useState<any>(EMPTY);
  const f = (k:string,v:string) => setForm((p:any) => ({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes, dRes] = await Promise.all([
        fetch('/api/staff-xfers?limit=200'),
        fetch('/api/staff?limit=300&status=active'),
        fetch('/api/departments'),
      ]);
      const [tData, sData, dData] = await Promise.all([tRes.json(), sRes.json(), dRes.json()]);
      if (tData.success) setItems(tData.data?.items ?? tData.data ?? []);
      if (sData.success) setStaff(sData.data?.items ?? sData.data ?? []);
      if (dData.success) setDepts(dData.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (r:any) => { setEditing(r); setForm({...EMPTY,...r,effectiveDate:r.effectiveDate?r.effectiveDate.slice(0,10):''}); setDialog(true); };

  const save = async () => {
    if (!form.staffId||!form.transferType||!form.effectiveDate) { toast({title:'Staff, type and effective date required',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const url  = editing ? `/api/staff-xfers/${editing.id}` : '/api/staff-xfers';
      const res  = await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Transfer ${editing?'updated':'created'}`});
      setDialog(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const updateStatus = async (id:string, status:string) => {
    try {
      const res  = await fetch(`/api/staff-xfers/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Transfer ${status.toLowerCase()}`}); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const filtered = items.filter(r =>
    !search||(r.staff?.fullName||'').toLowerCase().includes(search.toLowerCase())||(r.fromDept||'').toLowerCase().includes(search.toLowerCase())||(r.toDept||'').toLowerCase().includes(search.toLowerCase())
  );

  const pending   = items.filter(r=>r.status==='Pending').length;
  const approved  = items.filter(r=>r.status==='Approved').length;
  const completed = items.filter(r=>r.status==='Completed').length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Staff Transfers" description="Process and track inter-department and role change requests"
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-2"/>New Transfer</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Pending',   value:pending,   icon:Clock,       color:'text-amber-600', bg:'bg-amber-50'},
          {label:'Approved',  value:approved,  icon:CheckCircle2,color:'text-blue-600',  bg:'bg-blue-50'},
          {label:'Completed', value:completed, icon:UserCheck,   color:'text-green-600', bg:'bg-green-50'},
          {label:'Total',     value:items.length,icon:Building2,  color:'text-purple-600',bg:'bg-purple-50'},
        ].map(s=>(
          <Card key={s.label} className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`}/></div>
            <div><p className="font-bold text-lg">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-8 h-9" placeholder="Search by name or department..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <Button variant="outline" size="sm" className="h-9" onClick={load}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Staff</TableHead><TableHead>Type</TableHead><TableHead>Transfer</TableHead>
            <TableHead>Reason</TableHead><TableHead>Effective</TableHead><TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading?Array.from({length:5}).map((_,i)=><TableRow key={i}><TableCell colSpan={7}><div className="h-8 bg-muted/40 rounded animate-pulse"/></TableCell></TableRow>)
            :filtered.length===0?<TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No transfer requests found</TableCell></TableRow>
            :filtered.map((r:any)=>(
              <TableRow key={r.id} className="group hover:bg-muted/30">
                <TableCell>
                  <p className="font-medium text-sm">{r.staff?.fullName||'—'}</p>
                  {r.staff?.designation&&<p className="text-xs text-muted-foreground">{r.staff.designation}</p>}
                </TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{r.transferType}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="bg-muted px-2 py-0.5 rounded">{r.fromDept||r.fromRole||'—'}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0"/>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{r.toDept||r.toRole||'—'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.reason}</TableCell>
                <TableCell className="text-xs">{r.effectiveDate?new Date(r.effectiveDate).toLocaleDateString('en-PK'):'—'}</TableCell>
                <TableCell><Badge className={`text-xs ${STATUS_STYLES[r.status]||''}`}>{r.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    {r.status==='Pending'&&<>
                      <Button variant="ghost" size="sm" className="h-7 text-green-600" onClick={()=>updateStatus(r.id,'Approved')} title="Approve"><CheckCircle2 className="h-3.5 w-3.5"/></Button>
                      <Button variant="ghost" size="sm" className="h-7 text-red-500" onClick={()=>updateStatus(r.id,'Rejected')} title="Reject"><XCircle className="h-3.5 w-3.5"/></Button>
                    </>}
                    {r.status==='Approved'&&<Button variant="ghost" size="sm" className="h-7 text-green-600" onClick={()=>updateStatus(r.id,'Completed')} title="Mark Complete"><UserCheck className="h-3.5 w-3.5"/></Button>}
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
          <DialogHeader><DialogTitle>{editing?'Edit Transfer':'New Staff Transfer'}</DialogTitle><DialogDescription>Create a staff transfer or role change request</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Staff Member *</Label><Select value={form.staffId} onValueChange={v=>f('staffId',v)}><SelectTrigger><SelectValue placeholder="Select staff..."/></SelectTrigger><SelectContent>{staff.map(s=><SelectItem key={s.id} value={s.id}>{s.fullName} — {s.designation||'—'}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Transfer Type</Label><Select value={form.transferType} onValueChange={v=>f('transferType',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{TRANSFER_TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Reason</Label><Select value={form.reason} onValueChange={v=>f('reason',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{REASONS.map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>From Department / Role</Label><Input value={form.fromDept} onChange={e=>f('fromDept',e.target.value)} placeholder="Current"/></div>
            <div className="space-y-1"><Label>To Department / Role</Label><Input value={form.toDept} onChange={e=>f('toDept',e.target.value)} placeholder="New"/></div>
            <div className="space-y-1"><Label>Effective Date *</Label><Input type="date" value={form.effectiveDate} onChange={e=>f('effectiveDate',e.target.value)}/></div>
            <div className="space-y-1"><Label>Initiated By</Label><Input value={form.initiatedBy} onChange={e=>f('initiatedBy',e.target.value)} placeholder="Name"/></div>
            {editing&&<div className="space-y-1 col-span-2"><Label>Status</Label><Select value={form.status} onValueChange={v=>f('status',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>}
            <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Additional notes..."/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}{editing?'Save Changes':'Create Transfer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
