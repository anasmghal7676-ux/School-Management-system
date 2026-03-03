'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Plus, Search, Edit, Trash2, RefreshCw, CheckCircle, Clock, Award, Users } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['Professional Development','Safety Training','IT Skills','Leadership','Subject Matter','Compliance','Soft Skills','First Aid','Management','Other'];
const MODES = ['In-Person','Online','Hybrid','Workshop','Seminar','Self-Study'];

export default function TrainingPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [staff, setStaff]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [tab, setTab]           = useState('programs');
  const [dialog, setDialog]     = useState(false);
  const [editing, setEditing]   = useState<any>(null);

  const EMPTY = {
    title: '', category: '', mode: 'In-Person', trainer: '', startDate: '', endDate: '',
    duration: '', venue: '', maxParticipants: '', cost: '', description: '',
    objectives: '', certificateProvided: false, status: 'Upcoming',
  };
  const [form, setForm] = useState<any>(EMPTY);
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/training?limit=100'),
        fetch('/api/staff?limit=200&status=active'),
      ]);
      const [pData, sData] = await Promise.all([pRes.json(), sRes.json()]);
      if (pData.success) setPrograms(pData.data || []);
      if (sData.success) setStaff(sData.data?.staff || sData.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ ...EMPTY, ...p }); setDialog(true); };

  const save = async () => {
    if (!form.title || !form.category) { toast({ title: 'Title and category required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/training/${editing.id}` : '/api/training';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `✅ Training ${editing ? 'updated' : 'created'}` });
      setDialog(false); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this training program?')) return;
    await fetch(`/api/training/${id}`, { method: 'DELETE' });
    toast({ title: '✅ Deleted' }); load();
  };

  const markComplete = async (id: string) => {
    await fetch(`/api/training/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Completed' }) });
    toast({ title: '✅ Marked as completed' }); load();
  };

  const filtered = programs.filter(p => {
    const q = search.toLowerCase();
    return !search || p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.trainer?.toLowerCase().includes(q);
  });

  const upcoming   = programs.filter(p => p.status === 'Upcoming');
  const ongoing    = programs.filter(p => p.status === 'Ongoing');
  const completed  = programs.filter(p => p.status === 'Completed');

  const totalCost  = programs.reduce((s, p) => s + parseFloat(p.cost || 0), 0);
  const totalCerts = programs.filter(p => p.certificateProvided && p.status === 'Completed').length;

  const STATUS_COLOR: Record<string,string> = {
    Upcoming: 'bg-blue-100 text-blue-700', Ongoing: 'bg-amber-100 text-amber-700',
    Completed: 'bg-green-100 text-green-700', Cancelled: 'bg-gray-100 text-gray-600',
  };

  const ProgramCard = ({ p }: { p: any }) => (
    <Card className="card-hover cursor-pointer">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <Badge className={`text-xs ${STATUS_COLOR[p.status] || ''}`}>{p.status}</Badge>
          {p.certificateProvided && <Badge variant="outline" className="text-xs text-amber-700 border-amber-300"><Award className="h-3 w-3 mr-1" />Certificate</Badge>}
        </div>
        <h3 className="font-semibold text-sm mb-1">{p.title}</h3>
        <p className="text-xs text-muted-foreground mb-3">{p.category} · {p.mode}</p>
        {p.trainer && <p className="text-xs text-muted-foreground mb-1">👤 {p.trainer}</p>}
        {p.startDate && <p className="text-xs text-muted-foreground mb-1">📅 {new Date(p.startDate).toLocaleDateString('en-PK')}</p>}
        {p.venue && <p className="text-xs text-muted-foreground">📍 {p.venue}</p>}
        <div className="flex gap-1 mt-3 pt-3 border-t">
          <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => openEdit(p)}><Edit className="h-3 w-3 mr-1" />Edit</Button>
          {p.status !== 'Completed' && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-green-700" onClick={() => markComplete(p.id)}><CheckCircle className="h-3 w-3 mr-1" />Complete</Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(p.id)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Training & Development"
        description="Staff training programs, certifications & professional development"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Program</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Programs', value: programs.length, icon: GraduationCap, color: 'border-l-blue-500' },
          { label: 'Upcoming', value: upcoming.length, icon: Clock, color: 'border-l-amber-500' },
          { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'border-l-green-500' },
          { label: 'Certificates Issued', value: totalCerts, icon: Award, color: 'border-l-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              <Icon className="h-6 w-6 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search training programs..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="programs">All ({filtered.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        {['programs','upcoming','completed'].map(t => {
          const data = t === 'upcoming' ? upcoming : t === 'completed' ? completed : filtered;
          return (
            <TabsContent key={t} value={t} className="mt-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_,i) => <div key={i} className="h-52 skeleton rounded-xl animate-pulse" />)}
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No training programs found</p>
                  <Button size="sm" className="mt-3" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Program</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                  {data.map(p => <ProgramCard key={p.id} p={p} />)}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Training Program</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Program Title *</Label><Input value={form.title} onChange={e => f('title', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Category *</Label>
              <Select value={form.category} onValueChange={v => f('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Mode</Label>
              <Select value={form.mode} onValueChange={v => f('mode', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => f('startDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => f('endDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Duration</Label><Input value={form.duration} onChange={e => f('duration', e.target.value)} placeholder="e.g. 3 days / 12 hours" /></div>
            <div className="space-y-1.5"><Label>Max Participants</Label><Input type="number" value={form.maxParticipants} onChange={e => f('maxParticipants', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Trainer/Facilitator</Label><Input value={form.trainer} onChange={e => f('trainer', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Venue</Label><Input value={form.venue} onChange={e => f('venue', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Cost (PKR)</Label><Input type="number" value={form.cost} onChange={e => f('cost', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => f('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Upcoming','Ongoing','Completed','Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center gap-3 pt-1">
              <input type="checkbox" id="cert" checked={form.certificateProvided} onChange={e => f('certificateProvided', e.target.checked)} className="rounded" />
              <Label htmlFor="cert" className="cursor-pointer">Certificate will be provided upon completion</Label>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Learning Objectives</Label><Textarea value={form.objectives} onChange={e => f('objectives', e.target.value)} rows={2} placeholder="What will participants learn?" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              {editing ? 'Update' : 'Create Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
