'use client';

export const dynamic = "force-dynamic"
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Plus, Search, RefreshCw, CheckCircle2, Clock, Loader2, Edit2, DollarSign, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const ROOM_TYPES = ['Single','Double','Triple','Dormitory'];
const MEAL_PLANS = ['None','Breakfast Only','Half Board','Full Board'];
const FEE_TYPES  = ['Monthly','Termly','Annual'];
const STATUSES   = ['Paid','Pending','Overdue','Waived'];
const STATUS_STYLES: Record<string,string> = {
  'Paid':'bg-green-100 text-green-700','Pending':'bg-amber-100 text-amber-700',
  'Overdue':'bg-red-100 text-red-700','Waived':'bg-gray-100 text-gray-500',
};
const EMPTY = { studentId:'', roomNumber:'', roomType:'Single', mealPlan:'Full Board', monthlyFee:'', mealFee:'', utilityFee:'', month:'', year:new Date().getFullYear().toString(), status:'Pending', paidDate:'', paidAmount:'', paymentMethod:'Cash', notes:'' };

export default function HostelFeesPage() {
  const [items,    setItems]    = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('');
  const [dialog,   setDialog]   = useState(false);
  const [editing,  setEditing]  = useState<any>(null);
  const [form,     setForm]     = useState<any>(EMPTY);
  const f = (k:string,v:string) => setForm((p:any) => ({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, sRes] = await Promise.all([fetch('/api/hostel-fees?limit=200'), fetch('/api/students?limit=500&status=active')]);
      const [hData, sData] = await Promise.all([hRes.json(), sRes.json()]);
      if (hData.success) setItems(hData.data?.items ?? hData.data ?? []);
      if (sData.success) setStudents(sData.data?.items ?? sData.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({...EMPTY,month:String(new Date().getMonth()+1)}); setDialog(true); };
  const openEdit = (r:any) => { setEditing(r); setForm({...EMPTY,...r,monthlyFee:String(r.monthlyFee||''),mealFee:String(r.mealFee||''),utilityFee:String(r.utilityFee||''),paidAmount:String(r.paidAmount||''),paidDate:r.paidDate?r.paidDate.slice(0,10):''}); setDialog(true); };

  const save = async () => {
    if (!form.studentId||!form.roomNumber) { toast({title:'Student and room number required',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const url  = editing ? `/api/hostel-fees/${editing.id}` : '/api/hostel-fees';
      const payload = {...form,monthlyFee:parseFloat(form.monthlyFee)||0,mealFee:parseFloat(form.mealFee)||0,utilityFee:parseFloat(form.utilityFee)||0,paidAmount:parseFloat(form.paidAmount)||0,month:parseInt(form.month)||1,year:parseInt(form.year)||new Date().getFullYear()};
      const res  = await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Fee ${editing?'updated':'recorded'}`});
      setDialog(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const markPaid = async (id:string) => {
    try {
      const res  = await fetch(`/api/hostel-fees/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'Paid',paidDate:new Date().toISOString(),paidAmount:items.find(i=>i.id===id)?.monthlyFee||0})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:'✅ Fee marked as paid'}); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const filtered = items.filter(r =>
    (!search||(r.student?.fullName||'').toLowerCase().includes(search.toLowerCase())||(r.roomNumber||'').toLowerCase().includes(search.toLowerCase())) &&
    (!statusF||r.status===statusF)
  );

  const totalCollected = items.filter(r=>r.status==='Paid').reduce((s,r)=>s+(parseFloat(r.paidAmount||r.monthlyFee||0)),0);
  const totalPending   = items.filter(r=>['Pending','Overdue'].includes(r.status)).reduce((s,r)=>s+(parseFloat(r.monthlyFee||0)+parseFloat(r.mealFee||0)+parseFloat(r.utilityFee||0)),0);
  const overdue = items.filter(r=>r.status==='Overdue').length;
  const pending = items.filter(r=>r.status==='Pending').length;

  const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Hostel Fees" description="Manage boarding accommodation fees and collections"
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-2"/>Add Fee Record</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Collected',   value:`PKR ${totalCollected.toLocaleString()}`, icon:CheckCircle2,color:'text-green-600',bg:'bg-green-50'},
          {label:'Outstanding', value:`PKR ${totalPending.toLocaleString()}`,   icon:Clock,       color:'text-amber-600',bg:'bg-amber-50'},
          {label:'Overdue',     value:overdue,                                   icon:AlertTriangle,color:'text-red-600', bg:'bg-red-50'},
          {label:'Pending',     value:pending,                                   icon:DollarSign,  color:'text-blue-600', bg:'bg-blue-50'},
        ].map(s=>(
          <Card key={s.label} className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`}/></div>
            <div><p className="font-bold text-lg">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-8 h-9" placeholder="Search by name or room..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="flex gap-1">
          {['','Pending','Paid','Overdue','Waived'].map(s=>(
            <Button key={s} variant={statusF===s?'default':'outline'} size="sm" className="h-9 text-xs" onClick={()=>setStatusF(s)}>{s||'All'}</Button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={load}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Student</TableHead><TableHead>Room</TableHead><TableHead>Meal Plan</TableHead>
            <TableHead>Period</TableHead><TableHead>Total Fee</TableHead><TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading?Array.from({length:5}).map((_,i)=><TableRow key={i}><TableCell colSpan={7}><div className="h-8 bg-muted/40 rounded animate-pulse"/></TableCell></TableRow>)
            :filtered.length===0?<TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No hostel fee records</TableCell></TableRow>
            :filtered.map((r:any)=>{
              const total = parseFloat(r.monthlyFee||0)+parseFloat(r.mealFee||0)+parseFloat(r.utilityFee||0);
              return (
                <TableRow key={r.id} className="group hover:bg-muted/30">
                  <TableCell>
                    <p className="font-medium text-sm">{r.student?.fullName||'—'}</p>
                    {r.student?.class?.name&&<p className="text-xs text-muted-foreground">{r.student.class.name}</p>}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">Room {r.roomNumber}</p>
                    {r.roomType&&<p className="text-xs text-muted-foreground">{r.roomType}</p>}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{r.mealPlan||'—'}</Badge></TableCell>
                  <TableCell className="text-sm">{r.month?MONTHS[parseInt(r.month)]:''} {r.year}</TableCell>
                  <TableCell className="font-semibold text-sm">PKR {total.toLocaleString()}</TableCell>
                  <TableCell><Badge className={`text-xs ${STATUS_STYLES[r.status]||''}`}>{r.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      {r.status==='Pending'&&<Button variant="ghost" size="sm" className="h-7 text-green-600" onClick={()=>markPaid(r.id)} title="Mark Paid"><CheckCircle2 className="h-3.5 w-3.5"/></Button>}
                      <Button variant="ghost" size="sm" className="h-7" onClick={()=>openEdit(r)}><Edit2 className="h-3.5 w-3.5"/></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?'Edit Fee Record':'Add Hostel Fee'}</DialogTitle><DialogDescription>Record accommodation fee for a hostel resident</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Student *</Label><Select value={form.studentId} onValueChange={v=>f('studentId',v)}><SelectTrigger><SelectValue placeholder="Select student"/></SelectTrigger><SelectContent>{students.map(s=><SelectItem key={s.id} value={s.id}>{s.fullName} — {s.class?.name||'—'}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Room Number *</Label><Input value={form.roomNumber} onChange={e=>f('roomNumber',e.target.value)} placeholder="e.g. H-101"/></div>
            <div className="space-y-1"><Label>Room Type</Label><Select value={form.roomType} onValueChange={v=>f('roomType',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ROOM_TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Meal Plan</Label><Select value={form.mealPlan} onValueChange={v=>f('mealPlan',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{MEAL_PLANS.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Status</Label><Select value={form.status} onValueChange={v=>f('status',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Month</Label><Select value={form.month} onValueChange={v=>f('month',v)}><SelectTrigger><SelectValue placeholder="Month"/></SelectTrigger><SelectContent>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m=><SelectItem key={m} value={String(m)}>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Year</Label><Input value={form.year} onChange={e=>f('year',e.target.value)} placeholder={String(new Date().getFullYear())}/></div>
            <div className="space-y-1"><Label>Room Fee (PKR)</Label><Input type="number" value={form.monthlyFee} onChange={e=>f('monthlyFee',e.target.value)} placeholder="0"/></div>
            <div className="space-y-1"><Label>Meal Fee (PKR)</Label><Input type="number" value={form.mealFee} onChange={e=>f('mealFee',e.target.value)} placeholder="0"/></div>
            <div className="space-y-1"><Label>Utility Fee (PKR)</Label><Input type="number" value={form.utilityFee} onChange={e=>f('utilityFee',e.target.value)} placeholder="0"/></div>
            <div className="space-y-1"><Label>Paid Amount</Label><Input type="number" value={form.paidAmount} onChange={e=>f('paidAmount',e.target.value)} placeholder="0"/></div>
            {form.status==='Paid'&&<div className="space-y-1"><Label>Payment Date</Label><Input type="date" value={form.paidDate} onChange={e=>f('paidDate',e.target.value)}/></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}{editing?'Save Changes':'Save Record'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
