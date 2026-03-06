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
import { Trophy, Plus, Search, Edit, Trash2, RefreshCw, Medal, Star, Award } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = ['Academic', 'Sports', 'Arts', 'Science', 'Math Olympiad', 'Debate', 'Leadership', 'Community Service', 'Co-curricular', 'Other'];
const LEVELS = ['School', 'District', 'Provincial', 'National', 'International'];
const AWARD_TYPES = ['1st Place', '2nd Place', '3rd Place', 'Merit', 'Participation', 'Special Award', 'Scholarship'];

export default function StudentAchievementPage() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCat] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const EMPTY = {
    studentId: '', title: '', category: '', level: 'School', awardType: '1st Place',
    competitionName: '', organizer: '', achievementDate: new Date().toISOString().slice(0,10),
    description: '', certificateNumber: '', points: '',
  };
  const [form, setForm] = useState<any>(EMPTY);
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([
        fetch('/api/achievements?limit=300'),
        fetch('/api/students?limit=500&status=active'),
      ]);
      const [aData, sData] = await Promise.all([aRes.json(), sRes.json()]);
      if (aData.success) setAchievements(aData.data || []);
      if (sData.success) setStudents(sData.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.studentId || !form.title) {
      toast({ title: 'Student and title required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/achievements/${editing.id}` : '/api/achievements';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `✅ Achievement ${editing ? 'updated' : 'added'}` });
      setDialog(false); setEditing(null); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete?')) return;
    await fetch(`/api/achievements/${id}`, { method: 'DELETE' });
    toast({ title: '✅ Deleted' }); load();
  };

  const filtered = achievements.filter(a => {
    const q = search.toLowerCase();
    const ms = !search || a.student?.fullName?.toLowerCase().includes(q) || a.title?.toLowerCase().includes(q) || a.competitionName?.toLowerCase().includes(q);
    const mc = !catFilter || a.category === catFilter;
    return ms && mc;
  });

  const topStudents = Object.entries(
    achievements.reduce((acc: any, a: any) => {
      if (!acc[a.studentId]) acc[a.studentId] = { student: a.student, count: 0 };
      acc[a.studentId].count++;
      return acc;
    }, {})
  ).sort((a: any, b: any) => b[1].count - a[1].count).slice(0, 5);

  const LEVEL_C: Record<string, string> = { School: 'bg-gray-100 text-gray-700', District: 'bg-blue-100 text-blue-700', Provincial: 'bg-purple-100 text-purple-700', National: 'bg-amber-100 text-amber-700', International: 'bg-emerald-100 text-emerald-700' };
  const AWARD_ICON: Record<string, string> = { '1st Place': '🥇', '2nd Place': '🥈', '3rd Place': '🥉', Merit: '🏅', Participation: '🎖', 'Special Award': '🌟', Scholarship: '📚' };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Student Achievements"
        description="Track and celebrate student awards, honors and accomplishments"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm" onClick={() => { setEditing(null); setForm(EMPTY); setDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Add Achievement
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Achievements', value: achievements.length, icon: Trophy, color: 'border-l-amber-500' },
          { label: 'National+', value: achievements.filter(a => ['National','International'].includes(a.level)).length, icon: Medal, color: 'border-l-emerald-500' },
          { label: 'First Places', value: achievements.filter(a => a.awardType === '1st Place').length, icon: Star, color: 'border-l-yellow-500' },
          { label: 'Categories', value: new Set(achievements.map(a => a.category)).size, icon: Award, color: 'border-l-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              <Icon className="h-6 w-6 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {topStudents.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" />Top Achievers</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {topStudents.map(([id, data]: any, i) => (
                <div key={id} className="flex flex-col items-center gap-2 min-w-20">
                  <div className={"h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md " + ['bg-amber-400','bg-gray-400','bg-orange-400','bg-blue-400','bg-purple-400'][i]}>
                    {data.student?.fullName?.[0] || '?'}{i < 3 && <span className="absolute -top-1 -right-1 text-xs">{['🥇','🥈','🥉'][i]}</span>}
                  </div>
                  <p className="text-xs font-medium text-center leading-tight">{data.student?.fullName?.split(' ')?.[0]}</p>
                  <Badge variant="secondary" className="text-xs">{data.count} awards</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search achievements..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={v => setCat(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">{[...Array(6)].map((_,i) => <div key={i} className="h-14 m-2 rounded animate-pulse bg-muted/30" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No achievements found</p>
              <Button size="sm" className="mt-3" onClick={() => { setEditing(null); setForm(EMPTY); setDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />Add First Achievement
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Student</TableHead>
                  <TableHead>Achievement</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Award</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{a.student?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{a.student?.class?.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{a.title}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.category}</Badge></TableCell>
                    <TableCell className="text-sm">{AWARD_ICON[a.awardType] || ''} {a.awardType}</TableCell>
                    <TableCell><Badge className={`text-xs ${LEVEL_C[a.level] || ''}`}>{a.level}</Badge></TableCell>
                    <TableCell className="text-sm">{a.competitionName || '—'}</TableCell>
                    <TableCell className="text-sm">{a.achievementDate ? new Date(a.achievementDate).toLocaleDateString('en-PK') : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(a); setForm({ ...EMPTY, ...a }); setDialog(true); }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(a.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={open => { setDialog(open); if (!open) setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Achievement</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Student *</Label>
              <Select value={form.studentId} onValueChange={v => f('studentId', v)}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Achievement Title *</Label><Input value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. Science Olympiad Winner" /></div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => f('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select value={form.level} onValueChange={v => f('level', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Award Type</Label>
              <Select value={form.awardType} onValueChange={v => f('awardType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AWARD_TYPES.map(t => <SelectItem key={t} value={t}>{AWARD_ICON[t] || ''} {t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.achievementDate} onChange={e => f('achievementDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Competition Name</Label><Input value={form.competitionName} onChange={e => f('competitionName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Organizer</Label><Input value={form.organizer} onChange={e => f('organizer', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Certificate No.</Label><Input value={form.certificateNumber} onChange={e => f('certificateNumber', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Points/Score</Label><Input value={form.points} onChange={e => f('points', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              {editing ? 'Update' : 'Add Achievement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
