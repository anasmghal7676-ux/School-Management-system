'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, RefreshCw, Trash2, MessageSquare, Send, BookTemplate, Users, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const RECIPIENT_TYPES = ['All Students (Parents)', 'All Staff', 'Specific Class', 'Fee Defaulters', 'Custom Numbers'];
const fmtDate = (d: string) => d ? new Date(d).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function SMSGatewayPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalSent: 0, totalLogs: 0, today: 0 });
  const [loading, setLoading] = useState(false);
  const [composeDialog, setComposeDialog] = useState(false);
  const [tplDialog, setTplDialog] = useState(false);
  const [sending, setSending] = useState(false);

  const emptyCompose = () => ({ recipientType: 'All Students (Parents)', classId: '', customNumbers: '', subject: '', message: '', templateId: '' });
  const [compose, setCompose] = useState<any>(emptyCompose());
  const [tplForm, setTplForm] = useState({ name: '', message: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sms-gateway?view=logs');
      const data = await res.json();
      setLogs(data.logs || []); setClasses(data.classes || []); setStudents(data.students || []);
      setStaff(data.staff || []); setTemplates(data.templates || []); setSummary(data.summary || {});
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const applyTemplate = (id: string) => {
    const t = templates.find(x => x.id === id);
    if (t) setCompose((c: any) => ({ ...c, templateId: id, message: t.message }));
  };

  const getRecipientCount = () => {
    if (compose.recipientType === 'All Students (Parents)') return students.length;
    if (compose.recipientType === 'All Staff') return staff.length;
    if (compose.recipientType === 'Specific Class') return students.filter(s => s.class?.id === compose.classId).length;
    if (compose.recipientType === 'Custom Numbers') return compose.customNumbers.split(/[,\n]/).filter((n: string) => n.trim()).length;
    return 0;
  };

  const send = async () => {
    if (!compose.message.trim()) { toast({ title: 'Message is required', variant: 'destructive' }); return; }
    const recipientCount = getRecipientCount();
    if (!recipientCount && compose.recipientType !== 'Fee Defaulters') { toast({ title: 'No recipients selected', variant: 'destructive' }); return; }
    if (!confirm(`Send SMS to ~${recipientCount} recipients?`)) return;
    setSending(true);
    try {
      await fetch('/api/sms-gateway', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...compose, recipientCount, sentAt: new Date().toISOString() })
      });
      toast({ title: `✅ SMS logged — ${recipientCount} recipients` });
      setComposeDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSending(false); }
  };

  const saveTpl = async () => {
    if (!tplForm.name || !tplForm.message) { toast({ title: 'Name and message required', variant: 'destructive' }); return; }
    await fetch('/api/sms-gateway', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...tplForm, entity: 'template' }) });
    toast({ title: 'Template saved' }); setTplDialog(false); setTplForm({ name: '', message: '' });
    const res = await fetch('/api/sms-gateway?view=templates');
    const data = await res.json();
    setTemplates(data.items || []);
  };

  const charCount = compose.message.length;
  const smsCount = Math.ceil(charCount / 160) || 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="SMS Gateway" description="Compose and send bulk SMS to students, parents and staff — track delivery logs"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTplDialog(true)}><Plus className="h-4 w-4 mr-2" />Template</Button>
          <Button size="sm" onClick={() => { setCompose(emptyCompose()); setComposeDialog(true); }}><Send className="h-4 w-4 mr-2" />Compose SMS</Button>
        </div>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-2xl font-bold">{summary.totalSent.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">Total SMS Sent</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-2xl font-bold">{summary.totalLogs}</p><p className="text-xs text-muted-foreground mt-1">Send Sessions</p></CardContent></Card>
        <Card className="border-l-4 border-l-amber-500"><CardContent className="p-4"><p className="text-2xl font-bold">{summary.today}</p><p className="text-xs text-muted-foreground mt-1">Today's Sessions</p></CardContent></Card>
      </div>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">📋 Send History</TabsTrigger>
          <TabsTrigger value="templates">📝 Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <div className="flex justify-end mb-3"><Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button></div>
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            logs.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No SMS sent yet</p><Button size="sm" className="mt-3" onClick={() => { setCompose(emptyCompose()); setComposeDialog(true); }}><Send className="h-4 w-4 mr-2" />Send First SMS</Button></CardContent></Card> :
            <div className="space-y-3">
              {logs.map(log => (
                <Card key={log.id} className="hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className="bg-green-100 text-green-700 text-xs">✓ Sent</Badge>
                          <Badge variant="outline" className="text-xs">{log.recipientType}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{log.recipientCount} recipients</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDate(log.createdAt)}</span>
                        </div>
                        {log.classId && <p className="text-xs text-muted-foreground">Class: {classes.find(c => c.id === log.classId)?.name}</p>}
                        <p className="text-sm mt-2 bg-muted/20 rounded p-2 font-mono leading-relaxed">{log.message}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={async () => { if (confirm('Delete log?')) { await fetch('/api/sms-gateway', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: log.id }) }); load(); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          {templates.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><p>No templates saved</p><Button size="sm" className="mt-3" onClick={() => setTplDialog(true)}>Create Template</Button></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(tpl => (
                <Card key={tpl.id} className="hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{tpl.name}</p>
                        <p className="text-xs text-muted-foreground mt-2 bg-muted/20 rounded p-2 font-mono leading-relaxed">{tpl.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{tpl.message.length} chars · {Math.ceil(tpl.message.length / 160)} SMS</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setCompose((c: any) => ({ ...c, message: tpl.message, templateId: tpl.id })); setComposeDialog(true); }}>Use</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { if (confirm('Delete?')) { await fetch('/api/sms-gateway', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tpl.id, entity: 'template' }) }); const r = await fetch('/api/sms-gateway?view=templates'); const d = await r.json(); setTemplates(d.items || []); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>
      </Tabs>

      {/* Compose Dialog */}
      <Dialog open={composeDialog} onOpenChange={setComposeDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Compose SMS</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {templates.length > 0 && (
              <div className="space-y-1.5"><Label>Load Template</Label>
                <Select value={compose.templateId} onValueChange={applyTemplate}><SelectTrigger><SelectValue placeholder="Select template (optional)" /></SelectTrigger><SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
              </div>
            )}
            <div className="space-y-1.5"><Label>Send To *</Label>
              <Select value={compose.recipientType} onValueChange={v => setCompose((c: any) => ({ ...c, recipientType: v, classId: '' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RECIPIENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            {compose.recipientType === 'Specific Class' && (
              <div className="space-y-1.5"><Label>Class</Label><Select value={compose.classId} onValueChange={v => setCompose((c: any) => ({ ...c, classId: v }))}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            )}
            {compose.recipientType === 'Custom Numbers' && (
              <div className="space-y-1.5"><Label>Phone Numbers (comma or newline separated)</Label><Textarea value={compose.customNumbers} onChange={e => setCompose((c: any) => ({ ...c, customNumbers: e.target.value }))} rows={3} placeholder="03001234567, 03111234567..." /></div>
            )}
            <div className="space-y-1.5">
              <div className="flex justify-between"><Label>Message *</Label><span className="text-xs text-muted-foreground">{charCount} chars · {smsCount} SMS</span></div>
              <Textarea value={compose.message} onChange={e => setCompose((c: any) => ({ ...c, message: e.target.value }))} rows={5} placeholder="Type your message here..." />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
              <p>📱 Recipients: <strong>~{getRecipientCount()}</strong></p>
              <p className="text-xs mt-0.5 text-blue-600">Note: Actual delivery depends on configured SMS provider API.</p>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setComposeDialog(false)}>Cancel</Button><Button onClick={send} disabled={sending}>{sending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}<Send className="h-4 w-4 mr-2" />Send SMS</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={tplDialog} onOpenChange={setTplDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Save SMS Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Template Name *</Label><Input value={tplForm.name} onChange={e => setTplForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Fee Reminder, Exam Notice" /></div>
            <div className="space-y-1.5">
              <div className="flex justify-between"><Label>Message *</Label><span className="text-xs text-muted-foreground">{tplForm.message.length} chars</span></div>
              <Textarea value={tplForm.message} onChange={e => setTplForm(f => ({ ...f, message: e.target.value }))} rows={5} placeholder="SMS message content..." />
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTplDialog(false)}>Cancel</Button><Button onClick={saveTpl}>Save Template</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
