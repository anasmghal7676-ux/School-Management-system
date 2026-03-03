'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award, Play, Loader2, Search, Eye, Printer, Download,
  TrendingUp, Users, CheckCircle2, XCircle, BarChart3,
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import { generateReportCard } from '@/lib/pdf-generator';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReportCard {
  id: string;
  studentId: string;
  examId: string;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  rankInClass: number | null;
  attendancePercentage: number | null;
  remarks: string | null;
  generatedDate: string;
  student: {
    fullName: string;
    admissionNumber: string;
    rollNumber: string | null;
    fatherName: string;
    class:   { name: string } | null;
    section: { name: string } | null;
  };
  exam: { id: string; name: string; examType: string; startDate: string };
  subjectDetails?: {
    subjectName: string; maxMarks: number; obtained: number;
    percentage: number; isAbsent: boolean; grade: string;
  }[];
}

interface Summary {
  total: number; passed: number; failed: number;
  highest: number; lowest: number; average: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-emerald-600 font-bold', 'A': 'text-green-600 font-bold',
  'B+': 'text-blue-600 font-bold',   'B': 'text-blue-500',
  'C+': 'text-yellow-600',           'C': 'text-yellow-500',
  'D':  'text-orange-500',           'F': 'text-red-600 font-bold',
};

const GRADE_BG: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-800', 'A': 'bg-green-100 text-green-800',
  'B+': 'bg-blue-100 text-blue-800',       'B': 'bg-blue-50 text-blue-700',
  'C+': 'bg-yellow-100 text-yellow-800',   'C': 'bg-yellow-50 text-yellow-700',
  'D':  'bg-orange-100 text-orange-800',   'F': 'bg-red-100 text-red-800',
};

// ─── Print component ─────────────────────────────────────────────────────────

function PrintableReportCard({ card }: { card: ReportCard }) {
  return (
    <div className="p-8 bg-white text-black print:block font-sans" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-widest">School Management System</h1>
        <h2 className="text-lg font-semibold mt-1">Progress Report — {card.exam?.name}</h2>
        <p className="text-sm text-gray-600">{card.exam?.examType} • {new Date(card.exam?.startDate).toLocaleDateString()}</p>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 border border-gray-300 p-4 rounded">
        {[
          ['Student Name', card.student?.fullName],
          ['Father\'s Name', card.student?.fatherName],
          ['Admission No', card.student?.admissionNumber],
          ['Roll Number', card.student?.rollNumber || '—'],
          ['Class', `${card.student?.class?.name || '—'} ${card.student?.section?.name ? `(${card.student.section.name})` : ''}`],
          ['Attendance', card.attendancePercentage != null ? `${card.attendancePercentage}%` : '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <span className="text-gray-500 text-sm font-medium w-28">{label}:</span>
            <span className="text-sm font-semibold">{value}</span>
          </div>
        ))}
      </div>

      {/* Subject Marks Table */}
      {card.subjectDetails && card.subjectDetails.length > 0 && (
        <table className="w-full border-collapse mb-6 text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-600 p-2 text-left">Subject</th>
              <th className="border border-gray-600 p-2 text-center">Max Marks</th>
              <th className="border border-gray-600 p-2 text-center">Obtained</th>
              <th className="border border-gray-600 p-2 text-center">%</th>
              <th className="border border-gray-600 p-2 text-center">Grade</th>
            </tr>
          </thead>
          <tbody>
            {card.subjectDetails.map((s, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-300 p-2">{s.subjectName}</td>
                <td className="border border-gray-300 p-2 text-center">{s.maxMarks}</td>
                <td className="border border-gray-300 p-2 text-center">
                  {s.isAbsent ? <span className="text-red-600 font-semibold">ABS</span> : s.obtained}
                </td>
                <td className="border border-gray-300 p-2 text-center">{s.percentage.toFixed(1)}%</td>
                <td className="border border-gray-300 p-2 text-center font-bold">{s.grade}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200 font-bold">
              <td className="border border-gray-400 p-2">Total</td>
              <td className="border border-gray-400 p-2 text-center">{card.totalMarks}</td>
              <td className="border border-gray-400 p-2 text-center">{card.marksObtained}</td>
              <td className="border border-gray-400 p-2 text-center">{card.percentage.toFixed(1)}%</td>
              <td className="border border-gray-400 p-2 text-center">{card.grade}</td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Result Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          ['Total Marks', card.totalMarks],
          ['Marks Obtained', card.marksObtained],
          ['Percentage', `${card.percentage.toFixed(1)}%`],
          ['Class Rank', card.rankInClass ? `#${card.rankInClass}` : '—'],
        ].map(([label, value]) => (
          <div key={label} className="border border-gray-300 p-3 text-center rounded">
            <p className="text-xs text-gray-500 uppercase">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Grade & Remarks */}
      <div className="flex items-center justify-between border-2 border-gray-800 p-4 rounded">
        <div>
          <p className="text-sm text-gray-500">Overall Grade</p>
          <p className="text-4xl font-black">{card.grade}</p>
          <p className="text-sm font-medium">{card.remarks}</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${card.percentage >= 33 ? 'text-green-600' : 'text-red-600'}`}>
            {card.percentage >= 33 ? 'PROMOTED' : 'FAILED'}
          </p>
          <p className="text-sm text-gray-500">Grade Points: {card.gradePoint?.toFixed(1)}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex justify-between text-sm text-gray-500 border-t pt-4">
        <div><p className="font-medium">Class Teacher Sign</p><div className="mt-4 w-32 border-b border-gray-400"/></div>
        <div className="text-center"><p>Generated: {new Date(card.generatedDate).toLocaleDateString()}</p></div>
        <div><p className="font-medium">Principal Sign</p><div className="mt-4 w-32 border-b border-gray-400"/></div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportCardsPage() {
  const [cards, setCards]       = useState<ReportCard[]>([]);
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [loading, setLoading]   = useState(false);
  const [generating, setGen]    = useState(false);

  const [exams, setExams]         = useState<any[]>([]);
  const [classes, setClasses]     = useState<any[]>([]);
  const [sections, setSections]   = useState<any[]>([]);
  const [filtSections, setFiltSec] = useState<any[]>([]);

  const [selExam,    setSelExam]    = useState('');
  const [selClass,   setSelClass]   = useState('');
  const [selSection, setSelSection] = useState('');
  const [search,     setSearch]     = useState('');
  const [searchIn,   setSearchIn]   = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [viewCard, setViewCard] = useState<ReportCard | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // ── Fetch helpers ─────────────────────────────────────────────────────────

  useEffect(() => { fetchExams(); fetchClasses(); fetchAllSections(); }, []);

  useEffect(() => {
    setFiltSec(selClass ? sections.filter(s => s.classId === selClass) : []);
    setSelSection('');
  }, [selClass, sections]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchIn), 400);
    return () => clearTimeout(t);
  }, [searchIn]);

  useEffect(() => {
    if (selExam && selClass) fetchCards();
  }, [selExam, selClass, selSection, search, page]);

  const fetchExams = async () => {
    const r = await fetch('/api/exams?limit=50');
    const j = await r.json();
    if (j.success) setExams(j.data.exams || []);
  };

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=100');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchAllSections = async () => {
    const r = await fetch('/api/sections?limit=200');
    const j = await r.json();
    if (j.success) setSections(j.data?.sections || j.data || []);
  };

  const fetchCards = useCallback(async () => {
    if (!selExam || !selClass) return;
    setLoading(true);
    try {
      const p = new URLSearchParams({ examId: selExam, classId: selClass, page: String(page), limit: '30' });
      if (selSection) p.append('sectionId', selSection);
      const r = await fetch(`/api/rpt-cards?${p}`);
      const j = await r.json();
      if (j.success) {
        setCards(j.data.cards);
        setSummary(j.data.summary);
        setTotalPages(j.data.pagination.totalPages);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load report cards', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [selExam, selClass, selSection, page]);

  // ── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!selExam || !selClass) {
      toast({ title: 'Required', description: 'Select exam and class first', variant: 'destructive' });
      return;
    }
    setGen(true);
    try {
      const r = await fetch('/api/rpt-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selExam, classId: selClass,
          sectionId: selSection || undefined,
          generatedBy: 'Admin',
        }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Generated', description: j.message });
        fetchCards();
      } else {
        toast({ title: 'Error', description: j.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to generate', variant: 'destructive' });
    } finally { setGen(false); }
  };

  // ── Print ─────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Report Card</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        @media print { @page { margin: 0; } }
      </style>
      </head><body>${printRef.current.innerHTML}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  const downloadReportCardPDF = () => {
    if (!viewCard) return;
    generateReportCard({
      student: (viewCard as any).student || viewCard,
      marks: (viewCard as any).marks || (viewCard as any).results || [],
      term: (viewCard as any).term || (viewCard as any).examTitle || 'Annual',
      academicYear: (viewCard as any).academicYear || new Date().getFullYear().toString(),
      attendance: (viewCard as any).attendance,
      remarks: (viewCard as any).remarks || '',
      classTeacher: (viewCard as any).classTeacher || '',
    });
  };

  // ── Filtered cards ────────────────────────────────────────────────────────

  const displayed = search
    ? cards.filter(c =>
        c.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.admissionNumber?.includes(search)
      )
    : cards;

  const selectedExamName = exams.find(e => e.id === selExam)?.name || '';

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Report Cards & Grades</h1>
            <p className="text-muted-foreground">Generate and manage student result cards with GPA</p>
          </div>
          <Button onClick={handleGenerate} disabled={generating || !selExam || !selClass}>
            {generating
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Play className="mr-2 h-4 w-4" />}
            Generate Report Cards
          </Button>
        </div>

        {/* ── Controls ── */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label>Exam *</Label>
                <Select value={selExam} onValueChange={v => { setSelExam(v); setPage(1); }}>
                  <SelectTrigger className="mt-1 w-56"><SelectValue placeholder="Select exam" /></SelectTrigger>
                  <SelectContent>
                    {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class *</Label>
                <Select value={selClass} onValueChange={v => { setSelClass(v); setPage(1); }}>
                  <SelectTrigger className="mt-1 w-40"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Section</Label>
                <Select value={selSection} onValueChange={v => { setSelSection(v); setPage(1); }} disabled={!selClass}>
                  <SelectTrigger className="mt-1 w-36"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sections</SelectItem>
                    {filtSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 mt-1"
                  placeholder="Search student..."
                  value={searchIn}
                  onChange={e => setSearchIn(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={fetchCards} disabled={loading || !selExam || !selClass}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Summary cards ── */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Total',   value: summary.total,              icon: Users,      color: 'border-l-blue-500',   text: '' },
              { label: 'Passed',  value: summary.passed,             icon: CheckCircle2, color: 'border-l-green-500', text: 'text-green-600' },
              { label: 'Failed',  value: summary.failed,             icon: XCircle,    color: 'border-l-red-500',    text: 'text-red-600' },
              { label: 'Highest', value: `${summary.highest.toFixed(1)}%`, icon: TrendingUp, color: 'border-l-emerald-500', text: 'text-emerald-600' },
              { label: 'Average', value: `${summary.average.toFixed(1)}%`, icon: BarChart3,  color: 'border-l-amber-500',  text: '' },
              { label: 'Lowest',  value: `${summary.lowest.toFixed(1)}%`,  icon: TrendingUp, color: 'border-l-orange-500', text: '' },
            ].map(({ label, value, icon: Icon, color, text }) => (
              <Card key={label} className={`border-l-4 ${color}`}>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-xl font-bold ${text}`}>{value}</p>
                    </div>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Results Table ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedExamName
                ? `${selectedExamName} — Results`
                : 'Select exam and class to view results'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : !selExam || !selClass ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Award className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Select exam and class to view report cards</p>
              </div>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-3" />
                <p className="font-medium">No report cards found</p>
                <p className="text-sm mb-4">Click "Generate Report Cards" to create them from marks data</p>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Generate Now
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Obtained</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>GPA</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.map(c => (
                      <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-bold text-muted-foreground">
                          {c.rankInClass ? `#${c.rankInClass}` : '—'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.student?.fullName}</p>
                            <p className="text-xs text-muted-foreground">{c.student?.admissionNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {c.student?.class?.name}
                          {c.student?.section && <span className="text-muted-foreground"> ({c.student.section.name})</span>}
                        </TableCell>
                        <TableCell className="text-right font-mono">{c.totalMarks}</TableCell>
                        <TableCell className="text-right font-mono">{c.marksObtained}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {c.percentage.toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${GRADE_BG[c.grade] || 'bg-gray-100 text-gray-800'}`}>
                            {c.grade}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono">{c.gradePoint?.toFixed(1) || '—'}</TableCell>
                        <TableCell>
                          {c.attendancePercentage != null
                            ? <span className={c.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-500'}>{c.attendancePercentage}%</span>
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-bold ${c.percentage >= 33 ? 'text-green-600' : 'text-red-600'}`}>
                            {c.percentage >= 33 ? 'PASS' : 'FAIL'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewCard(c)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
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

      {/* ── Report Card View + Print Dialog ── */}
      {viewCard && (
        <Dialog open onOpenChange={() => setViewCard(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Card — {viewCard.student?.fullName}</DialogTitle>
              <DialogDescription>{viewCard.exam?.name} • {viewCard.exam?.examType}</DialogDescription>
            </DialogHeader>
            <div ref={printRef}>
              <PrintableReportCard card={viewCard} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewCard(null)}>Close</Button>
              <Button variant="outline" onClick={downloadReportCardPDF} className="text-red-600 border-red-200 hover:bg-red-50">
                <Download className="mr-2 h-4 w-4" />Download PDF
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />Print Report Card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
