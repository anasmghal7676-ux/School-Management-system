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
import { Wrench, Plus, Search, Edit2, RefreshCw, CheckCircle2, Clock, AlertTriangle, XCircle, Loader2, Trash2, DollarSign, Calendar, MapPin, User } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['Electrical','Plumbing','Carpentry','Painting','Cleaning','IT Equipment','Furniture','HVAC','Security','General'];
const PRIORITIES = ['Low','Medium','High','Critical'];
const STATUSES   = ['Open','In Progress','On Hold','Completed','Cancelled'];

const STATUS_STYLES: Record<string,string> = {
  'Open':        'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'On Hold':     'bg-gray-100 text-gray-600',
  'Completed':   'bg-green-100 text-green-700',
  'Cancelled':   'bg-red-100 text-red-600',
};
const PRIORITY_STYLES: Record<string,string> = {
  'Low':'bg-gray-100 text-gray-600','Medium':'bg-blue-100 text-blue-700',
  'High':'bg-amber-100 text-amber-700','Critical':'bg-red-100 text-red-700',
};

const EMPTY = { title:'', location:'', priority:'Medium', category:'General', description:'', reportedBy:'', estimatedCost:'', assignedTo:'', status:'Open', scheduledDate:'', completedDate:'' };

export default function MaintenanceRequestsPage() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('');
  const [catF,    setCatF]    = useState('');
  const [dialog,  setDialog]  = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form,    setForm]    = useState<any>(EMPTY);
  const f = (k:string,v:string) => setForm((p:any) => ({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/maintenance?limit=200');
      const data = await res.json();
      if (data.success) setItems(data.data?.items ?? data.data ?? []);
    } catch { toast({title:'Failed to load',variant:'destructive'}); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (r:any) => { setEditing(r); setForm({...EMPTY,...r,estimatedCost:r.estimatedCost||'',scheduledDate:r.scheduledDate?r.scheduledDate.slice(0,10):'',completedDate:r.completedDate?r.completedDate.slice(0,10):''}); setDialog(true); };

  const save = async () => {
    if (!form.title||!form.location||!form.priority) { toast({title:'Required fields missing',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/maintenance/${editing.id}` : '/api/maintenance';
      const res = await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,estimatedCost:parseFloat(form.estimatedCost)||0})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Request ${editing?'updated':'created'}`});
      setDialog(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const markComplete = async (id:string) => {
    try {
      const res  = await fetch(`/api/maintenance/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'Completed',completedDate:new Date().toISOString()})});
      const data = await res.json();
      if(!data.success) throw new Error(data.error);
      toast({title:'✅ Marked as completed'}); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const filtered = items.filter(r =>
    (!search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.location?.toLowerCase().includes(search.toLowerCase()) || r.assignedTo?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusF || r.status===statusF) &&
    (!catF || r.category===catF)
  );

  const stats = {
    open:       items.filter(r=>r.status==='Open').length,
    inProgress: items.filter(r=>r.status==='In Progress').length,
    critical:   items.filter(r=>r.priority==='Critical').length,
    completed:  items.filter(r=>r.status==='Completed').length,
    totalCost:  items.filter(r=>r.status==='Completed').reduce((s,r)=>s+parseFloat(r.estimatedCost||0),0),
  };

  const byCategory = CATEGORIES.map(c => ({ name:c, count:items.filter(r=>r.category===c).length })).filter(c=>c.count>0);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Maintenance Requests" description="Track facility repairs and maintenance work orders"
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-2"/>New Request</Button>} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {label:'Open',      value:stats.open,       icon:Clock,        color:'text-blue-600',  bg:'bg-blue-50'},
          {label:'In Progress',value:stats.inProgress,icon:Wrench,       color:'text-amber-600', bg:'bg-amber-50'},
          {label:'Critical',  value:stats.critical,   icon:AlertTriangle,color:'text-red-600',   bg:'bg-red-50'},
          {label:'Completed', value:stats.completed,  icon:CheckCircle2, color:'text-green-600', bg:'bg-green-50'},
          {label:'Cost Spent',value:`PKR ${stats.totalCost.toLocaleString()}`,icon:DollarSign,color:'text-purple-600',bg:'bg-purple-50'},
        ].map(s=>(
          <Card key={s.label} className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`h-5 w-5 ${s.color}`}/>
              </div>
              <div>
                <p className="font-bold text-lg leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="list">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="list">All Requests</TabsTrigger>
            <TabsTrigger value="open">Open <Badge variant="secondary" className="ml-1.5 text-xs">{stats.open}</Badge></TabsTrigger>
            <TabsTrigger value="critical">Critical <Badge variant="destructive" className="ml-1.5 text-xs">{stats.critical}</Badge></TabsTrigger>
            <TabsTrigger value="analytics">By Category</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 ml-auto">
            <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-8 w-52 h-9" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <Select value={statusF} onValueChange={setStatusF}><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status"/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={catF} onValueChange={setCatF}><SelectTrigger className="w-36 h-9"><SelectValue placeholder="Category"/></SelectTrigger><SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="sm" className="h-9" onClick={()=>{setStatusF('');setCatF('')}}><XCircle className="h-4 w-4"/></Button>
            <Button variant="outline" size="sm" className="h-9" onClick={load}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
          </div>
        </div>

        {/* All / Open / Critical tabs share same table */}
        {(['list','open','critical'] as const).map(tab=>(
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Request</TableHead><TableHead>Location</TableHead><TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Assigned To</TableHead>
                    <TableHead>Est. Cost</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {loading ? Array.from({length:5}).map((_,i)=>(
                      <TableRow key={i}><TableCell colSpan={8}><div className="h-8 bg-muted/40 rounded animate-pulse"/></TableCell></TableRow>
                    )) : filtered
                      .filter(r=>tab==='open'?r.status==='Open':tab==='critical'?r.priority==='Critical':true)
                      .length===0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          {tab==='critical'?'No critical requests — everything looks good! 🎉':'No requests found'}
                        </TableCell></TableRow>
                      ) : filtered
                      .filter(r=>tab==='open'?r.status==='Open':tab==='critical'?r.priority==='Critical':true)
                      .map((r:any)=>(
                        <TableRow key={r.id} className="group hover:bg-muted/30">
                          <TableCell>
                            <p className="font-medium text-sm">{r.title}</p>
                            {r.description&&<p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.description}</p>}
                          </TableCell>
                          <TableCell><div className="flex items-center gap-1 text-sm"><MapPin className="h-3.5 w-3.5 text-muted-foreground"/>{r.location||'—'}</div></TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{r.category||'—'}</Badge></TableCell>
                          <TableCell><Badge className={`text-xs ${PRIORITY_STYLES[r.priority]||''}`}>{r.priority}</Badge></TableCell>
                          <TableCell><Badge className={`text-xs ${STATUS_STYLES[r.status]||''}`}>{r.status}</Badge></TableCell>
                          <TableCell><div className="flex items-center gap-1 text-sm"><User className="h-3.5 w-3.5 text-muted-foreground"/>{r.assignedTo||'Unassigned'}</div></TableCell>
                          <TableCell className="text-sm">{r.estimatedCost?`PKR ${parseFloat(r.estimatedCost).toLocaleString()}`:'—'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              {r.status!=='Completed'&&r.status!=='Cancelled'&&(
                                <Button variant="ghost" size="sm" className="h-7 text-green-600 hover:text-green-700" onClick={()=>markComplete(r.id)} title="Mark Complete">
                                  <CheckCircle2 className="h-3.5 w-3.5"/>
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-7" onClick={()=>openEdit(r)}><Edit2 className="h-3.5 w-3.5"/></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="analytics">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {byCategory.map(c=>(
              <Card key={c.name} className="card-hover">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600 mb-1">{c.count}</p>
                  <p className="text-sm font-medium">{c.name}</p>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{width:`${Math.min(100,(c.count/items.length)*100)}%`}}/>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?'Edit Request':'New Maintenance Request'}</DialogTitle>
            <DialogDescription>Fill in the details for this maintenance work order</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e=>f('title',e.target.value)} placeholder="Brief description of issue"/></div>
            <div className="space-y-1"><Label>Location *</Label><div className="relative"><MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-8" value={form.location} onChange={e=>f('location',e.target.value)} placeholder="Room / Area"/></div></div>
            <div className="space-y-1"><Label>Category</Label><Select value={form.category} onValueChange={v=>f('category',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Priority</Label><Select value={form.priority} onValueChange={v=>f('priority',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{PRIORITIES.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Status</Label><Select value={form.status} onValueChange={v=>f('status',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Reported By</Label><Input value={form.reportedBy} onChange={e=>f('reportedBy',e.target.value)} placeholder="Name"/></div>
            <div className="space-y-1"><Label>Assigned To</Label><Input value={form.assignedTo} onChange={e=>f('assignedTo',e.target.value)} placeholder="Technician / Vendor"/></div>
            <div className="space-y-1"><Label>Estimated Cost (PKR)</Label><Input type="number" value={form.estimatedCost} onChange={e=>f('estimatedCost',e.target.value)} placeholder="0"/></div>
            <div className="space-y-1"><Label>Scheduled Date</Label><Input type="date" value={form.scheduledDate} onChange={e=>f('scheduledDate',e.target.value)}/></div>
            {editing&&<div className="space-y-1"><Label>Completed Date</Label><Input type="date" value={form.completedDate} onChange={e=>f('completedDate',e.target.value)}/></div>}
            <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Detailed description of the issue..."/></div>
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
