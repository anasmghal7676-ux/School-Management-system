'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2, Plus, Edit, Trash2, RefreshCw, Bell, MessageSquare,
  Mail, Phone, Zap, AlertTriangle, CheckCircle2, Settings2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const TRIGGERS = [
  { value: 'attendance.absent', label: 'Student Marked Absent', category: 'Attendance', icon: '📅' },
  { value: 'attendance.late', label: 'Student Marked Late', category: 'Attendance', icon: '⏰' },
  { value: 'fee.overdue', label: 'Fee Payment Overdue', category: 'Fees', icon: '💰' },
  { value: 'fee.paid', label: 'Fee Payment Received', category: 'Fees', icon: '✅' },
  { value: 'fee.due_reminder', label: 'Fee Due Reminder (3 days before)', category: 'Fees', icon: '🔔' },
  { value: 'exam.result_published', label: 'Exam Result Published', category: 'Exams', icon: '📝' },
  { value: 'exam.upcoming', label: 'Upcoming Exam Reminder', category: 'Exams', icon: '📅' },
  { value: 'homework.assigned', label: 'Homework Assigned', category: 'Academic', icon: '📚' },
  { value: 'homework.overdue', label: 'Homework Submission Overdue', category: 'Academic', icon: '⚠️' },
  { value: 'admission.approved', label: 'Admission Approved', category: 'Admission', icon: '🎓' },
  { value: 'leave.approved', label: 'Leave Request Approved', category: 'HR', icon: '✅' },
  { value: 'leave.rejected', label: 'Leave Request Rejected', category: 'HR', icon: '❌' },
  { value: 'salary.processed', label: 'Salary Processed', category: 'Payroll', icon: '💵' },
  { value: 'incident.reported', label: 'Incident Reported', category: 'Discipline', icon: '⚠️' },
  { value: 'announcement.new', label: 'New Announcement', category: 'Communication', icon: '📢' },
  { value: 'tc.issued', label: 'Transfer Certificate Issued', category: 'Admin', icon: '📄' },
  { value: 'birthday.student', label: 'Student Birthday', category: 'Events', icon: '🎂' },
];

const RECIPIENTS = ['Parents', 'Student', 'Class Teacher', 'Admin', 'Principal', 'Staff', 'HOD'];
const CHANNELS = ['SMS', 'Email', 'WhatsApp', 'Push Notification', 'In-App'];

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  SMS: <Phone className="h-3.5 w-3.5" />,
  Email: <Mail className="h-3.5 w-3.5" />,
  WhatsApp: <MessageSquare className="h-3.5 w-3.5 text-green-600" />,
  'Push Notification': <Bell className="h-3.5 w-3.5" />,
  'In-App': <Bell className="h-3.5 w-3.5 text-blue-500" />,
};

const CHANNEL_COLORS: Record<string, string> = {
  SMS: 'bg-blue-100 text-blue-700',
  Email: 'bg-purple-100 text-purple-700',
  WhatsApp: 'bg-green-100 text-green-700',
  'Push Notification': 'bg-orange-100 text-orange-700',
  'In-App': 'bg-slate-100 text-slate-600',
};

const emptyRule = {
  name: '', trigger: '', recipients: [], channels: [], messageTemplate: '', isActive: true, conditions: '', priority: 'Normal',
};

export default function NotificationRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, sms: 0, email: 0, whatsapp: 0 });
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyRule);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notif-rules');
      const data = await res.json();
      setRules(data.rules || []);
      if (data.summary) setSummary(data.summary);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyRule, recipients: [], channels: [] }); setShowDialog(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...r }); setShowDialog(true); };

  const save = async () => {
    if (!form.name || !form.trigger) { toast({ title: 'Name and trigger required', variant: 'destructive' }); return; }
    if (!form.channels?.length) { toast({ title: 'Select at least one channel', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const body = editing ? { ...form, id: editing.id } : form;
      const res = await fetch('/api/notif-rules', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: editing ? 'Rule updated' : 'Rule created' });
      setShowDialog(false); load();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const toggleActive = async (rule: any) => {
    await fetch('/api/notif-rules', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }) });
    load();
  };

  const deleteRule = async (rule: any) => {
    if (!confirm(`Delete rule "${rule.name}"?`)) return;
    await fetch('/api/notif-rules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: rule.id }) });
    toast({ title: 'Deleted' }); load();
  };

  const toggleFormChannel = (ch: string) => {
    setForm((f: any) => ({ ...f, channels: f.channels?.includes(ch) ? f.channels.filter((c: string) => c !== ch) : [...(f.channels || []), ch] }));
  };
  const toggleFormRecipient = (r: string) => {
    setForm((f: any) => ({ ...f, recipients: f.recipients?.includes(r) ? f.recipients.filter((x: string) => x !== r) : [...(f.recipients || []), r] }));
  };

  const triggerInfo = (val: string) => TRIGGERS.find(t => t.value === val);
  const categories = [...new Set(TRIGGERS.map(t => t.category))];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Notification Rules Engine"
        description="Configure automatic notifications for events — SMS, Email, WhatsApp"
        actions={
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Rules', value: summary.total, color: 'border-l-slate-500', icon: <Settings2 className="h-4 w-4 text-slate-500" /> },
          { label: 'Active', value: summary.active, color: 'border-l-green-500', icon: <Zap className="h-4 w-4 text-green-500" /> },
          { label: 'SMS Rules', value: summary.sms, color: 'border-l-blue-500', icon: <Phone className="h-4 w-4 text-blue-500" /> },
          { label: 'Email Rules', value: summary.email, color: 'border-l-purple-500', icon: <Mail className="h-4 w-4 text-purple-500" /> },
          { label: 'WhatsApp Rules', value: summary.whatsapp, color: 'border-l-green-600', icon: <MessageSquare className="h-4 w-4 text-green-600" /> },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rules List */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Notification Rules</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
      ) : rules.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-muted-foreground">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No notification rules configured</p>
          <p className="text-sm mt-1">Create rules to send automatic alerts to parents and staff</p>
          <Button size="sm" className="mt-4" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Create First Rule</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {/* Group by category */}
          {categories.filter(cat => rules.some(r => triggerInfo(r.trigger)?.category === cat)).map(cat => (
            <div key={cat}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{cat}</h4>
              <div className="space-y-2">
                {rules.filter(r => triggerInfo(r.trigger)?.category === cat).map(rule => {
                  const trig = triggerInfo(rule.trigger);
                  return (
                    <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl shrink-0">{trig?.icon || '🔔'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{rule.name}</span>
                              <Badge variant="outline" className={`text-xs ${rule.priority === 'High' ? 'bg-red-50 text-red-600 border-red-200' : rule.priority === 'Low' ? 'bg-slate-50' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                {rule.priority}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">Trigger: {trig?.label || rule.trigger}</div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(rule.channels || []).map((ch: string) => (
                                <Badge key={ch} className={`text-xs gap-1 ${CHANNEL_COLORS[ch] || ''}`}>
                                  {CHANNEL_ICONS[ch]}{ch}
                                </Badge>
                              ))}
                              <span className="text-xs text-muted-foreground">→</span>
                              {(rule.recipients || []).map((r: string) => (
                                <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                              ))}
                            </div>
                            {rule.messageTemplate && (
                              <div className="mt-1.5 text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1 truncate max-w-lg">
                                "{rule.messageTemplate}"
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <Switch checked={rule.isActive} onCheckedChange={() => toggleActive(rule)} />
                              <span className="text-xs text-muted-foreground">{rule.isActive ? 'Active' : 'Off'}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rule)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRule(rule)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Notification Rule' : 'Create Notification Rule'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Rule Name *</Label>
              <Input placeholder="e.g. Absent Alert to Parents" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Trigger Event *</Label>
              <Select value={form.trigger} onValueChange={v => setForm({ ...form, trigger: v })}>
                <SelectTrigger><SelectValue placeholder="What should trigger this?" /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <React.Fragment key={cat}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</div>
                      {TRIGGERS.filter(t => t.category === cat).map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Channels * (select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(ch => (
                  <label key={ch} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium transition-colors ${form.channels?.includes(ch) ? CHANNEL_COLORS[ch] + ' border-current' : 'bg-background border-border hover:bg-muted/40'}`}>
                    <Checkbox checked={form.channels?.includes(ch)} onCheckedChange={() => toggleFormChannel(ch)} className="h-3 w-3" />
                    {CHANNEL_ICONS[ch]}{ch}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Send To (Recipients)</Label>
              <div className="flex flex-wrap gap-2">
                {RECIPIENTS.map(r => (
                  <label key={r} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-xs transition-colors ${form.recipients?.includes(r) ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border hover:bg-muted/40'}`}>
                    <Checkbox checked={form.recipients?.includes(r)} onCheckedChange={() => toggleFormRecipient(r)} className="h-3 w-3" />
                    {r}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Message Template</Label>
              <Textarea
                placeholder="Use variables like {student_name}, {date}, {class}, {amount}, {subject}..."
                rows={3}
                value={form.messageTemplate}
                onChange={e => setForm({ ...form, messageTemplate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Variables: {'{student_name}'}, {'{class}'}, {'{date}'}, {'{amount}'}, {'{subject}'}, {'{parent_name}'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority || 'Normal'} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Low', 'Normal', 'High'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <Switch checked={form.isActive !== false} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                <Label>{form.isActive !== false ? 'Active' : 'Inactive'}</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Additional Conditions</Label>
              <Input placeholder="e.g. Only for fee > 5000, Only consecutive absences" value={form.conditions} onChange={e => setForm({ ...form, conditions: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update Rule' : 'Create Rule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
