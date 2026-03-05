'use client';

export const dynamic = "force-dynamic"
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
import { DollarSign, Plus, Search, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Receipt, TrendingUp, Edit2, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['Office Supplies','Utilities','Maintenance','Transport','Catering','IT Equipment','Books & Stationery','Events','Staff Welfare','Other'];
const STATUSES   = ['Pending','Approved','Rejected','Paid','Cancelled'];
const STATUS_STYLES: Record<string,string> = {
  'Pending':'bg-amber-100 text-amber-700','Approved':'bg-blue-100 text-blue-700',
  'Rejected':'bg-red-100 text-red-600','Paid':'bg-green-100 text-green-700','Cancelled':'bg-gray-100 text-gray-500',
};
const EMPTY = { title:'', category:'Office Supplies', amount:'', description:'', requestedBy:'', department:'', receiptNo:'', expenseDate:'', justification:'', status:'Pending', approvedBy:'' };

export default function ExpenseRequestsPage() {
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
      const res  = await fetch('/api/expense-req?limit=200');
      const data = await res.json();
      if (data.success) setItems(data.data?.items ?? data.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (r:any) => { setEditing(r); setForm({...EMPTY,...r,amount:r.amount||'',expenseDate:r.expenseDate?r.expenseDate.slice(0,10):''}); setDialog(true); };

  const save = async () => {
    if (!form.title||!form.amount||!form.requestedBy) { toast({title:'Title, amount and requester are required',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const url  = editing ? `/api/expense-req/${editing.id}` : '/api/expense-req';
      const res  = await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,amount:parseFloat(form.amount)||0})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Expense request ${editing?'updated':'submitted'}`});
      setDialog(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const updateStatus = async (id:string, status:string, approvedBy?:string) => {
    try {
      const res  = await fetch(`/api/expense-req/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status,approvedBy:approvedBy||''})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Request ${status.toLowerCase()}`}); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const filtered = items.filter(r =>
    (!search||r.title?.toLowerCase().includes(search.toLowerCase())||r.requestedBy?.toLowerCase().includes(search.toLowerCase())||r.department?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusF||r.status===statusF)
  );

  const totalPending  = items.filter(r=>r.status==='Pending').reduce((s,r)=>s+parseFloat(r.amount||0),0);
  const totalApproved = items.filter(r=>['Approved','Paid'].includes(r.status)).reduce((s,r)=>s+parseFloat(r.amount||0),0);
  const totalPaid     = items.filter(r=>r.status==='Paid').reduce((s,r)=>s+parseFloat(r.amount||0),0);
  const pending       = items.filter(r=>r.status==='Pending').length;

  const byCat = CATEGORIES.map(c=>({name:c,total:items.filter(r=>r.category===c).reduce((s,r)=>s+parseFloat(r.amount||0),0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total).slice(0,6);
  const maxCat = byCat[0]?.total||1;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Expense Requests" description="Submit and manage departmental expense reimbursements"
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-2"/>New Request</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Pending Approval',value:pending,          sub:`PKR ${totalPending.toLocaleString()}`,icon:Clock,        color:'text-amber-600', bg:'bg-amber-50'},
          {label:'Approved',        value:items.filter(r=>r.status==='Approved').length,sub:`PKR ${totalApproved.toLocaleString()}`,icon:CheckCircle2,color:'text-blue-600',bg:'bg-blue-50'},
          {label:'Paid',            value:items.filter(r=>r.status==='Paid').length,    sub:`PKR ${totalPaid.toLocaleString()}`,icon:DollarSign,    color:'text-green-600',bg:'bg-green-50'},
          {label:'Total Requests',  value:items.length,    sub:`${CATEGORIES.length} categories`,icon:Receipt,       color:'text-purple-600',bg:'bg-purple-50'},
        ].map(s=>(
          <Card key={s.label} className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}><s.icon className={`h-5 w-5 ${s.color}`}/></div>
            <div><p className="font-bold text-lg">{s.value}</p><p className="text-xs text-muted-foreground">{s.sub}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="list">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="list">All Requests</TabsTrigger>
            <TabsTrigger value="pending">Pending {pending>0&&<Badge variant="destructive" className="ml-1 text-xs">{pending}</Badge>}</TabsTrigger>
            <TabsTrigger value="analytics">By Category</TabsTrigger>
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
                  <TableHead>Request</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead>
                  <TableHead>Requester</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading ? Array.from({length:5}).map((_,i)=>(
                    <TableRow key={i}><TableCell colSpan={7}><div className="h-8 bg-muted/40 rounded animate-pulse"/></TableCell></TableRow>
                  )) : filtered.filter(r=>tab==='pending'?r.status==='Pending':true).length===0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {tab==='pending'?'No pending requests 🎉':'No expense requests found'}
                    </TableCell></TableRow>
                  ) : filtered.filter(r=>tab==='pending'?r.status==='Pending':true).map((r:any)=>(
                    <TableRow key={r.id} className="group hover:bg-muted/30">
                      <TableCell>
                        <p className="font-medium text-sm">{r.title}</p>
                        {r.justification&&<p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.justification}</p>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{r.category}</Badge></TableCell>
                      <TableCell className="font-semibold text-sm">PKR {parseFloat(r.amount||0).toLocaleString()}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{r.requestedBy}</p>
                        {r.department&&<p className="text-xs text-muted-foreground">{r.department}</p>}
                      </TableCell>
                      <TableCell><Badge className={`text-xs ${STATUS_STYLES[r.status]||''}`}>{r.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.expenseDate?new Date(r.expenseDate).toLocaleDateString('en-PK'):r.createdAt?new Date(r.createdAt).toLocaleDateString('en-PK'):'—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {r.status==='Pending'&&<>
                            <Button variant="ghost" size="sm" className="h-7 text-green-600 hover:text-green-700" onClick={()=>updateStatus(r.id,'Approved')} title="Approve"><CheckCircle2 className="h-3.5 w-3.5"/></Button>
                            <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-600" onClick={()=>updateStatus(r.id,'Rejected')} title="Reject"><XCircle className="h-3.5 w-3.5"/></Button>
                          </>}
                          {r.status==='Approved'&&<Button variant="ghost" size="sm" className="h-7 text-blue-600" onClick={()=>updateStatus(r.id,'Paid')} title="Mark Paid"><DollarSign className="h-3.5 w-3.5"/></Button>}
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

        <TabsContent value="analytics">
          <Card><CardHeader><CardTitle className="text-sm">Spending by Category</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {byCat.length===0?<p className="text-sm text-muted-foreground">No approved expenses yet</p>:byCat.map(c=>(
                <div key={c.name} className="flex items-center gap-3">
                  <p className="text-sm font-medium w-36 shrink-0">{c.name}</p>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{width:`${(c.total/maxCat)*100}%`}}/>
                  </div>
                  <p className="text-sm font-semibold text-right w-24">PKR {c.total.toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?'Edit Expense Request':'New Expense Request'}</DialogTitle>
            <DialogDescription>Submit an expense for approval and reimbursement</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e=>f('title',e.target.value)} placeholder="Brief description"/></div>
            <div className="space-y-1"><Label>Category</Label><Select value={form.category} onValueChange={v=>f('category',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Amount (PKR) *</Label><Input type="number" value={form.amount} onChange={e=>f('amount',e.target.value)} placeholder="0.00"/></div>
            <div className="space-y-1"><Label>Requested By *</Label><Input value={form.requestedBy} onChange={e=>f('requestedBy',e.target.value)} placeholder="Your name"/></div>
            <div className="space-y-1"><Label>Department</Label><Input value={form.department} onChange={e=>f('department',e.target.value)} placeholder="Department"/></div>
            <div className="space-y-1"><Label>Expense Date</Label><Input type="date" value={form.expenseDate} onChange={e=>f('expenseDate',e.target.value)}/></div>
            <div className="space-y-1"><Label>Receipt No.</Label><Input value={form.receiptNo} onChange={e=>f('receiptNo',e.target.value)} placeholder="Invoice / receipt #"/></div>
            {editing&&<div className="space-y-1"><Label>Status</Label><Select value={form.status} onValueChange={v=>f('status',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>}
            <div className="col-span-2 space-y-1"><Label>Justification</Label><Textarea rows={3} value={form.justification} onChange={e=>f('justification',e.target.value)} placeholder="Why is this expense needed?"/></div>
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
