'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Printer, RefreshCw, Trash2, Plus, Clock, BookOpen, User, Calendar, Grid3X3, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const DAYS     = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS  = [1, 2, 3, 4, 5, 6, 7, 8];
const PERIOD_TIMES = ['08:00–08:45','08:50–09:35','09:40–10:25','10:40–11:25','11:30–12:15','12:20–13:05','13:50–14:35','14:40–15:25'];
const COLORS   = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-emerald-100 border-emerald-300 text-emerald-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-rose-100 border-rose-300 text-rose-800',
  'bg-cyan-100 border-cyan-300 text-cyan-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-teal-100 border-teal-300 text-teal-800',
];

const BREAK_PERIODS = [3, 6]; // after period 3 (recess) and 6 (lunch)

export default function ClassTimetablePage() {
  const [classes,  setClasses]  = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staff,    setStaff]    = useState<any[]>([]);
  const [periods,  setPeriods]  = useState<any[]>([]);
  const [classId,  setClassId]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [dialog,   setDialog]   = useState(false);
  const [editCell, setEditCell] = useState<{day:string; period:number}|null>(null);
  const [form,     setForm]     = useState({ subjectId:'', teacherId:'', startTime:'', endTime:'', room:'' });
  const f = (k:string,v:string) => setForm(p => ({...p,[k]:v}));

  // Load class list on mount
  useEffect(() => {
    fetch('/api/classes').then(r=>r.json()).then(d => {
      setClasses(d.data ?? d.classes ?? []);
    }).catch(()=>{});
  }, []);

  // Load timetable when class selected
  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const [tRes, sRes, stRes] = await Promise.all([
        fetch(`/api/cls-timetable?classId=${classId}`),
        fetch('/api/subjects'),
        fetch('/api/staff?limit=100&status=active'),
      ]);
      const [tData, sData, stData] = await Promise.all([tRes.json(), sRes.json(), stRes.json()]);
      setPeriods(tData.data?.periods ?? tData.periods ?? []);
      setSubjects(sData.data ?? []);
      setStaff(stData.data?.items ?? stData.data ?? []);
    } catch { toast({title:'Failed to load timetable', variant:'destructive'}); }
    finally { setLoading(false); }
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  const openCell = (day:string, period:number) => {
    const existing = periods.find(p=>p.day===day&&p.period===period);
    setEditCell({day, period});
    setForm(existing
      ? {subjectId:existing.subjectId||'',teacherId:existing.teacherId||'',startTime:existing.startTime||'',endTime:existing.endTime||'',room:existing.room||''}
      : {subjectId:'',teacherId:'',startTime:PERIOD_TIMES[period-1]?.split('–')[0]||'',endTime:PERIOD_TIMES[period-1]?.split('–')[1]||'',room:''}
    );
    setDialog(true);
  };

  const save = async () => {
    if (!form.subjectId||!editCell) { toast({title:'Subject required',variant:'destructive'}); return; }
    setSaving(true);
    const subject = subjects.find(s=>s.id===form.subjectId);
    const teacher = staff.find(s=>s.id===form.teacherId);
    try {
      const existing = periods.find(p=>p.day===editCell.day&&p.period===editCell.period);
      const url   = existing ? `/api/cls-timetable/${existing.id}` : '/api/cls-timetable';
      const payload = { ...form, classId, day:editCell.day, period:editCell.period,
        subjectName:subject?.name||'', teacherName:teacher?.fullName||'' };
      const res  = await fetch(url,{method:existing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:'✅ Period saved'});
      setDialog(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const deleteCell = async (day:string, period:number) => {
    const existing = periods.find(p=>p.day===day&&p.period===period);
    if (!existing) return;
    try {
      const res  = await fetch(`/api/cls-timetable/${existing.id}`,{method:'DELETE'});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:'✅ Period cleared'}); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const getPeriod = (day:string, p:number) => periods.find(x=>x.day===day&&x.period===p);
  const getSubjectColorIdx = (subjectId:string) => {
    const idx = subjects.findIndex(s=>s.id===subjectId);
    return idx>=0 ? idx % COLORS.length : 0;
  };

  // Per-day stats
  const dayStats = DAYS.map(d=>({
    day:d,
    count:periods.filter(p=>p.day===d).length,
    subjects:[...new Set(periods.filter(p=>p.day===d).map(p=>p.subjectName))],
  }));

  // Teacher load
  const teacherLoad = staff.map(t=>({
    name:t.fullName,
    periods:periods.filter(p=>p.teacherId===t.id).length,
    days:[...new Set(periods.filter(p=>p.teacherId===t.id).map(p=>p.day))].length,
  })).filter(t=>t.periods>0).sort((a,b)=>b.periods-a.periods);

  const selectedClass = classes.find(c=>c.id===classId);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Class Timetable" description="Build and manage weekly class schedules period-by-period"
        actions={
          <div className="flex gap-2">
            {classId&&<Button variant="outline" onClick={()=>window.print()}><Printer className="h-4 w-4 mr-2"/>Print</Button>}
            <Button variant="outline" size="sm" onClick={load} disabled={!classId}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
          </div>
        }
      />

      {/* Class Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-muted-foreground"/>
              <Label className="text-sm font-medium">Select Class</Label>
            </div>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Choose a class to view timetable..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedClass&&<Badge variant="outline" className="text-sm py-1 px-3">{periods.length} periods scheduled</Badge>}
          </div>
        </CardContent>
      </Card>

      {!classId ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20"/>
          <p className="text-lg font-medium">Select a class to view its timetable</p>
          <p className="text-sm mt-1">Choose from the dropdown above to get started</p>
        </CardContent></Card>
      ) : (
        <Tabs defaultValue="grid">
          <TabsList className="mb-4">
            <TabsTrigger value="grid">Timetable Grid</TabsTrigger>
            <TabsTrigger value="stats">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            {loading ? (
              <div className="space-y-2">{Array.from({length:6}).map((_,i)=><div key={i} className="h-12 bg-muted/30 rounded-xl animate-pulse"/>)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="p-3 text-left font-semibold text-muted-foreground bg-muted/30 rounded-tl-xl w-32">Period</th>
                      {DAYS.map(d=>(
                        <th key={d} className="p-3 text-center font-semibold bg-muted/30 min-w-[130px]">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map(p=>(
                      <React.Fragment key={p}>
                        <tr className="border-t border-border/50">
                          <td className="p-2 bg-muted/10">
                            <div className="text-xs font-semibold text-center">P{p}</div>
                            <div className="text-xs text-muted-foreground text-center mt-0.5">{PERIOD_TIMES[p-1]}</div>
                          </td>
                          {DAYS.map(day=>{
                            const slot = getPeriod(day, p);
                            const colorClass = slot ? COLORS[getSubjectColorIdx(slot.subjectId)] : '';
                            return (
                              <td key={day} className="p-1.5">
                                {slot ? (
                                  <div className={`relative group rounded-xl border p-2 cursor-pointer hover:shadow-md transition-all ${colorClass}`}
                                    onClick={()=>openCell(day, p)}>
                                    <div className="font-semibold text-xs truncate">{slot.subjectName||'—'}</div>
                                    {slot.teacherName&&<div className="text-xs opacity-75 truncate mt-0.5">{slot.teacherName.split(' ').slice(-1)[0]}</div>}
                                    {slot.room&&<div className="text-xs opacity-60 mt-0.5">Room {slot.room}</div>}
                                    <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={e=>{e.stopPropagation();deleteCell(day,p);}}>
                                      <X className="h-3.5 w-3.5"/>
                                    </button>
                                  </div>
                                ) : (
                                  <button className="w-full h-16 rounded-xl border-2 border-dashed border-border/40 hover:border-blue-400 hover:bg-blue-50 transition-all text-muted-foreground hover:text-blue-500 flex items-center justify-center"
                                    onClick={()=>openCell(day, p)}>
                                    <Plus className="h-4 w-4"/>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        {BREAK_PERIODS.includes(p) && (
                          <tr key={`break-${p}`} className="border-t border-border/30">
                            <td className="py-1 px-2 bg-amber-50">
                              <div className="text-xs text-amber-600 font-medium text-center">{p===3?'Recess':'Lunch'}</div>
                            </td>
                            <td colSpan={DAYS.length} className="py-1 bg-amber-50/50">
                              <div className="text-xs text-amber-500 text-center">{p===3?'10:25–10:40 · Break':'13:05–13:50 · Lunch Break'}</div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">Periods Per Day</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {dayStats.map(d=>(
                    <div key={d.day}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{d.day}</span>
                        <span className="text-muted-foreground">{d.count}/{PERIODS.length}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{width:`${(d.count/PERIODS.length)*100}%`}}/>
                      </div>
                      {d.subjects.length>0&&<div className="flex gap-1 mt-1 flex-wrap">
                        {d.subjects.map(s=><Badge key={s} variant="outline" className="text-xs py-0">{s}</Badge>)}
                      </div>}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">Teacher Load</CardTitle></CardHeader>
                <CardContent>
                  {teacherLoad.length===0?<p className="text-sm text-muted-foreground">No teachers assigned yet</p>
                  :<div className="space-y-2">
                    {teacherLoad.map(t=>(
                      <div key={t.name} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.days} day{t.days!==1?'s':''}</p>
                        </div>
                        <Badge variant="secondary">{t.periods} periods</Badge>
                      </div>
                    ))}
                  </div>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editCell?.day} — Period {editCell?.period}</DialogTitle>
            <DialogDescription>
              {PERIOD_TIMES[(editCell?.period||1)-1]} · {selectedClass?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Subject *</Label>
              <Select value={form.subjectId} onValueChange={v=>f('subjectId',v)}>
                <SelectTrigger><SelectValue placeholder="Select subject"/></SelectTrigger>
                <SelectContent>
                  {subjects.map(s=><SelectItem key={s.id} value={s.id}><span className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5"/>{s.name}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Teacher</Label>
              <Select value={form.teacherId} onValueChange={v=>f('teacherId',v)}>
                <SelectTrigger><SelectValue placeholder="Assign teacher"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No teacher</SelectItem>
                  {staff.map(s=><SelectItem key={s.id} value={s.id}><span className="flex items-center gap-2"><User className="h-3.5 w-3.5"/>{s.fullName}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Start Time</Label><Input type="time" value={form.startTime.replace('–','')} onChange={e=>f('startTime',e.target.value)}/></div>
              <div className="space-y-1"><Label>End Time</Label><Input type="time" value={form.endTime} onChange={e=>f('endTime',e.target.value)}/></div>
            </div>
            <div className="space-y-1"><Label>Room / Lab</Label><Input value={form.room} onChange={e=>f('room',e.target.value)} placeholder="e.g. 201, Science Lab"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}Save Period</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
