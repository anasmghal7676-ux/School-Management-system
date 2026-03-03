'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Users, CalendarCheck, RefreshCw, Save,
  CheckCircle2, XCircle, Clock, Minus, ChevronLeft, ChevronRight,
  AlertCircle, Download,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const STATUS_CONFIG = {
  Present:  { label: 'Present',  color: 'bg-green-500 hover:bg-green-600',  text: 'text-green-600', badge: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  Absent:   { label: 'Absent',   color: 'bg-red-500 hover:bg-red-600',      text: 'text-red-600',   badge: 'bg-red-100 text-red-700',     icon: XCircle },
  Late:     { label: 'Late',     color: 'bg-amber-500 hover:bg-amber-600',  text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', icon: Clock },
  'Half-day':{ label: 'Half-day',color: 'bg-blue-500 hover:bg-blue-600',   text: 'text-blue-600',  badge: 'bg-blue-100 text-blue-700',   icon: Minus },
  Leave:    { label: 'Leave',    color: 'bg-purple-500 hover:bg-purple-600',text: 'text-purple-600',badge: 'bg-purple-100 text-purple-700',icon: AlertCircle },
};

type Status = keyof typeof STATUS_CONFIG;
const STATUSES: Status[] = ['Present', 'Absent', 'Late', 'Half-day', 'Leave'];

const today = () => new Date().toISOString().slice(0, 10);

export default function StaffAttendancePage() {
  const [staff, setStaff]         = useState<any[]>([]);
  const [departments, setDepts]   = useState<any[]>([]);
  const [date, setDate]           = useState(today());
  const [deptFilter, setDeptFilter] = useState('all');
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [remarks, setRemarks]     = useState<Record<string, string>>({});
  const [existing, setExisting]   = useState<Record<string, any>>({});
  const [dirty, setDirty]         = useState(false);

  useEffect(() => { fetchStaffAndDepts(); }, []);
  useEffect(() => { if (staff.length) fetchAttendance(); }, [date, deptFilter, staff]);

  const fetchStaffAndDepts = async () => {
    setLoading(true);
    try {
      const [sr, dr] = await Promise.all([
        fetch('/api/staff?limit=200&status=active').then(r => r.json()),
        fetch('/api/departments').then(r => r.json()),
      ]);
      if (sr.success) setStaff(sr.data?.staff || sr.data || []);
      if (dr.success) setDepts(dr.data?.departments || []);
    } finally { setLoading(false); }
  };

  const fetchAttendance = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/staff-att?date=${date}`);
      const j = await r.json();
      if (j.success) {
        const records: Record<string, any> = {};
        const att: Record<string, Status> = {};
        const rem: Record<string, string> = {};
        for (const rec of (j.data || [])) {
          records[rec.staffId] = rec;
          att[rec.staffId]     = rec.status as Status;
          rem[rec.staffId]     = rec.remarks || '';
        }
        setExisting(records);
        setAttendance(att);
        setRemarks(rem);
        setDirty(false);
      }
    } finally { setLoading(false); }
  }, [date]);

  const filteredStaff = staff.filter(s => {
    if (deptFilter !== 'all' && s.departmentId !== deptFilter) return false;
    return true;
  });

  const setStatus = (staffId: string, status: Status) => {
    setAttendance(a => ({ ...a, [staffId]: status }));
    setDirty(true);
  };

  const markAll = (status: Status) => {
    const upd: Record<string, Status> = {};
    filteredStaff.forEach(s => { upd[s.id] = status; });
    setAttendance(a => ({ ...a, ...upd }));
    setDirty(true);
  };

  const handleSave = async () => {
    const staffToSave = filteredStaff.filter(s => attendance[s.id]);
    if (!staffToSave.length) { toast({ title: 'Mark attendance before saving', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      let created = 0, updated = 0;
      for (const s of staffToSave) {
        const status = attendance[s.id];
        if (!status) continue;
        const body = { staffId: s.id, date, status, remarks: remarks[s.id] || '' };
        const existId = existing[s.id]?.id;
        if (existId) {
          await fetch(`/api/staff-att/${existId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          updated++;
        } else {
          await fetch('/api/staff-att', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          created++;
        }
      }
      toast({ title: `Saved — ${created} new, ${updated} updated` });
      setDirty(false);
      fetchAttendance();
    } finally { setSaving(false); }
  };

  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  const exportCSV = () => {
    const rows = [['Name', 'Employee Code', 'Department', 'Status', 'Remarks']];
    filteredStaff.forEach(s => {
      rows.push([
        `${s.firstName} ${s.lastName}`, s.employeeCode || '',
        s.department?.name || '', attendance[s.id] || 'Not marked', remarks[s.id] || '',
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `staff_attendance_${date}.csv`;
    a.click();
  };

  // Summary counts
  const counts: Record<string, number> = {};
  STATUSES.forEach(s => { counts[s] = 0; });
  let notMarked = 0;
  filteredStaff.forEach(s => {
    if (attendance[s.id]) counts[attendance[s.id]] = (counts[attendance[s.id]] || 0) + 1;
    else notMarked++;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-7 w-7" />Staff Attendance
            </h1>
            <p className="text-muted-foreground">Mark daily attendance for all teaching and admin staff</p>
          </div>
          <div className="flex gap-2">
            {dirty && <Badge className="bg-amber-100 text-amber-700">Unsaved</Badge>}
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" />Export
            </Button>
            <Button onClick={handleSave} disabled={saving || !dirty}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Attendance
            </Button>
          </div>
        </div>

        {/* Date + Filters */}
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => shiftDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => shiftDate(1)} disabled={date >= today()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {date !== today() && (
              <Button variant="ghost" size="sm" onClick={() => setDate(today())}>Today</Button>
            )}
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAttendance} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Status summary bar */}
        <div className="flex gap-3 flex-wrap">
          {STATUSES.map(s => {
            const { badge, icon: Icon } = STATUS_CONFIG[s];
            return (
              <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${badge} cursor-pointer hover:opacity-80`}
                onClick={() => markAll(s)} title={`Mark all as ${s}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">{s}: {counts[s] || 0}</span>
              </div>
            );
          })}
          {notMarked > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-gray-100 text-gray-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Not marked: {notMarked}</span>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => markAll('Present')}>Mark All Present</Button>
          </div>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : filteredStaff.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-30" />
                <p className="font-medium">No staff found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((s: any, idx: number) => {
                    const status = attendance[s.id];
                    const statusCfg = status ? STATUS_CONFIG[status] : null;
                    return (
                      <TableRow key={s.id} className={!status ? 'bg-muted/20' : ''}>
                        <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                              {s.firstName[0]}{s.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-muted-foreground">{s.employeeCode} · {s.designation}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.department?.name || '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {STATUSES.map(st => {
                              const cfg = STATUS_CONFIG[st];
                              const active = status === st;
                              return (
                                <button
                                  key={st}
                                  onClick={() => setStatus(s.id, st)}
                                  className={`text-xs px-2 py-1 rounded-md font-semibold transition-all border ${
                                    active
                                      ? `${cfg.color} text-white border-transparent`
                                      : 'border-border text-muted-foreground hover:bg-muted/50'
                                  }`}
                                >
                                  {cfg.label}
                                </button>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-7 text-xs w-36"
                            placeholder="Optional note..."
                            value={remarks[s.id] || ''}
                            onChange={e => {
                              setRemarks(r => ({ ...r, [s.id]: e.target.value }));
                              setDirty(true);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Save footer */}
        {filteredStaff.length > 0 && (
          <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              {filteredStaff.length} staff · {Object.values(counts).reduce((a, b) => a + b, 0)} marked · {notMarked} pending
            </p>
            <Button onClick={handleSave} disabled={saving || !dirty}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Attendance
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
