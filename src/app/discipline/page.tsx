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
import { AlertTriangle, Plus, Search, RefreshCw, Shield, Loader2, Edit2, CheckCircle2, XCircle, Clock, Gavel } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const INCIDENT_TYPES = ['Late to Class','Absenteeism','Misconduct','Fighting','Bullying','Cheating','Vandalism','Disrespect','Mobile Phone','Dress Code Violation','Substance Abuse','Theft','Other'];
const ACTIONS = ['Verbal Warning','Written Warning','Parent Called','Detention','Suspension','Expulsion Recommended','Counseling Referred','Community Service','No Action','Other'];
const SEVERITIES = ['Minor','Moderate','Serious','Severe'];
const STATUSES   = ['Open','Under Review','Resolved','Closed'];
const SEV_STYLES: Record<string,string> = {
  'Minor':'bg-gray-100 text-gray-600','Moderate':'bg-amber-100 text-amber-700',
  'Serious':'bg-orange-100 text-orange-700','Severe':'bg-red-100 text-red-700',
};
const STATUS_STYLES: Record<string,string> = {
  'Open':'bg-blue-100 text-blue-700','Under Review':'bg-amber-100 text-amber-700',
  'Resolved':'bg-green-100 text-green-700','Closed':'bg-gray-100 text-gray-600',
};
const EMPTY = { studentId:'', incidentType:'Misconduct', severity:'Minor', description:'', action:'Verbal Warning', actionDate:'', reportedBy:'', parentInformed:false, parentMeetingDate:'', status:'Open', followUpDate:'', notes:'' };

export default function DisciplineTrackerPage() {
  const [items,    setItems]    = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [sevF,     setSevF]     = useState('');
  const [statusF,  setStatusF]  = useState('');
  const [dialog,   setDialog]   = useState(false);
  const [editing,  setEditing]  = useState<any>(null);
  const [form,     setForm]     = useState<any>(EMPTY);
  const f = (k:string,v:any) => setForm((p:any) => ({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, sRes] = await Promise.all([
        fetch('/api/discipline?limit=200'),
        fetch('/api/students?limit=500&status=active'),
      ]);
      const [iData, sData] = await Promise.all([iRes.json(), sRes.json()]);
      if (iData.success) setItems(iData.data?.items ?? iData.data ?? []);
      if (sData.success) setStudents(sData.data?.items ?? sData.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (r:any) => { setEditing(r); setForm({...EMPTY,...r,actionDate:r.actionDate?r.actionDate.slice(0,10):'',followUpDate:r.followUpDate?r.followUpDate.slice(0,10):'',parentMeetingDate:r.parentMeetingDate?r.parentMeetingDate.slice(0,10):''}); setDialog(true); };

  const save = async () => {
    if (!form.studentId||!form.incidentType||!form.description) { toast({title:'Student, incident type and description required',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const url  = editing ? `/api/discipline/${editing.id}` : '/api/discipline';
      const res  = await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Incident ${editing?'updated':'recorded'}`});
      setDialog(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const resolve = async (id:string) => {
    try {
      const res  = await fetch(`/api/discipline/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'Resolved'})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:'✅ Marked as resolved'}); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const filtered = items.filter(r =>
    (!search||(r.student?.fullName||'').toLowerCase().includes(search.toLowerCase())||r.incidentType?.toLowerCase().includes(search.toLowerCase())) &&
    (!sevF||r.severity===sevF) && (!statusF||r.status===statusF)
  );

  const serious    = items.filter(r=>['Serious','Severe'].includes(r.severity));
  const open       = items.filter(r=>r.status==='Open'||r.status==='Under Review');
  const thisMonth  = items.filter(r=>r.createdAt&&new Date(r.createdAt).getMonth()===new Date().getMonth());
  const repeatOffenders = Object.entries(
    items.reduce((acc:Record<string,any>,r)=>{
      const id = r.studentId;
      if(!acc[id]) acc[id]={name:r.student?.fullName||'Unknown',count:0};
      acc[id].count++;
      return acc;
    },{})
  ).map(([id,v])=>({id,...v as any})).filter((s:any)=>s.count>1).sort((a:any,b:any)=>b.count-a.count).slice(0,5);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Discipline Tracker" description="Record and manage student disciplinary incidents and actions"
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-2"/>Record Incident</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Open Cases',   value:open.length,       icon:Clock,         color:'text-amber-600', bg:'bg-amber-50'},
          {label:'Serious+',     value:serious.length,    icon:AlertTriangle, color:'text-red-600',   bg:'bg-red-50'},
          {label:'This Month',   value:thisMonth.length,  icon:Shield,        color:'text-blue-600',  bg:'bg-blue-50'},
          {label:'Total Records',value:items.length,      icon:Gavel,         color:'text-purple-600',bg:'bg-purple-50'},
        ].map(s=>(
          <Card key={s.label} className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`}/></div>
            <div><p className="font-bold text-lg">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {serious.filter(r=>r.status==='Open').length>0&&(
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0"/>
          <p className="text-sm text-red-700"><strong>{serious.filter(r=>r.status==='Open').length} serious/severe incident{serious.filter(r=>r.status==='Open').length>1?'s':''}</strong> require immediate attention</p>
        </div>
      )}

      <Tabs defaultValue="all">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open {open.length>0&&<Badge variant="destructive" className="ml-1 text-xs">{open.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="serious">Serious</TabsTrigger>
            <TabsTrigger value="repeat">Repeat Offenders</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 ml-auto">
            <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-8 w-48 h-9" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <Select value={sevF} onValueChange={setSevF}><SelectTrigger className="w-32 h-9"><SelectValue placeholder="Severity"/></SelectTrigger><SelectContent>{SEVERITIES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="sm" className="h-9" onClick={()=>{setSevF('');setStatusF('')}}>Clear</Button>
            <Button variant="outline" size="sm" className="h-9" onClick={load}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
          </div>
        </div>

        {(['all','open','serious'] as const).map(tab=>(
          <TabsContent key={tab} value={tab}>
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Student</TableHead><TableHead>Incident</TableHead><TableHead>Severity</TableHead>
                  <TableHead>Action Taken</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {loading?Array.from({length:5}).map((_,i)=><TableRow key={i}><TableCell colSpan={7}><div className="h-8 bg-muted/40 rounded animate-pulse"/></TableCell></TableRow>)
                  : filtered.filter(r=>tab==='open'?['Open','Under Review'].includes(r.status):tab==='serious'?['Serious','Severe'].includes(r.severity):true).length===0
                  ? <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">{tab==='open'?'No open cases 🎉':'No incidents found'}</TableCell></TableRow>
                  : filtered.filter(r=>tab==='open'?['Open','Under Review'].includes(r.status):tab==='serious'?['Serious','Severe'].includes(r.severity):true).map((r:any)=>(
                    <TableRow key={r.id} className="group hover:bg-muted/30">
                      <TableCell>
                        <p className="font-medium text-sm">{r.student?.fullName||'—'}</p>
                        {r.student?.class?.name&&<p className="text-xs text-muted-foreground">{r.student.class.name}</p>}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{r.incidentType}</p>
                        {r.description&&<p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>}
                      </TableCell>
                      <TableCell><Badge className={`text-xs ${SEV_STYLES[r.severity]||''}`}>{r.severity}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{r.action||'—'}</Badge></TableCell>
                      <TableCell><Badge className={`text-xs ${STATUS_STYLES[r.status]||''}`}>{r.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.createdAt?new Date(r.createdAt).toLocaleDateString('en-PK'):'—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {r.status!=='Resolved'&&r.status!=='Closed'&&<Button variant="ghost" size="sm" className="h-7 text-green-600" onClick={()=>resolve(r.id)} title="Resolve"><CheckCircle2 className="h-3.5 w-3.5"/></Button>}
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

        <TabsContent value="repeat">
          {repeatOffenders.length===0?(
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-3 opacity-20"/><p>No repeat offenders — great discipline! 🎉</p></CardContent></Card>
          ):(
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repeatOffenders.map((s:any)=>(
                <Card key={s.id} className="border-l-4 border-l-orange-400">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-muted-foreground">{s.count} incidents recorded</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <p className="font-bold text-orange-600 text-lg">{s.count}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?'Edit Incident':'Record New Incident'}</DialogTitle>
            <DialogDescription>Document the disciplinary incident and action taken</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Student *</Label><Select value={form.studentId} onValueChange={v=>f('studentId',v)}><SelectTrigger><SelectValue placeholder="Select student"/></SelectTrigger><SelectContent>{students.map(s=><SelectItem key={s.id} value={s.id}>{s.fullName} — {s.class?.name||'—'}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Incident Type *</Label><Select value={form.incidentType} onValueChange={v=>f('incidentType',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{INCIDENT_TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Severity</Label><Select value={form.severity} onValueChange={v=>f('severity',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{SEVERITIES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Action Taken</Label><Select value={form.action} onValueChange={v=>f('action',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ACTIONS.map(a=><SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Action Date</Label><Input type="date" value={form.actionDate} onChange={e=>f('actionDate',e.target.value)}/></div>
            <div className="space-y-1"><Label>Reported By</Label><Input value={form.reportedBy} onChange={e=>f('reportedBy',e.target.value)} placeholder="Staff name"/></div>
            <div className="space-y-1"><Label>Follow-up Date</Label><Input type="date" value={form.followUpDate} onChange={e=>f('followUpDate',e.target.value)}/></div>
            {editing&&<div className="space-y-1 col-span-2"><Label>Status</Label><Select value={form.status} onValueChange={v=>f('status',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>}
            <div className="col-span-2 space-y-1"><Label>Description *</Label><Textarea rows={3} value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Describe the incident in detail..."/></div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" checked={form.parentInformed} onChange={e=>f('parentInformed',e.target.checked)} className="h-4 w-4 rounded"/>
              <Label className="cursor-pointer">Parent has been informed</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}{editing?'Save Changes':'Record Incident'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
