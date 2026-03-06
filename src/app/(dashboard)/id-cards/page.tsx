'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2, IdCard, Printer, Search, ChevronLeft, ChevronRight,
  Users, Download, RefreshCw, Eye, CheckSquare, Square,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CARD_COLORS = [
  { label: 'Blue',   primary: '#1e40af', secondary: '#dbeafe', accent: '#3b82f6' },
  { label: 'Green',  primary: '#166534', secondary: '#dcfce7', accent: '#22c55e' },
  { label: 'Purple', primary: '#5b21b6', secondary: '#ede9fe', accent: '#8b5cf6' },
  { label: 'Red',    primary: '#991b1b', secondary: '#fee2e2', accent: '#ef4444' },
  { label: 'Teal',   primary: '#115e59', secondary: '#ccfbf1', accent: '#14b8a6' },
];

function StudentCard({ student, school, colorScheme }: { student: any; school: any; colorScheme: any }) {
  const initials = student.fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const dob = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <div
      className="w-[3.375in] h-[2.125in] rounded-xl overflow-hidden shadow-lg border flex-shrink-0 relative"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* Header */}
      <div className="h-[0.6in] flex items-center px-3 gap-2" style={{ background: colorScheme.primary }}>
        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
          <span style={{ color: colorScheme.primary, fontSize: '10px', fontWeight: 'bold' }}>
            {(school.school_name || 'School').charAt(0)}
          </span>
        </div>
        <div>
          <div className="text-white font-bold leading-tight" style={{ fontSize: '9px' }}>
            {school.school_name || 'School Name'}
          </div>
          <div className="text-white opacity-80" style={{ fontSize: '7px' }}>
            Student Identity Card
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex h-[1.525in]" style={{ background: colorScheme.secondary }}>
        {/* Photo */}
        <div className="flex flex-col items-center justify-center px-2" style={{ width: '0.85in', background: colorScheme.secondary }}>
          {student.photo ? (
            <img src={student.photo} alt={student.fullName} className="w-14 h-14 rounded-lg object-cover border-2" style={{ borderColor: colorScheme.accent }} />
          ) : (
            <div className="w-14 h-14 rounded-lg flex items-center justify-center border-2 text-white font-bold text-lg" style={{ background: colorScheme.accent, borderColor: colorScheme.primary }}>
              {initials}
            </div>
          )}
          <div className="mt-1 text-center" style={{ fontSize: '7px', color: colorScheme.primary, fontWeight: 'bold' }}>
            {student.currentClass?.name} {student.currentSection ? `- ${student.currentSection.name}` : ''}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 py-2 pr-2 flex flex-col justify-center space-y-0.5">
          <div className="font-bold" style={{ fontSize: '9.5px', color: colorScheme.primary, lineHeight: '1.2' }}>{student.fullName}</div>
          <div style={{ fontSize: '7px', color: '#374151' }}>S/D/O: {student.fatherName}</div>
          {[
            { label: 'Adm No', value: student.admissionNumber },
            { label: 'Roll No', value: student.rollNumber },
            { label: 'DOB',     value: dob },
            { label: 'Blood',   value: student.bloodGroup },
          ].filter(f => f.value).map(({ label, value }) => (
            <div key={label} className="flex gap-1" style={{ fontSize: '7px' }}>
              <span className="font-semibold" style={{ color: colorScheme.primary, width: '38px', flexShrink: 0 }}>{label}:</span>
              <span style={{ color: '#374151' }}>{value}</span>
            </div>
          ))}
          <div className="flex gap-1" style={{ fontSize: '7px' }}>
            <span className="font-semibold" style={{ color: colorScheme.primary, width: '38px', flexShrink: 0 }}>Phone:</span>
            <span style={{ color: '#374151' }}>{student.fatherPhone || student.emergencyPhone || '—'}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-[0.25in] flex items-center justify-between px-3" style={{ background: colorScheme.primary, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <span className="text-white opacity-80" style={{ fontSize: '6px' }}>{school.school_phone || ''}</span>
        <span className="text-white font-mono font-bold" style={{ fontSize: '7px', letterSpacing: '1px' }}>{student.admissionNumber}</span>
        <span className="text-white opacity-80" style={{ fontSize: '6px' }}>{student.address?.city || ''}</span>
      </div>
    </div>
  );
}

export default function IDCardsPage() {
  const [data, setData]         = useState<any>(null);
  const [classes, setClasses]   = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [colorIdx, setColorIdx] = useState(0);

  const [classId, setClassId]     = useState('');
  const [sectionId, setSectionId] = useState('');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const printRef                  = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchCards(); }, [classId, sectionId, page]);
  useEffect(() => { if (classId) fetchSections(classId); else setSections([]); }, [classId]);

  const fetchMeta = async () => {
    const r = await fetch('/api/classes?limit=50');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchSections = async (cid: string) => {
    const r = await fetch(`/api/sections?classId=${cid}&limit=20`);
    const j = await r.json();
    if (j.success) setSections(j.data?.sections || j.data || []);
  };

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24' });
      if (classId)   params.set('classId', classId);
      if (sectionId) params.set('sectionId', sectionId);
      if (search)    params.set('search', search);
      const r = await fetch(`/api/id-cards?${params}`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally { setLoading(false); }
  }, [classId, sectionId, search, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCards();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const students = data?.students || [];
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map((s: any) => s.id)));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast({ title: 'Pop-up blocked. Please allow pop-ups for printing.', variant: 'destructive' }); return; }

    const students = (data?.students || []).filter((s: any) => selected.size === 0 || selected.has(s.id));
    const school   = data?.school || {};
    const color    = CARD_COLORS[colorIdx];

    const cardsHtml = students.map((s: any) => {
      const initials = s.fullName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
      const dob = s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-PK') : '';
      return `
        <div style="width:3.375in;height:2.125in;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:1px solid #e5e7eb;display:inline-flex;flex-direction:column;margin:0.1in;break-inside:avoid;flex-shrink:0;position:relative;font-family:Arial,sans-serif;">
          <div style="height:0.6in;display:flex;align-items:center;padding:0 10px;gap:8px;background:${color.primary};">
            <div style="width:24px;height:24px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;font-weight:bold;color:${color.primary};">${(school.school_name || 'S').charAt(0)}</div>
            <div><div style="color:white;font-weight:bold;font-size:9px;line-height:1.2;">${school.school_name || 'School Name'}</div><div style="color:rgba(255,255,255,0.8);font-size:7px;">Student Identity Card</div></div>
          </div>
          <div style="display:flex;height:1.275in;background:${color.secondary};">
            <div style="width:0.85in;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;">
              <div style="width:52px;height:52px;border-radius:8px;background:${color.accent};border:2px solid ${color.primary};display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:16px;">${initials}</div>
              <div style="margin-top:4px;text-align:center;font-size:7px;color:${color.primary};font-weight:bold;">${s.currentClass?.name || ''} ${s.currentSection?.name || ''}</div>
            </div>
            <div style="flex:1;padding:6px 6px 6px 0;display:flex;flex-direction:column;justify-content:center;gap:2px;">
              <div style="font-weight:bold;font-size:9.5px;color:${color.primary};line-height:1.2;">${s.fullName}</div>
              <div style="font-size:7px;color:#374151;">S/D/O: ${s.fatherName}</div>
              ${[['Adm No', s.admissionNumber],['Roll No',s.rollNumber],['DOB',dob],['Blood',s.bloodGroup]].filter(([,v])=>v).map(([l,v])=>`<div style="display:flex;gap:4px;font-size:7px;"><span style="font-weight:bold;color:${color.primary};width:38px;flex-shrink:0;">${l}:</span><span style="color:#374151;">${v}</span></div>`).join('')}
              <div style="display:flex;gap:4px;font-size:7px;"><span style="font-weight:bold;color:${color.primary};width:38px;flex-shrink:0;">Phone:</span><span style="color:#374151;">${s.fatherPhone || s.emergencyPhone || '—'}</span></div>
            </div>
          </div>
          <div style="height:0.25in;display:flex;align-items:center;justify-content:space-between;padding:0 10px;background:${color.primary};position:absolute;bottom:0;left:0;right:0;">
            <span style="color:rgba(255,255,255,0.7);font-size:6px;">${school.school_phone || ''}</span>
            <span style="color:white;font-family:monospace;font-weight:bold;font-size:7px;letter-spacing:1px;">${s.admissionNumber}</span>
            <span style="color:rgba(255,255,255,0.7);font-size:6px;">${s.address?.city || ''}</span>
          </div>
        </div>`;
    }).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Student ID Cards</title><style>
      @page { size: A4; margin: 0.3in; }
      body { margin: 0; display: flex; flex-wrap: wrap; justify-content: flex-start; }
      @media print { button { display: none; } }
    </style></head><body>${cardsHtml}<script>window.onload=function(){window.print();}</script></body></html>`);
    printWindow.document.close();
    toast({ title: `Printing ${students.length} ID card(s)` });
  };

  const students   = data?.students || [];
  const school     = data?.school   || {};
  const totalPages = data?.pagination?.totalPages || 1;
  const color      = CARD_COLORS[colorIdx];
  const allSelected = selected.size === students.length && students.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <IdCard className="h-7 w-7" />Student ID Cards
            </h1>
            <p className="text-muted-foreground">Generate and print student identity cards</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} disabled={students.length === 0} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="mr-2 h-4 w-4" />
              Print {selected.size > 0 ? `${selected.size} Selected` : 'All Visible'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <Label className="text-xs mb-1 block">Class</Label>
                <Select value={classId || 'all'} onValueChange={v => { setClassId(v === 'all' ? '' : v); setSectionId(''); setPage(1); }}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {sections.length > 0 && (
                <div>
                  <Label className="text-xs mb-1 block">Section</Label>
                  <Select value={sectionId || 'all'} onValueChange={v => { setSectionId(v === 'all' ? '' : v); setPage(1); }}>
                    <SelectTrigger className="w-32"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div>
                  <Label className="text-xs mb-1 block">Search</Label>
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, roll no, adm no..." className="w-52" />
                </div>
                <Button type="submit" variant="outline" className="self-end"><Search className="h-4 w-4" /></Button>
              </form>
              <div>
                <Label className="text-xs mb-1 block">Card Color</Label>
                <div className="flex gap-1.5">
                  {CARD_COLORS.map((c, i) => (
                    <button
                      key={c.label}
                      onClick={() => setColorIdx(i)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${colorIdx === i ? 'scale-125 border-gray-600' : 'border-transparent'}`}
                      style={{ background: c.primary }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" className="self-end" onClick={() => fetchCards()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats + Select All */}
        {students.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{data?.pagination?.total || students.length} students found</span>
              {selected.size > 0 && <Badge>{selected.size} selected</Badge>}
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {allSelected ? <Square className="mr-2 h-4 w-4" /> : <CheckSquare className="mr-2 h-4 w-4" />}
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        )}

        {/* Card Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>
        ) : students.length === 0 ? (
          <Card className="bg-muted/20">
            <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
              <IdCard className="h-16 w-16 mb-4 opacity-20" />
              <p className="font-semibold text-lg">No students found</p>
              <p className="text-sm mt-1">Select a class or search to find students</p>
            </CardContent>
          </Card>
        ) : (
          <div ref={printRef} className="flex flex-wrap gap-4">
            {students.map((student: any) => (
              <div
                key={student.id}
                onClick={() => toggleSelect(student.id)}
                className={`cursor-pointer transition-all ${selected.has(student.id) ? 'ring-4 ring-primary ring-offset-2 rounded-xl' : 'hover:scale-[1.02]'}`}
              >
                <StudentCard student={student} school={school} colorScheme={color} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
