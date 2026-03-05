'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react';
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
import { Plus, Edit, Trash2, Search, User, Calendar, DollarSign, Shield, CheckCircle, XCircle, Clock, Check, X, AlertCircle, Clock4, Save, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Staff {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  designation: string;
  department: string | null;
  qualification: string | null;
  experienceYears: number;
  joiningDate: string;
  salary: number | null;
  status: string;
  employmentType: string;
  profilePhoto: string | null;
  userId: string | null;
  hasUserAccount: boolean;
}

const GENDERS = ['Male', 'Female', 'Other'];
const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Part-time', 'Visiting'];
const STATUS_OPTIONS = ['active', 'resigned', 'retired', 'terminated'];
const DESIGNATIONS = [
  'Principal',
  'Vice Principal',
  'HOD',
  'Teacher',
  'Accountant',
  'Librarian',
  'Transport Manager',
  'Hostel Warden',
  'Receptionist',
  'Data Entry Operator',
  'Clerk',
  'Peon',
  'Security Guard',
  'Lab Assistant',
  'Sports Instructor',
  'Art Teacher',
  'Music Teacher',
];

// ─── Staff Leave Management Sub-Component ─────────────────────────────────
function StaffLeaveTab() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({ staffId: '', leaveType: 'Annual', fromDate: '', toDate: '', reason: '', appliedDate: new Date().toISOString().slice(0, 10) });

  useEffect(() => { fetchLeaves(); fetchStaff(); }, []);

  const fetchStaff = async () => { const r = await fetch('/api/staff?limit=200'); const j = await r.json(); if (j.success) setStaff(j.data?.staff || j.data || []); };
  const fetchLeaves = async (status = statusFilter) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '50' });
      if (status !== 'all') p.append('status', status);
      const r = await fetch(`/api/leaves?${p}`);
      const j = await r.json();
      if (j.success) setLeaves(j.data?.leaves || j.data || []);
    } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.staffId || !form.fromDate || !form.toDate) {
      toast({ title: 'Required', description: 'Staff, from date and to date required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/leaves', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'Pending' }),
      });
      const j = await r.json();
      if (j.success) { toast({ title: 'Leave applied' }); setAddOpen(false); fetchLeaves(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleApprove = async (id: string, status: string) => {
    const r = await fetch(`/api/leaves/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    const j = await r.json();
    if (j.success) { toast({ title: status }); fetchLeaves(); }
  };

  const STATUS_COLORS: Record<string, string> = { Pending: 'bg-amber-100 text-amber-800', Approved: 'bg-green-100 text-green-800', Rejected: 'bg-red-100 text-red-800', Cancelled: 'bg-gray-100 text-gray-700' };
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const days = (f: string, t: string) => f && t ? Math.ceil((new Date(t).getTime() - new Date(f).getTime()) / 86400000) + 1 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Leave Applications</CardTitle><CardDescription>Manage staff leave requests and approvals</CardDescription></div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); fetchLeaves(v); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {['Pending','Approved','Rejected','Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setForm({ staffId: '', leaveType: 'Annual', fromDate: '', toDate: '', reason: '', appliedDate: new Date().toISOString().slice(0, 10) }); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Apply Leave
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div>
          : leaves.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Calendar className="h-10 w-10 mb-3" /><p>No leave applications found</p>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Leave Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {leaves.map((l: any) => {
                  const staffMember = staff.find(s => s.id === l.staffId);
                  return (
                    <TableRow key={l.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell><div className="font-medium text-sm">{staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : l.staffId}</div><div className="text-xs text-muted-foreground">{staffMember?.designation}</div></TableCell>
                      <TableCell className="text-sm">{l.leaveType}</TableCell>
                      <TableCell className="text-sm">{new Date(l.fromDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{new Date(l.toDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm font-semibold">{days(l.fromDate, l.toDate)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{l.reason || '—'}</TableCell>
                      <TableCell><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[l.status] || 'bg-gray-100'}`}>{l.status}</span></TableCell>
                      <TableCell className="text-right">
                        {l.status === 'Pending' && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleApprove(l.id, 'Approved')}>Approve</Button>
                            <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => handleApprove(l.id, 'Rejected')}>Reject</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Staff Member *</Label><Select value={form.staffId} onValueChange={v => sf('staffId', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select staff" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.designation}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Leave Type</Label><Select value={form.leaveType} onValueChange={v => sf('leaveType', v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{['Annual','Sick','Casual','Maternity','Paternity','Emergency','Unpaid'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>From Date *</Label><Input className="mt-1" type="date" value={form.fromDate} onChange={e => sf('fromDate', e.target.value)} /></div>
              <div><Label>To Date *</Label><Input className="mt-1" type="date" value={form.toDate} onChange={e => sf('toDate', e.target.value)} /></div>
            </div>
            {form.fromDate && form.toDate && <div className="bg-blue-50 dark:bg-blue-950 rounded p-2 text-sm text-center font-medium">{days(form.fromDate, form.toDate)} day(s) leave</div>}
            <div><Label>Reason</Label><textarea className="mt-1 w-full min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" value={form.reason} onChange={e => sf('reason', e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={handleAdd} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Apply</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [activeTab, setActiveTab] = useState('directory');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    designation: '',
    qualification: '',
    experienceYears: 0,
    joiningDate: '',
    salary: '',
    employmentType: '',
    address: '',
    cnicNumber: '',
    bankAccount: '',
    bankName: '',
    status: 'active',
  });

  // Leave Management state
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    staffId: '',
    leaveType: '',
    fromDate: '',
    toDate: '',
    days: 0,
    reason: '',
  });
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');

  // Attendance state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Map<string, string>>(new Map());
  const [attendanceRemarks, setAttendanceRemarks] = useState<Map<string, string>>(new Map());
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    fetchStaff();
    if (activeTab === 'leave') {
      fetchLeaves();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceSummary();
    }
  }, [activeTab, selectedDate]);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setStaff(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch staff',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingStaff ? `/api/staff/${editingStaff.id}` : '/api/staff';
      const method = editingStaff ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingStaff
            ? 'Staff updated successfully'
            : 'Staff added successfully',
        });
        setDialogOpen(false);
        resetForm();
        fetchStaff();
      } else {
        throw new Error('Failed to save staff');
      }
    } catch (error) {
      console.error('Failed to save staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to save staff',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      gender: staffMember.gender,
      dateOfBirth: staffMember.dateOfBirth.split('T')[0],
      phone: staffMember.phone,
      email: staffMember.email,
      designation: staffMember.designation,
      qualification: staffMember.qualification || '',
      experienceYears: staffMember.experienceYears,
      joiningDate: staffMember.joiningDate.split('T')[0],
      salary: staffMember.salary?.toString() || '',
      employmentType: staffMember.employmentType,
      address: '',
      cnicNumber: '',
      bankAccount: '',
      bankName: '',
      status: staffMember.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Staff deleted successfully',
        });
        fetchStaff();
      } else {
        throw new Error('Failed to delete staff');
      }
    } catch (error) {
      console.error('Failed to delete staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete staff',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingStaff(null);
    setFormData({
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      designation: '',
      qualification: '',
      experienceYears: 0,
      joiningDate: '',
      salary: '',
      employmentType: '',
      address: '',
      cnicNumber: '',
      bankAccount: '',
      bankName: '',
      status: 'active',
    });
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.designation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activeStaff = staff.filter((s) => s.status === 'active');
  const totalSalary = activeStaff.reduce((sum, s) => sum + (s.salary || 0), 0);

  // Leave Management functions
  const fetchLeaves = async () => {
    try {
      const response = await fetch('/api/leaves?applicantType=Staff');
      if (response.ok) {
        const data = await response.json();
        setLeaves(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveFormData.staffId) {
      toast({
        title: 'Error',
        description: 'Please select a staff member',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leaveFormData,
          applicantId: leaveFormData.staffId,
          applicantType: 'Staff',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Leave application submitted successfully',
        });
        setLeaveDialogOpen(false);
        resetLeaveForm();
        fetchLeaves();
      } else {
        throw new Error('Failed to submit leave application');
      }
    } catch (error) {
      console.error('Failed to submit leave:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit leave application',
        variant: 'destructive',
      });
    }
  };

  const handleApproveLeave = async (id: string) => {
    try {
      const response = await fetch(`/api/leaves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: 'admin',
          remarks: 'Approved by administration',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Leave approved successfully',
        });
        fetchLeaves();
      }
    } catch (error) {
      console.error('Failed to approve leave:', error);
    }
  };

  const handleRejectLeave = async (id: string) => {
    if (!confirm('Are you sure you want to reject this leave application?')) {
      return;
    }

    try {
      const response = await fetch(`/api/leaves/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: 'admin',
          remarks: 'Rejected by administration',
          reject: true,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Leave rejected',
        });
        fetchLeaves();
      }
    } catch (error) {
      console.error('Failed to reject leave:', error);
    }
  };

  const resetLeaveForm = () => {
    setLeaveFormData({
      staffId: '',
      leaveType: '',
      fromDate: '',
      toDate: '',
      days: 0,
      reason: '',
    });
  };

  const calculateDays = (fromDate: string, toDate: string) => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setLeaveFormData({ ...leaveFormData, days: diffDays });
    }
  };
  const fetchAttendanceSummary = async () => {
    try {
      const response = await fetch(`/api/staff-att/summary?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceSummary(data.data);

        // Set attendance data from existing records
        const newAttendanceData = new Map<string, string>();
        const newRemarks = new Map<string, string>();

        data.data.staff.forEach((s: any) => {
          if (s.attendance) {
            newAttendanceData.set(s.id, s.attendance.status);
            newRemarks.set(s.id, s.attendance.remarks || '');
          }
        });

        setAttendanceData(newAttendanceData);
        setAttendanceRemarks(newRemarks);
      }
    } catch (error) {
      console.error('Failed to fetch attendance summary:', error);
    }
  };

  const handleAttendanceChange = (staffId: string, status: string) => {
    const newData = new Map(attendanceData);
    newData.set(staffId, status);
    setAttendanceData(newData);
  };

  const handleRemarkChange = (staffId: string, remark: string) => {
    const newRemarks = new Map(attendanceRemarks);
    newRemarks.set(staffId, remark);
    setAttendanceRemarks(newRemarks);
  };

  const markAllPresent = () => {
    const activeStaffList = staff.filter((s) => s.status === 'active');
    const newData = new Map<string, string>();
    activeStaffList.forEach((s) => newData.set(s.id, 'Present'));
    setAttendanceData(newData);
  };

  const markAllAbsent = () => {
    const activeStaffList = staff.filter((s) => s.status === 'active');
    const newData = new Map<string, string>();
    activeStaffList.forEach((s) => newData.set(s.id, 'Absent'));
    setAttendanceData(newData);
  };

  const saveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const attendanceRecords = Array.from(attendanceData.entries() as IterableIterator<[string, string]>).map(([staffId, status]) => ({
        staffId,
        status,
        remarks: attendanceRemarks.get(staffId) || '',
      }));

      const response = await fetch('/api/staff-att', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          attendanceRecords,
          markedBy: 'admin',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Attendance saved successfully',
        });
        fetchAttendanceSummary();
      } else {
        throw new Error('Failed to save attendance');
      }
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setSavingAttendance(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground">
            Manage teachers and administrative staff
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave Management</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staff.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {activeStaff.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  PKR {totalSalary.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Directory Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Staff Directory</CardTitle>
                  <CardDescription>
                    View and manage all staff members
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingStaff ? 'Edit Staff' : 'Add New Staff'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingStaff
                          ? 'Update staff information'
                          : 'Add a new staff member to the school'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) =>
                                setFormData({ ...formData, firstName: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) =>
                                setFormData({ ...formData, lastName: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="gender">Gender *</Label>
                            <Select
                              value={formData.gender}
                              onValueChange={(value) =>
                                setFormData({ ...formData, gender: value })
                              }
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                {GENDERS.map((gender) => (
                                  <SelectItem key={gender} value={gender}>
                                    {gender}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                            <Input
                              id="dateOfBirth"
                              type="date"
                              value={formData.dateOfBirth}
                              onChange={(e) =>
                                setFormData({ ...formData, dateOfBirth: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                              }
                              placeholder="+92-3XX-XXXXXXX"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                              }
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="designation">Designation *</Label>
                            <Select
                              value={formData.designation}
                              onValueChange={(value) =>
                                setFormData({ ...formData, designation: value })
                              }
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select designation" />
                              </SelectTrigger>
                              <SelectContent>
                                {DESIGNATIONS.map((designation) => (
                                  <SelectItem key={designation} value={designation}>
                                    {designation}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="employmentType">Employment Type *</Label>
                            <Select
                              value={formData.employmentType}
                              onValueChange={(value) =>
                                setFormData({ ...formData, employmentType: value })
                              }
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {EMPLOYMENT_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="qualification">Qualification</Label>
                            <Input
                              id="qualification"
                              value={formData.qualification}
                              onChange={(e) =>
                                setFormData({ ...formData, qualification: e.target.value })
                              }
                              placeholder="e.g., M.Sc, B.Ed"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="experienceYears">Experience (Years)</Label>
                            <Input
                              id="experienceYears"
                              type="number"
                              min="0"
                              value={formData.experienceYears}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  experienceYears: parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="joiningDate">Joining Date *</Label>
                            <Input
                              id="joiningDate"
                              type="date"
                              value={formData.joiningDate}
                              onChange={(e) =>
                                setFormData({ ...formData, joiningDate: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="salary">Salary (PKR)</Label>
                            <Input
                              id="salary"
                              type="number"
                              min="0"
                              value={formData.salary}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  salary: e.target.value,
                                })
                              }
                              placeholder="Monthly salary"
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="cnicNumber">CNIC Number</Label>
                          <Input
                            id="cnicNumber"
                            value={formData.cnicNumber}
                            onChange={(e) =>
                              setFormData({ ...formData, cnicNumber: e.target.value })
                            }
                            placeholder="XXXXX-XXXXXXX-X"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="bankAccount">Bank Account</Label>
                            <Input
                              id="bankAccount"
                              value={formData.bankAccount}
                              onChange={(e) =>
                                setFormData({ ...formData, bankAccount: e.target.value })
                            }
                              placeholder="Account number"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                              id="bankName"
                              value={formData.bankName}
                              onChange={(e) =>
                                setFormData({ ...formData, bankName: e.target.value })
                            }
                              placeholder="Bank name"
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) =>
                              setFormData({ ...formData, status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                          {editingStaff ? 'Update' : 'Create'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Staff Table */}
              {loading ? (
                <div className="text-center py-8">Loading staff...</div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No staff found
                </div>
              ) : (
                <div className="rounded-md border max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((member) => (
                        <TableRow key={member.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div>
                              <div className="font-medium">{member.fullName}</div>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{member.employeeCode}</TableCell>
                          <TableCell>{member.designation}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{member.employmentType}</Badge>
                          </TableCell>
                          <TableCell>{member.phone}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                member.status === 'active'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {member.status.charAt(0).toUpperCase() +
                                member.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {member.hasUserAccount ? (
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(member)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Staff Attendance</CardTitle>
              <CardDescription>
                Mark and manage staff attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selector and Actions */}
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="space-y-2">
                    <Label htmlFor="attendanceDate">Date</Label>
                    <Input
                      id="attendanceDate"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={markAllPresent}
                    className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark All Present
                  </Button>
                  <Button
                    variant="outline"
                    onClick={markAllAbsent}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Mark All Absent
                  </Button>
                  <Button
                    onClick={saveAttendance}
                    disabled={savingAttendance}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {savingAttendance ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </div>
              </div>

              {/* Statistics Cards */}
              {attendanceSummary && (
                <div className="grid gap-4 md:grid-cols-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{attendanceSummary.summary.total}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Present</CardTitle>
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-600">
                        {attendanceSummary.summary.present}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Absent</CardTitle>
                      <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {attendanceSummary.summary.absent}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Late</CardTitle>
                      <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">
                        {attendanceSummary.summary.late}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Half-day</CardTitle>
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {attendanceSummary.summary.halfDay}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Attendance %</CardTitle>
                      <Clock4 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {attendanceSummary.summary.attendancePercentage}%
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Attendance Table */}
              {loading ? (
                <div className="text-center py-8">Loading staff...</div>
              ) : (
                <div className="rounded-md border max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Staff</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staff
                        .filter((s) => s.status === 'active')
                        .map((staffMember) => (
                          <TableRow key={staffMember.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell>
                              <div>
                                <div className="font-medium">{staffMember.fullName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {staffMember.employeeCode}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{staffMember.designation}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {(['Present', 'Absent', 'Late', 'Half-day', 'Leave'] as const).map(
                                  (status) => (
                                    <Button
                                      key={status}
                                      variant={
                                        attendanceData.get(staffMember.id) === status
                                          ? 'default'
                                          : 'outline'
                                      }
                                      size="sm"
                                      onClick={() => handleAttendanceChange(staffMember.id, status)}
                                      className={`text-xs h-8 px-2 ${
                                        attendanceData.get(staffMember.id) === status
                                          ? status === 'Present'
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : status === 'Absent'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : status === 'Late'
                                            ? 'bg-amber-600 hover:bg-amber-700'
                                            : status === 'Half-day'
                                            ? 'bg-orange-600 hover:bg-orange-700'
                                            : 'bg-purple-600 hover:bg-purple-700'
                                          : ''
                                      }`}
                                    >
                                      {status}
                                    </Button>
                                  )
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                className="w-24 h-8 text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                className="w-24 h-8 text-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="Add remarks..."
                                value={attendanceRemarks.get(staffMember.id) || ''}
                                onChange={(e) =>
                                  handleRemarkChange(staffMember.id, e.target.value)
                                }
                                className="h-8 text-sm"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <StaffLeaveTab />
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payroll Management</CardTitle>
                <CardDescription>Process salaries and generate payslips</CardDescription>
              </div>
              <Button onClick={() => window.location.href = '/payroll'}>
                Open Payroll Module →
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Full payroll module available</p>
                <p className="text-sm mt-1">Pakistan tax calculation, payslips, allowances and deductions</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
