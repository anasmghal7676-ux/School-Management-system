'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Plus, Search, Clock, RefreshCw, Printer, LogOut, Users, Shield } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const PURPOSES = ['Parent Meeting','Admission Enquiry','Fee Payment','Interview','Delivery','Official Visit','Maintenance','Other'];

export default function VisitorLogPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [dateFilter, setDate]   = useState(new Date().toISOString().slice(0,10));
  const [dialog, setDialog]     = useState(false);

  const EMPTY = {
    visitorName: '', cnicNumber: '', phone: '', purpose: '', personToMeet: '',
    vehicleNumber: '', visitorCount: '1', remarks: '',
    checkInTime: new Date().toTimeString().slice(0,5),
  };
  const [form, setForm] = useState<any>(EMPTY);
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (dateFilter) params.set('date', dateFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/visitor-log?${params}`);
      const data = await res.json();
      if (data.success) setVisitors(data.data || []);
    } catch {} finally { setLoading(false); }
  }, [dateFilter, search]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.visitorName || !form.purpose) {
      toast({ title: 'Name and purpose are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/visitor-log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, visitDate: dateFilter || new Date().toISOString().slice(0,10) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: '✅ Visitor checked in' });
      setDialog(false); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const checkout = async (id: string) => {
    const time = new Date().toTimeString().slice(0,5);
    await fetch(`/api/visitor-log/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkOutTime: time, status: 'CheckedOut' }),
    });
    toast({ title: '✅ Visitor checked out' }); load();
  };

  const printBadge = (v: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Visitor Badge</title>
      <style>body{font-family:Arial;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
      .badge{border:3px solid #1a56db;border-radius:12px;padding:24px;width:280px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.15)}
      .school{font-size:11px;color:#666;margin-bottom:4px}
      .visitor{font-size:22px;font-weight:bold;color:#1a56db;margin:8px 0}
      .purpose{font-size:13px;background:#e8f0ff;color:#1a56db;padding:4px 12px;border-radius:20px;margin:8px auto;display:inline-block}
      .info{font-size:12px;color:#555;margin-top:12px;line-height:1.8}
      .badge-no{font-size:11px;color:#999;margin-top:16px;border-top:1px solid #eee;padding-top:8px}
      </style></head>
      <body><div class="badge">
        <div class="school">🏫 VISITOR PASS</div>
        <div class="visitor">${v.visitorName}</div>
        <div class="purpose">${v.purpose}</div>
        <div class="info">
          <b>To Meet:</b> ${v.personToMeet || 'N/A'}<br>
          <b>Phone:</b> ${v.phone || 'N/A'}<br>
          <b>Check-in:</b> ${v.checkInTime || 'N/A'}<br>
          <b>Date:</b> ${v.visitDate ? new Date(v.visitDate).toLocaleDateString('en-PK') : 'Today'}
        </div>
        <div class="badge-no">CNIC: ${v.cnicNumber || '—'}</div>
      </div></body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const filtered = visitors.filter(v => {
    const q = search.toLowerCase();
    return !search || v.visitorName?.toLowerCase().includes(q) || v.cnicNumber?.includes(q) || v.phone?.includes(q);
  });

  const stillInside = filtered.filter(v => v.status !== 'CheckedOut').length;
  const todayTotal  = filtered.length;

  const fmtTime = (t: string) => {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    return `${h > 12 ? h-12 : h || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Visitor Log"
        description="Track and manage school visitors with digital check-in/out"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm" onClick={() => { setForm(EMPTY); setDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Check In Visitor
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: "Today's Visitors", value: todayTotal, icon: Users, color: 'border-l-blue-500' },
          { label: 'Currently Inside', value: stillInside, icon: Shield, color: 'border-l-green-500' },
          { label: 'Checked Out', value: todayTotal - stillInside, icon: LogOut, color: 'border-l-gray-400' },
          { label: 'Pending Checkout', value: stillInside, icon: Clock, color: 'border-l-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              <Icon className="h-6 w-6 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex gap-3 flex-wrap items-center">
          <Input type="date" value={dateFilter} onChange={e => setDate(e.target.value)} className="w-44" />
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search name, CNIC, phone..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">{[...Array(6)].map((_,i) => <div key={i} className="h-14 animate-pulse bg-muted/20 m-2 rounded" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No visitors for this date</p>
              <Button size="sm" className="mt-3" onClick={() => { setForm(EMPTY); setDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />Check In First Visitor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>#</TableHead>
                  <TableHead>Visitor</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Person to Meet</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v, i) => (
                  <TableRow key={v.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="text-muted-foreground text-sm">{i+1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{v.visitorName}</p>
                        <p className="text-xs text-muted-foreground">{v.phone} {v.cnicNumber && `· ${v.cnicNumber}`}</p>
                        {parseInt(v.visitorCount) > 1 && <Badge variant="outline" className="text-xs mt-0.5">{v.visitorCount} people</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{v.purpose}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{v.personToMeet || '—'}</TableCell>
                    <TableCell className="text-sm font-mono">{fmtTime(v.checkInTime)}</TableCell>
                    <TableCell className="text-sm font-mono">{v.checkOutTime ? fmtTime(v.checkOutTime) : <span className="text-amber-500">Inside</span>}</TableCell>
                    <TableCell>
                      {v.status === 'CheckedOut' ? (
                        <Badge className="text-xs bg-gray-100 text-gray-700">Checked Out</Badge>
                      ) : (
                        <Badge className="text-xs bg-green-100 text-green-700 animate-pulse-soft">● Inside</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => printBadge(v)}>
                          <Printer className="h-3.5 w-3.5 mr-1" />Badge
                        </Button>
                        {v.status !== 'CheckedOut' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-700" onClick={() => checkout(v.id)}>
                            <LogOut className="h-3.5 w-3.5 mr-1" />Out
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Check In Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Check In Visitor</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Visitor Name *</Label><Input value={form.visitorName} onChange={e => f('visitorName', e.target.value)} placeholder="Full name" /></div>
            <div className="space-y-1.5"><Label>CNIC Number</Label><Input value={form.cnicNumber} onChange={e => f('cnicNumber', e.target.value)} placeholder="XXXXX-XXXXXXX-X" /></div>
            <div className="space-y-1.5"><Label>Phone Number</Label><Input value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="03XX-XXXXXXX" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Purpose of Visit *</Label>
              <Select value={form.purpose} onValueChange={v => f('purpose', v)}>
                <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                <SelectContent>{PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Person to Meet</Label><Input value={form.personToMeet} onChange={e => f('personToMeet', e.target.value)} placeholder="Teacher/Principal name" /></div>
            <div className="space-y-1.5"><Label>No. of Visitors</Label>
              <Select value={form.visitorCount} onValueChange={v => f('visitorCount', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['1','2','3','4','5','6','7','8','9','10+'].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Vehicle Number</Label><Input value={form.vehicleNumber} onChange={e => f('vehicleNumber', e.target.value)} placeholder="LEA-1234" /></div>
            <div className="space-y-1.5"><Label>Check-in Time</Label><Input type="time" value={form.checkInTime} onChange={e => f('checkInTime', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Remarks</Label><Input value={form.remarks} onChange={e => f('remarks', e.target.value)} placeholder="Additional notes..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              Check In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
