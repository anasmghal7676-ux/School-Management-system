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
import {
  Loader2, FileText, Plus, Search, RefreshCw, Edit, Trash2,
  CheckCircle2, Clock, AlertTriangle, Download, User, FolderOpen,
  Shield, Award, Briefcase, GraduationCap,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const DOC_TYPES = [
  'CNIC', 'Degree Certificate', 'Transcript', 'Experience Letter',
  'Appointment Letter', 'Contract', 'Offer Letter', 'Salary Certificate',
  'Police Clearance', 'Medical Certificate', 'Professional License',
  'Teaching Certificate', 'Character Certificate', 'Bank Details',
  'Emergency Contact Form', 'Resignation Letter', 'NOC', 'Other',
];

const DOC_CATEGORIES: Record<string, string> = {
  'CNIC': 'Identity',
  'Degree Certificate': 'Education',
  'Transcript': 'Education',
  'Experience Letter': 'Work History',
  'Appointment Letter': 'Employment',
  'Contract': 'Employment',
  'Offer Letter': 'Employment',
  'Salary Certificate': 'Finance',
  'Police Clearance': 'Background',
  'Medical Certificate': 'Health',
  'Professional License': 'Certification',
  'Teaching Certificate': 'Certification',
  'Character Certificate': 'Background',
  'Bank Details': 'Finance',
  'Emergency Contact Form': 'Personal',
  'Resignation Letter': 'Employment',
  'NOC': 'Employment',
  'Other': 'Other',
};

const DOC_ICONS: Record<string, React.ReactNode> = {
  'Identity': <Shield className="h-4 w-4 text-blue-500" />,
  'Education': <GraduationCap className="h-4 w-4 text-purple-500" />,
  'Employment': <Briefcase className="h-4 w-4 text-amber-500" />,
  'Finance': <Award className="h-4 w-4 text-green-500" />,
  'Certification': <Award className="h-4 w-4 text-indigo-500" />,
  'Background': <Shield className="h-4 w-4 text-slate-500" />,
  'Health': <User className="h-4 w-4 text-red-500" />,
  'Personal': <User className="h-4 w-4 text-orange-500" />,
  'Work History': <Briefcase className="h-4 w-4 text-teal-500" />,
  'Other': <FileText className="h-4 w-4 text-slate-400" />,
};

const STATUS_COLORS: Record<string, string> = {
  'Pending': 'bg-amber-100 text-amber-700',
  'Verified': 'bg-green-100 text-green-700',
  'Expired': 'bg-red-100 text-red-700',
  'Rejected': 'bg-slate-100 text-slate-600',
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyForm = {
  staffId: '', staffName: '', designation: '',
  documentType: '', fileName: '', fileSize: '',
  issueDate: '', expiryDate: '', issuedBy: '',
  status: 'Pending', notes: '', verifiedBy: '', verifiedDate: '',
};

export default function HRDocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, verified: 0, pending: 0, expired: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search, docType: typeFilter, status: statusFilter,
        staffId: staffFilter, page: String(page), limit: String(limit),
      });
      const res = await fetch(`/api/hr-documents?${params}`);
      const data = await res.json();
      setDocs(data.docs || []);
      setTotal(data.total || 0);
      if (data.summary) setSummary(data.summary);
      if (data.staff) setStaff(data.staff);
    } catch {
      toast({ title: 'Error', description: 'Failed to load', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, staffFilter, page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowDialog(true);
  };

  const openEdit = (doc: any) => {
    setEditing(doc);
    setForm({ ...doc });
    setShowDialog(true);
  };

  const handleStaffChange = (sid: string) => {
    const s = staff.find(x => x.id === sid);
    setForm({ ...form, staffId: sid, staffName: s?.fullName || '', designation: s?.designation || '' });
  };

  const save = async () => {
    if (!form.staffId || !form.documentType || !form.fileName) {
      toast({ title: 'Validation', description: 'Staff member, document type, and file name are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await fetch('/api/hr-documents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: editing.id }) });
        toast({ title: 'Updated' });
      } else {
        await fetch('/api/hr-documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        toast({ title: 'Document recorded' });
      }
      setShowDialog(false);
      load();
    } catch {
      toast({ title: 'Error', description: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteDoc = async (doc: any) => {
    if (!confirm('Delete this document record?')) return;
    await fetch('/api/hr-documents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: doc.id }) });
    toast({ title: 'Deleted' });
    load();
  };

  const verifyDoc = async (doc: any) => {
    await fetch('/api/hr-documents', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: doc.id, status: 'Verified', verifiedDate: new Date().toISOString().slice(0, 10) }),
    });
    toast({ title: 'Document verified' });
    load();
  };

  const exportCsv = () => {
    const headers = ['Staff Name', 'Designation', 'Document Type', 'File Name', 'Issue Date', 'Expiry Date', 'Issued By', 'Status', 'Notes'];
    const rows = docs.map(d => [d.staffName, d.designation, d.documentType, d.fileName, fmtDate(d.issueDate), fmtDate(d.expiryDate), d.issuedBy, d.status, d.notes]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `hr-documents-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="HR Documents"
        description="Manage staff credentials, certificates, and employment documents"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Document</Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: summary.total, color: 'border-l-slate-500', icon: <FolderOpen className="h-4 w-4 text-slate-500" /> },
          { label: 'Verified', value: summary.verified, color: 'border-l-green-500', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
          { label: 'Pending Review', value: summary.pending, color: 'border-l-amber-500', icon: <Clock className="h-4 w-4 text-amber-500" /> },
          { label: 'Expired', value: summary.expired, color: 'border-l-red-500', icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search staff, document type..." className="pl-8" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={staffFilter} onValueChange={v => { setStaffFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Staff" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={v => { setTypeFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {['Pending', 'Verified', 'Expired', 'Rejected'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
          ) : docs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No documents found</p>
              <Button size="sm" className="mt-4" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add First Document</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map(doc => {
                  const cat = DOC_CATEGORIES[doc.documentType] || 'Other';
                  const isExpiringSoon = doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 3600 * 1000);
                  return (
                    <TableRow key={doc.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="font-medium text-sm">{doc.staffName}</div>
                        <div className="text-xs text-muted-foreground">{doc.designation}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {DOC_ICONS[cat]}
                          <div>
                            <div className="text-sm font-medium">{doc.documentType}</div>
                            <div className="text-xs text-muted-foreground">{cat}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{doc.fileName}</span>
                        </div>
                        {doc.fileSize && <div className="text-xs text-muted-foreground ml-5">{doc.fileSize}</div>}
                      </TableCell>
                      <TableCell className="text-sm">{fmtDate(doc.issueDate)}</TableCell>
                      <TableCell>
                        {doc.expiryDate ? (
                          <div>
                            <div className={`text-sm ${isExpiringSoon && doc.status !== 'Expired' ? 'text-amber-600 font-medium' : ''}`}>{fmtDate(doc.expiryDate)}</div>
                            {isExpiringSoon && doc.status !== 'Expired' && <div className="text-xs text-amber-500">Expiring soon</div>}
                          </div>
                        ) : <span className="text-sm text-muted-foreground">No expiry</span>}
                      </TableCell>
                      <TableCell className="text-sm">{doc.issuedBy || '—'}</TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[doc.status] || 'bg-slate-100 text-slate-700'} text-xs`}>
                          {doc.status === 'Verified' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {doc.status === 'Pending' && <Clock className="h-3 w-3 mr-1" />}
                          {doc.status === 'Expired' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {doc.status === 'Pending' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="Verify" onClick={() => verifyDoc(doc)}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(doc)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDoc(doc)}>
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Document Record' : 'Add HR Document'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Staff Member *</Label>
              <Select value={form.staffId} onValueChange={handleStaffChange}>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.designation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Document Type *</Label>
              <Select value={form.documentType} onValueChange={v => setForm({ ...form, documentType: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Pending', 'Verified', 'Expired', 'Rejected'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>File Name *</Label>
              <Input placeholder="e.g. CNIC-frontback.pdf" value={form.fileName} onChange={e => setForm({ ...form, fileName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>File Size</Label>
              <Input placeholder="e.g. 1.2 MB" value={form.fileSize} onChange={e => setForm({ ...form, fileSize: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Issue Date</Label>
              <Input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Issued By</Label>
              <Input placeholder="Issuing authority / institution" value={form.issuedBy} onChange={e => setForm({ ...form, issuedBy: e.target.value })} />
            </div>
            {form.status === 'Verified' && (
              <div className="space-y-1.5">
                <Label>Verified By</Label>
                <Input placeholder="Staff member who verified" value={form.verifiedBy} onChange={e => setForm({ ...form, verifiedBy: e.target.value })} />
              </div>
            )}
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes about this document..." rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? 'Update' : 'Save Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
