'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Clock, BookOpen, CalendarCheck, Star, ChevronRight, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PERIOD_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-green-100 text-green-800 border-green-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
];

export default function TeacherPortalPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [today] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => { fetchStaff(); }, []);
  useEffect(() => { if (selectedStaff) fetchData(); }, [selectedStaff]);

  const fetchStaff = async () => {
    const r = await fetch('/api/staff?limit=200');
    const j = await r.json();
    if (j.success) setStaff(j.data?.staff || j.data || []);
  };

  const fetchData = async () => {
    if (!selectedStaff) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/teach-portal?staffId=${selectedStaff}&date=${today}`);
      const j = await r.json();
      if (j.success) setData(j.data);
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const { todaySchedule, fullTimetable, sections, sectionAttSummary, homework, pendingLeaves, staffAttSummary, dayOfWeek } = data || {};

  // Build weekly grid from fullTimetable
  const periods = fullTimetable ? [...new Set(fullTimetable.map((t: any) => t.slot.periodNumber))].sort((a: any, b: any) => a - b) : [];
  const days    = fullTimetable ? [...new Set(fullTimetable.map((t: any) => t.slot.dayOfWeek))].sort((a: any, b: any) => a - b) : [];
  const getCell = (day: number, period: number) => fullTimetable?.find((t: any) => t.slot.dayOfWeek === day && t.slot.periodNumber === period);

  const subjectColorMap: Record<string, string> = {};
  if (fullTimetable) {
    const uniqueSubjects = [...new Set(fullTimetable.map((t: any) => t.subjectId).filter(Boolean))];
    uniqueSubjects.forEach((sid: any, i) => { subjectColorMap[sid] = PERIOD_COLORS[i % PERIOD_COLORS.length]; });
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  const daysLeft = (d: string) => { const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); return diff === 0 ? 'Due today' : diff < 0 ? `${Math.abs(diff)}d overdue` : `${diff}d left`; };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <User className="h-7 w-7" />Teacher Portal
            </h1>
            <p className="text-muted-foreground">Personal teacher dashboard — timetable, classes and homework</p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Select Teacher</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} — {s.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedStaff && (
              <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} className="mt-5">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {!selectedStaff ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-20 text-muted-foreground">
              <User className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a teacher to view their portal</p>
              <p className="text-sm">View timetable, class attendance and homework assignments</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>
        ) : data ? (
          <>
            {/* Teacher Info Card */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                    {data.staff?.firstName?.charAt(0)}{data.staff?.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{data.staff?.firstName} {data.staff?.lastName}</h2>
                    <p className="text-blue-100">{data.staff?.designation} · {data.staff?.department?.name}</p>
                    <p className="text-blue-200 text-sm">{data.staff?.employeeCode} · {data.staff?.email}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-blue-200">Today — {DAYS[dayOfWeek || 1]}</p>
                    <p className="text-xl font-bold">{new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Today's Classes", value: todaySchedule?.length || 0, sub: 'periods scheduled', color: 'border-l-blue-500' },
                { label: 'Classes Teaching', value: sections?.length || 0, sub: 'unique sections', color: 'border-l-purple-500' },
                { label: 'Homework Active', value: homework?.length || 0, sub: 'upcoming due', color: 'border-l-amber-500' },
                { label: 'My Attendance', value: `${staffAttSummary?.total ? Math.round((staffAttSummary.present/staffAttSummary.total)*100) : 0}%`, sub: `${staffAttSummary?.present}/${staffAttSummary?.total} this month`, color: 'border-l-green-500' },
              ].map(({ label, value, sub, color }) => (
                <Card key={label} className={`border-l-4 ${color}`}>
                  <CardContent className="pt-3 pb-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="today">
              <TabsList>
                <TabsTrigger value="today">Today's Schedule</TabsTrigger>
                <TabsTrigger value="timetable">Full Timetable</TabsTrigger>
                <TabsTrigger value="classes">My Classes</TabsTrigger>
                <TabsTrigger value="homework">Homework</TabsTrigger>
              </TabsList>

              {/* TODAY'S SCHEDULE */}
              <TabsContent value="today">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4" />{DAYS[dayOfWeek || 1]}'s Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!todaySchedule?.length ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p>No classes scheduled for today</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {todaySchedule.map((t: any) => {
                          const colorClass = t.subjectId ? subjectColorMap[t.subjectId] : 'bg-gray-100 text-gray-700 border-gray-200';
                          return (
                            <div key={t.id} className={`rounded-xl border p-4 ${colorClass}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold opacity-70">P{t.slot.periodNumber}</span>
                                    <span className="text-sm font-bold">{t.subject?.name || 'Free Period'}</span>
                                  </div>
                                  <p className="text-sm opacity-80">{t.section?.class?.name} — {t.section?.name}</p>
                                  {t.roomNumber && <p className="text-xs opacity-60 mt-0.5">Room {t.roomNumber}</p>}
                                </div>
                                <div className="text-right text-xs opacity-70">
                                  <p className="font-semibold">{t.slot.startTime}</p>
                                  <p>{t.slot.endTime}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FULL TIMETABLE GRID */}
              <TabsContent value="timetable">
                <Card className="overflow-hidden">
                  <CardHeader><CardTitle className="text-base">Weekly Timetable</CardTitle></CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    {!fullTimetable?.length ? (
                      <div className="text-center py-10 text-muted-foreground">No timetable assigned</div>
                    ) : (
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border p-2 text-muted-foreground">Period</th>
                            {days.map((d: any) => (
                              <th key={d} className={`border p-2 font-semibold min-w-28 ${d === dayOfWeek ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : ''}`}>
                                {DAYS[d]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {periods.map((p: any) => (
                            <tr key={p}>
                              <td className="border p-2 text-center bg-muted/30 font-semibold">P{p}</td>
                              {days.map((d: any) => {
                                const cell = getCell(d, p);
                                const color = cell?.subjectId ? subjectColorMap[cell.subjectId] : '';
                                return (
                                  <td key={d} className={`border p-1.5 ${d === dayOfWeek ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}`}>
                                    {cell ? (
                                      <div className={`rounded p-1.5 border text-xs ${color}`}>
                                        <div className="font-semibold">{cell.subject?.name || '—'}</div>
                                        <div className="opacity-70">{cell.section?.class?.name} {cell.section?.name}</div>
                                        {cell.slot && <div className="opacity-50">{cell.slot.startTime}–{cell.slot.endTime}</div>}
                                      </div>
                                    ) : (
                                      <div className="text-center text-muted-foreground/30">—</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MY CLASSES */}
              <TabsContent value="classes">
                <div className="space-y-4">
                  {!sectionAttSummary?.length ? (
                    <Card><CardContent className="text-center py-10 text-muted-foreground">No sections assigned</CardContent></Card>
                  ) : sectionAttSummary.map((s: any) => (
                    <Card key={s.sectionId} className={`border-l-4 ${s.marked ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <p className="font-bold">{s.className} — {s.sectionName}</p>
                            <div className="flex gap-4 mt-1 text-sm">
                              <span className="text-green-600">✓ Present: {s.present}</span>
                              <span className="text-red-600">✗ Absent: {s.absent}</span>
                              <span className="text-muted-foreground">Total marked: {s.total}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {s.marked ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <CheckCircle2 className="mr-1 h-3 w-3" />Attendance Marked
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">
                                Not Marked Today
                              </Badge>
                            )}
                            <Button size="sm" variant="outline" onClick={() => window.location.href = `/attendance?sectionId=${s.sectionId}`}>
                              Mark Attendance <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* HOMEWORK */}
              <TabsContent value="homework">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Active Homework</CardTitle>
                    <Button size="sm" onClick={() => window.location.href = '/homework'}>Manage All →</Button>
                  </CardHeader>
                  <CardContent>
                    {!homework?.length ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p>No upcoming homework assignments</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {homework.map((hw: any) => {
                          const dl = daysLeft(hw.submissionDate);
                          const isUrgent = new Date(hw.submissionDate).getTime() - Date.now() < 2 * 86400000;
                          return (
                            <div key={hw.id} className={`rounded-xl p-4 border-l-4 ${isUrgent ? 'border-l-red-500 bg-red-50 dark:bg-red-950/20' : 'border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20'}`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-sm">{hw.title}</p>
                                  <p className="text-xs text-muted-foreground">{hw.class?.name}{hw.section ? ` / ${hw.section.name}` : ''}</p>
                                  {hw.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{hw.description}</p>}
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                  <p className="text-xs text-muted-foreground">Due: {fmtDate(hw.submissionDate)}</p>
                                  <p className={`text-xs font-bold ${isUrgent ? 'text-red-600' : 'text-muted-foreground'}`}>{dl}</p>
                                  {hw.totalMarks && <p className="text-xs text-muted-foreground">{hw.totalMarks} marks</p>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </main>
    </div>
  );
}
