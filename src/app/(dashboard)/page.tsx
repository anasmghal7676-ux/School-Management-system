'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  GraduationCap, Users, DollarSign, CalendarCheck, TrendingUp, TrendingDown,
  BookOpen, Bus, Building2, CreditCard, FileText, BarChart3,
  Plus, ClipboardList, FileBarChart, Bell, AlertTriangle, Clock,
  ArrowRight, School, Loader2, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PIE_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6'];
const QUICK_ACTIONS = [
  { label: '+ New Student', href: '/students', icon: GraduationCap, color: 'bg-blue-500' },
  { label: 'Collect Fee', href: '/fees/collection', icon: DollarSign, color: 'bg-green-500' },
  { label: 'Mark Attendance', href: '/attendance', icon: CalendarCheck, color: 'bg-amber-500' },
  { label: 'Generate Report', href: '/reports', icon: FileBarChart, color: 'bg-purple-500' },
];
const MODULES = [
  { name: 'Students', href: '/students', icon: GraduationCap },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Attendance', href: '/attendance', icon: CalendarCheck },
  { name: 'Fee Collection', href: '/fees/collection', icon: DollarSign },
  { name: 'Exams', href: '/exams', icon: FileText },
  { name: 'Timetable', href: '/timetable', icon: Clock },
  { name: 'Library', href: '/library', icon: BookOpen },
  { name: 'Transport', href: '/transport', icon: Bus },
  { name: 'Hostel', href: '/hostel', icon: Building2 },
  { name: 'Payroll', href: '/payroll', icon: CreditCard },
  { name: 'Admissions', href: '/admission', icon: ClipboardList },
  { name: 'Reports', href: '/analytics', icon: BarChart3 },
];

interface Stats {
  totalStudents: number; totalStaff: number; totalClasses: number;
  maleCount: number; femaleCount: number; otherCount: number;
  todayAttendance: number; monthlyFees: number; feeDefaulters: number;
  pendingLeaves: number; openComplaints: number; libraryBooks: number;
  transportRoutes: number; monthlyFeeData: number[]; weeklyAtt: number[];
  recentStudents: any[]; upcomingEvents: any[]; feeAlerts: any[];
}

function KpiCard({ title, value, icon: Icon, trend, trendLabel, loading, color = 'text-primary' }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className={cn('text-2xl font-bold', color)}>{value}</p>
            )}
            {!loading && trendLabel && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span>{trendLabel}</span>
              </div>
            )}
          </div>
          <div className={cn('p-2.5 rounded-lg', 'bg-primary/10')}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card><CardContent className="p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-20" />
    </CardContent></Card>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard-stats');
      const json = await res.json();
      if (json.success) setStats(json.data);
      else setError('Failed to load stats');
    } catch {
      setError('Network error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Build chart data from stats
  const now = new Date();
  const feeChartData = (stats?.monthlyFeeData || new Array(6).fill(0)).map((v, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: MONTHS[m.getMonth()], collected: v, target: 500000 };
  });

  const attChartData = (stats?.weeklyAtt || WEEKDAYS.map(() => 0)).map((v, i) => ({
    day: WEEKDAYS[i] || `D${i + 1}`, rate: v,
  }));

  const genderData = [
    { name: 'Male', value: stats?.maleCount || 0 },
    { name: 'Female', value: stats?.femaleCount || 0 },
    { name: 'Other', value: stats?.otherCount || 0 },
  ].filter(d => d.value > 0);

  const totalFee = stats?.monthlyFees || 0;
  const fmtCurrency = (v: number) =>
    v >= 1000000 ? `₨${(v / 1000000).toFixed(1)}M`
    : v >= 1000 ? `₨${(v / 1000).toFixed(0)}K`
    : `₨${v}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {session?.user?.name?.split(' ')[0] || 'Admin'} 
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Here's what's happening at your school today.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard title="Total Students" value={stats?.totalStudents?.toLocaleString() ?? '0'}
              icon={GraduationCap} trend={5} trendLabel="vs last month" color="text-blue-600" />
            <KpiCard title="Active Staff" value={stats?.totalStaff?.toLocaleString() ?? '0'}
              icon={Users} trend={2} trendLabel="vs last month" color="text-purple-600" />
            <KpiCard title="Fee Collected" value={fmtCurrency(totalFee)}
              icon={DollarSign} trend={8} trendLabel="this month" color="text-green-600" />
            <KpiCard title="Today's Attendance" value={`${stats?.todayAttendance ?? 0}%`}
              icon={CalendarCheck} trend={stats?.todayAttendance && stats.todayAttendance > 85 ? 1 : -1}
              trendLabel="vs yesterday" color="text-amber-600" />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(a => (
          <Link key={a.href} href={a.href}>
            <Button variant="outline" size="sm" className="gap-2">
              <div className={cn('w-4 h-4 rounded flex items-center justify-center', a.color)}>
                <a.icon className="h-2.5 w-2.5 text-white" />
              </div>
              {a.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fee Collection Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fee Collection (Last 6 Months)</CardTitle>
            <CardDescription className="text-xs">Collected vs target</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={feeChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} className="fill-muted-foreground" />
                  <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                  <Bar dataKey="collected" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Collected" />
                  <Bar dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Attendance Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weekly Attendance Rate</CardTitle>
            <CardDescription className="text-xs">Student attendance % per day</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={attChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} domain={[70, 100]} tickFormatter={v => `${v}%`} className="fill-muted-foreground" />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Area type="monotone" dataKey="rate" stroke="#10b981" fill="url(#attGrad)" strokeWidth={2} name="Attendance %" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Students + Events + Gender + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Admissions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Recent Admissions</CardTitle>
            <Link href="/students">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : stats?.recentStudents?.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No students yet</p>
            ) : (
              <div className="space-y-2">
                {(stats?.recentStudents || []).map((s: any) => (
                  <Link key={s.id} href={`/students`} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{s.fullName}</p>
                      <p className="text-[11px] text-muted-foreground">{s.class?.name || '—'}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] py-0 h-4 shrink-0">{s.admissionNumber}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution + Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Student Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                      {genderData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {genderData.map((d, i) => (
                    <div key={d.name}>
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-[11px] text-muted-foreground">{d.name}</span>
                      </div>
                      <p className="text-sm font-semibold">{d.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-600">{stats?.feeDefaulters ?? 0}</p>
                    <p className="text-[11px] text-muted-foreground">Fee Defaulters</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-600">{stats?.pendingLeaves ?? 0}</p>
                    <p className="text-[11px] text-muted-foreground">Pending Leaves</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Link href="/events">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : stats?.upcomingEvents?.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {(stats?.upcomingEvents || []).map((e: any) => {
                  const d = new Date(e.startDate);
                  return (
                    <div key={e.id} className="flex items-start gap-3 p-2 rounded-md bg-muted/30">
                      <div className="text-center bg-primary/10 rounded p-1.5 shrink-0 min-w-[36px]">
                        <p className="text-[10px] font-medium text-primary">{MONTHS[d.getMonth()]}</p>
                        <p className="text-sm font-bold text-primary leading-none">{d.getDate()}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{e.title}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{e.eventType || 'Event'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Module Quick Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Module Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {MODULES.map(m => (
              <Link key={m.href} href={m.href}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary/30 transition-all text-center">
                  <m.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[11px] font-medium leading-tight">{m.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
