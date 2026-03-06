'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Plus, Search, Edit, Trash2, RefreshCw, Wrench, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const SERVICE_TYPES = ['Oil Change','Tire Rotation','Brake Service','Engine Tune-up','Battery Replacement','AC Service','Transmission Service','Coolant Flush','Inspection','Major Repair','Minor Repair','Cleaning','Other'];
const URGENCY = ['Routine','Important','Urgent','Critical'];

export default function VehicleMaintenancePage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [records, setRecords]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [dialog, setDialog]     = useState(false);
  const [editing, setEditing]   = useState<any>(null);

  const EMPTY = {
    vehicleId: '', serviceType: '', serviceDate: new Date().toISOString().slice(0,10),
    nextServiceDate: '', mileage: '', cost: '', vendor: '', technician: '',
    urgency: 'Routine', status: 'Completed', parts: '', description: '', invoice: '',
  };
  const [form, setForm] = useState<any>(EMPTY);
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, rRes] = await Promise.all([
        fetch('/api/transport/vehicles?limit=100'),
        fetch('/api/veh-maint?limit=200'),
      ]);
      const [vData, rData] = await Promise.all([vRes.json(), rRes.json()]);
      if (vData.success) setVehicles(vData.data || []);
      if (rData.success) setRecords(rData.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...EMPTY, ...r }); setDialog(true); };

  const save = async () => {
    if (!form.vehicleId || !form.serviceType) {
      toast({ title: 'Vehicle and service type are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/veh-maint/${editing.id}` : '/api/veh-maint';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `✅ Record ${editing ? 'updated' : 'saved'}` });
      setDialog(false); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    await fetch(`/api/veh-maint/${id}`, { method: 'DELETE' });
    toast({ title: '✅ Deleted' }); load();
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return !search || r.vehicle?.registrationNumber?.toLowerCase().includes(q) || r.serviceType?.toLowerCase().includes(q) || r.vendor?.toLowerCase().includes(q);
  });

  const totalCost = filtered.reduce((s, r) => s + parseFloat(r.cost || 0), 0);
  const overdue   = records.filter(r => r.nextServiceDate && new Date(r.nextServiceDate) < new Date() && r.status !== 'Cancelled').length;
  const upcoming  = records.filter(r => {
    if (!r.nextServiceDate) return false;
    const d = new Date(r.nextServiceDate);
    const now = new Date();
    return d >= now && d <= new Date(now.getTime() + 30 * 86400000);
  });

  const URGENCY_COLOR: Record<string,string> = { Routine: 'bg-gray-100 text-gray-700', Important: 'bg-blue-100 text-blue-700', Urgent: 'bg-amber-100 text-amber-700', Critical: 'bg-red-100 text-red-700' };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Vehicle Maintenance"
        description="Service schedules, maintenance records & cost tracking"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Log Service</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Records', value: records.length, icon: Wrench, color: 'border-l-blue-500' },
          { label: 'Total Cost', value: `PKR ${totalCost.toLocaleString()}`, icon: DollarSign, color: 'border-l-green-500', isText: true },
          { label: 'Overdue Service', value: overdue, icon: AlertTriangle, color: 'border-l-red-500' },
          { label: 'Due in 30 Days', value: upcoming.length, icon: Calendar, color: 'border-l-amber-500' },
        ].map(({ label, value, icon: Icon, color, isText }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className={`${isText ? 'text-lg' : 'text-2xl'} font-bold`}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <Icon className="h-6 w-6 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Records</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Service ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdue})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search vehicle, service, vendor..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y">{[...Array(5)].map((_,i) => <div key={i} className="h-14 animate-pulse bg-muted/20 m-2 rounded" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Car className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No maintenance records found</p>
                  <Button size="sm" className="mt-3" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Log First Service</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Vehicle</TableHead><TableHead>Service Type</TableHead><TableHead>Date</TableHead>
                      <TableHead>Next Service</TableHead><TableHead>Cost</TableHead><TableHead>Urgency</TableHead>
                      <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(r => (
                      <TableRow key={r.id} className="hover:bg-muted/20 transition-colors group">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{r.vehicle?.registrationNumber || r.vehicleId}</p>
                            <p className="text-xs text-muted-foreground">{r.vehicle?.make} {r.vehicle?.model}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{r.serviceType}</TableCell>
                        <TableCell className="text-sm">{r.serviceDate ? new Date(r.serviceDate).toLocaleDateString('en-PK') : '—'}</TableCell>
                        <TableCell>
                          {r.nextServiceDate ? (
                            <span className={`text-sm ${new Date(r.nextServiceDate) < new Date() ? 'text-red-600 font-medium' : ''}`}>
                              {new Date(r.nextServiceDate).toLocaleDateString('en-PK')}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">PKR {parseFloat(r.cost || 0).toLocaleString()}</TableCell>
                        <TableCell><Badge className={`text-xs ${URGENCY_COLOR[r.urgency] || ''}`}>{r.urgency}</Badge></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${r.status === 'Completed' ? 'text-green-700 border-green-300' : r.status === 'Pending' ? 'text-amber-700 border-amber-300' : 'text-gray-600'}`}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <div className="grid gap-3">
            {upcoming.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No upcoming services in next 30 days</p></div>
            ) : upcoming.map(r => (
              <Card key={r.id} className="border-l-4 border-l-amber-400">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{r.vehicle?.registrationNumber} — {r.serviceType}</p>
                    <p className="text-sm text-muted-foreground">Due: {new Date(r.nextServiceDate).toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                  <Badge className={URGENCY_COLOR[r.urgency] || ''}>{r.urgency}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          <div className="grid gap-3">
            {overdue === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Wrench className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>No overdue maintenance — great!</p></div>
            ) : records.filter(r => r.nextServiceDate && new Date(r.nextServiceDate) < new Date() && r.status !== 'Cancelled').map(r => (
              <Card key={r.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-red-800">{r.vehicle?.registrationNumber} — {r.serviceType}</p>
                    <p className="text-sm text-red-600">Was due: {new Date(r.nextServiceDate).toLocaleDateString('en-PK')}</p>
                    <p className="text-xs text-muted-foreground mt-1">Last serviced: {r.serviceDate ? new Date(r.serviceDate).toLocaleDateString('en-PK') : 'Never'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-red-100 text-red-700">Overdue</Badge>
                    <Button size="sm" onClick={() => openEdit(r)}>Schedule</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Log'} Maintenance Record</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Vehicle *</Label>
              <Select value={form.vehicleId} onValueChange={v => f('vehicleId', v)}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.registrationNumber} ({v.make} {v.model})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Service Type *</Label>
              <Select value={form.serviceType} onValueChange={v => f('serviceType', v)}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>{SERVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Service Date</Label><Input type="date" value={form.serviceDate} onChange={e => f('serviceDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Next Service Date</Label><Input type="date" value={form.nextServiceDate} onChange={e => f('nextServiceDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Mileage (km)</Label><Input type="number" value={form.mileage} onChange={e => f('mileage', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Cost (PKR)</Label><Input type="number" value={form.cost} onChange={e => f('cost', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Vendor/Workshop</Label><Input value={form.vendor} onChange={e => f('vendor', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Technician</Label><Input value={form.technician} onChange={e => f('technician', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Urgency</Label>
              <Select value={form.urgency} onValueChange={v => f('urgency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{URGENCY.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => f('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Completed','Pending','In Progress','Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Parts Replaced</Label><Input value={form.parts} onChange={e => f('parts', e.target.value)} placeholder="Oil filter, brake pads..." /></div>
            <div className="space-y-1.5"><Label>Invoice #</Label><Input value={form.invoice} onChange={e => f('invoice', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              {editing ? 'Update' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
