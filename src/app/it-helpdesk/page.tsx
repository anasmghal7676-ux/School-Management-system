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
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, Monitor, AlertTriangle, CheckCircle2, Clock, Wrench } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import { LoadingSpinner } from '@/components/loading-skeleton';
import EmptyState from '@/components/empty-state';

const CATEGORIES = ['Hardware', 'Software', 'Network / Internet', 'Printer', 'Projector', 'CCTV', 'Phone / PABX', 'Email', 'Server', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'In Progress', 'Pending Parts', 'Resolved', 'Closed'];
const PRIO_COLORS: Record<string, string> = { Low: 'bg-slate-100 text-slate-600', Medium: 'bg-blue-100 text-blue-700', High: 'bg-amber-100 text-amber-700', Critical: 'bg-red-100 text-red-700' };
const STATUS_COLORS: Record<string, string> = { Open: 'bg-yellow-100 text-yellow-700', 'In Progress': 'bg-blue-100 text-blue-700', 'Pending Parts': 'bg-orange-100 text-orange-700', Resolved: 'bg-green-100 text-green-700', Closed: 'bg-gray-100 text-gray-600' };
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ITHelpdeskPage() {
  const [items, setItems] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = () => ({ title: '', category: 'Hardware', priority: 'Medium', raisedBy: '', raisedByPhone: '', location: '', description: '', assignedToId: '', assignedToName: '', notes: '' });
  const [form, setForm] = useState<any>(emptyForm());
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ status: statusFilter, priority: priorityFilter, search });
      const res = await fetch(`/api/it-helpdesk?${p}`);
      const data = await res.json();
      setItems(data.items || []); setStaff(data.staff || []); setSummary(data.summary || {});
    } catch { toast({ title: 'Error loading tickets', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title || !form.raisedBy) { toast({ title: 'Title and raised by required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const method = editItem ? 'PATCH' : 'POST';
      const body = editItem ? { ...form, id: editItem.id } : form;
      await fetch('/api/it-helpdesk', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      toast({ title: editItem ? 'Ticket updated' : '✅ Ticket raised' }); setDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/it-helpdesk', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    toast({ title: `Status → ${status}` }); load();
  };

  const assignTo = async (id: string, staffId: string) => {
    const s = staff.find(x => x.id === staffId);
    await fetch('/api/it-helpdesk', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, assignedToId: staffId, assignedToName: s?.fullName, status: 'In Progress' }) });
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this ticket?')) return;
    await fetch('/api/it-helpdesk', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  const handleAssign = (id: string) => { const s = staff.find(x => x.id === id); f('assignedToId', id); f('assignedToName', s?.fullName || ''); };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="IT Helpdesk"
        description="Submit and track IT support tickets for hardware, software and network issues"
        actions={
          <Button size="sm" onClick={() => { setEditItem(null); setForm(emptyForm()); setDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />Raise Ticket
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
        {[
          { label: 'Total', value: summary.total, icon: Monitor, color: 'bg-slate-100 text-slate-600 border-l-slate-400' },
          { label: 'Open', value: summary.open, icon: Clock, color: 'bg-yellow-50 text-yellow-700 border-l-yellow-400' },
          { label: 'In Progress', value: summary.inProgress, icon: Wrench, color: 'bg-blue-50 text-blue-700 border-l-blue-400' },
          { label: 'Resolved', value: summary.resolved, icon: CheckCircle2, color: 'bg-green-50 text-green-700 border-l-green-400' },
          { label: 'Critical', value: summary.critical, icon: AlertTriangle, color: 'bg-red-50 text-red-700 border-l-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-l-4 card-hover ${color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-2xl font-bold">{value}</p><p className="text-xs opacity-70">{label}</p></div>
                <Icon className="h-6 w-6 opacity-40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="animate-fade-in">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tickets..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={v => setPriorityFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Priority" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Priority</SelectItem>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load} className="transition-transform hover:rotate-180 duration-300"><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
        </CardContent>
      </Card>

      {loading ? <LoadingSpinner message="Loading tickets..." /> :
        items.length === 0 ? <EmptyState icon={Monitor} title="No tickets found" description="All quiet on the IT front! Raise a ticket if you have a problem." action={{ label: 'Raise Ticket', onClick: () => { setEditItem(null); setForm(emptyForm()); setDialog(true); }, icon: Plus }} /> :
        <Card className="animate-fade-in">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Raised By</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{item.ticketNo}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm max-w-48 truncate">{item.title}</div>
                      {item.location && <div className="text-xs text-muted-foreground">📍 {item.location}</div>}
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{item.category}</Badge></TableCell>
                    <TableCell><Badge className={`text-xs ${PRIO_COLORS[item.priority] || ''}`}>{item.priority}</Badge></TableCell>
                    <TableCell>
                      <div className="text-sm">{item.raisedBy}</div>
                      {item.raisedByPhone && <div className="text-xs text-muted-foreground">{item.raisedByPhone}</div>}
                    </TableCell>
                    <TableCell>
                      <Select value={item.assignedToId || ''} onValueChange={v => assignTo(item.id, v)}>
                        <SelectTrigger className="h-7 border-0 p-0 bg-transparent w-32 text-xs">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={item.status} onValueChange={v => updateStatus(item.id, v)}>
                        <SelectTrigger className="h-7 border-0 p-0 bg-transparent w-32">
                          <Badge className={`text-xs cursor-pointer ${STATUS_COLORS[item.status] || ''}`}>{item.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(item.createdAt)}</TableCell>
                    <TableCell className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(item); setForm(item); setDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      }

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Ticket' : 'Raise IT Support Ticket'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Issue Title *</Label><Input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Brief description of the problem" /></div>
            <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onValueChange={v => f('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Priority</Label><Select value={form.priority} onValueChange={v => f('priority', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Raised By *</Label><Input value={form.raisedBy} onChange={e => f('raisedBy', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.raisedByPhone} onChange={e => f('raisedByPhone', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Location / Room</Label><Input value={form.location} onChange={e => f('location', e.target.value)} placeholder="e.g. Room 12, Lab A" /></div>
            <div className="space-y-1.5"><Label>Assign To</Label><Select value={form.assignedToId} onValueChange={handleAssign}><SelectTrigger><SelectValue placeholder="Select IT staff" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Problem Description</Label><Textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3} placeholder="Describe the issue in detail..." /></div>
            {editItem && <div className="col-span-2 space-y-1.5"><Label>Resolution Notes</Label><Textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} placeholder="Steps taken, solution applied..." /></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editItem ? 'Update' : 'Submit Ticket'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
