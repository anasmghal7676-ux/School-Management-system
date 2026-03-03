'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Edit, Trash2, RefreshCw, Building2, BedDouble, Users, Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const ROOM_TYPES = ['Single', 'Double', 'Triple', 'Quad', 'Dormitory'];
const ROOM_STATUS = ['Available', 'Occupied', 'Maintenance'];
const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-green-100 text-green-700 border-green-300',
  Occupied: 'bg-blue-100 text-blue-700 border-blue-300',
  Maintenance: 'bg-amber-100 text-amber-700 border-amber-300',
};
const fmt = (n: number | null) => n != null ? `PKR ${Number(n).toLocaleString('en-PK')}` : '—';

export default function HostelRoomsPage() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalBlocks: 0, totalRooms: 0, occupied: 0, available: 0, maintenance: 0, totalCapacity: 0, occupancy: 0 });
  const [loading, setLoading] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Dialog state
  const [dialog, setDialog] = useState<'block' | 'room' | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [parentBlockId, setParentBlockId] = useState('');
  const [blockForm, setBlockForm] = useState({ blockName: '', blockType: 'Boys', totalRooms: '', wardenId: '', description: '' });
  const [roomForm, setRoomForm] = useState({ blockId: '', roomNumber: '', roomType: 'Single', capacity: '1', floorNumber: '1', monthlyFee: '', status: 'Available', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter, type: typeFilter });
      const res = await fetch(`/api/hostel-rooms?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBlocks(data.blocks || []);
      setStaff(data.staff || []);
      setSummary(data.summary || {});
      // Auto-expand all blocks
      if (data.blocks?.length > 0) {
        setExpandedBlocks(new Set(data.blocks.map((b: any) => b.id)));
      }
    } catch (e: any) {
      toast({ title: 'Error loading data', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleBlock = (id: string) => {
    const next = new Set(expandedBlocks);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedBlocks(next);
  };

  const openAddBlock = () => {
    setEditing(null);
    setBlockForm({ blockName: '', blockType: 'Boys', totalRooms: '', wardenId: '', description: '' });
    setDialog('block');
  };

  const openEditBlock = (block: any) => {
    setEditing(block);
    setBlockForm({ blockName: block.blockName, blockType: block.blockType, totalRooms: String(block.totalRooms), wardenId: block.wardenId || '', description: block.description || '' });
    setDialog('block');
  };

  const openAddRoom = (blockId: string) => {
    setEditing(null);
    setParentBlockId(blockId);
    setRoomForm({ blockId, roomNumber: '', roomType: 'Single', capacity: '1', floorNumber: '1', monthlyFee: '', status: 'Available', description: '' });
    setDialog('room');
  };

  const openEditRoom = (room: any) => {
    setEditing(room);
    setRoomForm({ blockId: room.blockId, roomNumber: room.roomNumber, roomType: room.roomType, capacity: String(room.capacity), floorNumber: String(room.floorNumber), monthlyFee: room.monthlyFee ? String(room.monthlyFee) : '', status: room.status, description: room.description || '' });
    setDialog('room');
  };

  const saveBlock = async () => {
    if (!blockForm.blockName) { toast({ title: 'Block name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/hostel-rooms', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'block', ...(editing ? { id: editing.id } : {}), ...blockForm }),
      });
      toast({ title: editing ? 'Block updated' : 'Block created' });
      setDialog(null);
      load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveRoom = async () => {
    if (!roomForm.roomNumber || !roomForm.blockId) { toast({ title: 'Room number required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/hostel-rooms', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'room', ...(editing ? { id: editing.id } : {}), ...roomForm }),
      });
      toast({ title: editing ? 'Room updated' : 'Room added' });
      setDialog(null);
      load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('Delete block and all its rooms?')) return;
    await fetch('/api/hostel-rooms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'block', id }) });
    toast({ title: 'Block deleted' }); load();
  };

  const deleteRoom = async (id: string) => {
    if (!confirm('Delete room?')) return;
    await fetch('/api/hostel-rooms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'room', id }) });
    toast({ title: 'Room deleted' }); load();
  };

  const occupancyPct = summary.totalCapacity > 0 ? Math.round((summary.occupancy / summary.totalCapacity) * 100) : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Hostel Room Management"
        description="Manage hostel blocks, rooms, and occupancy across your campus"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm" onClick={openAddBlock}><Plus className="h-4 w-4 mr-2" />Add Block</Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Blocks', value: summary.totalBlocks, icon: <Building2 className="h-4 w-4 text-slate-500" />, color: 'border-l-slate-500' },
          { label: 'Available Rooms', value: summary.available, icon: <BedDouble className="h-4 w-4 text-green-500" />, color: 'border-l-green-500' },
          { label: 'Occupied Rooms', value: summary.occupied, icon: <Users className="h-4 w-4 text-blue-500" />, color: 'border-l-blue-500' },
          { label: 'Maintenance', value: summary.maintenance, icon: <Wrench className="h-4 w-4 text-amber-500" />, color: 'border-l-amber-500' },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Occupancy Bar */}
      {summary.totalCapacity > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Occupancy</span>
              <span className="text-sm font-bold">{summary.occupancy} / {summary.totalCapacity} beds ({occupancyPct}%)</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${occupancyPct > 90 ? 'bg-red-500' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${occupancyPct}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {ROOM_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ROOM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Blocks & Rooms */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
      ) : blocks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-center py-16 text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hostel blocks configured</p>
            <p className="text-sm mt-1 mb-4">Create your first block to start managing rooms</p>
            <Button onClick={openAddBlock}><Plus className="h-4 w-4 mr-2" />Add First Block</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blocks.map(block => {
            const expanded = expandedBlocks.has(block.id);
            const warden = staff.find(s => s.id === block.wardenId);
            const roomsOccupied = block.rooms.filter((r: any) => r.status === 'Occupied').length;
            return (
              <Card key={block.id} className="overflow-hidden">
                {/* Block Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 border-b bg-muted/5 card-hover"
                  onClick={() => toggleBlock(block.id)}
                >
                  <div className="flex items-center gap-3">
                    {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <span className="font-semibold">{block.blockName}</span>
                      <Badge variant="outline" className={`ml-2 text-xs ${block.blockType === 'Boys' ? 'border-blue-300 text-blue-700' : 'border-pink-300 text-pink-700'}`}>{block.blockType}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {warden && <span className="text-sm text-muted-foreground">Warden: {warden.fullName}</span>}
                    <span className="text-sm text-muted-foreground">{roomsOccupied}/{block.rooms.length} rooms occupied</span>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="h-7" onClick={() => openAddRoom(block.id)}><Plus className="h-3 w-3 mr-1" />Add Room</Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditBlock(block)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBlock(block.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </div>

                {/* Rooms Grid */}
                {expanded && (
                  <div className="p-4">
                    {block.rooms.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                        No rooms yet. <button onClick={() => openAddRoom(block.id)} className="text-primary underline ml-1">Add first room</button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {block.rooms.map((room: any) => {
                          const occupants = room.admissions?.length || 0;
                          return (
                            <div
                              key={room.id}
                              className={`relative rounded-lg border-2 p-3 ${room.status === 'Available' ? 'border-green-200 bg-green-50' : room.status === 'Occupied' ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}
                            >
                              <div className="flex items-start justify-between mb-1.5">
                                <span className="font-bold text-sm">Room {room.roomNumber}</span>
                                <div className="flex gap-0.5">
                                  <button onClick={() => openEditRoom(room)} className="text-muted-foreground hover:text-foreground"><Edit className="h-3 w-3" /></button>
                                  <button onClick={() => deleteRoom(room.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <div>{room.roomType} · Floor {room.floorNumber}</div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-2.5 w-2.5" />
                                  <span>{occupants}/{room.capacity}</span>
                                </div>
                                {room.monthlyFee && <div>{fmt(room.monthlyFee)}/mo</div>}
                              </div>
                              <Badge className={`mt-2 text-xs w-full justify-center py-0 h-5 ${STATUS_COLORS[room.status]}`}>{room.status}</Badge>
                              {/* Occupants */}
                              {room.admissions?.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-current/10 space-y-0.5">
                                  {room.admissions.map((a: any) => (
                                    <div key={a.id} className="text-xs truncate text-muted-foreground">{a.student?.fullName}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Block Dialog */}
      <Dialog open={dialog === 'block'} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Block' : 'Add Hostel Block'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Block Name *</Label><Input value={blockForm.blockName} onChange={e => setBlockForm(f => ({ ...f, blockName: e.target.value }))} placeholder="e.g. Block A, Ayesha Block" /></div>
            <div className="space-y-1.5"><Label>Type</Label><Select value={blockForm.blockType} onValueChange={v => setBlockForm(f => ({ ...f, blockType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Boys">Boys</SelectItem><SelectItem value="Girls">Girls</SelectItem><SelectItem value="Mixed">Mixed</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Total Rooms</Label><Input type="number" value={blockForm.totalRooms} onChange={e => setBlockForm(f => ({ ...f, totalRooms: e.target.value }))} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Warden</Label><Select value={blockForm.wardenId} onValueChange={v => setBlockForm(f => ({ ...f, wardenId: v }))}><SelectTrigger><SelectValue placeholder="Select warden (optional)" /></SelectTrigger><SelectContent><SelectItem value="">None</SelectItem>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea value={blockForm.description} onChange={e => setBlockForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={saveBlock} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Create Block'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Dialog */}
      <Dialog open={dialog === 'room'} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Room' : 'Add Room'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Room Number *</Label><Input value={roomForm.roomNumber} onChange={e => setRoomForm(f => ({ ...f, roomNumber: e.target.value }))} placeholder="e.g. 101, A-201" /></div>
            <div className="space-y-1.5"><Label>Room Type</Label><Select value={roomForm.roomType} onValueChange={v => setRoomForm(f => ({ ...f, roomType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROOM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Capacity (beds)</Label><Input type="number" min="1" value={roomForm.capacity} onChange={e => setRoomForm(f => ({ ...f, capacity: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Floor</Label><Input type="number" min="1" value={roomForm.floorNumber} onChange={e => setRoomForm(f => ({ ...f, floorNumber: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Monthly Fee (PKR)</Label><Input type="number" value={roomForm.monthlyFee} onChange={e => setRoomForm(f => ({ ...f, monthlyFee: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Status</Label><Select value={roomForm.status} onValueChange={v => setRoomForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROOM_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Textarea value={roomForm.description} onChange={e => setRoomForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={saveRoom} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Add Room'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
