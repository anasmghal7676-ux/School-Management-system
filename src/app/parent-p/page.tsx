'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, Search, GraduationCap, CalendarCheck, DollarSign, BookOpen,
  Star, AlertTriangle, ThumbsUp, CheckCircle2, XCircle, Clock, User,
  TrendingUp, FileText,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtPKR  = (n: number) => `PKR ${n.toLocaleString()}`;

const ATT_COLORS: Record<string, string> = {
  Present: 'bg-green-100 text-green-700',
  Absent:  'bg-red-100 text-red-700',
  Late:    'bg-amber-100 text-amber-700',
  Leave:   'bg-blue-100 text-blue-700',
};

const BEHAVIOR_COLORS: Record<string, string> = {
  Good:         'bg-green-100 text-green-700',
  Appreciation: 'bg-blue-100 text-blue-700',
  Warning:      'bg-amber-100 text-amber-700',
  Bad:          'bg-red-100 text-red-700',
};

export default function ParentPortalPage() {
  const [searchType, setSearchType] = useState<'cnic' | 'phone'>('cnic');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast({ title: 'Enter search value', variant: 'destructive' }); return;
    }
    setLoading(true);
    setError('');
    try {
      const p = new URLSearchParams({ [searchType]: searchValue });
      const r = await fetch(`/api/parent-p?${p}`);
      const j = await r.json();
      if (j.success) {
        setData(j.data);
      } else {
        setError(j.message || 'Student not found');
        setData(null);
      }
    } catch {
      setError('Failed to fetch data. Please try again.');
    } finally { setLoading(false); }
  };

  const { student, attendance, fees, homework, reportCard, behaviorLogs } = data || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <GraduationCap className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-bold">Parent Portal</h1>
            <p className="text-emerald-100 text-sm">Track your child's academic progress</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Search Card */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Find Your Child's Records</CardTitle>
            <CardDescription>Enter your CNIC or registered phone number to access your child's information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={searchType === 'cnic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchType('cnic')}
                >
                  CNIC
                </Button>
                <Button
                  variant={searchType === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchType('phone')}
                >
                  Phone
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={searchType === 'cnic' ? '35201-1234567-8' : '03001234567'}
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="max-w-sm"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Search
                </Button>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Dashboard */}
        {data && student && (
          <>
            {/* Student Profile Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                    {student.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{student.fullName}</h2>
                    <div className="flex flex-wrap gap-3 mt-1 text-emerald-100 text-sm">
                      <span>Adm# {student.admissionNumber}</span>
                      <span>·</span>
                      <span>Class {student.class} {student.section && `- ${student.section}`}</span>
                      {student.rollNumber && <><span>·</span><span>Roll# {student.rollNumber}</span></>}
                      {student.bloodGroup && <><span>·</span><span>Blood: {student.bloodGroup}</span></>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {[
                { label: 'Attendance', value: `${attendance?.summary?.rate ?? 0}%`, sub: `${attendance?.summary?.present}/${attendance?.summary?.total} days`, icon: CalendarCheck, color: attendance?.summary?.rate >= 75 ? 'text-green-600' : 'text-red-600' },
                { label: 'Homework Due', value: homework?.length || 0, sub: 'pending tasks', icon: BookOpen, color: 'text-blue-600' },
                { label: 'Payments', value: fees?.recentPayments?.length || 0, sub: 'this year', icon: DollarSign, color: 'text-emerald-600' },
                { label: 'GPA', value: reportCard?.gpa?.toFixed(2) || 'N/A', sub: reportCard ? `Grade: ${reportCard.grade}` : 'No report card', icon: TrendingUp, color: 'text-purple-600' },
              ].map(({ label, value, sub, icon: Icon, color }) => (
                <Card key={label} className="border-0 shadow-md">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                      <Icon className={`h-6 w-6 opacity-60 ${color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="attendance">
              <TabsList className="w-full">
                <TabsTrigger value="attendance" className="flex-1">Attendance</TabsTrigger>
                <TabsTrigger value="homework" className="flex-1">Homework</TabsTrigger>
                <TabsTrigger value="fees" className="flex-1">Fees</TabsTrigger>
                <TabsTrigger value="behavior" className="flex-1">Behavior</TabsTrigger>
              </TabsList>

              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4" />Recent Attendance (Last 30 Days)
                    </CardTitle>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600 font-semibold">✓ Present: {attendance?.summary?.present}</span>
                      <span className="text-red-600 font-semibold">✗ Absent: {attendance?.summary?.absent}</span>
                      <span className="font-semibold">Rate: {attendance?.summary?.rate}%</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {attendance?.recent?.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">No attendance records for the last 30 days</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {attendance?.recent?.map((a: any) => (
                          <div key={a.id} className="flex flex-col items-center gap-1">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${ATT_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                              {a.status.charAt(0)}
                            </span>
                            <span className="text-xs text-muted-foreground">{new Date(a.date).getDate()}/{new Date(a.date).getMonth() + 1}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Homework Tab */}
              <TabsContent value="homework">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />Upcoming Homework
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {homework?.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">No pending homework assignments</p>
                    ) : (
                      <div className="space-y-3">
                        {homework?.map((hw: any) => {
                          const daysLeft = Math.ceil((new Date(hw.submissionDate).getTime() - Date.now()) / 86400000);
                          return (
                            <div key={hw.id} className={`p-3 rounded-lg border-l-4 ${daysLeft <= 1 ? 'border-l-red-500 bg-red-50 dark:bg-red-950/30' : daysLeft <= 3 ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30'}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-sm">{hw.title}</p>
                                  {hw.subject && <p className="text-xs text-muted-foreground">{hw.subject.name}</p>}
                                  {hw.description && <p className="text-xs text-muted-foreground mt-1">{hw.description}</p>}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-xs font-semibold">Due: {fmtDate(hw.submissionDate)}</p>
                                  <p className={`text-xs ${daysLeft <= 1 ? 'text-red-600 font-bold' : 'text-muted-foreground'}`}>
                                    {daysLeft === 0 ? 'Due today!' : daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                                  </p>
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

              {/* Fees Tab */}
              <TabsContent value="fees">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />Fee History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fees?.recentPayments?.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">No fee payments recorded this year</p>
                    ) : (
                      <div className="space-y-3">
                        {fees?.recentPayments?.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                            <div>
                              <p className="font-semibold text-sm">{fmtPKR(p.paidAmount)}</p>
                              <p className="text-xs text-muted-foreground">{fmtDate(p.paymentDate)} · {p.paymentMode}</p>
                              {p.monthYear && <p className="text-xs text-muted-foreground">{p.monthYear}</p>}
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                <CheckCircle2 className="mr-1 h-3 w-3" />{p.status}
                              </Badge>
                              {p.receiptNumber && <p className="text-xs text-muted-foreground mt-1">#{p.receiptNumber}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {fees?.pendingDues?.length > 0 && (
                      <div className="mt-4">
                        <p className="font-semibold text-sm text-red-600 mb-2">⚠️ Pending Dues</p>
                        {fees.pendingDues.map((d: any) => (
                          <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 mb-2">
                            <div>
                              <p className="font-semibold text-sm text-red-700">{fmtPKR(d.amountDue)}</p>
                              <p className="text-xs text-red-500">{d.monthYear}</p>
                            </div>
                            <Badge variant="destructive" className="text-xs">Pending</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Behavior Tab */}
              <TabsContent value="behavior">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-4 w-4" />Behavior & Conduct
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {behaviorLogs?.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <ThumbsUp className="h-10 w-10 mx-auto mb-2 text-green-500" />
                        <p>No behavior incidents recorded</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {behaviorLogs?.map((log: any) => (
                          <div key={log.id} className={`p-3 rounded-lg border-l-4 ${log.incidentType === 'Bad' || log.incidentType === 'Warning' ? 'border-l-amber-400' : 'border-l-green-400'}`}>
                            <div className="flex items-start justify-between">
                              <div>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BEHAVIOR_COLORS[log.incidentType] || 'bg-gray-100 text-gray-700'}`}>
                                  {log.incidentType}
                                </span>
                                <p className="text-sm mt-1.5">{log.description}</p>
                                {log.actionTaken && <p className="text-xs text-muted-foreground mt-1">Action: {log.actionTaken}</p>}
                              </div>
                              <p className="text-xs text-muted-foreground flex-shrink-0 ml-4">{fmtDate(log.incidentDate)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Parent Portal — For queries contact the school administration
        </p>
      </main>
    </div>
  );
}
