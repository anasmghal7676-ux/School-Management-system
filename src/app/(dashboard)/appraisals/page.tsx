'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Plus, Star, ChevronLeft, ChevronRight, Trash2,
  RefreshCw, Eye, TrendingUp, Award, Users,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  Draft:        'bg-gray-100 text-gray-700',
  Submitted:    'bg-blue-100 text-blue-700',
  Approved:     'bg-green-100 text-green-700',
  Acknowledged: 'bg-purple-100 text-purple-700',
};

const RATING_CATEGORIES = [
  { key: 'teachingSkills',     label: 'Teaching Skills' },
  { key: 'punctuality',        label: 'Punctuality' },
  { key: 'teamwork',           label: 'Teamwork' },
  { key: 'communication',      label: 'Communication' },
  { key: 'subjectKnowledge',   label: 'Subject Knowledge' },
  { key: 'studentEngagement',  label: 'Student Engagement' },
  { key: 'professionalism',    label: 'Professionalism' },
];

const PERIODS = ['2024-Annual', '2024-Q4', '2024-Q3', '2024-Q2', '2024-Q1', '2023-Annual', '2023-Q4'];

const EMPTY_FORM: Record<string, any> = {
  staffId: '', appraisalPeriod: '2024-Annual',
  reviewDate: new Date().toISOString().slice(0, 10),
  teachingSkills: 3, punctuality: 3, teamwork: 3,
  communication: 3, subjectKnowledge: 3, studentEngagement: 3, professionalism: 3,
  strengths: '', areasForImprovement: '', goals: '', reviewerComments: '',
  status: 'Draft',
};

function StarRating({ value, onChange, size = 'md' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          className={`${sz} transition-colors ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <Star
            className={`${sz} ${s <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

const ratingLabel = (r: number) => {
  if (r >= 4.5) return { text: 'Outstanding', color: 'text-green-600' };
  if (r >= 3.5) return { text: 'Good', color: 'text-blue-600' };
  if (r >= 2.5) return { text: 'Satisfactory', color: 'text-amber-600' };
  if (r >= 1.5) return { text: 'Needs Improvement', color: 'text-orange-600' };
  return { text: 'Unsatisfactory', color: 'text-red-600' };
};

export default function AppraisalsPage() {
  const [appraisals, setAppraisals]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [staff, setStaff]             = useState<any[]>([]);
  const [staffFilter, setStaffFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [summary, setSummary]         = useState<any>(null);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);

  const [addOpen, setAddOpen]         = useState(false);
  const [viewOpen, setViewOpen]       = useState(false);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [selected, setSelected]       = useState<any>(null);
  const [form, setForm]               = useState<Record<string, any>>({ ...EMPTY_FORM });
  const [saving, setSaving]           = useState(false);
  const [updating, setUpdating]       = useState(false);

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => { fetchAppraisals(); }, [staffFilter, periodFilter, page]);

  const fetchStaff = async () => {
    const r = await fetch('/api/staff?limit=200');
    const j = await r.json();
    if (j.success) setStaff(j.data?.staff || j.data || []);
  };

  const fetchAppraisals = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '25' });
      if (staffFilter  !== 'all') p.append('staffId', staffFilter);
      if (periodFilter !== 'all') p.append('period',  periodFilter);
      const r = await fetch(`/api/appraisals?${p}`);
      const j = await r.json();
      if (j.success) {
        setAppraisals(j.data.appraisals);
        setSummary(j.data.summary);
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [staffFilter, periodFilter, page]);

  const handleAdd = async () => {
    if (!form.staffId || !form.appraisalPeriod) {
      toast({ title: 'Staff and period required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/appraisals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Appraisal created' });
        setAddOpen(false); setForm({ ...EMPTY_FORM }); fetchAppraisals();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const r = await fetch(`/api/appraisals/${selected.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
      });
      const j = await r.json();
      if (j.success) { toast({ title: `Status updated to ${newStatus}` }); setViewOpen(false); fetchAppraisals(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/appraisals/${deleteId}`, { method: 'DELETE' });
      toast({ title: 'Deleted' }); setDeleteId(null); fetchAppraisals();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const uf = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

  // Radar chart data for selected appraisal
  const radarData = selected ? RATING_CATEGORIES.map(c => ({
    category: c.label.split(' ')[0],
    value: selected[c.key] || 0,
    fullMark: 5,
  })) : [];

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Award className="h-7 w-7" />Staff Appraisals
            </h1>
            <p className="text-muted-foreground">Performance reviews and ratings for teaching and support staff</p>
          </div>
          <Button onClick={() => { setForm({ ...EMPTY_FORM }); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />New Appraisal
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4 pb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
                <p className="text-3xl font-black text-amber-600">{summary?.avgRating?.toFixed(1) || '—'}</p>
                <p className="text-xs text-muted-foreground">out of 5.0</p>
              </div>
              <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
                <p className="text-3xl font-black text-blue-600">{total}</p>
                <p className="text-xs text-muted-foreground">all periods</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4 pb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Staff Reviewed</p>
                <p className="text-3xl font-black text-green-600">
                  {new Set(appraisals.map(a => a.staffId)).size}
                </p>
                <p className="text-xs text-muted-foreground">unique staff</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <Select value={periodFilter} onValueChange={v => { setPeriodFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Periods" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={staffFilter} onValueChange={v => { setStaffFilter(v); setPage(1); }}>
            <SelectTrigger className="w-52"><SelectValue placeholder="All Staff" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAppraisals} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : appraisals.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Award className="h-12 w-12 mb-4 opacity-30" />
                <p className="font-medium">No appraisals recorded</p>
                <Button className="mt-4" onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />Create First Appraisal
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Review Date</TableHead>
                      <TableHead>Overall</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appraisals.map((a: any) => {
                      const label = ratingLabel(a.overallRating);
                      return (
                        <TableRow key={a.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="font-medium text-sm">{a.staff?.firstName} {a.staff?.lastName}</div>
                            <div className="text-xs text-muted-foreground">{a.staff?.designation} · {a.staff?.department?.name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">{a.appraisalPeriod}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(a.reviewDate)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StarRating value={Math.round(a.overallRating)} size="sm" />
                              <span className={`text-xs font-bold ${label.color}`}>{a.overallRating.toFixed(1)}</span>
                            </div>
                            <p className={`text-xs ${label.color}`}>{label.text}</p>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-700'}`}>
                              {a.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => { setSelected(a); setViewOpen(true); }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600"
                                onClick={() => setDeleteId(a.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} total</p>
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

      {/* ── Add Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Performance Appraisal</DialogTitle>
            <DialogDescription>Rate a staff member's performance across multiple categories</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Staff Member *</Label>
                <Select value={form.staffId} onValueChange={v => uf('staffId', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff..." /></SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.designation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Appraisal Period *</Label>
                <Select value={form.appraisalPeriod} onValueChange={v => uf('appraisalPeriod', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Review Date</Label><Input className="mt-1" type="date" value={form.reviewDate} onChange={e => uf('reviewDate', e.target.value)} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => uf('status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Draft', 'Submitted', 'Approved'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rating categories */}
            <div>
              <Label className="text-sm font-semibold">Performance Ratings (1–5 stars)</Label>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                {RATING_CATEGORIES.map(cat => (
                  <div key={cat.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <span className="text-sm font-medium">{cat.label}</span>
                    <StarRating value={form[cat.key]} onChange={v => uf(cat.key, v)} />
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 flex items-center gap-3">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold">
                    Overall: {(RATING_CATEGORIES.reduce((s, c) => s + (form[c.key] || 0), 0) / RATING_CATEGORIES.length).toFixed(2)}
                    {' '}— {ratingLabel(RATING_CATEGORIES.reduce((s, c) => s + (form[c.key] || 0), 0) / RATING_CATEGORIES.length).text}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Strengths</Label>
                <textarea className="mt-1 w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={form.strengths} onChange={e => uf('strengths', e.target.value)} placeholder="Key strengths observed..." />
              </div>
              <div>
                <Label>Areas for Improvement</Label>
                <textarea className="mt-1 w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={form.areasForImprovement} onChange={e => uf('areasForImprovement', e.target.value)} placeholder="Areas needing attention..." />
              </div>
            </div>
            <div><Label>Goals for Next Period</Label><textarea className="mt-1 w-full min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={form.goals} onChange={e => uf('goals', e.target.value)} placeholder="Set goals for the next review period..." /></div>
            <div><Label>Reviewer Comments</Label><textarea className="mt-1 w-full min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={form.reviewerComments} onChange={e => uf('reviewerComments', e.target.value)} placeholder="Additional comments from reviewer..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Appraisal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={() => { setViewOpen(false); setSelected(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Appraisal — {selected?.staff?.firstName} {selected?.staff?.lastName}</DialogTitle>
            <DialogDescription>{selected?.appraisalPeriod} · {selected && fmtDate(selected.reviewDate)}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5 py-2">
              {/* Overall */}
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-black text-amber-600">{selected.overallRating?.toFixed(1)}</p>
                  <StarRating value={Math.round(selected.overallRating)} size="sm" />
                  <p className={`text-sm font-bold mt-1 ${ratingLabel(selected.overallRating).color}`}>
                    {ratingLabel(selected.overallRating).text}
                  </p>
                </div>
                {/* Radar chart */}
                <div className="flex-1 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                      <Radar dataKey="value" fill="#f59e0b" fillOpacity={0.3} stroke="#f59e0b" strokeWidth={2} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category ratings */}
              <div className="grid sm:grid-cols-2 gap-2">
                {RATING_CATEGORIES.map(cat => selected[cat.key] != null && (
                  <div key={cat.key} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                    <span className="text-sm">{cat.label}</span>
                    <div className="flex items-center gap-1.5">
                      <StarRating value={Math.round(selected[cat.key])} size="sm" />
                      <span className="text-xs font-bold text-muted-foreground">{selected[cat.key]?.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Text fields */}
              {selected.strengths && <div><p className="text-sm font-semibold mb-1">Strengths</p><p className="text-sm bg-muted/40 rounded-lg p-3">{selected.strengths}</p></div>}
              {selected.areasForImprovement && <div><p className="text-sm font-semibold mb-1">Areas for Improvement</p><p className="text-sm bg-muted/40 rounded-lg p-3">{selected.areasForImprovement}</p></div>}
              {selected.goals && <div><p className="text-sm font-semibold mb-1">Goals</p><p className="text-sm bg-muted/40 rounded-lg p-3">{selected.goals}</p></div>}
              {selected.reviewerComments && <div><p className="text-sm font-semibold mb-1">Reviewer Comments</p><p className="text-sm bg-muted/40 rounded-lg p-3">{selected.reviewerComments}</p></div>}

              {/* Status progression */}
              {selected.status !== 'Acknowledged' && (
                <div className="flex gap-2 pt-2">
                  {selected.status === 'Draft' && (
                    <Button className="flex-1" onClick={() => handleUpdateStatus('Submitted')} disabled={updating}>
                      {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Submit for Approval
                    </Button>
                  )}
                  {selected.status === 'Submitted' && (
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus('Approved')} disabled={updating}>
                      Approve
                    </Button>
                  )}
                  {selected.status === 'Approved' && (
                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => handleUpdateStatus('Acknowledged')} disabled={updating}>
                      Mark Acknowledged
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewOpen(false); setSelected(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Appraisal?</DialogTitle><DialogDescription>This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
