'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Send, MessageSquare, Mail, Phone, Bell, Users,
  CheckCircle2, RefreshCw, ChevronLeft, ChevronRight,
  Megaphone, Clock, BarChart3,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CHANNELS = [
  { value: 'SMS',      label: 'SMS',       icon: Phone,         color: 'bg-green-100 text-green-700',  desc: 'Text message to mobile' },
  { value: 'Email',    label: 'Email',     icon: Mail,          color: 'bg-blue-100 text-blue-700',    desc: 'Email notification' },
  { value: 'WhatsApp', label: 'WhatsApp',  icon: MessageSquare, color: 'bg-emerald-100 text-emerald-700', desc: 'WhatsApp message' },
  { value: 'In-app',   label: 'In-App',    icon: Bell,          color: 'bg-purple-100 text-purple-700', desc: 'Push notification' },
];

const TARGET_TYPES = [
  { value: 'All-Students', label: 'All Students',  icon: Users,    desc: 'All active students' },
  { value: 'All-Staff',    label: 'All Staff',      icon: Users,    desc: 'All active staff members' },
  { value: 'All-Parents',  label: 'All Parents',    icon: Users,    desc: 'Parents of active students' },
  { value: 'Class',        label: 'Specific Class', icon: Users,    desc: 'Students of one class' },
];

const TEMPLATES = [
  { label: 'Fee Reminder',    title: 'Fee Payment Reminder', message: 'Dear Parent, this is a reminder that the monthly fee for {month} is due. Please pay by {due_date} to avoid late charges. Contact accounts: {phone}.' },
  { label: 'Exam Schedule',   title: 'Examination Notice', message: 'Dear Students, your {exam_name} examinations will begin from {start_date}. Please prepare well. Best of luck!' },
  { label: 'Holiday Notice',  title: 'School Holiday Announcement', message: 'Dear all, please note that school will remain closed on {date} due to {reason}. Classes will resume on {resume_date}.' },
  { label: 'PTM Notice',      title: 'Parent-Teacher Meeting', message: 'Dear Parent, you are cordially invited to the Parent-Teacher Meeting scheduled on {date} at {time}. Please mark your attendance.' },
  { label: 'Result Notice',   title: 'Result Announcement', message: 'Dear Students & Parents, the {exam_name} results have been announced. Please visit the school office to collect your result cards.' },
  { label: 'Attendance Alert', title: 'Low Attendance Alert', message: 'Dear Parent, your child\'s attendance has dropped below the required 75%. Please ensure regular attendance to avoid academic issues.' },
];

const fmtDate = (d: string) => new Date(d).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function BroadcastPage() {
  const [classes, setClasses]     = useState<any[]>([]);
  const [history, setHistory]     = useState<any[]>([]);
  const [hTotal, setHTotal]       = useState(0);
  const [hPage, setHPage]         = useState(1);
  const [loading, setLoading]     = useState(false);
  const [sending, setSending]     = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const [channel, setChannel]     = useState('SMS');
  const [targetType, setTargetType] = useState('All-Students');
  const [targetClass, setTargetClass] = useState('');
  const [title, setTitle]         = useState('');
  const [message, setMessage]     = useState('');
  const [charCount, setCharCount] = useState(0);

  useEffect(() => { fetchClasses(); fetchHistory(); }, []);
  useEffect(() => { fetchHistory(); }, [hPage]);
  useEffect(() => { setCharCount(message.length); }, [message]);

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=50');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/broadcast?page=${hPage}&limit=10`);
      const j = await r.json();
      if (j.success) { setHistory(j.data.broadcasts || []); setHTotal(j.data.total || 0); }
    } catch {} finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) { toast({ title: 'Title and message required', variant: 'destructive' }); return; }
    if (targetType === 'Class' && !targetClass) { toast({ title: 'Please select a class', variant: 'destructive' }); return; }
    setSending(true);
    try {
      const payload: any = { title: title.trim(), message: message.trim(), channel, targetType };
      if (targetType === 'Class') payload.targetClassId = targetClass;
      const r = await fetch('/api/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j.success) {
        setLastResult(j.data);
        toast({ title: 'Broadcast sent!', description: `Delivered to ${j.data.recipientCount} recipients` });
        setTitle(''); setMessage('');
        fetchHistory();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Send failed', variant: 'destructive' }); }
    finally { setSending(false); }
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setTitle(t.title);
    setMessage(t.message);
  };

  const CHANNEL_CONFIG = Object.fromEntries(CHANNELS.map(c => [c.value, c]));

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Megaphone className="h-7 w-7" />Broadcast Messages
            </h1>
            <p className="text-muted-foreground">Send mass notifications to students, staff, and parents</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Compose Panel */}
          <div className="lg:col-span-2 space-y-5">

            {/* Channel Select */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">1. Select Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {CHANNELS.map(ch => (
                    <button
                      key={ch.value}
                      onClick={() => setChannel(ch.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${channel === ch.value ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/40'}`}
                    >
                      <div className={`p-2.5 rounded-lg ${ch.color}`}>
                        <ch.icon className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold">{ch.label}</p>
                        <p className="text-xs text-muted-foreground">{ch.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Audience Select */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Select Audience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {TARGET_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => { setTargetType(t.value); setTargetClass(''); }}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${targetType === t.value ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/40'}`}
                    >
                      <Users className={`h-4 w-4 flex-shrink-0 ${targetType === t.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="text-sm font-medium">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {targetType === 'Class' && (
                  <div>
                    <Label>Select Class</Label>
                    <Select value={targetClass} onValueChange={setTargetClass}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Choose class..." /></SelectTrigger>
                      <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Compose */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Compose Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Title / Subject</Label>
                  <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Fee Reminder for August" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <Label>Message</Label>
                    <span className={`text-xs ${charCount > 160 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {charCount} chars {channel === 'SMS' && charCount > 160 ? `(${Math.ceil(charCount/160)} SMS)` : ''}
                    </span>
                  </div>
                  <Textarea
                    value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Type your message here... Use {placeholders} for dynamic content"
                    rows={5} className="resize-none"
                  />
                </div>
                <Button onClick={handleSend} disabled={sending} className="w-full" size="lg">
                  {sending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                    : <><Send className="mr-2 h-4 w-4" />Send Broadcast via {channel}</>
                  }
                </Button>
              </CardContent>
            </Card>

            {/* Last Result */}
            {lastResult && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4 pb-4 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-700">Broadcast Sent Successfully</p>
                    <p className="text-sm text-green-600 mt-0.5">{lastResult.message}</p>
                    <div className="flex gap-3 mt-2 text-xs text-green-600">
                      <span>✓ {lastResult.recipientCount} recipients</span>
                      <span>✓ {lastResult.notificationsCreated} in-app notifications created</span>
                      {lastResult.simulatedDelivery?.smsQueued && <span>✓ SMS queued</span>}
                      {lastResult.simulatedDelivery?.emailQueued && <span>✓ Emails queued</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Templates */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Templates</CardTitle>
                <CardDescription>Click to pre-fill compose form</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {TEMPLATES.map(t => (
                  <button
                    key={t.label}
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left px-3 py-2 rounded-lg border text-xs hover:bg-muted/60 hover:border-primary/30 transition-colors"
                  >
                    <p className="font-medium">{t.label}</p>
                    <p className="text-muted-foreground truncate mt-0.5">{t.title}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Broadcast History */}
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />Recent Broadcasts
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchHistory} disabled={loading}>
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {loading ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                ) : history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No broadcasts yet</p>
                ) : history.map((b: any, i: number) => {
                  const cfg = CHANNEL_CONFIG[b.channel] || CHANNEL_CONFIG['In-app'];
                  return (
                    <div key={i} className="p-2 rounded-lg border text-xs">
                      <div className="flex items-start gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${cfg.color} flex-shrink-0`}>{b.channel}</span>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{b.title}</p>
                          <p className="text-muted-foreground truncate">{b.message.slice(0,60)}…</p>
                          <p className="text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span><BarChart3 className="h-3 w-3 inline mr-0.5" />{b.count} recipients</span>
                            <span>{fmtDate(b.createdAt)}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>

      </main>
    </div>
  );
}
