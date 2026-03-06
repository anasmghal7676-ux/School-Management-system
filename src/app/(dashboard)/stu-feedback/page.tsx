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
import { MessageSquare, Plus, Star, RefreshCw, TrendingUp, ThumbsUp, ThumbsDown, BarChart3, Loader2, Eye } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['Teaching Quality','Facilities','School Environment','Curriculum','Extracurricular','Safety','Communication','Canteen','Transport','Administration','Other'];
const EMPTY = { category:'Teaching Quality', subject:'', feedback:'', rating:5, isAnonymous:false, classId:'', response:'' };

function StarRating({ value, onChange }: { value:number; onChange?:(v:number)=>void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={()=>onChange?.(n)} className={onChange?'cursor-pointer':''}>
          <Star className={`h-5 w-5 ${n<=value?'fill-amber-400 text-amber-400':'text-gray-200'}`}/>
        </button>
      ))}
    </div>
  );
}

export default function StudentFeedbackPage() {
  const [items,   setItems]   = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');
  const [catF,    setCatF]    = useState('');
  const [dialog,  setDialog]  = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [form,    setForm]    = useState<any>(EMPTY);
  const f = (k:string,v:any) => setForm((p:any) => ({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, cRes] = await Promise.all([fetch('/api/stu-feedback?limit=200'), fetch('/api/classes')]);
      const [fData, cData] = await Promise.all([fRes.json(), cRes.json()]);
      if (fData.success) setItems(fData.data?.items ?? fData.data ?? []);
      if (cData.success) setClasses(cData.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.feedback) { toast({title:'Feedback text is required',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const res  = await fetch('/api/stu-feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:'✅ Feedback submitted. Thank you!'});
      setDialog(false); setForm(EMPTY); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const respond = async (id:string, response:string) => {
    try {
      const res  = await fetch(`/api/stu-feedback/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({response,status:'Reviewed'})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:'✅ Response saved'}); setViewing(null); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const filtered = items.filter(r =>
    (!search||(r.subject||'').toLowerCase().includes(search.toLowerCase())||(r.feedback||'').toLowerCase().includes(search.toLowerCase())) &&
    (!catF||r.category===catF)
  );

  const avgRating = items.length ? (items.reduce((s,r)=>s+(r.rating||0),0)/items.length).toFixed(1) : '0.0';
  const positive  = items.filter(r=>(r.rating||0)>=4).length;
  const negative  = items.filter(r=>(r.rating||0)<=2).length;
  const unreviewed= items.filter(r=>r.status!=='Reviewed').length;

  const avgByCat = CATEGORIES.map(c=>{
    const catItems = items.filter(r=>r.category===c);
    if (!catItems.length) return null;
    return {name:c, avg:(catItems.reduce((s,r)=>s+(r.rating||0),0)/catItems.length).toFixed(1), count:catItems.length};
  }).filter(Boolean).sort((a:any,b:any)=>parseFloat(b.avg)-parseFloat(a.avg));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Student Feedback" description="Collect and analyze feedback from students on school experience"
        actions={<Button onClick={()=>{setForm(EMPTY);setDialog(true);}}><Plus className="h-4 w-4 mr-2"/>Submit Feedback</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Average Rating',  value:`${avgRating} / 5`,  icon:Star,       color:'text-amber-500', bg:'bg-amber-50'},
          {label:'Positive (4-5★)', value:positive,            icon:ThumbsUp,   color:'text-green-600', bg:'bg-green-50'},
          {label:'Negative (1-2★)', value:negative,            icon:ThumbsDown, color:'text-red-600',   bg:'bg-red-50'},
          {label:'Awaiting Review', value:unreviewed,          icon:MessageSquare,color:'text-blue-600',bg:'bg-blue-50'},
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
            <TabsTrigger value="list">All Feedback</TabsTrigger>
            <TabsTrigger value="analytics">Category Ratings</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 ml-auto">
            <div className="relative"><Input className="w-48 h-9" placeholder="Search feedback..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <Select value={catF} onValueChange={setCatF}><SelectTrigger className="w-40 h-9"><SelectValue placeholder="All categories"/></SelectTrigger><SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="sm" className="h-9" onClick={load}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
          </div>
        </div>

        <TabsContent value="list">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Category</TableHead><TableHead>Feedback</TableHead><TableHead>Rating</TableHead>
                <TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading?Array.from({length:5}).map((_,i)=><TableRow key={i}><TableCell colSpan={6}><div className="h-8 bg-muted/40 rounded animate-pulse"/></TableCell></TableRow>)
                :filtered.length===0?<TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No feedback submitted yet</TableCell></TableRow>
                :filtered.map((r:any)=>(
                  <TableRow key={r.id} className="group hover:bg-muted/30">
                    <TableCell><Badge variant="outline" className="text-xs">{r.category}</Badge></TableCell>
                    <TableCell className="max-w-xs">
                      {r.subject&&<p className="font-medium text-sm mb-0.5">{r.subject}</p>}
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.feedback}</p>
                    </TableCell>
                    <TableCell><StarRating value={r.rating||0}/></TableCell>
                    <TableCell>
                      {r.status==='Reviewed'
                        ?<Badge className="bg-green-100 text-green-700 text-xs">Reviewed</Badge>
                        :<Badge className="bg-amber-100 text-amber-700 text-xs">Pending</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.createdAt?new Date(r.createdAt).toLocaleDateString('en-PK'):'—'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 opacity-0 group-hover:opacity-100" onClick={()=>setViewing(r)}><Eye className="h-3.5 w-3.5 mr-1"/>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="text-sm">Average Rating by Category</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {avgByCat.length===0?<p className="text-sm text-muted-foreground">No data yet</p>:avgByCat.map((c:any)=>(
                  <div key={c.name} className="flex items-center gap-3">
                    <p className="text-sm font-medium w-36 shrink-0 truncate">{c.name}</p>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${parseFloat(c.avg)>=4?'bg-green-500':parseFloat(c.avg)>=3?'bg-amber-400':'bg-red-400'}`} style={{width:`${(parseFloat(c.avg)/5)*100}%`}}/>
                    </div>
                    <p className="text-sm font-bold w-8">{c.avg}</p>
                    <p className="text-xs text-muted-foreground">({c.count})</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-sm">Rating Distribution</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {[5,4,3,2,1].map(r=>{
                  const count = items.filter(i=>(i.rating||0)===r).length;
                  const pct   = items.length ? (count/items.length)*100 : 0;
                  return (
                    <div key={r} className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5 w-20 shrink-0">
                        {Array.from({length:r}).map((_,i)=><Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400"/>)}
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{width:`${pct}%`}}/>
                      </div>
                      <p className="text-xs text-muted-foreground w-6">{count}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Submit Feedback</DialogTitle><DialogDescription>Share your experience to help us improve</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Category</Label><Select value={form.category} onValueChange={v=>f('category',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label>Subject (optional)</Label><Input value={form.subject} onChange={e=>f('subject',e.target.value)} placeholder="Brief title"/></div>
            <div className="space-y-1"><Label>Your Rating</Label><StarRating value={form.rating} onChange={v=>f('rating',v)}/></div>
            <div className="space-y-1"><Label>Feedback *</Label><Textarea rows={4} value={form.feedback} onChange={e=>f('feedback',e.target.value)} placeholder="Share your thoughts..."/></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.isAnonymous} onChange={e=>f('isAnonymous',e.target.checked)} className="h-4 w-4"/><Label>Submit anonymously</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View & Respond Dialog */}
      {viewing&&(
        <Dialog open={true} onOpenChange={()=>setViewing(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Feedback Details</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{viewing.category}</Badge>
                <StarRating value={viewing.rating||0}/>
              </div>
              {viewing.subject&&<p className="font-semibold">{viewing.subject}</p>}
              <p className="text-sm bg-muted/30 rounded-xl p-4 leading-relaxed">{viewing.feedback}</p>
              {viewing.response&&<div className="bg-blue-50 rounded-xl p-3"><p className="text-xs font-semibold text-blue-700 mb-1">Staff Response</p><p className="text-sm text-blue-800">{viewing.response}</p></div>}
              <div className="space-y-1"><Label>Respond to this feedback</Label><Textarea rows={3} id="resp-text" placeholder="Write a response..."/></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setViewing(null)}>Close</Button>
              <Button onClick={()=>{const t=document.getElementById('resp-text') as HTMLTextAreaElement;respond(viewing.id,t.value);}}>Save Response</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
