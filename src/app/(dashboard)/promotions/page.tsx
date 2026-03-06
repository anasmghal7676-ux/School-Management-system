'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, GraduationCap, TrendingUp, RefreshCw, Save,
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight,
  Users, ArrowRight, RotateCcw, Award,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const PROMOTION_TYPES = [
  { value: 'Promoted',   label: 'Promote to Next Class', color: 'bg-green-100 text-green-700' },
  { value: 'Held-Back',  label: 'Hold Back (Repeat)',    color: 'bg-amber-100 text-amber-700' },
  { value: 'Graduated',  label: 'Graduated',             color: 'bg-blue-100 text-blue-700' },
  { value: 'Transferred',label: 'Transferred Out',       color: 'bg-purple-100 text-purple-700' },
];

const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => `${thisYear - 2 + i}-${thisYear - 1 + i}`);

export default function PromotionsPage() {
  const [classes, setClasses]       = useState<any[]>([]);
  const [students, setStudents]     = useState<any[]>([]);
  const [promotions, setPromotions] = useState<Record<string, any>>({});
  const [history, setHistory]       = useState<any[]>([]);
  const [hTotal, setHTotal]         = useState(0);
  const [histPage, setHistPage]     = useState(1);
  const [loading, setLoading]       = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [fromClass, setFromClass]   = useState('');
  const [toClass, setToClass]       = useState('');
  const [academicYear, setAcYear]   = useState(`${thisYear}-${thisYear + 1}`);
  const [defaultType, setDefaultType] = useState('Promoted');

  useEffect(() => { fetchClasses(); fetchHistory(); }, []);
  useEffect(() => { if (fromClass) fetchStudents(fromClass); }, [fromClass]);
  useEffect(() => { fetchHistory(); }, [histPage]);

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=50');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const fetchStudents = async (classId: string) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/students?classId=${classId}&status=active&limit=100`);
      const j = await r.json();
      const list = j.data?.students || j.data || [];
      setStudents(list);
      // Set all to default promotion type
      const defaults: Record<string, any> = {};
      list.forEach((s: any) => {
        defaults[s.id] = { promotionType: defaultType, toClassId: toClass || null, remarks: '' };
      });
      setPromotions(defaults);
    } finally { setLoading(false); }
  };

  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const r = await fetch(`/api/promotions?academicYear=${academicYear}&page=${histPage}&limit=20`);
      const j = await r.json();
      if (j.success) { setHistory(j.data.records || []); setHTotal(j.data.total || 0); }
    } finally { setHistLoading(false); }
  }, [academicYear, histPage]);

  const applyDefaultToAll = () => {
    const updated = { ...promotions };
    students.forEach(s => {
      updated[s.id] = { ...updated[s.id], promotionType: defaultType, toClassId: toClass || null };
    });
    setPromotions(updated);
    toast({ title: `Applied "${defaultType}" to all ${students.length} students` });
  };

  const handleProcess = async () => {
    if (!fromClass || !academicYear) { toast({ title: 'Select class and academic year', variant: 'destructive' }); return; }
    const list = students.map(s => ({
      studentId:     s.id,
      fromClassId:   fromClass,
      fromSectionId: s.currentSectionId || null,
      toClassId:     promotions[s.id]?.promotionType === 'Promoted' ? (promotions[s.id]?.toClassId || toClass || null) : null,
      toSectionId:   null,
      promotionType: promotions[s.id]?.promotionType || 'Promoted',
      remarks:       promotions[s.id]?.remarks || '',
    }));
    if (!list.length) { toast({ title: 'No students to process', variant: 'destructive' }); return; }

    setProcessing(true);
    try {
      const r = await fetch('/api/promotions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promotions: list, academicYear, promotedBy: 'Admin' }),
      });
      const j = await r.json();
      if (j.success) {
        toast({
          title: 'Promotions processed successfully!',
          description: `Promoted: ${j.data.promoted} | Held-Back: ${j.data.heldBack} | Graduated: ${j.data.graduated}`,
        });
        fetchHistory(); setStudents([]); setFromClass('');
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setProcessing(false); }
  };

  const setStudentType = (studentId: string, promotionType: string) => {
    setPromotions(p => ({ ...p, [studentId]: { ...p[studentId], promotionType, toClassId: promotionType === 'Promoted' ? (toClass || null) : null } }));
  };

  const fromClassName = classes.find(c => c.id === fromClass)?.name || '';
  const toClassName   = classes.find(c => c.id === toClass)?.name   || '';
  const promoted   = students.filter(s => promotions[s.id]?.promotionType === 'Promoted').length;
  const heldBack   = students.filter(s => promotions[s.id]?.promotionType === 'Held-Back').length;
  const graduated  = students.filter(s => promotions[s.id]?.promotionType === 'Graduated').length;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="h-7 w-7" />Class Promotions
            </h1>
            <p className="text-muted-foreground">Promote, hold back, or graduate students at the end of an academic year</p>
          </div>
        </div>

        <Tabs defaultValue="process">
          <TabsList>
            <TabsTrigger value="process">Process Promotions</TabsTrigger>
            <TabsTrigger value="history">Promotion History</TabsTrigger>
          </TabsList>

          {/* Process Tab */}
          <TabsContent value="process" className="space-y-5">

            {/* Config Panel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Configure Batch Promotion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Academic Year *</Label>
                    <Select value={academicYear} onValueChange={setAcYear}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>From Class (Current) *</Label>
                    <Select value={fromClass} onValueChange={v => { setFromClass(v); setStudents([]); }}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select class..." /></SelectTrigger>
                      <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>To Class (Promoted To)</Label>
                    <Select value={toClass || 'none'} onValueChange={v => setToClass(v === 'none' ? '' : v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select next class..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None / Graduate —</SelectItem>
                        {classes.filter(c => c.id !== fromClass).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Default Action</Label>
                    <Select value={defaultType} onValueChange={setDefaultType}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROMOTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={applyDefaultToAll} disabled={students.length === 0}>
                    <RotateCcw className="mr-2 h-4 w-4" />Apply Default to All
                  </Button>
                  {fromClass && (
                    <Button variant="outline" onClick={() => fetchStudents(fromClass)} disabled={loading}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Load Students
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary Bar */}
            {students.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: students.length, color: 'bg-gray-100 text-gray-700' },
                  { label: 'Promoted', value: promoted, color: 'bg-green-100 text-green-700' },
                  { label: 'Held Back', value: heldBack, color: 'bg-amber-100 text-amber-700' },
                  { label: 'Graduated', value: graduated, color: 'bg-blue-100 text-blue-700' },
                ].map(({ label, value, color }) => (
                  <Card key={label} className="text-center">
                    <CardContent className="pt-4 pb-3">
                      <p className={`text-xl font-bold rounded-lg ${color} px-2 py-1 inline-block`}>{value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Student Table */}
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : students.length > 0 ? (
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {fromClassName} — {students.length} Students
                      {toClassName && <span className="ml-2 text-muted-foreground font-normal">→ {toClassName}</span>}
                    </CardTitle>
                    <CardDescription>Set promotion status for each student</CardDescription>
                  </div>
                  <Button onClick={handleProcess} disabled={processing} className="bg-green-600 hover:bg-green-700">
                    {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Process Promotions
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Promotion Action</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s: any) => {
                        const pr   = promotions[s.id] || {};
                        const type = pr.promotionType || 'Promoted';
                        const typeCfg = PROMOTION_TYPES.find(t => t.value === type);
                        return (
                          <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell className="font-mono text-xs">{s.rollNumber || '—'}</TableCell>
                            <TableCell className="font-medium">{s.fullName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{s.admissionNumber}</TableCell>
                            <TableCell>
                              <Select value={type} onValueChange={v => setStudentType(s.id, v)}>
                                <SelectTrigger className="w-44 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PROMOTION_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>
                                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${t.color}`}>{t.label}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={pr.remarks || ''}
                                onChange={e => setPromotions(p => ({ ...p, [s.id]: { ...p[s.id], remarks: e.target.value } }))}
                                placeholder="Optional remarks..."
                                className="h-8 text-xs w-44"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : fromClass ? (
              <Card>
                <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                  <Users className="h-12 w-12 mb-3 opacity-20" />
                  <p className="font-medium">No active students in this class</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-semibold">Select a class to begin</p>
                  <p className="text-sm mt-1">Choose the current class to load students and process promotions</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <Label>Filter by Year:</Label>
                  <Select value={academicYear} onValueChange={v => { setAcYear(v); setHistPage(1); }}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => fetchHistory()} disabled={histLoading}>
                    <RefreshCw className={`h-4 w-4 ${histLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {histLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <Award className="h-10 w-10 mb-2 opacity-20" />
                    <p>No promotion history for {academicYear}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>From Class</TableHead>
                        <TableHead>To Class</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((h: any) => {
                        const typeCfg = PROMOTION_TYPES.find(t => t.value === h.promotionType);
                        return (
                          <TableRow key={h.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell>
                              <div className="font-medium text-sm">{h.student?.fullName}</div>
                              <div className="text-xs text-muted-foreground">{h.student?.admissionNumber}</div>
                            </TableCell>
                            <TableCell className="text-sm">{h.fromClass?.name}</TableCell>
                            <TableCell className="text-sm">
                              {h.toClass ? (
                                <span className="flex items-center gap-1">
                                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />{h.toClass.name}
                                </span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeCfg?.color || 'bg-gray-100 text-gray-700'}`}>
                                {h.promotionType}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">{h.academicYear}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{h.remarks || '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
                {Math.ceil(hTotal / 20) > 1 && (
                  <div className="flex justify-between items-center px-4 py-3 border-t">
                    <span className="text-xs text-muted-foreground">Page {histPage}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={histPage === 1} onClick={() => setHistPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" disabled={history.length < 20} onClick={() => setHistPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
