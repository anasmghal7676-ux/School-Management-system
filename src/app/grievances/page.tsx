'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, RefreshCw, Trash2, MessageSquare, AlertTriangle, CheckCircle2, Clock, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CATEGORIES = ['Work Environment', 'Salary / Payroll', 'Discrimination', 'Harassment', 'Workload', 'Management Conduct', 'Policy Violation', 'Promotion / Appraisal', 'Leave Denial', 'Other'];
const STATUSES = ['Open', 'Under Review', 'Resolved', 'Dismissed'];
const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-amber-100 text-amber-700',
  'Under Review': 'bg-blue-100 text-blue-700',
  Resolved: 'bg-green-100 text-green-700',
  Dismissed: 'bg-slate-100 text-slate-500',
};
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function StaffGrievancesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, open: 0, inReview: 0, resolved: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialog, setDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState<any>(null);
  const [respondDialog, setRespondDialog] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState('Resolved');

  const emptyForm = () => ({ staffId: '', staffName: '', designation: '', department: '', category: 'Work Environment', priority: 'Normal', subject: '', description: '', anonymous: false, date: new Date().toISOString().slice(0, 10) });
  const [form, setForm] = useState<any>(emptyForm());
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter });
      const res = await fetch(`/api/grievances?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items || []); setSummary(data.summary || {}); setStaff(data.staff || []);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStaff = (id: string) => {
    const s = staff.find(x => x.id === id);
    setForm((p: any) => ({ ...p, staffId: id, staffName: s?.fullName || '', designation: s?.designation || '', department: s?.department || '' }));
  };

  const save = async () => {
    if (!form.subject || !form.description) { toast({ title: 'Subject and description required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/grievances', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      toast({ title: 'Grievance submitted' }); setDialog(false); setForm(emptyForm()); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const respond = async () => {
    if (!responseText.trim()) { toast({ title: 'Response is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/grievances', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'respond', id: respondDialog.id, response: responseText, status: responseStatus }) });
      toast({ title: `Grievance marked as ${responseStatus}` }); setRespondDialog(null); setResponseText(''); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this grievance record?')) return;
    await fetch('/api/grievances', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Deleted' }); load();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Staff Grievances" description="Formal grievance submission, investigation and resolution management"
        actions={<Button size="sm" onClick={() => { setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />File Grievance</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: summary.total, icon: <MessageSquare className="h-4 w-4 text-slate-500" />, color: 'border-l-slate-500' },
          { label: 'Open', value: summary.open, icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, color: 'border-l-amber-500' },
          { label: 'Under Review', value: summary.inReview, icon: <Clock className="h-4 w-4 text-blue-500" />, color: 'border-l-blue-500' },
          { label: 'Resolved', value: summary.resolved, icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'border-l-green-500' },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4"><div className="flex items-center justify-between">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div><p className="text-xs text-muted-foreground mt-1">{c.label}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card><CardContent className="p-4"><div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search grievances..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
          items.length === 0 ? <div className="text-center py-16 text-muted-foreground"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No grievances filed</p></div> :
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Staff</TableHead><TableHead>Category</TableHead>
              <TableHead>Subject</TableHead><TableHead>Priority</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/20">
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(item.date || item.createdAt)}</TableCell>
                  <TableCell>
                    {item.anonymous ? <span className="text-muted-foreground italic text-sm">Anonymous</span> : (
                      <div><div className="font-medium text-sm">{item.staffName}</div><div className="text-xs text-muted-foreground">{item.department}</div></div>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                  <TableCell className="max-w-xs"><p className="text-sm font-medium truncate">{item.subject}</p></TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${item.priority === 'Urgent' ? 'bg-red-100 text-red-700' : item.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{item.priority}</Badge>
                  </TableCell>
                  <TableCell><Badge className={`text-xs ${STATUS_COLORS[item.status] || ''}`}>{item.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View" onClick={() => setViewDialog(item)}><Eye className="h-3.5 w-3.5" /></Button>
                      {(item.status === 'Open' || item.status === 'Under Review') && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-700" onClick={() => { setRespondDialog(item); setResponseText(''); setResponseStatus('Resolved'); }}>Respond</Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      </CardContent></Card>

      {/* File Grievance Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>File Grievance</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="anon" checked={form.anonymous} onChange={e => f('anonymous', e.target.checked)} className="h-4 w-4" />
              <Label htmlFor="anon" className="cursor-pointer card-hover">Submit anonymously</Label>
            </div>
            {!form.anonymous && (
              <div className="col-span-2 space-y-1.5"><Label>Staff Member</Label>
                <Select value={form.staffId} onValueChange={handleStaff}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.department}</SelectItem>)}</SelectContent></Select>
              </div>
            )}
            <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onValueChange={v => f('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Priority</Label><Select value={form.priority} onValueChange={v => f('priority', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Subject *</Label><Input value={form.subject} onChange={e => f('subject', e.target.value)} placeholder="Brief summary of the issue" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Detailed Description *</Label><Textarea value={form.description} onChange={e => f('description', e.target.value)} rows={4} placeholder="Describe the grievance in detail, including dates, people involved, and what resolution you seek..." /></div>
            <div className="space-y-1.5"><Label>Date of Incident</Label><Input type="date" value={form.date} onChange={e => f('date', e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit Grievance</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={o => !o && setViewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Grievance Details</DialogTitle></DialogHeader>
          {viewDialog && <div className="space-y-3 py-2">
            <div className="flex gap-2 flex-wrap">
              <Badge className={STATUS_COLORS[viewDialog.status] || ''}>{viewDialog.status}</Badge>
              <Badge variant="outline">{viewDialog.category}</Badge>
              <Badge className={viewDialog.priority === 'Urgent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}>{viewDialog.priority}</Badge>
            </div>
            <div><p className="font-semibold text-lg">{viewDialog.subject}</p><p className="text-xs text-muted-foreground mt-0.5">{viewDialog.anonymous ? 'Anonymous submission' : `${viewDialog.staffName} · ${viewDialog.department}`} · {fmtDate(viewDialog.date)}</p></div>
            <div className="bg-muted/20 rounded-lg p-3 text-sm whitespace-pre-wrap">{viewDialog.description}</div>
            {viewDialog.response && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-1">Admin Response — {fmtDate(viewDialog.respondedAt)}</p>
                <p className="text-sm">{viewDialog.response}</p>
              </div>
            )}
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setViewDialog(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Respond Dialog */}
      <Dialog open={!!respondDialog} onOpenChange={o => !o && setRespondDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Respond to Grievance</DialogTitle></DialogHeader>
          {respondDialog && <div className="space-y-4 py-2">
            <div className="bg-muted/20 rounded p-3 text-sm"><p className="font-medium">{respondDialog.subject}</p><p className="text-muted-foreground text-xs mt-1">{respondDialog.anonymous ? 'Anonymous' : respondDialog.staffName}</p></div>
            <div className="space-y-1.5"><Label>Resolution Status</Label>
              <Select value={responseStatus} onValueChange={setResponseStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Under Review">Mark Under Review</SelectItem><SelectItem value="Resolved">Mark Resolved</SelectItem><SelectItem value="Dismissed">Dismiss</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Response / Decision *</Label><Textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={4} placeholder="Provide your response, action taken, or reason for dismissal..." /></div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setRespondDialog(null)}>Cancel</Button><Button onClick={respond} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit Response</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
