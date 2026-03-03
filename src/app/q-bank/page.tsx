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
import { Loader2, Plus, Search, RefreshCw, Edit, Trash2, BookOpen, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const QTYPES = ['MCQ', 'Short Answer', 'Long Answer', 'True/False', 'Fill in the Blank', 'Match the Column'];
const DIFF = ['Easy', 'Medium', 'Hard'];
const DIFF_COLORS: Record<string, string> = { Easy: 'bg-green-100 text-green-700', Medium: 'bg-amber-100 text-amber-700', Hard: 'bg-red-100 text-red-700' };
const QTYPE_COLORS: Record<string, string> = { MCQ: 'bg-blue-100 text-blue-700', 'Short Answer': 'bg-purple-100 text-purple-700', 'Long Answer': 'bg-slate-100 text-slate-700', 'True/False': 'bg-cyan-100 text-cyan-700', 'Fill in the Blank': 'bg-orange-100 text-orange-700', 'Match the Column': 'bg-pink-100 text-pink-700' };

export default function QuestionBankPage() {
  const [items, setItems] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = () => ({
    question: '', questionType: 'MCQ', difficulty: 'Medium', marks: '1',
    subjectId: '', subjectName: '', classId: '', className: '',
    topic: '', optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: '', explanation: '', tags: ''
  });
  const [form, setForm] = useState<any>(emptyForm());
  const f = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, subjectId: subjectFilter, classId: classFilter, type: typeFilter, difficulty: diffFilter, page: String(page) });
      const res = await fetch(`/api/q-bank?${params}`);
      const data = await res.json();
      setItems(data.items || []); setTotal(data.total || 0);
      if (data.summary) setSummary(data.summary);
      if (data.subjects) setSubjects(data.subjects);
      if (data.classes) setClasses(data.classes);
    } catch { toast({ title: 'Error loading questions', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, subjectFilter, classFilter, typeFilter, diffFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleSubject = (id: string) => {
    const s = subjects.find(x => x.id === id);
    setForm((p: any) => ({ ...p, subjectId: id, subjectName: s?.name || '' }));
  };
  const handleClass = (id: string) => {
    const c = classes.find(x => x.id === id);
    setForm((p: any) => ({ ...p, classId: id, className: c?.name || '' }));
  };

  const save = async () => {
    if (!form.question) { toast({ title: 'Question text required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/q-bank', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...form, id: editing.id } : form)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: editing ? 'Question updated' : 'Question added' });
      setDialog(false); load();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    await fetch('/api/q-bank', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    toast({ title: 'Deleted' }); load();
  };

  const limit = 20;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Question Bank" description="Manage exam questions by subject, class, topic and difficulty level"
        actions={<Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Question</Button>}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: summary.total || 0, color: 'border-l-slate-500' },
          { label: 'MCQ', value: summary.mcq || 0, color: 'border-l-blue-500' },
          { label: 'Short', value: summary.short || 0, color: 'border-l-purple-500' },
          { label: 'Easy', value: summary.easy || 0, color: 'border-l-green-500' },
          { label: 'Medium', value: summary.medium || 0, color: 'border-l-amber-500' },
          { label: 'Hard', value: summary.hard || 0, color: 'border-l-red-500' },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search questions..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Select value={subjectFilter} onValueChange={v => setSubjectFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="Subject" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
          <Select value={classFilter} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-32"><SelectValue placeholder="Class" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{QTYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          <Select value={diffFilter} onValueChange={v => setDiffFilter(v === 'all' ? '' : v)}><SelectTrigger className="w-32"><SelectValue placeholder="Difficulty" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{DIFF.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
        </div>
      </CardContent></Card>

      {/* Question List */}
      {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
        items.length === 0 ? (
          <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No questions found</p>
            <Button size="sm" className="mt-3" onClick={() => { setEditing(null); setForm(emptyForm()); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add First Question</Button>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <Card key={item.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-sm font-mono text-muted-foreground w-6 pt-0.5 flex-shrink-0">{(page - 1) * limit + idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-relaxed">{item.question}</p>
                        {item.questionType === 'MCQ' && (
                          <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                            {['A', 'B', 'C', 'D'].map(opt => item[`option${opt}`] && (
                              <div key={opt} className={`px-2 py-1 rounded ${item.correctAnswer === opt ? 'bg-green-100 text-green-800 font-medium' : 'bg-muted/40 text-muted-foreground'}`}>
                                ({opt}) {item[`option${opt}`]}
                              </div>
                            ))}
                          </div>
                        )}
                        {item.questionType === 'True/False' && item.correctAnswer && (
                          <p className="text-xs mt-1 text-green-700 font-medium">Answer: {item.correctAnswer}</p>
                        )}
                        {item.explanation && <p className="text-xs text-muted-foreground mt-1 italic">💡 {item.explanation}</p>}
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <Badge className={`text-xs py-0 ${QTYPE_COLORS[item.questionType] || 'bg-slate-100'}`}>{item.questionType}</Badge>
                          <Badge className={`text-xs py-0 ${DIFF_COLORS[item.difficulty] || 'bg-slate-100'}`}>{item.difficulty}</Badge>
                          {item.marks && <Badge variant="outline" className="text-xs py-0">{item.marks} mark{item.marks > 1 ? 's' : ''}</Badge>}
                          {item.subjectName && <span className="text-xs text-muted-foreground">{item.subjectName}</span>}
                          {item.className && <span className="text-xs text-muted-foreground">· {item.className}</span>}
                          {item.topic && <span className="text-xs text-muted-foreground">· {item.topic}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setForm({ ...item }); setDialog(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {Math.ceil(total / limit) > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)}>Next</Button>
                </div>
              </div>
            )}
          </div>
        )
      }

      {/* Add / Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Question' : 'Add Question'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Question Text *</Label>
              <Textarea value={form.question} onChange={e => f('question', e.target.value)} rows={3} placeholder="Enter the question here..." />
            </div>
            <div className="space-y-1.5"><Label>Question Type</Label>
              <Select value={form.questionType} onValueChange={v => f('questionType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{QTYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={v => f('difficulty', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DIFF.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Subject</Label>
              <Select value={form.subjectId} onValueChange={handleSubject}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent><SelectItem value="">—</SelectItem>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Class</Label>
              <Select value={form.classId} onValueChange={handleClass}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent><SelectItem value="">—</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Topic / Chapter</Label><Input value={form.topic} onChange={e => f('topic', e.target.value)} placeholder="e.g. Photosynthesis" /></div>
            <div className="space-y-1.5"><Label>Marks</Label><Input type="number" value={form.marks} onChange={e => f('marks', e.target.value)} min="1" /></div>

            {form.questionType === 'MCQ' && <>
              <div className="space-y-1.5"><Label>Option A</Label><Input value={form.optionA} onChange={e => f('optionA', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Option B</Label><Input value={form.optionB} onChange={e => f('optionB', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Option C</Label><Input value={form.optionC} onChange={e => f('optionC', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Option D</Label><Input value={form.optionD} onChange={e => f('optionD', e.target.value)} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Correct Answer</Label>
                <Select value={form.correctAnswer} onValueChange={v => f('correctAnswer', v)}>
                  <SelectTrigger><SelectValue placeholder="Select correct option" /></SelectTrigger>
                  <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem><SelectItem value="D">D</SelectItem></SelectContent>
                </Select>
              </div>
            </>}
            {form.questionType === 'True/False' && (
              <div className="col-span-2 space-y-1.5"><Label>Correct Answer</Label>
                <Select value={form.correctAnswer} onValueChange={v => f('correctAnswer', v)}>
                  <SelectTrigger><SelectValue placeholder="True or False?" /></SelectTrigger>
                  <SelectContent><SelectItem value="True">True</SelectItem><SelectItem value="False">False</SelectItem></SelectContent>
                </Select>
              </div>
            )}
            {!['MCQ', 'True/False'].includes(form.questionType) && (
              <div className="col-span-2 space-y-1.5"><Label>Model Answer (optional)</Label><Textarea value={form.correctAnswer} onChange={e => f('correctAnswer', e.target.value)} rows={2} /></div>
            )}
            <div className="col-span-2 space-y-1.5"><Label>Explanation (optional)</Label><Textarea value={form.explanation} onChange={e => f('explanation', e.target.value)} rows={2} placeholder="Explain why this is the correct answer..." /></div>
            <div className="col-span-2 space-y-1.5"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => f('tags', e.target.value)} placeholder="photosynthesis, biology, chapter 3" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editing ? 'Update' : 'Save Question'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
