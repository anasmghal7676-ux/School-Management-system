'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Loader2, Receipt, Printer, Search, ChevronLeft, ChevronRight,
  Download, FileText, Users, RefreshCw, CheckSquare, Check, Building2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import { generateFeeChallan } from '@/lib/pdf-generator';

const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
const fmtShort = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

interface ChallanStudent {
  id: string;
  fullName: string;
  admissionNumber: string;
  rollNumber?: string;
  fatherName?: string;
  fatherPhone?: string;
  guardianPhone?: string;
  class?: { name: string };
  section?: { name: string };
  feeAssignments: any[];
  totalDue: number;
  arrears: number;
  fees?: any[];
  dueDate?: string;
  challanNo?: string;
}

export default function FeeChallanPage() {
  const [students,   setStudents]   = useState<ChallanStudent[]>([]);
  const [classes,    setClasses]    = useState<any[]>([]);
  const [settings,   setSettings]   = useState<any>({});
  const [loading,    setLoading]    = useState(false);
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [search,     setSearch]     = useState('');
  const [classId,    setClassId]    = useState('');
  const [month,      setMonth]      = useState(String(new Date().getMonth() + 1));
  const [year,       setYear]       = useState(String(new Date().getFullYear()));
  const [dueDate,    setDueDate]    = useState(() => {
    const d = new Date(); d.setDate(15); return d.toISOString().slice(0, 10);
  });
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStu,  setPreviewStu]  = useState<ChallanStudent | null>(null);
  const [bulkPrinting, setBulkPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchClasses(); fetchSettings(); }, []);
  useEffect(() => { fetchStudents(); }, [page, classId]);

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=50');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchSettings = async () => {
    try {
      const r = await fetch('/api/settings');
      const j = await r.json();
      if (j.success) setSettings(j.data || {});
    } catch {}
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '30', status: 'active' });
      if (search)  p.set('search',  search);
      if (classId) p.set('classId', classId);
      const r = await fetch(`/api/students?${p}`);
      const j = await r.json();
      if (j.success) {
        const list = j.data?.students || j.data || [];
        // For each student, fetch their fee assignments total
        const enriched: ChallanStudent[] = list.map((s: any) => ({
          ...s,
          totalDue: s.feeAssignments?.reduce((sum: number, a: any) => sum + (a.finalAmount || 0), 0) || 0,
          arrears:  0, // would come from unpaid previous months
        }));
        setStudents(enriched);
        setTotal(j.data?.pagination?.total || list.length);
      }
    } finally { setLoading(false); }
  }, [page, classId, search]);

  const handleSearch = () => { setPage(1); fetchStudents(); };

  const toggleSelect = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll   = () => setSelected(new Set(students.map(s => s.id)));
  const clearSelect = () => setSelected(new Set());

  const schoolName = settings.school_name    || 'School Name';
  const schoolAddr = settings.school_address || 'School Address, City';
  const bankName   = settings.bank_name      || 'Habib Bank Limited (HBL)';
  const bankAcc    = settings.bank_account   || 'PK00-HABL-0000-0000-0000';
  const bankBranch = settings.bank_branch    || 'Main Branch';
  const challanMonth = `${MONTHS[parseInt(month) - 1]} ${year}`;

  const downloadPDF = (student: ChallanStudent) => {
    generateFeeChallan({
      student: student,
      fees: student.fees || [],
      dueDate: student.dueDate || new Date(Date.now() + 10*86400000).toLocaleDateString('en-PK'),
      challanNo: student.challanNo || `CH-${Date.now().toString().slice(-6)}`,
      month: new Date().toLocaleString('en-PK', { month: 'long', year: 'numeric' }),
    });
  };

  const printChallan = (student: ChallanStudent) => {
    const content = buildChallanHTML(student);
    const win     = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>Fee Challan</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; padding: 10px; background: #fff; font-size: 11px; }
      .challan-row { display: flex; gap: 10px; }
      .challan-copy { flex: 1; border: 2px solid #000; padding: 12px; border-radius: 4px; }
      .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
      .header h1 { font-size: 14px; font-weight: bold; }
      .header p  { font-size: 10px; color: #444; }
      .copy-label { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; }
      td, th { padding: 3px 6px; }
      th { background: #f0f0f0; font-weight: bold; border: 1px solid #ccc; }
      td { border: 1px solid #ccc; }
      .label { font-weight: bold; color: #444; white-space: nowrap; }
      .total-row td { background: #f5f5f5; font-weight: bold; }
      .footer { margin-top: 8px; border-top: 1px solid #000; padding-top: 6px; display: flex; justify-content: space-between; }
      .divider { border: none; border-top: 2px dashed #999; margin: 10px 0; }
      @media print { .no-print { display: none; } }
    </style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 200);
  };

  const buildChallanHTML = (student: ChallanStudent) => {
    const items = student.feeAssignments || [];
    const challanNo = `${year}${month.padStart(2,'0')}-${student.admissionNumber}`;
    const rows = items.length > 0
      ? items.map((a: any) => `<tr><td>${a.feeStructure?.name || 'Monthly Fee'}</td><td style="text-align:right">PKR ${fmt(a.finalAmount || 0)}</td></tr>`).join('')
      : `<tr><td>Monthly Tuition Fee</td><td style="text-align:right">PKR ${fmt(student.totalDue)}</td></tr>`;

    const copy = (label: string) => `
      <div class="challan-copy">
        <div class="copy-label">${label}</div>
        <div class="header">
          <h1>${schoolName}</h1>
          <p>${schoolAddr}</p>
          <p style="font-size:11px;font-weight:bold;margin-top:4px">FEE CHALLAN — ${challanMonth}</p>
        </div>
        <table>
          <tr><td class="label">Challan No:</td><td>${challanNo}</td><td class="label">Due Date:</td><td>${fmtShort(dueDate)}</td></tr>
          <tr><td class="label">Student:</td><td colspan="3">${student.fullName} (${student.admissionNumber})</td></tr>
          <tr><td class="label">Father:</td><td>${student.fatherName || '—'}</td><td class="label">Class:</td><td>${student.class?.name || '—'} ${student.section ? student.section.name : ''}</td></tr>
          <tr><td class="label">Bank:</td><td colspan="3">${bankName} · A/C: ${bankAcc} · ${bankBranch}</td></tr>
        </table>
        <table style="margin-top:6px">
          <tr><th style="text-align:left">Fee Type</th><th style="text-align:right">Amount</th></tr>
          ${rows}
          ${student.arrears > 0 ? `<tr><td>Previous Arrears</td><td style="text-align:right">PKR ${fmt(student.arrears)}</td></tr>` : ''}
          <tr class="total-row"><td><strong>Total Payable</strong></td><td style="text-align:right"><strong>PKR ${fmt(student.totalDue + student.arrears)}</strong></td></tr>
        </table>
        <div class="footer">
          <span>Bank Stamp & Signature</span>
          <span>______________________</span>
        </div>
      </div>`;

    return `
      <div class="challan-row">${copy('Student Copy')}${copy('Bank Copy')}${copy('School Copy')}</div>
    `;
  };

  const printBulk = () => {
    const targets = selected.size > 0
      ? students.filter(s => selected.has(s.id))
      : students;
    if (targets.length === 0) { toast({ title: 'No students selected', variant: 'destructive' }); return; }
    setBulkPrinting(true);
    const content = targets.map(s => buildChallanHTML(s)).join('<div class="divider"></div>');
    const win = window.open('', '_blank');
    if (!win) { setBulkPrinting(false); return; }
    win.document.write(`<html><head><title>Bulk Fee Challans</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; padding: 10px; background: #fff; font-size: 11px; }
      .challan-row { display: flex; gap: 8px; margin-bottom: 8px; }
      .challan-copy { flex: 1; border: 2px solid #000; padding: 10px; border-radius: 4px; }
      .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
      .header h1 { font-size: 13px; font-weight: bold; }
      .header p  { font-size: 9px; color: #444; }
      .copy-label { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 3px; }
      table { width: 100%; border-collapse: collapse; margin-top: 4px; }
      td, th { padding: 2px 4px; font-size: 10px; }
      th { background: #f0f0f0; font-weight: bold; border: 1px solid #ccc; }
      td { border: 1px solid #ccc; }
      .label { font-weight: bold; color: #444; white-space: nowrap; }
      .total-row td { background: #f5f5f5; font-weight: bold; }
      .footer { margin-top: 6px; border-top: 1px solid #000; padding-top: 4px; display: flex; justify-content: space-between; font-size: 10px; }
      .divider { border: none; border-top: 3px dashed #aaa; margin: 12px 0; }
      @page { margin: 10mm; }
      @media print { .no-print { display: none; } }
    </style></head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); setBulkPrinting(false); }, 300);
    toast({ title: `Printing ${targets.length} challans` });
  };

  const years = Array.from({ length: 3 }, (_, i) => String(new Date().getFullYear() - 1 + i));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-50"><Receipt className="h-6 w-6 text-emerald-600" /></span>
              Fee Challan Generator
            </h1>
            <p className="text-muted-foreground mt-0.5">Generate and print bank payment challans</p>
          </div>
          <div className="flex gap-2">
            {(selected.size > 0) && (
              <Button variant="outline" size="sm" onClick={clearSelect}>
                Clear ({selected.size})
              </Button>
            )}
            <Button
              onClick={printBulk}
              disabled={bulkPrinting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {bulkPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              {selected.size > 0 ? `Print ${selected.size} Challans` : 'Print All'}
            </Button>
          </div>
        </div>

        {/* Challan config */}
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-emerald-600" />Challan Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={m} value={String(i+1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Filter by Class</Label>
                <Select value={classId || 'all'} onValueChange={v => { setClassId(v === 'all' ? '' : v); setPage(1); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white rounded-xl border text-xs text-muted-foreground grid sm:grid-cols-3 gap-2">
              <div><span className="font-semibold text-foreground">School:</span> {schoolName}</div>
              <div><span className="font-semibold text-foreground">Bank:</span> {bankName}</div>
              <div><span className="font-semibold text-foreground">Account:</span> {bankAcc}</div>
            </div>
          </CardContent>
        </Card>

        {/* Search + table */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or admission number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-8"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>Search</Button>
          <Button variant="ghost" size="icon" onClick={() => fetchStudents()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Selection bar */}
        {students.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <button className="underline hover:text-foreground" onClick={selectAll}>Select all {students.length}</button>
            {selected.size > 0 && (
              <><span>·</span><span className="font-medium text-foreground">{selected.size} selected</span>
              <button className="underline hover:text-foreground" onClick={clearSelect}>Clear</button></>
            )}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 opacity-20 mb-3" />
                <p className="font-semibold">No students found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-10 pl-4">
                        <input type="checkbox"
                          checked={selected.size === students.length}
                          onChange={e => e.target.checked ? selectAll() : clearSelect()}
                          className="h-4 w-4 rounded" />
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Father</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="text-right">Fee Due</TableHead>
                      <TableHead className="w-28">Challan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(student => (
                      <TableRow key={student.id} className={`hover:bg-muted/10 ${selected.has(student.id) ? 'bg-emerald-50/50' : ''}`}>
                        <TableCell className="pl-4">
                          <input type="checkbox" checked={selected.has(student.id)} onChange={() => toggleSelect(student.id)} className="h-4 w-4 rounded" />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm">{student.fullName}</div>
                          {student.rollNumber && <div className="text-xs text-muted-foreground">Roll: {student.rollNumber}</div>}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">{student.admissionNumber}</TableCell>
                        <TableCell className="text-sm">
                          {student.class?.name || '—'}
                          {student.section && <span className="text-muted-foreground"> {student.section.name}</span>}
                        </TableCell>
                        <TableCell className="text-sm">{student.fatherName || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{student.fatherPhone || '—'}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-emerald-700">
                            PKR {fmt(student.totalDue)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => { setPreviewStu(student); setPreviewOpen(true); }}
                            >
                              <FileText className="h-3 w-3" />Preview
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => printChallan(student)}
                              title="Print Challan"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-red-600 hover:text-red-700"
                              onClick={() => downloadPDF(student)}
                              title="Download PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {Math.ceil(total / 30) > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <span className="text-xs text-muted-foreground">{((page-1)*30)+1}–{Math.min(page*30, total)} of {total}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={page >= Math.ceil(total/30)} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Fee Challan Preview — {challanMonth}</DialogTitle>
            <DialogDescription>
              {previewStu?.fullName} · {previewStu?.admissionNumber} · Due: {fmtShort(dueDate)}
            </DialogDescription>
          </DialogHeader>
          {previewStu && (
            <div className="max-h-[65vh] overflow-y-auto">
              {/* Visual challan preview */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl border">
                {(['Student Copy', 'Bank Copy', 'School Copy'] as const).map(label => {
                  const challanNo = `${year}${month.padStart(2,'0')}-${previewStu.admissionNumber}`;
                  const items     = previewStu.feeAssignments || [];
                  return (
                    <div key={label} className="bg-white border-2 border-gray-700 rounded-lg p-3 text-xs font-sans">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</div>
                      <div className="text-center border-b border-gray-400 pb-2 mb-2">
                        <div className="font-black text-sm">{schoolName}</div>
                        <div className="text-gray-500 text-[9px]">{schoolAddr}</div>
                        <div className="font-bold text-xs mt-1">FEE CHALLAN — {challanMonth}</div>
                      </div>
                      <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between"><span className="font-bold text-gray-500">Challan No:</span><span>{challanNo}</span></div>
                        <div className="flex justify-between"><span className="font-bold text-gray-500">Due Date:</span><span>{fmtShort(dueDate)}</span></div>
                        <div><span className="font-bold text-gray-500">Student:</span> {previewStu.fullName}</div>
                        <div><span className="font-bold text-gray-500">Class:</span> {previewStu.class?.name} {previewStu.section?.name}</div>
                        <div><span className="font-bold text-gray-500">Bank:</span> {bankName}</div>
                        <div><span className="font-bold text-gray-500">A/C:</span> {bankAcc}</div>
                      </div>
                      <div className="mt-2 border-t border-gray-300 pt-1">
                        <table className="w-full text-[9px]">
                          <thead><tr><th className="text-left border border-gray-300 px-1">Description</th><th className="text-right border border-gray-300 px-1">Amount</th></tr></thead>
                          <tbody>
                            {items.length > 0
                              ? items.map((a: any, i: number) => (
                                <tr key={i}><td className="border border-gray-300 px-1">{a.feeStructure?.name || 'Fee'}</td><td className="border border-gray-300 px-1 text-right">{fmt(a.finalAmount || 0)}</td></tr>
                              ))
                              : <tr><td className="border border-gray-300 px-1">Monthly Fee</td><td className="border border-gray-300 px-1 text-right">{fmt(previewStu.totalDue)}</td></tr>}
                            <tr className="bg-gray-100 font-bold"><td className="border border-gray-300 px-1">Total</td><td className="border border-gray-300 px-1 text-right">PKR {fmt(previewStu.totalDue)}</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 pt-1 border-t border-gray-400 flex justify-between text-[9px] text-gray-500">
                        <span>Bank Stamp</span><span>________________</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPreviewOpen(false)} className="flex-1">Close</Button>
            <Button
              onClick={() => { setPreviewOpen(false); if (previewStu) printChallan(previewStu); }}
              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Printer className="h-4 w-4" />Print Challan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
