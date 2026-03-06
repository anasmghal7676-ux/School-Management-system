'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Bell, Send, Loader2, CheckCheck, Trash2, RefreshCw,
  Users, Megaphone, Circle, CheckCircle2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

interface Notification {
  id: string; title: string; message: string; isRead: boolean;
  notificationType: string; sentDate: string; relatedLink: string | null;
  user?: { name: string; email: string };
}

const TYPES = ['In-app', 'Email', 'SMS', 'Push'];
const ROLES = [
  { value: '', label: 'All Users (Broadcast)' },
  { value: 'admin', label: 'Admins Only' },
  { value: 'teacher', label: 'Teachers Only' },
  { value: 'parent', label: 'Parents Only' },
];

const TYPE_COLORS: Record<string, string> = {
  'In-app': 'bg-blue-100 text-blue-700',
  'Email':  'bg-green-100 text-green-700',
  'SMS':    'bg-amber-100 text-amber-700',
  'Push':   'bg-purple-100 text-purple-700',
};

export default function NotificationsPage() {
  const [tab, setTab] = useState('inbox');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Compose
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', notificationType: 'In-app', role: '', relatedLink: '' });
  const [sending, setSending] = useState(false);

  // Mark all
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => { fetchNotifications(); }, [tab, typeFilter, unreadOnly, page]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (typeFilter !== 'all') p.append('type', typeFilter);
      if (unreadOnly) p.append('unread', 'true');
      // In real app use session userId; using no filter shows all
      const r = await fetch(`/api/notifs?${p}`);
      const j = await r.json();
      if (j.success) {
        setNotifications(j.data.notifications);
        setUnreadCount(j.data.unreadCount);
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load notifications', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [tab, typeFilter, unreadOnly, page]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifs/${id}`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const r = await fetch('/api/notifs/all', { method: 'PUT' });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'All marked read', description: `${j.data.updated} notifications` });
        fetchNotifications();
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setMarkingAll(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifs/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({ title: 'Deleted' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const handleSend = async () => {
    if (!form.title || !form.message) {
      toast({ title: 'Required', description: 'Title and message are required', variant: 'destructive' }); return;
    }
    setSending(true);
    try {
      const r = await fetch('/api/notifs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: form.role || undefined }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Sent!', description: j.message });
        setComposeOpen(false);
        setForm({ title: '', message: '', notificationType: 'In-app', role: '', relatedLink: '' });
        fetchNotifications();
      } else {
        toast({ title: 'Error', description: j.message, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send', variant: 'destructive' });
    } finally { setSending(false); }
  };

  const uf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-6 text-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-muted-foreground">System alerts, announcements and messages</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllRead} disabled={markingAll}>
                {markingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
                Mark All Read
              </Button>
            )}
            <Button onClick={() => setComposeOpen(true)}>
              <Megaphone className="mr-2 h-4 w-4" />Broadcast
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Notifications', value: total, icon: Bell, color: 'border-l-blue-500' },
            { label: 'Unread', value: unreadCount, icon: Circle, color: 'border-l-amber-500' },
            { label: 'Read', value: total - unreadCount, icon: CheckCircle2, color: 'border-l-green-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className={`border-l-4 ${color}`}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant={unreadOnly ? 'default' : 'outline'} size="sm"
            onClick={() => { setUnreadOnly(v => !v); setPage(1); }}
          >
            <Circle className="mr-2 h-3.5 w-3.5" />Unread Only
          </Button>
          <Button variant="outline" size="icon" onClick={fetchNotifications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Notification List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4" />
                <p className="font-medium">No notifications</p>
                <Button className="mt-4" onClick={() => setComposeOpen(true)}>
                  <Megaphone className="mr-2 h-4 w-4" />Send First Notification
                </Button>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/40
                        ${!notif.isRead ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''}`}
                    >
                      {/* Unread indicator */}
                      <div className="mt-1.5 flex-shrink-0">
                        {notif.isRead
                          ? <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
                          : <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium text-sm ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${TYPE_COLORS[notif.notificationType] || 'bg-gray-100 text-gray-600'}`}>
                              {notif.notificationType}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {timeAgo(notif.sentDate)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                        {notif.user && (
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            To: {notif.user.name || notif.user.email}
                          </p>
                        )}
                        {notif.relatedLink && (
                          <a href={notif.relatedLink} className="text-xs text-blue-600 hover:underline mt-1 block">
                            View details →
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notif.isRead && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Mark read" onClick={() => handleMarkRead(notif.id)}>
                            <CheckCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600"
                          onClick={() => handleDelete(notif.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total} total</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Compose / Broadcast Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />Send Notification
            </DialogTitle>
            <DialogDescription>Broadcast a message to users or a specific role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Send To</Label>
              <Select value={form.role} onValueChange={v => uf('role', v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.notificationType} onValueChange={v => uf('notificationType', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Link (optional)</Label>
                <Input className="mt-1" value={form.relatedLink} onChange={e => uf('relatedLink', e.target.value)} placeholder="/fees/collection" />
              </div>
            </div>
            <div>
              <Label>Title *</Label>
              <Input className="mt-1" value={form.title} onChange={e => uf('title', e.target.value)} placeholder="Notification title" />
            </div>
            <div>
              <Label>Message *</Label>
              <textarea
                className="mt-1 w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.message}
                onChange={e => uf('message', e.target.value)}
                placeholder="Write your message here..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
