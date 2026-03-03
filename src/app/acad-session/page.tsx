'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Edit2, Loader2, CheckCircle2, Clock, BookOpen, RefreshCw, AlertTriangle, Star } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const EMPTY_YEAR = { name:'', startDate:'', endDate:'', description:'' };
const EMPTY_TERM = { name:'', startDate:'', endDate:'', academicYearId:'', description:'' };

export default function AcademicSessionPage() {
  const [years,    setYears]    = useState<any[]>([]);
  const [terms,    setTerms]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [yearDlg,  setYearDlg]  = useState(false);
  const [termDlg,  setTermDlg]  = useState(false);
  const [editYear, setEditYear] = useState<any>(null);
  const [editTerm, setEditTerm] = useState<any>(null);
  const [activeDlg, setActiveDlg] = useState<any>(null);
  const [yearForm,  setYearForm]  = useState<any>(EMPTY_YEAR);
  const [termForm,  setTermForm]  = useState<any>(EMPTY_TERM);
  const yf = (k:string,v:string) => setYearForm((p:any) => ({...p,[k]:v}));
  const tf = (k:string,v:string) => setTermForm((p:any) => ({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [yRes, tRes] = await Promise.all([fetch('/api/acad-years'), fetch('/api/terms')]);
      const [yData, tData] = await Promise.all([yRes.json(), tRes.json()]);
      if (yData.success) setYears(yData.data ?? []);
      if (tData.success) setTerms(tData.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAddYear  = () => { setEditYear(null); setYearForm(EMPTY_YEAR); setYearDlg(true); };
  const openEditYear = (y:any) => { setEditYear(y); setYearForm({name:y.name,startDate:y.startDate.slice(0,10),endDate:y.endDate.slice(0,10),description:y.description||''}); setYearDlg(true); };
  const openAddTerm  = (yearId?:string) => { setEditTerm(null); setTermForm({...EMPTY_TERM,academicYearId:yearId||years.find(y=>y.isCurrent)?.id||''}); setTermDlg(true); };
  const openEditTerm = (t:any) => { setEditTerm(t); setTermForm({name:t.name,startDate:t.startDate.slice(0,10),endDate:t.endDate.slice(0,10),academicYearId:t.academicYearId,description:t.description||''}); setTermDlg(true); };

  const saveYear = async () => {
    if (!yearForm.name||!yearForm.startDate||!yearForm.endDate) { toast({title:'All fields required',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const url  = editYear ? `/api/acad-years/${editYear.id}` : '/api/acad-years';
      const res  = await fetch(url,{method:editYear?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(yearForm)});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Academic year ${editYear?'updated':'created'}`});
      setYearDlg(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const saveTerm = async () => {
    if (!termForm.name||!termForm.startDate||!termForm.endDate||!termForm.academicYearId) { toast({title:'All fields required',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const url  = editTerm ? `/api/terms/${editTerm.id}` : '/api/terms';
      const res  = await fetch(url,{method:editTerm?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(termForm)});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Term ${editTerm?'updated':'created'}`});
      setTermDlg(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const setActive = async () => {
    if (!activeDlg) return;
    try {
      const res  = await fetch(`/api/acad-years/${activeDlg.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({isCurrent:true})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ ${activeDlg.name} set as current year`});
      setActiveDlg(null); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const currentYear = years.find(y=>y.isCurrent);
  const today = new Date();

  const getDaysRemaining = (endDate:string) => {
    const end  = new Date(endDate);
    const days = Math.ceil((end.getTime()-today.getTime())/(86400000));
    return days;
  };

  const getProgress = (startDate:string, endDate:string) => {
    const start = new Date(startDate).getTime();
    const end   = new Date(endDate).getTime();
    const now   = today.getTime();
    return Math.max(0, Math.min(100, ((now-start)/(end-start))*100));
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Academic Sessions" description="Manage academic years, terms and examination sessions"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={()=>openAddTerm()}><Plus className="h-4 w-4 mr-2"/>Add Term</Button>
            <Button onClick={openAddYear}><Plus className="h-4 w-4 mr-2"/>Add Year</Button>
          </div>
        }
      />

      {/* Current Year Banner */}
      {currentYear&&(
        <Card className="border-l-4 border-l-green-500 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center"><Star className="h-5 w-5 text-green-600"/></div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{currentYear.name}</p>
                    <Badge className="bg-green-600 text-white text-xs">Current Year</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{new Date(currentYear.startDate).toLocaleDateString('en-PK',{month:'long',year:'numeric'})} → {new Date(currentYear.endDate).toLocaleDateString('en-PK',{month:'long',year:'numeric'})}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700">{getDaysRemaining(currentYear.endDate)}<span className="text-sm font-normal text-muted-foreground ml-1">days left</span></p>
                <div className="w-48 h-2 bg-green-200 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full" style={{width:`${getProgress(currentYear.startDate,currentYear.endDate)}%`}}/>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="years">
        <TabsList className="mb-4">
          <TabsTrigger value="years">Academic Years</TabsTrigger>
          <TabsTrigger value="terms">Terms & Semesters</TabsTrigger>
        </TabsList>

        <TabsContent value="years">
          <div className="space-y-3">
            {loading?Array.from({length:3}).map((_,i)=><div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse"/>)
            :years.length===0?<Card><CardContent className="py-12 text-center text-muted-foreground">No academic years yet. Add your first one.</CardContent></Card>
            :years.sort((a,b)=>b.name.localeCompare(a.name)).map((y:any)=>{
              const progress   = getProgress(y.startDate,y.endDate);
              const termCount  = terms.filter(t=>t.academicYearId===y.id).length;
              const daysLeft   = getDaysRemaining(y.endDate);
              const isActive   = y.isCurrent;
              const isPast     = new Date(y.endDate) < today;
              return (
                <Card key={y.id} className={`card-hover ${isActive?'border-green-300':''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isActive?'bg-green-100':'bg-muted/50'}`}>
                          <Calendar className={`h-5 w-5 ${isActive?'text-green-600':'text-muted-foreground'}`}/>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold">{y.name}</p>
                            {isActive&&<Badge className="bg-green-600 text-white text-xs">Current</Badge>}
                            {isPast&&!isActive&&<Badge variant="secondary" className="text-xs">Past</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{new Date(y.startDate).toLocaleDateString('en-PK')} — {new Date(y.endDate).toLocaleDateString('en-PK')}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{termCount} term{termCount!==1?'s':''} configured</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isActive&&!isPast&&<Button variant="outline" size="sm" className="h-7 text-xs" onClick={()=>setActiveDlg(y)}>Set Active</Button>}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={()=>openEditYear(y)}><Edit2 className="h-3.5 w-3.5"/></Button>
                      </div>
                    </div>
                    {isActive&&(
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Year Progress</span><span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{width:`${progress}%`}}/>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="terms">
          {years.map((y:any)=>{
            const yearTerms = terms.filter(t=>t.academicYearId===y.id);
            if (!yearTerms.length) return null;
            return (
              <div key={y.id} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground"/>{y.name}
                    {y.isCurrent&&<Badge className="bg-green-600 text-white text-xs">Current</Badge>}
                  </h3>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={()=>openAddTerm(y.id)}><Plus className="h-3.5 w-3.5 mr-1"/>Add Term</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {yearTerms.map((t:any)=>{
                    const now  = new Date();
                    const start = new Date(t.startDate);
                    const end   = new Date(t.endDate);
                    const isNow = now >= start && now <= end;
                    const isPast= now > end;
                    return (
                      <Card key={t.id} className={`card-hover ${isNow?'border-blue-300':''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">{t.name}</p>
                            {isNow&&<Badge className="bg-blue-100 text-blue-700 text-xs">Current</Badge>}
                            {isPast&&<Badge variant="secondary" className="text-xs">Past</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{new Date(t.startDate).toLocaleDateString('en-PK')} — {new Date(t.endDate).toLocaleDateString('en-PK')}</p>
                          {isNow&&(
                            <div className="mt-2">
                              <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{width:`${getProgress(t.startDate,t.endDate)}%`}}/>
                              </div>
                            </div>
                          )}
                          <Button variant="ghost" size="sm" className="h-6 text-xs mt-2 -ml-1" onClick={()=>openEditTerm(t)}><Edit2 className="h-3 w-3 mr-1"/>Edit</Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {loading&&<div className="h-32 bg-muted/30 rounded-xl animate-pulse"/>}
        </TabsContent>
      </Tabs>

      {/* Academic Year Dialog */}
      <Dialog open={yearDlg} onOpenChange={setYearDlg}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editYear?'Edit Academic Year':'Add Academic Year'}</DialogTitle><DialogDescription>Define the start and end dates for this academic session</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Year Name *</Label><Input value={yearForm.name} onChange={e=>yf('name',e.target.value)} placeholder="e.g. 2025-26"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Start Date *</Label><Input type="date" value={yearForm.startDate} onChange={e=>yf('startDate',e.target.value)}/></div>
              <div className="space-y-1"><Label>End Date *</Label><Input type="date" value={yearForm.endDate} onChange={e=>yf('endDate',e.target.value)}/></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setYearDlg(false)}>Cancel</Button>
            <Button onClick={saveYear} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Term Dialog */}
      <Dialog open={termDlg} onOpenChange={setTermDlg}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editTerm?'Edit Term':'Add Term'}</DialogTitle><DialogDescription>Define a term or semester within an academic year</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Term Name *</Label><Input value={termForm.name} onChange={e=>tf('name',e.target.value)} placeholder="e.g. Term 1 / First Semester"/></div>
            <div className="space-y-1"><Label>Academic Year *</Label>
              <select value={termForm.academicYearId} onChange={e=>tf('academicYearId',e.target.value)} className="w-full h-9 border rounded-lg px-3 text-sm bg-background">
                <option value="">Select year...</option>
                {years.map(y=><option key={y.id} value={y.id}>{y.name}{y.isCurrent?' (Current)':''}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Start Date *</Label><Input type="date" value={termForm.startDate} onChange={e=>tf('startDate',e.target.value)}/></div>
              <div className="space-y-1"><Label>End Date *</Label><Input type="date" value={termForm.endDate} onChange={e=>tf('endDate',e.target.value)}/></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setTermDlg(false)}>Cancel</Button>
            <Button onClick={saveTerm} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Active Confirmation */}
      <AlertDialog open={!!activeDlg} onOpenChange={()=>setActiveDlg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as Current Year?</AlertDialogTitle>
            <AlertDialogDescription>This will mark <strong>{activeDlg?.name}</strong> as the active academic year. The previous current year will be deactivated.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={setActive} className="bg-green-600 hover:bg-green-700">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
