'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, GraduationCap, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Shortlisted: 'bg-blue-100 text-blue-700',
  Admitted: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Waitlisted: 'bg-purple-100 text-purple-700',
};
const STATUSES = ['Pending', 'Shortlisted', 'Admitted', 'Rejected', 'Waitlisted'];
const GENDERS = ['Male', 'Female'];
const RELIGIONS = ['Islam', 'Christianity', 'Hinduism', 'Other'];
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function OnlineAdmissionPage() {
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, shortlisted: 0, admitted: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dialog, setDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = () => ({ applicantName: '', dob: '', gender: 'Male', religion: 'Islam', applyingClass: '', previousSchool: '', lastGrade: '', fatherName: '', fatherPhone: '', fatherCnic: '', fatherOccupation: '', motherName: '', motherPhone: '', address: '', academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, interviewDate: '', remarks: '' });
  const [form, setForm] = useState<any>(emptyForm());
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter, class: classFilter });
      const res = await fetch(`/api/online-adm?${params}`);
      const data = await res.json();
      setItems(data.items || []); setClasses(data.classes || []); setSummary(data.summary || {});
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, statusFilter, classFilter]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.applicantName || !form.applyingClass) { toast({ title: 'Name and class required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/online-adm', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) });
      toast({ title: editing ? 'Updated' : 'Application submitted' }); setDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/online-adm', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    toast({ title: `Status → ${status}` }); load(); if (viewDialog?.id === id) setViewDialog((v: any) => v ? { ...v, status } : v);
  };

  const del = async (id: string) => {
    if (!confirm('Delete application?')) return;
    await fetch('/api/online-adm', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Deleted' }); load();
  };

  const KanbanColumn = ({ status, color }: { status: string, color: string }) => {
    const col = items.filter(i => (i.status || 'Pending') === status);
    return (
      <div className="flex-1 min-w-64">
        <div className={`rounded-t-lg px-3 py-2 text-sm font-medium ${color} flex items-center justify-between`}>
          <span>{status}</span><Badge className="bg-white/60 text-current text-xs">{col.length}</Badge>
        </div>
        <div className="bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-40">
          {col.map(app => (
            <Card key={app.id} className="cursor-pointer hover:shadow-md card-hover" onClick={() => setViewDialog(app)}>
              <CardContent className="p-3">
                <p className="font-medium text-sm">{app.applicantName}</p>
                <p className="text-xs text-muted-foreground">Class {app.applyingClass} · {app.applicationNo}</p>
                <p className="text-xs text-muted-foreground">{app.fatherName}</p>
                {app.interviewDate && <p className="text-xs text-blue-600 mt-1">📅 {fmtDate(app.interviewDate)}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Online Admission" description="Manage student admission applications — pipeline from submission to enrollment"
        actions={<Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />New Application</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: summary.total, color: 'border-l-slate-500' },
          { label: 'Pending', value: summary.pending, color: 'border-l-amber-500' },
          { label: 'Shortlisted', value: summary.shortlisted, color: 'border-l-blue-500' },
          { label: 'Admitted', value: summary.admitted, color: 'border-l-green-500' },
          { label: 'Rejected', value: summary.rejected, color: 'border-l-red-500' },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}><CardContent className="p-3"><p className="text-2xl font-bold">{c.value}</p><p className="text-xs text-muted-foreground">{c.label}</p></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">📋 List View</TabsTrigger>
          <TabsTrigger value="kanban">🗂 Pipeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-4">
          <Card><CardContent className="p-4"><div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or application #..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="Class" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div></CardContent></Card>

          {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            items.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No applications found</p></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map(app => (
                <Card key={app.id} className="hover:shadow-md cursor-pointer card-hover" onClick={() => setViewDialog(app)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold">{app.applicantName}</p>
                        <p className="text-xs text-muted-foreground">{app.applicationNo}</p>
                      </div>
                      <Badge className={`text-xs ${STATUS_COLORS[app.status || 'Pending']}`}>{app.status || 'Pending'}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>🎓 Applying for: <strong>{app.applyingClass}</strong></p>
                      <p>👤 Father: {app.fatherName}</p>
                      <p>📞 {app.fatherPhone}</p>
                      {app.interviewDate && <p className="text-blue-600">📅 Interview: {fmtDate(app.interviewDate)}</p>}
                    </div>
                    <div className="flex gap-1 mt-3" onClick={e => e.stopPropagation()}>
                      {app.status !== 'Admitted' && app.status !== 'Rejected' && (
                        <>
                          <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-700 px-2" onClick={() => updateStatus(app.id, 'Shortlisted')}>Shortlist</Button>
                          <Button variant="ghost" size="sm" className="h-6 text-xs text-green-700 px-2" onClick={() => updateStatus(app.id, 'Admitted')}>Admit</Button>
                          <Button variant="ghost" size="sm" className="h-6 text-xs text-red-700 px-2" onClick={() => updateStatus(app.id, 'Rejected')}>Reject</Button>
                        </>
                      )}
                      <div className="flex-1" />
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditing(app); setForm(app); setDialog(true); }}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => del(app.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <div className="flex gap-4 overflow-x-auto pb-4">
            <KanbanColumn status="Pending" color="bg-amber-100 text-amber-800" />
            <KanbanColumn status="Shortlisted" color="bg-blue-100 text-blue-800" />
            <KanbanColumn status="Admitted" color="bg-green-100 text-green-800" />
            <KanbanColumn status="Waitlisted" color="bg-purple-100 text-purple-800" />
            <KanbanColumn status="Rejected" color="bg-red-100 text-red-800" />
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Application' : 'New Admission Application'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student Information</div>
            <div className="col-span-2 space-y-1.5"><Label>Full Name *</Label><Input value={form.applicantName} onChange={e => f('applicantName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.dob} onChange={e => f('dob', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Gender</Label><Select value={form.gender} onValueChange={v => f('gender', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Religion</Label><Select value={form.religion} onValueChange={v => f('religion', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RELIGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Applying for Class *</Label><Select value={form.applyingClass} onValueChange={v => f('applyingClass', v)}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Previous School</Label><Input value={form.previousSchool} onChange={e => f('previousSchool', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Last Grade / %</Label><Input value={form.lastGrade} onChange={e => f('lastGrade', e.target.value)} /></div>

            <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t pt-3 mt-1">Parent / Guardian</div>
            <div className="space-y-1.5"><Label>Father Name</Label><Input value={form.fatherName} onChange={e => f('fatherName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Father Phone</Label><Input value={form.fatherPhone} onChange={e => f('fatherPhone', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Father CNIC</Label><Input value={form.fatherCnic} onChange={e => f('fatherCnic', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Occupation</Label><Input value={form.fatherOccupation} onChange={e => f('fatherOccupation', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Mother Name</Label><Input value={form.motherName} onChange={e => f('motherName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Mother Phone</Label><Input value={form.motherPhone} onChange={e => f('motherPhone', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Address</Label><Input value={form.address} onChange={e => f('address', e.target.value)} /></div>

            <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t pt-3 mt-1">Application Details</div>
            <div className="space-y-1.5"><Label>Academic Year</Label><Input value={form.academicYear} onChange={e => f('academicYear', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Interview Date</Label><Input type="date" value={form.interviewDate} onChange={e => f('interviewDate', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Remarks</Label><Textarea value={form.remarks} onChange={e => f('remarks', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Submit'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={o => !o && setViewDialog(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewDialog?.applicantName}</DialogTitle>
            <p className="text-xs text-muted-foreground">{viewDialog?.applicationNo}</p>
          </DialogHeader>
          {viewDialog && <div className="space-y-4 py-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge className={STATUS_COLORS[viewDialog.status || 'Pending']}>{viewDialog.status || 'Pending'}</Badge>
              <Badge variant="outline">Class {viewDialog.applyingClass}</Badge>
              <Badge variant="outline">{viewDialog.gender}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">DOB</span><p className="font-medium">{fmtDate(viewDialog.dob)}</p></div>
              <div><span className="text-muted-foreground">Religion</span><p className="font-medium">{viewDialog.religion}</p></div>
              <div><span className="text-muted-foreground">Prev. School</span><p className="font-medium">{viewDialog.previousSchool || '—'}</p></div>
              <div><span className="text-muted-foreground">Last Grade</span><p className="font-medium">{viewDialog.lastGrade || '—'}</p></div>
              <div><span className="text-muted-foreground">Father</span><p className="font-medium">{viewDialog.fatherName}</p></div>
              <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{viewDialog.fatherPhone}</p></div>
              <div className="col-span-2"><span className="text-muted-foreground">Address</span><p className="font-medium">{viewDialog.address || '—'}</p></div>
            </div>
            {viewDialog.status !== 'Admitted' && viewDialog.status !== 'Rejected' && (
              <div className="flex gap-2 pt-2 border-t">
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => updateStatus(viewDialog.id, 'Shortlisted')}>Shortlist</Button>
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => updateStatus(viewDialog.id, 'Admitted')}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Admit</Button>
                <Button size="sm" variant="destructive" className="flex-1" onClick={() => updateStatus(viewDialog.id, 'Rejected')}><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
              </div>
            )}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
