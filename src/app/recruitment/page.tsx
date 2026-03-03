'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Loader2, Plus, Edit, Trash2, RefreshCw, Download, Briefcase,
  Users, CheckCircle2, XCircle, Clock, UserCheck, Star, Phone, Mail,
  Eye, ArrowRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const DEPARTMENTS = ['Administration', 'Teaching', 'IT', 'Accounts', 'Library', 'Transport', 'Hostel', 'Security', 'Canteen', 'Other'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary'];
const QUALIFICATIONS = ['Matric', 'Intermediate', 'Bachelor', 'Master', 'MPhil', 'PhD', 'Professional Certificate'];
const APP_STATUSES = ['New', 'Shortlisted', 'Interviewed', 'Offered', 'Hired', 'Rejected', 'On Hold'];

const APP_STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  Shortlisted: 'bg-amber-100 text-amber-700',
  Interviewed: 'bg-purple-100 text-purple-700',
  Offered: 'bg-indigo-100 text-indigo-700',
  Hired: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  'On Hold': 'bg-slate-100 text-slate-600',
};

const JOB_STATUS_COLORS: Record<string, string> = {
  Open: 'bg-green-100 text-green-700',
  Closed: 'bg-slate-100 text-slate-600',
  Paused: 'bg-amber-100 text-amber-700',
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyJob = { title: '', department: '', type: 'Full-time', positions: '1', qualification: 'Bachelor', experience: '', salary: '', deadline: '', description: '', requirements: '', status: 'Open' };
const emptyApp = { jobId: '', applicantName: '', email: '', phone: '', qualification: 'Bachelor', experience: '', currentEmployer: '', expectedSalary: '', coverLetter: '', notes: '' };

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [jobSummary, setJobSummary] = useState({ total: 0, open: 0, closed: 0, totalApplicants: 0 });
  const [appSummary, setAppSummary] = useState({ total: 0, new: 0, shortlisted: 0, interviewed: 0, hired: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobFilter, setJobFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showAppDialog, setShowAppDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [jobForm, setJobForm] = useState<any>(emptyJob);
  const [appForm, setAppForm] = useState<any>(emptyApp);
  const [saving, setSaving] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [showAppDetail, setShowAppDetail] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'jobs', status: activeTab === 'jobs' ? statusFilter : '' });
      const res = await fetch(`/api/recruitment?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      if (data.summary) setJobSummary(data.summary);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [activeTab, statusFilter]);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'applications', jobId: jobFilter, status: statusFilter });
      const res = await fetch(`/api/recruitment?${params}`);
      const data = await res.json();
      setApplications(data.applications || []);
      if (data.summary) setAppSummary(data.summary);
      if (data.jobs) setJobs(data.jobs);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [jobFilter, statusFilter]);

  useEffect(() => { if (activeTab === 'jobs') loadJobs(); else loadApps(); }, [activeTab, loadJobs, loadApps]);

  const saveJob = async () => {
    if (!jobForm.title || !jobForm.department) { toast({ title: 'Title and department required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const body = editingJob ? { ...jobForm, id: editingJob.id, entityType: 'job' } : jobForm;
      const res = await fetch('/api/recruitment', { method: editingJob ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: editingJob ? 'Job updated' : 'Job posted' });
      setShowJobDialog(false); loadJobs();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveApp = async () => {
    if (!appForm.applicantName || !appForm.email || !appForm.jobId) { toast({ title: 'Name, email and job required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const body = editingApp ? { ...appForm, id: editingApp.id, entityType: 'application' } : { ...appForm, type: 'application' };
      const res = await fetch('/api/recruitment', { method: editingApp ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: editingApp ? 'Updated' : 'Application added' });
      setShowAppDialog(false); loadApps();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const updateAppStatus = async (app: any, status: string) => {
    await fetch('/api/recruitment', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: app.id, entityType: 'application', status }) });
    toast({ title: `Status: ${status}` });
    loadApps();
    if (selectedApp?.id === app.id) setSelectedApp({ ...selectedApp, status });
  };

  const deleteJob = async (job: any) => {
    if (!confirm(`Delete job posting "${job.title}"?`)) return;
    await fetch('/api/recruitment', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: job.id, entityType: 'job' }) });
    toast({ title: 'Deleted' }); loadJobs();
  };

  const deleteApp = async (app: any) => {
    if (!confirm('Delete this application?')) return;
    await fetch('/api/recruitment', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: app.id, entityType: 'application' }) });
    toast({ title: 'Deleted' }); loadApps();
  };

  const PIPELINE_STAGES = ['New', 'Shortlisted', 'Interviewed', 'Offered', 'Hired'];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Recruitment"
        description="Post jobs, track applicants, and manage the hiring pipeline"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditingApp(null); setAppForm(emptyApp); setShowAppDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Add Applicant
            </Button>
            <Button size="sm" onClick={() => { setEditingJob(null); setJobForm(emptyJob); setShowJobDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Post Job
            </Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {activeTab === 'jobs' ? [
          { label: 'Total Jobs', value: jobSummary.total, color: 'border-l-slate-500', icon: <Briefcase className="h-4 w-4 text-slate-500" /> },
          { label: 'Open Positions', value: jobSummary.open, color: 'border-l-green-500', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
          { label: 'Closed', value: jobSummary.closed, color: 'border-l-slate-400', icon: <XCircle className="h-4 w-4 text-slate-400" /> },
          { label: 'Total Applicants', value: jobSummary.totalApplicants, color: 'border-l-blue-500', icon: <Users className="h-4 w-4 text-blue-500" /> },
        ] : [
          { label: 'Total Applications', value: appSummary.total, color: 'border-l-slate-500', icon: <Users className="h-4 w-4 text-slate-500" /> },
          { label: 'New', value: appSummary.new, color: 'border-l-blue-500', icon: <Clock className="h-4 w-4 text-blue-500" /> },
          { label: 'Shortlisted', value: appSummary.shortlisted, color: 'border-l-amber-500', icon: <Star className="h-4 w-4 text-amber-500" /> },
          { label: 'Hired', value: appSummary.hired, color: 'border-l-green-500', icon: <UserCheck className="h-4 w-4 text-green-500" /> },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setStatusFilter(''); }}>
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {['Open', 'Paused', 'Closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadJobs}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? <div className="flex justify-center h-32 items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                : jobs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No job postings yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Position</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Vacancies</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map(job => (
                        <TableRow key={job.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="font-medium text-sm">{job.title}</div>
                            {job.salary && <div className="text-xs text-muted-foreground">PKR {job.salary}</div>}
                          </TableCell>
                          <TableCell className="text-sm">{job.department}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{job.type}</Badge></TableCell>
                          <TableCell className="text-center font-medium">{job.positions || 1}</TableCell>
                          <TableCell className="text-sm">{fmtDate(job.deadline)}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${JOB_STATUS_COLORS[job.status] || ''}`}>{job.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setActiveTab('applications'); setJobFilter(job.id); }}>
                                Applicants
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingJob(job); setJobForm({ ...job }); setShowJobDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteJob(job)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <div className="flex gap-3">
            <Select value={jobFilter} onValueChange={v => setJobFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-56"><SelectValue placeholder="All Jobs" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {APP_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadApps}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? <div className="flex justify-center h-32 items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                : applications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground"><Users className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No applications found</p></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Qualification</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map(app => {
                        const job = jobs.find(j => j.id === app.jobId);
                        return (
                          <TableRow key={app.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell>
                              <div className="font-medium text-sm">{app.applicantName}</div>
                              <div className="text-xs text-muted-foreground">{app.email}</div>
                            </TableCell>
                            <TableCell className="text-sm">{job?.title || '—'}</TableCell>
                            <TableCell className="text-sm">{app.qualification}</TableCell>
                            <TableCell className="text-sm">{fmtDate(app.appliedAt)}</TableCell>
                            <TableCell>
                              <Select value={app.status} onValueChange={v => updateAppStatus(app, v)}>
                                <SelectTrigger className="h-7 w-32 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {APP_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedApp(app); setShowAppDetail(true); }}><Eye className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteApp(app)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

        {/* Pipeline Tab */}
        <TabsContent value="pipeline">
          <div className="grid grid-cols-5 gap-3">
            {PIPELINE_STAGES.map(stage => {
              const stageApps = applications.filter(a => a.status === stage);
              return (
                <div key={stage}>
                  <div className={`rounded-t-lg p-2 text-center text-xs font-semibold ${APP_STATUS_COLORS[stage] || 'bg-slate-100'}`}>
                    {stage} ({stageApps.length})
                  </div>
                  <div className="min-h-32 bg-muted/20 rounded-b-lg p-2 space-y-2">
                    {stageApps.map(app => {
                      const job = jobs.find(j => j.id === app.jobId);
                      return (
                        <div key={app.id} className="bg-white border rounded-md p-2.5 shadow-sm cursor-pointer hover:shadow-md transition-shadow card-hover"
                          onClick={() => { setSelectedApp(app); setShowAppDetail(true); }}>
                          <div className="font-medium text-xs">{app.applicantName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{job?.title}</div>
                          <div className="text-xs text-muted-foreground">{app.qualification}</div>
                          {stage !== 'Hired' && (
                            <Button variant="ghost" className="h-5 w-full mt-1 text-xs p-0 text-primary" onClick={e => { e.stopPropagation(); updateAppStatus(app, PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) + 1]); }}>
                              Move → {PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) + 1]}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Job Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingJob ? 'Edit Job Posting' : 'Post New Job'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Job Title *</Label><Input placeholder="e.g. Mathematics Teacher" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Department *</Label>
              <Select value={jobForm.department} onValueChange={v => setJobForm({ ...jobForm, department: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Employment Type</Label>
              <Select value={jobForm.type} onValueChange={v => setJobForm({ ...jobForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Vacancies</Label><Input type="number" min="1" value={jobForm.positions} onChange={e => setJobForm({ ...jobForm, positions: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Min. Qualification</Label>
              <Select value={jobForm.qualification} onValueChange={v => setJobForm({ ...jobForm, qualification: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{QUALIFICATIONS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Experience Required</Label><Input placeholder="e.g. 2+ years" value={jobForm.experience} onChange={e => setJobForm({ ...jobForm, experience: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Salary Range</Label><Input placeholder="e.g. 40,000 - 60,000" value={jobForm.salary} onChange={e => setJobForm({ ...jobForm, salary: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Application Deadline</Label><Input type="date" value={jobForm.deadline} onChange={e => setJobForm({ ...jobForm, deadline: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={jobForm.status} onValueChange={v => setJobForm({ ...jobForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Open', 'Paused', 'Closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Job Description</Label><Textarea rows={3} value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Requirements</Label><Textarea rows={2} placeholder="Key skills and requirements..." value={jobForm.requirements} onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJobDialog(false)}>Cancel</Button>
            <Button onClick={saveJob} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingJob ? 'Update' : 'Post Job'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Dialog */}
      <Dialog open={showAppDialog} onOpenChange={setShowAppDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingApp ? 'Edit Application' : 'Add Application'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Applying For *</Label>
              <Select value={appForm.jobId} onValueChange={v => setAppForm({ ...appForm, jobId: v })}>
                <SelectTrigger><SelectValue placeholder="Select job posting" /></SelectTrigger>
                <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title} — {j.department}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Applicant Name *</Label><Input value={appForm.applicantName} onChange={e => setAppForm({ ...appForm, applicantName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={appForm.email} onChange={e => setAppForm({ ...appForm, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={appForm.phone} onChange={e => setAppForm({ ...appForm, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Qualification</Label>
              <Select value={appForm.qualification} onValueChange={v => setAppForm({ ...appForm, qualification: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{QUALIFICATIONS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Experience</Label><Input placeholder="Years of experience" value={appForm.experience} onChange={e => setAppForm({ ...appForm, experience: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Expected Salary</Label><Input value={appForm.expectedSalary} onChange={e => setAppForm({ ...appForm, expectedSalary: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Cover Letter / Notes</Label><Textarea rows={3} value={appForm.coverLetter} onChange={e => setAppForm({ ...appForm, coverLetter: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppDialog(false)}>Cancel</Button>
            <Button onClick={saveApp} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingApp ? 'Update' : 'Add Application'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* App Detail Dialog */}
      <Dialog open={showAppDetail} onOpenChange={setShowAppDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Applicant Details</DialogTitle></DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {selectedApp.applicantName?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">{selectedApp.applicantName}</div>
                  <div className="text-sm text-muted-foreground">{jobs.find(j => j.id === selectedApp.jobId)?.title}</div>
                </div>
                <Badge className={`ml-auto text-xs ${APP_STATUS_COLORS[selectedApp.status] || ''}`}>{selectedApp.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{selectedApp.email}</div>
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{selectedApp.phone || '—'}</div>
                <div><span className="text-muted-foreground">Qualification:</span> {selectedApp.qualification}</div>
                <div><span className="text-muted-foreground">Experience:</span> {selectedApp.experience || '—'}</div>
                <div><span className="text-muted-foreground">Expected Salary:</span> {selectedApp.expectedSalary || '—'}</div>
                <div><span className="text-muted-foreground">Applied:</span> {fmtDate(selectedApp.appliedAt)}</div>
              </div>
              {selectedApp.coverLetter && (
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Cover Letter</p><p className="text-sm bg-muted/40 rounded-lg p-3">{selectedApp.coverLetter}</p></div>
              )}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {APP_STATUSES.map(s => (
                    <Button key={s} variant={selectedApp.status === s ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => updateAppStatus(selectedApp, s)}>{s}</Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setShowAppDetail(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
