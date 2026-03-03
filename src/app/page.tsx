'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, DollarSign, GraduationCap, CalendarCheck, BookOpen,
  Bus, Loader2, RefreshCw, ClipboardList, TrendingUp,
  Calendar, ChevronRight, Award, FileText, Percent, Star,
  BarChart2, Bell, CheckCircle2, AlertCircle, Clock,
  ArrowUpRight, ArrowDownRight, Zap,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';

const GENDER_COLORS = ['#3b82f6', '#ec4899', '#10b981'];

const QUICK_LINKS = [
  { label: 'New Admission', href: '/admission',      icon: GraduationCap, color: 'from-blue-500 to-blue-700' },
  { label: 'Collect Fee',   href: '/fee-builder',    icon: DollarSign,    color: 'from-green-500 to-emerald-700' },
  { label: 'Attendance',    href: '/attendance',     icon: CalendarCheck, color: 'from-purple-500 to-purple-700' },
  { label: 'Payroll',       href: '/payroll',        icon: ClipboardList, color: 'from-amber-500 to-orange-600' },
  { label: 'Grade Book',    href: '/grade-book',     icon: BookOpen,      color: 'from-pink-500 to-rose-600' },
  { label: 'Bulk Import',   href: '/bulk-import',    icon: FileText,      color: 'from-cyan-500 to-teal-600' },
  { label: 'Appraisals',    href: '/appraisals',     icon: Award,         color: 'from-indigo-500 to-violet-600' },
  { label: 'Fee Discounts', href: '/fee-discount',  icon: Percent,       color: 'from-rose-500 to-red-600' },
];

const fmtPKR  = (n: number) => n >= 1000000 ? `PKR ${(n/1000000).toFixed(1)}M` : n >= 1000 ? `PKR ${(n/1000).toFixed(0)}K` : `PKR ${n}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });

// Animated counter hook
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!target) return;
    const steps = 30;
    const step = target / steps;
    let current = 0;
    ref.current = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.round(current));
      if (current >= target && ref.current) clearInterval(ref.current);
    }, duration / steps);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [target, duration]);
  return count;
}

function StatCard({ label, value, icon: Icon, color, sub, trend, href }: any) {
  const display = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <Link href={href || '#'}>
      <Card className={`border-l-4 ${color} card-hover cursor-pointer group transition-all duration-200 hover:shadow-lg`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-bold leading-none">
                {typeof value === 'number' ? display.toLocaleString() : value}
              </p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
              {trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(trend)}% vs last month
                </div>
              )}
            </div>
            <div className="p-3 rounded-xl bg-muted/40 group-hover:scale-110 transition-transform duration-200">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const [stats, setStats]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [greeting, setGreeting] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/dashboard-stats');
      const j = await r.json();
      if (j.success) { setStats(j.data); setUpdated(new Date()); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
  }, []);

  if (loading) return (
    <div className="p-6 space-y-6">
      {/* Skeleton loading */}
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="h-32 skeleton rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_,i) => <div key={i} className="h-64 skeleton rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  const s = stats || {};
  const genderData = [
    { name: 'Male',   value: s.maleCount   || 0 },
    { name: 'Female', value: s.femaleCount  || 0 },
    { name: 'Other',  value: s.otherCount   || 0 },
  ].filter(d => d.value > 0);

  const feeData = [
    { month: 'Jan', collected: s.monthlyFeeData?.[0] || 0, due: s.monthlyFeeData?.[0] ? s.monthlyFeeData[0] * 1.12 : 0 },
    { month: 'Feb', collected: s.monthlyFeeData?.[1] || 0, due: s.monthlyFeeData?.[1] ? s.monthlyFeeData[1] * 1.1  : 0 },
    { month: 'Mar', collected: s.monthlyFeeData?.[2] || 0, due: s.monthlyFeeData?.[2] ? s.monthlyFeeData[2] * 1.08 : 0 },
    { month: 'Apr', collected: s.monthlyFeeData?.[3] || 0, due: s.monthlyFeeData?.[3] ? s.monthlyFeeData[3] * 1.05 : 0 },
    { month: 'May', collected: s.monthlyFeeData?.[4] || 0, due: s.monthlyFeeData?.[4] ? s.monthlyFeeData[4] * 1.06 : 0 },
    { month: 'Jun', collected: s.monthlyFeeData?.[5] || 0, due: s.monthlyFeeData?.[5] ? s.monthlyFeeData[5] * 1.09 : 0 },
  ];

  const attData = [
    { day: 'Mon', present: s.weeklyAtt?.[0] || 92, absent: 100 - (s.weeklyAtt?.[0] || 92) },
    { day: 'Tue', present: s.weeklyAtt?.[1] || 89, absent: 100 - (s.weeklyAtt?.[1] || 89) },
    { day: 'Wed', present: s.weeklyAtt?.[2] || 94, absent: 100 - (s.weeklyAtt?.[2] || 94) },
    { day: 'Thu', present: s.weeklyAtt?.[3] || 91, absent: 100 - (s.weeklyAtt?.[3] || 91) },
    { day: 'Fri', present: s.weeklyAtt?.[4] || 88, absent: 100 - (s.weeklyAtt?.[4] || 88) },
    { day: 'Sat', present: s.weeklyAtt?.[5] || 85, absent: 100 - (s.weeklyAtt?.[5] || 85) },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-48 translate-x-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-32 -translate-x-32" />
        </div>
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">{greeting}, Admin 👋</p>
            <h1 className="text-2xl font-bold mt-0.5">EduManage Dashboard</h1>
            <p className="text-blue-200 text-sm mt-1">
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {updated && <span className="text-xs text-blue-200">Updated {updated.toLocaleTimeString()}</span>}
            <Button variant="secondary" size="sm" onClick={load} className="bg-white/20 hover:bg-white/30 text-white border-0">
              <RefreshCw className="h-3.5 w-3.5 mr-2" />Refresh
            </Button>
          </div>
        </div>
        {/* Mini stat pills */}
        <div className="relative flex gap-4 mt-5 flex-wrap">
          {[
            { label: 'Students', value: s.totalStudents || 0 },
            { label: 'Staff', value: s.totalStaff || 0 },
            { label: 'Classes', value: s.totalClasses || 0 },
            { label: "Today's Attendance", value: `${s.todayAttendance || 0}%` },
          ].map(item => (
            <div key={item.label} className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 min-w-24 text-center">
              <div className="text-xl font-bold">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</div>
              <div className="text-xs text-blue-200">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5" /> Quick Actions
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 stagger-children">
          {QUICK_LINKS.map(({ label, href, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <Card className="group card-hover cursor-pointer border-0 shadow-sm hover:shadow-md">
                <CardContent className="p-3 flex flex-col items-center gap-2">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Total Students"    value={s.totalStudents || 0}     icon={GraduationCap} color="border-l-blue-500"   sub={`${s.maleCount||0}M · ${s.femaleCount||0}F`} trend={3.2}  href="/students" />
        <StatCard label="Fee Collected"     value={fmtPKR(s.monthlyFees||0)} icon={DollarSign}    color="border-l-green-500"  sub="This month"                                   trend={8.1}  href="/fee-builder" />
        <StatCard label="Fee Defaulters"    value={s.feeDefaulters || 0}     icon={AlertCircle}   color="border-l-red-500"    sub="Overdue balances"                              trend={-2.3} href="/fee-default" />
        <StatCard label="Staff Members"     value={s.totalStaff || 0}        icon={Users}         color="border-l-purple-500" sub={`${s.teacherCount||0} teachers`}              href="/staff" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Fee Collection Area Chart */}
        <Card className="lg:col-span-2 animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-500" />Fee Collection Trend</CardTitle>
              <Badge variant="outline" className="text-xs">Last 6 months</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={feeData}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${v/1000}K` : v} />
                <Tooltip formatter={(v: any) => [`PKR ${Number(v).toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" fill="url(#colorCollected)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Pie */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" />Student Gender</CardTitle>
          </CardHeader>
          <CardContent>
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any, n: string) => [`${v} students`, n]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance + Events Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Attendance */}
        <Card className="lg:col-span-2 animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-purple-500" />Weekly Attendance %</CardTitle>
              <Link href="/att-reports"><Button variant="ghost" size="sm" className="text-xs h-7">View Report <ChevronRight className="h-3 w-3 ml-1" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={attData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: any, n: string) => [`${v}%`, n]} />
                <Bar dataKey="present" name="Present" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-amber-500" />Upcoming Events</CardTitle>
              <Link href="/events-mgmt"><Button variant="ghost" size="sm" className="text-xs h-7">All <ChevronRight className="h-3 w-3" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(s.upcomingEvents || []).length > 0 ? (
              (s.upcomingEvents || []).slice(0, 5).map((ev: any) => (
                <div key={ev.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="min-w-10 text-center bg-blue-50 rounded-lg p-1">
                    <div className="text-xs font-bold text-blue-700">{fmtDate(ev.startDate || ev.eventDate)}</div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{ev.type || ev.eventType}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
                No upcoming events
              </div>
            )}
            <Link href="/events-mgmt">
              <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                <CalendarCheck className="h-3.5 w-3.5 mr-2" />Plan Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admissions */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-blue-500" />Recent Admissions</CardTitle>
              <Link href="/admission"><Button variant="ghost" size="sm" className="text-xs h-7">View All <ChevronRight className="h-3 w-3" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(s.recentStudents || []).slice(0,5).map((st: any) => (
              <div key={st.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors group">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {st.fullName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{st.fullName}</p>
                  <p className="text-xs text-muted-foreground">{st.class?.name} · {st.admissionNumber}</p>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">{st.status}</Badge>
              </div>
            ))}
            {!(s.recentStudents?.length) && (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-20" />No recent admissions
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Alerts */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-amber-500" />Fee Alerts</CardTitle>
              <Link href="/fee-default"><Button variant="ghost" size="sm" className="text-xs h-7">All Defaulters <ChevronRight className="h-3 w-3" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(s.feeAlerts || []).slice(0,5).map((al: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{al.studentName || al.fullName}</p>
                  <p className="text-xs text-muted-foreground">Balance: PKR {(al.balance||al.outstanding||0).toLocaleString()}</p>
                </div>
                <Badge className="text-xs bg-red-100 text-red-700 flex-shrink-0">Overdue</Badge>
              </div>
            ))}
            {!(s.feeAlerts?.length) && (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20 text-green-500" />
                All fees up to date! 🎉
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Pending Leaves',   value: s.pendingLeaves   || 0, icon: Clock,       color: 'text-amber-500',  href: '/leaves' },
          { label: 'Open Complaints',  value: s.openComplaints  || 0, icon: AlertCircle, color: 'text-red-500',    href: '/complaints' },
          { label: 'Library Books',    value: s.libraryBooks    || 0, icon: BookOpen,     color: 'text-blue-500',   href: '/library' },
          { label: 'Active Transport', value: s.transportRoutes || 0, icon: Bus,          color: 'text-green-500',  href: '/transport' },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Link key={href} href={href}>
            <Card className="card-hover cursor-pointer hover:shadow-md transition-all">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted/50`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

    </div>
  );
}
