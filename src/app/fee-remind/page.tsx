'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Send, AlertTriangle, DollarSign, Users, CheckSquare, Square, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-blue-100 text-blue-700',
};
const fmt = (n: number) => `PKR ${Math.round(n).toLocaleString()}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const DEFAULT_MSG = `Dear Parent/Guardian,

This is a reminder that your child's school fee payment is overdue. Kindly pay the outstanding amount at the earliest to avoid any inconvenience.

Please contact the accounts office if you need assistance.

Regards,
School Administration`;

export default function FeeRemindersPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalStudents: 0, totalAmount: 0, critical: 0, high: 0 });
  const [loading, setLoading] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [channel, setChannel] = useState('SMS');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ classId: classFilter, page: String(page) });
      const res = await fetch(`/api/fee-remind?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      let s = data.students || [];
      if (severityFilter) s = s.filter((x: any) => x.severity === severityFilter);
      setStudents(s); setTotal(data.total || 0);
      setSummary(data.summary || {});
      setClasses(data.classes || []);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [classFilter, page, severityFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const toggleAll = () => {
    if (selected.size === students.length) setSelected(new Set());
    else setSelected(new Set(students.map(s => s.studentId)));
  };

  const sendReminders = async () => {
    if (selected.size === 0) { toast({ title: 'Select students first', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/fee-remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: Array.from(selected), message, channel }),
      });
      const data = await res.json();
      toast({ title: `✅ Reminders sent to ${data.sent} students via ${channel}` });
      setDialog(false); setSelected(new Set());
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Fee Reminders" description="Identify overdue fee defaulters by severity and send bulk SMS/WhatsApp reminders"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button size="sm" disabled={selected.size === 0} onClick={() => setDialog(true)}>
            <Send className="h-4 w-4 mr-2" />Send Reminder ({selected.size})
          </Button>
        </div>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><div className="flex items-center justify-between"><Users className="h-4 w-4 text-blue-500" /><span className="text-2xl font-bold">{summary.totalStudents}</span></div><p className="text-xs text-muted-foreground mt-1">Students with Dues</p></CardContent></Card>
        <Card className="border-l-4 border-l-amber-500"><CardContent className="p-4"><div className="flex items-center justify-between"><DollarSign className="h-4 w-4 text-amber-500" /><span className="text-lg font-bold">{fmt(summary.totalAmount)}</span></div><p className="text-xs text-muted-foreground mt-1">Total Outstanding</p></CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="p-4"><div className="flex items-center justify-between"><AlertTriangle className="h-4 w-4 text-red-500" /><span className="text-2xl font-bold text-red-700">{summary.critical}</span></div><p className="text-xs text-muted-foreground mt-1">Critical (60+ days)</p></CardContent></Card>
        <Card className="border-l-4 border-l-orange-500"><CardContent className="p-4"><div className="flex items-center justify-between"><AlertTriangle className="h-4 w-4 text-orange-500" /><span className="text-2xl font-bold text-orange-700">{summary.high}</span></div><p className="text-xs text-muted-foreground mt-1">High (30–60 days)</p></CardContent></Card>
      </div>

      {/* Filters & bulk actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="All Classes" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={severityFilter} onValueChange={v => setSeverityFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="All Severity" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{['Critical', 'High', 'Medium', 'Low'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button size="sm" onClick={() => setDialog(true)}><Send className="h-3.5 w-3.5 mr-1" />Send Reminder</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
          students.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No pending fees found</p>
              <p className="text-sm mt-1">All students are up to date! 🎉</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <button onClick={toggleAll} className="text-muted-foreground hover:text-primary">
                      {selected.size === students.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Fee Types</TableHead>
                  <TableHead className="text-right">Amount Due</TableHead>
                  <TableHead className="text-center">Days Overdue</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.studentId} className={`hover:bg-muted/20 ${selected.has(s.studentId) ? 'bg-primary/5' : ''}`}>
                    <TableCell>
                      <button onClick={() => toggleSelect(s.studentId)} className="text-muted-foreground hover:text-primary">
                        {selected.has(s.studentId) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{s.studentName}</div>
                      <div className="text-xs text-muted-foreground">{s.admissionNumber}</div>
                    </TableCell>
                    <TableCell className="text-sm">{s.className} {s.section && `(${s.section})`}</TableCell>
                    <TableCell>
                      {s.phone ? <div className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" />{s.phone}</div> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.fees.slice(0, 3).map((f: any) => (
                          <Badge key={f.id} variant="outline" className="text-xs py-0">{f.feeType}</Badge>
                        ))}
                        {s.fees.length > 3 && <Badge variant="outline" className="text-xs py-0">+{s.fees.length - 3}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-700">{fmt(s.totalPending)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${s.daysOverdue > 60 ? 'text-red-700' : s.daysOverdue > 30 ? 'text-orange-600' : s.daysOverdue > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                        {s.daysOverdue}
                      </span>
                    </TableCell>
                    <TableCell><Badge className={`text-xs ${SEVERITY_COLORS[s.severity]}`}>{s.severity}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        }
        {Math.ceil(total / limit) > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / limit)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}>Next</Button>
            </div>
          </div>
        )}
      </CardContent></Card>

      {/* Send Reminder Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Send Fee Reminder</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/20 rounded-lg p-3 text-sm">
              Sending to <strong>{selected.size}</strong> students with outstanding fees totalling <strong>{fmt(students.filter(s => selected.has(s.studentId)).reduce((t, s) => t + s.totalPending, 0))}</strong>
            </div>
            <div className="space-y-1.5"><Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="SMS">SMS</SelectItem><SelectItem value="WhatsApp">WhatsApp</SelectItem><SelectItem value="Email">Email</SelectItem><SelectItem value="App Notification">App Notification</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={8} />
              <p className="text-xs text-muted-foreground">{message.length} characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={sendReminders} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send to {selected.size} Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
