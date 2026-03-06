'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Users, DollarSign, BookOpen, Calendar, AlertTriangle, TrendingUp, CheckCircle2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmt = (n: number) => `PKR ${Math.round(n).toLocaleString()}`;
const pctColor = (p: number) => p >= 90 ? 'text-green-700' : p >= 75 ? 'text-amber-600' : 'text-red-600';
const pctBar = (p: number) => p >= 90 ? 'bg-green-500' : p >= 75 ? 'bg-amber-500' : 'bg-red-500';

function MetricCard({ icon, label, value, sub, color }: any) {
  return (
    <Card className={`border-l-4 ${color}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">{icon}<span className="text-2xl font-bold">{value}</span></div>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function AttBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className={`font-bold ${pctColor(pct)}`}>{pct}%</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${pctBar(pct)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function MonthlySummaryPage() {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mon-summary?year=${year}&month=${month}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData(d);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [year, month]);

  const years = [String(now.getFullYear()), String(now.getFullYear() - 1), String(now.getFullYear() - 2)];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Monthly School Summary" description="Auto-generated monthly digest of key school performance indicators"
        actions={
          <div className="flex gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center h-60 items-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Generating summary...</p>
          </div>
        </div>
      ) : !data ? null : (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{data.period}</h2>
                <p className="text-blue-200 mt-1">Monthly Performance Report</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{data.enrollment.total}</p>
                <p className="text-blue-200 text-sm">Active Students</p>
              </div>
            </div>
          </div>

          {/* Top KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={<Users className="h-5 w-5 text-blue-500" />} label="Active Students" value={data.enrollment.total} sub={data.enrollment.newAdmissions > 0 ? `+${data.enrollment.newAdmissions} new this month` : 'No new admissions'} color="border-l-blue-500" />
            <MetricCard icon={<Users className="h-5 w-5 text-purple-500" />} label="Active Staff" value={data.staffing.total} sub={`${data.staffing.leavesApproved} leaves approved`} color="border-l-purple-500" />
            <MetricCard icon={<DollarSign className="h-5 w-5 text-green-500" />} label="Fee Collected" value={fmt(data.finance.collected)} sub="This month" color="border-l-green-500" />
            <MetricCard icon={<AlertTriangle className="h-5 w-5 text-red-500" />} label="Fee Pending" value={fmt(data.finance.pending)} sub={`${data.operations.feeDefaulters} defaulters`} color="border-l-red-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Attendance */}
            <Card className="md:col-span-2">
              <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Attendance This Month</CardTitle></CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-medium">Students</p>
                  <AttBar label="Attendance Rate" pct={data.attendance.student.pct} />
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                    <div className="bg-green-50 rounded p-2"><p className="font-bold text-green-700 text-lg">{data.attendance.student.present}</p><p className="text-muted-foreground">Present</p></div>
                    <div className="bg-red-50 rounded p-2"><p className="font-bold text-red-700 text-lg">{data.attendance.student.absent}</p><p className="text-muted-foreground">Absent</p></div>
                    <div className="bg-amber-50 rounded p-2"><p className="font-bold text-amber-700 text-lg">{data.attendance.student.late}</p><p className="text-muted-foreground">Late</p></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 font-medium">Staff</p>
                  <AttBar label="Staff Attendance Rate" pct={data.attendance.staff.pct} />
                  <div className="grid grid-cols-2 gap-2 mt-2 text-center text-xs">
                    <div className="bg-green-50 rounded p-2"><p className="font-bold text-green-700 text-lg">{data.attendance.staff.present}</p><p className="text-muted-foreground">Present Days</p></div>
                    <div className="bg-red-50 rounded p-2"><p className="font-bold text-red-700 text-lg">{data.attendance.staff.absent}</p><p className="text-muted-foreground">Absent Days</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academics & Ops */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" />Academics</CardTitle></CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Homework Assigned</span>
                      <span className="font-bold text-lg">{data.academics.homeworkAssigned}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Exams Conducted</span>
                      <span className="font-bold text-lg">{data.academics.examsHeld}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Operations</CardTitle></CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Incidents Reported</span>
                      <span className={`font-bold text-lg ${data.operations.incidents > 0 ? 'text-red-600' : 'text-green-600'}`}>{data.operations.incidents}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fee Defaulters</span>
                      <span className={`font-bold text-lg ${data.operations.feeDefaulters > 0 ? 'text-red-600' : 'text-green-600'}`}>{data.operations.feeDefaulters}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Staff Leaves</span>
                      <span className="font-bold text-lg">{data.staffing.leavesApproved}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Financial Summary Bar */}
          <Card>
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" />Fee Collection Summary</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Collection Rate</span>
                  <span className={`font-bold ${pctColor(data.finance.collected + data.finance.pending > 0 ? Math.round((data.finance.collected / (data.finance.collected + data.finance.pending)) * 100) : 0)}`}>
                    {data.finance.collected + data.finance.pending > 0 ? Math.round((data.finance.collected / (data.finance.collected + data.finance.pending)) * 100) : 0}%
                  </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                  {data.finance.collected + data.finance.pending > 0 && (
                    <div className="h-full bg-green-500 rounded-l-full transition-all" style={{ width: `${Math.round((data.finance.collected / (data.finance.collected + data.finance.pending)) * 100)}%` }} />
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="text-green-700 font-medium">Collected: {fmt(data.finance.collected)}</span>
                  <span className="text-red-600 font-medium">Pending: {fmt(data.finance.pending)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Student Attendance', ok: data.attendance.student.pct >= 80 },
              { label: 'Staff Attendance', ok: data.attendance.staff.pct >= 85 },
              { label: 'Fee Collection', ok: data.finance.pending < data.finance.collected },
              { label: 'No Incidents', ok: data.operations.incidents === 0 },
            ].map(item => (
              <div key={item.label} className={`flex items-center gap-2 p-3 rounded-lg border ${item.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {item.ok ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" /> : <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
