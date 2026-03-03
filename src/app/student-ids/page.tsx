'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Search, RefreshCw, Printer, Download, Filter, QrCode } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { generateIdCardsPDF } from '@/lib/pdf-generator';

export default function StudentIdPortalPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [classFilter, setClass] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [view, setView]         = useState<'grid'|'list'>('grid');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'active', limit: '500' });
      if (classFilter) params.set('classId', classFilter);
      const [sRes, cRes] = await Promise.all([
        fetch(`/api/students?${params}`),
        fetch('/api/classes'),
      ]);
      const [sData, cData] = await Promise.all([sRes.json(), cRes.json()]);
      if (sData.success) setStudents(sData.data || []);
      if (cData.success) setClasses(cData.data || []);
    } catch {} finally { setLoading(false); }
  }, [classFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !search || s.fullName?.toLowerCase().includes(q) || s.admissionNumber?.includes(q);
  });

  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const printCards = (studentList: any[]) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const cards = studentList.map(s => `
      <div class="id-card">
        <div class="school-name">Al-Noor Academy</div>
        <div class="avatar">${s.fullName?.[0] || '?'}</div>
        <div class="name">${s.fullName}</div>
        <div class="admission">${s.admissionNumber}</div>
        <table class="details">
          <tr><td><b>Class:</b></td><td>${s.class?.name || '—'} ${s.section?.name || ''}</td></tr>
          <tr><td><b>DOB:</b></td><td>${s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-PK') : '—'}</td></tr>
          <tr><td><b>Blood:</b></td><td>${s.bloodGroup || '—'}</td></tr>
          <tr><td><b>Contact:</b></td><td>${s.guardianPhone || s.fatherPhone || '—'}</td></tr>
        </table>
        <div class="valid">Valid: 2024-25 Academic Year</div>
      </div>
    `).join('');

    win.document.write(`
      <html><head><title>Student ID Cards</title>
      <style>
        body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#f0f0f0}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .id-card{background:#fff;border:2px solid #1a56db;border-radius:12px;padding:16px;text-align:center;break-inside:avoid;page-break-inside:avoid}
        .school-name{font-size:11px;font-weight:bold;color:#1a56db;background:#e8f0ff;padding:4px 8px;border-radius:20px;margin-bottom:12px}
        .avatar{width:60px;height:60px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;margin:0 auto 8px}
        .name{font-size:15px;font-weight:bold;color:#1e293b;margin-bottom:2px}
        .admission{font-size:11px;color:#64748b;font-family:monospace;margin-bottom:10px}
        .details{width:100%;font-size:11px;text-align:left;border-collapse:collapse}
        .details td{padding:2px 4px;color:#475569}
        .details td:first-child{color:#94a3b8;width:50px}
        .valid{font-size:10px;color:#94a3b8;margin-top:10px;border-top:1px solid #e2e8f0;padding-top:6px}
        @media print{body{background:white;padding:0}.grid{gap:8px}}
      </style></head>
      <body><div class="grid">${cards}</div></body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const downloadIdCardsPDF = () => {
    const toBePrinted = selected.size > 0 ? filtered.filter(s => selected.has(s.id)) : filtered;
    generateIdCardsPDF(toBePrinted);
  };

  const printSelected = () => {
    const toBePrinted = selected.size > 0 ? filtered.filter(s => selected.has(s.id)) : filtered;
    printCards(toBePrinted);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Student ID Portal"
        description="Generate and print student ID cards individually or in bulk"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={downloadIdCardsPDF} className="text-red-600 border-red-200 hover:bg-red-50">
              <Download className="h-4 w-4 mr-2" />PDF Download
            </Button>
            <Button size="sm" onClick={printSelected}>
              <Printer className="h-4 w-4 mr-2" />
              {selected.size > 0 ? `Print ${selected.size} Cards` : `Print All (${filtered.length})`}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 stagger-children">
        {[
          { label: 'Total Students', value: students.length, color: 'border-l-blue-500' },
          { label: 'Filtered', value: filtered.length, color: 'border-l-green-500' },
          { label: 'Selected', value: selected.size, color: 'border-l-amber-500' },
        ].map(({ label, value, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4"><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={classFilter} onValueChange={v => setClass(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {selected.size > 0 && (
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>Clear Selection</Button>
          )}
        </CardContent>
      </Card>

      {/* ID Card Preview Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_,i) => <div key={i} className="h-52 skeleton rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No students found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 stagger-children">
          {filtered.map(s => (
            <div
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`border-2 rounded-xl p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${selected.has(s.id) ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              {selected.has(s.id) && (
                <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
              )}
              <div className="text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-2 py-0.5 mb-2 truncate">Al-Noor Academy</div>
              <div className={`h-12 w-12 rounded-full mx-auto flex items-center justify-center text-xl font-bold text-white mb-2 ${s.gender === 'Female' ? 'bg-gradient-to-br from-pink-400 to-rose-600' : 'bg-gradient-to-br from-blue-400 to-indigo-600'}`}>
                {s.fullName?.[0]}
              </div>
              <p className="font-semibold text-xs leading-tight">{s.fullName}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{s.admissionNumber}</p>
              <Badge variant="outline" className="text-xs mt-1.5">{s.class?.name}</Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs w-full mt-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); printCards([s]); }}
              >
                <Printer className="h-3 w-3 mr-1" />Print
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
