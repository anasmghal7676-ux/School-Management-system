'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search, Trash2, RefreshCw, Link2, UserCheck, Percent } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

export default function SiblingsPage() {
  const [groups, setGroups]     = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [dialog, setDialog]     = useState(false);
  const [selectedStudents, setSelected] = useState<string[]>([]);
  const [discount, setDiscount] = useState('10');
  const [studentSearch, setStudentSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, sRes] = await Promise.all([
        fetch('/api/siblings?limit=100'),
        fetch('/api/students?limit=500&status=active'),
      ]);
      const [gData, sData] = await Promise.all([gRes.json(), sRes.json()]);
      if (gData.success) setGroups(gData.data || []);
      if (sData.success) setStudents(sData.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStudent = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const save = async () => {
    if (selectedStudents.length < 2) { toast({ title: 'Select at least 2 students', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/siblings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: selectedStudents, discountPercent: parseFloat(discount) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: '✅ Sibling group created' });
      setDialog(false); setSelected([]); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const delGroup = async (id: string) => {
    if (!confirm('Remove this sibling group?')) return;
    await fetch(`/api/siblings/${id}`, { method: 'DELETE' });
    toast({ title: '✅ Group removed' }); load();
  };

  const filtered = groups.filter(g => {
    const q = search.toLowerCase();
    return !search || g.students?.some((s: any) => s.fullName?.toLowerCase().includes(q));
  });

  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase();
    return !studentSearch || s.fullName?.toLowerCase().includes(q) || s.admissionNumber?.includes(q);
  });

  const totalGroups    = groups.length;
  const totalSiblings  = groups.reduce((sum, g) => sum + (g.students?.length || 0), 0);
  const withDiscount   = groups.filter(g => g.discountPercent > 0).length;
  const avgDiscount    = groups.length > 0 ? Math.round(groups.reduce((s, g) => s + (g.discountPercent || 0), 0) / groups.length) : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Sibling Management"
        description="Link siblings for family fee discounts and concurrent enrollment"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm" onClick={() => { setSelected([]); setStudentSearch(''); setDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />New Sibling Group
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Sibling Groups', value: totalGroups, icon: Users, color: 'border-l-blue-500' },
          { label: 'Total Siblings', value: totalSiblings, icon: UserCheck, color: 'border-l-green-500' },
          { label: 'With Discount', value: withDiscount, icon: Percent, color: 'border-l-amber-500' },
          { label: 'Avg Discount', value: `${avgDiscount}%`, icon: Link2, color: 'border-l-purple-500', isText: true },
        ].map(({ label, value, icon: Icon, color, isText }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className={`${isText ? 'text-xl' : 'text-2xl'} font-bold`}>{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              <Icon className="h-6 w-6 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search by student name..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid gap-4">{[...Array(3)].map((_,i) => <div key={i} className="h-32 skeleton rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No sibling groups found</p>
          <p className="text-sm mt-1">Create groups to apply family fee discounts</p>
          <Button size="sm" className="mt-3" onClick={() => { setSelected([]); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Create Group</Button>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {filtered.map((g: any) => (
            <Card key={g.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-4.5 w-4.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{g.students?.length || 0} Siblings</p>
                      <p className="text-xs text-muted-foreground">Family Group</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.discountPercent > 0 && (
                      <Badge className="bg-green-100 text-green-700"><Percent className="h-3 w-3 mr-1" />{g.discountPercent}% Discount</Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => delGroup(g.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {g.students?.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {s.fullName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{s.fullName}</p>
                        <p className="text-xs text-muted-foreground">{s.admissionNumber} · {s.class?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Sibling Group</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Fee Discount for Siblings (%)</Label>
              <Input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} className="w-32" />
              <p className="text-xs text-muted-foreground">This discount will be applied to all siblings in the group</p>
            </div>
            <div className="space-y-2">
              <Label>Select Students ({selectedStudents.length} selected)</Label>
              <Input placeholder="Search student..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
                {filteredStudents.slice(0,30).map(s => (
                  <label key={s.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors ${selectedStudents.includes(s.id) ? 'bg-blue-50' : ''}`}>
                    <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} className="rounded" />
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {s.fullName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground">{s.admissionNumber} · {s.class?.name}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || selectedStudents.length < 2}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              Create Group ({selectedStudents.length} students)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
