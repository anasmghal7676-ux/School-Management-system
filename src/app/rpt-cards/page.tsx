'use client';

export const dynamic = "force-dynamic"
import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const GRADE_COLORS: Record<string, string> = { 'A+': 'text-emerald-700 bg-emerald-50', A: 'text-green-700 bg-green-50', B: 'text-blue-700 bg-blue-50', C: 'text-amber-700 bg-amber-50', D: 'text-orange-700 bg-orange-50', F: 'text-red-700 bg-red-50' };

function ReportCard({ card, schoolName }: { card: any, schoolName: string }) {
  const s = card.student;
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white px-6 py-4">
        <div className="text-center">
          <h1 className="text-lg font-bold">{schoolName}</h1>
          <p className="text-xs text-blue-200">Progress Report Card</p>
          <p className="text-sm font-semibold mt-1">{card.examName}</p>
        </div>
      </div>

      {/* Student Info */}
      <div className="px-6 py-3 bg-blue-50 border-b grid grid-cols-3 gap-4 text-xs">
        <div><p className="text-muted-foreground">Student Name</p><p className="font-semibold">{s.fullName}</p></div>
        <div><p className="text-muted-foreground">Class</p><p className="font-semibold">{s.class?.name}</p></div>
        <div><p className="text-muted-foreground">Admission #</p><p className="font-semibold">{s.admissionNumber}</p></div>
        <div><p className="text-muted-foreground">Roll #</p><p className="font-semibold">{s.rollNumber || '—'}</p></div>
        <div><p className="text-muted-foreground">Father's Name</p><p className="font-semibold">{s.fatherName || '—'}</p></div>
        <div><p className="text-muted-foreground">Class Rank</p><p className="font-semibold">{card.rank} / {card.totalStudents}</p></div>
      </div>

      {/* Marks Table */}
      <div className="px-6 py-4">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 px-3 py-2 text-left">Subject</th>
              <th className="border border-gray-200 px-2 py-2 text-center">Marks</th>
              <th className="border border-gray-200 px-2 py-2 text-center">Total</th>
              <th className="border border-gray-200 px-2 py-2 text-center">%</th>
              <th className="border border-gray-200 px-2 py-2 text-center">Grade</th>
            </tr>
          </thead>
          <tbody>
            {card.subjects.map((sub: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-200 px-3 py-1.5">{sub.name}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-center font-medium">{sub.marks}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-center text-muted-foreground">{sub.totalMarks}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-center">{sub.percentage}%</td>
                <td className="border border-gray-200 px-2 py-1.5 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${GRADE_COLORS[sub.grade] || 'text-gray-600'}`}>{sub.grade}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50 font-semibold">
              <td className="border border-gray-200 px-3 py-2">Total</td>
              <td className="border border-gray-200 px-2 py-2 text-center">{card.totalObtained}</td>
              <td className="border border-gray-200 px-2 py-2 text-center">{card.totalPossible}</td>
              <td className="border border-gray-200 px-2 py-2 text-center font-bold text-blue-700">{card.overallPct}%</td>
              <td className="border border-gray-200 px-2 py-2 text-center"><span className={`px-2 py-0.5 rounded text-sm font-bold ${GRADE_COLORS[card.overallGrade] || ''}`}>{card.overallGrade}</span></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t bg-gray-50 flex justify-between text-xs text-muted-foreground">
        <div className="text-center"><div className="w-24 h-px bg-gray-400 mb-1" /><p>Class Teacher</p></div>
        <div className="text-center"><div className="w-24 h-px bg-gray-400 mb-1" /><p>Principal</p></div>
        <div className="text-center"><div className="w-24 h-px bg-gray-400 mb-1" /><p>Parent Signature</p></div>
      </div>
    </div>
  );
}

export default function ReportCardBuilderPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [className, setClassName] = useState('');
  const [classId, setClassId] = useState('');
  const [examId, setExamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loadedMeta, setLoadedMeta] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const schoolName = 'School Management System';

  const loadMeta = useCallback(async () => {
    if (loadedMeta) return;
    const res = await fetch('/api/rpt-cards');
    const data = await res.json();
    setClasses(data.classes || []); setExams(data.exams || []); setLoadedMeta(true);
  }, [loadedMeta]);

  const generate = async () => {
    if (!classId || !examId) { toast({ title: 'Select class and exam', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ classId, examId });
      const res = await fetch(`/api/rpt-cards?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCards(data.cards || []); setClassName(data.className || ''); setCurrentIdx(0);
      if (!data.cards?.length) toast({ title: 'No results found for this exam and class', variant: 'destructive' });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const printCurrent = () => {
    if (!printRef.current) return;
    const w = window.open('', '_blank')!;
    w.document.write(`<html><head><title>Report Card</title><style>body{margin:1cm;font-family:Arial,sans-serif}@media print{@page{size:A4;margin:1cm}.no-print{display:none}}</style></head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close(); w.print();
  };

  const printAll = () => {
    const html = cards.map(card => `<div style="page-break-after:always">${document.querySelector('[data-card-content]')?.innerHTML || ''}</div>`).join('');
    // Build all cards
    const container = document.createElement('div');
    cards.forEach((card, i) => {
      const div = document.createElement('div');
      div.style.pageBreakAfter = i < cards.length - 1 ? 'always' : 'auto';
      div.innerHTML = `<p>Card ${i + 1} - ${card.student.fullName}</p>`;
      container.appendChild(div);
    });
    toast({ title: `Printing all ${cards.length} report cards — please use browser print` });
    printCurrent();
  };

  React.useEffect(() => { loadMeta(); }, [loadMeta]);

  const currentCard = cards[currentIdx];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Report Card Builder" description="Generate and print individual student report cards with subject-wise marks and grades" />

      <Card><CardContent className="p-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Class *</label>
            <Select value={classId} onValueChange={setClassId}><SelectTrigger className="w-44"><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Exam *</label>
            <Select value={examId} onValueChange={setExamId}><SelectTrigger className="w-56"><SelectValue placeholder="Select exam" /></SelectTrigger><SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <Button onClick={generate} disabled={loading || !classId || !examId}>{loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}<FileText className="h-4 w-4 mr-2" />Generate Report Cards</Button>
        </div>
      </CardContent></Card>

      {cards.length > 0 && (
        <div className="space-y-4">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium">Student {currentIdx + 1} of {cards.length}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentIdx(i => Math.min(cards.length - 1, i + 1))} disabled={currentIdx === cards.length - 1}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">{className}</Badge>
              <Button variant="outline" size="sm" onClick={printCurrent}><Printer className="h-4 w-4 mr-2" />Print This</Button>
              <Button size="sm" onClick={printAll}><Printer className="h-4 w-4 mr-2" />Print All ({cards.length})</Button>
            </div>
          </div>

          {/* Report Card Preview */}
          {currentCard && (
            <div ref={printRef} className="max-w-2xl mx-auto">
              <ReportCard card={currentCard} schoolName={schoolName} />
            </div>
          )}

          {/* Thumbnail list */}
          <div className="flex gap-2 overflow-x-auto py-2">
            {cards.map((card, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded border transition-all ${currentIdx === i ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30 hover:border-primary'}`}>
                {card.student.fullName.split(' ')[0]} · {card.overallGrade}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && !cards.length && classId && examId && (
        <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>Click Generate to load report cards</p></CardContent></Card>
      )}

      {!classId && (
        <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>Select a class and exam to generate report cards</p></CardContent></Card>
      )}
    </div>
  );
}
