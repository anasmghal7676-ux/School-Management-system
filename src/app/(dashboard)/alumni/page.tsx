'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Plus, GraduationCap, MapPin, Briefcase,
  ChevronLeft, ChevronRight, RefreshCw, Search, Star, Users,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const EMPTY_FORM = {
  studentId: '', passingYear: String(new Date().getFullYear()),
  currentOccupation: '', currentEmployer: '', currentCity: '',
  contactEmail: '', contactPhone: '', willingToMentor: 'false', notes: '',
};

export default function AlumniPage() {
  const [alumni, setAlumni]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [students, setStudents]   = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [yearFilter, setYearFilter]     = useState('');
  const [mentorFilter, setMentorFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [searchIn, setSearchIn]         = useState('');

  const [addOpen, setAddOpen]   = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { fetchStudents(); }, []);
  useEffect(() => { const t = setTimeout(() => setSearch(searchIn), 400); return () => clearTimeout(t); }, [searchIn]);
  useEffect(() => { fetchAlumni(); }, [yearFilter, mentorFilter, search, page]);

  const fetchStudents = async () => {
    const r = await fetch('/api/students?limit=500&status=graduated');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || []);
  };

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '25' });
      if (yearFilter)              p.append('passingYear', yearFilter);
      if (mentorFilter === 'true') p.append('mentor', 'true');
      if (search)                  p.append('search', search);
      const r = await fetch(`/api/alumni?${p}`);
      const j = await r.json();
      if (j.success) {
        setAlumni(j.data.alumni || j.data);
        setTotal(j.data.pagination?.total || 0);
        setTotalPages(j.data.pagination?.totalPages || 1);
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [yearFilter, mentorFilter, search, page]);

  const handleAdd = async () => {
    if (!form.studentId || !form.passingYear) {
      toast({ title: 'Student and passing year are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, passingYear: parseInt(form.passingYear), willingToMentor: form.willingToMentor === 'true' };
      const r = await fetch('/api/alumni', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (j.success) { toast({ title: 'Alumni added' }); setAddOpen(false); setForm(EMPTY_FORM); fetchAlumni(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const uf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const mentorCount = alumni.filter(a => a.willingToMentor).length;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => String(currentYear - i));

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="h-8 w-8" />Alumni
            </h1>
            <p className="text-muted-foreground">Track graduates, their careers and mentorship availability</p>
          </div>
          <Button onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Add Alumni
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Alumni', value: total, icon: Users, color: 'border-l-blue-500' },
            { label: 'Mentors Available', value: mentorCount, icon: Star, color: 'border-l-amber-500' },
            { label: 'Passing Years', value: new Set(alumni.map(a => a.passingYear)).size, icon: GraduationCap, color: 'border-l-green-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className={`border-l-4 ${color}`}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search alumni name..." value={searchIn} onChange={e => setSearchIn(e.target.value)} />
          </div>
          <Select value={yearFilter} onValueChange={v => { setYearFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Years" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Years</SelectItem>
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={mentorFilter} onValueChange={v => { setMentorFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Alumni</SelectItem>
              <SelectItem value="true">Mentors Only</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAlumni} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : alumni.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mb-4" />
                <p className="font-medium">No alumni records yet</p>
                <Button className="mt-4" onClick={() => { setForm(EMPTY_FORM); setAddOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" />Add First Alumni
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Passing Year</TableHead>
                      <TableHead>Occupation</TableHead>
                      <TableHead>Employer</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Mentor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alumni.map((a: any) => (
                      <TableRow key={a.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="font-medium text-sm">{a.student?.fullName || '—'}</div>
                          <div className="text-xs text-muted-foreground">{a.student?.admissionNumber}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">{a.passingYear}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                            {a.currentOccupation || <span className="text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{a.currentEmployer || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            {a.currentCity && <MapPin className="h-3.5 w-3.5 text-muted-foreground" />}
                            {a.currentCity || <span className="text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.contactEmail && <div className="text-xs">{a.contactEmail}</div>}
                          {a.contactPhone && <div className="text-xs text-muted-foreground">{a.contactPhone}</div>}
                          {!a.contactEmail && !a.contactPhone && <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {a.willingToMentor
                            ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800"><Star className="inline h-3 w-3 mr-0.5" />Mentor</span>
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} alumni</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Alumni Record</DialogTitle><DialogDescription>Register a graduated student in the alumni database</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Student *</Label>
              <Select value={form.studentId} onValueChange={v => uf('studentId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select graduated student" /></SelectTrigger>
                <SelectContent>
                  {students.length === 0
                    ? <SelectItem value="" disabled>No graduated students found</SelectItem>
                    : students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Passing Year *</Label>
              <Select value={form.passingYear} onValueChange={v => uf('passingYear', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Occupation</Label><Input className="mt-1" value={form.currentOccupation} onChange={e => uf('currentOccupation', e.target.value)} placeholder="e.g. Engineer" /></div>
            <div><Label>Employer</Label><Input className="mt-1" value={form.currentEmployer} onChange={e => uf('currentEmployer', e.target.value)} /></div>
            <div><Label>City</Label><Input className="mt-1" value={form.currentCity} onChange={e => uf('currentCity', e.target.value)} /></div>
            <div><Label>Email</Label><Input className="mt-1" type="email" value={form.contactEmail} onChange={e => uf('contactEmail', e.target.value)} /></div>
            <div><Label>Phone</Label><Input className="mt-1" value={form.contactPhone} onChange={e => uf('contactPhone', e.target.value)} /></div>
            <div>
              <Label>Willing to Mentor?</Label>
              <Select value={form.willingToMentor} onValueChange={v => uf('willingToMentor', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="false">No</SelectItem><SelectItem value="true">Yes</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Notes</Label><Input className="mt-1" value={form.notes} onChange={e => uf('notes', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Alumni
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
