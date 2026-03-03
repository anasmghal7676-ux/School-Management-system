'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Edit, Trash2, Search, Bus, MapPin, Clock, Users, 
  Route, Car, AlertTriangle, CheckCircle2, Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  driverName: string | null;
  driverPhone: string | null;
  driverLicense: string | null;
  conductorName: string | null;
  conductorPhone: string | null;
  status: string;
  insuranceExpiry: string | null;
  fitnessExpiry: string | null;
  routeCount: number;
  studentCount: number;
}

interface Route {
  id: string;
  routeNumber: string;
  routeName: string;
  startingPoint: string;
  endingPoint: string;
  totalDistanceKm: number | null;
  pickupTime: string | null;
  dropTime: string | null;
  monthlyFee: number | null;
  isActive: boolean;
  stopCount: number;
  studentCount: number;
}

const VEHICLE_TYPES = [
  'Bus',
  'Van',
  'Coaster',
  'Rickshaw',
  'Mini Bus',
];

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active', color: 'default' },
  { value: 'Maintenance', label: 'Maintenance', color: 'secondary' },
  { value: 'Retired', label: 'Retired', color: 'outline' },
];

// ─── Transport Assignments Sub-Component ─────────────────────────────────────
function TransportAssignmentsTab({ routes }: { routes: any[] }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [acYears, setAcYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [routeFilter, setRouteFilter] = useState('all');
  const [selYear, setSelYear] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ studentId: '', routeId: '', stopId: '', monthlyFee: '', academicYearId: '' });
  const [stops, setStops] = useState<any[]>([]);

  useEffect(() => { fetchAcYears(); fetchStudents(); }, []);
  useEffect(() => { if (selYear) fetchAssignments(); }, [selYear, routeFilter]);
  useEffect(() => {
    if (form.routeId) {
      const route = routes.find(r => r.id === form.routeId);
      setStops(route?.stops || []);
      setForm(f => ({ ...f, stopId: '', monthlyFee: route?.monthlyFee ? String(route.monthlyFee) : f.monthlyFee }));
    }
  }, [form.routeId, routes]);

  const fetchAcYears = async () => {
    const r = await fetch('/api/acad-years');
    const j = await r.json();
    if (j.success) { setAcYears(j.data); const cur = j.data.find((y: any) => y.isCurrent); if (cur) { setSelYear(cur.id); setForm(f => ({ ...f, academicYearId: cur.id })); } }
  };
  const fetchStudents = async () => {
    const r = await fetch('/api/students?limit=300&status=active');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || []);
  };
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ academicYearId: selYear });
      if (routeFilter !== 'all') p.append('routeId', routeFilter);
      const r = await fetch(`/api/transport/assignments?${p}`);
      const j = await r.json();
      if (j.success) setAssignments(j.data.assignments);
    } finally { setLoading(false); }
  };
  const handleAdd = async () => {
    if (!form.studentId || !form.routeId || !form.stopId) {
      toast({ title: 'Required', description: 'Student, route and stop required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/transport/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, academicYearId: selYear }),
      });
      const j = await r.json();
      if (j.success) { toast({ title: 'Assigned' }); setAddOpen(false); setForm({ studentId: '', routeId: '', stopId: '', monthlyFee: '', academicYearId: selYear }); fetchAssignments(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed', variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Student Assignments</CardTitle><CardDescription>Assign students to routes and stops</CardDescription></div>
        <div className="flex gap-2">
          <Select value={selYear} onValueChange={setSelYear}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>{acYears.map((y: any) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={routeFilter} onValueChange={setRouteFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Routes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Routes</SelectItem>
              {routes.map(r => <SelectItem key={r.id} value={r.id}>{r.routeNumber} – {r.routeName}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setForm({ studentId: '', routeId: '', stopId: '', monthlyFee: '', academicYearId: selYear }); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Assign Student
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <div className="flex justify-center py-12 text-muted-foreground">Loading...</div>
          : assignments.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-3" /><p>No assignments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead><TableHead>Class</TableHead>
                  <TableHead>Route</TableHead><TableHead>Stop</TableHead>
                  <TableHead>Pickup Time</TableHead><TableHead className="text-right">Monthly Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a: any) => (
                  <TableRow key={a.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell><div className="font-medium text-sm">{a.student?.fullName}</div><div className="text-xs text-muted-foreground">{a.student?.admissionNumber}</div></TableCell>
                    <TableCell className="text-sm">{a.student?.class?.name || '—'}</TableCell>
                    <TableCell className="text-sm"><span className="font-mono text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">{a.route?.routeNumber}</span> {a.route?.routeName}</TableCell>
                    <TableCell className="text-sm">{a.stop?.stopName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.stop?.pickupTime || '—'}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{a.monthlyFee ? `PKR ${a.monthlyFee.toLocaleString()}` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </CardContent>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Student to Route</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Student *</Label>
              <Select value={form.studentId} onValueChange={v => sf('studentId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Route *</Label>
              <Select value={form.routeId} onValueChange={v => sf('routeId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>{routes.map(r => <SelectItem key={r.id} value={r.id}>{r.routeNumber} – {r.routeName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Boarding Stop *</Label>
              <Select value={form.stopId} onValueChange={v => sf('stopId', v)} disabled={!form.routeId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select stop" /></SelectTrigger>
                <SelectContent>{stops.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.stopName} {s.pickupTime ? `(${s.pickupTime})` : ''}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Monthly Fee (PKR)</Label><Input className="mt-1" type="number" value={form.monthlyFee} onChange={e => sf('monthlyFee', e.target.value)} placeholder="Auto-filled from route" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function TransportPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('vehicles');
  const [dialogType, setDialogType] = useState<'vehicle' | 'route'>('vehicle');
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: '',
    capacity: 20,
    driverName: '',
    driverPhone: '',
    driverLicense: '',
    conductorName: '',
    conductorPhone: '',
    status: 'Active',
    routeNumber: '',
    routeName: '',
    startingPoint: '',
    endingPoint: '',
    totalDistanceKm: '',
    pickupTime: '',
    dropTime: '',
    monthlyFee: '',
  });

  useEffect(() => {
    fetchVehicles();
    fetchRoutes();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/transport/vehicles');
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/transport/routes');
      if (response.ok) {
        const data = await response.json();
        setRoutes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = dialogType === 'vehicle' 
      ? `/api/transport/vehicles${editingItem ? `/${editingItem.id}` : ''}`
      : `/api/transport/routes${editingItem ? `/${editingItem.id}` : ''}`;
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${dialogType === 'vehicle' ? 'Vehicle' : 'Route'} ${editingItem ? 'updated' : 'created'} successfully`,
        });
        setDialogOpen(false);
        resetForm();
        fetchVehicles();
        fetchRoutes();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to save ${dialogType}`,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: any, type: 'vehicle' | 'route') => {
    setDialogType(type);
    setEditingItem(item);
    setFormData(type === 'vehicle' ? {
      vehicleNumber: item.vehicleNumber,
      vehicleType: item.vehicleType,
      capacity: item.capacity,
      driverName: item.driverName || '',
      driverPhone: item.driverPhone || '',
      driverLicense: item.driverLicense || '',
      conductorName: item.conductorName || '',
      conductorPhone: item.conductorPhone || '',
      status: item.status,
    } : {
      routeNumber: item.routeNumber,
      routeName: item.routeName,
      startingPoint: item.startingPoint,
      endingPoint: item.endingPoint,
      totalDistanceKm: item.totalDistanceKm?.toString() || '',
      pickupTime: item.pickupTime || '',
      dropTime: item.dropTime || '',
      monthlyFee: item.monthlyFee?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, type: 'vehicle' | 'route') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const response = await fetch(`/api/transport/${type === 'vehicle' ? 'vehicles' : 'routes'}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
        });
        fetchVehicles();
        fetchRoutes();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to delete ${type}`,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      vehicleNumber: '',
      vehicleType: '',
      capacity: 20,
      driverName: '',
      driverPhone: '',
      driverLicense: '',
      conductorName: '',
      conductorPhone: '',
      status: 'Active',
      routeNumber: '',
      routeName: '',
      startingPoint: '',
      endingPoint: '',
      totalDistanceKm: '',
      pickupTime: '',
      dropTime: '',
      monthlyFee: '',
    });
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.driverName && v.driverName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity, 0);
  const totalStudents = vehicles.reduce((sum, v) => sum + v.studentCount, 0);

  return (
    <div className="flex-1 space-y-6 p-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Transport Management
          </h2>
          <p className="text-muted-foreground">
            Manage school transport system, routes, and vehicles
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
            onClick={() => {
              setDialogType('vehicle');
              setDialogOpen(true);
            }}
          >
            <Bus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </motion.div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vehicles" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600">
            <Car className="h-4 w-4 mr-2" />
            Vehicles
          </TabsTrigger>
          <TabsTrigger value="routes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600">
            <Route className="h-4 w-4 mr-2" />
            Routes
          </TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600">
            <Users className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-6">
          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-6 md:grid-cols-4"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vehicles.length}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border-l-4 border-l-teal-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {vehicles.filter(v => v.status === 'Active').length}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCapacity}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students Transported</CardTitle>
                  <Bus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStudents}</div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Vehicles Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Vehicle Fleet</CardTitle>
                    <CardDescription>
                      Manage school transport vehicles
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search vehicles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mr-2" />
                    <span className="text-muted-foreground">Loading vehicles...</span>
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No vehicles found</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Conductor</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Routes</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredVehicles.map((vehicle, index) => (
                            <motion.tr
                              key={vehicle.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4 text-emerald-600" />
                                  {vehicle.vehicleNumber}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{vehicle.vehicleType}</Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{vehicle.driverName || '-'}</div>
                                  <div className="text-xs text-muted-foreground">{vehicle.driverPhone || ''}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{vehicle.conductorName || '-'}</div>
                                  <div className="text-xs text-muted-foreground">{vehicle.conductorPhone || ''}</div>
                                </div>
                              </TableCell>
                              <TableCell>{vehicle.capacity}</TableCell>
                              <TableCell>{vehicle.studentCount}</TableCell>
                              <TableCell>{vehicle.routeCount}</TableCell>
                              <TableCell>
                                <Badge variant={vehicle.status === 'Active' ? 'default' : 'secondary'}>
                                  {vehicle.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(vehicle, 'vehicle')}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDelete(vehicle.id, 'vehicle')}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </motion.div>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transport Routes</CardTitle>
                  <CardDescription>Manage transport routes and stops</CardDescription>
                </div>
                <Button 
                  className="bg-gradient-to-r from-emerald-600 to-teal-600"
                  onClick={() => {
                    setDialogType('route');
                    setDialogOpen(true);
                  }}
                >
                  <Route className="mr-2 h-4 w-4" />
                  Add Route
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Route management module - Select this tab to manage routes</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <TransportAssignmentsTab routes={routes} />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'vehicle' ? 'Manage Vehicle' : 'Manage Route'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'vehicle' ? 'Add or update vehicle information' : 'Add or update route information'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {dialogType === 'vehicle' ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                    <Input
                      id="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      placeholder="e.g., LEA-1234"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="vehicleType">Vehicle Type *</Label>
                      <Select
                        value={formData.vehicleType}
                        onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="capacity">Capacity *</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="driverName">Driver Name</Label>
                      <Input
                        id="driverName"
                        value={formData.driverName}
                        onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="driverPhone">Driver Phone</Label>
                      <Input
                        id="driverPhone"
                        type="tel"
                        value={formData.driverPhone}
                        onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="conductorName">Conductor Name</Label>
                      <Input
                        id="conductorName"
                        value={formData.conductorName}
                        onChange={(e) => setFormData({ ...formData, conductorName: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="conductorPhone">Conductor Phone</Label>
                      <Input
                        id="conductorPhone"
                        type="tel"
                        value={formData.conductorPhone}
                        onChange={(e) => setFormData({ ...formData, conductorPhone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="routeNumber">Route Number *</Label>
                    <Input
                      id="routeNumber"
                      value={formData.routeNumber}
                      onChange={(e) => setFormData({ ...formData, routeNumber: e.target.value })}
                      placeholder="e.g., R-01"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="routeName">Route Name *</Label>
                    <Input
                      id="routeName"
                      value={formData.routeName}
                      onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                      placeholder="e.g., North Karachi Route"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startingPoint">Starting Point *</Label>
                      <Input
                        id="startingPoint"
                        value={formData.startingPoint}
                        onChange={(e) => setFormData({ ...formData, startingPoint: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endingPoint">Ending Point *</Label>
                      <Input
                        id="endingPoint"
                        value={formData.endingPoint}
                        onChange={(e) => setFormData({ ...formData, endingPoint: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="pickupTime">Pickup Time</Label>
                      <Input
                        id="pickupTime"
                        type="time"
                        value={formData.pickupTime}
                        onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dropTime">Drop Time</Label>
                      <Input
                        id="dropTime"
                        type="time"
                        value={formData.dropTime}
                        onChange={(e) => setFormData({ ...formData, dropTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="totalDistanceKm">Distance (km)</Label>
                      <Input
                        id="totalDistanceKm"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.totalDistanceKm}
                        onChange={(e) => setFormData({ ...formData, totalDistanceKm: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="monthlyFee">Monthly Fee (PKR)</Label>
                      <Input
                        id="monthlyFee"
                        type="number"
                        min="0"
                        value={formData.monthlyFee}
                        onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
