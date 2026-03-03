'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, Mail, MessageSquare, Copy, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const TEMPLATE_TYPES = ['SMS', 'Email', 'WhatsApp'];
const CATEGORIES = ['Fee Reminder', 'Fee Receipt', 'Attendance Alert', 'Exam Result', 'Event Notification', 'Admission', 'General', 'Holiday Notice', 'Meeting Reminder', 'Emergency'];
const VARIABLES = ['{student_name}', '{father_name}', '{class}', '{amount}', '{due_date}', '{date}', '{time}', '{school_name}', '{contact}', '{result}'];

export default function MessageTemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'SMS', category: 'General', subject: '', body: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, filter: typeFilter });
      const res = await fetch(`/api/msg-tmpl?${params}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name || !form.body) { toast({ title: 'Name and body required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/msg-tmpl', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) });
      toast({ title: editing ? 'Updated' : 'Template created' });
      setShowDialog(false); load();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (i: any) => {
    if (!confirm('Delete template?')) return;
    await fetch('/api/msg-tmpl', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: i.id }) });
    toast({ title: 'Deleted' }); load();
  };

  const clone = async (i: any) => {
    await fetch('/api/msg-tmpl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...i, name: `${i.name} (Copy)`, id: undefined }) });
    toast({ title: 'Cloned' }); load();
  };

  const insertVar = (v: string) => {
    setForm(f => ({ ...f, body: f.body + v }));
  };

  const CATEGORY_COLORS: Record<string, string> = {
    'Fee Reminder': 'bg-red-100 text-red-700', 'Fee Receipt': 'bg-green-100 text-green-700',
    'Attendance Alert': 'bg-amber-100 text-amber-700', 'Exam Result': 'bg-blue-100 text-blue-700',
    'Admission': 'bg-purple-100 text-purple-700', 'Emergency': 'bg-red-200 text-red-800',
    'General': 'bg-slate-100 text-slate-600',
  };

  const smsCount = items.filter(i => i.type === 'SMS').length;
  const emailCount = items.filter(i => i.type === 'Email').length;
  const waCount = items.filter(i => i.type === 'WhatsApp').length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Message Templates" description="Create and manage SMS, Email, and WhatsApp message templates"
        actions={<Button size="sm" onClick={() => { setEditing(null); setForm({ name: '', type: 'SMS', category: 'General', subject: '', body: '', isActive: true }); setShowDialog(true); }}><Plus className="h-4 w-4 mr-2" />New Template</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><div className="flex items-center justify-between"><MessageSquare className="h-4 w-4 text-blue-500" /><span className="text-2xl font-bold">{smsCount}</span></div><p className="text-xs text-muted-foreground mt-1">SMS Templates</p></CardContent></Card>
        <Card className="border-l-4 border-l-purple-500"><CardContent className="p-4"><div className="flex items-center justify-between"><Mail className="h-4 w-4 text-purple-500" /><span className="text-2xl font-bold">{emailCount}</span></div><p className="text-xs text-muted-foreground mt-1">Email Templates</p></CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><div className="flex items-center justify-between"><MessageSquare className="h-4 w-4 text-green-500" /><span className="text-2xl font-bold">{waCount}</span></div><p className="text-xs text-muted-foreground mt-1">WhatsApp Templates</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4"><div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search templates..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={typeFilter} onValueChange={v => setTypeFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{TEMPLATE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex justify-center items-center h-40"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div> :
          items.length === 0 ? <div className="text-center py-12 text-muted-foreground"><MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>No templates yet</p><Button size="sm" className="mt-3" onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-2" />Create First Template</Button></div> :
          <Table>
            <TableHeader><TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Message Preview</TableHead>
              <TableHead>Chars</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell><div className="font-medium text-sm">{item.name}</div>{item.subject && <div className="text-xs text-muted-foreground">Subject: {item.subject}</div>}</TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${item.type === 'SMS' ? 'bg-blue-100 text-blue-700' : item.type === 'Email' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                      {item.type === 'Email' ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}{item.type}
                    </div>
                  </TableCell>
                  <TableCell><Badge className={`text-xs ${CATEGORY_COLORS[item.category] || 'bg-slate-100 text-slate-600'}`}>{item.category}</Badge></TableCell>
                  <TableCell className="text-sm max-w-[300px]"><p className="truncate text-muted-foreground">{item.body}</p></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.body?.length || 0}</TableCell>
                  <TableCell className="text-right"><div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPreview(item)} title="Preview"><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => clone(item)} title="Clone"><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setForm(item); setShowDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        }
      </CardContent></Card>

      {/* Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Template' : 'Create Message Template'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Template Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fee Due Reminder" /></div>
              <div className="space-y-1.5"><Label>Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TEMPLATE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            {form.type === 'Email' && <div className="space-y-1.5"><Label>Email Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Subject line" /></div>}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Message Body *</Label>
                <span className="text-xs text-muted-foreground">{form.body.length} chars {form.type === 'SMS' ? `(${Math.ceil(form.body.length / 160)} SMS)` : ''}</span>
              </div>
              <Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={5} placeholder="Type your message here. Use variables like {student_name}" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Click to insert variable:</Label>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map(v => (
                  <button key={v} onClick={() => insertVar(v)} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors font-mono">{v}</button>
                ))}
              </div>
            </div>
            {form.body && (
              <Card className="bg-muted/30">
                <CardHeader className="py-2 px-3"><CardTitle className="text-xs text-muted-foreground">Preview (sample data)</CardTitle></CardHeader>
                <CardContent className="px-3 pb-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {form.body
                      .replace(/{student_name}/g, 'Ali Hassan')
                      .replace(/{father_name}/g, 'Mr. Hassan')
                      .replace(/{class}/g, 'Class 5-A')
                      .replace(/{amount}/g, 'PKR 5,000')
                      .replace(/{due_date}/g, '30 Jan 2026')
                      .replace(/{date}/g, new Date().toLocaleDateString())
                      .replace(/{school_name}/g, 'Bright Future School')
                      .replace(/{contact}/g, '0300-1234567')
                      .replace(/{result}/g, 'A Grade')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Save Template'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {showPreview && (
        <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Template Preview — {showPreview.name}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex gap-2">
                <Badge className={showPreview.type === 'SMS' ? 'bg-blue-100 text-blue-700' : showPreview.type === 'Email' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}>{showPreview.type}</Badge>
                <Badge variant="outline">{showPreview.category}</Badge>
              </div>
              {showPreview.subject && <div className="text-sm"><span className="font-medium">Subject:</span> {showPreview.subject}</div>}
              <div className="bg-muted/40 rounded-lg p-4">
                <p className="text-sm whitespace-pre-wrap">{showPreview.body
                  .replace(/{student_name}/g, 'Ali Hassan')
                  .replace(/{father_name}/g, 'Mr. Hassan')
                  .replace(/{class}/g, 'Class 5-A')
                  .replace(/{amount}/g, 'PKR 5,000')
                  .replace(/{due_date}/g, '30 Jan 2026')
                  .replace(/{date}/g, new Date().toLocaleDateString())
                  .replace(/{school_name}/g, 'Bright Future School')
                  .replace(/{contact}/g, '0300-1234567')
                  .replace(/{result}/g, 'A Grade')}</p>
              </div>
              <p className="text-xs text-muted-foreground">{showPreview.body?.length} characters{showPreview.type === 'SMS' ? ` · ${Math.ceil((showPreview.body?.length || 0) / 160)} SMS credit(s)` : ''}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(null)}>Close</Button>
              <Button onClick={() => { setEditing(showPreview); setForm(showPreview); setShowPreview(null); setShowDialog(true); }}><Edit className="h-4 w-4 mr-2" />Edit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
