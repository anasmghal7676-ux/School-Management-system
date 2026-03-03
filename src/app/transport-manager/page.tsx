'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Edit, Trash2, RefreshCw, Search, Bus, MapPin, Users, Route, ChevronDown, ChevronRight, Clock, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const VEHICLE_TYPES = ['Bus', 'Van', 'Coaster', 'Rickshaw', 'Mini Bus'];
const fmt = (n: number | null) => n != null ? `PKR ${Number(n).toLocaleString('en-PK')}` : '—';

export default function TransportManagerPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalRoutes: 0, activeRoutes: 0, totalVehicles: 0, totalStudents: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

  // Dialogs
  const [routeDialog, setRouteDialog] = useState(false);
  const [vehicleDialog, setVehicleDialog] = useState(false);
  const [stopDialog, setStopDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [stopRouteId, setStopRouteId] = useState('');
  const [saving, setSaving] = useState(false);

  const [routeForm, setRouteForm] = useState({ routeNumber: '', routeName: '', startingPoint: '', endingPoint: '', totalDistanceKm: '', pickupTime: '', dropTime: '', monthlyFee: '', vehicleId: '', isActive: true, description: '' });
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: '', vehicleType: 'Bus', capacity: '40', driverName: '', driverPhone: '', conductorName: '', conductorPhone: '' });
  const [stopForm, setStopForm] = useState({ stopName: '', stopOrder: '1', estimatedTime: '', landmark: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search });
      const res = await fetch(`/api/transport?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRoutes(data.routes || []);
      setVehicles(data.vehicles || []);
      setSummary(data.summary || {});
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => {
    const next = new Set(expandedRoutes);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedRoutes(next);
  };

  const saveRoute = async () => {
    if (!routeForm.routeNumber || !routeForm.routeName) { toast({ title: 'Route number and name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/transport', {
        method: editingRoute ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'route', ...(editingRoute ? { id: editingRoute.id } : {}), ...routeForm }),
      });
      toast({ title: editingRoute ? 'Route updated' : 'Route created' });
      setRouteDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveVehicle = async () => {
    if (!vehicleForm.vehicleNumber) { toast({ title: 'Vehicle number required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/transport', {
        method: editingVehicle ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'vehicle', ...(editingVehicle ? { id: editingVehicle.id } : {}), ...vehicleForm }),
      });
      toast({ title: editingVehicle ? 'Vehicle updated' : 'Vehicle added' });
      setVehicleDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveStop = async () => {
    if (!stopForm.stopName) { toast({ title: 'Stop name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'stop', routeId: stopRouteId, ...stopForm }),
      });
      toast({ title: 'Stop added' });
      setStopDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (entity: string, id: string) => {
    if (!confirm(`Delete this ${entity}?`)) return;
    await fetch('/api/transport', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity, id }) });
    toast({ title: 'Deleted' }); load();
  };

  const openAddRoute = () => {
    setEditingRoute(null);
    setRouteForm({ routeNumber: '', routeName: '', startingPoint: '', endingPoint: '', totalDistanceKm: '', pickupTime: '', dropTime: '', monthlyFee: '', vehicleId: '', isActive: true, description: '' });
    setRouteDialog(true);
  };

  const openEditRoute = (route: any) => {
    setEditingRoute(route);
    setRouteForm({ routeNumber: route.routeNumber, routeName: route.routeName, startingPoint: route.startingPoint, endingPoint: route.endingPoint, totalDistanceKm: route.totalDistanceKm ? String(route.totalDistanceKm) : '', pickupTime: route.pickupTime || '', dropTime: route.dropTime || '', monthlyFee: route.monthlyFee ? String(route.monthlyFee) : '', vehicleId: route.vehicleId || '', isActive: route.isActive, description: route.description || '' });
    setRouteDialog(true);
  };

  const rf = (k: string, v: any) => setRouteForm(f => ({ ...f, [k]: v }));
  const vf = (k: string, v: string) => setVehicleForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Transport Route Manager"
        description="Manage bus routes, stops, vehicles, and student assignments"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditingVehicle(null); setVehicleForm({ vehicleNumber: '', vehicleType: 'Bus', capacity: '40', driverName: '', driverPhone: '', conductorName: '', conductorPhone: '' }); setVehicleDialog(true); }}><Bus className="h-4 w-4 mr-2" />Add Vehicle</Button>
            <Button size="sm" onClick={openAddRoute}><Plus className="h-4 w-4 mr-2" />Add Route</Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Routes', value: summary.totalRoutes, icon: <Route className="h-4 w-4 text-blue-500" />, color: 'border-l-blue-500' },
          { label: 'Active Routes', value: summary.activeRoutes, icon: <Route className="h-4 w-4 text-green-500" />, color: 'border-l-green-500' },
          { label: 'Vehicles', value: summary.totalVehicles, icon: <Bus className="h-4 w-4 text-slate-500" />, color: 'border-l-slate-500' },
          { label: 'Students on Transport', value: summary.totalStudents, icon: <Users className="h-4 w-4 text-purple-500" />, color: 'border-l-purple-500' },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="routes">
        <TabsList>
          <TabsTrigger value="routes">Routes & Stops</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
        </TabsList>

        {/* Routes Tab */}
        <TabsContent value="routes" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search routes..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
          ) : routes.length === 0 ? (
            <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><Route className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No routes configured</p><Button size="sm" className="mt-3" onClick={openAddRoute}><Plus className="h-4 w-4 mr-2" />Add First Route</Button></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {routes.map(route => {
                const exp = expandedRoutes.has(route.id);
                return (
                  <Card key={route.id} className="overflow-hidden">
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 card-hover" onClick={() => toggle(route.id)}>
                      <div className="flex items-center gap-3">
                        {exp ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-700">{route.routeNumber}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{route.routeName}</span>
                            <Badge className={`text-xs ${route.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{route.isActive ? 'Active' : 'Inactive'}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                            <span><MapPin className="h-3 w-3 inline mr-0.5" />{route.startingPoint} → {route.endingPoint}</span>
                            {route.pickupTime && <span><Clock className="h-3 w-3 inline mr-0.5" />Pickup: {route.pickupTime}</span>}
                            {route.monthlyFee && <span><DollarSign className="h-3 w-3 inline mr-0.5" />{fmt(route.monthlyFee)}/mo</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                        {route.vehicle && <Badge variant="outline" className="text-xs"><Bus className="h-3 w-3 mr-1" />{route.vehicle.vehicleNumber}</Badge>}
                        <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />{route.assignments.length} students</Badge>
                        <Button variant="outline" size="sm" className="h-7" onClick={() => { setStopRouteId(route.id); setStopForm({ stopName: '', stopOrder: String(route.stops.length + 1), estimatedTime: '', landmark: '' }); setStopDialog(true); }}>+ Stop</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditRoute(route)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del('route', route.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>

                    {exp && (
                      <div className="border-t p-4 bg-muted/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Stops */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Route Stops ({route.stops.length})</h4>
                            {route.stops.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">No stops added yet</p>
                            ) : (
                              <div className="space-y-1">
                                {route.stops.map((stop: any) => (
                                  <div key={stop.id} className="flex items-center gap-2 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">{stop.stopOrder}</div>
                                    <span className="flex-1">{stop.stopName}</span>
                                    {stop.estimatedTime && <span className="text-xs text-muted-foreground">{stop.estimatedTime}</span>}
                                    <button onClick={() => del('stop', stop.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Students */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assigned Students ({route.assignments.length})</h4>
                            {route.assignments.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">No students assigned yet</p>
                            ) : (
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {route.assignments.map((a: any) => (
                                  <div key={a.id} className="text-xs flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                    <span>{a.student?.fullName}</span>
                                    <span className="text-muted-foreground">({a.student?.admissionNumber})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="mt-4">
          {vehicles.length === 0 ? (
            <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><Bus className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No vehicles registered</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map(v => (
                <Card key={v.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Bus className="h-5 w-5 text-slate-600" /></div>
                        <div>
                          <div className="font-bold">{v.vehicleNumber}</div>
                          <Badge variant="outline" className="text-xs">{v.vehicleType}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingVehicle(v); setVehicleForm({ vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType, capacity: String(v.capacity), driverName: v.driverName || '', driverPhone: v.driverPhone || '', conductorName: v.conductorName || '', conductorPhone: v.conductorPhone || '' }); setVehicleDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del('vehicle', v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1"><Users className="h-3 w-3" />Capacity: {v.capacity} seats</div>
                      {v.driverName && <div>Driver: {v.driverName} {v.driverPhone ? `· ${v.driverPhone}` : ''}</div>}
                      {v.conductorName && <div>Conductor: {v.conductorName}</div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Route Dialog */}
      <Dialog open={routeDialog} onOpenChange={setRouteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingRoute ? 'Edit Route' : 'Add Transport Route'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Route Number *</Label><Input value={routeForm.routeNumber} onChange={e => rf('routeNumber', e.target.value)} placeholder="R-01" /></div>
            <div className="space-y-1.5"><Label>Route Name *</Label><Input value={routeForm.routeName} onChange={e => rf('routeName', e.target.value)} placeholder="Garden Town Route" /></div>
            <div className="space-y-1.5"><Label>Starting Point</Label><Input value={routeForm.startingPoint} onChange={e => rf('startingPoint', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Ending Point</Label><Input value={routeForm.endingPoint} onChange={e => rf('endingPoint', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Distance (km)</Label><Input type="number" value={routeForm.totalDistanceKm} onChange={e => rf('totalDistanceKm', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Monthly Fee (PKR)</Label><Input type="number" value={routeForm.monthlyFee} onChange={e => rf('monthlyFee', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Pickup Time</Label><Input type="time" value={routeForm.pickupTime} onChange={e => rf('pickupTime', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Drop Time</Label><Input type="time" value={routeForm.dropTime} onChange={e => rf('dropTime', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Assigned Vehicle</Label><Select value={routeForm.vehicleId} onValueChange={v => rf('vehicleId', v)}><SelectTrigger><SelectValue placeholder="Select vehicle (optional)" /></SelectTrigger><SelectContent><SelectItem value="">None</SelectItem>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicleNumber} ({v.vehicleType})</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" checked={routeForm.isActive} onChange={e => rf('isActive', e.target.checked)} className="w-4 h-4" id="isActive" />
              <Label htmlFor="isActive">Active Route</Label>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRouteDialog(false)}>Cancel</Button><Button onClick={saveRoute} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingRoute ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vehicle Dialog */}
      <Dialog open={vehicleDialog} onOpenChange={setVehicleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Vehicle Number *</Label><Input value={vehicleForm.vehicleNumber} onChange={e => vf('vehicleNumber', e.target.value)} placeholder="LHR-1234" /></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={vehicleForm.vehicleType} onValueChange={v => vf('vehicleType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Capacity (seats)</Label><Input type="number" value={vehicleForm.capacity} onChange={e => vf('capacity', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Driver Name</Label><Input value={vehicleForm.driverName} onChange={e => vf('driverName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Driver Phone</Label><Input value={vehicleForm.driverPhone} onChange={e => vf('driverPhone', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Conductor Name</Label><Input value={vehicleForm.conductorName} onChange={e => vf('conductorName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Conductor Phone</Label><Input value={vehicleForm.conductorPhone} onChange={e => vf('conductorPhone', e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setVehicleDialog(false)}>Cancel</Button><Button onClick={saveVehicle} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingVehicle ? 'Update' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stop Dialog */}
      <Dialog open={stopDialog} onOpenChange={setStopDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Route Stop</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Stop Name *</Label><Input value={stopForm.stopName} onChange={e => setStopForm(f => ({ ...f, stopName: e.target.value }))} placeholder="e.g. Garden Town Stop" /></div>
            <div className="space-y-1.5"><Label>Order</Label><Input type="number" min="1" value={stopForm.stopOrder} onChange={e => setStopForm(f => ({ ...f, stopOrder: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Time (HH:MM)</Label><Input value={stopForm.estimatedTime} onChange={e => setStopForm(f => ({ ...f, estimatedTime: e.target.value }))} placeholder="07:30" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Landmark</Label><Input value={stopForm.landmark} onChange={e => setStopForm(f => ({ ...f, landmark: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setStopDialog(false)}>Cancel</Button><Button onClick={saveStop} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Add Stop</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
