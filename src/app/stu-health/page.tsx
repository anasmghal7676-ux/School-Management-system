'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Heart, Plus, Search, Edit, Trash2, RefreshCw, Syringe, AlertTriangle, Activity, FileText } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const VACCINES = ['Polio','Hepatitis B','Measles','BCG','DPT','Pneumococcal','Covid-19','Tetanus','Typhoid'];

export default function StudentHealthPage() {
  const [records, setRecords]   = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [dialog, setDialog]     = useState(false);
  const [editing, setEditing]   = useState<any>(null);

  const EMPTY = {
    studentId: '', bloodGroup: '', height: '', weight: '', allergies: '',
    chronicConditions: '', medications: '', emergencyContact: '', emergencyPhone: '',
    vision: '', hearing: '', lastCheckup: '', doctorName: '', doctorPhone: '',
    vaccinations: [] as string[], notes: '',
  };
  const [form, setForm] = useState<any>(EMPTY);
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, sRes] = await Promise.all([
        fetch('/api/medical?limit=200'),
        fetch('/api/students?limit=500&status=active'),
      ]);
      const [mData, sData] = await Promise.all([mRes.json(), sRes.json()]);
      if (mData.success) setRecords(mData.data || []);
      if (sData.success) setStudents(sData.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setDialog(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ ...EMPTY, ...r, vaccinations: r.vaccinations || [] }); setDialog(true); };

  const save = async () => {
    if (!form.studentId) { toast({ title: 'Please select a student', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/medical/${editing.id}` : '/api/medical';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `✅ Health record ${editing ? 'updated' : 'saved'}` });
      setDialog(false); load();
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this health record?')) return;
    await fetch(`/api/medical/${id}`, { method: 'DELETE' });
    toast({ title: '✅ Deleted' }); load();
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return !search || r.student?.fullName?.toLowerCase().includes(q) || r.student?.admissionNumber?.includes(q);
  });

  const toggleVaccine = (v: string) => {
    const curr = form.vaccinations || [];
    f('vaccinations', curr.includes(v) ? curr.filter((x: string) => x !== v) : [...curr, v]);
  };

  const BMI = (h: string, w: string) => {
    const hm = parseFloat(h) / 100; const wk = parseFloat(w);
    if (!hm || !wk) return null;
    const bmi = wk / (hm * hm);
    return { value: bmi.toFixed(1), status: bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese' };
  };

  const BLOOD_COLOR: Record<string,string> = { 'A+':'bg-red-100 text-red-700','A-':'bg-rose-100 text-rose-700','B+':'bg-orange-100 text-orange-700','B-':'bg-amber-100 text-amber-700','AB+':'bg-purple-100 text-purple-700','AB-':'bg-violet-100 text-violet-700','O+':'bg-blue-100 text-blue-700','O-':'bg-sky-100 text-sky-700' };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Student Health Records"
        description="Medical profiles, vaccinations, allergies & wellness tracking"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2 hover:rotate-180 transition-transform duration-500" />Refresh</Button>
            <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Record</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Health Records', value: records.length, icon: Heart, color: 'border-l-red-500' },
          { label: 'With Allergies', value: records.filter(r => r.allergies).length, icon: AlertTriangle, color: 'border-l-amber-500' },
          { label: 'Chronic Conditions', value: records.filter(r => r.chronicConditions).length, icon: Activity, color: 'border-l-purple-500' },
          { label: 'Vaccinated', value: records.filter(r => r.vaccinations?.length > 0).length, icon: Syringe, color: 'border-l-green-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              <Icon className="h-6 w-6 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Health Records</TabsTrigger>
          <TabsTrigger value="alerts">Medical Alerts</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccination Status</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y">{[...Array(5)].map((_,i) => <div key={i} className="h-14 animate-pulse bg-muted/20 m-2 rounded" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Heart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No health records found</p>
                  <Button size="sm" className="mt-3" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Record</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40"><TableHead>Student</TableHead><TableHead>Blood Group</TableHead><TableHead>BMI</TableHead><TableHead>Allergies</TableHead><TableHead>Vaccinations</TableHead><TableHead>Last Checkup</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(r => {
                      const bmi = BMI(r.height, r.weight);
                      return (
                        <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{r.student?.fullName}</p>
                              <p className="text-xs text-muted-foreground">{r.student?.class?.name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {r.bloodGroup ? (
                              <Badge className={`text-xs ${BLOOD_COLOR[r.bloodGroup] || 'bg-gray-100'}`}>{r.bloodGroup}</Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            {bmi ? (
                              <div>
                                <span className="font-medium text-sm">{bmi.value}</span>
                                <Badge variant="outline" className="ml-1 text-xs">{bmi.status}</Badge>
                              </div>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            {r.allergies ? (
                              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{r.allergies.slice(0,30)}{r.allergies.length > 30 ? '...' : ''}</span>
                            ) : <span className="text-muted-foreground text-xs">None</span>}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{r.vaccinations?.length || 0} vaccines</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.lastCheckup ? new Date(r.lastCheckup).toLocaleDateString('en-PK') : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <div className="grid gap-3">
            {records.filter(r => r.allergies || r.chronicConditions).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />No medical alerts
              </div>
            ) : records.filter(r => r.allergies || r.chronicConditions).map(r => (
              <Card key={r.id} className="border-l-4 border-l-amber-400">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{r.student?.fullName}</p>
                      <p className="text-xs text-muted-foreground mb-2">{r.student?.class?.name}</p>
                      {r.allergies && <p className="text-sm"><span className="font-medium text-amber-700">Allergies:</span> {r.allergies}</p>}
                      {r.chronicConditions && <p className="text-sm mt-1"><span className="font-medium text-red-700">Conditions:</span> {r.chronicConditions}</p>}
                      {r.medications && <p className="text-sm mt-1"><span className="font-medium text-blue-700">Medications:</span> {r.medications}</p>}
                    </div>
                    {r.bloodGroup && <Badge className={`${BLOOD_COLOR[r.bloodGroup] || ''} flex-shrink-0`}>{r.bloodGroup}</Badge>}
                  </div>
                  {r.emergencyContact && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Emergency: {r.emergencyContact} · {r.emergencyPhone}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vaccinations" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {VACCINES.map(vaccine => {
              const vaccinated = records.filter(r => r.vaccinations?.includes(vaccine)).length;
              const pct = records.length > 0 ? Math.round((vaccinated/records.length)*100) : 0;
              return (
                <Card key={vaccine}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div><p className="font-medium text-sm">{vaccine}</p><p className="text-xs text-muted-foreground">{vaccinated} / {records.length} students</p></div>
                      <Badge variant="outline" className={pct >= 80 ? 'text-green-700 border-green-300' : pct >= 50 ? 'text-amber-700 border-amber-300' : 'text-red-700 border-red-300'}>{pct}%</Badge>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Health Record</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Student *</Label>
              <Select value={form.studentId} onValueChange={v => f('studentId', v)} disabled={!!editing}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Blood Group</Label>
              <Select value={form.bloodGroup} onValueChange={v => f('bloodGroup', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{BLOOD_GROUPS.map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Last Checkup Date</Label><Input type="date" value={form.lastCheckup} onChange={e => f('lastCheckup', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Height (cm)</Label><Input type="number" value={form.height} onChange={e => f('height', e.target.value)} placeholder="e.g. 150" /></div>
            <div className="space-y-1.5"><Label>Weight (kg)</Label><Input type="number" value={form.weight} onChange={e => f('weight', e.target.value)} placeholder="e.g. 45" /></div>
            <div className="space-y-1.5"><Label>Vision</Label><Input value={form.vision} onChange={e => f('vision', e.target.value)} placeholder="e.g. 6/6 normal" /></div>
            <div className="space-y-1.5"><Label>Hearing</Label><Input value={form.hearing} onChange={e => f('hearing', e.target.value)} placeholder="e.g. Normal" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Allergies</Label><Input value={form.allergies} onChange={e => f('allergies', e.target.value)} placeholder="Nuts, dust, pollen..." /></div>
            <div className="col-span-2 space-y-1.5"><Label>Chronic Conditions</Label><Input value={form.chronicConditions} onChange={e => f('chronicConditions', e.target.value)} placeholder="Asthma, diabetes..." /></div>
            <div className="col-span-2 space-y-1.5"><Label>Current Medications</Label><Input value={form.medications} onChange={e => f('medications', e.target.value)} placeholder="Inhaler, insulin..." /></div>
            <div className="space-y-1.5"><Label>Emergency Contact Name</Label><Input value={form.emergencyContact} onChange={e => f('emergencyContact', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Emergency Contact Phone</Label><Input value={form.emergencyPhone} onChange={e => f('emergencyPhone', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Doctor Name</Label><Input value={form.doctorName} onChange={e => f('doctorName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Doctor Phone</Label><Input value={form.doctorPhone} onChange={e => f('doctorPhone', e.target.value)} /></div>
            <div className="col-span-2 space-y-2">
              <Label>Vaccinations Received</Label>
              <div className="flex flex-wrap gap-2">
                {VACCINES.map(v => (
                  <button key={v} type="button" onClick={() => toggleVaccine(v)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.vaccinations?.includes(v) ? 'bg-green-100 text-green-700 border-green-300' : 'bg-muted text-muted-foreground border-muted-foreground/20 hover:border-green-300'}`}>
                    <Syringe className="h-3 w-3 inline mr-1" />{v}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Additional Notes</Label><Textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />}
              {editing ? 'Update Record' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
