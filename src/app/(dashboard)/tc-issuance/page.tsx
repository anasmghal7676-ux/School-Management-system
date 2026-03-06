'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, RefreshCw, Trash2, Download, FileText, Printer, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateTC } from '@/lib/pdf-generator';
import PageHeader from '@/components/page-header';

const REASONS = ['Seeking Admission Elsewhere', 'Migration', 'Family Relocation', 'Graduation / Passed Out', 'Withdrawn by Parents', 'Other'];
const CONDUCT_OPTIONS = ['Satisfactory', 'Good', 'Very Good', 'Excellent'];
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

function downloadTCPDF(tc: any) {
  generateTC({
    student: tc.student || {},
    issueDate: tc.issueDate || new Date().toLocaleDateString('en-PK'),
    reason: tc.reason || tc.reasonForLeaving || '',
    lastAttendance: tc.lastAttendance || tc.lastDate || '',
    behaviorRemark: tc.behaviorRemark || 'Satisfactory',
    principal: tc.school?.principalName || '',
  });
}

function printTC(tc: any, school: any) {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return;
  w.document.write(`
<!DOCTYPE html><html><head><title>Transfer Certificate - ${tc.tcNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', serif; padding: 40px; font-size: 13px; color: #000; }
  .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 16px; margin-bottom: 20px; }
  .school-name { font-size: 24px; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; }
  .school-sub { font-size: 13px; color: #333; }
  .tc-title { font-size: 18px; font-weight: bold; text-align: center; margin: 16px 0; letter-spacing: 2px; border: 2px solid #000; padding: 8px; background: #f5f5f5; }
  .tc-number { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  td { padding: 7px 10px; border: 1px solid #ccc; vertical-align: top; }
  td:first-child { width: 40%; font-weight: bold; background: #f9f9f9; }
  .signature-row { display: flex; justify-content: space-between; margin-top: 48px; }
  .sig-box { text-align: center; border-top: 1px solid #000; padding-top: 6px; min-width: 150px; font-size: 12px; }
  .seal { width: 100px; height: 100px; border: 2px dashed #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: #ccc; font-size: 10px; text-align: center; }
  .footer { text-align: center; font-size: 10px; color: #666; margin-top: 24px; border-top: 1px solid #ccc; padding-top: 8px; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="header">
  <div class="school-name">${school.name || 'SCHOOL NAME'}</div>
  <div class="school-sub">${school.address || ''}</div>
  ${school.contact ? `<div class="school-sub">Tel: ${school.contact}</div>` : ''}
</div>

<div class="tc-title">TRANSFER CERTIFICATE</div>
<div class="tc-number">
  <span><strong>TC No:</strong> ${tc.tcNumber}</span>
  <span><strong>Date of Issue:</strong> ${fmtDate(tc.issuanceDate)}</span>
</div>

<p style="margin-bottom:12px;">This is to certify that the following student was on the roll of this institution:</p>

<table>
  <tr><td>Student's Full Name</td><td>${tc.studentName}</td></tr>
  <tr><td>Father's Name</td><td>${tc.fatherName || '—'}</td></tr>
  <tr><td>Admission Number</td><td>${tc.admissionNo}</td></tr>
  <tr><td>Class Last Attended</td><td>${tc.lastClass || '—'} ${tc.lastSection || ''}</td></tr>
  <tr><td>Date of Admission</td><td>${fmtDate(tc.dateOfAdmission)}</td></tr>
  <tr><td>Date of Birth</td><td>${fmtDate(tc.dateOfBirth)} (${tc.dobInWords || ''})</td></tr>
  <tr><td>Nationality / Religion</td><td>${tc.nationality || 'Pakistani'} / ${tc.religion || '—'}</td></tr>
  <tr><td>Academic Year</td><td>${tc.academicYear || '—'}</td></tr>
  <tr><td>Examination Last Appeared</td><td>${tc.lastExam || '—'}</td></tr>
  <tr><td>Result</td><td>${tc.examResult || '—'}</td></tr>
  <tr><td>Behaviour & Character</td><td>${tc.conduct || 'Satisfactory'}</td></tr>
  <tr><td>Reason for Leaving</td><td>${tc.reason || '—'}</td></tr>
  <tr><td>Fees Paid Up To</td><td>${tc.feesPaidUpto || '—'}</td></tr>
  <tr><td>Remarks</td><td>${tc.remarks || '—'}</td></tr>
</table>

<div class="signature-row">
  <div class="sig-box">Class Teacher</div>
  <div class="seal">School<br/>Seal</div>
  <div class="sig-box">Principal / Head</div>
</div>

<div class="footer">
  This certificate is issued without any erasure or correction and is correct to the best of our knowledge.<br/>
  Issued on: ${fmtDate(tc.issuanceDate)} | ${school.name}
</div>
</body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 500);
}

export default function TCIssuancePage() {
  const [items, setItems] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [school, setSchool] = useState<any>({});
  const [nextTcNum, setNextTcNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [form, setForm] = useState<any>({ studentId: '', studentName: '', admissionNo: '', fatherName: '', dateOfBirth: '', dobInWords: '', lastClass: '', lastSection: '', dateOfAdmission: '', academicYear: '', lastExam: '', examResult: '', nationality: 'Pakistani', religion: 'Islam', conduct: 'Satisfactory', reason: 'Seeking Admission Elsewhere', feesPaidUpto: '', tcNumber: '', issuanceDate: new Date().toISOString().slice(0, 10), markAsLeft: true, remarks: '' });
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page), limit: String(limit) });
      const res = await fetch(`/api/tc-issuance?${params}`);
      const data = await res.json();
      setItems(data.items || []); setTotal(data.total || 0);
      if (data.students) setStudents(data.students);
      if (data.school) setSchool(data.school);
      if (data.nextTcNum) setNextTcNum(data.nextTcNum);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const handleStudentSelect = (id: string) => {
    const s = students.find(x => x.id === id);
    if (s) {
      const dob = s.dateOfBirth ? new Date(s.dateOfBirth) : null;
      const dobWords = dob ? dob.toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      setForm((f: any) => ({ ...f, studentId: s.id, studentName: s.fullName, admissionNo: s.admissionNumber, fatherName: s.fatherName || '', dateOfBirth: s.dateOfBirth?.toISOString?.()?.slice(0,10) || (s.dateOfBirth ? String(s.dateOfBirth).slice(0,10) : ''), dobInWords: dobWords, lastClass: s.class?.name || '', lastSection: s.section?.name || '', tcNumber: `TC-${String(nextTcNum).padStart(4, '0')}` }));
    }
  };

  const save = async () => {
    if (!form.studentId || !form.tcNumber) { toast({ title: 'Student and TC number required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/tc-issuance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      toast({ title: 'TC Issued', description: `${form.tcNumber} issued for ${form.studentName}` });
      setShowDialog(false);
      setNextTcNum(n => n + 1);
      load();
      // Auto print
      if (data.item) setTimeout(() => printTC(data.item, school), 300);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (item: any) => {
    if (!confirm('Delete TC record?')) return;
    await fetch('/api/tc-issuance', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
    toast({ title: 'Deleted' }); load();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Transfer Certificate (TC) Issuance" description="Issue official Transfer Certificates with printable formal document format"
        actions={<Button size="sm" onClick={() => { setForm({ studentId: '', studentName: '', admissionNo: '', fatherName: '', dateOfBirth: '', dobInWords: '', lastClass: '', lastSection: '', dateOfAdmission: '', academicYear: '', lastExam: '', examResult: '', nationality: 'Pakistani', religion: 'Islam', conduct: 'Satisfactory', reason: 'Seeking Admission Elsewhere', feesPaidUpto: '', tcNumber: `TC-${String(nextTcNum).padStart(4,'0')}`, issuanceDate: new Date().toISOString().slice(0,10), markAsLeft: true, remarks: '' }); setShowDialog(true); }}><Plus className="h-4 w-4 mr-2" />Issue TC</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><div className="flex items-center justify-between"><FileText className="h-4 w-4 text-blue-500" /><span className="text-2xl font-bold">{total}</span></div><p className="text-xs text-muted-foreground mt-1">TCs Issued</p></CardContent></Card>
        <Card className="border-l-4 border-l-amber-500"><CardContent className="p-4"><div className="flex items-center justify-between"><FileText className="h-4 w-4 text-amber-500" /><span className="text-2xl font-bold">TC-{String(nextTcNum).padStart(4,'0')}</span></div><p className="text-xs text-muted-foreground mt-1">Next TC Number</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><div className="flex items-center justify-between"><Download className="h-4 w-4 text-green-500" /><span className="text-sm font-medium">Click Print on any TC</span></div><p className="text-xs text-muted-foreground mt-1">Printable Official Format</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name, TC number, admission no..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex justify-center items-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div> :
          items.length === 0 ? <div className="text-center py-16 text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No TCs issued yet</p><Button size="sm" className="mt-3" onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-2" />Issue First TC</Button></div> :
          <Table>
            <TableHeader><TableRow>
              <TableHead>TC Number</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Conduct</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell><span className="font-mono font-bold text-primary">{item.tcNumber}</span></TableCell>
                  <TableCell><div className="font-medium text-sm">{item.studentName}</div><div className="text-xs text-muted-foreground">{item.admissionNo} · {item.fatherName}</div></TableCell>
                  <TableCell className="text-sm">{item.lastClass} {item.lastSection}</TableCell>
                  <TableCell className="text-sm">{fmtDate(item.issuanceDate)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.reason}</Badge></TableCell>
                  <TableCell><Badge className="text-xs bg-green-100 text-green-700">{item.conduct}</Badge></TableCell>
                  <TableCell className="text-right"><div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" className="h-7" onClick={() => printTC(item, school)}><Printer className="h-3.5 w-3.5 mr-1" />Print TC</Button>
                    <Button variant="outline" size="sm" className="h-7 text-red-600 border-red-200 hover:bg-red-50" onClick={() => downloadTCPDF(item)}><Download className="h-3.5 w-3.5 mr-1" />PDF</Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
        {Math.ceil(total / limit) > 1 && <div className="flex items-center justify-between px-4 py-3 border-t"><p className="text-sm text-muted-foreground">{(page-1)*limit+1}–{Math.min(page*limit,total)} of {total}</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage(p=>p-1)} disabled={page===1}>Previous</Button><Button variant="outline" size="sm" onClick={() => setPage(p=>p+1)} disabled={page>=Math.ceil(total/limit)}>Next</Button></div></div>}
      </CardContent></Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Issue Transfer Certificate</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Student *</Label><Select value={form.studentId} onValueChange={handleStudentSelect}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.admissionNumber}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>TC Number *</Label><Input value={form.tcNumber} onChange={e => setForm({ ...form, tcNumber: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Issue Date</Label><Input type="date" value={form.issuanceDate} onChange={e => setForm({ ...form, issuanceDate: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Father's Name</Label><Input value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Date of Birth in Words</Label><Input value={form.dobInWords} onChange={e => setForm({ ...form, dobInWords: e.target.value })} placeholder="e.g. 15th March 2010" /></div>
            <div className="space-y-1.5"><Label>Last Class</Label><Input value={form.lastClass} onChange={e => setForm({ ...form, lastClass: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Date of Admission</Label><Input type="date" value={form.dateOfAdmission} onChange={e => setForm({ ...form, dateOfAdmission: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Academic Year</Label><Input value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} placeholder="2025-2026" /></div>
            <div className="space-y-1.5"><Label>Last Exam</Label><Input value={form.lastExam} onChange={e => setForm({ ...form, lastExam: e.target.value })} placeholder="Annual Exam 2025" /></div>
            <div className="space-y-1.5"><Label>Exam Result</Label><Input value={form.examResult} onChange={e => setForm({ ...form, examResult: e.target.value })} placeholder="Passed / A Grade" /></div>
            <div className="space-y-1.5"><Label>Nationality</Label><Input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Religion</Label><Input value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Behaviour & Conduct</Label><Select value={form.conduct} onValueChange={v => setForm({ ...form, conduct: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONDUCT_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Reason for Leaving</Label><Select value={form.reason} onValueChange={v => setForm({ ...form, reason: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Fees Paid Up To</Label><Input value={form.feesPaidUpto} onChange={e => setForm({ ...form, feesPaidUpto: e.target.value })} placeholder="e.g. December 2025" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Remarks</Label><Textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} rows={2} /></div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer card-hover">
                <input type="checkbox" checked={form.markAsLeft} onChange={e => setForm({ ...form, markAsLeft: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm">Mark student status as "Left" after issuing TC</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
              Issue & Print TC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
