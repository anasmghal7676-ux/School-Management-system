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
import { Loader2, Plus, Trash2, MessageSquare, Megaphone, Send, RefreshCw, Circle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const PRIORITIES = ['Normal', 'Important', 'Urgent'];
const AUDIENCES = ['All Staff', 'Teaching Staff', 'Admin Staff', 'Management', 'Specific Department'];
const PRIORITY_COLORS: Record<string, string> = { Normal: 'bg-gray-100 text-gray-700', Important: 'bg-blue-100 text-blue-700', Urgent: 'bg-red-100 text-red-700' };
const fmtTime = (d: string) => d ? new Date(d).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export default function CommunicationCenterPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msgDialog, setMsgDialog] = useState(false);
  const [annDialog, setAnnDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyMsg = () => ({ toId: '', toName: '', subject: '', body: '', priority: 'Normal', fromName: 'Admin' });
  const emptyAnn = () => ({ title: '', body: '', priority: 'Normal', audience: 'All Staff', department: '', expiresAt: '' });
  const [msgForm, setMsgForm] = useState<any>(emptyMsg());
  const [annForm, setAnnForm] = useState<any>(emptyAnn());

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/comm-center?view=messages');
      const data = await res.json();
      setMessages(data.messages || []); setStaff(data.staff || []); setUnread(data.unread || 0);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/comm-center?view=announcements');
      const data = await res.json();
      setAnnouncements(data.items || []); if (!staff.length) setStaff(data.staff || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [staff.length]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const handleTo = (id: string) => { const s = staff.find(x => x.id === id); setMsgForm((f: any) => ({ ...f, toId: id, toName: s?.fullName || '' })); };

  const sendMsg = async () => {
    if (!msgForm.toId || !msgForm.subject || !msgForm.body) { toast({ title: 'Recipient, subject and message required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/comm-center', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...msgForm, entity: 'message' }) });
      toast({ title: '✅ Message sent' }); setMsgDialog(false); loadMessages();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const postAnn = async () => {
    if (!annForm.title || !annForm.body) { toast({ title: 'Title and body required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/comm-center', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...annForm, entity: 'announcement' }) });
      toast({ title: '✅ Announcement posted' }); setAnnDialog(false); loadAnnouncements();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const markRead = async (msg: any) => {
    await fetch('/api/comm-center', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: msg.id, entity: 'message', read: true }) });
    loadMessages();
  };

  const delMsg = async (id: string) => {
    if (!confirm('Delete message?')) return;
    await fetch('/api/comm-center', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity: 'message' }) });
    loadMessages();
  };

  const delAnn = async (id: string) => {
    if (!confirm('Delete announcement?')) return;
    await fetch('/api/comm-center', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity: 'announcement' }) });
    loadAnnouncements();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Communication Center" description="Send internal messages to staff and post school-wide announcements"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setMsgForm(emptyMsg()); setMsgDialog(true); }}><MessageSquare className="h-4 w-4 mr-2" />New Message</Button>
          <Button size="sm" onClick={() => { setAnnForm(emptyAnn()); setAnnDialog(true); }}><Megaphone className="h-4 w-4 mr-2" />Post Announcement</Button>
        </div>}
      />

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">
            ✉️ Messages
            {unread > 0 && <Badge className="ml-2 h-5 bg-red-500 text-white text-xs">{unread}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="notices" onClick={loadAnnouncements}>📢 Announcements ({announcements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-4 space-y-3">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={loadMessages}><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button>
          </div>
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            messages.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No messages yet</p><Button size="sm" className="mt-3" onClick={() => { setMsgForm(emptyMsg()); setMsgDialog(true); }}><Send className="h-4 w-4 mr-2" />Send First Message</Button></CardContent></Card> :
            <div className="space-y-2">
              {messages.map(msg => (
                <Card key={msg.id} className={`hover:shadow-sm cursor-pointer ${!msg.read ? 'border-primary/40 bg-primary/5' : ''}`} onClick={() => markRead(msg)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {!msg.read && <Circle className="h-2.5 w-2.5 fill-primary text-primary flex-shrink-0 mt-1.5" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{msg.subject}</span>
                            <Badge className={`text-xs ${PRIORITY_COLORS[msg.priority] || ''}`}>{msg.priority}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">To: <strong>{msg.toName}</strong> · From: {msg.fromName} · {fmtTime(msg.createdAt)}</div>
                          <p className="text-sm mt-2 text-muted-foreground line-clamp-2">{msg.body}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={e => { e.stopPropagation(); delMsg(msg.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>

        <TabsContent value="notices" className="mt-4 space-y-3">
          <div className="flex justify-end"><Button variant="outline" size="sm" onClick={loadAnnouncements}><RefreshCw className="h-3.5 w-3.5 mr-1" />Refresh</Button></div>
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            announcements.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><Megaphone className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No announcements posted</p></CardContent></Card> :
            <div className="space-y-3">
              {announcements.map(ann => (
                <Card key={ann.id} className={`hover:shadow-sm ${ann.priority === 'Urgent' ? 'border-red-200' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold">{ann.title}</span>
                          <Badge className={`text-xs ${PRIORITY_COLORS[ann.priority] || ''}`}>{ann.priority}</Badge>
                          <Badge variant="outline" className="text-xs">{ann.audience}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{fmtTime(ann.createdAt)}{ann.expiresAt && ` · Expires: ${ann.expiresAt}`}</p>
                        <p className="text-sm text-muted-foreground">{ann.body}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => delAnn(ann.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>
      </Tabs>

      {/* Message Dialog */}
      <Dialog open={msgDialog} onOpenChange={setMsgDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>To *</Label><Select value={msgForm.toId} onValueChange={handleTo}><SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.designation}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>From</Label><Input value={msgForm.fromName} onChange={e => setMsgForm((f: any) => ({ ...f, fromName: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Subject *</Label><Input value={msgForm.subject} onChange={e => setMsgForm((f: any) => ({ ...f, subject: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Priority</Label><Select value={msgForm.priority} onValueChange={v => setMsgForm((f: any) => ({ ...f, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Message *</Label><Textarea value={msgForm.body} onChange={e => setMsgForm((f: any) => ({ ...f, body: e.target.value }))} rows={5} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMsgDialog(false)}>Cancel</Button><Button onClick={sendMsg} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}<Send className="h-4 w-4 mr-2" />Send</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog open={annDialog} onOpenChange={setAnnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={annForm.title} onChange={e => setAnnForm((f: any) => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Priority</Label><Select value={annForm.priority} onValueChange={v => setAnnForm((f: any) => ({ ...f, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Audience</Label><Select value={annForm.audience} onValueChange={v => setAnnForm((f: any) => ({ ...f, audience: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
            </div>
            {annForm.audience === 'Specific Department' && <div className="space-y-1.5"><Label>Department</Label><Input value={annForm.department} onChange={e => setAnnForm((f: any) => ({ ...f, department: e.target.value }))} /></div>}
            <div className="space-y-1.5"><Label>Expires On (optional)</Label><Input type="date" value={annForm.expiresAt} onChange={e => setAnnForm((f: any) => ({ ...f, expiresAt: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Announcement *</Label><Textarea value={annForm.body} onChange={e => setAnnForm((f: any) => ({ ...f, body: e.target.value }))} rows={5} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAnnDialog(false)}>Cancel</Button><Button onClick={postAnn} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}<Megaphone className="h-4 w-4 mr-2" />Post</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
