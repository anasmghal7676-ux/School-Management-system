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
import {
  Loader2, BellRing, Plus, Search, RefreshCw, Edit, Trash2,
  Eye, EyeOff, Globe, Clock, AlertTriangle, Info, Star,
  ChevronLeft, ChevronRight, Calendar, Users, Pin,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CATEGORIES = ['General', 'Academic', 'Sports', 'Events', 'Holiday', 'Urgent', 'Exam', 'Fee', 'Circular'];
const AUDIENCES  = ['All', 'Students', 'Staff', 'Parents', 'Teachers'];
const PRIORITIES = ['Normal', 'Important', 'Urgent'];

const PRIORITY_CONFIG: Record<string, { color: string; icon: React.ElementType; border: string }> = {
  Normal:    { color: 'text-slate-600 bg-slate-100',   icon: Info,          border: 'border-l-slate-400' },
  Important: { color: 'text-blue-700 bg-blue-100',     icon: Star,          border: 'border-l-blue-500' },
  Urgent:    { color: 'text-red-700 bg-red-100',       icon: AlertTriangle, border: 'border-l-red-500' },
};

const CATEGORY_COLORS: Record<string, string> = {
  General:  'bg-slate-100 text-slate-700',
  Academic: 'bg-blue-100 text-blue-700',
  Sports:   'bg-green-100 text-green-700',
  Events:   'bg-purple-100 text-purple-700',
  Holiday:  'bg-amber-100 text-amber-700',
  Urgent:   'bg-red-100 text-red-700',
  Exam:     'bg-orange-100 text-orange-700',
  Fee:      'bg-teal-100 text-teal-700',
  Circular: 'bg-indigo-100 text-indigo-700',
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
const isExpired = (d?: string) => d ? new Date(d) < new Date() : false;

const BLANK = {
  title: '', content: '', category: 'General', audience: 'All',
  priority: 'Normal', publishDate: new Date().toISOString().slice(0, 10),
  expiryDate: '', isPublished: true, createdBy: '',
};

export default function NoticeBoardPage() {
  const [data,      setData]      = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [audFilter, setAudFilter] = useState('');
  const [priFilter, setPriFilter] = useState('');
  const [addOpen,   setAddOpen]   = useState(false);
  const [editOpen,  setEditOpen]  = useState(false);
  const [viewOpen,  setViewOpen]  = useState(false);
  const [selected,  setSelected]  = useState<any>(null);
  const [form,      setForm]      = useState<any>({ ...BLANK });
  const [saving,    setSaving]    = useState(false);
  const [viewMode,  setViewMode]  = useState<'grid' | 'list'>('grid');

  useEffect(() => { fetchData(); }, [page, catFilter, audFilter, priFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (catFilter) p.set('category', catFilter);
      if (audFilter) p.set('audience', audFilter);
      if (priFilter) p.set('priority', priFilter);
      if (search)    p.set('search',   search);
      const r = await fetch(`/api/notice-board?${p}`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } finally { setLoading(false); }
  }, [page, catFilter, audFilter, priFilter, search]);

  const save = async (editing = false) => {
    if (!form.title || !form.content) {
      toast({ title: 'Title and content are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const url    = editing ? '/api/notice-board' : '/api/notice-board';
      const method = editing ? 'PATCH' : 'POST';
      const body   = editing ? { id: selected.id, ...form } : form;
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (j.success) {
        toast({ title: editing ? 'Notice updated' : 'Notice posted', description: form.title });
        editing ? setEditOpen(false) : setAddOpen(false);
        setForm({ ...BLANK });
        fetchData();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const togglePublish = async (notice: any) => {
    await fetch('/api/notice-board', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notice.id, isPublished: !notice.isPublished }),
    });
    toast({ title: notice.isPublished ? 'Notice hidden' : 'Notice published' });
    fetchData();
  };

  const remove = async (id: string) => {
    await fetch(`/api/notice-board?id=${id}`, { method: 'DELETE' });
    toast({ title: 'Notice deleted' });
    if (viewOpen) setViewOpen(false);
    fetchData();
  };

  const openView = async (notice: any) => {
    setSelected(notice);
    setViewOpen(true);
    // Track view
    fetch('/api/notice-board', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: notice.id, incrementView: true }),
    });
  };

  const openEdit = (notice: any) => {
    setSelected(notice);
    setForm({
      title:       notice.title,
      content:     notice.content,
      category:    notice.category,
      audience:    notice.audience,
      priority:    notice.priority,
      publishDate: notice.publishDate?.slice(0, 10) || '',
      expiryDate:  notice.expiryDate?.slice(0, 10)  || '',
      isPublished: notice.isPublished,
      createdBy:   notice.createdBy || '',
    });
    setEditOpen(true);
  };

  const notices    = data?.notices    || [];
  const summary    = data?.summary    || {};
  const pagination = data?.pagination || {};

  const NoticeForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1 py-1">
      <div>
        <Label>Title *</Label>
        <Input value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))}
          placeholder="Notice title…" className="mt-1" autoFocus />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Category</Label>
          <Select value={form.category} onValueChange={v => setForm((f: any) => ({ ...f, category: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Audience</Label>
          <Select value={form.audience} onValueChange={v => setForm((f: any) => ({ ...f, audience: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={v => setForm((f: any) => ({ ...f, priority: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Content *</Label>
        <Textarea value={form.content} onChange={e => setForm((f: any) => ({ ...f, content: e.target.value }))}
          placeholder="Notice content and details…" rows={6} className="mt-1 resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Publish Date</Label>
          <Input type="date" value={form.publishDate} onChange={e => setForm((f: any) => ({ ...f, publishDate: e.target.value }))} className="mt-1" />
        </div>
        <div>
          <Label>Expiry Date</Label>
          <Input type="date" value={form.expiryDate} onChange={e => setForm((f: any) => ({ ...f, expiryDate: e.target.value }))} className="mt-1" />
        </div>
      </div>
      <div>
        <Label>Created By</Label>
        <Input value={form.createdBy} onChange={e => setForm((f: any) => ({ ...f, createdBy: e.target.value }))}
          placeholder="Principal / Admin / Teacher…" className="mt-1" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="pubCheck" checked={form.isPublished}
          onChange={e => setForm((f: any) => ({ ...f, isPublished: e.target.checked }))}
          className="h-4 w-4 rounded" />
        <Label htmlFor="pubCheck" className="cursor-pointer font-normal card-hover">Publish immediately (visible on portals)</Label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
          Post Notice
        </Button>
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
              <span className="p-2 rounded-xl bg-amber-50"><BellRing className="h-6 w-6 text-amber-600" /></span>
              Notice Board
            </h1>
            <p className="text-muted-foreground mt-0.5">Manage and publish school notices and circulars</p>
          </div>
          <Button onClick={() => { setForm({ ...BLANK }); setAddOpen(true); }} className="gap-2 bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4" />Post Notice
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Notices', val: summary.total  || 0, icon: BellRing,      color: 'text-slate-600', bg: 'bg-slate-50',  border: 'border-l-slate-400' },
            { label: 'Active',        val: summary.active || 0, icon: Globe,         color: 'text-green-600', bg: 'bg-green-50',  border: 'border-l-green-500' },
            { label: 'Urgent',        val: summary.urgent || 0, icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-l-red-500' },
            { label: 'Expired',       val: summary.expired|| 0, icon: Clock,         color: 'text-gray-500',  bg: 'bg-gray-50',   border: 'border-l-gray-400' },
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
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search notices…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchData()}
                  className="pl-8" />
              </div>
              <Select value={catFilter || 'all'} onValueChange={v => { setCatFilter(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={audFilter || 'all'} onValueChange={v => { setAudFilter(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Audience" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  {AUDIENCES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priFilter || 'all'} onValueChange={v => { setPriFilter(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
          </CardContent>
        </Card>

        {/* Notice Grid/List */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
        ) : notices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-20 text-muted-foreground gap-3">
              <BellRing className="h-12 w-12 opacity-20" />
              <p className="font-semibold">No notices found</p>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />Post First Notice
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {notices.map((notice: any) => {
              const pcfg      = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.Normal;
              const PIcon     = pcfg.icon;
              const expired   = isExpired(notice.expiryDate);
              return (
                <Card key={notice.id} className={`border-l-4 ${pcfg.border} hover:shadow-md transition-shadow cursor-pointer ${expired ? 'opacity-60' : ''} ${!notice.isPublished ? 'opacity-70' : ''}`}
                  onClick={() => openView(notice)}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${pcfg.color}`}>
                        <PIcon className="h-2.5 w-2.5" />{notice.priority}
                      </span>
                      <div className="flex gap-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[notice.category] || 'bg-gray-100 text-gray-600'}`}>
                          {notice.category}
                        </span>
                        {!notice.isPublished && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Draft</span>
                        )}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm leading-snug mb-1.5 line-clamp-2">{notice.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{notice.content}</p>
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{notice.audience}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(notice.publishDate)}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{notice.views}</span>
                    </div>
                  </CardContent>
                  <div className="px-4 pb-3 flex gap-1 border-t pt-2" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(notice)} title="Edit">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePublish(notice)}
                      title={notice.isPublished ? 'Hide' : 'Publish'}>
                      {notice.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => remove(notice.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {expired && <span className="text-[10px] text-red-500 ml-auto self-center">Expired</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List mode */
          <Card>
            <CardContent className="p-0 divide-y">
              {notices.map((notice: any) => {
                const pcfg    = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.Normal;
                const expired = isExpired(notice.expiryDate);
                return (
                  <div key={notice.id}
                    className={`flex items-start gap-4 px-4 py-3 hover:bg-muted/20 cursor-pointer ${expired ? 'opacity-60' : ''}`}
                    onClick={() => openView(notice)}>
                    <div className={`w-1.5 h-full min-h-[2.5rem] rounded-full flex-shrink-0 ${pcfg.border.replace('border-l-', 'bg-')}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{notice.title}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[notice.category] || ''}`}>{notice.category}</span>
                        {!notice.isPublished && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Draft</span>}
                        {expired && <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">Expired</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notice.content}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>{notice.audience}</span>
                        <span>{fmtDate(notice.publishDate)}</span>
                        {notice.expiryDate && <span>Expires {fmtDate(notice.expiryDate)}</span>}
                        <span>{notice.views} views</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(notice)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePublish(notice)}>
                        {notice.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => remove(notice.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{((page-1)*20)+1}–{Math.min(page*20, pagination.total)} of {pagination.total}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page===1} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page>=pagination.totalPages} onClick={() => setPage(p=>p+1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </main>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { setAddOpen(v); if (!v) setForm({ ...BLANK }); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 text-amber-600" />Post New Notice</DialogTitle>
            <DialogDescription>Create a notice for students, parents or staff</DialogDescription>
          </DialogHeader>
          <NoticeForm onSave={() => save(false)} onCancel={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
          </DialogHeader>
          <NoticeForm onSave={() => save(true)} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          {selected && (() => {
            const pcfg  = PRIORITY_CONFIG[selected.priority] || PRIORITY_CONFIG.Normal;
            const PIcon = pcfg.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${pcfg.color}`}>
                      <PIcon className="h-3 w-3" />{selected.priority}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[selected.category] || ''}`}>{selected.category}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selected.audience}</span>
                  </div>
                  <DialogTitle className="text-xl">{selected.title}</DialogTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{fmtDate(selected.publishDate)}</span>
                    {selected.createdBy && <span>By: {selected.createdBy}</span>}
                    <span>{selected.views} views</span>
                    {selected.expiryDate && <span>Expires: {fmtDate(selected.expiryDate)}</span>}
                  </div>
                </DialogHeader>
                <div className="py-3">
                  <div className="bg-muted/20 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {selected.content}
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" size="sm" className="text-red-500 mr-auto" onClick={() => remove(selected.id)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
                  </Button>
                  <Button variant="outline" onClick={() => { setViewOpen(false); openEdit(selected); }}>
                    <Edit className="mr-1.5 h-4 w-4" />Edit
                  </Button>
                  <Button variant="ghost" onClick={() => setViewOpen(false)}>Close</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
