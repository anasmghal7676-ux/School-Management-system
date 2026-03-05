'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Users, UserPlus, Search, Eye, Edit, Trash2,
  MoreHorizontal, ChevronLeft, ChevronRight, GraduationCap,
  RefreshCw, Download, Phone, MapPin, Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import Link from 'next/link';

interface ClassItem { id: string; name: string; code: string }
interface SectionItem { id: string; name: string; classId: string }

interface Student {
  id: string;
  admissionNumber: string;
  rollNumber: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  fatherName: string;
  phone: string | null;
  gender: string;
  dateOfBirth: string;
  status: string;
  admissionDate: string;
  currentClassId: string | null;
  currentSectionId: string | null;
  class: ClassItem | null;
  section: SectionItem | null;
  city: string | null;
  fatherPhone: string | null;
}

const EMPTY_FORM = {
  firstName: '', lastName: '', gender: '', dateOfBirth: '',
  fatherName: '', motherName: '', fatherPhone: '', phone: '',
  address: '', city: '', admissionDate: new Date().toISOString().slice(0, 10),
  currentClassId: '', currentSectionId: '', rollNumber: '', religion: 'Islam',
  nationality: 'Pakistani', bForm: '', status: 'Active', notes: '',
};

const STATUS_BADGE: Record<string, string> = {
  Active:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  Inactive:   'bg-gray-100 text-gray-600 border-gray-200',
  Graduated:  'bg-blue-100 text-blue-700 border-blue-200',
  Transferred:'bg-amber-100 text-amber-700 border-amber-200',
  Expelled:   'bg-red-100 text-red-700 border-red-200',
};

const GENDER_BADGE: Record<string, string> = {
  Male:   'bg-blue-50 text-blue-600',
  Female: 'bg-pink-50 text-pink-600',
  Other:  'bg-purple-50 text-purple-600',
};

export default function StudentsPage() {
  const [students, setStudents]     = useState<Student[]>([]);
  const [classes, setClasses]       = useState<ClassItem[]>([]);
  const [sections, setSections]     = useState<SectionItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const limit = 20;

  const [search, setSearch]           = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  const [dialog, setDialog]         = useState<'none'|'add'|'edit'|'view'>('none');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [form, setForm]             = useState<any>(EMPTY_FORM);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const filteredSections = sections.filter(s => !classFilter || s.classId === classFilter);
  const formSections = sections.filter(s => s.classId === form.currentClassId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        page: String(page), limit: String(limit), search,
        classId: classFilter, status: statusFilter, gender: genderFilter,
      });
      const [sRes, cRes, secRes] = await Promise.all([
        fetch(`/api/students?${p}`),
        fetch('/api/classes?limit=100'),
        fetch('/api/sections?limit=200'),
      ]);
      const [sData, cData, secData] = await Promise.all([sRes.json(), cRes.json(), secRes.json()]);
      if (sData.success) { setStudents(sData.data || []); setTotal(sData.total || 0); }
      if (cData.success) setClasses(cData.data?.classes || cData.data || []);
      if (secData.success) setSections(secData.data?.sections || secData.data || []);
    } catch { toast({ title: 'Failed to load students', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [page, search, classFilter, statusFilter, genderFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, classFilter, statusFilter, genderFilter]);

  const openAdd  = () => { setForm({ ...EMPTY_FORM, admissionDate: new Date().toISOString().slice(0,10) }); setDialog('add'); };
  const openEdit = (s: Student) => { setSelectedStudent(s); setForm({ ...EMPTY_FORM, ...s }); setDialog('edit'); };
  const openView = (s: Student) => { setSelectedStudent(s); setDialog('view'); };
  const openDel  = (s: Student) => { setSelectedStudent(s); setDeleteDialog(true); };

  const save = async () => {
    if (!form.firstName || !form.lastName || !form.gender || !form.dateOfBirth) {
      toast({ title: 'First name, last name, gender and DOB are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const isEdit = dialog === 'edit';
      const url = isEdit ? `/api/students/${selectedStudent!.id}` : '/api/students';
      const res = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      toast({ title: isEdit ? '✅ Student updated' : '✅ Student added' });
      setDialog('none'); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!selectedStudent) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${selectedStudent.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed');
      toast({ title: '✅ Student deleted' });
      setDeleteDialog(false); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Students"
        description={`${total.toLocaleString()} students enrolled`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-2 transition-transform hover:rotate-180 duration-500" />Refresh
            </Button>
            <Button size="sm" onClick={openAdd}>
              <UserPlus className="h-4 w-4 mr-2" />Add Student
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total', value: total, color: 'border-l-blue-500', icon: Users },
          { label: 'Active', value: students.filter(s => s.status === 'Active').length || 0, color: 'border-l-emerald-500', icon: GraduationCap },
          { label: 'Male', value: students.filter(s => s.gender === 'Male').length || 0, color: 'border-l-sky-500', icon: Users },
          { label: 'Female', value: students.filter(s => s.gender === 'Female').length || 0, color: 'border-l-pink-500', icon: Users },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className={`border-l-4 ${color} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <Icon className="h-6 w-6 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="animate-fade-in">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, admission no..."
                className="pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {['Active','Inactive','Graduated','Transferred','Expelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={v => setGenderFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="All Gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gender</SelectItem>
                {['Male','Female','Other'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="animate-fade-in">
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                  <div className="h-9 w-9 rounded-full bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                  <div className="h-3 bg-muted rounded w-16" />
                  <div className="h-3 bg-muted rounded w-20" />
                  <div className="h-6 bg-muted rounded-full w-14" />
                  <div className="h-7 bg-muted rounded w-7" />
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mb-4 opacity-20 animate-bounce-subtle" />
              <p className="font-medium">No students found</p>
              <p className="text-sm mt-1">Try adjusting your filters or add a new student</p>
              <Button size="sm" className="mt-4" onClick={openAdd}><UserPlus className="h-4 w-4 mr-2" />Add Student</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Student</TableHead>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Father</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, idx) => (
                  <TableRow
                    key={student.id}
                    className="hover:bg-muted/20 transition-colors group"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${student.gender === 'Female' ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                          {student.fullName?.[0] || student.firstName?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student.fullName || `${student.firstName} ${student.lastName}`}</p>
                          {student.rollNumber && <p className="text-xs text-muted-foreground">Roll #{student.rollNumber}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{student.admissionNumber}</TableCell>
                    <TableCell>
                      {student.class ? (
                        <div>
                          <p className="text-sm font-medium">{student.class.name}</p>
                          {student.section && <p className="text-xs text-muted-foreground">{student.section.name}</p>}
                        </div>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs border ${GENDER_BADGE[student.gender] || ''}`}>
                        {student.gender}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{student.fatherName || '—'}</div>
                      {student.fatherPhone && <p className="text-xs text-muted-foreground">{student.fatherPhone}</p>}
                    </TableCell>
                    <TableCell>
                      {student.phone ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />{student.phone}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs border ${STATUS_BADGE[student.status] || 'bg-gray-100 text-gray-600'}`}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openView(student)}>
                            <Eye className="h-4 w-4 mr-2" />View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(student)}>
                            <Edit className="h-4 w-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => openDel(student)}>
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {((page-1)*limit)+1}–{Math.min(page*limit, total)} of {total.toLocaleString()} students
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4 mr-1" />Prev
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(p)}>
                      {p}
                    </Button>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog === 'add' || dialog === 'edit'} onOpenChange={open => !open && setDialog('none')}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog === 'add' ? 'Add New Student' : 'Edit Student'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>First Name *</Label><Input value={form.firstName} onChange={e => f('firstName', e.target.value)} placeholder="First name" /></div>
            <div className="space-y-1.5"><Label>Last Name *</Label><Input value={form.lastName} onChange={e => f('lastName', e.target.value)} placeholder="Last name" /></div>
            <div className="space-y-1.5"><Label>Gender *</Label>
              <Select value={form.gender} onValueChange={v => f('gender', v)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Date of Birth *</Label><Input type="date" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Father Name</Label><Input value={form.fatherName} onChange={e => f('fatherName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Mother Name</Label><Input value={form.motherName} onChange={e => f('motherName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Father Phone</Label><Input value={form.fatherPhone} onChange={e => f('fatherPhone', e.target.value)} placeholder="03XX-XXXXXXX" /></div>
            <div className="space-y-1.5"><Label>Student Phone</Label><Input value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="03XX-XXXXXXX" /></div>
            <div className="space-y-1.5"><Label>Class</Label>
              <Select value={form.currentClassId} onValueChange={v => { f('currentClassId', v); f('currentSectionId', ''); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Section</Label>
              <Select value={form.currentSectionId} onValueChange={v => f('currentSectionId', v)} disabled={!form.currentClassId}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>{formSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Admission Date</Label><Input type="date" value={form.admissionDate} onChange={e => f('admissionDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Roll Number</Label><Input value={form.rollNumber} onChange={e => f('rollNumber', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>B-Form / CNIC</Label><Input value={form.bForm} onChange={e => f('bForm', e.target.value)} placeholder="XXXXX-XXXXXXX-X" /></div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => f('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Active','Inactive','Graduated','Transferred','Expelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={e => f('city', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Religion</Label>
              <Select value={form.religion} onValueChange={v => f('religion', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Islam','Christianity','Hinduism','Sikhism','Other'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Address</Label><Textarea value={form.address} onChange={e => f('address', e.target.value)} rows={2} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={2} placeholder="Additional notes..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog('none')}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              {dialog === 'add' ? 'Add Student' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={dialog === 'view'} onOpenChange={open => !open && setDialog('none')}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Student Profile</DialogTitle></DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white ${selectedStudent.gender === 'Female' ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                  {selectedStudent.fullName?.[0] || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedStudent.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStudent.admissionNumber}</p>
                  <Badge className={`text-xs mt-1 border ${STATUS_BADGE[selectedStudent.status] || ''}`}>{selectedStudent.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Class', selectedStudent.class?.name],
                  ['Section', selectedStudent.section?.name],
                  ['Gender', selectedStudent.gender],
                  ['D.O.B', selectedStudent.dateOfBirth ? fmtDate(selectedStudent.dateOfBirth) : '—'],
                  ['Father', selectedStudent.fatherName],
                  ['Phone', selectedStudent.fatherPhone || selectedStudent.phone || '—'],
                  ['City', selectedStudent.city],
                  ['Admission', selectedStudent.admissionDate ? fmtDate(selectedStudent.admissionDate) : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog('none')}>Close</Button>
            <Button onClick={() => { setDialog('none'); if (selectedStudent) openEdit(selectedStudent); }}>
              <Edit className="h-4 w-4 mr-2" />Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Student</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{selectedStudent?.fullName}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              Delete Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
