'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Loader2, ClipboardList, Save, RefreshCw, ChevronLeft, ChevronRight,
  Plus, X, Download, Users, Calendar, CheckCircle2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DUTY_COLORS: Record<string, string> = {
  'Gate Duty':       'bg-blue-100 text-blue-700 border-blue-200',
  'Canteen Duty':    'bg-orange-100 text-orange-700 border-orange-200',
  'Library Duty':    'bg-purple-100 text-purple-700 border-purple-200',
  'Exam Duty':       'bg-red-100 text-red-700 border-red-200',
  'Assembly':        'bg-green-100 text-green-700 border-green-200',
  'Morning Assembly':'bg-teal-100 text-teal-700 border-teal-200',
  'Break Duty':      'bg-amber-100 text-amber-700 border-amber-200',
  'After School':    'bg-indigo-100 text-indigo-700 border-indigo-200',
};

// Get Monday of a week containing a given date
function weekStart(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
}

type Assignment = { staffId: string; staffName: string; dutyType: string };
type Roster     = Record<string, Record<string, Assignment[]>>; // { day: { period: Assignment[] } }

const DUTY_PERIODS = ['Morning (7–8 AM)', 'Break 1 (10–10:30)', 'Lunch (12–1 PM)', 'Break 2 (2–2:30)', 'After School (3–4)'];

export default function DutyRosterPage() {
  const [staff,       setStaff]       = useState<any[]>([]);
  const [dutyTypes,   setDutyTypes]   = useState<string[]>([]);
  const [week,        setWeek]        = useState(() => weekStart(new Date().toISOString().slice(0, 10)));
  const [roster,      setRoster]      = useState<Roster>({});
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [assignOpen,  setAssignOpen]  = useState(false);
  const [assignCell,  setAssignCell]  = useState<{ day: string; period: string } | null>(null);
  const [selStaff,    setSelStaff]    = useState('');
  const [selDuty,     setSelDuty]     = useState('');
  const [viewMode,    setViewMode]    = useState<'grid' | 'list'>('grid');
  const [searchStaff, setSearchStaff] = useState('');

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { loadRoster(); }, [week]);

  const fetchMeta = async () => {
    const r = await fetch('/api/duty-roster');
    const j = await r.json();
    if (j.success) {
      setStaff(j.data.staff || []);
      setDutyTypes(j.data.dutyTypes || []);
    }
  };

  const loadRoster = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/duty-roster', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week }),
      });
      const j = await r.json();
      if (j.success) setRoster(j.data.assignments || {});
    } finally { setLoading(false); }
  };

  const saveRoster = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/duty-roster', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week, assignments: roster }),
      });
      const j = await r.json();
      if (j.success) toast({ title: 'Duty roster saved', description: `Week of ${fmtShort(week)}` });
      else toast({ title: 'Save failed', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const prevWeek = () => setWeek(w => addDays(w, -7));
  const nextWeek = () => setWeek(w => addDays(w, 7));
  const goToday  = () => setWeek(weekStart(new Date().toISOString().slice(0, 10)));

  const openAssign = (day: string, period: string) => {
    setAssignCell({ day, period });
    setSelStaff('');
    setSelDuty(dutyTypes[0] || '');
    setAssignOpen(true);
  };

  const addAssignment = () => {
    if (!assignCell || !selStaff || !selDuty) {
      toast({ title: 'Select staff member and duty type', variant: 'destructive' }); return;
    }
    const staffMember = staff.find(s => s.id === selStaff);
    if (!staffMember) return;

    setRoster(r => {
      const updated = { ...r };
      if (!updated[assignCell.day]) updated[assignCell.day] = {};
      if (!updated[assignCell.day][assignCell.period]) updated[assignCell.day][assignCell.period] = [];
      // Don't duplicate
      const already = updated[assignCell.day][assignCell.period].find(a => a.staffId === selStaff && a.dutyType === selDuty);
      if (!already) {
        updated[assignCell.day][assignCell.period] = [
          ...updated[assignCell.day][assignCell.period],
          { staffId: staffMember.id, staffName: staffMember.fullName, dutyType: selDuty },
        ];
      }
      return updated;
    });
    setAssignOpen(false);
    toast({ title: `${staffMember.fullName} assigned`, description: `${selDuty} — ${assignCell.day}` });
  };

  const removeAssignment = (day: string, period: string, staffId: string, dutyType: string) => {
    setRoster(r => {
      const updated = { ...r };
      if (updated[day]?.[period]) {
        updated[day][period] = updated[day][period].filter(a => !(a.staffId === staffId && a.dutyType === dutyType));
      }
      return updated;
    });
  };

  const totalAssignments = Object.values(roster).reduce((sum, day) =>
    sum + Object.values(day).reduce((s, p) => s + p.length, 0), 0
  );

  // Staff-centric view: per staff, show their duties
  const staffDuties = staff.map(s => {
    const duties: { day: string; period: string; dutyType: string }[] = [];
    DAYS.forEach(day => {
      DUTY_PERIODS.forEach(period => {
        (roster[day]?.[period] || []).forEach(a => {
          if (a.staffId === s.id) duties.push({ day, period, dutyType: a.dutyType });
        });
      });
    });
    return { ...s, duties };
  }).filter(s => s.duties.length > 0 || !searchStaff || s.fullName.toLowerCase().includes(searchStaff.toLowerCase()));

  const exportCSV = () => {
    const rows = [['Day', 'Period', 'Staff Member', 'Duty Type']];
    DAYS.forEach(day => {
      DUTY_PERIODS.forEach(period => {
        (roster[day]?.[period] || []).forEach(a => {
          rows.push([day, period, a.staffName, a.dutyType]);
        });
      });
    });
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `duty-roster-${week}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50"><ClipboardList className="h-6 w-6 text-indigo-600" /></span>
              Duty Roster
            </h1>
            <p className="text-muted-foreground mt-0.5">Weekly staff duty scheduling</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />Export
            </Button>
            <Button onClick={saveRoster} disabled={saving} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Roster
            </Button>
          </div>
        </div>

        {/* Week nav + summary */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="text-center min-w-52">
              <div className="font-semibold">{fmtShort(week)} — {fmtShort(addDays(week, 5))}</div>
              <div className="text-xs text-muted-foreground">Week of {week}</div>
            </div>
            <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={goToday}>Today</Button>
          </div>
          <div className="flex gap-3 ml-auto">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totalAssignments}</span> duty assignments this week
            </div>
            <div className="flex gap-1">
              {(['grid', 'list'] as const).map(v => (
                <Button key={v} variant={viewMode === v ? 'default' : 'outline'} size="sm" onClick={() => setViewMode(v)}>
                  {v === 'grid' ? 'Grid' : 'By Staff'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
        ) : viewMode === 'grid' ? (

          /* ── GRID VIEW ─────────────────────────────────────────────────── */
          <Card className="overflow-x-auto">
            <CardContent className="p-0">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-40">Period / Day</th>
                    {DAYS.map((day, i) => (
                      <th key={day} className="px-3 py-3 text-center font-semibold text-sm">
                        <div>{day}</div>
                        <div className="text-xs font-normal text-muted-foreground">{fmtShort(addDays(week, i))}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DUTY_PERIODS.map(period => (
                    <tr key={period} className="border-b last:border-b-0 hover:bg-muted/10">
                      <td className="px-4 py-3 text-xs font-semibold text-muted-foreground align-top whitespace-nowrap">
                        {period}
                      </td>
                      {DAYS.map(day => {
                        const assignments = roster[day]?.[period] || [];
                        return (
                          <td key={day} className="px-2 py-2 align-top min-w-[130px]">
                            <div className="space-y-1">
                              {assignments.map(a => (
                                <div key={`${a.staffId}-${a.dutyType}`}
                                  className={`text-[11px] font-medium px-2 py-1 rounded-lg border flex items-center justify-between gap-1 ${DUTY_COLORS[a.dutyType] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                  <div className="min-w-0">
                                    <div className="truncate">{a.staffName.split(' ')[0]}</div>
                                    <div className="opacity-70">{a.dutyType}</div>
                                  </div>
                                  <button onClick={() => removeAssignment(day, period, a.staffId, a.dutyType)}
                                    className="flex-shrink-0 hover:opacity-70 ml-0.5">
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              <button onClick={() => openAssign(day, period)}
                                className="w-full text-xs text-muted-foreground hover:text-primary border border-dashed rounded-lg py-1 px-2 hover:border-primary transition-colors flex items-center justify-center gap-1">
                                <Plus className="h-3 w-3" />Assign
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

        ) : (

          /* ── BY STAFF VIEW ─────────────────────────────────────────────── */
          <div className="space-y-3">
            <Input placeholder="Search staff…" value={searchStaff} onChange={e => setSearchStaff(e.target.value)} className="max-w-72" />
            {staffDuties.filter(s => s.duties.length > 0 && (!searchStaff || s.fullName.toLowerCase().includes(searchStaff.toLowerCase()))).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No duty assignments yet</CardContent></Card>
            ) : staffDuties
              .filter(s => s.duties.length > 0 && (!searchStaff || s.fullName.toLowerCase().includes(searchStaff.toLowerCase())))
              .map(s => (
                <Card key={s.id}>
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {s.fullName.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{s.fullName}</CardTitle>
                        <CardDescription>{s.designation} · {s.department?.name}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-auto">{s.duties.length} duties</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 px-4">
                    <div className="flex flex-wrap gap-2">
                      {s.duties.map((d, i) => (
                        <div key={i} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${DUTY_COLORS[d.dutyType] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {d.day} · {d.period.split('(')[0].trim()} · {d.dutyType}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Duty legend */}
        <Card>
          <CardHeader className="py-3 pb-0"><CardTitle className="text-sm">Duty Type Legend</CardTitle></CardHeader>
          <CardContent className="pt-2 pb-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(DUTY_COLORS).map(([type, cls]) => (
                <span key={type} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}>{type}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Assign dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Duty</DialogTitle>
            <DialogDescription>
              {assignCell?.day} — {assignCell?.period}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Staff Member *</Label>
              <Select value={selStaff} onValueChange={setSelStaff}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff…" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.fullName} <span className="text-muted-foreground text-xs">({s.designation})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duty Type *</Label>
              <Select value={selDuty} onValueChange={setSelDuty}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dutyTypes.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={addAssignment} className="gap-2">
              <Plus className="h-4 w-4" />Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
