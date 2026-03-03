'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Loader2, Download, RefreshCw, Users, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateAttendanceReport } from '@/lib/pdf-generator';
import PageHeader from '@/components/page-header';

const STATUS_COLORS = { Present: '#22c55e', Absent: '#ef4444', Late: '#f59e0b', Leave: '#6366f1', 'Half-day': '#94a3b8' };
const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6366f1', '#94a3b8'];

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
const pct = (a: number, b: number) => b ? Math.round((a / b) * 100) : 0;

function AttBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Present: 'bg-green-100 text-green-700',
    Absent: 'bg-red-100 text-red-700',
    Late: 'bg-amber-100 text-amber-700',
    Leave: 'bg-indigo-100 text-indigo-700',
    'Half-day': 'bg-slate-100 text-slate-600',
  };
  return <Badge className={`text-xs ${colors[status] || ''}`}>{status}</Badge>;
}

export default function AttendanceReportsPage() {
  const [type, setType] = useState<'student' | 'staff'>('student');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [overall, setOverall] = useState({ total: 0, present: 0, absent: 0, late: 0, leave: 0, halfDay: 0 });
  const [daily, setDaily] = useState<any[]>([]);
  const [byClass, setByClass] = useState<any[]>([]);
  const [byStaff, setByStaff] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type, fromDate, toDate, classId: classFilter });
      const res = await fetch(`/api/att-reports?${params}`);
      const data = await res.json();
      setOverall(data.overall || { total: 0, present: 0, absent: 0, late: 0, leave: 0, halfDay: 0 });
      setDaily(data.daily || []);
      setByClass(data.byClass || []);
      setByStaff(data.byStaff || []);
      if (data.classes) setClasses(data.classes);
    } catch {
      toast({ title: 'Error', description: 'Failed to load attendance data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [type, fromDate, toDate, classFilter]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const rows = type === 'student'
      ? [['Date', 'Total', 'Present', 'Absent', 'Late', 'Leave', 'Attendance %'],
         ...daily.map((d: any) => [d.date, d.total, d.present, d.absent, d.late, d.leave, pct(d.present, d.total) + '%'])]
      : [['Date', 'Total', 'Present', 'Absent', 'Late'],
         ...daily.map((d: any) => [d.date, d.total, d.present, d.absent, d.late])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `attendance-report-${fromDate}-to-${toDate}.csv`; a.click();
  };

  const pieData = [
    { name: 'Present', value: overall.present },
    { name: 'Absent', value: overall.absent },
    { name: 'Late', value: overall.late },
    { name: 'Leave', value: overall.leave || 0 },
    { name: 'Half-day', value: (overall as any).halfDay || 0 },
  ].filter(d => d.value > 0);

  const presentPct = pct(overall.present, overall.total);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Attendance Reports"
        description="Analyze student and staff attendance patterns with charts"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => window.print()}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
          </div>
        }
      />

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setType('student')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${type === 'student' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              >
                Student Attendance
              </button>
              <button
                onClick={() => setType('staff')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${type === 'staff' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              >
                Staff Attendance
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">From</span>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-36" />
              <span className="text-sm text-muted-foreground">To</span>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-36" />
            </div>
            {type === 'student' && (
              <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading attendance data...</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Records', value: overall.total, color: 'border-l-slate-500', icon: <Users className="h-4 w-4 text-slate-500" /> },
              { label: 'Present', value: overall.present, color: 'border-l-green-500', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
              { label: 'Absent', value: overall.absent, color: 'border-l-red-500', icon: <XCircle className="h-4 w-4 text-red-500" /> },
              { label: 'Late', value: overall.late, color: 'border-l-amber-500', icon: <Clock className="h-4 w-4 text-amber-500" /> },
              { label: 'Attendance Rate', value: `${presentPct}%`, color: presentPct >= 90 ? 'border-l-green-500' : presentPct >= 75 ? 'border-l-amber-500' : 'border-l-red-500', icon: <TrendingUp className="h-4 w-4 text-indigo-500" /> },
            ].map(c => (
              <Card key={c.label} className={`border-l-4 ${c.color}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">{c.icon}<span className="text-xl font-bold">{c.value}</span></div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="charts">
            <TabsList>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
              <TabsTrigger value="summary">{type === 'student' ? 'By Class' : 'By Staff'}</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Pie Chart */}
                <Card>
                  <CardHeader><CardTitle className="text-sm">Distribution</CardTitle></CardHeader>
                  <CardContent>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: any) => [v, 'Count']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data</div>}
                  </CardContent>
                </Card>

                {/* Line Chart — Attendance trend */}
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle className="text-sm">Daily Attendance Trend</CardTitle></CardHeader>
                  <CardContent>
                    {daily.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={daily.map((d: any) => ({ ...d, pct: pct(d.present, d.total), label: fmtDate(d.date) }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: any) => [`${v}%`, 'Attendance Rate']} />
                          <Line type="monotone" dataKey="pct" name="Attendance %" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data</div>}
                  </CardContent>
                </Card>
              </div>

              {/* Bar Chart — Daily counts */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Daily Attendance Counts</CardTitle></CardHeader>
                <CardContent>
                  {daily.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={daily.map((d: any) => ({ ...d, label: fmtDate(d.date) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="present" name="Present" fill="#22c55e" stackId="a" />
                        <Bar dataKey="late" name="Late" fill="#f59e0b" stackId="a" />
                        <Bar dataKey="leave" name="Leave" fill="#6366f1" stackId="a" />
                        <Bar dataKey="absent" name="Absent" fill="#ef4444" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No attendance data for the selected period</div>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily">
              <Card>
                <CardContent className="p-0">
                  {daily.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No data for selected period</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Present</TableHead>
                          <TableHead className="text-right">Absent</TableHead>
                          <TableHead className="text-right">Late</TableHead>
                          <TableHead className="text-right">Leave</TableHead>
                          {type === 'student' && <TableHead className="text-right">Half-day</TableHead>}
                          <TableHead className="text-right">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {daily.map((d: any) => {
                          const rate = pct(d.present, d.total);
                          return (
                            <TableRow key={d.date} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="font-medium text-sm">{new Date(d.date).toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                              <TableCell className="text-right text-sm">{d.total}</TableCell>
                              <TableCell className="text-right text-sm text-green-700 font-medium">{d.present}</TableCell>
                              <TableCell className="text-right text-sm text-red-700 font-medium">{d.absent}</TableCell>
                              <TableCell className="text-right text-sm text-amber-700">{d.late}</TableCell>
                              <TableCell className="text-right text-sm text-indigo-700">{d.leave || 0}</TableCell>
                              {type === 'student' && <TableCell className="text-right text-sm text-slate-600">{d.halfDay || 0}</TableCell>}
                              <TableCell className="text-right">
                                <span className={`text-sm font-bold ${rate >= 90 ? 'text-green-700' : rate >= 75 ? 'text-amber-700' : 'text-red-700'}`}>
                                  {rate}%
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary">
              <Card>
                <CardContent className="p-0">
                  {type === 'student' ? (
                    byClass.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No data</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Class</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Present</TableHead>
                            <TableHead className="text-right">Absent</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                            <TableHead>Visual</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {byClass.map((c: any) => {
                            const rate = pct(c.present, c.total);
                            return (
                              <TableRow key={c.class} className="hover:bg-muted/20 transition-colors">
                                <TableCell className="font-medium text-sm">{c.class}</TableCell>
                                <TableCell className="text-right text-sm">{c.total}</TableCell>
                                <TableCell className="text-right text-sm text-green-700">{c.present}</TableCell>
                                <TableCell className="text-right text-sm text-red-700">{c.absent}</TableCell>
                                <TableCell className="text-right">
                                  <span className={`font-bold ${rate >= 90 ? 'text-green-700' : rate >= 75 ? 'text-amber-700' : 'text-red-700'}`}>{rate}%</span>
                                </TableCell>
                                <TableCell className="w-40">
                                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${rate}%` }} />
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )
                  ) : (
                    byStaff.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No data</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Staff Member</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Present</TableHead>
                            <TableHead className="text-right">Absent</TableHead>
                            <TableHead className="text-right">Late</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {byStaff.map((s: any) => {
                            const rate = pct(s.present, s.total);
                            return (
                              <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                                <TableCell>
                                  <div className="font-medium text-sm">{s.name}</div>
                                  <div className="text-xs text-muted-foreground">{s.code} · {s.designation}</div>
                                </TableCell>
                                <TableCell className="text-sm">{s.dept}</TableCell>
                                <TableCell className="text-right text-sm">{s.total}</TableCell>
                                <TableCell className="text-right text-sm text-green-700">{s.present}</TableCell>
                                <TableCell className="text-right text-sm text-red-700 font-medium">{s.absent}</TableCell>
                                <TableCell className="text-right text-sm text-amber-700">{s.late}</TableCell>
                                <TableCell className="text-right">
                                  <span className={`text-sm font-bold ${rate >= 90 ? 'text-green-700' : rate >= 75 ? 'text-amber-700' : 'text-red-700'}`}>{rate}%</span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
