'use client';

export const dynamic = "force-dynamic"
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
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, Calendar, MapPin, Clock, Users, Building, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const VENUE_TYPES = ['Classroom', 'Computer Lab', 'Science Lab', 'Library Hall', 'Auditorium', 'Sports Ground', 'Conference Room', 'Prayer Hall', 'Cafeteria', 'Other'];
const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled: 'bg-slate-100 text-slate-600',
};
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const today = () => new Date().toISOString().slice(0, 10);

export default function VenueBookingPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalVenues: 0, todayBookings: 0, upcoming: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [total, setTotal] = useState(0);

  const [bookingDialog, setBookingDialog] = useState(false);
  const [venueDialog, setVenueDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editingVenue, setEditingVenue] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyBooking = () => ({ venueId: '', venueName: '', purpose: '', bookedBy: '', bookedById: '', bookingDate: today(), startTime: '08:00', endTime: '09:00', attendees: '', requirements: '', status: 'Pending' });
  const emptyVenue = () => ({ name: '', type: 'Classroom', capacity: '30', location: '', facilities: '' });
  const [bookingForm, setBookingForm] = useState<any>(emptyBooking());
  const [venueForm, setVenueForm] = useState<any>(emptyVenue());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, date: dateFilter, venueId: venueFilter, page: '1' });
      const res = await fetch(`/api/venue-book?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBookings(data.bookings || []); setTotal(data.total || 0);
      setVenues(data.venues || []); setStaff(data.staff || []);
      setSummary(data.summary || {});
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, dateFilter, venueFilter]);

  useEffect(() => { load(); }, [load]);

  const bf = (k: string, v: any) => setBookingForm((f: any) => ({ ...f, [k]: v }));
  const vf = (k: string, v: string) => setVenueForm((f: any) => ({ ...f, [k]: v }));

  const handleVenueSelect = (id: string) => {
    const v = venues.find(x => x.id === id);
    setBookingForm((f: any) => ({ ...f, venueId: id, venueName: v?.name || '' }));
  };
  const handleStaff = (id: string) => {
    const s = staff.find(x => x.id === id);
    setBookingForm((f: any) => ({ ...f, bookedById: id, bookedBy: s?.fullName || '' }));
  };

  const saveBooking = async () => {
    if (!bookingForm.venueId || !bookingForm.purpose) { toast({ title: 'Venue and purpose required', variant: 'destructive' }); return; }
    if (bookingForm.startTime >= bookingForm.endTime) { toast({ title: 'End time must be after start time', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/venue-book', { method: editingBooking ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingBooking ? { ...bookingForm, id: editingBooking.id } : bookingForm) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: editingBooking ? 'Booking updated' : 'Booking submitted' });
      setBookingDialog(false); load();
    } catch (e: any) { toast({ title: 'Conflict!', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveVenue = async () => {
    if (!venueForm.name) { toast({ title: 'Venue name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/venue-book', { method: editingVenue ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingVenue ? { ...venueForm, entity: 'venue', id: editingVenue.id } : { ...venueForm, entity: 'venue' }) });
      toast({ title: editingVenue ? 'Venue updated' : 'Venue added' });
      setVenueDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/venue-book', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    toast({ title: `Booking ${status.toLowerCase()}` }); load();
  };

  const del = async (id: string, entity = '') => {
    if (!confirm('Delete this?')) return;
    await fetch('/api/venue-book', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity }) });
    toast({ title: 'Deleted' }); load();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Venue & Room Booking" description="Book school venues — labs, halls, grounds, and classrooms with conflict detection"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingVenue(null); setVenueForm(emptyVenue()); setVenueDialog(true); }}><Building className="h-4 w-4 mr-2" />Manage Venues</Button>
          <Button size="sm" onClick={() => { setEditingBooking(null); setBookingForm(emptyBooking()); setBookingDialog(true); }}><Plus className="h-4 w-4 mr-2" />New Booking</Button>
        </div>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Venues', value: summary.totalVenues, icon: <Building className="h-4 w-4 text-slate-500" />, color: 'border-l-slate-500' },
          { label: "Today's Bookings", value: summary.todayBookings, icon: <Calendar className="h-4 w-4 text-blue-500" />, color: 'border-l-blue-500' },
          { label: 'Upcoming Approved', value: summary.upcoming, icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'border-l-green-500' },
          { label: 'Pending Approval', value: summary.pending, icon: <AlertCircle className="h-4 w-4 text-amber-500" />, color: 'border-l-amber-500' },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">{c.icon}<span className="text-2xl font-bold">{c.value}</span></div>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">📅 Bookings</TabsTrigger>
          <TabsTrigger value="venues">🏛️ Venues</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4 space-y-4">
          <Card><CardContent className="p-4"><div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search bookings..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-40" />
            <Select value={venueFilter} onValueChange={v => setVenueFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-44"><SelectValue placeholder="All Venues" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{venues.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
          </div></CardContent></Card>

          {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            bookings.length === 0 ? (
              <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No bookings found</p>
                <Button size="sm" className="mt-3" onClick={() => { setEditingBooking(null); setBookingForm(emptyBooking()); setBookingDialog(true); }}><Plus className="h-4 w-4 mr-2" />Make First Booking</Button>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => {
                  const venue = venues.find(v => v.id === b.venueId);
                  return (
                    <Card key={b.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${b.status === 'Approved' ? 'bg-green-100' : b.status === 'Rejected' ? 'bg-red-100' : 'bg-amber-100'}`}>
                              <Calendar className={`h-5 w-5 ${b.status === 'Approved' ? 'text-green-600' : b.status === 'Rejected' ? 'text-red-600' : 'text-amber-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">{b.purpose}</span>
                                <Badge className={`text-xs ${STATUS_COLORS[b.status]}`}>{b.status}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                                <span><MapPin className="h-3 w-3 inline mr-0.5" />{b.venueName || venue?.name}</span>
                                <span><Calendar className="h-3 w-3 inline mr-0.5" />{fmtDate(b.bookingDate)}</span>
                                <span><Clock className="h-3 w-3 inline mr-0.5" />{b.startTime} – {b.endTime}</span>
                                {b.bookedBy && <span><Users className="h-3 w-3 inline mr-0.5" />{b.bookedBy}</span>}
                                {b.attendees && <span>👥 {b.attendees} attendees</span>}
                              </div>
                              {b.requirements && <p className="text-xs text-muted-foreground mt-1 italic">{b.requirements}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {b.status === 'Pending' && <>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-green-700 hover:bg-green-50" onClick={() => updateStatus(b.id, 'Approved')}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve</Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-red-700 hover:bg-red-50" onClick={() => updateStatus(b.id, 'Rejected')}><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
                            </>}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingBooking(b); setBookingForm(b); setBookingDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          }
        </TabsContent>

        <TabsContent value="venues" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-dashed cursor-pointer hover:bg-muted/20 transition-colors card-hover" onClick={() => { setEditingVenue(null); setVenueForm(emptyVenue()); setVenueDialog(true); }}>
              <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center"><Plus className="h-8 w-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Add New Venue</p></div>
              </CardContent>
            </Card>
            {venues.map(v => (
              <Card key={v.id} className="hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1"><Building className="h-4 w-4 text-primary" /><span className="font-semibold">{v.name}</span></div>
                      <Badge variant="outline" className="text-xs">{v.type}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingVenue(v); setVenueForm(v); setVenueDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(v.id, 'venue')}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    {v.capacity && <div><Users className="h-3 w-3 inline mr-1" />Capacity: {v.capacity}</div>}
                    {v.location && <div><MapPin className="h-3 w-3 inline mr-1" />{v.location}</div>}
                    {v.facilities && <div className="mt-1 italic">{v.facilities}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingBooking ? 'Edit Booking' : 'New Venue Booking'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Venue *</Label>
              <Select value={bookingForm.venueId} onValueChange={handleVenueSelect}>
                <SelectTrigger><SelectValue placeholder="Select venue" /></SelectTrigger>
                <SelectContent>{venues.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.type})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Purpose / Event *</Label><Input value={bookingForm.purpose} onChange={e => bf('purpose', e.target.value)} placeholder="e.g. Biology Practical, Staff Meeting" /></div>
            <div className="space-y-1.5"><Label>Booked By</Label>
              <Select value={bookingForm.bookedById} onValueChange={handleStaff}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Attendees (count)</Label><Input type="number" value={bookingForm.attendees} onChange={e => bf('attendees', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={bookingForm.bookingDate} onChange={e => bf('bookingDate', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={bookingForm.status} onValueChange={v => bf('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Rejected">Rejected</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Start Time</Label><Input type="time" value={bookingForm.startTime} onChange={e => bf('startTime', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>End Time</Label><Input type="time" value={bookingForm.endTime} onChange={e => bf('endTime', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Special Requirements</Label><Textarea value={bookingForm.requirements} onChange={e => bf('requirements', e.target.value)} rows={2} placeholder="Projector, AC, microphone, etc." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialog(false)}>Cancel</Button>
            <Button onClick={saveBooking} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingBooking ? 'Update' : 'Submit Booking'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Venue Dialog */}
      <Dialog open={venueDialog} onOpenChange={setVenueDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingVenue ? 'Edit Venue' : 'Add Venue'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Venue Name *</Label><Input value={venueForm.name} onChange={e => vf('name', e.target.value)} placeholder="e.g. Computer Lab 1, Main Auditorium" /></div>
            <div className="space-y-1.5"><Label>Type</Label>
              <Select value={venueForm.type} onValueChange={v => vf('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VENUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" value={venueForm.capacity} onChange={e => vf('capacity', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Location / Block</Label><Input value={venueForm.location} onChange={e => vf('location', e.target.value)} placeholder="Block A, Floor 2" /></div>
            </div>
            <div className="space-y-1.5"><Label>Facilities</Label><Input value={venueForm.facilities} onChange={e => vf('facilities', e.target.value)} placeholder="Projector, AC, whiteboard..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVenueDialog(false)}>Cancel</Button>
            <Button onClick={saveVenue} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingVenue ? 'Update' : 'Add Venue'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
