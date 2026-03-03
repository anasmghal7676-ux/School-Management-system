'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Plus, Star, Edit, Trash2, RefreshCw, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

// Defaults for a standard Pakistani grading system
const DEFAULT_SCALES = [
  { grade: 'A+', name: 'Outstanding',      minPercentage: 90, maxPercentage: 100, gradePoint: 4.0, description: 'Exceptional performance' },
  { grade: 'A',  name: 'Excellent',        minPercentage: 80, maxPercentage: 89,  gradePoint: 4.0, description: 'Excellent performance' },
  { grade: 'B+', name: 'Very Good',        minPercentage: 70, maxPercentage: 79,  gradePoint: 3.5, description: 'Very good performance' },
  { grade: 'B',  name: 'Good',             minPercentage: 60, maxPercentage: 69,  gradePoint: 3.0, description: 'Good performance' },
  { grade: 'C',  name: 'Satisfactory',     minPercentage: 50, maxPercentage: 59,  gradePoint: 2.0, description: 'Satisfactory performance' },
  { grade: 'D',  name: 'Pass',             minPercentage: 40, maxPercentage: 49,  gradePoint: 1.0, description: 'Minimum passing marks' },
  { grade: 'F',  name: 'Fail',             minPercentage: 0,  maxPercentage: 39,  gradePoint: 0.0, description: 'Below passing threshold' },
];

const GRADE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'A+': { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: '#10b981' },
  'A':  { bg: 'bg-green-100',   text: 'text-green-700',   bar: '#22c55e' },
  'B+': { bg: 'bg-teal-100',    text: 'text-teal-700',    bar: '#14b8a6' },
  'B':  { bg: 'bg-blue-100',    text: 'text-blue-700',    bar: '#3b82f6' },
  'C':  { bg: 'bg-amber-100',   text: 'text-amber-700',   bar: '#f59e0b' },
  'D':  { bg: 'bg-orange-100',  text: 'text-orange-700',  bar: '#f97316' },
  'F':  { bg: 'bg-red-100',     text: 'text-red-700',     bar: '#ef4444' },
};

const EMPTY = { grade: '', name: '', minPercentage: '', maxPercentage: '', gradePoint: '', description: '' };

export default function GradeScalesPage() {
  const [scales, setScales]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [schoolId, setSchoolId]   = useState('');
  const [addOpen, setAddOpen]     = useState(false);
  const [editItem, setEditItem]   = useState<any>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [form, setForm]           = useState<any>({ ...EMPTY });
  const [saving, setSaving]       = useState(false);
  const [seeding, setSeeding]     = useState(false);

  useEffect(() => { fetchSchoolAndScales(); }, []);

  const fetchSchoolAndScales = async () => {
    setLoading(true);
    try {
      // Get school id
      const sr = await fetch('/api/settings/school').catch(() => null);
      const sj = sr ? await sr.json() : null;
      const sid = sj?.data?.id || 'default';
      setSchoolId(sid);

      const r = await fetch(`/api/grade-scales?schoolId=${sid}`);
      const j = await r.json();
      if (j.success) {
        const sorted = (j.data || []).sort((a: any, b: any) => b.minPercentage - a.minPercentage);
        setScales(sorted);
      }
    } catch { toast({ title: 'Error loading grade scales', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.grade || form.minPercentage === '' || form.maxPercentage === '') {
      toast({ title: 'Grade, min %, and max % are required', variant: 'destructive' }); return;
    }
    if (!schoolId) { toast({ title: 'School not configured', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        schoolId,
        minPercentage: parseFloat(form.minPercentage),
        maxPercentage: parseFloat(form.maxPercentage),
        gradePoint:    parseFloat(form.gradePoint) || 0,
      };
      const url    = editItem ? `/api/grade-scales/${editItem.id}` : '/api/grade-scales';
      const method = editItem ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j.success) {
        toast({ title: editItem ? 'Updated' : 'Grade scale added' });
        setAddOpen(false); setEditItem(null); setForm({ ...EMPTY }); fetchSchoolAndScales();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/grade-scales/${deleteId}`, { method: 'DELETE' });
    toast({ title: 'Deleted' }); setDeleteId(null); fetchSchoolAndScales();
  };

  const seedDefaults = async () => {
    if (!schoolId) { toast({ title: 'School not configured', variant: 'destructive' }); return; }
    setSeeding(true);
    try {
      let created = 0;
      for (const scale of DEFAULT_SCALES) {
        const r = await fetch('/api/grade-scales', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...scale, schoolId }),
        });
        const j = await r.json();
        if (j.success) created++;
      }
      toast({ title: `Seeded ${created} default grade scales` });
      fetchSchoolAndScales();
    } catch { toast({ title: 'Seed failed', variant: 'destructive' }); }
    finally { setSeeding(false); }
  };

  const openEdit = (s: any) => {
    setForm({ grade: s.grade, name: s.name, minPercentage: String(s.minPercentage), maxPercentage: String(s.maxPercentage), gradePoint: String(s.gradePoint), description: s.description || '' });
    setEditItem(s); setAddOpen(true);
  };

  const uf = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const barWidth = (scale: any) => ((scale.maxPercentage - scale.minPercentage) / 100) * 100;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Star className="h-7 w-7" />Grade Scales
            </h1>
            <p className="text-muted-foreground">Configure the grading system used for report cards and GPA calculations</p>
          </div>
          <div className="flex gap-2">
            {scales.length === 0 && (
              <Button variant="outline" onClick={seedDefaults} disabled={seeding}>
                {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Load Pakistan Defaults
              </Button>
            )}
            <Button onClick={() => { setForm({ ...EMPTY }); setEditItem(null); setAddOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Add Grade
            </Button>
          </div>
        </div>

        {/* Visual scale bar */}
        {scales.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Grade Distribution Visualization</CardTitle>
              <CardDescription>Each band represents the percentage range for that grade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-10 rounded-lg overflow-hidden flex">
                {scales.map(s => {
                  const color = GRADE_COLORS[s.grade]?.bar || '#6b7280';
                  const width = s.maxPercentage - s.minPercentage;
                  return (
                    <div
                      key={s.id}
                      style={{ width: `${width}%`, backgroundColor: color }}
                      className="relative flex items-center justify-center group"
                      title={`${s.grade}: ${s.minPercentage}–${s.maxPercentage}%`}
                    >
                      <span className="text-xs font-bold text-white drop-shadow">{s.grade}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : scales.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Star className="h-12 w-12 mb-4 opacity-30" />
                <p className="font-medium">No grade scales configured</p>
                <p className="text-sm mb-4">Set up the grading system for report cards and GPA</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={seedDefaults} disabled={seeding}>
                    {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Load Pakistan Defaults
                  </Button>
                  <Button onClick={() => { setForm({ ...EMPTY }); setEditItem(null); setAddOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />Add Manually
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Grade</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Min %</TableHead>
                    <TableHead>Max %</TableHead>
                    <TableHead>GPA Points</TableHead>
                    <TableHead>Range Bar</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scales.map((s: any) => {
                    const col = GRADE_COLORS[s.grade] || { bg: 'bg-gray-100', text: 'text-gray-700', bar: '#6b7280' };
                    return (
                      <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <span className={`inline-flex items-center justify-center h-9 w-9 rounded-full text-sm font-black ${col.bg} ${col.text}`}>
                            {s.grade}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="font-mono font-semibold">{s.minPercentage}%</TableCell>
                        <TableCell className="font-mono font-semibold">{s.maxPercentage}%</TableCell>
                        <TableCell>
                          <span className="font-bold text-lg" style={{ color: col.bar }}>{s.gradePoint?.toFixed(1)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="w-32 bg-muted rounded-full h-2.5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${s.maxPercentage}%`, backgroundColor: col.bar }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{s.minPercentage}–{s.maxPercentage}%</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-40 truncate">{s.description || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => setDeleteId(s.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* GPA Info */}
        {scales.length > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold mb-2">GPA Scale Summary</p>
              <div className="flex flex-wrap gap-3">
                {scales.map(s => (
                  <div key={s.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${GRADE_COLORS[s.grade]?.bg || 'bg-gray-100'}`}>
                    <span className={`font-black text-sm ${GRADE_COLORS[s.grade]?.text || 'text-gray-700'}`}>{s.grade}</span>
                    <span className="text-xs text-muted-foreground">{s.gradePoint?.toFixed(1)} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add/Edit */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Grade Scale' : 'Add Grade Scale'}</DialogTitle>
            <DialogDescription>Define a grade band with its percentage range and GPA points</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Grade *</Label>
                <Input className="mt-1" value={form.grade} onChange={e => uf('grade', e.target.value.toUpperCase())} placeholder="e.g. A+" />
              </div>
              <div>
                <Label>Name</Label>
                <Input className="mt-1" value={form.name} onChange={e => uf('name', e.target.value)} placeholder="e.g. Outstanding" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Min % *</Label>
                <Input className="mt-1" type="number" min="0" max="100" value={form.minPercentage} onChange={e => uf('minPercentage', e.target.value)} />
              </div>
              <div>
                <Label>Max % *</Label>
                <Input className="mt-1" type="number" min="0" max="100" value={form.maxPercentage} onChange={e => uf('maxPercentage', e.target.value)} />
              </div>
              <div>
                <Label>GPA Points</Label>
                <Input className="mt-1" type="number" min="0" max="4" step="0.1" value={form.gradePoint} onChange={e => uf('gradePoint', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input className="mt-1" value={form.description} onChange={e => uf('description', e.target.value)} placeholder="e.g. Exceptional performance" />
            </div>
            {form.grade && form.minPercentage !== '' && form.maxPercentage !== '' && (
              <div className={`rounded-lg p-3 flex items-center gap-3 ${GRADE_COLORS[form.grade]?.bg || 'bg-gray-100'}`}>
                <span className={`text-2xl font-black ${GRADE_COLORS[form.grade]?.text || 'text-gray-700'}`}>{form.grade}</span>
                <div className="text-sm">
                  <p className="font-semibold">{form.name || 'Grade'}</p>
                  <p className="text-muted-foreground">{form.minPercentage}% – {form.maxPercentage}% · {form.gradePoint || 0} GPA points</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editItem ? 'Update' : 'Add Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Grade Scale?</DialogTitle><DialogDescription>This may affect report card calculations.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
