'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Plus, Search, ChevronLeft, ChevronRight, RefreshCw,
  AlertTriangle, CheckCircle2, Clock, MessageSquare, Eye, Trash2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

interface Complaint {
  id: string; complainantType: string; complainantId: string; subject: string;
  description: string; priority: string; status: string; assignedTo: string | null;
  resolution: string | null; resolvedDate: string | null; createdAt: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-200',
  High:     'bg-orange-100 text-orange-800 border-orange-200',
  Medium:   'bg-amber-100 text-amber-800 border-amber-200',
  Low:      'bg-green-100 text-green-800 border-green-200',
};
const STATUS_STYLES: Record<string, string> = {
  Open:        'bg-blue-100 text-blue-800',
  'In-progress': 'bg-purple-100 text-purple-800',
  Resolved:    'bg-green-100 text-green-800',
  Closed:      'bg-gray-100 text-gray-800',
};

const EMPTY_FORM = { complainantType: 'Student', complainantId: '', subject: '', description: '', priority: 'Medium', assignedTo: '' };

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchIn, setSearchIn] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => { const t = setTimeout(() => setSearch(searchIn), 400); return () => clearTimeout(t); }, [searchIn]);
  useEffect(() => { fetchComplaints(); }, [statusFilter, priorityFilter, search, page]);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all')   p.append('status',   statusFilter);
      if (priorityFilter !== 'all') p.append('priority', priorityFilter);
      if (search) p.append('search', search);
      const r = await fetch(`/api/complaints?${p}`);
      const j = await r.json();
      if (j.success) {
        setComplaints(j.data.complaints);
        setStatusCounts(j.data.statusCounts || {});
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [statusFilter, priorityFilter, search, page]);

  const handleAdd = async () => {
    if (!form.subject || !form.description || !form.complainantId) {
      toast({ title: 'Required fields missing', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/complaints', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) { toast({ title: 'Complaint registered' }); setAddOpen(false); setForm(EMPTY_FORM); fetchComplaints(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const r = await fetch(`/api/complaints/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      const j = await r.json();
      if (j.success) { toast({ title: `Status: ${status}` }); fetchComplaints(); if (selected?.id === id) setSelected(j.data); }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleResolve = async () => {
    if (!selected) return;
    setResolving(true);
    try {
      const r = await fetch(`/api/complaints/${selected.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved', resolution }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Complaint resolved' });
        setViewOpen(false); setSelected(null); setResolution(''); fetchComplaints();
      }
    } finally { setResolving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/complaints/${id}`, { method: 'DELETE' });
      toast({ title: 'Deleted' }); fetchComplaints();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const uf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  const openCount = statusCounts['Open'] || 0;
  const inProgressCount = statusCounts['In-progress'] || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Complaints</h1>
            <p className="text-muted-foreground">Manage and resolve complaints from students, parents and staff</p>
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Register Complaint
          </Button>
        </div>

        {/* Status Summary */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Open', count: statusCounts['Open'] || 0, icon: MessageSquare, color: 'border-l-blue-500', textColor: 'text-blue-600' },
            { label: 'In Progress', count: statusCounts['In-progress'] || 0, icon: Clock, color: 'border-l-purple-500', textColor: 'text-purple-600' },
            { label: 'Resolved', count: statusCounts['Resolved'] || 0, icon: CheckCircle2, color: 'border-l-green-500', textColor: 'text-green-600' },
            { label: 'Total', count: total, icon: AlertTriangle, color: 'border-l-gray-400', textColor: '' },
          ].map(({ label, count, icon: Icon, color, textColor }) => (
            <Card key={label} className={`border-l-4 ${color}`}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search subject or complainant..." value={searchIn} onChange={e => setSearchIn(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {['Open','In-progress','Resolved','Closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  {['Critical','High','Medium','Low'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchComplaints} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : complaints.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4" />
                <p className="font-medium">No complaints found</p>
                <Button className="mt-4" onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />Register First Complaint
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Complainant</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map(c => (
                      <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="font-medium text-sm">{c.subject}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{c.complainantId}</div>
                          <div className="text-xs text-muted-foreground">{c.complainantType}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border ${PRIORITY_STYLES[c.priority] || ''}`}>
                            {c.priority}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${STATUS_STYLES[c.status] || 'bg-gray-100 text-gray-700'}`}>
                            {c.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.assignedTo || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(c.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelected(c); setResolution(''); setViewOpen(true); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {c.status === 'Open' && (
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(c.id, 'In-progress')}>
                                Start
                              </Button>
                            )}
                            {c.status !== 'Resolved' && c.status !== 'Closed' && (
                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => { setSelected(c); setResolution(''); setViewOpen(true); }}>
                                Resolve
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDelete(c.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Register Complaint Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Register Complaint</DialogTitle><DialogDescription>Log a new complaint or grievance</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Complainant Type *</Label>
                <Select value={form.complainantType} onValueChange={v => uf('complainantType', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Student','Parent','Staff','Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Complainant ID / Name *</Label><Input className="mt-1" value={form.complainantId} onChange={e => uf('complainantId', e.target.value)} placeholder="Name or admission no." /></div>
            </div>
            <div><Label>Subject *</Label><Input className="mt-1" value={form.subject} onChange={e => uf('subject', e.target.value)} placeholder="Brief subject" /></div>
            <div>
              <Label>Description *</Label>
              <textarea
                className="mt-1 w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                value={form.description} onChange={e => uf('description', e.target.value)}
                placeholder="Describe the complaint in detail..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => uf('priority', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{['Critical','High','Medium','Low'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Assigned To</Label><Input className="mt-1" value={form.assignedTo} onChange={e => uf('assignedTo', e.target.value)} placeholder="Staff name" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View & Resolve Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[selected.priority]}`}>
                  {selected.priority}
                </span>
              )}
              {selected?.subject}
            </DialogTitle>
            <DialogDescription>
              {selected?.complainantType}: {selected?.complainantId} · {selected && fmtDate(selected.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">{selected.description}</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[selected.status]}`}>{selected.status}</span>
              </div>
              {selected.assignedTo && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Assigned To</span>
                  <span className="font-medium">{selected.assignedTo}</span>
                </div>
              )}
              {selected.resolution && (
                <div>
                  <p className="text-sm font-semibold text-green-700 mb-1">Resolution</p>
                  <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-sm">{selected.resolution}</div>
                </div>
              )}
              {!['Resolved','Closed'].includes(selected.status) && (
                <div>
                  <Label>Resolution Notes *</Label>
                  <textarea
                    className="mt-1 w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    value={resolution} onChange={e => setResolution(e.target.value)}
                    placeholder="Describe how the complaint was resolved..."
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            {selected && !['Resolved','Closed'].includes(selected.status) && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleResolve} disabled={resolving || !resolution}>
                {resolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <CheckCircle2 className="mr-2 h-4 w-4" />Mark Resolved
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
