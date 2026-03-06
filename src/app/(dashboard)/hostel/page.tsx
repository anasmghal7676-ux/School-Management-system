'use client';

export const dynamic = "force-dynamic"

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
  Plus, Edit, Trash2, Search, Building2, Bed, Users, 
  MapPin, DoorOpen, Calendar, DollarSign, CheckCircle2,
  Loader2, Home, UserCheck, LogIn, FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Block {
  id: string;
  blockName: string;
  blockType: string;
  totalRooms: number;
  capacity: number;
  roomCount: number;
  occupiedRooms: number;
  totalStudents: number;
  wardenName: string | null;
}

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  floorNumber: number;
  monthlyFee: number | null;
  status: string;
  blockId: string;
  blockName: string;
  occupiedBeds: number;
}

interface Admission {
  id: string;
  studentName: string;
  admissionNumber: string;
  roomNumber: string;
  blockName: string;
  monthlyFee: number | null;
  admissionDate: string;
  expectedVacateDate: string | null;
  status: string;
}

const ROOM_TYPES = [
  'Single',
  'Double',
  'Triple',
  'Quad',
  'Dormitory',
];

const BLOCK_TYPES = [
  'Boys',
  'Girls',
];

const STATUS_OPTIONS = [
  { value: 'Available', label: 'Available', color: 'default' },
  { value: 'Occupied', label: 'Occupied', color: 'secondary' },
  { value: 'Maintenance', label: 'Maintenance', color: 'outline' },
];

function HostelAdmissionsView() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hostel/admissions?limit=50&status=Active')
      .then(r => r.json())
      .then(j => { if (j.success) setAdmissions(j.data?.admissions || j.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" /></div>;

  if (admissions.length === 0) return (
    <div className="text-center py-10 text-muted-foreground">
      <p>No active hostel admissions</p>
      <p className="text-sm mt-1">Use the API or register students via hostel rooms</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b">{['Student','Room','Block','Check-in','Status'].map(h => <th key={h} className="text-left p-2 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
        <tbody>
          {admissions.slice(0, 15).map((a: any) => (
            <tr key={a.id} className="border-b hover:bg-muted/30">
              <td className="p-2 font-medium">{a.student?.fullName || '—'}<div className="text-xs text-muted-foreground">{a.student?.admissionNumber}</div></td>
              <td className="p-2">{a.room?.roomNumber || '—'}</td>
              <td className="p-2">{a.room?.block?.blockName || '—'}</td>
              <td className="p-2 text-muted-foreground">{a.checkInDate ? new Date(a.checkInDate).toLocaleDateString() : '—'}</td>
              <td className="p-2"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{a.status || 'Active'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {admissions.length > 15 && <p className="text-xs text-muted-foreground mt-2 text-center">Showing 15 of {admissions.length} admissions</p>}
    </div>
  );
}

export default function HostelPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('blocks');
  const [dialogType, setDialogType] = useState<'block' | 'room' | 'admission'>('block');
  const [formData, setFormData] = useState({
    blockName: '',
    blockType: 'Boys',
    totalRooms: 10,
    wardenId: '',
    roomNumber: '',
    roomType: 'Double',
    capacity: 2,
    floorNumber: 1,
    monthlyFee: '',
    studentId: '',
    roomId: '',
    expectedVacateDate: '',
  });

  useEffect(() => {
    fetchBlocks();
    fetchRooms();
    fetchAdmissions();
  }, []);

  const fetchBlocks = async () => {
    try {
      const response = await fetch('/api/hostel/blocks');
      if (response.ok) {
        const data = await response.json();
        setBlocks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/hostel/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const fetchAdmissions = async () => {
    try {
      const response = await fetch('/api/hostel/admissions');
      if (response.ok) {
        const data = await response.json();
        setAdmissions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch admissions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = dialogType === 'block' ? 'blocks' : dialogType === 'room' ? 'rooms' : 'admissions';
    const url = `/api/hostel/${endpoint}${editingItem ? `/${editingItem.id}` : ''}`;
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
          description: `${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} ${editingItem ? 'updated' : 'created'} successfully`,
        });
        setDialogOpen(false);
        resetForm();
        fetchBlocks();
        fetchRooms();
        fetchAdmissions();
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

  const handleEdit = (item: any, type: 'block' | 'room' | 'admission') => {
    setDialogType(type);
    setEditingItem(item);
    setFormData(type === 'block' ? {
      blockName: item.blockName,
      blockType: item.blockType,
      totalRooms: item.totalRooms,
      wardenId: item.wardenId || '',
    } : type === 'room' ? {
      roomNumber: item.roomNumber,
      roomType: item.roomType,
      capacity: item.capacity,
      floorNumber: item.floorNumber,
      monthlyFee: item.monthlyFee?.toString() || '',
    } : {
      studentId: item.studentId,
      roomId: item.roomId,
      expectedVacateDate: item.expectedVacateDate ? item.expectedVacateDate.split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, type: 'block' | 'room' | 'admission') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const endpoint = type === 'block' ? 'blocks' : type === 'room' ? 'rooms' : 'admissions';
      const response = await fetch(`/api/hostel/${endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
        });
        fetchBlocks();
        fetchRooms();
        fetchAdmissions();
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
      blockName: '',
      blockType: 'Boys',
      totalRooms: 10,
      wardenId: '',
      roomNumber: '',
      roomType: 'Double',
      capacity: 2,
      floorNumber: 1,
      monthlyFee: '',
      studentId: '',
      roomId: '',
      expectedVacateDate: '',
    });
  };

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.blockName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCapacity = blocks.reduce((sum, b) => sum + b.capacity, 0);
  const totalStudents = blocks.reduce((sum, b) => sum + b.totalStudents, 0);
  const totalRoomsCount = blocks.reduce((sum, b) => sum + b.roomCount, 0);

  return (
    <div className="flex-1 space-y-6 p-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Hostel Management
          </h2>
          <p className="text-muted-foreground">
            Manage hostel blocks, rooms, and student accommodations
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
            onClick={() => {
              setDialogType('block');
              setDialogOpen(true);
            }}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Add Block
          </Button>
        </motion.div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="blocks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600">
            <Building2 className="h-4 w-4 mr-2" />
            Blocks
          </TabsTrigger>
          <TabsTrigger value="rooms" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600">
            <DoorOpen className="h-4 w-4 mr-2" />
            Rooms
          </TabsTrigger>
          <TabsTrigger value="admissions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600">
            <UserCheck className="h-4 w-4 mr-2" />
            Admissions
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600">
            <DollarSign className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blocks" className="space-y-6">
          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-6 md:grid-cols-4"
          >
            {[
              { title: 'Total Blocks', value: blocks.length, icon: Building2, color: 'purple' },
              { title: 'Total Rooms', value: totalRoomsCount, icon: DoorOpen, color: 'pink' },
              { title: 'Total Beds', value: totalCapacity, icon: Bed, color: 'violet' },
              { title: 'Occupied Beds', value: totalStudents, icon: Users, color: 'fuchsia' },
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className={`border-l-4 border-l-${stat.color}-500 shadow-sm hover:shadow-md transition-shadow`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Blocks Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence>
              {blocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer card-hover">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg ${block.blockType === 'Boys' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                            <Building2 className={`h-5 w-5 ${block.blockType === 'Boys' ? 'text-blue-600' : 'text-pink-600'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{block.blockName}</CardTitle>
                            <CardDescription className="text-xs">
                              {block.blockType} Block
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={block.occupiedRooms === block.roomCount ? 'secondary' : 'default'}>
                          {block.occupiedRooms}/{block.roomCount} Occupied
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Total Rooms</div>
                          <div className="font-semibold">{block.roomCount}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Students</div>
                          <div className="font-semibold">{block.totalStudents}</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(block, 'block')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(block.id, 'block')}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </TabsContent>

        <TabsContent value="rooms">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Room Management</CardTitle>
                  <CardDescription>
                    Manage hostel rooms and bed allocations
                  </CardDescription>
                </div>
                <Button
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                  onClick={() => {
                    setDialogType('room');
                    setDialogOpen(true);
                  }}
                >
                  <DoorOpen className="mr-2 h-4 w-4" />
                  Add Room
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rooms..."
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
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600 mr-2" />
                  <span className="text-muted-foreground">Loading rooms...</span>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DoorOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rooms found</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Block</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Floor</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Occupied</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredRooms.map((room, index) => (
                          <motion.tr
                            key={room.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <DoorOpen className="h-4 w-4 text-purple-600" />
                                {room.roomNumber}
                              </div>
                            </TableCell>
                            <TableCell>{room.blockName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{room.roomType}</Badge>
                            </TableCell>
                            <TableCell>{room.floorNumber}</TableCell>
                            <TableCell>{room.capacity}</TableCell>
                            <TableCell>{room.occupiedBeds}/{room.capacity}</TableCell>
                            <TableCell>
                              <Badge variant={room.status === 'Available' ? 'default' : 'secondary'}>
                                {room.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(room, 'room')}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(room.id, 'room')}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
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
        </TabsContent>

        <TabsContent value="admissions">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Hostel Admissions</CardTitle>
                <CardDescription>Current room occupancy and student allocations</CardDescription>
              </div>
              <Button onClick={() => window.location.href = '/hostel#admissions'} variant="outline" size="sm">
                Manage Admissions →
              </Button>
            </CardHeader>
            <CardContent>
              <HostelAdmissionsView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Hostel Fees</CardTitle>
              <CardDescription>Hostel fee collection linked to fee management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-3 text-blue-500" />
                <p className="font-medium">Hostel billing is handled through Fee Collection</p>
                <p className="text-sm mt-1">Add hostel fee as a fee type and collect via the fees module</p>
                <Button className="mt-4" onClick={() => window.location.href = '/fees/collection'}>
                  Go to Fee Collection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'block' ? 'Manage Block' : dialogType === 'room' ? 'Manage Room' : 'Manage Admission'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'block' ? 'Add or update hostel block' : dialogType === 'room' ? 'Add or update room' : 'Add or update admission'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {dialogType === 'block' ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="blockName">Block Name *</Label>
                    <Input
                      id="blockName"
                      value={formData.blockName}
                      onChange={(e) => setFormData({ ...formData, blockName: e.target.value })}
                      placeholder="e.g., Block A"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="blockType">Block Type *</Label>
                    <Select
                      value={formData.blockType}
                      onValueChange={(value) => setFormData({ ...formData, blockType: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOCK_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="totalRooms">Total Rooms *</Label>
                    <Input
                      id="totalRooms"
                      type="number"
                      min="1"
                      value={formData.totalRooms}
                      onChange={(e) => setFormData({ ...formData, totalRooms: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </>
              ) : dialogType === 'room' ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="roomNumber">Room Number *</Label>
                    <Input
                      id="roomNumber"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      placeholder="e.g., 101"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="roomType">Room Type *</Label>
                      <Select
                        value={formData.roomType}
                        onValueChange={(value) => setFormData({ ...formData, roomType: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOM_TYPES.map((type) => (
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
                      <Label htmlFor="floorNumber">Floor Number</Label>
                      <Input
                        id="floorNumber"
                        type="number"
                        min="1"
                        value={formData.floorNumber}
                        onChange={(e) => setFormData({ ...formData, floorNumber: parseInt(e.target.value) })}
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
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="studentId">Student</Label>
                    <Input
                      id="studentId"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      placeholder="Student ID or Admission Number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="roomId">Room</Label>
                    <Select
                      value={formData.roomId}
                      onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.filter(r => r.status === 'Available').map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.blockName} - {room.roomNumber} ({room.roomType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expectedVacateDate">Expected Vacate Date</Label>
                    <Input
                      id="expectedVacateDate"
                      type="date"
                      value={formData.expectedVacateDate}
                      onChange={(e) => setFormData({ ...formData, expectedVacateDate: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
