'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Search, ChevronRight, ChevronLeft, UserPlus, CheckCircle2, XCircle, ArrowRight, ClipboardList, Eye, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const STAGES = [
  { key: 'applied',         label: 'Applied',       color: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50 dark:bg-blue-950'   },
  { key: 'document_review', label: 'Doc Review',    color: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50 dark:bg-purple-950' },
  { key: 'interview',       label: 'Interview',     color: 'bg-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50 dark:bg-amber-950'  },
  { key: 'approved',        label: 'Approved',      color: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 dark:bg-green-950'  },
  { key: 'rejected',        label: 'Rejected',      color: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-50 dark:bg-red-950'      },
];
const PROVINCES = ['Punjab','Sindh','KPK','Balochistan','Islamabad','AJK','GB'];
const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const EMPTY_FORM = { fullName:'',gender:'Male',dateOfBirth:'',fatherName:'',motherName:'',fatherOccupation:'',contactNumber:'',alternateContact:'',email:'',address:'',city:'',province:'Punjab',currentClassId:'',previousSchool:'',religion:'Islam',bloodGroup:'',remarks:'' };

export default function AdmissionPage() {
  const [tab, setTab] = useState('pipeline');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [stageCounts, setStageCounts] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchIn, setSearchIn] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ classId:'', sectionId:'', rollNumber:'' });
  const [filtSections, setFiltSections] = useState<any[]>([]);

  useEffect(() => { fetchClasses(); fetchAllSections(); }, []);
  useEffect(() => { const t = setTimeout(() => setSearch(searchIn), 400); return () => clearTimeout(t); }, [searchIn]);
  useEffect(() => { fetchApplicants(); }, [stageFilter, search, page]);
  useEffect(() => { setFiltSections(enrollForm.classId ? sections.filter(s => s.classId === enrollForm.classId) : []); }, [enrollForm.classId, sections]);

  const fetchClasses = async () => { const r = await fetch('/api/classes?limit=100'); const j = await r.json(); if (j.success) setClasses(j.data?.classes || j.data || []); };
  const fetchAllSections = async () => { const r = await fetch('/api/sections?limit=200'); const j = await r.json(); if (j.success) setSections(j.data?.sections || j.data || []); };
  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (stageFilter !== 'all') p.append('stage', stageFilter);
      if (search) p.append('search', search);
      const r = await fetch(`/api/admissions?${p}`);
      const j = await r.json();
      if (j.success) { setApplicants(j.data.applicants); setStageCounts(j.data.stageCounts || {}); setTotalPages(j.data.pagination.totalPages); }
    } catch { toast({ title: 'Error', description: 'Failed to load', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [stageFilter, search, page]);

  const handleAdd = async () => {
    if (!form.fullName || !form.currentClassId) { toast({ title: 'Required', description: 'Name and class required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/admissions', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      const j = await r.json();
      if (j.success) { toast({ title: 'Submitted', description: j.data.admissionNumber }); setAddOpen(false); setForm(EMPTY_FORM); fetchApplicants(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleAction = async (app, action) => {
    try {
      const r = await fetch(`/api/admissions/${app.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action }) });
      const j = await r.json();
      if (j.success) { toast({ title: action === 'reject' ? 'Rejected' : 'Advanced', description: j.message }); fetchApplicants(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleEnroll = async () => {
    if (!enrollForm.classId) { toast({ title: 'Required', description: 'Class required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const r = await fetch(`/api/admissions/${selectedApp.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'enroll', currentClassId:enrollForm.classId, currentSectionId:enrollForm.sectionId||undefined, rollNumber:enrollForm.rollNumber||undefined }) });
      const j = await r.json();
      if (j.success) { toast({ title: 'Enrolled!', description: j.message }); setEnrollOpen(false); setSelectedApp(null); fetchApplicants(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const getStage = (status) => STAGES.find(s => s.key === status) || { label: status, color: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50' };
  const uf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const pipelineApps = applicants.filter(a => !['rejected'].includes(a.status));

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div><h1 className="text-3xl font-bold tracking-tight">Admission Management</h1><p className="text-muted-foreground">Step-by-step student enrollment pipeline</p></div>
          <Button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}><UserPlus className="mr-2 h-4 w-4" />New Application</Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList><TabsTrigger value="pipeline">Pipeline</TabsTrigger><TabsTrigger value="all">All Applications</TabsTrigger></TabsList>

          <TabsContent value="pipeline" className="pt-4 space-y-4">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {STAGES.map(stage => (
                <button key={stage.key} onClick={() => { setStageFilter(stage.key); setTab('all'); }} className={`rounded-xl border-2 border-transparent p-4 text-left transition-all hover:shadow-md ${stage.bg}`}>
                  <div className={`text-3xl font-black ${stage.text}`}>{stageCounts[stage.key] || 0}</div>
                  <div className="flex items-center gap-2 mt-1"><div className={`h-2 w-2 rounded-full ${stage.color}`}/><span className={`text-sm font-semibold ${stage.text}`}>{stage.label}</span></div>
                </button>
              ))}
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle className="text-base">Active Pipeline</CardTitle><CardDescription>Applications needing action</CardDescription></div>
                <Button variant="outline" size="sm" onClick={fetchApplicants} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/></Button>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>
                  : pipelineApps.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-muted-foreground">
                      <ClipboardList className="h-12 w-12 mb-4"/><p className="font-medium">No active applications</p>
                      <Button className="mt-4" onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}><Plus className="mr-2 h-4 w-4"/>Create Application</Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow><TableHead>Applicant</TableHead><TableHead>Class</TableHead><TableHead>Contact</TableHead><TableHead>Date</TableHead><TableHead>Stage</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {pipelineApps.slice(0,15).map(app => {
                          const stage = getStage(app.status);
                          return (
                            <TableRow key={app.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell><div className="font-medium">{app.fullName}</div><div className="text-xs text-muted-foreground">{app.admissionNumber} · {app.gender}</div></TableCell>
                              <TableCell className="text-sm">{app.class?.name||'—'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{app.contactNumber||app.fatherName||'—'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell><span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 ${stage.bg} ${stage.text}`}><div className={`h-1.5 w-1.5 rounded-full ${stage.color}`}/>{stage.label}</span></TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedApp(app); setViewOpen(true); }}><Eye className="h-3.5 w-3.5"/></Button>
                                  {app.status === 'approved' ? (
                                    <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => { setSelectedApp(app); setEnrollForm({classId:'',sectionId:'',rollNumber:''}); setEnrollOpen(true); }}>Enroll</Button>
                                  ) : (
                                    <>
                                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleAction(app,'advance')}><ArrowRight className="h-3.5 w-3.5"/></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleAction(app,'reject')}><XCircle className="h-3.5 w-3.5"/></Button>
                                    </>
                                  )}
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
          </TabsContent>

          <TabsContent value="all" className="space-y-4 pt-4">
            <Card><CardContent className="pt-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-44"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-9" placeholder="Search..." value={searchIn} onChange={e => setSearchIn(e.target.value)}/></div>
                <Select value={stageFilter} onValueChange={v => { setStageFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Stages</SelectItem>{STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent></Card>

            <Card><CardContent className="p-0">
              {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/></div>
                : applicants.length === 0 ? <div className="flex flex-col items-center py-16 text-muted-foreground"><ClipboardList className="h-10 w-10 mb-3"/><p>No applications found</p></div>
                : (
                  <>
                    <Table>
                      <TableHeader><TableRow><TableHead>App No</TableHead><TableHead>Name</TableHead><TableHead>Gender</TableHead><TableHead>Class</TableHead><TableHead>Father</TableHead><TableHead>Stage</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {applicants.map(app => {
                          const stage = getStage(app.status);
                          return (
                            <TableRow key={app.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="font-mono text-xs">{app.admissionNumber}</TableCell>
                              <TableCell className="font-medium">{app.fullName}</TableCell>
                              <TableCell className="text-sm">{app.gender}</TableCell>
                              <TableCell className="text-sm">{app.class?.name||'—'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{app.fatherName||'—'}</TableCell>
                              <TableCell><span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${stage.bg} ${stage.text}`}>{stage.label}</span></TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedApp(app); setViewOpen(true); }}><Eye className="h-3.5 w-3.5"/></Button>
                                  {!['rejected','active'].includes(app.status) && (
                                    app.status === 'approved'
                                      ? <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => { setSelectedApp(app); setEnrollForm({classId:'',sectionId:'',rollNumber:''}); setEnrollOpen(true); }}>Enroll</Button>
                                      : <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleAction(app,'advance')}><ArrowRight className="h-3.5 w-3.5"/></Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {totalPages > 1 && <div className="flex items-center justify-between px-4 py-3 border-t">
                      <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                      <div className="flex gap-2"><Button variant="outline" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4"/></Button><Button variant="outline" size="sm" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}><ChevronRight className="h-4 w-4"/></Button></div>
                    </div>}
                  </>
                )}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Application</DialogTitle><DialogDescription>Student enrollment form</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><Label>Full Name *</Label><Input className="mt-1" value={form.fullName} onChange={e => uf('fullName',e.target.value)} placeholder="Student full name"/></div>
            <div><Label>Gender *</Label><Select value={form.gender} onValueChange={v => uf('gender',v)}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div>
            <div><Label>Date of Birth</Label><Input className="mt-1" type="date" value={form.dateOfBirth} onChange={e => uf('dateOfBirth',e.target.value)}/></div>
            <div><Label>Father's Name</Label><Input className="mt-1" value={form.fatherName} onChange={e => uf('fatherName',e.target.value)}/></div>
            <div><Label>Mother's Name</Label><Input className="mt-1" value={form.motherName} onChange={e => uf('motherName',e.target.value)}/></div>
            <div><Label>Contact Number</Label><Input className="mt-1" value={form.contactNumber} onChange={e => uf('contactNumber',e.target.value)} placeholder="03XX-XXXXXXX"/></div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={form.email} onChange={e => uf('email',e.target.value)}/></div>
            <div><Label>Applying for Class *</Label><Select value={form.currentClassId} onValueChange={v => uf('currentClassId',v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select class"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Province</Label><Select value={form.province} onValueChange={v => uf('province',v)}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Blood Group</Label><Select value={form.bloodGroup} onValueChange={v => uf('bloodGroup',v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select"/></SelectTrigger><SelectContent>{BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Previous School</Label><Input className="mt-1" value={form.previousSchool} onChange={e => uf('previousSchool',e.target.value)}/></div>
            <div className="col-span-2"><Label>Address</Label><Input className="mt-1" value={form.address} onChange={e => uf('address',e.target.value)}/></div>
            <div className="col-span-2"><Label>Remarks</Label><Input className="mt-1" value={form.remarks} onChange={e => uf('remarks',e.target.value)}/></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={handleAdd} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Submit Application</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedApp?.fullName}</DialogTitle><DialogDescription>{selectedApp?.admissionNumber} · {getStage(selectedApp?.status||'').label}</DialogDescription></DialogHeader>
          {selectedApp && <div className="grid grid-cols-2 gap-3 py-2 text-sm">
            {[['Gender',selectedApp.gender],['Class',selectedApp.class?.name],['Father',selectedApp.fatherName],['Contact',selectedApp.contactNumber],['Applied',new Date(selectedApp.createdAt).toLocaleDateString()],['Remarks',selectedApp.remarks]].filter(([,v])=>v).map(([l,v]) => (
              <div key={l} className="flex flex-col"><span className="text-xs text-muted-foreground">{l}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            {selectedApp && !['rejected','active'].includes(selectedApp.status) && (
              selectedApp.status === 'approved'
                ? <Button className="bg-green-600 hover:bg-green-700" onClick={() => { setViewOpen(false); setEnrollForm({classId:'',sectionId:'',rollNumber:''}); setEnrollOpen(true); }}><CheckCircle2 className="mr-2 h-4 w-4"/>Enroll</Button>
                : <Button onClick={() => { handleAction(selectedApp,'advance'); setViewOpen(false); }}><ArrowRight className="mr-2 h-4 w-4"/>Advance Stage</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enroll Student</DialogTitle><DialogDescription>{selectedApp?.fullName} — Final enrollment</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-800 dark:text-green-200">A new admission number is auto-generated and student becomes active.</div>
            <div><Label>Class *</Label><Select value={enrollForm.classId} onValueChange={v => setEnrollForm(f=>({...f,classId:v,sectionId:''}))}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select class"/></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select></div>
            <div><Label>Section</Label><Select value={enrollForm.sectionId} onValueChange={v => setEnrollForm(f=>({...f,sectionId:v}))} disabled={!enrollForm.classId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select section"/></SelectTrigger>
              <SelectContent><SelectItem value="">No section</SelectItem>{filtSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select></div>
            <div><Label>Roll Number</Label><Input className="mt-1" value={enrollForm.rollNumber} onChange={e => setEnrollForm(f=>({...f,rollNumber:e.target.value}))} placeholder="Optional"/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleEnroll} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}<CheckCircle2 className="mr-2 h-4 w-4"/>Confirm Enrollment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
