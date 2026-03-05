'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Search, RefreshCw, TrendingUp, AlertTriangle, BookOpen, Clock } from 'lucide-react';
import PageHeader from '@/components/page-header';

export default function StaffWorkloadPage() {
  const [staff, setStaff]       = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [deptFilter, setDept]   = useState('');
  const [depts, setDepts]       = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, subRes, dRes] = await Promise.all([
        fetch('/api/staff?limit=200&status=active'),
        fetch('/api/cls-subjects?limit=500'),
        fetch('/api/departments'),
      ]);
      const [sData, subData, dData] = await Promise.all([sRes.json(), subRes.json(), dRes.json()]);
      if (sData.success)   setStaff(sData.data?.staff || sData.data || []);
      if (subData.success) setSubjects(subData.data || []);
      if (dData.success)   setDepts(dData.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Calculate workload per teacher
  const workloadMap: Record<string, { name: string; dept: string; designation: string; subjects: number; periods: number; classes: number }> = {};
  subjects.forEach((cs: any) => {
    const tid = cs.staffId || cs.teacherId;
    if (!tid) return;
    if (!workloadMap[tid]) {
      const t = staff.find(s => s.id === tid);
      workloadMap[tid] = { name: t?.fullName || 'Unknown', dept: t?.department?.name || '—', designation: t?.designation || t?.staffType || '—', subjects: 0, periods: 0, classes: 0 };
    }
    workloadMap[tid].subjects += 1;
    workloadMap[tid].periods  += parseInt(cs.periodsPerWeek || cs.weeklyPeriods || 4);
    workloadMap[tid].classes  += 1;
  });

  // Add staff with no assigned subjects
  staff.forEach(s => {
    if (!workloadMap[s.id] && s.staffType === 'Teacher') {
      workloadMap[s.id] = { name: s.fullName, dept: s.department?.name || '—', designation: s.designation || s.staffType || 'Teacher', subjects: 0, periods: 0, classes: 0 };
    }
  });

  const workloadData = Object.values(workloadMap);
  const MAX_PERIODS = 30;

  const filtered = workloadData.filter(w => {
    const q = search.toLowerCase();
    const matchSearch = !search || w.name.toLowerCase().includes(q) || w.dept.toLowerCase().includes(q);
    const matchDept   = !deptFilter || w.dept === deptFilter;
    return matchSearch && matchDept;
  });

  const sorted = [...filtered].sort((a, b) => b.periods - a.periods);

  const chartData = sorted.slice(0, 15).map(w => ({
    name: w.name.split(' ').slice(0, 2).join(' '),
    periods: w.periods,
    fill: w.periods > MAX_PERIODS ? '#ef4444' : w.periods > 20 ? '#f59e0b' : '#22c55e',
  }));

  const overloaded = workloadData.filter(w => w.periods > MAX_PERIODS).length;
  const unassigned = workloadData.filter(w => w.periods === 0).length;
  const avgPeriods = workloadData.length > 0 ? Math.round(workloadData.reduce((s, w) => s + w.periods, 0) / workloadData.filter(w => w.periods > 0).length) : 0;

  const getStatus = (periods: number) => {
    if (periods === 0) return { label: 'Unassigned', cls: 'bg-gray-100 text-gray-600' };
    if (periods > MAX_PERIODS) return { label: 'Overloaded', cls: 'bg-red-100 text-red-700' };
    if (periods > 22) return { label: 'Heavy', cls: 'bg-amber-100 text-amber-700' };
    if (periods >= 15) return { label: 'Normal', cls: 'bg-green-100 text-green-700' };
    return { label: 'Light', cls: 'bg-blue-100 text-blue-700' };
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Staff Workload"
        description="Teaching hours, subject assignments & load balancing"
        actions={<Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Teachers', value: workloadData.length, icon: Users, color: 'border-l-blue-500' },
          { label: 'Avg Periods/Week', value: avgPeriods, icon: Clock, color: 'border-l-green-500' },
          { label: 'Overloaded', value: overloaded, icon: AlertTriangle, color: 'border-l-red-500' },
          { label: 'Unassigned', value: unassigned, icon: BookOpen, color: 'border-l-gray-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              <Icon className="h-6 w-6 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">Workload Chart</TabsTrigger>
          <TabsTrigger value="table">Detailed Table</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({overloaded + unassigned})</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" />Periods Per Week — Top 15 Teachers</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 skeleton rounded animate-pulse" />
              ) : chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" angle={-40} textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: 'Periods/Week', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                    <Tooltip formatter={(v) => [`${v} periods`, 'Workload']} />
                    <Bar dataKey="periods" radius={[4,4,0,0]}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex gap-4 justify-center mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-green-500 inline-block" />Normal (≤22)</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-amber-500 inline-block" />Heavy (23-30)</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-red-500 inline-block" />Overloaded (30+)</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="mt-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search teacher..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={deptFilter} onValueChange={v => setDept(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {depts.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Teacher</TableHead><TableHead>Designation</TableHead><TableHead>Department</TableHead>
                    <TableHead className="text-center">Subjects</TableHead><TableHead className="text-center">Classes</TableHead>
                    <TableHead className="text-center">Periods/Week</TableHead><TableHead>Load Bar</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((w, i) => {
                    const pct = Math.min(100, Math.round((w.periods / MAX_PERIODS) * 100));
                    const st = getStatus(w.periods);
                    return (
                      <TableRow key={i} className="hover:bg-muted/20 transition-colors">
                        <TableCell><p className="font-medium text-sm">{w.name}</p></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{w.designation}</TableCell>
                        <TableCell className="text-sm">{w.dept}</TableCell>
                        <TableCell className="text-center font-medium">{w.subjects}</TableCell>
                        <TableCell className="text-center font-medium">{w.classes}</TableCell>
                        <TableCell className="text-center font-bold">{w.periods}</TableCell>
                        <TableCell className="min-w-24">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${pct > 100 ? 'bg-red-500' : pct > 73 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </TableCell>
                        <TableCell><Badge className={`text-xs ${st.cls}`}>{st.label}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4 space-y-3">
          {overloaded === 0 && unassigned === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>All teachers have balanced workloads — great!</p>
            </div>
          ) : (
            <>
              {workloadData.filter(w => w.periods > MAX_PERIODS).map((w, i) => (
                <Card key={i} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-red-800">{w.name}</p>
                      <p className="text-sm text-muted-foreground">{w.dept} · {w.subjects} subjects</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">{w.periods} <span className="text-sm font-normal">periods/week</span></p>
                      <Badge className="bg-red-100 text-red-700">Overloaded by {w.periods - MAX_PERIODS}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {workloadData.filter(w => w.periods === 0).map((w, i) => (
                <Card key={`u-${i}`} className="border-l-4 border-l-gray-400">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{w.name}</p>
                      <p className="text-sm text-muted-foreground">{w.dept} · {w.designation}</p>
                    </div>
                    <Badge variant="outline" className="text-gray-600">No subjects assigned</Badge>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
