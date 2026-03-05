'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2, Grid, List, Zap, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const SEAT_COLORS = ['bg-blue-100 border-blue-300', 'bg-green-100 border-green-300', 'bg-purple-100 border-purple-300', 'bg-orange-100 border-orange-300', 'bg-pink-100 border-pink-300'];

export default function ExamSeatingPage() {
  const [halls, setHalls] = useState<any[]>([]);
  const [seats, setSeats] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hallDialog, setHallDialog] = useState(false);
  const [autoDialog, setAutoDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [examFilter, setExamFilter] = useState('');
  const [hallFilter, setHallFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [hallForm, setHallForm] = useState({ name: '', capacity: '30', seatsPerRow: '5', location: '', notes: '' });
  const [autoForm, setAutoForm] = useState({ examId: '', hallId: '', classIds: [] as string[], startSeatNum: 'A' });

  const loadHalls = useCallback(async () => {
    const res = await fetch('/api/exam-seating?view=halls');
    const data = await res.json();
    setHalls(data.halls || []);
  }, []);

  const loadSeating = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'seating', examId: examFilter, hallId: hallFilter });
      const res = await fetch(`/api/exam-seating?${params}`);
      const data = await res.json();
      setSeats(data.seats || []); setExams(data.exams || []); setClasses(data.classes || []); setStudents(data.students || []);
      if (!halls.length) setHalls(data.halls || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [examFilter, hallFilter, halls.length]);

  useEffect(() => { loadHalls(); }, [loadHalls]);

  const saveHall = async () => {
    if (!hallForm.name) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/exam-seating', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...hallForm, entity: 'hall' }) });
      toast({ title: 'Hall added' }); setHallDialog(false); loadHalls();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const autoAssign = async () => {
    if (!autoForm.examId || !autoForm.hallId) { toast({ title: 'Exam and hall required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/exam-seating', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...autoForm, action: 'auto_assign' }) });
      const data = await res.json();
      toast({ title: `✅ ${data.count} seats assigned` }); setAutoDialog(false); loadSeating();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const clearSeating = async (examId: string) => {
    if (!confirm('Clear all seating for this exam?')) return;
    const res = await fetch('/api/exam-seating', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: examId, entity: 'all_seats' }) });
    const data = await res.json();
    toast({ title: `${data.count} seats cleared` }); loadSeating();
  };

  // Group seats by row for grid view
  const maxRow = seats.length ? Math.max(...seats.map((s: any) => s.row || 1)) : 0;
  const maxCol = seats.length ? Math.max(...seats.map((s: any) => s.col || 1)) : 0;
  const seatsPerRow = halls.find(h => h.id === hallFilter)?.seatsPerRow || 5;

  // Color by class
  const classColors: Record<string, string> = {};
  seats.forEach((s: any) => { if (s.classId && !classColors[s.classId]) classColors[s.classId] = SEAT_COLORS[Object.keys(classColors).length % SEAT_COLORS.length]; });

  const toggleClass = (id: string) => setAutoForm(f => ({ ...f, classIds: f.classIds.includes(id) ? f.classIds.filter(c => c !== id) : [...f.classIds, id] }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Exam Seating" description="Assign and visualize student seating arrangements for examinations"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setHallDialog(true)}><Plus className="h-4 w-4 mr-2" />Add Hall</Button>
          <Button size="sm" onClick={() => { setAutoForm({ examId: '', hallId: '', classIds: [], startSeatNum: 'A' }); setAutoDialog(true); loadSeating(); }}><Zap className="h-4 w-4 mr-2" />Auto Assign</Button>
        </div>}
      />

      <Tabs defaultValue="seating" onValueChange={v => { if (v === 'seating') loadSeating(); }}>
        <TabsList>
          <TabsTrigger value="seating">🪑 Seating Plan</TabsTrigger>
          <TabsTrigger value="halls" onClick={loadHalls}>🏛 Halls ({halls.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="seating" className="mt-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={examFilter} onValueChange={v => setExamFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-56"><SelectValue placeholder="Select Exam" /></SelectTrigger><SelectContent><SelectItem value="all">All Exams</SelectItem>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>
            <Select value={hallFilter} onValueChange={v => setHallFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-44"><SelectValue placeholder="All Halls" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{halls.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" onClick={loadSeating}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
            <div className="flex border rounded overflow-hidden">
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode('grid')}><Grid className="h-4 w-4" /></Button>
            </div>
            {examFilter && <Button variant="outline" size="sm" className="text-destructive border-destructive" onClick={() => clearSeating(examFilter)}>Clear Seating</Button>}
          </div>

          {/* Class legend */}
          {Object.keys(classColors).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(classColors).map(([cid, color]) => {
                const cls = classes.find(c => c.id === cid);
                return <Badge key={cid} className={`text-xs ${color} border`}>{cls?.name}</Badge>;
              })}
            </div>
          )}

          {loading ? <div className="flex justify-center h-40 items-center"><Loader2 className="h-6 w-6 animate-spin" /></div> :
            seats.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><p>No seating assigned. Use Auto Assign to get started.</p></CardContent></Card> :
            viewMode === 'grid' ? (
              <Card>
                <CardHeader><CardTitle className="text-sm text-muted-foreground">Seating Grid — {seats.length} students</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    <div className="text-center text-xs text-muted-foreground mb-4 py-2 border-b-2 border-dashed">🎓 FRONT / INVIGILATOR DESK</div>
                    {Array.from({ length: maxRow }).map((_, ri) => (
                      <div key={ri} className="flex gap-2 mb-2 justify-center">
                        {Array.from({ length: maxCol }).map((_, ci) => {
                          const seat = seats.find((s: any) => s.row === ri + 1 && s.col === ci + 1);
                          return (
                            <div key={ci} className={`w-20 h-16 border-2 rounded text-center p-1 text-xs flex flex-col justify-center ${seat ? (classColors[seat.classId] || 'bg-gray-100 border-gray-300') : 'bg-gray-50 border-dashed border-gray-200'}`}>
                              {seat ? (
                                <>
                                  <div className="font-bold text-xs">{seat.seatNumber}</div>
                                  <div className="text-[10px] truncate">{seat.studentName?.split(' ')[0]}</div>
                                  <div className="text-[10px] text-muted-foreground">{seat.admissionNumber}</div>
                                </>
                              ) : <span className="text-muted-foreground">Empty</span>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Seat #</TableHead><TableHead>Student</TableHead><TableHead>Admission #</TableHead><TableHead>Roll #</TableHead><TableHead>Class</TableHead><TableHead>Hall</TableHead><TableHead className="text-right">Row/Col</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {seats.map(s => (
                      <TableRow key={s.id} className="hover:bg-muted/20">
                        <TableCell><Badge variant="outline" className="font-mono">{s.seatNumber}</Badge></TableCell>
                        <TableCell className="font-medium text-sm">{s.studentName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.admissionNumber}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.rollNumber}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{s.className}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{halls.find(h => h.id === s.hallId)?.name}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">R{s.row} C{s.col}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            )
          }
        </TabsContent>

        <TabsContent value="halls" className="mt-4">
          {halls.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><p>No exam halls defined</p><Button size="sm" className="mt-3" onClick={() => setHallDialog(true)}>Add Hall</Button></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {halls.map(h => (
                <Card key={h.id} className="hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{h.name}</p>
                        {h.location && <p className="text-xs text-muted-foreground">📍 {h.location}</p>}
                        <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                          <p>Capacity: {h.capacity} students</p>
                          <p>Seats per row: {h.seatsPerRow}</p>
                          <p>Occupied: {h.occupiedSeats || 0}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { if (confirm('Delete hall?')) { await fetch('/api/exam-seating', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: h.id, entity: 'hall' }) }); loadHalls(); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>
      </Tabs>

      {/* Hall Dialog */}
      <Dialog open={hallDialog} onOpenChange={setHallDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Exam Hall</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Hall Name *</Label><Input value={hallForm.name} onChange={e => setHallForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Main Hall, Lab Block A" /></div>
            <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" value={hallForm.capacity} onChange={e => setHallForm(f => ({ ...f, capacity: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Seats Per Row</Label><Input type="number" value={hallForm.seatsPerRow} onChange={e => setHallForm(f => ({ ...f, seatsPerRow: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Location</Label><Input value={hallForm.location} onChange={e => setHallForm(f => ({ ...f, location: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setHallDialog(false)}>Cancel</Button><Button onClick={saveHall} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Add Hall</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto Assign Dialog */}
      <Dialog open={autoDialog} onOpenChange={setAutoDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Auto Assign Seating</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Exam *</Label><Select value={autoForm.examId} onValueChange={v => setAutoForm(f => ({ ...f, examId: v }))}><SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger><SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Hall *</Label><Select value={autoForm.hallId} onValueChange={v => setAutoForm(f => ({ ...f, hallId: v }))}><SelectTrigger><SelectValue placeholder="Select hall" /></SelectTrigger><SelectContent>{halls.map(h => <SelectItem key={h.id} value={h.id}>{h.name} (cap. {h.capacity})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5">
              <Label>Classes to Assign</Label>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded">
                {classes.map(c => <button key={c.id} onClick={() => toggleClass(c.id)} className={`text-xs px-2 py-1 rounded border ${autoForm.classIds.includes(c.id) ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30 hover:border-primary'}`}>{c.name}</button>)}
              </div>
              <p className="text-xs text-muted-foreground">Leave empty to assign all students</p>
            </div>
            <div className="space-y-1.5"><Label>Seat Prefix</Label><Input value={autoForm.startSeatNum} onChange={e => setAutoForm(f => ({ ...f, startSeatNum: e.target.value }))} placeholder="A, B, or number like 101" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAutoDialog(false)}>Cancel</Button><Button onClick={autoAssign} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}<Zap className="h-4 w-4 mr-2" />Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
