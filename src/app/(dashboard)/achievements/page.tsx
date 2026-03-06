'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Plus, Search, Edit, Trash2, RefreshCw, Star, Medal, Award } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['Academic','Sports','Arts','Technology','Science','Leadership','Community Service','Cultural','Literary','Other'];
const LEVELS = ['School Level','District Level','Provincial Level','National Level','International Level'];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [students, setStudents]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [search, setSearch]             = useState('');
  const [catFilter, setCat]             = useState('');
  const [dialog, setDialog]             = useState(false);
  const [editing, setEditing]           = useState<any>(null);

  const EMPTY = {
    studentId: '', title: '', category: '', level: 'School Level', position: '',
    date: new Date().toISOString().slice(0,10), award: '', description: '',
    event: '', organizer: '', awardedBy: '',
  };
  const [form, setForm] = useState<any>(EMPTY);
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([
        fetch('/api/achievements?limit=200'),
        fetch('/api/students?limit=500&status=active'),
      ]);
      const [aData, sData] = await Promise.all([aRes.json(), sRes.json()]);
      if (aData.success) setAchievements(aData.data || []);
      if (sData.success) setStudents(sData.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ ...EMPTY, ...a }); setDialog(true); };

  const save = async () => {
    if (!form.studentId || !form.title) { toast({ title: 'Student and title required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/achievements/${editing.id}` : '/api/achievements';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `✅ Achievement ${editing ? 'updated' : 'recorded'}` });
      setDialog(false); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this achievement?')) return;
    await fetch(`/api/achievements/${id}`, { method: 'DELETE' });
    toast({ title: '✅ Deleted' }); load();
  };

  const filtered = achievements.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search || a.student?.fullName?.toLowerCase().includes(q) || a.title?.toLowerCase().includes(q) || a.event?.toLowerCase().includes(q);
    const matchCat = !catFilter || a.category === catFilter;
    return matchSearch && matchCat;
  });

  // Leaderboard - top students by achievement count
  const leaderboard = Object.values(
    achievements.reduce((acc: Record<string,any>, a: any) => {
      const id = a.studentId;
      if (!acc[id]) acc[id] = { id, name: a.student?.fullName, class: a.student?.class?.name, count: 0, national: 0, awards: [] };
      acc[id].count++;
      if (a.level === 'National Level' || a.level === 'International Level') acc[id].national++;
      acc[id].awards.push(a.category);
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.count - a.count).slice(0, 10);

  // Category breakdown
  const catBreakdown = CATEGORIES.map(c => ({ cat: c, count: achievements.filter(a => a.category === c).length })).filter(c => c.count > 0).sort((a,b) => b.count - a.count);

  const LEVEL_COLOR: Record<string,string> = {
    'School Level': 'bg-gray-100 text-gray-700',
    'District Level': 'bg-blue-100 text-blue-700',
    'Provincial Level': 'bg-indigo-100 text-indigo-700',
    'National Level': 'bg-purple-100 text-purple-700',
    'International Level': 'bg-amber-100 text-amber-700',
  };

  const POS_ICON: Record<string,string> = { '1st': '🥇', '2nd': '🥈', '3rd': '🥉' };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Student Achievements"
        description="Awards, competitions, certificates & academic distinctions"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Achievement</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Achievements', value: achievements.length, icon: Trophy, color: 'border-l-amber-500' },
          { label: 'National / Intl', value: achievements.filter(a => ['National Level','International Level'].includes(a.level)).length, icon: Star, color: 'border-l-purple-500' },
          { label: 'This Year', value: achievements.filter(a => a.date?.startsWith(new Date().getFullYear().toString())).length, icon: Medal, color: 'border-l-blue-500' },
          { label: 'Categories', value: catBreakdown.length, icon: Award, color: 'border-l-green-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              <Icon className="h-6 w-6 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">🏆 Leaderboard</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search student, achievement..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={catFilter} onValueChange={v => setCat(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-32 skeleton rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No achievements found</p>
              <Button size="sm" className="mt-3" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Record Achievement</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {filtered.map(a => (
                <Card key={a.id} className="card-hover group">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-2xl">{POS_ICON[a.position] || '🏅'}</div>
                      <div className="flex gap-1">
                        <Badge className={`text-xs ${LEVEL_COLOR[a.level] || ''}`}>{a.level?.split(' ')[0]}</Badge>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{a.student?.fullName} · {a.student?.class?.name}</p>
                    {a.event && <p className="text-xs text-muted-foreground">📍 {a.event}</p>}
                    {a.date && <p className="text-xs text-muted-foreground mt-1">📅 {new Date(a.date).toLocaleDateString('en-PK')}</p>}
                    <div className="flex gap-1 mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(a)}><Edit className="h-3 w-3 mr-1" />Edit</Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(a.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40"><TableHead className="w-12">Rank</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead className="text-center">Total</TableHead><TableHead className="text-center">National+</TableHead><TableHead>Categories</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((s: any, i) => (
                    <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-bold text-center text-lg">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold">{s.name?.[0]}</div>
                          <span className="font-medium text-sm">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.class}</TableCell>
                      <TableCell className="text-center font-bold text-lg">{s.count}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline" className="text-xs">{s.national}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {[...new Set(s.awards)].slice(0,3).map((c: any) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {catBreakdown.map(({ cat, count }) => (
              <Card key={cat} className="card-hover cursor-pointer" onClick={() => { setCat(cat); }}>
                <CardContent className="p-5 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{cat}</p>
                    <p className="text-xs text-muted-foreground mt-1">{count} achievement{count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">{count}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Record'} Achievement</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Student *</Label>
              <Select value={form.studentId} onValueChange={v => f('studentId', v)} disabled={!!editing}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.class?.name})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Achievement Title *</Label><Input value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. 1st Position in Science Olympiad" /></div>
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={form.category} onValueChange={v => f('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Level</Label>
              <Select value={form.level} onValueChange={v => f('level', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Position / Rank</Label>
              <Select value={form.position} onValueChange={v => f('position', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{['1st','2nd','3rd','Participation','Runner-up','Merit','Distinction'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={e => f('date', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Event / Competition Name</Label><Input value={form.event} onChange={e => f('event', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Organizer</Label><Input value={form.organizer} onChange={e => f('organizer', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Award / Prize</Label><Input value={form.award} onChange={e => f('award', e.target.value)} placeholder="Trophy, medal, cash..." /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              {editing ? 'Update' : 'Record Achievement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
