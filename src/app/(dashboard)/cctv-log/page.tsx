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
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, Camera, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const INCIDENT_TYPES = ['Unauthorized Entry', 'Vandalism', 'Theft', 'Suspicious Activity', 'Fight / Altercation', 'Visitor Violation', 'Property Damage', 'After-Hours Activity', 'Safety Hazard', 'Other'];
const SEVERITY = ['Low', 'Medium', 'High', 'Critical'];
const SEVERITY_COLORS: Record<string, string> = { Critical: 'bg-red-100 text-red-700', High: 'bg-orange-100 text-orange-700', Medium: 'bg-amber-100 text-amber-700', Low: 'bg-slate-100 text-slate-600' };
const STATUS_COLORS: Record<string, string> = { Open: 'bg-amber-100 text-amber-700', 'Under Investigation': 'bg-blue-100 text-blue-700', Resolved: 'bg-green-100 text-green-700', Closed: 'bg-slate-100 text-slate-500' };
const fmtDate = (d: string) => d ? new Date(d).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function CCTVLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, unresolved: 0, cameras: 0, activeCams: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [logDialog, setLogDialog] = useState(false);
  const [camDialog, setCamDialog] = useState(false);
  const [editingCam, setEditingCam] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyLog = () => ({ incidentType: 'Suspicious Activity', severity: 'Medium', description: '', location: '', cameraId: '', footage: '', reportedBy: '', date: new Date().toISOString().slice(0, 16), actionTaken: '', status: 'Open' });
  const emptyCam = () => ({ name: '', location: '', type: 'Fixed', resolution: '1080p', status: 'Active', notes: '' });
  const [logForm, setLogForm] = useState<any>(emptyLog());
  const [camForm, setCamForm] = useState<any>(emptyCam());

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, type: typeFilter });
      const res = await fetch(`/api/cctv-log?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLogs(data.items || []); setSummary(data.summary || {}); setCameras(data.cameras || []);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, typeFilter]);

  const loadCams = useCallback(async () => {
    const res = await fetch('/api/cctv-log?entity=cameras');
    const data = await res.json();
    setCameras(data.items || []);
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const saveLog = async () => {
    if (!logForm.description || !logForm.location) { toast({ title: 'Description and location required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/cctv-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(logForm) });
      toast({ title: 'Incident logged' }); setLogDialog(false); loadLogs();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveCam = async () => {
    if (!camForm.name || !camForm.location) { toast({ title: 'Name and location required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/cctv-log', { method: editingCam ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingCam ? { ...camForm, entity: 'camera', id: editingCam.id } : { ...camForm, entity: 'camera' }) });
      toast({ title: editingCam ? 'Camera updated' : 'Camera added' }); setCamDialog(false); loadCams(); loadLogs();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/cctv-log', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    toast({ title: `Status → ${status}` }); loadLogs();
  };

  const del = async (id: string, entity?: string) => {
    if (!confirm('Delete?')) return;
    await fetch('/api/cctv-log', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity }) });
    toast({ title: 'Deleted' }); entity === 'camera' ? loadCams() : loadLogs();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="CCTV & Security Log" description="Camera registry, incident logging and security event tracking"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingCam(null); setCamForm(emptyCam()); setCamDialog(true); }}><Camera className="h-4 w-4 mr-2" />Add Camera</Button>
          <Button size="sm" onClick={() => { setLogForm(emptyLog()); setLogDialog(true); }}><Plus className="h-4 w-4 mr-2" />Log Incident</Button>
        </div>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Incidents', value: summary.total, icon: <Shield className="h-4 w-4 text-slate-500" />, color: 'border-l-slate-500' },
          { label: 'Unresolved', value: summary.unresolved, icon: <AlertTriangle className="h-4 w-4 text-red-500" />, color: 'border-l-red-500' },
          { label: 'Total Cameras', value: summary.cameras, icon: <Camera className="h-4 w-4 text-blue-500" />, color: 'border-l-blue-500' },
          { label: 'Active Cameras', value: summary.activeCams, icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'border-l-green-500' },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4"><div className="flex items-center justify-between">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div><p className="text-xs text-muted-foreground mt-1">{c.label}</p></CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="incidents">
        <TabsList>
          <TabsTrigger value="incidents">🚨 Incident Log</TabsTrigger>
          <TabsTrigger value="cameras" onClick={loadCams}>📷 Cameras</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="mt-4 space-y-4">
          <Card><CardContent className="p-4"><div className="flex gap-3">
            <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search incidents..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Select value={typeFilter} onValueChange={v => setTypeFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-44"><SelectValue placeholder="All Types" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{INCIDENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" onClick={loadLogs}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div></CardContent></Card>

          {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            logs.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><Shield className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No incidents logged</p></CardContent></Card> :
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date/Time</TableHead><TableHead>Type</TableHead><TableHead>Location</TableHead>
                  <TableHead>Description</TableHead><TableHead>Severity</TableHead><TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(log.date || log.createdAt)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{log.incidentType}</Badge></TableCell>
                      <TableCell className="text-sm">{log.location}</TableCell>
                      <TableCell className="max-w-xs"><p className="text-sm truncate">{log.description}</p>{log.actionTaken && <p className="text-xs text-muted-foreground truncate">Action: {log.actionTaken}</p>}</TableCell>
                      <TableCell><Badge className={`text-xs ${SEVERITY_COLORS[log.severity] || ''}`}>{log.severity}</Badge></TableCell>
                      <TableCell><Badge className={`text-xs ${STATUS_COLORS[log.status] || ''}`}>{log.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {log.status === 'Open' && <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-700" onClick={() => updateStatus(log.id, 'Under Investigation')}>Investigate</Button>}
                          {log.status === 'Under Investigation' && <Button variant="ghost" size="sm" className="h-7 text-xs text-green-700" onClick={() => updateStatus(log.id, 'Resolved')}>Resolve</Button>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(log.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          }
        </TabsContent>

        <TabsContent value="cameras" className="mt-4">
          {cameras.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><Camera className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No cameras registered</p><Button size="sm" className="mt-3" onClick={() => { setEditingCam(null); setCamForm(emptyCam()); setCamDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Camera</Button></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cameras.map(cam => (
                <Card key={cam.id} className={cam.status !== 'Active' ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /><span className="font-semibold">{cam.name}</span></div>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          <p>📍 {cam.location}</p>
                          <p>📷 {cam.type} · {cam.resolution}</p>
                        </div>
                        <Badge className={`text-xs mt-2 ${cam.status === 'Active' ? 'bg-green-100 text-green-700' : cam.status === 'Offline' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{cam.status}</Badge>
                        {cam.notes && <p className="text-xs text-muted-foreground mt-1 italic">{cam.notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCam(cam); setCamForm(cam); setCamDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(cam.id, 'camera')}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>
      </Tabs>

      {/* Log Incident Dialog */}
      <Dialog open={logDialog} onOpenChange={setLogDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Security Incident</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Incident Type</Label><Select value={logForm.incidentType} onValueChange={v => setLogForm((f: any) => ({ ...f, incidentType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{INCIDENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Severity</Label><Select value={logForm.severity} onValueChange={v => setLogForm((f: any) => ({ ...f, severity: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SEVERITY.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Location *</Label><Input value={logForm.location} onChange={e => setLogForm((f: any) => ({ ...f, location: e.target.value }))} placeholder="e.g. Main Gate, Block A Corridor" /></div>
            <div className="space-y-1.5"><Label>Date/Time</Label><Input type="datetime-local" value={logForm.date} onChange={e => setLogForm((f: any) => ({ ...f, date: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Camera</Label><Select value={logForm.cameraId} onValueChange={v => setLogForm((f: any) => ({ ...f, cameraId: v }))}><SelectTrigger><SelectValue placeholder="Select camera" /></SelectTrigger><SelectContent><SelectItem value="">No specific camera</SelectItem>{cameras.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Description *</Label><Textarea value={logForm.description} onChange={e => setLogForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the incident..." /></div>
            <div className="col-span-2 space-y-1.5"><Label>Action Taken</Label><Textarea value={logForm.actionTaken} onChange={e => setLogForm((f: any) => ({ ...f, actionTaken: e.target.value }))} rows={2} placeholder="What action was taken?" /></div>
            <div className="space-y-1.5"><Label>Reported By</Label><Input value={logForm.reportedBy} onChange={e => setLogForm((f: any) => ({ ...f, reportedBy: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Footage Reference</Label><Input value={logForm.footage} onChange={e => setLogForm((f: any) => ({ ...f, footage: e.target.value }))} placeholder="e.g. CAM-04 15:32-15:45" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setLogDialog(false)}>Cancel</Button><Button onClick={saveLog} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Log Incident</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Dialog */}
      <Dialog open={camDialog} onOpenChange={setCamDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingCam ? 'Edit Camera' : 'Add Camera'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Camera Name *</Label><Input value={camForm.name} onChange={e => setCamForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Front Gate CAM-01" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Location *</Label><Input value={camForm.location} onChange={e => setCamForm((f: any) => ({ ...f, location: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={camForm.type} onValueChange={v => setCamForm((f: any) => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Fixed">Fixed</SelectItem><SelectItem value="PTZ">PTZ</SelectItem><SelectItem value="Dome">Dome</SelectItem><SelectItem value="Bullet">Bullet</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Resolution</Label><Select value={camForm.resolution} onValueChange={v => setCamForm((f: any) => ({ ...f, resolution: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="720p">720p</SelectItem><SelectItem value="1080p">1080p</SelectItem><SelectItem value="2K">2K</SelectItem><SelectItem value="4K">4K</SelectItem></SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Status</Label><Select value={camForm.status} onValueChange={v => setCamForm((f: any) => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Offline">Offline</SelectItem><SelectItem value="Under Maintenance">Under Maintenance</SelectItem></SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Input value={camForm.notes} onChange={e => setCamForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCamDialog(false)}>Cancel</Button><Button onClick={saveCam} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingCam ? 'Update' : 'Add Camera'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
