'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Plus, Search, Edit, Trash2, RefreshCw, Users, Mail, Briefcase, Building2 } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

export default function AlumniManagementPage() {
  const [alumni, setAlumni]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState('');
  const [yearFilter, setYear] = useState('');
  const [dialog, setDialog]   = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 20 }, (_, i) => String(currentYear - i));

  const EMPTY = {
    fullName: '', admissionNumber: '', graduationYear: '', degree: '', institution: '',
    employer: '', jobTitle: '', email: '', phone: '', city: '', country: 'Pakistan',
    linkedin: '', achievements: '', category: 'Academic',
  };
  const [form, setForm] = useState<any>(EMPTY);
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '300' });
      if (yearFilter) params.set('graduationYear', yearFilter);
      const res  = await fetch(`/api/alumni?${params}`);
      const data = await res.json();
      if (data.success) setAlumni(data.data || []);
    } catch {} finally { setLoading(false); }
  }, [yearFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ ...EMPTY, ...a }); setDialog(true); };

  const save = async () => {
    if (!form.fullName) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/alumni/${editing.id}` : '/api/alumni';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `✅ Alumni ${editing ? 'updated' : 'registered'}` });
      setDialog(false); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Remove this alumni?')) return;
    await fetch(`/api/alumni/${id}`, { method: 'DELETE' });
    toast({ title: '✅ Removed' }); load();
  };

  const filtered = alumni.filter(a => {
    const q = search.toLowerCase();
    return !search || a.fullName?.toLowerCase().includes(q) || a.employer?.toLowerCase().includes(q) || a.city?.toLowerCase().includes(q) || a.jobTitle?.toLowerCase().includes(q);
  });

  // Group by graduation year
  const byYear: Record<string, any[]> = {};
  filtered.forEach(a => {
    const y = a.graduationYear || 'Unknown';
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(a);
  });

  const workingCount = alumni.filter(a => a.employer).length;
  const higherEdu    = alumni.filter(a => a.institution && !a.employer).length;
  const yearsRepresented = new Set(alumni.map(a => a.graduationYear)).size;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Alumni Management"
        description="Track graduates, career progression and alumni network"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Register Alumni</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Alumni', value: alumni.length, icon: GraduationCap, color: 'border-l-blue-500' },
          { label: 'Working Professionals', value: workingCount, icon: Briefcase, color: 'border-l-green-500' },
          { label: 'Higher Education', value: higherEdu, icon: Building2, color: 'border-l-purple-500' },
          { label: 'Batch Years', value: yearsRepresented, icon: Users, color: 'border-l-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              <Icon className="h-6 w-6 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">All Alumni</TabsTrigger>
          <TabsTrigger value="byYear">By Batch Year</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search name, employer, city..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={yearFilter} onValueChange={v => setYear(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Years" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y">{[...Array(6)].map((_,i) => <div key={i} className="h-16 animate-pulse bg-muted/20 m-2 rounded" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No alumni records found</p>
                  <Button size="sm" className="mt-3" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Register Alumni</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40"><TableHead>Alumni</TableHead><TableHead>Batch</TableHead><TableHead>Current Role</TableHead><TableHead>Location</TableHead><TableHead>Contact</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(a => (
                      <TableRow key={a.id} className="hover:bg-muted/20 transition-colors group">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{a.fullName?.[0]}</div>
                            <div>
                              <p className="font-medium text-sm">{a.fullName}</p>
                              <p className="text-xs text-muted-foreground">{a.admissionNumber}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{a.graduationYear || '—'}</Badge></TableCell>
                        <TableCell>
                          {a.employer ? (
                            <div><p className="text-sm font-medium">{a.jobTitle}</p><p className="text-xs text-muted-foreground">{a.employer}</p></div>
                          ) : a.institution ? (
                            <div><p className="text-sm">📚 {a.institution}</p></div>
                          ) : <span className="text-muted-foreground text-sm">—</span>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.city}{a.country ? `, ${a.country}` : ''}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {a.email && <a href={`mailto:${a.email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"><Mail className="h-3 w-3" /></a>}
                            {a.phone && <span className="text-xs text-muted-foreground">{a.phone}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

        <TabsContent value="byYear" className="mt-4 space-y-6">
          {Object.entries(byYear).sort(([a],[b]) => Number(b)-Number(a)).map(([year, members]) => (
            <div key={year}>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-indigo-100 text-indigo-700 text-sm px-3 py-1"><GraduationCap className="h-3.5 w-3.5 mr-1.5" />Batch {year}</Badge>
                <span className="text-sm text-muted-foreground">{members.length} alumni</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">{a.fullName?.[0]}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{a.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.jobTitle ? `${a.jobTitle} @ ${a.employer}` : a.institution || 'No current info'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Register'} Alumni</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Full Name *</Label><Input value={form.fullName} onChange={e => f('fullName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Admission Number</Label><Input value={form.admissionNumber} onChange={e => f('admissionNumber', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Graduation Year</Label>
              <Select value={form.graduationYear} onValueChange={v => f('graduationYear', v)}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Current Institution (if studying)</Label><Input value={form.institution} onChange={e => f('institution', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Current Employer</Label><Input value={form.employer} onChange={e => f('employer', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Job Title</Label><Input value={form.jobTitle} onChange={e => f('jobTitle', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => f('email', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={e => f('city', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Country</Label><Input value={form.country} onChange={e => f('country', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>LinkedIn Profile</Label><Input value={form.linkedin} onChange={e => f('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
            <div className="col-span-2 space-y-1.5"><Label>Achievements / Notable Work</Label><Input value={form.achievements} onChange={e => f('achievements', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              {editing ? 'Update' : 'Register Alumni'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
