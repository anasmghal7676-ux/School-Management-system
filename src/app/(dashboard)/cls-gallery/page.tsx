'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Camera, ArrowLeft, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const ALBUM_TYPES = ['Class Photo', 'Event', 'Sports Day', 'Annual Day', 'Trip', 'Graduation', 'Science Fair', 'Cultural Event', 'Other'];
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Placeholder colors for albums without photos
const ALBUM_COLORS = ['from-blue-400 to-blue-600', 'from-purple-400 to-purple-600', 'from-emerald-400 to-emerald-600', 'from-orange-400 to-orange-600', 'from-pink-400 to-pink-600', 'from-cyan-400 to-cyan-600'];

export default function ClassPhotoGalleryPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAlbum, setActiveAlbum] = useState<any>(null);
  const [albumDialog, setAlbumDialog] = useState(false);
  const [photoDialog, setPhotoDialog] = useState(false);
  const [lightbox, setLightbox] = useState<{ photo: any, idx: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyAlbum = () => ({ name: '', albumType: 'Class Photo', classId: '', className: '', date: new Date().toISOString().slice(0, 10), description: '', isPublic: true });
  const emptyPhoto = () => ({ albumId: activeAlbum?.id || '', url: '', caption: '', photographer: '' });
  const [albumForm, setAlbumForm] = useState<any>(emptyAlbum());
  const [photoForm, setPhotoForm] = useState<any>(emptyPhoto());
  const [bulkUrls, setBulkUrls] = useState('');

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cls-gallery?view=albums');
      const data = await res.json();
      setAlbums(data.albums || []); setClasses(data.classes || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  const loadPhotos = useCallback(async (albumId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cls-gallery?view=photos&albumId=${albumId}`);
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAlbums(); }, [loadAlbums]);

  const handleAlbumClass = (id: string) => { const c = classes.find(x => x.id === id); setAlbumForm((f: any) => ({ ...f, classId: id, className: c?.name || '' })); };

  const saveAlbum = async () => {
    if (!albumForm.name) { toast({ title: 'Album name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/cls-gallery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...albumForm, entity: 'album' }) });
      toast({ title: 'Album created' }); setAlbumDialog(false); loadAlbums();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const addPhotos = async () => {
    const urls = bulkUrls ? bulkUrls.split('\n').map(u => u.trim()).filter(Boolean) : photoForm.url ? [photoForm.url] : [];
    if (!urls.length) { toast({ title: 'Enter at least one URL', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      for (const url of urls) {
        await fetch('/api/cls-gallery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...photoForm, albumId: activeAlbum.id, url, entity: 'photo' }) });
      }
      toast({ title: `${urls.length} photo(s) added` }); setPhotoDialog(false); setBulkUrls(''); loadPhotos(activeAlbum.id);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const delPhoto = async (id: string) => {
    if (!confirm('Delete photo?')) return;
    await fetch('/api/cls-gallery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity: 'photo' }) });
    loadPhotos(activeAlbum.id);
  };

  const delAlbum = async (id: string) => {
    if (!confirm('Delete album and all its photos?')) return;
    await fetch('/api/cls-gallery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity: 'album' }) });
    loadAlbums();
  };

  const openAlbum = (album: any) => { setActiveAlbum(album); loadPhotos(album.id); };
  const goBack = () => { setActiveAlbum(null); setPhotos([]); };

  const nextPhoto = () => lightbox && setLightbox({ photo: photos[lightbox.idx + 1], idx: lightbox.idx + 1 });
  const prevPhoto = () => lightbox && setLightbox({ photo: photos[lightbox.idx - 1], idx: lightbox.idx - 1 });

  // Album grid
  if (!activeAlbum) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <PageHeader title="Class Photo Gallery" description="Organize school and class photos into albums for easy browsing"
          actions={<Button size="sm" onClick={() => { setAlbumForm(emptyAlbum()); setAlbumDialog(true); }}><Plus className="h-4 w-4 mr-2" />New Album</Button>}
        />

        {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
          albums.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-20 text-muted-foreground"><Camera className="h-12 w-12 mx-auto mb-4 opacity-20" /><p className="text-lg font-medium">No albums yet</p><p className="text-sm">Create your first photo album to get started</p><Button size="sm" className="mt-4" onClick={() => { setAlbumForm(emptyAlbum()); setAlbumDialog(true); }}><Plus className="h-4 w-4 mr-2" />Create Album</Button></CardContent></Card> :
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {albums.map((album, idx) => (
              <Card key={album.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group card-hover" onClick={() => openAlbum(album)}>
                <div className={`h-36 relative bg-gradient-to-br ${ALBUM_COLORS[idx % ALBUM_COLORS.length]} flex items-center justify-center`}>
                  {album.coverPhoto ? (
                    <img src={album.coverPhoto} alt={album.name} className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display = 'none'; }} />
                  ) : <Camera className="h-10 w-10 text-white opacity-60" />}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); delAlbum(album.id); }}>
                    <div className="bg-white/90 rounded-full p-1 hover:bg-destructive hover:text-white transition-colors"><Trash2 className="h-3 w-3" /></div>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{album.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{album.photoCount || 0} photos</p>
                    {album.className && <Badge variant="outline" className="text-xs">{album.className}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(album.date)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        }

        {/* Album Dialog */}
        <Dialog open={albumDialog} onOpenChange={setAlbumDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>New Album</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5"><Label>Album Name *</Label><Input value={albumForm.name} onChange={e => setAlbumForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Annual Day 2025" /></div>
              <div className="space-y-1.5"><Label>Type</Label><Select value={albumForm.albumType} onValueChange={v => setAlbumForm((f: any) => ({ ...f, albumType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ALBUM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Class</Label><Select value={albumForm.classId} onValueChange={handleAlbumClass}><SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={albumForm.date} onChange={e => setAlbumForm((f: any) => ({ ...f, date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={albumForm.description} onChange={e => setAlbumForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setAlbumDialog(false)}>Cancel</Button><Button onClick={saveAlbum} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create Album</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Album photo view
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-2" />Albums</Button>
        <div>
          <h1 className="text-xl font-bold">{activeAlbum.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{activeAlbum.albumType}</Badge>
            {activeAlbum.className && <Badge variant="secondary" className="text-xs">{activeAlbum.className}</Badge>}
            <span className="text-xs text-muted-foreground">{fmtDate(activeAlbum.date)}</span>
          </div>
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={() => { setPhotoForm(emptyPhoto()); setBulkUrls(''); setPhotoDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Photos</Button>
      </div>

      {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
        photos.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-20 text-muted-foreground"><ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" /><p>No photos in this album</p><Button size="sm" className="mt-4" onClick={() => { setPhotoForm(emptyPhoto()); setPhotoDialog(true); }}>Add Photos</Button></CardContent></Card> :
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="break-inside-avoid relative group rounded-lg overflow-hidden cursor-pointer bg-muted card-hover" onClick={() => setLightbox({ photo, idx })}>
              <img src={photo.url} alt={photo.caption || ''} className="w-full object-cover hover:scale-105 transition-transform duration-200" loading="lazy" onError={(e: any) => { e.target.src = `https://picsum.photos/seed/${photo.id}/400/300`; }} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); delPhoto(photo.id); }}>
                <div className="bg-white/90 rounded-full p-1 hover:bg-destructive hover:text-white transition-colors"><Trash2 className="h-3 w-3" /></div>
              </div>
              {photo.caption && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><p className="text-white text-xs">{photo.caption}</p></div>}
            </div>
          ))}
        </div>
      }

      {/* Add Photos Dialog */}
      <Dialog open={photoDialog} onOpenChange={setPhotoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Photos</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Photo URL(s)</Label>
              <Input value={photoForm.url} onChange={e => setPhotoForm((f: any) => ({ ...f, url: e.target.value }))} placeholder="https://example.com/photo.jpg" />
            </div>
            <div className="space-y-1.5">
              <Label>Bulk Add (one URL per line)</Label>
              <Textarea value={bulkUrls} onChange={e => setBulkUrls(e.target.value)} rows={5} placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg" />
            </div>
            <div className="space-y-1.5"><Label>Caption (optional)</Label><Input value={photoForm.caption} onChange={e => setPhotoForm((f: any) => ({ ...f, caption: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Photographer</Label><Input value={photoForm.photographer} onChange={e => setPhotoForm((f: any) => ({ ...f, photographer: e.target.value }))} /></div>
            <p className="text-xs text-muted-foreground">Tip: Add photo URLs from Google Drive, Imgur, or your image hosting service</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPhotoDialog(false)}>Cancel</Button><Button onClick={addPhotos} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}<Camera className="h-4 w-4 mr-2" />Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setLightbox(null)}><X className="h-6 w-6" /></button>
          {lightbox.idx > 0 && <button className="absolute left-4 text-white hover:text-gray-300 p-2 rounded-full bg-white/10" onClick={e => { e.stopPropagation(); prevPhoto(); }}><ChevronLeft className="h-6 w-6" /></button>}
          <div className="max-w-5xl max-h-screen p-8" onClick={e => e.stopPropagation()}>
            <img src={lightbox.photo.url} alt={lightbox.photo.caption || ''} className="max-w-full max-h-[80vh] object-contain mx-auto" />
            {lightbox.photo.caption && <p className="text-white text-center mt-3 text-sm">{lightbox.photo.caption}</p>}
            <p className="text-gray-400 text-center text-xs mt-1">{lightbox.idx + 1} / {photos.length}</p>
          </div>
          {lightbox.idx < photos.length - 1 && <button className="absolute right-4 text-white hover:text-gray-300 p-2 rounded-full bg-white/10" onClick={e => { e.stopPropagation(); nextPhoto(); }}><ChevronRight className="h-6 w-6" /></button>}
        </div>
      )}
    </div>
  );
}
