'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Phone, Plus, Search, Edit, Trash2, RefreshCw, AlertCircle, User, Download } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const RELATIONS = ['Father','Mother','Guardian','Uncle','Aunt','Elder Sibling','Grand Parent','Neighbor','Other'];
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function EmergencyContactsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [classFilter, setClass] = useState('');
  const [classes, setClasses]   = useState<any[]>([]);
  const [dialog, setDialog]     = useState(false);
  const [editing, setEditing]   = useState<any>(null);
  const [saving, setSaving]     = useState(false);

  const EMPTY = {
    studentId: '', primaryName: '', primaryPhone: '', primaryRelation: 'Father',
    secondaryName: '', secondaryPhone: '', secondaryRelation: 'Mother',
    homeAddress: '', bloodGroup: '', medicalNotes: '',
  };
  const [form, setForm] = useState<any>(EMPTY);
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch('/api/students?limit=500&status=active'),
        fetch('/api/classes'),
      ]);
      const [sData, cData] = await Promise.all([sRes.json(), cRes.json()]);
      if (sData.success) setStudents(sData.data || []);
      if (cData.success) setClasses(cData.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search || s.fullName?.toLowerCase().includes(q) || s.admissionNumber?.includes(q) || s.fatherName?.toLowerCase().includes(q) || s.fatherPhone?.includes(q);
    const matchClass = !classFilter || s.classId === classFilter;
    return matchSearch && matchClass;
  });

  const save = async () => {
    if (!form.studentId) { toast({ title: 'Please select a student', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${form.studentId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guardianName: form.primaryName, guardianPhone: form.primaryPhone, homeAddress: form.homeAddress }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: '✅ Emergency contacts updated' });
      setDialog(false); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    const rows = ['Name,Admission#,Class,Father,Father Phone,Mother/Guardian,Guardian Phone,Address'].join(',');
    const data = [rows, ...filtered.map(s =>
      [s.fullName, s.admissionNumber, s.class?.name, s.fatherName, s.fatherPhone, s.guardianName || s.motherName, s.guardianPhone || s.motherPhone, s.homeAddress || ''].join(',')
    )].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(data);
    a.download = 'emergency-contacts.csv'; a.click();
  };

  const missingContact = students.filter(s => !s.fatherPhone && !s.guardianPhone).length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Emergency Contacts"
        description="Student emergency contacts, guardian info and medical alerts"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 stagger-children">
        {[
          { label: 'Total Students', value: students.length, color: 'border-l-blue-500' },
          { label: 'Missing Contact', value: missingContact, color: 'border-l-red-500' },
          { label: 'With Info', value: students.length - missingContact, color: 'border-l-green-500' },
        ].map(({ label, value, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4"><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent>
          </Card>
        ))}
      </div>

      {missingContact > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span><strong>{missingContact} students</strong> have no emergency contact on file. Please update records.</span>
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search name, phone, father..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={classFilter} onValueChange={v => setClass(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y">{[...Array(8)].map((_,i) => <div key={i} className="h-14 animate-pulse bg-muted/20 m-2 rounded" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Student</TableHead><TableHead>Class</TableHead>
                  <TableHead>Primary Contact</TableHead><TableHead>Secondary Contact</TableHead>
                  <TableHead>Blood Group</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${s.gender === 'Female' ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>{s.fullName?.[0]}</div>
                        <div><p className="font-medium text-sm">{s.fullName}</p><p className="text-xs text-muted-foreground font-mono">{s.admissionNumber}</p></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{s.class?.name}</TableCell>
                    <TableCell>
                      {s.fatherPhone || s.guardianPhone ? (
                        <div>
                          <p className="text-sm font-medium">{s.fatherName || s.guardianName || 'Guardian'}</p>
                          <a href={`tel:${s.fatherPhone || s.guardianPhone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" />{s.fatherPhone || s.guardianPhone}
                          </a>
                        </div>
                      ) : <Badge className="text-xs bg-red-100 text-red-700">⚠ Missing</Badge>}
                    </TableCell>
                    <TableCell>
                      {s.motherPhone ? (
                        <div>
                          <p className="text-sm">{s.motherName || 'Mother'}</p>
                          <a href={`tel:${s.motherPhone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" />{s.motherPhone}
                          </a>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {s.bloodGroup ? <Badge className="text-xs bg-red-50 text-red-700 border-red-200">{s.bloodGroup}</Badge> : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => { setEditing(s); setForm({ ...EMPTY, studentId: s.id, primaryName: s.fatherName || s.guardianName || '', primaryPhone: s.fatherPhone || s.guardianPhone || '', homeAddress: s.homeAddress || '' }); setDialog(true); }}>
                        <Edit className="h-3.5 w-3.5 mr-1" />Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Update Emergency Contacts</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Primary Contact Name</Label><Input value={form.primaryName} onChange={e => f('primaryName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Primary Phone</Label><Input value={form.primaryPhone} onChange={e => f('primaryPhone', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Relation</Label>
              <Select value={form.primaryRelation} onValueChange={v => f('primaryRelation', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RELATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Secondary Contact Name</Label><Input value={form.secondaryName} onChange={e => f('secondaryName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Secondary Phone</Label><Input value={form.secondaryPhone} onChange={e => f('secondaryPhone', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Relation</Label>
              <Select value={form.secondaryRelation} onValueChange={v => f('secondaryRelation', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RELATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Blood Group</Label>
              <Select value={form.bloodGroup} onValueChange={v => f('bloodGroup', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Home Address</Label><Input value={form.homeAddress} onChange={e => f('homeAddress', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              Save Contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
