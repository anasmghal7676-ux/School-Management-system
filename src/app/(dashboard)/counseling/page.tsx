'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeartHandshake, Plus, Search, Edit, Trash2, RefreshCw, Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const ISSUES = ['Academic Performance','Behavioral Issue','Family Problem','Bullying (victim)','Bullying (perpetrator)','Peer Conflict','Anxiety/Stress','Career Guidance','Attendance','Personal Issue','Other'];
const SESSIONS = ['Individual','Group','Parent','Referral','Follow-up'];
const OUTCOMES = ['Resolved','Improving','Ongoing','Referred','Escalated','No Change'];

export default function CounselingPage() {
  const [records, setRecords]   = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatus] = useState('');
  const [dialog, setDialog]     = useState(false);
  const [editing, setEditing]   = useState<any>(null);
  const [detailId, setDetailId] = useState<string|null>(null);

  const EMPTY = {
    studentId: '', counselorName: '', sessionDate: new Date().toISOString().slice(0,10),
    sessionType: 'Individual', issue: '', description: '', sessionNotes: '',
    followUpDate: '', followUpNotes: '', outcome: 'Ongoing', parentInformed: false,
    confidential: true, priority: 'Normal',
  };
  const [form, setForm] = useState<any>(EMPTY);
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        fetch('/api/counseling?limit=200'),
        fetch('/api/students?limit=500&status=active'),
      ]);
      const [rData, sData] = await Promise.all([rRes.json(), sRes.json()]);
      if (rData.success) setRecords(rData.data || []);
      if (sData.success) setStudents(sData.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...EMPTY, ...r }); setDialog(true); };

  const save = async () => {
    if (!form.studentId || !form.issue) { toast({ title: 'Student and issue type required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/counseling/${editing.id}` : '/api/counseling';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `✅ Session ${editing ? 'updated' : 'logged'}` });
      setDialog(false); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this counseling record?')) return;
    await fetch(`/api/counseling/${id}`, { method: 'DELETE' });
    toast({ title: '✅ Deleted' }); load();
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search || r.student?.fullName?.toLowerCase().includes(q) || r.issue?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.outcome === statusFilter;
    return matchSearch && matchStatus;
  });

  const upcoming = records.filter(r => r.followUpDate && new Date(r.followUpDate) >= new Date() && r.outcome === 'Ongoing');
  const overdue  = records.filter(r => r.followUpDate && new Date(r.followUpDate) < new Date() && r.outcome === 'Ongoing');
  const highPriority = records.filter(r => r.priority === 'High' && r.outcome === 'Ongoing');

  const OUTCOME_COLOR: Record<string,string> = {
    Resolved: 'bg-green-100 text-green-700', Improving: 'bg-teal-100 text-teal-700',
    Ongoing: 'bg-blue-100 text-blue-700', Referred: 'bg-purple-100 text-purple-700',
    Escalated: 'bg-red-100 text-red-700', 'No Change': 'bg-gray-100 text-gray-600',
  };

  const PRIORITY_COLOR: Record<string,string> = {
    High: 'bg-red-100 text-red-700', Normal: 'bg-gray-100 text-gray-600', Low: 'bg-green-100 text-green-700',
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Counseling & Welfare"
        description="Student counseling sessions, follow-ups & case management"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Log Session</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Sessions', value: records.length, icon: HeartHandshake, color: 'border-l-purple-500' },
          { label: 'Active Cases', value: records.filter(r => r.outcome === 'Ongoing').length, icon: Clock, color: 'border-l-blue-500' },
          { label: 'Follow-ups Due', value: overdue.length, icon: AlertCircle, color: 'border-l-red-500' },
          { label: 'Resolved', value: records.filter(r => r.outcome === 'Resolved').length, icon: CheckCircle2, color: 'border-l-green-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              <Icon className="h-6 w-6 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">All Sessions</TabsTrigger>
          <TabsTrigger value="followup">Follow-ups ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
          <TabsTrigger value="priority">High Priority ({highPriority.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search student or issue..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Outcomes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                {OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y">{[...Array(5)].map((_,i) => <div key={i} className="h-14 animate-pulse bg-muted/20 m-2 rounded" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <HeartHandshake className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No counseling sessions recorded</p>
                  <Button size="sm" className="mt-3" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Log Session</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Student</TableHead><TableHead>Issue</TableHead><TableHead>Session</TableHead>
                      <TableHead>Date</TableHead><TableHead>Follow-up</TableHead><TableHead>Priority</TableHead>
                      <TableHead>Outcome</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(r => (
                      <TableRow key={r.id} className="hover:bg-muted/20 transition-colors group">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{r.student?.fullName}</p>
                            <p className="text-xs text-muted-foreground">{r.student?.class?.name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-32 truncate">{r.issue}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{r.sessionType}</Badge></TableCell>
                        <TableCell className="text-sm">{r.sessionDate ? new Date(r.sessionDate).toLocaleDateString('en-PK') : '—'}</TableCell>
                        <TableCell>
                          {r.followUpDate ? (
                            <span className={`text-sm ${new Date(r.followUpDate) < new Date() && r.outcome === 'Ongoing' ? 'text-red-600 font-medium' : ''}`}>
                              {new Date(r.followUpDate).toLocaleDateString('en-PK')}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell><Badge className={`text-xs ${PRIORITY_COLOR[r.priority] || ''}`}>{r.priority}</Badge></TableCell>
                        <TableCell><Badge className={`text-xs ${OUTCOME_COLOR[r.outcome] || ''}`}>{r.outcome}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {[
          { key: 'followup', data: upcoming, title: 'Upcoming Follow-ups', icon: Calendar },
          { key: 'overdue', data: overdue, title: 'Overdue Follow-ups', icon: AlertCircle },
          { key: 'priority', data: highPriority, title: 'High Priority Cases', icon: AlertCircle },
        ].map(({ key, data, title, icon: Icon }) => (
          <TabsContent key={key} value={key} className="mt-4 space-y-3">
            {data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Icon className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No records in this category</p></div>
            ) : data.map(r => (
              <Card key={r.id} className={`border-l-4 ${key === 'overdue' ? 'border-l-red-500' : key === 'priority' ? 'border-l-orange-400' : 'border-l-blue-400'}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{r.student?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{r.issue} · {r.sessionType} Session</p>
                    {r.followUpDate && <p className="text-xs text-muted-foreground mt-1">Follow-up: {new Date(r.followUpDate).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short' })}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Badge className={`${OUTCOME_COLOR[r.outcome] || ''}`}>{r.outcome}</Badge>
                    <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Edit className="h-3.5 w-3.5 mr-1" />Update</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Log'} Counseling Session</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Student *</Label>
              <Select value={form.studentId} onValueChange={v => f('studentId', v)} disabled={!!editing}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.class?.name})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Issue Type *</Label>
              <Select value={form.issue} onValueChange={v => f('issue', v)}>
                <SelectTrigger><SelectValue placeholder="Select issue" /></SelectTrigger>
                <SelectContent>{ISSUES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Session Type</Label>
              <Select value={form.sessionType} onValueChange={v => f('sessionType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => f('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Low','Normal','High'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Session Date</Label><Input type="date" value={form.sessionDate} onChange={e => f('sessionDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Follow-up Date</Label><Input type="date" value={form.followUpDate} onChange={e => f('followUpDate', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Counselor Name</Label><Input value={form.counselorName} onChange={e => f('counselorName', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Session Notes</Label><Textarea value={form.sessionNotes} onChange={e => f('sessionNotes', e.target.value)} rows={3} placeholder="Observations, discussion points..." /></div>
            <div className="space-y-1.5"><Label>Outcome</Label>
              <Select value={form.outcome} onValueChange={v => f('outcome', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.parentInformed} onChange={e => f('parentInformed', e.target.checked)} className="rounded" />
                <span className="text-sm">Parent Informed</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.confidential} onChange={e => f('confidential', e.target.checked)} className="rounded" />
                <span className="text-sm">Confidential</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              {editing ? 'Update' : 'Log Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
