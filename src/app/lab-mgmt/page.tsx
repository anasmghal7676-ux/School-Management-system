'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
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
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, FlaskConical, Package, BookOpen, CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const LAB_TYPES = ['Science', 'Physics', 'Chemistry', 'Biology', 'Computer', 'Language', 'Mathematics', 'Art', 'Home Economics', 'Other'];
const EQUIP_STATUS = ['Available', 'In Use', 'Under Maintenance', 'Damaged', 'Disposed'];
const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-green-100 text-green-700',
  'In Use': 'bg-blue-100 text-blue-700',
  'Under Maintenance': 'bg-amber-100 text-amber-700',
  Damaged: 'bg-red-100 text-red-700',
  Disposed: 'bg-slate-100 text-slate-500',
};
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function LabManagementPage() {
  const [labs, setLabs] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [equipSummary, setEquipSummary] = useState({ total: 0, available: 0, inUse: 0, maintenance: 0 });
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLab, setSelectedLab] = useState('');
  const [labDialog, setLabDialog] = useState(false);
  const [equipDialog, setEquipDialog] = useState(false);
  const [expDialog, setExpDialog] = useState(false);
  const [editingLab, setEditingLab] = useState<any>(null);
  const [editingEquip, setEditingEquip] = useState<any>(null);
  const [editingExp, setEditingExp] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyLab = () => ({ name: '', type: 'Science', capacity: '', location: '', inCharge: '', description: '', entity: 'lab' });
  const emptyEquip = () => ({ name: '', labId: selectedLab, quantity: '1', unit: 'pcs', status: 'Available', purchaseDate: '', cost: '', notes: '', entity: 'equipment' });
  const emptyExp = () => ({ title: '', labId: selectedLab, subjectId: '', subject: '', classId: '', className: '', conductedById: '', conductedBy: '', date: new Date().toISOString().slice(0, 10), duration: '60', objectives: '', procedure: '', results: '', observations: '', entity: 'experiment' });
  const [labForm, setLabForm] = useState<any>(emptyLab());
  const [equipForm, setEquipForm] = useState<any>(emptyEquip());
  const [expForm, setExpForm] = useState<any>(emptyExp());

  const loadLabs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lab-mgmt?view=labs');
      const data = await res.json();
      setLabs(data.items || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  const loadEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'equipment', labId: selectedLab, search });
      const res = await fetch(`/api/lab-mgmt?${params}`);
      const data = await res.json();
      setEquipment(data.items || []);
      setEquipSummary(data.summary || {});
      setLabs(l => l.length ? l : (data.labs || []));
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [selectedLab, search]);

  const loadExperiments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ view: 'experiments', labId: selectedLab, search });
      const res = await fetch(`/api/lab-mgmt?${params}`);
      const data = await res.json();
      setExperiments(data.items || []);
      setClasses(data.classes || []);
      setSubjects(data.subjects || []);
      setStaff(data.staff || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [selectedLab, search]);

  useEffect(() => { loadLabs(); }, [loadLabs]);

  const save = async (entity: string, form: any, editing: any, reload: () => void, close: () => void) => {
    setSaving(true);
    try {
      await fetch('/api/lab-mgmt', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...form, entity, id: editing.id } : { ...form, entity }),
      });
      toast({ title: editing ? 'Updated' : 'Created' }); close(); reload();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string, entity: string, reload: () => void) => {
    if (!confirm('Delete?')) return;
    await fetch('/api/lab-mgmt', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity }) });
    toast({ title: 'Deleted' }); reload();
  };

  const handleSubject = (id: string) => {
    const s = subjects.find(x => x.id === id);
    setExpForm((f: any) => ({ ...f, subjectId: id, subject: s?.name || '' }));
  };
  const handleClass = (id: string) => {
    const c = classes.find(x => x.id === id);
    setExpForm((f: any) => ({ ...f, classId: id, className: c?.name || '' }));
  };
  const handleStaff = (id: string) => {
    const s = staff.find(x => x.id === id);
    setExpForm((f: any) => ({ ...f, conductedById: id, conductedBy: s?.fullName || '' }));
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Lab Management" description="Manage science and computer labs, equipment inventory and experiment sessions"
        actions={<Button size="sm" onClick={() => { setEditingLab(null); setLabForm(emptyLab()); setLabDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Lab</Button>}
      />

      <Tabs defaultValue="labs" onValueChange={v => { if (v === 'equipment') loadEquipment(); if (v === 'experiments') loadExperiments(); }}>
        <TabsList>
          <TabsTrigger value="labs">🔬 Labs</TabsTrigger>
          <TabsTrigger value="equipment">📦 Equipment</TabsTrigger>
          <TabsTrigger value="experiments">📋 Experiments</TabsTrigger>
        </TabsList>

        {/* LABS */}
        <TabsContent value="labs" className="mt-4">
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            labs.length === 0 ? (
              <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground">
                <FlaskConical className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No labs registered yet</p>
                <Button size="sm" className="mt-3" onClick={() => { setEditingLab(null); setLabForm(emptyLab()); setLabDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add First Lab</Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {labs.map(lab => (
                  <Card key={lab.id} className="hover:shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" /><span className="font-semibold">{lab.name}</span></div>
                          <Badge variant="outline" className="text-xs mt-1">{lab.type}</Badge>
                          <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                            {lab.location && <p>📍 {lab.location}</p>}
                            {lab.capacity && <p>👥 Capacity: {lab.capacity}</p>}
                            {lab.inCharge && <p>👤 In-charge: {lab.inCharge}</p>}
                            {lab.description && <p className="italic mt-1">{lab.description}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingLab(lab); setLabForm(lab); setLabDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(lab.id, 'lab', loadLabs)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          }
        </TabsContent>

        {/* EQUIPMENT */}
        <TabsContent value="equipment" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Items', value: equipSummary.total, color: 'border-l-slate-500' },
              { label: 'Available', value: equipSummary.available, color: 'border-l-green-500' },
              { label: 'In Use', value: equipSummary.inUse, color: 'border-l-blue-500' },
              { label: 'Maintenance', value: equipSummary.maintenance, color: 'border-l-amber-500' },
            ].map(c => (
              <Card key={c.label} className={`border-l-4 ${c.color}`}><CardContent className="p-3"><p className="text-2xl font-bold">{c.value}</p><p className="text-xs text-muted-foreground">{c.label}</p></CardContent></Card>
            ))}
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search equipment..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Select value={selectedLab} onValueChange={v => setSelectedLab(v === 'all' ? '' : v)}><SelectTrigger className="w-40"><SelectValue placeholder="All Labs" /></SelectTrigger><SelectContent><SelectItem value="all">All Labs</SelectItem>{labs.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" onClick={loadEquipment}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
            <Button size="sm" onClick={() => { setEditingEquip(null); setEquipForm(emptyEquip()); setEquipDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Equipment</Button>
          </div>
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            equipment.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><Package className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No equipment found</p></CardContent></Card> :
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Lab</TableHead><TableHead>Qty</TableHead><TableHead>Cost</TableHead><TableHead>Purchase Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {equipment.map(eq => (
                    <TableRow key={eq.id} className="hover:bg-muted/20">
                      <TableCell><div className="font-medium text-sm">{eq.name}</div>{eq.notes && <div className="text-xs text-muted-foreground">{eq.notes}</div>}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{labs.find(l => l.id === eq.labId)?.name || '—'}</TableCell>
                      <TableCell className="font-medium">{eq.quantity} {eq.unit}</TableCell>
                      <TableCell className="text-sm">{eq.cost ? `PKR ${Number(eq.cost).toLocaleString()}` : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(eq.purchaseDate)}</TableCell>
                      <TableCell><Badge className={`text-xs ${STATUS_COLORS[eq.status] || ''}`}>{eq.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingEquip(eq); setEquipForm(eq); setEquipDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(eq.id, 'equipment', loadEquipment)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          }
        </TabsContent>

        {/* EXPERIMENTS */}
        <TabsContent value="experiments" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search experiments..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Select value={selectedLab} onValueChange={v => setSelectedLab(v === 'all' ? '' : v)}><SelectTrigger className="w-40"><SelectValue placeholder="All Labs" /></SelectTrigger><SelectContent><SelectItem value="all">All Labs</SelectItem>{labs.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" onClick={loadExperiments}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
            <Button size="sm" onClick={() => { setEditingExp(null); setExpForm(emptyExp()); setExpDialog(true); }}><Plus className="h-4 w-4 mr-2" />Log Experiment</Button>
          </div>
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            experiments.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No experiments logged</p></CardContent></Card> :
            <div className="space-y-3">
              {experiments.map(exp => (
                <Card key={exp.id} className="hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{exp.title}</span>
                          {exp.subject && <Badge variant="outline" className="text-xs">{exp.subject}</Badge>}
                          {exp.className && <Badge variant="outline" className="text-xs">{exp.className}</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                          <span>📅 {fmtDate(exp.date)}</span>
                          {exp.duration && <span>⏱ {exp.duration} min</span>}
                          {exp.conductedBy && <span>👤 {exp.conductedBy}</span>}
                          <span>🔬 {labs.find(l => l.id === exp.labId)?.name || '—'}</span>
                        </div>
                        {exp.objectives && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1"><strong>Objectives:</strong> {exp.objectives}</p>}
                        {exp.results && <p className="text-xs text-muted-foreground line-clamp-1"><strong>Results:</strong> {exp.results}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingExp(exp); setExpForm(exp); setExpDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(exp.id, 'experiment', loadExperiments)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>
      </Tabs>

      {/* Lab Dialog */}
      <Dialog open={labDialog} onOpenChange={setLabDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingLab ? 'Edit Lab' : 'Add Lab'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Lab Name *</Label><Input value={labForm.name} onChange={e => setLabForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={labForm.type} onValueChange={v => setLabForm((f: any) => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LAB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" value={labForm.capacity} onChange={e => setLabForm((f: any) => ({ ...f, capacity: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Location</Label><Input value={labForm.location} onChange={e => setLabForm((f: any) => ({ ...f, location: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Lab In-Charge</Label><Input value={labForm.inCharge} onChange={e => setLabForm((f: any) => ({ ...f, inCharge: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={labForm.description} onChange={e => setLabForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setLabDialog(false)}>Cancel</Button><Button onClick={() => save('lab', labForm, editingLab, loadLabs, () => setLabDialog(false))} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingLab ? 'Update' : 'Add Lab'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipment Dialog */}
      <Dialog open={equipDialog} onOpenChange={setEquipDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingEquip ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Item Name *</Label><Input value={equipForm.name} onChange={e => setEquipForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Lab</Label><Select value={equipForm.labId} onValueChange={v => setEquipForm((f: any) => ({ ...f, labId: v }))}><SelectTrigger><SelectValue placeholder="Select lab" /></SelectTrigger><SelectContent>{labs.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" value={equipForm.quantity} onChange={e => setEquipForm((f: any) => ({ ...f, quantity: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Unit</Label><Input value={equipForm.unit} onChange={e => setEquipForm((f: any) => ({ ...f, unit: e.target.value }))} placeholder="pcs, sets..." /></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={equipForm.status} onValueChange={v => setEquipForm((f: any) => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EQUIP_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Cost (PKR)</Label><Input type="number" value={equipForm.cost} onChange={e => setEquipForm((f: any) => ({ ...f, cost: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Purchase Date</Label><Input type="date" value={equipForm.purchaseDate} onChange={e => setEquipForm((f: any) => ({ ...f, purchaseDate: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Input value={equipForm.notes} onChange={e => setEquipForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEquipDialog(false)}>Cancel</Button><Button onClick={() => save('equipment', equipForm, editingEquip, loadEquipment, () => setEquipDialog(false))} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingEquip ? 'Update' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Experiment Dialog */}
      <Dialog open={expDialog} onOpenChange={setExpDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingExp ? 'Edit Experiment' : 'Log Experiment'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Experiment Title *</Label><Input value={expForm.title} onChange={e => setExpForm((f: any) => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Lab</Label><Select value={expForm.labId} onValueChange={v => setExpForm((f: any) => ({ ...f, labId: v }))}><SelectTrigger><SelectValue placeholder="Select lab" /></SelectTrigger><SelectContent>{labs.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Subject</Label><Select value={expForm.subjectId} onValueChange={handleSubject}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Class</Label><Select value={expForm.classId} onValueChange={handleClass}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Conducted By</Label><Select value={expForm.conductedById} onValueChange={handleStaff}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={expForm.date} onChange={e => setExpForm((f: any) => ({ ...f, date: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={expForm.duration} onChange={e => setExpForm((f: any) => ({ ...f, duration: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Objectives</Label><Textarea value={expForm.objectives} onChange={e => setExpForm((f: any) => ({ ...f, objectives: e.target.value }))} rows={2} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Procedure / Steps</Label><Textarea value={expForm.procedure} onChange={e => setExpForm((f: any) => ({ ...f, procedure: e.target.value }))} rows={2} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Results & Observations</Label><Textarea value={expForm.results} onChange={e => setExpForm((f: any) => ({ ...f, results: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setExpDialog(false)}>Cancel</Button><Button onClick={() => save('experiment', expForm, editingExp, loadExperiments, () => setExpDialog(false))} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingExp ? 'Update' : 'Log'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
