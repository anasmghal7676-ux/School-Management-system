'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, RefreshCw, Edit, Trash2, Fingerprint, Clock, CheckCircle2, AlertTriangle, LogIn, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

export default function StaffBiometricPage() {
  const [items, setItems] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, onTime: 0, late: 0, earlyLeave: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dialog, setDialog] = useState(false);
  const [clockOutDialog, setClockOutDialog] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [clockOutTime, setClockOutTime] = useState('');

  const emptyForm = () => ({
    staffId: '', staffName: '', employeeCode: '', department: '',
    date: selectedDate,
    clockIn: new Date().toTimeString().slice(0, 5),
    scheduledIn: '08:00', scheduledOut: '17:00',
    notes: ''
  });
  const [form, setForm] = useState<any>(emptyForm());
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff-bio?date=${selectedDate}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items || []); setSummary(data.summary || {}); setStaff(data.staff || []);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  const handleStaff = (id: string) => {
    const s = staff.find(x => x.id === id);
    setForm((p: any) => ({ ...p, staffId: id, staffName: s?.fullName || '', employeeCode: s?.employeeCode || '', department: s?.department || '' }));
  };

  const save = async () => {
    if (!form.staffId || !form.clockIn) { toast({ title: 'Staff and clock-in time required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/staff-bio', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...form, id: editing.id } : form)
      });
      toast({ title: editing ? 'Record updated' : 'Clock-in recorded' }); setDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveClockOut = async () => {
    if (!clockOutTime) { toast({ title: 'Clock-out time required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/staff-bio', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: clockOutDialog.id, clockOut: clockOutTime }) });
      toast({ title: '✅ Clock-out recorded' }); setClockOutDialog(null); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    await fetch('/api/staff-bio', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Deleted' }); load();
  };

  // Staff not yet clocked in today
  const notClockedIn = staff.filter(s => !items.find(i => i.staffId === s.id));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Staff Biometric Attendance" description="Clock-in/out tracking with late arrival and early departure detection"
        actions={<div className="flex gap-2">
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-40" />
          <Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Record Clock-In</Button>
        </div>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Present', value: summary.total, icon: <Fingerprint className="h-4 w-4 text-slate-500" />, color: 'border-l-slate-500' },
          { label: 'On Time', value: summary.onTime, icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'border-l-green-500' },
          { label: 'Late Arrivals', value: summary.late, icon: <Clock className="h-4 w-4 text-red-500" />, color: 'border-l-red-500' },
          { label: 'Early Departures', value: summary.earlyLeave, icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, color: 'border-l-amber-500' },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4"><div className="flex items-center justify-between">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div><p className="text-xs text-muted-foreground mt-1">{c.label}</p></CardContent>
          </Card>
        ))}
      </div>

      {summary.late > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <Clock className="h-4 w-4 flex-shrink-0" /><span><strong>{summary.late} staff member{summary.late > 1 ? 's' : ''}</strong> arrived late today.</span>
        </div>
      )}

      {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> : (
        <div className="space-y-4">
          {/* Present staff table */}
          {items.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Staff</TableHead><TableHead>Dept</TableHead>
                    <TableHead>Clock In</TableHead><TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead><TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="font-medium text-sm">{item.staffName}</div>
                          <div className="text-xs text-muted-foreground">{item.employeeCode}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.department}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <LogIn className="h-3.5 w-3.5 text-green-600" />
                            <span className={`font-mono text-sm font-medium ${item.isLate ? 'text-red-600' : 'text-green-700'}`}>{item.clockIn}</span>
                            {item.isLate && <Badge className="text-xs bg-red-100 text-red-700">Late</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.clockOut ? (
                            <div className="flex items-center gap-1.5">
                              <LogOut className="h-3.5 w-3.5 text-blue-600" />
                              <span className={`font-mono text-sm font-medium ${item.earlyLeave ? 'text-amber-600' : 'text-blue-700'}`}>{item.clockOut}</span>
                              {item.earlyLeave && <Badge className="text-xs bg-amber-100 text-amber-700">Early</Badge>}
                            </div>
                          ) : <Badge variant="outline" className="text-xs">Still In</Badge>}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{item.hoursWorked ? `${item.hoursWorked}h` : '—'}</TableCell>
                        <TableCell>
                          {!item.clockOut ? <Badge className="bg-green-100 text-green-700 text-xs">Present</Badge> :
                            item.isLate && item.earlyLeave ? <Badge className="bg-red-100 text-red-700 text-xs">Late & Early Leave</Badge> :
                            item.isLate ? <Badge className="bg-orange-100 text-orange-700 text-xs">Late</Badge> :
                            item.earlyLeave ? <Badge className="bg-amber-100 text-amber-700 text-xs">Early Leave</Badge> :
                            <Badge className="bg-green-100 text-green-700 text-xs">Full Day</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {!item.clockOut && <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-700" onClick={() => { setClockOutDialog(item); setClockOutTime(new Date().toTimeString().slice(0, 5)); }}><LogOut className="h-3 w-3 mr-1" />Clock Out</Button>}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setForm({ ...item }); setDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Not clocked in */}
          {notClockedIn.length > 0 && (
            <Card className="border-orange-200">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-orange-700 mb-3">⏰ Not yet clocked in ({notClockedIn.length})</p>
                <div className="flex flex-wrap gap-2">
                  {notClockedIn.map(s => (
                    <Button key={s.id} variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                      setEditing(null);
                      setForm({ ...emptyForm(), staffId: s.id, staffName: s.fullName, employeeCode: s.employeeCode, department: s.department });
                      setDialog(true);
                    }}>
                      <LogIn className="h-3 w-3 mr-1 text-green-600" />{s.fullName}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {items.length === 0 && <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><Fingerprint className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No attendance records for {selectedDate}</p><Button size="sm" className="mt-3" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Record First Clock-In</Button></CardContent></Card>}
        </div>
      )}

      {/* Clock-In Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? 'Edit Record' : 'Record Clock-In'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Staff Member *</Label>
              <Select value={form.staffId} onValueChange={handleStaff}><SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.employeeCode})</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={e => f('date', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Clock In *</Label><Input type="time" value={form.clockIn} onChange={e => f('clockIn', e.target.value)} /></div>
            {editing && <div className="space-y-1.5"><Label>Clock Out</Label><Input type="time" value={form.clockOut || ''} onChange={e => f('clockOut', e.target.value)} /></div>}
            <div className="space-y-1.5"><Label>Scheduled In</Label><Input type="time" value={form.scheduledIn} onChange={e => f('scheduledIn', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Scheduled Out</Label><Input type="time" value={form.scheduledOut} onChange={e => f('scheduledOut', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Input value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="Optional" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Record'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clock-Out Dialog */}
      <Dialog open={!!clockOutDialog} onOpenChange={o => !o && setClockOutDialog(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Record Clock-Out</DialogTitle></DialogHeader>
          {clockOutDialog && <div className="space-y-4 py-2">
            <div className="bg-muted/20 rounded p-3 text-sm"><p className="font-medium">{clockOutDialog.staffName}</p><p className="text-muted-foreground">Clocked in at {clockOutDialog.clockIn}</p></div>
            <div className="space-y-1.5"><Label>Clock-Out Time</Label><Input type="time" value={clockOutTime} onChange={e => setClockOutTime(e.target.value)} /></div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setClockOutDialog(null)}>Cancel</Button><Button onClick={saveClockOut} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Clock-Out</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
