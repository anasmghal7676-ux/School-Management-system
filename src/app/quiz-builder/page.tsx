'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Loader2, Plus, HelpCircle, Edit, Trash2, ChevronRight, ChevronLeft,
  BookOpen, Clock, Award, CheckCircle2, List, ArrowLeft, Save, Eye, Settings,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

type View = 'list' | 'editor' | 'questions';

const EMPTY_QUIZ = { title: '', subjectId: '', classId: '', duration: '30', totalMarks: '100', passingMarks: '50', instructions: '' };
const EMPTY_Q    = { questionText: '', questionType: 'MCQ', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', marks: '1', explanation: '' };

const TYPE_LABELS: Record<string, string> = { MCQ: 'Multiple Choice', TrueFalse: 'True / False', Short: 'Short Answer' };

export default function QuizBuilderPage() {
  const [view, setView]         = useState<View>('list');
  const [quizzes, setQuizzes]   = useState<any[]>([]);
  const [selQuiz, setSelQuiz]   = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);

  const [quizForm, setQuizForm]   = useState({ ...EMPTY_QUIZ });
  const [qForm, setQForm]         = useState({ ...EMPTY_Q });
  const [editQ, setEditQ]         = useState<any>(null);
  const [qDialog, setQDialog]     = useState(false);

  useEffect(() => { fetchQuizzes(); fetchMeta(); }, [page]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/quiz-builder?page=${page}&limit=15`);
      const j = await r.json();
      if (j.success) { setQuizzes(j.data.quizzes || []); setTotal(j.data.pagination?.total || 0); }
    } finally { setLoading(false); }
  };

  const fetchMeta = async () => {
    const [sr, cr] = await Promise.all([
      fetch('/api/subjects?limit=100').then(r => r.json()),
      fetch('/api/classes?limit=50').then(r => r.json()),
    ]);
    if (sr.success) setSubjects(sr.data?.subjects || sr.data || []);
    if (cr.success) setClasses(cr.data?.classes   || cr.data || []);
  };

  const fetchQuestions = async (quizId: string) => {
    const r = await fetch(`/api/quiz-builder?quizId=${quizId}`);
    const j = await r.json();
    if (j.success) setQuestions(j.data.questions || []);
  };

  const openQuiz = async (quiz: any) => {
    setSelQuiz(quiz);
    setQuizForm({
      title: quiz.title, subjectId: quiz.subjectId || '', classId: quiz.classId || '',
      duration: String(quiz.duration), totalMarks: String(quiz.totalMarks),
      passingMarks: String(quiz.passingMarks), instructions: quiz.instructions || '',
    });
    await fetchQuestions(quiz.id);
    setView('questions');
  };

  const handleCreateQuiz = async () => {
    if (!quizForm.title) { toast({ title: 'Title is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/quiz-builder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-quiz', ...quizForm }),
      });
      const j = await r.json();
      if (j.success) {
        toast({ title: 'Quiz created!' });
        setView('list'); setQuizForm({ ...EMPTY_QUIZ }); fetchQuizzes();
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleSaveQuestion = async () => {
    if (!qForm.questionText || !qForm.correctAnswer) {
      toast({ title: 'Question text and answer required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      let r;
      if (editQ) {
        r = await fetch('/api/quiz-builder', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editQ.id, type: 'question', ...qForm }),
        });
      } else {
        r = await fetch('/api/quiz-builder', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add-question', quizId: selQuiz.id, ...qForm }),
        });
      }
      const j = await r.json();
      if (j.success) {
        toast({ title: editQ ? 'Question updated' : 'Question added' });
        setQDialog(false); setQForm({ ...EMPTY_Q }); setEditQ(null);
        fetchQuestions(selQuiz.id);
      } else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const deleteQuestion = async (id: string) => {
    await fetch(`/api/quiz-builder?id=${id}&type=question`, { method: 'DELETE' });
    toast({ title: 'Question removed' });
    fetchQuestions(selQuiz.id);
  };

  const deleteQuiz = async (id: string) => {
    await fetch(`/api/quiz-builder?id=${id}&type=quiz`, { method: 'DELETE' });
    toast({ title: 'Quiz deleted' }); fetchQuizzes();
  };

  const toggleActive = async (quiz: any) => {
    await fetch('/api/quiz-builder', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: quiz.id, type: 'quiz', isActive: !quiz.isActive }),
    });
    fetchQuizzes();
  };

  const openAddQuestion = () => { setQForm({ ...EMPTY_Q }); setEditQ(null); setQDialog(true); };
  const openEditQuestion = (q: any) => {
    setQForm({ questionText: q.questionText, questionType: q.questionType, optionA: q.optionA || '', optionB: q.optionB || '', optionC: q.optionC || '', optionD: q.optionD || '', correctAnswer: q.correctAnswer, marks: String(q.marks), explanation: q.explanation || '' });
    setEditQ(q); setQDialog(true);
  };

  const totalMarksInQuiz = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        {/* List View */}
        {view === 'list' && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <HelpCircle className="h-7 w-7" />Quiz Builder
                </h1>
                <p className="text-muted-foreground">Create and manage online quizzes and assessments</p>
              </div>
              <Button onClick={() => setView('editor')}>
                <Plus className="mr-2 h-4 w-4" />Create Quiz
              </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Total Quizzes', value: total, icon: HelpCircle, color: 'border-l-blue-500 text-blue-600' },
                { label: 'Active',        value: quizzes.filter(q => q.isActive).length, icon: CheckCircle2, color: 'border-l-green-500 text-green-600' },
                { label: 'Total Questions', value: quizzes.reduce((s, q) => s + (q._count?.questions || 0), 0), icon: List, color: 'border-l-purple-500 text-purple-600' },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className={`border-l-4 ${color.split(' ')[0]}`}>
                  <CardContent className="pt-4 pb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</p>
                    </div>
                    <Icon className={`h-5 w-5 ${color.split(' ')[1]}`} />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
                ) : quizzes.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-muted-foreground">
                    <HelpCircle className="h-12 w-12 mb-3 opacity-20" />
                    <p className="font-medium">No quizzes yet</p>
                    <p className="text-sm mt-1">Create your first quiz to get started</p>
                    <Button className="mt-4" onClick={() => setView('editor')}><Plus className="mr-2 h-4 w-4" />Create Quiz</Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quiz Title</TableHead>
                        <TableHead>Questions</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quizzes.map((q: any) => (
                        <TableRow key={q.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell>
                            <div className="font-medium">{q.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">Passing: {q.passingMarks} / {q.totalMarks}</div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-blue-600">{q._count?.questions || 0}</span>
                          </TableCell>
                          <TableCell className="flex items-center gap-1 text-sm">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />{q.duration} min
                          </TableCell>
                          <TableCell>{q.totalMarks}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch checked={q.isActive} onCheckedChange={() => toggleActive(q)} />
                              <span className={`text-xs ${q.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {q.isActive ? 'Active' : 'Draft'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openQuiz(q)}>
                                <List className="mr-1 h-3 w-3" />Questions
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => deleteQuiz(q.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {Math.ceil(total / 15) > 1 && (
                  <div className="flex justify-between items-center px-4 py-3 border-t">
                    <span className="text-xs text-muted-foreground">Page {page} of {Math.ceil(total / 15)}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Create Quiz Editor */}
        {view === 'editor' && (
          <>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
              <div>
                <h1 className="text-2xl font-bold">Create New Quiz</h1>
                <p className="text-muted-foreground text-sm">Configure quiz settings then add questions</p>
              </div>
            </div>
            <Card className="max-w-2xl">
              <CardHeader><CardTitle className="text-base">Quiz Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Quiz Title *</Label>
                  <Input value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="e.g. Chapter 3 — Motion Assessment" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Subject</Label>
                    <Select value={quizForm.subjectId || 'none'} onValueChange={v => setQuizForm({ ...quizForm, subjectId: v === 'none' ? '' : v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Any Subject</SelectItem>
                        {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Class</Label>
                    <Select value={quizForm.classId || 'none'} onValueChange={v => setQuizForm({ ...quizForm, classId: v === 'none' ? '' : v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select class..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">All Classes</SelectItem>
                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input type="number" min={5} value={quizForm.duration} onChange={e => setQuizForm({ ...quizForm, duration: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Total Marks</Label>
                    <Input type="number" min={1} value={quizForm.totalMarks} onChange={e => setQuizForm({ ...quizForm, totalMarks: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Passing Marks</Label>
                    <Input type="number" min={0} value={quizForm.passingMarks} onChange={e => setQuizForm({ ...quizForm, passingMarks: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Instructions</Label>
                  <Textarea value={quizForm.instructions} onChange={e => setQuizForm({ ...quizForm, instructions: e.target.value })} placeholder="Write any special instructions for students..." rows={3} className="mt-1" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
                  <Button onClick={handleCreateQuiz} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Create Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Questions View */}
        {view === 'questions' && selQuiz && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
                <div>
                  <h1 className="text-2xl font-bold">{selQuiz.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {questions.length} questions · {selQuiz.duration} min · {totalMarksInQuiz}/{selQuiz.totalMarks} marks
                  </p>
                </div>
              </div>
              <Button onClick={openAddQuestion}>
                <Plus className="mr-2 h-4 w-4" />Add Question
              </Button>
            </div>

            {/* Question List */}
            {questions.length === 0 ? (
              <Card className="bg-muted/20">
                <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mb-3 opacity-20" />
                  <p className="font-semibold">No questions yet</p>
                  <p className="text-sm mt-1">Add questions to build your quiz</p>
                  <Button className="mt-4" onClick={openAddQuestion}><Plus className="mr-2 h-4 w-4" />Add First Question</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {questions.map((q: any, i: number) => (
                  <Card key={q.id}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-sm w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-xs">{i + 1}</span>
                            <Badge variant="outline" className="text-xs">{TYPE_LABELS[q.questionType] || q.questionType}</Badge>
                            <Badge variant="secondary" className="text-xs">{q.marks} mark{q.marks !== 1 ? 's' : ''}</Badge>
                          </div>
                          <p className="font-medium text-sm">{q.questionText}</p>
                          {q.questionType === 'MCQ' && (
                            <div className="mt-2 grid grid-cols-2 gap-1.5">
                              {['A', 'B', 'C', 'D'].map(opt => {
                                const val = q[`option${opt}`];
                                if (!val) return null;
                                return (
                                  <div key={opt} className={`text-xs px-2 py-1 rounded border ${q.correctAnswer === opt ? 'bg-green-50 border-green-300 text-green-700 font-semibold' : 'bg-gray-50 border-gray-200'}`}>
                                    <span className="font-bold mr-1">{opt}.</span>{val}
                                    {q.correctAnswer === opt && <CheckCircle2 className="inline ml-1 h-3 w-3" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {q.questionType === 'TrueFalse' && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Answer: <span className="font-semibold text-green-700">{q.correctAnswer}</span>
                            </div>
                          )}
                          {q.explanation && (
                            <p className="mt-1.5 text-xs text-muted-foreground italic border-l-2 border-blue-200 pl-2">{q.explanation}</p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditQuestion(q)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => deleteQuestion(q.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add/Edit Question Dialog */}
        <Dialog open={qDialog} onOpenChange={v => { setQDialog(v); if (!v) { setQForm({ ...EMPTY_Q }); setEditQ(null); } }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editQ ? 'Edit Question' : 'Add Question'}</DialogTitle>
              <DialogDescription>Fill in the question details</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Question Type</Label>
                  <Select value={qForm.questionType} onValueChange={v => setQForm({ ...qForm, questionType: v, correctAnswer: v === 'TrueFalse' ? 'True' : 'A' })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Marks</Label>
                  <Input type="number" min={0.5} step={0.5} value={qForm.marks} onChange={e => setQForm({ ...qForm, marks: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Question Text *</Label>
                <Textarea value={qForm.questionText} onChange={e => setQForm({ ...qForm, questionText: e.target.value })} placeholder="Enter the question..." rows={3} className="mt-1" />
              </div>
              {qForm.questionType === 'MCQ' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <div key={opt}>
                        <Label className={`text-xs ${qForm.correctAnswer === opt ? 'text-green-600 font-bold' : ''}`}>Option {opt} {qForm.correctAnswer === opt ? '✓ Correct' : ''}</Label>
                        <Input value={(qForm as any)[`option${opt}`]} onChange={e => setQForm({ ...qForm, [`option${opt}`]: e.target.value })} placeholder={`Option ${opt}...`} className="mt-1" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>Correct Answer</Label>
                    <Select value={qForm.correctAnswer} onValueChange={v => setQForm({ ...qForm, correctAnswer: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['A', 'B', 'C', 'D'].map(o => <SelectItem key={o} value={o}>Option {o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {qForm.questionType === 'TrueFalse' && (
                <div>
                  <Label>Correct Answer</Label>
                  <Select value={qForm.correctAnswer} onValueChange={v => setQForm({ ...qForm, correctAnswer: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="True">True</SelectItem>
                      <SelectItem value="False">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {qForm.questionType === 'Short' && (
                <div>
                  <Label>Model Answer</Label>
                  <Textarea value={qForm.correctAnswer} onChange={e => setQForm({ ...qForm, correctAnswer: e.target.value })} placeholder="Expected answer..." rows={2} className="mt-1" />
                </div>
              )}
              <div>
                <Label>Explanation (optional)</Label>
                <Input value={qForm.explanation} onChange={e => setQForm({ ...qForm, explanation: e.target.value })} placeholder="Brief explanation for the correct answer..." className="mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveQuestion} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editQ ? 'Update' : 'Add Question'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
