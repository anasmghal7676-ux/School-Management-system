'use client';

export const dynamic = "force-dynamic"
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
import { Loader2, Search, RefreshCw, Eye, Trash2, CheckCircle2, XCircle, Clock, FileText, Users, ClipboardList, ChevronRight, ChevronLeft, Send, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const STEPS = ['Personal Info', 'Academic Info', 'Parent / Guardian', 'Declaration'];
const CLASSES = ['Pre-Nursery', 'Nursery', 'Prep / KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Shortlisted: 'bg-blue-100 text-blue-700',
  Admitted: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Enrolled: 'bg-purple-100 text-purple-700',
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyForm = {
  studentName: '', dateOfBirth: '', gender: 'Male', religion: 'Islam', nationality: 'Pakistani',
  bloodGroup: '', previousSchool: '', previousClass: '', applyingForClass: '', academicYear: new Date().getFullYear().toString(),
  lastResult: '', specialNeeds: '',
  fatherName: '', fatherCnic: '', fatherOccupation: '', fatherPhone: '', fatherEmail: '',
  motherName: '', motherCnic: '', motherPhone: '',
  address: '', city: '', guardianName: '', guardianRelation: '', guardianPhone: '',
  howHeard: '', declaration: false, remarks: '',
};

export default function AdmissionFormPage() {
  const [tab, setTab] = useState('admin');
  const [applications, setApplications] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, shortlisted: 0, admitted: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewInterviewDate, setReviewInterviewDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Application form state
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<any>(emptyForm);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [trackRef, setTrackRef] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter, page: String(page), limit: '20' });
      const res = await fetch(`/api/adm-form?${params}`);
      const data = await res.json();
      setApplications(data.applications || []);
      setTotal(data.total || 0);
      setSummary(data.summary || {});
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { if (tab === 'admin') load(); }, [tab, load]);

  const submitApplication = async () => {
    if (!form.studentName || !form.fatherName || !form.applyingForClass) {
      toast({ title: 'Please fill required fields', variant: 'destructive' }); return;
    }
    if (!form.declaration) {
      toast({ title: 'Please accept the declaration', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/adm-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', ...form }),
      });
      const data = await res.json();
      if (data.refNo) { setSubmitted(data.refNo); setStep(0); setForm({ ...emptyForm }); }
    } catch { toast({ title: 'Submission failed', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const reviewApp = async () => {
    if (!reviewStatus) return;
    setSaving(true);
    try {
      await fetch('/api/adm-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', id: selectedApp.id, status: reviewStatus, remarks: reviewRemarks, interviewDate: reviewInterviewDate }),
      });
      toast({ title: `Status updated to ${reviewStatus}` });
      setReviewDialog(false);
      load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const deleteApp = async (id: string) => {
    if (!confirm('Delete application?')) return;
    await fetch('/api/adm-form', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Deleted' }); load();
  };

  const trackApplication = async () => {
    if (!trackRef) return;
    const res = await fetch(`/api/adm-form?refNo=${trackRef}`);
    const data = await res.json();
    if (data.error) { toast({ title: 'Not found', variant: 'destructive' }); setTrackResult(null); }
    else setTrackResult(data);
  };

  const f = (key: string, val: string) => setForm((p: any) => ({ ...p, [key]: val }));

  const stepValid = () => {
    if (step === 0) return form.studentName && form.dateOfBirth && form.gender;
    if (step === 1) return form.applyingForClass;
    if (step === 2) return form.fatherName && form.fatherPhone;
    return true;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Online Admission Form" description="Public student application portal with admin review and status management" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="apply">📋 Apply Now</TabsTrigger>
          <TabsTrigger value="track">🔍 Track Application</TabsTrigger>
          <TabsTrigger value="admin">🛠️ Admin Review</TabsTrigger>
        </TabsList>

        {/* ── Public Application Form ── */}
        <TabsContent value="apply" className="mt-6">
          {submitted ? (
            <Card className="max-w-lg mx-auto">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Application Submitted!</h2>
                <p className="text-muted-foreground mb-4">Your application has been received successfully.</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground">Your Reference Number</p>
                  <p className="text-2xl font-mono font-bold text-green-700">{submitted}</p>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Save this reference number to track your application status. We will contact you within 3-5 working days.</p>
                <Button onClick={() => { setSubmitted(null); setStep(0); }}>Submit Another Application</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">New Admission Application — Step {step + 1} of {STEPS.length}</CardTitle>
                  <div className="flex gap-1">
                    {STEPS.map((s, i) => (
                      <div key={i} className={`h-2 w-16 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-medium">{STEPS[step]}</p>
              </CardHeader>
              <CardContent className="space-y-4">

                {step === 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1.5"><Label>Student Full Name *</Label><Input value={form.studentName} onChange={e => f('studentName', e.target.value)} placeholder="As per birth certificate" /></div>
                    <div className="space-y-1.5"><Label>Date of Birth *</Label><Input type="date" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Gender *</Label><Select value={form.gender} onValueChange={v => f('gender', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div>
                    <div className="space-y-1.5"><Label>Religion</Label><Input value={form.religion} onChange={e => f('religion', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Nationality</Label><Input value={form.nationality} onChange={e => f('nationality', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Blood Group</Label><Select value={form.bloodGroup} onValueChange={v => f('bloodGroup', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1.5"><Label>Special Needs / Disability</Label><Input value={form.specialNeeds} onChange={e => f('specialNeeds', e.target.value)} placeholder="None if not applicable" /></div>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Applying for Class *</Label><Select value={form.applyingForClass} onValueChange={v => f('applyingForClass', v)}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-1.5"><Label>Academic Year</Label><Input value={form.academicYear} onChange={e => f('academicYear', e.target.value)} /></div>
                    <div className="col-span-2 space-y-1.5"><Label>Previous School Name</Label><Input value={form.previousSchool} onChange={e => f('previousSchool', e.target.value)} placeholder="Leave blank if first admission" /></div>
                    <div className="space-y-1.5"><Label>Previous Class</Label><Input value={form.previousClass} onChange={e => f('previousClass', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Last Result / Percentage</Label><Input value={form.lastResult} onChange={e => f('lastResult', e.target.value)} /></div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2 font-semibold text-sm text-muted-foreground">Father / Guardian Information</div>
                    <div className="space-y-1.5"><Label>Father's Name *</Label><Input value={form.fatherName} onChange={e => f('fatherName', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Father's CNIC</Label><Input value={form.fatherCnic} onChange={e => f('fatherCnic', e.target.value)} placeholder="00000-0000000-0" /></div>
                    <div className="space-y-1.5"><Label>Father's Occupation</Label><Input value={form.fatherOccupation} onChange={e => f('fatherOccupation', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Phone *</Label><Input value={form.fatherPhone} onChange={e => f('fatherPhone', e.target.value)} placeholder="0300-0000000" /></div>
                    <div className="col-span-2 space-y-1.5"><Label>Email</Label><Input type="email" value={form.fatherEmail} onChange={e => f('fatherEmail', e.target.value)} /></div>
                    <div className="space-y-1.5 col-span-2 font-semibold text-sm text-muted-foreground pt-2">Mother's Information</div>
                    <div className="space-y-1.5"><Label>Mother's Name</Label><Input value={form.motherName} onChange={e => f('motherName', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>Mother's Phone</Label><Input value={form.motherPhone} onChange={e => f('motherPhone', e.target.value)} /></div>
                    <div className="col-span-2 space-y-1.5"><Label>Home Address</Label><Textarea value={form.address} onChange={e => f('address', e.target.value)} rows={2} /></div>
                    <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={e => f('city', e.target.value)} /></div>
                    <div className="space-y-1.5"><Label>How did you hear about us?</Label><Select value={form.howHeard} onValueChange={v => f('howHeard', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['Friend / Family', 'Social Media', 'Website', 'Newspaper', 'Banner / Signboard', 'Walk-in'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                      <h3 className="font-bold">Review Your Application</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <span className="text-muted-foreground">Student Name:</span><span className="font-medium">{form.studentName}</span>
                        <span className="text-muted-foreground">Class Applied:</span><span className="font-medium">{form.applyingForClass}</span>
                        <span className="text-muted-foreground">Date of Birth:</span><span className="font-medium">{form.dateOfBirth}</span>
                        <span className="text-muted-foreground">Father's Name:</span><span className="font-medium">{form.fatherName}</span>
                        <span className="text-muted-foreground">Contact:</span><span className="font-medium">{form.fatherPhone}</span>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                      <p className="font-semibold text-foreground">Declaration</p>
                      <p>I hereby declare that all the information provided in this application is true and correct to the best of my knowledge. I understand that any false information may result in cancellation of admission.</p>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/20 card-hover">
                      <input type="checkbox" checked={form.declaration} onChange={e => setForm((p: any) => ({ ...p, declaration: e.target.checked }))} className="w-4 h-4" />
                      <span className="text-sm font-medium">I accept the above declaration *</span>
                    </label>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  {step < STEPS.length - 1 ? (
                    <Button onClick={() => setStep(s => s + 1)} disabled={!stepValid()}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button onClick={submitApplication} disabled={saving || !form.declaration}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Submit Application
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Track Application ── */}
        <TabsContent value="track" className="mt-6">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Track Your Application</h3>
              <div className="flex gap-2">
                <Input placeholder="Enter Reference No. (e.g. APP-2026-XXXX)" value={trackRef} onChange={e => setTrackRef(e.target.value)} onKeyDown={e => e.key === 'Enter' && trackApplication()} />
                <Button onClick={trackApplication}>Check</Button>
              </div>
              {trackResult && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">{trackResult.refNo}</span>
                    <Badge className={STATUS_COLORS[trackResult.status] || ''}>{trackResult.status}</Badge>
                  </div>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <div><span className="font-medium text-foreground">Student: </span>{trackResult.studentName}</div>
                    <div><span className="font-medium text-foreground">Submitted: </span>{fmtDate(trackResult.submittedAt)}</div>
                    {trackResult.interviewDate && <div><span className="font-medium text-foreground">Interview: </span>{fmtDate(trackResult.interviewDate)}</div>}
                  </div>
                  {trackResult.status === 'Pending' && <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">Your application is under review. We will contact you soon.</p>}
                  {trackResult.status === 'Shortlisted' && <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">Congratulations! You have been shortlisted. Please check your interview date.</p>}
                  {trackResult.status === 'Admitted' && <p className="text-xs text-green-600 bg-green-50 p-2 rounded">Congratulations! Your admission has been approved. Please visit the school office.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Admin Review ── */}
        <TabsContent value="admin" className="mt-6 space-y-6">
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Total', value: summary.total, color: 'border-l-slate-500' },
              { label: 'Pending', value: summary.pending, color: 'border-l-amber-500' },
              { label: 'Shortlisted', value: summary.shortlisted, color: 'border-l-blue-500' },
              { label: 'Admitted', value: summary.admitted, color: 'border-l-green-500' },
              { label: 'Rejected', value: summary.rejected, color: 'border-l-red-500' },
            ].map(c => (
              <Card key={c.label} className={`border-l-4 ${c.color}`}><CardContent className="p-3">
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </CardContent></Card>
            ))}
          </div>

          <Card><CardContent className="p-4"><div className="flex gap-3">
            <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or ref no..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{['Pending','Shortlisted','Admitted','Rejected','Enrolled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div></CardContent></Card>

          <Card><CardContent className="p-0">
            {loading ? <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin" /></div> :
              applications.length === 0 ? <div className="text-center py-16 text-muted-foreground"><ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No applications found</p></div> :
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Ref No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Father Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {applications.map((app: any) => (
                    <TableRow key={app.id} className="hover:bg-muted/30">
                      <TableCell><span className="font-mono text-xs text-primary font-bold">{app.refNo}</span></TableCell>
                      <TableCell><div className="font-medium text-sm">{app.studentName}</div><div className="text-xs text-muted-foreground">{app.gender} · {app.dateOfBirth}</div></TableCell>
                      <TableCell className="text-sm">{app.applyingForClass}</TableCell>
                      <TableCell className="text-sm">{app.fatherName}</TableCell>
                      <TableCell className="text-sm">{app.fatherPhone}</TableCell>
                      <TableCell className="text-sm">{fmtDate(app.submittedAt)}</TableCell>
                      <TableCell><Badge className={`text-xs ${STATUS_COLORS[app.status] || ''}`}>{app.status}</Badge></TableCell>
                      <TableCell className="text-right"><div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedApp(app); setReviewStatus(app.status); setReviewRemarks(app.remarks || ''); setReviewInterviewDate(app.interviewDate || ''); setReviewDialog(true); }} title="Review"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteApp(app.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            }
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      {selectedApp && (
        <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Review — {selectedApp.refNo}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/20 rounded-lg p-4">
                <div><span className="text-muted-foreground">Student: </span><strong>{selectedApp.studentName}</strong></div>
                <div><span className="text-muted-foreground">Gender: </span>{selectedApp.gender}</div>
                <div><span className="text-muted-foreground">DOB: </span>{selectedApp.dateOfBirth}</div>
                <div><span className="text-muted-foreground">Class: </span><strong>{selectedApp.applyingForClass}</strong></div>
                <div><span className="text-muted-foreground">Father: </span>{selectedApp.fatherName}</div>
                <div><span className="text-muted-foreground">Phone: </span>{selectedApp.fatherPhone}</div>
                <div><span className="text-muted-foreground">Email: </span>{selectedApp.fatherEmail || '—'}</div>
                <div><span className="text-muted-foreground">City: </span>{selectedApp.city}</div>
                <div><span className="text-muted-foreground">Prev School: </span>{selectedApp.previousSchool || 'First Admission'}</div>
                <div><span className="text-muted-foreground">Last Result: </span>{selectedApp.lastResult || '—'}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Address: </span>{selectedApp.address}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Update Status</Label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['Pending','Shortlisted','Admitted','Rejected','Enrolled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Interview Date</Label>
                  <Input type="date" value={reviewInterviewDate} onChange={e => setReviewInterviewDate(e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Internal Remarks</Label>
                  <Textarea value={reviewRemarks} onChange={e => setReviewRemarks(e.target.value)} rows={2} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialog(false)}>Close</Button>
              <Button onClick={reviewApp} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
