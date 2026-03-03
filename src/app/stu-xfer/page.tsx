'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Plus, Search, RefreshCw, Printer, Eye, CheckCircle2,
  Clock, FileText, UserMinus, Download,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const TRANSFER_TYPES = ['School Transfer', 'City Transfer', 'Abroad Transfer', 'Private Tuition', 'Dropped Out', 'Other'];
const REASONS = ['Family Relocation', 'Financial Issues', 'Better Opportunity', 'Medical Reasons', 'Completion of Studies', 'Disciplinary Action', 'Parent Request', 'Other'];

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-blue-100 text-blue-700',
  'TC Issued': 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

function TCPrint({ transfer, onClose }: { transfer: any; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Transfer Certificate — ${transfer.tcNumber}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Times New Roman', serif; }
      body { padding: 30px; background: white; }
      .tc { max-width: 680px; margin: 0 auto; border: 3px double #1e3a5f; padding: 30px; }
      .header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 20px; }
      .school-name { font-size: 24px; font-weight: bold; color: #1e3a5f; }
      .tc-title { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; margin: 16px 0 8px; text-decoration: underline; }
      .tc-no { font-size: 12px; color: #666; }
      .row { display: flex; gap: 8px; margin-bottom: 12px; font-size: 13px; align-items: baseline; }
      .label { min-width: 200px; font-weight: 600; }
      .value { flex: 1; border-bottom: 1px solid #999; padding-bottom: 2px; }
      .conduct { margin: 20px 0; padding: 12px; border: 1px solid #ccc; background: #f9f9f9; font-size: 12px; }
      .signatures { display: flex; justify-content: space-between; margin-top: 48px; font-size: 12px; }
      .sig { text-align: center; min-width: 150px; }
      .sig-line { border-top: 1px solid #333; padding-top: 6px; margin-top: 40px; }
      .watermark { text-align: center; margin-top: 20px; font-size: 10px; color: #999; font-style: italic; }
      .stamp { border: 2px solid #1e3a5f; border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 10px; text-align: center; color: #1e3a5f; font-weight: bold; margin: 0 auto; }
    </style></head><body>${content}</body></html>`);
    win.document.close(); win.focus(); setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Transfer Certificate Preview</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print TC</Button>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
      <div ref={printRef}>
        <div className="tc border-4 border-double border-blue-900 p-8 max-w-2xl mx-auto bg-white">
          <div className="text-center border-b-2 border-blue-900 pb-5 mb-6">
            <div className="text-2xl font-bold text-blue-900 font-serif">SCHOOL MANAGEMENT SYSTEM</div>
            <div className="text-sm text-gray-500 mt-1">Islamabad, Pakistan • Tel: +92-51-XXXXXXX</div>
            <div className="text-xl font-bold uppercase tracking-widest mt-4 underline decoration-2">Transfer Certificate</div>
            <div className="text-sm text-gray-500 mt-1">TC No: <strong>{transfer.tcNumber}</strong></div>
          </div>

          <div className="space-y-3 text-sm font-serif">
            {[
              ['Student Name', transfer.studentName],
              ['Father\'s Name', transfer.fatherName],
              ['Admission Number', transfer.admissionNumber],
              ['Date of Birth', fmtDate(transfer.dateOfBirth)],
              ['Class Last Attended', transfer.lastClass],
              ['Section', transfer.lastSection],
              ['Academic Year', transfer.academicYear],
              ['Date of Admission', fmtDate(transfer.dateOfAdmission)],
              ['Date of Leaving', fmtDate(transfer.dateOfLeaving)],
              ['Reason for Leaving', transfer.reason],
              ['Transfer To', transfer.transferTo || 'Not Specified'],
              ['Fee Clearance', transfer.feeClearance ? 'All dues cleared ✓' : 'Pending'],
              ['Library Clearance', transfer.libraryClearance ? 'All books returned ✓' : 'Pending'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <span className="min-w-[190px] font-bold">{label}:</span>
                <span className="flex-1 border-b border-gray-400 pb-0.5">{value || '—'}</span>
              </div>
            ))}
          </div>

          {transfer.conduct && (
            <div className="mt-5 p-3 border border-gray-300 bg-gray-50 text-sm font-serif">
              <strong>Character & Conduct:</strong> {transfer.conduct}
            </div>
          )}
          {transfer.remarks && (
            <div className="mt-3 text-sm font-serif"><strong>Remarks:</strong> {transfer.remarks}</div>
          )}

          <div className="flex justify-between mt-14 text-xs font-serif">
            <div className="text-center">
              <div className="border-t border-gray-700 pt-1 w-36">Class Teacher</div>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 border-2 border-blue-900 rounded-full flex items-center justify-center text-blue-900 font-bold text-xs text-center mx-auto mb-2">SCHOOL<br/>STAMP</div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-700 pt-1 w-36">Principal</div>
            </div>
          </div>

          <div className="text-center mt-4 text-xs text-gray-400 italic font-serif">
            Issued on: {fmtDate(transfer.issuedDate || new Date().toISOString())} • This is a computer-generated document
          </div>
        </div>
      </div>
    </div>
  );
}

const emptyForm = {
  studentId: '', studentName: '', fatherName: '', admissionNumber: '', dateOfBirth: '',
  lastClass: '', lastSection: '', academicYear: '', type: 'School Transfer', reason: 'Parent Request',
  dateOfAdmission: '', dateOfLeaving: new Date().toISOString().slice(0, 10),
  transferTo: '', feeClearance: false, libraryClearance: false,
  conduct: 'Good', remarks: '',
};

export default function StudentTransferPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, issued: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [showTC, setShowTC] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter, page: String(page) });
      const res = await fetch(`/api/stu-xfer?${params}`);
      const data = await res.json();
      setTransfers(data.transfers || []);
      setTotal(data.total || 0);
      if (data.summary) setSummary(data.summary);
      if (data.students) setStudents(data.students);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const onStudentSelect = (studentId: string) => {
    const s = students.find(x => x.id === studentId);
    if (s) setForm((f: any) => ({
      ...f, studentId, studentName: s.fullName, admissionNumber: s.admissionNumber,
      lastClass: s.class?.name || '', lastSection: s.section?.name || '',
    }));
    else setForm((f: any) => ({ ...f, studentId }));
  };

  const save = async () => {
    if (!form.studentName || !form.reason) {
      toast({ title: 'Student name and reason required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/stu-xfer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: 'Transfer request created' });
      setShowDialog(false); load();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const updateStatus = async (t: any, status: string) => {
    const res = await fetch('/api/stu-xfer', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, status }) });
    const data = await res.json();
    if (!res.ok) { toast({ title: data.error, variant: 'destructive' }); return; }
    toast({ title: `Status updated: ${status}` });
    if (status === 'TC Issued') setShowTC(data.transfer);
    load();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Student Transfer / TC Issuance"
        description="Process transfer requests and issue Transfer Certificates"
        actions={
          <Button size="sm" onClick={() => { setForm({ ...emptyForm }); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />New Transfer Request
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: summary.total, color: 'border-l-slate-500', icon: <UserMinus className="h-4 w-4 text-slate-500" /> },
          { label: 'Pending', value: summary.pending, color: 'border-l-amber-500', icon: <Clock className="h-4 w-4 text-amber-500" /> },
          { label: 'Approved', value: summary.approved, color: 'border-l-blue-500', icon: <CheckCircle2 className="h-4 w-4 text-blue-500" /> },
          { label: 'TC Issued', value: summary.issued, color: 'border-l-green-500', icon: <FileText className="h-4 w-4 text-green-500" /> },
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
        <CardContent className="p-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search name, admission no., TC..." className="pl-8" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {['Pending', 'Approved', 'TC Issued', 'Rejected'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <UserMinus className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No transfer requests found</p>
              <Button size="sm" className="mt-4" onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-2" />New Request</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TC Number</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date of Leaving</TableHead>
                  <TableHead>Clearance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map(t => (
                  <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell><span className="font-mono text-sm font-medium">{t.tcNumber}</span></TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{t.studentName}</div>
                      <div className="text-xs text-muted-foreground">{t.admissionNumber} · {t.fatherName}</div>
                    </TableCell>
                    <TableCell className="text-sm">{t.lastClass} {t.lastSection}</TableCell>
                    <TableCell className="text-sm">{t.reason}</TableCell>
                    <TableCell className="text-sm">{fmtDate(t.dateOfLeaving)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${t.feeClearance ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          Fees {t.feeClearance ? '✓' : '✗'}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${t.libraryClearance ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          Library {t.libraryClearance ? '✓' : '✗'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${STATUS_COLORS[t.status] || ''}`}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {t.status === 'Pending' && (
                          <Button variant="outline" size="sm" className="h-7 text-xs text-blue-600 border-blue-200" onClick={() => updateStatus(t, 'Approved')}>Approve</Button>
                        )}
                        {t.status === 'Approved' && (
                          <Button variant="outline" size="sm" className="h-7 text-xs text-green-600 border-green-200" onClick={() => updateStatus(t, 'TC Issued')}>Issue TC</Button>
                        )}
                        {t.status === 'TC Issued' && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowTC(t)}><Printer className="h-3.5 w-3.5 mr-1" />Print TC</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* New Transfer Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Transfer Request</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Select Student</Label>
              <Select value={form.studentId} onValueChange={onStudentSelect}>
                <SelectTrigger><SelectValue placeholder="Search and select student..." /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.admissionNumber} ({s.class?.name})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Student Name *</Label><Input value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Father's Name</Label><Input value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Admission Number</Label><Input value={form.admissionNumber} onChange={e => setForm({ ...form, admissionNumber: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Last Class</Label><Input value={form.lastClass} onChange={e => setForm({ ...form, lastClass: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Section</Label><Input value={form.lastSection} onChange={e => setForm({ ...form, lastSection: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Academic Year</Label><Input placeholder="e.g. 2024-25" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Date of Admission</Label><Input type="date" value={form.dateOfAdmission} onChange={e => setForm({ ...form, dateOfAdmission: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Date of Leaving *</Label><Input type="date" value={form.dateOfLeaving} onChange={e => setForm({ ...form, dateOfLeaving: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Transfer Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRANSFER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Reason *</Label>
              <Select value={form.reason} onValueChange={v => setForm({ ...form, reason: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Transfer To (School/City)</Label><Input placeholder="Destination school or city" value={form.transferTo} onChange={e => setForm({ ...form, transferTo: e.target.value })} /></div>
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer card-hover">
                <input type="checkbox" checked={form.feeClearance} onChange={e => setForm({ ...form, feeClearance: e.target.checked })} className="rounded" />
                <span className="text-sm">Fee Clearance Done</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer card-hover">
                <input type="checkbox" checked={form.libraryClearance} onChange={e => setForm({ ...form, libraryClearance: e.target.checked })} className="rounded" />
                <span className="text-sm">Library Clearance Done</span>
              </label>
            </div>
            <div className="space-y-1.5"><Label>Character & Conduct</Label>
              <Select value={form.conduct} onValueChange={v => setForm({ ...form, conduct: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Additional Remarks</Label><Input placeholder="Any additional remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TC Print Dialog */}
      <Dialog open={!!showTC} onOpenChange={open => !open && setShowTC(null)}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
          {showTC && <TCPrint transfer={showTC} onClose={() => setShowTC(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
