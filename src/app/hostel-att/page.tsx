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
import { Home, RefreshCw, CheckCircle2, Loader2, Users, Moon, Sun, AlertTriangle, ClipboardList } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const STATUSES = ['Present','Absent','On Leave','Overnight Pass'];
const STATUS_STYLES: Record<string,string> = {
  'Present':'bg-green-100 text-green-700','Absent':'bg-red-100 text-red-600',
  'On Leave':'bg-blue-100 text-blue-700','Overnight Pass':'bg-purple-100 text-purple-700',
};

export default function HostelAttendancePage() {
  const [records,  setRecords]  = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [date,     setDate]     = useState(new Date().toISOString().slice(0,10));
  const [session,  setSession]  = useState('Night');
  const [search,   setSearch]   = useState('');
  const [dialog,   setDialog]   = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('Present');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        fetch(`/api/hostel-att?date=${date}&session=${session}`),
        fetch('/api/students?limit=500&hostel=true'),
      ]);
      const [rData, sData] = await Promise.all([rRes.json(), sRes.json()]);
      if (rData.success) setRecords(rData.data?.items ?? rData.data ?? []);
      if (sData.success) setStudents(sData.data?.items ?? sData.data ?? []);
    } catch {} finally { setLoading(false); }
  }, [date, session]);

  useEffect(() => { load(); }, [load]);

  const markAttendance = async (studentId:string, status:string) => {
    try {
      const existing = records.find(r=>r.studentId===studentId);
      const url  = existing ? `/api/hostel-att/${existing.id}` : '/api/hostel-att';
      const res  = await fetch(url,{method:existing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId,date,session,status})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setRecords(prev => {
        const filtered = prev.filter(r=>r.studentId!==studentId);
        return [...filtered, data.data];
      });
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const markBulk = async () => {
    setSaving(true);
    try {
      await Promise.all(students.map(s => markAttendance(s.id, bulkStatus)));
      toast({title:`✅ Marked all as ${bulkStatus}`});
      setDialog(false);
    } finally { setSaving(false); }
  };

  const getStatus = (studentId:string) => records.find(r=>r.studentId===studentId)?.status||null;
  const marked   = records.length;
  const present  = records.filter(r=>r.status==='Present').length;
  const absent   = records.filter(r=>r.status==='Absent').length;
  const onLeave  = records.filter(r=>r.status==='On Leave'||r.status==='Overnight Pass').length;

  const filtered = students.filter(s => !search || s.fullName?.toLowerCase().includes(search.toLowerCase()) || s.admissionNumber?.includes(search));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Hostel Attendance" description="Mark and track daily hostel resident check-in/check-out"
        actions={<Button onClick={()=>setDialog(true)} variant="outline"><ClipboardList className="h-4 w-4 mr-2"/>Bulk Mark</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Present',  value:present,              icon:CheckCircle2,  color:'text-green-600',  bg:'bg-green-50'},
          {label:'Absent',   value:absent,               icon:AlertTriangle, color:'text-red-600',    bg:'bg-red-50'},
          {label:'On Leave', value:onLeave,              icon:Moon,          color:'text-purple-600', bg:'bg-purple-50'},
          {label:'Marked',   value:`${marked}/${students.length}`,icon:Users,color:'text-blue-600',  bg:'bg-blue-50'},
        ].map(s=>(
          <Card key={s.label} className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`}/></div>
            <div><p className="font-bold text-lg">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Date:</Label>
          <Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-40 h-9"/>
        </div>
        <div className="flex gap-1">
          {['Morning','Night'].map(s=>(
            <Button key={s} variant={session===s?'default':'outline'} size="sm" className="h-9" onClick={()=>setSession(s)}>
              {s==='Morning'?<Sun className="h-4 w-4 mr-1.5"/>:<Moon className="h-4 w-4 mr-1.5"/>}{s}
            </Button>
          ))}
        </div>
        <div className="relative ml-auto"><Input className="w-48 h-9" placeholder="Search students..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <Button variant="outline" size="sm" className="h-9" onClick={load}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Student</TableHead><TableHead>Room</TableHead><TableHead>Class</TableHead>
            <TableHead>Status</TableHead><TableHead>Mark Attendance</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading?Array.from({length:8}).map((_,i)=><TableRow key={i}><TableCell colSpan={5}><div className="h-8 bg-muted/40 rounded animate-pulse"/></TableCell></TableRow>)
            :filtered.length===0?<TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No hostel residents found. Make sure students are registered as hostel boarders.</TableCell></TableRow>
            :filtered.map((s:any)=>{
              const status = getStatus(s.id);
              return (
                <TableRow key={s.id} className={`hover:bg-muted/30 ${status==='Absent'?'bg-red-50/30':status==='Present'?'bg-green-50/20':''}`}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">{s.fullName?.[0]}</div>
                      <div><p className="font-medium text-sm">{s.fullName}</p><p className="text-xs text-muted-foreground">{s.admissionNumber}</p></div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{s.roomNumber||'—'}</TableCell>
                  <TableCell className="text-sm">{s.class?.name||'—'}</TableCell>
                  <TableCell>
                    {status
                      ?<Badge className={`text-xs ${STATUS_STYLES[status]||''}`}>{status}</Badge>
                      :<span className="text-xs text-muted-foreground">Not marked</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {STATUSES.map(st=>(
                        <button key={st} onClick={()=>markAttendance(s.id,st)}
                          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${status===st?'bg-blue-600 text-white border-blue-600':'border-border hover:border-blue-400 hover:bg-blue-50'}`}>
                          {st==='Present'?'✓':st==='Absent'?'✗':st==='On Leave'?'L':'OP'}
                        </button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bulk Mark Attendance</DialogTitle><DialogDescription>Mark all hostel residents with the same status</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Mark all as:</Label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map(s=>(
                  <button key={s} onClick={()=>setBulkStatus(s)}
                    className={`py-2.5 text-sm rounded-xl border transition-colors ${bulkStatus===s?'bg-blue-600 text-white border-blue-600':'border-border hover:border-blue-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">This will mark all <strong>{students.length}</strong> residents as <strong>{bulkStatus}</strong> for {date} ({session})</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button>
            <Button onClick={markBulk} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}Mark All {bulkStatus}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
