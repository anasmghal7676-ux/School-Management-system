'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2, Award, Printer, Edit, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CERT_TYPES = ['Achievement', 'Completion', 'Participation', 'Merit', 'Sports', 'Character', 'Attendance', 'Custom'];
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

function CertPreview({ cert, template, schoolName = 'The School' }: { cert: any, template: any, schoolName?: string }) {
  const body = (template?.bodyTemplate || 'This is to certify that {studentName} of class {className} has {achievement}.')
    .replace('{studentName}', cert.studentName || '___')
    .replace('{className}', cert.className || '___')
    .replace('{achievement}', cert.achievement || '___')
    .replace('{year}', cert.year || new Date().getFullYear())
    .replace('{date}', fmtDate(cert.issuedAt));

  const borderColor = template?.borderColor || '#1a56db';
  const titleColor = template?.titleColor || '#1a56db';

  return (
    <div className="bg-white border-4 rounded-lg p-8 text-center relative" style={{ borderColor, fontFamily: 'Georgia, serif', minHeight: '320px' }}>
      <div className="absolute inset-2 border-2 rounded pointer-events-none" style={{ borderColor }} />
      <div className="text-xs font-sans text-muted-foreground mb-1 uppercase tracking-widest">{schoolName}</div>
      <div className="text-3xl font-bold mb-1" style={{ color: titleColor }}>🏅 Certificate</div>
      <div className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">{template?.certType || 'of Achievement'}</div>
      <div className="w-16 h-0.5 mx-auto mb-4" style={{ backgroundColor: borderColor }} />
      <p className="text-sm leading-relaxed text-gray-700 max-w-sm mx-auto mb-6">{body}</p>
      <div className="flex justify-around mt-8 pt-4 border-t text-xs text-gray-500">
        <div><div className="w-24 h-px bg-gray-400 mb-1 mx-auto" /><p>Principal</p></div>
        <div><div className="w-24 h-px bg-gray-400 mb-1 mx-auto" /><p>Date: {fmtDate(cert.issuedAt)}</p></div>
        <div><div className="w-24 h-px bg-gray-400 mb-1 mx-auto" /><p>Issue No: {cert.certNo}</p></div>
      </div>
    </div>
  );
}

export default function CertificateBuilderPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [issued, setIssued] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tmplDialog, setTmplDialog] = useState(false);
  const [issueDialog, setIssueDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<any>(null);
  const [editingTmpl, setEditingTmpl] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const emptyTmpl = () => ({ name: '', certType: 'Achievement', bodyTemplate: 'This is to certify that {studentName} of class {className} has {achievement}.', borderColor: '#1a56db', titleColor: '#1a56db', notes: '' });
  const emptyIssue = () => ({ templateId: '', studentId: '', studentName: '', className: '', achievement: '', year: String(new Date().getFullYear()), issuedBy: '' });
  const [tmplForm, setTmplForm] = useState<any>(emptyTmpl());
  const [issueForm, setIssueForm] = useState<any>(emptyIssue());

  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/cert-builder?view=templates');
    const data = await res.json();
    setTemplates(data.templates || []);
  }, []);

  const loadIssued = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cert-builder?view=issued');
      const data = await res.json();
      setIssued(data.issued || []); setStudents(data.students || []);
      if (!templates.length) setTemplates(data.templates || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [templates.length]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleStudent = (id: string) => { const s = students.find(x => x.id === id); setIssueForm((f: any) => ({ ...f, studentId: id, studentName: s?.fullName || '', className: s?.class?.name || '' })); };

  const saveTmpl = async () => {
    if (!tmplForm.name) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/cert-builder', { method: editingTmpl ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingTmpl ? { ...tmplForm, entity: 'template', id: editingTmpl.id } : { ...tmplForm, entity: 'template' }) });
      toast({ title: editingTmpl ? 'Updated' : 'Template saved' }); setTmplDialog(false); loadTemplates();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const issueCert = async () => {
    if (!issueForm.templateId || !issueForm.studentId || !issueForm.achievement) { toast({ title: 'Template, student and achievement required', variant: 'destructive' }); return; }
    const tmpl = templates.find(t => t.id === issueForm.templateId);
    setSaving(true);
    try {
      const res = await fetch('/api/cert-builder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...issueForm, templateName: tmpl?.name, entity: 'issued' }) });
      const data = await res.json();
      toast({ title: `✅ Certificate ${data.item.certNo} issued` }); setIssueDialog(false); loadIssued(); setPreviewDialog({ cert: data.item, template: tmpl });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const print = () => { if (!printRef.current) return; const w = window.open('', '_blank')!; w.document.write(`<html><head><style>body{margin:2rem;font-family:Georgia,serif}@media print{@page{size:A4 landscape;margin:1cm}}</style></head><body>${printRef.current.innerHTML}</body></html>`); w.document.close(); w.print(); };

  const PLACEHOLDER_HELP = '{studentName}, {className}, {achievement}, {year}, {date}';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Certificate Builder" description="Create certificate templates and issue printable certificates for students and staff"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingTmpl(null); setTmplForm(emptyTmpl()); setTmplDialog(true); }}><Plus className="h-4 w-4 mr-2" />New Template</Button>
          <Button size="sm" onClick={() => { setIssueForm(emptyIssue()); setIssueDialog(true); loadIssued(); }}><Award className="h-4 w-4 mr-2" />Issue Certificate</Button>
        </div>}
      />

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">📄 Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="issued" onClick={loadIssued}>🏅 Issued ({issued.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4">
          {templates.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground"><Award className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No templates yet</p><Button size="sm" className="mt-3" onClick={() => { setEditingTmpl(null); setTmplForm(emptyTmpl()); setTmplDialog(true); }}>Create Template</Button></CardContent></Card> :
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {templates.map(tmpl => (
                <Card key={tmpl.id} className="hover:shadow-md">
                  <div className="h-2 rounded-t-lg" style={{ backgroundColor: tmpl.borderColor || '#1a56db' }} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{tmpl.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">{tmpl.certType}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTmpl(tmpl); setTmplForm(tmpl); setTmplDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { if (confirm('Delete?')) { await fetch('/api/cert-builder', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tmpl.id, entity: 'template' }) }); loadTemplates(); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">{tmpl.bodyTemplate}</p>
                    <Button variant="outline" size="sm" className="w-full mt-3 h-7 text-xs" onClick={() => setPreviewDialog({ cert: { studentName: 'John Doe', className: 'Grade 5', achievement: 'outstanding academic performance', year: new Date().getFullYear(), issuedAt: new Date().toISOString(), certNo: 'CERT-PREVIEW' }, template: tmpl })}><Eye className="h-3 w-3 mr-1" />Preview</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        </TabsContent>

        <TabsContent value="issued" className="mt-4">
          {loading ? <div className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            issued.length === 0 ? <Card className="border-dashed"><CardContent className="text-center py-12 text-muted-foreground"><p>No certificates issued yet</p></CardContent></Card> :
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Cert No</TableHead><TableHead>Student</TableHead><TableHead>Type</TableHead><TableHead>Achievement</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {issued.map(cert => {
                    const tmpl = templates.find(t => t.id === cert.templateId);
                    return (
                      <TableRow key={cert.id} className="hover:bg-muted/20">
                        <TableCell><Badge variant="outline" className="font-mono text-xs">{cert.certNo}</Badge></TableCell>
                        <TableCell><div className="font-medium text-sm">{cert.studentName}</div><div className="text-xs text-muted-foreground">{cert.className}</div></TableCell>
                        <TableCell><Badge className="text-xs bg-amber-100 text-amber-700">{cert.templateName || tmpl?.name}</Badge></TableCell>
                        <TableCell className="text-sm max-w-40 truncate">{cert.achievement}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(cert.issuedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewDialog({ cert, template: tmpl })}><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { if (confirm('Delete?')) { await fetch('/api/cert-builder', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cert.id, entity: 'issued' }) }); loadIssued(); } }}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent></Card>
          }
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={tmplDialog} onOpenChange={setTmplDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTmpl ? 'Edit Template' : 'New Certificate Template'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Template Name *</Label><Input value={tmplForm.name} onChange={e => setTmplForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Certificate Type</Label><Select value={tmplForm.certType} onValueChange={v => setTmplForm((f: any) => ({ ...f, certType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CERT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Border Color</Label><div className="flex gap-2"><input type="color" value={tmplForm.borderColor} onChange={e => setTmplForm((f: any) => ({ ...f, borderColor: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer card-hover" /><Input value={tmplForm.borderColor} onChange={e => setTmplForm((f: any) => ({ ...f, borderColor: e.target.value }))} /></div></div>
            <div className="col-span-2 space-y-1.5">
              <Label>Body Template</Label>
              <Textarea value={tmplForm.bodyTemplate} onChange={e => setTmplForm((f: any) => ({ ...f, bodyTemplate: e.target.value }))} rows={4} />
              <p className="text-xs text-muted-foreground">Placeholders: {PLACEHOLDER_HELP}</p>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTmplDialog(false)}>Cancel</Button><Button onClick={saveTmpl} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingTmpl ? 'Update' : 'Save'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={issueDialog} onOpenChange={setIssueDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Issue Certificate</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Template *</Label><Select value={issueForm.templateId} onValueChange={v => setIssueForm((f: any) => ({ ...f, templateId: v }))}><SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger><SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Student *</Label><Select value={issueForm.studentId} onValueChange={handleStudent}><SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.fullName} — {s.class?.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Achievement / Reason *</Label><Textarea value={issueForm.achievement} onChange={e => setIssueForm((f: any) => ({ ...f, achievement: e.target.value }))} rows={3} placeholder="e.g. outstanding academic performance in Term 1 2025" /></div>
            <div className="space-y-1.5"><Label>Issued By</Label><Input value={issueForm.issuedBy} onChange={e => setIssueForm((f: any) => ({ ...f, issuedBy: e.target.value }))} placeholder="Principal name" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIssueDialog(false)}>Cancel</Button><Button onClick={issueCert} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}<Award className="h-4 w-4 mr-2" />Issue</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewDialog} onOpenChange={o => !o && setPreviewDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Certificate Preview</DialogTitle></DialogHeader>
          {previewDialog && (
            <div className="space-y-4">
              <div ref={printRef}><CertPreview cert={previewDialog.cert} template={previewDialog.template} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewDialog(null)}>Close</Button>
                <Button onClick={print}><Printer className="h-4 w-4 mr-2" />Print</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
