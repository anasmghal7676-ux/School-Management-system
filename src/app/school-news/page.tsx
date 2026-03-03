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
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, Newspaper, Globe, EyeOff, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CATEGORIES = ['Academic', 'Sports', 'Cultural', 'Achievement', 'Event', 'Announcement', 'Health & Safety', 'Alumni', 'Community', 'Other'];
const CAT_COLORS: Record<string, string> = {
  Academic: 'bg-blue-100 text-blue-700', Sports: 'bg-green-100 text-green-700', Cultural: 'bg-purple-100 text-purple-700',
  Achievement: 'bg-yellow-100 text-yellow-700', Event: 'bg-pink-100 text-pink-700', Announcement: 'bg-slate-100 text-slate-700',
};
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function SchoolNewsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [dialog, setDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = () => ({
    title: '', category: 'Announcement', status: 'Draft',
    content: '', summary: '', authorId: '', authorName: '',
    tags: '', imageUrl: '', featured: false
  });
  const [form, setForm] = useState<any>(emptyForm());
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, category: catFilter });
      const res = await fetch(`/api/school-news?${params}`);
      const data = await res.json();
      setItems(data.items || []); setTotal(data.total || 0);
      if (data.staff) setStaff(data.staff);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAuthor = (id: string) => {
    const s = staff.find(x => x.id === id);
    setForm((p: any) => ({ ...p, authorId: id, authorName: s?.fullName || '' }));
  };

  const save = async () => {
    if (!form.title || !form.content) { toast({ title: 'Title and content required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/school-news', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) });
      toast({ title: editing ? 'Updated' : form.status === 'Published' ? '🚀 Article published!' : 'Draft saved' });
      setDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const togglePublish = async (item: any) => {
    const newStatus = item.status === 'Published' ? 'Draft' : 'Published';
    await fetch('/api/school-news', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, status: newStatus }) });
    toast({ title: newStatus === 'Published' ? 'Article published' : 'Moved to draft' }); load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete article?')) return;
    await fetch('/api/school-news', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Deleted' }); load();
  };

  const published = items.filter(i => i.status === 'Published').length;
  const drafts = items.filter(i => i.status === 'Draft').length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="School News" description="Create and publish school news, achievements, event coverage, and announcements"
        actions={<Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Write Article</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-slate-500"><CardContent className="p-4"><div className="flex items-center justify-between"><Newspaper className="h-4 w-4 text-slate-500" /><span className="text-2xl font-bold">{total}</span></div><p className="text-xs text-muted-foreground mt-1">Total Articles</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><div className="flex items-center justify-between"><Globe className="h-4 w-4 text-green-500" /><span className="text-2xl font-bold text-green-700">{published}</span></div><p className="text-xs text-muted-foreground mt-1">Published</p></CardContent></Card>
        <Card className="border-l-4 border-l-amber-500"><CardContent className="p-4"><div className="flex items-center justify-between"><EyeOff className="h-4 w-4 text-amber-500" /><span className="text-2xl font-bold text-amber-700">{drafts}</span></div><p className="text-xs text-muted-foreground mt-1">Drafts</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4"><div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search articles..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={catFilter} onValueChange={v => setCatFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-40"><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
      </div></CardContent></Card>

      {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
        items.length === 0 ? (
          <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground">
            <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No articles yet</p>
            <Button size="sm" className="mt-3" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Write First Article</Button>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <Card key={item.id} className={`hover:shadow-md transition-shadow cursor-pointer ${item.featured ? 'ring-2 ring-primary/20' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0" onClick={() => setViewDialog(item)}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {item.featured && <Badge className="text-xs bg-yellow-100 text-yellow-700">⭐ Featured</Badge>}
                        <Badge className={`text-xs ${CAT_COLORS[item.category] || 'bg-slate-100 text-slate-700'}`}>{item.category}</Badge>
                        <Badge className={`text-xs ${item.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</Badge>
                      </div>
                      <h3 className="font-semibold text-sm leading-snug mb-1">{item.title}</h3>
                      {item.summary && <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {item.authorName && <span>✍️ {item.authorName}</span>}
                        <span>📅 {fmtDate(item.publishedAt || item.createdAt)}</span>
                        {item.tags && <span>🏷️ {item.tags}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePublish(item)} title={item.status === 'Published' ? 'Unpublish' : 'Publish'}>
                        {item.status === 'Published' ? <EyeOff className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setForm({ ...item }); setDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      }

      {/* Write/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Article' : 'Write Article'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={e => f('title', e.target.value)} placeholder="Article headline" className="text-lg" /></div>
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={form.category} onValueChange={v => f('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => f('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Published">Published</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Author</Label>
              <Select value={form.authorId} onValueChange={handleAuthor}>
                <SelectTrigger><SelectValue placeholder="Select author" /></SelectTrigger>
                <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Tags</Label><Input value={form.tags} onChange={e => f('tags', e.target.value)} placeholder="sports, award, inter-school" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Summary (short description)</Label><Input value={form.summary} onChange={e => f('summary', e.target.value)} placeholder="One line summary shown in listing view..." /></div>
            <div className="col-span-2 space-y-1.5">
              <Label>Content *</Label>
              <Textarea value={form.content} onChange={e => f('content', e.target.value)} rows={10} placeholder="Write the full article content here..." className="resize-none" />
              <p className="text-xs text-muted-foreground text-right">{form.content?.length || 0} characters</p>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Image URL (optional)</Label><Input value={form.imageUrl} onChange={e => f('imageUrl', e.target.value)} placeholder="https://..." /></div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="featured" checked={form.featured} onChange={e => f('featured', e.target.checked)} className="h-4 w-4" />
              <Label htmlFor="featured" className="cursor-pointer card-hover">⭐ Feature this article on homepage</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => { f('status', 'Draft'); setTimeout(save, 0); }} disabled={saving}>Save Draft</Button>
            <Button onClick={() => { if (form.status !== 'Published') f('status', 'Published'); setTimeout(save, 0); }} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Globe className="h-4 w-4 mr-2" />Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewDialog} onOpenChange={o => !o && setViewDialog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewDialog && <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-xs ${CAT_COLORS[viewDialog.category] || ''}`}>{viewDialog.category}</Badge>
                <Badge className={`text-xs ${viewDialog.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{viewDialog.status}</Badge>
              </div>
              <DialogTitle className="text-xl mt-2">{viewDialog.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">{viewDialog.authorName && `By ${viewDialog.authorName} · `}{fmtDate(viewDialog.publishedAt || viewDialog.createdAt)}</p>
            </DialogHeader>
            {viewDialog.imageUrl && <img src={viewDialog.imageUrl} alt="Article" className="rounded-lg w-full object-cover max-h-48" onError={e => (e.currentTarget.style.display = 'none')} />}
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">{viewDialog.content}</div>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
