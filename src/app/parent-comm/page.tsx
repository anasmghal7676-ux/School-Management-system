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
import { MessageSquare, Plus, Send, Search, RefreshCw, Mail, Phone, Bell, Users, CheckCircle2, Clock, Loader2, Megaphone } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const TYPES    = ['General Notice','Fee Reminder','Academic Update','Disciplinary Notice','Event Invitation','Health Alert','Progress Report','Attendance Alert','Emergency','Other'];
const CHANNELS = ['SMS','Email','WhatsApp','App Notification','Letter'];
const CHANNEL_ICONS: Record<string,any> = { 'SMS':Phone, 'Email':Mail, 'WhatsApp':MessageSquare, 'App Notification':Bell, 'Letter':Send };
const STATUS_STYLES: Record<string,string> = { 'Sent':'bg-green-100 text-green-700', 'Scheduled':'bg-blue-100 text-blue-700', 'Draft':'bg-gray-100 text-gray-600', 'Failed':'bg-red-100 text-red-600' };
const EMPTY = { subject:'', body:'', messageType:'General Notice', channel:'SMS', targetType:'all', classId:'', studentId:'', priority:'Normal', scheduledAt:'' };

export default function ParentCommunicationPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes,  setClasses]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [dialog,   setDialog]   = useState(false);
  const [form,     setForm]     = useState<any>(EMPTY);
  const f = (k:string,v:string) => setForm((p:any) => ({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, sRes, cRes] = await Promise.all([
        fetch('/api/parent-comm?limit=100'),
        fetch('/api/students?limit=300&status=active'),
        fetch('/api/classes'),
      ]);
      const [mData, sData, cData] = await Promise.all([mRes.json(), sRes.json(), cRes.json()]);
      if (mData.success) setMessages(mData.data?.items ?? mData.data ?? []);
      if (sData.success) setStudents(sData.data?.items ?? sData.data ?? []);
      if (cData.success) setClasses(cData.data ?? []);
    } catch { toast({title:'Failed to load',variant:'destructive'}); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!form.subject||!form.body||!form.channel) { toast({title:'Subject, body and channel required',variant:'destructive'}); return; }
    setSending(true);
    try {
      const res  = await fetch('/api/parent-comm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Message ${form.scheduledAt?'scheduled':'sent'} successfully`});
      setDialog(false); setForm(EMPTY); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSending(false); }
  };

  const filtered = messages.filter(m =>
    !search || m.subject?.toLowerCase().includes(search.toLowerCase()) || m.messageType?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    sent:      messages.filter(m=>m.status==='Sent').length,
    scheduled: messages.filter(m=>m.status==='Scheduled').length,
    draft:     messages.filter(m=>m.status==='Draft').length,
    recipients:messages.reduce((s,m)=>s+(m.recipientCount||0),0),
  };

  const byChannel = CHANNELS.map(c=>({name:c,count:messages.filter(m=>m.channel===c).length})).filter(c=>c.count>0);
  const byType    = TYPES.map(t=>({name:t,count:messages.filter(m=>m.messageType===t).length})).filter(t=>t.count>0);

  const recipientLabel = () => {
    if (form.targetType==='all') return 'All Parents';
    if (form.targetType==='class' && form.classId) return classes.find(c=>c.id===form.classId)?.name||'Selected Class';
    if (form.targetType==='student' && form.studentId) return students.find(s=>s.id===form.studentId)?.fullName||'Selected Student';
    return '—';
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Parent Communication" description="Send targeted messages to parents via multiple channels"
        actions={<Button onClick={()=>{setForm(EMPTY);setDialog(true);}}><Plus className="h-4 w-4 mr-2"/>New Message</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Sent',       value:stats.sent,       icon:CheckCircle2,color:'text-green-600',bg:'bg-green-50'},
          {label:'Scheduled',  value:stats.scheduled,  icon:Clock,       color:'text-blue-600', bg:'bg-blue-50'},
          {label:'Draft',      value:stats.draft,      icon:MessageSquare,color:'text-gray-600',bg:'bg-gray-50'},
          {label:'Total Recipients',value:stats.recipients.toLocaleString(),icon:Users,color:'text-purple-600',bg:'bg-purple-50'},
        ].map(s=>(
          <Card key={s.label} className="card-hover"><CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`}/></div>
            <div><p className="font-bold text-lg">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="messages">
        <div className="flex items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="messages">All Messages</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <div className="relative ml-auto"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-8 w-56 h-9" placeholder="Search messages..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <Button variant="outline" size="sm" className="h-9" onClick={load}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
        </div>

        <TabsContent value="messages">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Subject</TableHead><TableHead>Type</TableHead><TableHead>Channel</TableHead>
                <TableHead>Recipients</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({length:5}).map((_,i)=>(
                  <TableRow key={i}><TableCell colSpan={6}><div className="h-8 bg-muted/40 rounded animate-pulse"/></TableCell></TableRow>
                )) : filtered.length===0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-20"/>
                    <p className="font-medium">No messages yet</p>
                    <p className="text-sm mt-1">Send your first parent communication</p>
                    <Button className="mt-4" onClick={()=>{setForm(EMPTY);setDialog(true);}}><Plus className="h-4 w-4 mr-2"/>New Message</Button>
                  </TableCell></TableRow>
                ) : filtered.map((m:any) => {
                  const ChIcon = CHANNEL_ICONS[m.channel]||Send;
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/30">
                      <TableCell>
                        <p className="font-medium text-sm">{m.subject}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{m.body}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{m.messageType}</Badge></TableCell>
                      <TableCell><div className="flex items-center gap-1.5 text-sm"><ChIcon className="h-3.5 w-3.5 text-muted-foreground"/>{m.channel}</div></TableCell>
                      <TableCell className="text-sm">{m.recipientCount||0} parents</TableCell>
                      <TableCell><Badge className={`text-xs ${STATUS_STYLES[m.status]||''}`}>{m.status||'Sent'}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.createdAt?new Date(m.createdAt).toLocaleDateString('en-PK'):'—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardHeader><CardTitle className="text-sm">Messages by Channel</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {byChannel.length===0?<p className="text-sm text-muted-foreground">No data yet</p>:byChannel.map(c=>{
                  const ChIcon = CHANNEL_ICONS[c.name]||Send;
                  return (
                    <div key={c.name} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"><ChIcon className="h-4 w-4 text-blue-600"/></div>
                      <div className="flex-1"><div className="flex justify-between text-sm mb-1"><span className="font-medium">{c.name}</span><span className="text-muted-foreground">{c.count}</span></div>
                        <div className="h-1.5 bg-muted rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{width:`${(c.count/messages.length)*100}%`}}/></div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="text-sm">Messages by Type</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {byType.length===0?<p className="text-sm text-muted-foreground">No data yet</p>:byType.map(t=>(
                  <div key={t.name} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm">{t.name}</span>
                    <Badge variant="secondary">{t.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription>Send a message to parents via your preferred channel</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>Subject *</Label><Input value={form.subject} onChange={e=>f('subject',e.target.value)} placeholder="Message subject"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Type</Label><Select value={form.messageType} onValueChange={v=>f('messageType',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{TYPES.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Channel *</Label><Select value={form.channel} onValueChange={v=>f('channel',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{CHANNELS.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1"><Label>Recipients</Label>
              <div className="flex gap-2">
                {(['all','class','student'] as const).map(t=>(
                  <button key={t} onClick={()=>f('targetType',t)} className={`flex-1 py-2 text-sm rounded-lg border transition-colors capitalize ${form.targetType===t?'bg-blue-600 text-white border-blue-600':'border-border hover:border-blue-400'}`}>{t==='all'?'All Parents':t}</button>
                ))}
              </div>
              {form.targetType==='class'&&<Select value={form.classId} onValueChange={v=>f('classId',v)}><SelectTrigger className="mt-2"><SelectValue placeholder="Select class"/></SelectTrigger><SelectContent>{classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>}
              {form.targetType==='student'&&<Select value={form.studentId} onValueChange={v=>f('studentId',v)}><SelectTrigger className="mt-2"><SelectValue placeholder="Select student"/></SelectTrigger><SelectContent>{students.map(s=><SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select>}
              <p className="text-xs text-muted-foreground mt-1">Sending to: <strong>{recipientLabel()}</strong></p>
            </div>
            <div className="space-y-1"><Label>Message Body *</Label><Textarea rows={4} value={form.body} onChange={e=>f('body',e.target.value)} placeholder="Write your message here..."/></div>
            <div className="space-y-1"><Label>Schedule (optional)</Label><Input type="datetime-local" value={form.scheduledAt} onChange={e=>f('scheduledAt',e.target.value)}/><p className="text-xs text-muted-foreground">Leave blank to send immediately</p></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button>
            <Button onClick={send} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
              {sending?<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Sending...</>:<><Send className="h-4 w-4 mr-2"/>{form.scheduledAt?'Schedule':'Send Now'}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
