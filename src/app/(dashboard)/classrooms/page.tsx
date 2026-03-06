'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, School, Plus, RefreshCw, Edit, Trash2,
  CheckCircle2, XCircle, Users, Monitor, Wifi,
  Thermometer, BookOpen, Dumbbell, FlaskConical,
  Search, Filter,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const ROOM_TYPES   = ['Classroom', 'Lab', 'Library', 'Hall', 'Gym', 'Office', 'Staffroom', 'Storage'];
const FACILITIES   = ['Projector', 'Smart Board', 'AC', 'Whiteboard', 'Computer', 'WiFi', 'Lab Equipment', 'Sports Equipment'];

const TYPE_COLORS: Record<string, string> = {
  Classroom:  'bg-blue-100 text-blue-700 border-blue-200',
  Lab:        'bg-green-100 text-green-700 border-green-200',
  Library:    'bg-purple-100 text-purple-700 border-purple-200',
  Hall:       'bg-amber-100 text-amber-700 border-amber-200',
  Gym:        'bg-orange-100 text-orange-700 border-orange-200',
  Office:     'bg-slate-100 text-slate-700 border-slate-200',
  Staffroom:  'bg-teal-100 text-teal-700 border-teal-200',
  Storage:    'bg-gray-100 text-gray-600 border-gray-200',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  Classroom: BookOpen,
  Lab:       FlaskConical,
  Library:   BookOpen,
  Hall:      Users,
  Gym:       Dumbbell,
  Office:    Monitor,
  Staffroom: Users,
  Storage:   Monitor,
};

const FACILITY_ICONS: Record<string, React.ElementType> = {
  Projector:        Monitor,
  'Smart Board':    Monitor,
  AC:               Thermometer,
  Whiteboard:       Monitor,
  Computer:         Monitor,
  WiFi:             Wifi,
  'Lab Equipment':  FlaskConical,
  'Sports Equipment': Dumbbell,
};

const BLANK = {
  name: '', building: '', floor: '', capacity: '40',
  type: 'Classroom', facilities: [] as string[], isAvailable: true, notes: '',
};

export default function ClassroomsPage() {
  const [data,       setData]       = useState<any>(null);
  const [loading,    setLoading]    = useState(false);
  const [addOpen,    setAddOpen]    = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [selected,   setSelected]   = useState<any>(null);
  const [form,       setForm]       = useState<any>({ ...BLANK });
  const [saving,     setSaving]     = useState(false);
  const [search,     setSearch]     = useState('');
  const [typeFil,    setTypeFil]    = useState('');
  const [availFil,   setAvailFil]   = useState('');
  const [viewMode,   setViewMode]   = useState<'grid' | 'list'>('grid');

  useEffect(() => { fetchData(); }, [typeFil, availFil]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (typeFil)  p.set('type',      typeFil);
      if (availFil) p.set('available', availFil);
      const r = await fetch(`/api/classrooms?${p}`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally { setLoading(false); }
  }, [typeFil, availFil]);

  const save = async (editing = false) => {
    if (!form.name) { toast({ title: 'Room name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const url    = '/api/classrooms';
      const method = editing ? 'PATCH' : 'POST';
      const body   = editing ? { id: selected.id, ...form } : form;
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (j.success) {
        toast({ title: editing ? 'Room updated' : 'Room added', description: form.name });
        editing ? setEditOpen(false) : setAddOpen(false);
        setForm({ ...BLANK });
        fetchData();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const toggleAvail = async (id: string, current: boolean) => {
    await fetch('/api/classrooms', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isAvailable: !current }),
    });
    fetchData();
  };

  const remove = async (id: string) => {
    await fetch(`/api/classrooms?id=${id}`, { method: 'DELETE' });
    toast({ title: 'Room deleted' });
    fetchData();
  };

  const openEdit = (room: any) => {
    setSelected(room);
    setForm({ name: room.name, building: room.building || '', floor: room.floor || '', capacity: String(room.capacity), type: room.type, facilities: room.facilities || [], isAvailable: room.isAvailable, notes: room.notes || '' });
    setEditOpen(true);
  };

  const toggleFacility = (fac: string) => {
    setForm((f: any) => ({
      ...f,
      facilities: f.facilities.includes(fac)
        ? f.facilities.filter((x: string) => x !== fac)
        : [...f.facilities, fac],
    }));
  };

  const classrooms    = (data?.classrooms   || []).filter((r: any) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.building || '').toLowerCase().includes(search.toLowerCase())
  );
  const summary       = data?.summary       || {};
  const typeBreakdown = data?.typeBreakdown || [];

  // Group by building
  const byBuilding: Record<string, any[]> = {};
  classrooms.forEach((r: any) => {
    const b = r.building || 'Main Building';
    if (!byBuilding[b]) byBuilding[b] = [];
    byBuilding[b].push(r);
  });

  const RoomForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 py-1">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label>Room Name / Number *</Label>
          <Input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Room 101, Science Lab" className="mt-1" autoFocus />
        </div>
        <div>
          <Label>Capacity</Label>
          <Input type="number" min={1} value={form.capacity} onChange={e => setForm((f: any) => ({ ...f, capacity: e.target.value }))} className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Type</Label>
          <Select value={form.type} onValueChange={v => setForm((f: any) => ({ ...f, type: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{ROOM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Building</Label>
          <Input value={form.building} onChange={e => setForm((f: any) => ({ ...f, building: e.target.value }))} placeholder="Main, Block A…" className="mt-1" />
        </div>
        <div>
          <Label>Floor</Label>
          <Input value={form.floor} onChange={e => setForm((f: any) => ({ ...f, floor: e.target.value }))} placeholder="Ground, 1st…" className="mt-1" />
        </div>
      </div>
      <div>
        <Label className="mb-2 block">Facilities</Label>
        <div className="flex flex-wrap gap-2">
          {FACILITIES.map(fac => {
            const active = form.facilities.includes(fac);
            return (
              <button key={fac} type="button" onClick={() => toggleFacility(fac)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${active ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-muted-foreground hover:border-blue-300'}`}>
                {fac}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} placeholder="Any special notes about this room…" rows={2} className="mt-1 resize-none" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="availChk" checked={form.isAvailable}
          onChange={e => setForm((f: any) => ({ ...f, isAvailable: e.target.checked }))}
          className="h-4 w-4 rounded" />
        <Label htmlFor="availChk" className="cursor-pointer font-normal card-hover">Room is available</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={saving}><School className="mr-2 h-4 w-4" />Save Room</Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-50"><School className="h-6 w-6 text-blue-600" /></span>
              Classroom Management
            </h1>
            <p className="text-muted-foreground mt-0.5">Manage rooms, labs, halls and their facilities</p>
          </div>
          <Button onClick={() => { setForm({ ...BLANK }); setAddOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />Add Room
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Rooms',    val: summary.total         || 0, icon: School,       color: 'text-slate-600', bg: 'bg-slate-50',  border: 'border-l-slate-400' },
            { label: 'Available',      val: summary.available     || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50',  border: 'border-l-green-500' },
            { label: 'Unavailable',    val: summary.unavailable   || 0, icon: XCircle,      color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-l-red-500' },
            { label: 'Total Capacity', val: summary.totalCapacity || 0, icon: Users,        color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-l-blue-500' },
          ].map(({ label, val, icon: Icon, color, bg, border }) => (
            <Card key={label} className={`border-l-4 ${border} overflow-hidden`}>
              <CardContent className={`pt-4 pb-3 ${bg}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {loading ? <div className="h-7 w-10 bg-muted animate-pulse rounded mt-1" /> :
                      <p className={`text-2xl font-bold ${color} mt-0.5`}>{val}</p>}
                  </div>
                  <Icon className={`h-7 w-7 ${color} opacity-40`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search rooms…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={typeFil || 'all'} onValueChange={v => setTypeFil(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ROOM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={availFil || 'all'} onValueChange={v => setAvailFil(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Availability" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Available</SelectItem>
              <SelectItem value="false">Unavailable</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => fetchData()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <div className="flex gap-1 ml-auto">
            {(['grid', 'list'] as const).map(v => (
              <Button key={v} variant={viewMode === v ? 'default' : 'outline'} size="sm" onClick={() => setViewMode(v)}>
                {v === 'grid' ? '⊞' : '☰'}
              </Button>
            ))}
          </div>
        </div>

        {/* Type chips */}
        {typeBreakdown.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {typeBreakdown.map((t: any) => (
              <button key={t.type}
                onClick={() => setTypeFil(typeFil === t.type ? '' : t.type)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${typeFil === t.type ? 'bg-primary text-primary-foreground border-primary' : (TYPE_COLORS[t.type] || 'bg-gray-100 text-gray-700 border-gray-200') + ' hover:border-primary/50'}`}>
                {t.type} ({t.count})
              </button>
            ))}
          </div>
        )}

        {/* Rooms */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
        ) : classrooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-20 text-muted-foreground gap-3">
              <School className="h-12 w-12 opacity-20" />
              <p className="font-semibold">No rooms found</p>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" />Add First Room</Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          Object.entries(byBuilding).map(([building, rooms]) => (
            <div key={building}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{building}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rooms.map((room: any) => {
                  const TypeIcon = TYPE_ICONS[room.type] || School;
                  const tcls     = TYPE_COLORS[room.type] || 'bg-gray-100 text-gray-700 border-gray-200';
                  return (
                    <Card key={room.id} className={`hover:shadow-md transition-shadow ${!room.isAvailable ? 'opacity-70' : ''}`}>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className={`p-2 rounded-lg ${tcls.split(' ')[0]}`}>
                            <TypeIcon className={`h-5 w-5 ${tcls.split(' ')[1]}`} />
                          </div>
                          {room.isAvailable
                            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Available</span>
                            : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">In Use</span>}
                        </div>
                        <h3 className="font-bold text-base">{room.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-medium ${tcls}`}>{room.type}</span>
                          {room.floor && <span>{room.floor} floor</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />Capacity: {room.capacity}
                        </div>
                        {room.facilities?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {room.facilities.slice(0, 4).map((f: string) => (
                              <span key={f} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{f}</span>
                            ))}
                            {room.facilities.length > 4 && <span className="text-[10px] text-muted-foreground">+{room.facilities.length - 4}</span>}
                          </div>
                        )}
                      </CardContent>
                      <div className="px-4 pb-3 border-t pt-2 flex gap-1">
                        <Button variant="ghost" size="sm" className="text-xs flex-1"
                          onClick={() => toggleAvail(room.id, room.isAvailable)}>
                          {room.isAvailable ? <><XCircle className="mr-1 h-3 w-3" />Mark In Use</> : <><CheckCircle2 className="mr-1 h-3 w-3" />Mark Available</>}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(room)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => remove(room.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {classrooms.map((room: any) => {
                const TypeIcon = TYPE_ICONS[room.type] || School;
                const tcls     = TYPE_COLORS[room.type] || '';
                return (
                  <div key={room.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20">
                    <div className={`p-1.5 rounded-lg ${(tcls || 'bg-gray-100').split(' ')[0]}`}>
                      <TypeIcon className={`h-4 w-4 ${(tcls || 'text-gray-700').split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{room.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {room.type}{room.building ? ` · ${room.building}` : ''}{room.floor ? `, ${room.floor} floor` : ''} · Capacity {room.capacity}
                      </div>
                      {room.facilities?.length > 0 && (
                        <div className="text-xs text-muted-foreground">{room.facilities.join(', ')}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {room.isAvailable
                        ? <span className="text-xs font-semibold text-green-600">Available</span>
                        : <span className="text-xs font-semibold text-red-500">In Use</span>}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(room)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => remove(room.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setForm({ ...BLANK }); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><School className="h-5 w-5" />Add New Room</DialogTitle></DialogHeader>
          <RoomForm onSave={() => save(false)} onCancel={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Room — {selected?.name}</DialogTitle></DialogHeader>
          <RoomForm onSave={() => save(true)} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
