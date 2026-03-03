'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Plus, Calendar, Edit, Trash2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const EMPTY = { name: '', startDate: '', endDate: '', description: '', isCurrent: false };

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });

function YearProgress({ start, end }: { start: string; end: string }) {
  const now   = Date.now();
  const s     = new Date(start).getTime();
  const e     = new Date(end).getTime();
  const total = e - s;
  const elapsed = Math.max(0, Math.min(now - s, total));
  const pct  = total > 0 ? Math.round((elapsed / total) * 100) : 0;
  const daysLeft = Math.max(0, Math.round((e - now) / 86400000));
  const done = now > e;

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{done ? 'Completed' : `${pct}% complete`}</span>
        <span>{done ? 'Ended' : `${daysLeft} days remaining`}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${done ? 'bg-green-500' : pct > 75 ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function AcademicYearsPage() {
  const [years, setYears]     = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm]       = useState<any>({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Get school info
      const sr = await fetch('/api/settings/school').catch(() => null);
      const sj = sr ? await sr.json() : null;
      const sid = sj?.data?.id || '';
      setSchoolId(sid);

      const r = await fetch('/api/acad-years' + (sid ? `?schoolId=${sid}` : ''));
      const j = await r.json();
      if (j.success) setYears(j.data || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast({ title: 'Name, start date and end date required', variant: 'destructive' }); return;
    }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      toast({ title: 'Start date must be before end date', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, schoolId: schoolId || 'default' };
      const url     = editItem ? `/api/acad-years/${editItem.id}` : '/api/acad-years';
      const method  = editItem ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (j.success) {
        toast({ title: editItem ? 'Year updated' : 'Academic year created' });
        setAddOpen(false); setEditItem(null); setForm({ ...EMPTY }); fetchAll();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleSetCurrent = async (id: string) => {
    setActivating(id);
    try {
      const r = await fetch(`/api/acad-years/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isCurrent: true }),
      });
      const j = await r.json();
      if (j.success) { toast({ title: 'Active academic year updated' }); fetchAll(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setActivating(null); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const r = await fetch(`/api/acad-years/${deleteId}`, { method: 'DELETE' });
      const j = await r.json();
      if (j.success) { toast({ title: 'Deleted' }); fetchAll(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setDeleteId(null); }
  };

  const openEdit = (y: any) => {
    setForm({
      name: y.name, description: y.description || '',
      startDate: y.startDate?.slice(0, 10),
      endDate:   y.endDate?.slice(0, 10),
      isCurrent: y.isCurrent,
    });
    setEditItem(y); setAddOpen(true);
  };

  const uf = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const currentYear = years.find(y => y.isCurrent);

  // Suggest name based on start year
  const suggestName = () => {
    if (form.startDate) {
      const yr = new Date(form.startDate).getFullYear();
      uf('name', `${yr}-${String(yr + 1).slice(2)}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-7 w-7" />Academic Years
            </h1>
            <p className="text-muted-foreground">Manage school academic sessions and set the active year</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAll} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
            </Button>
            <Button onClick={() => { setForm({ ...EMPTY }); setEditItem(null); setAddOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />Add Year
            </Button>
          </div>
        </div>

        {/* Current year banner */}
        {currentYear && (
          <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-200">Current Academic Year: {currentYear.name}</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {fmtDate(currentYear.startDate)} — {fmtDate(currentYear.endDate)}
                    </p>
                  </div>
                </div>
                <div className="w-64">
                  <YearProgress start={currentYear.startDate} end={currentYear.endDate} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && <div className="flex justify-center py-12"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>}

        {/* Years grid */}
        {!loading && years.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
              <Calendar className="h-14 w-14 mb-4 opacity-20" />
              <p className="text-lg font-medium">No academic years configured</p>
              <p className="text-sm mb-4">Create your first academic year to get started</p>
              <Button onClick={() => { setForm({ ...EMPTY }); setEditItem(null); setAddOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />Create First Year
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {years.map((y: any) => {
              const now   = Date.now();
              const start = new Date(y.startDate).getTime();
              const end   = new Date(y.endDate).getTime();
              const isActive = y.isCurrent;
              const isFuture = start > now;
              const isPast   = end < now && !isActive;
              const statusLabel = isActive ? 'Current' : isFuture ? 'Upcoming' : 'Past';
              const statusColor = isActive ? 'bg-green-100 text-green-700' : isFuture ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600';

              return (
                <Card key={y.id} className={`${isActive ? 'ring-2 ring-emerald-400' : ''} hover:shadow-md transition-shadow`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{y.name}</CardTitle>
                        {y.description && <CardDescription className="mt-0.5">{y.description}</CardDescription>}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-medium">{fmtDate(y.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <p className="font-medium">{fmtDate(y.endDate)}</p>
                      </div>
                    </div>

                    {/* Associated data counts */}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{y._count?.feeStructures || 0} fee structures</span>
                      <span>·</span>
                      <span>{y._count?.exams || 0} exams</span>
                    </div>

                    <YearProgress start={y.startDate} end={y.endDate} />

                    <div className="flex gap-2 pt-1">
                      {!isActive && (
                        <Button
                          size="sm" variant="outline" className="flex-1 text-xs"
                          onClick={() => handleSetCurrent(y.id)}
                          disabled={activating === y.id}
                        >
                          {activating === y.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                          Set as Current
                        </Button>
                      )}
                      {isActive && (
                        <div className="flex-1 flex items-center justify-center text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Active Year
                        </div>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(y)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      {!isActive && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600" onClick={() => setDeleteId(y.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add/Edit */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Academic Year' : 'New Academic Year'}</DialogTitle>
            <DialogDescription>Define the academic session dates and name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input className="mt-1" type="date" value={form.startDate} onChange={e => { uf('startDate', e.target.value); }} onBlur={suggestName} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input className="mt-1" type="date" value={form.endDate} onChange={e => uf('endDate', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Year Name *</Label>
              <Input className="mt-1" value={form.name} onChange={e => uf('name', e.target.value)} placeholder="e.g. 2024-25" />
              <p className="text-xs text-muted-foreground mt-0.5">Set dates first — name auto-suggests on blur</p>
            </div>
            <div>
              <Label>Description</Label>
              <Input className="mt-1" value={form.description} onChange={e => uf('description', e.target.value)} placeholder="Optional notes..." />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer card-hover">
              <input type="checkbox" checked={form.isCurrent} onChange={e => uf('isCurrent', e.target.checked)} className="rounded" />
              <span className="font-medium">Set as current active year</span>
              {form.isCurrent && <span className="text-xs text-amber-600">(will deactivate current year)</span>}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Academic Year?</DialogTitle>
            <DialogDescription>
              <span className="flex items-center gap-2 text-amber-600 mt-1">
                <AlertTriangle className="h-4 w-4" />This will also delete linked fee structures and exam records.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
