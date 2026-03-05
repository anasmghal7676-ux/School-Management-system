'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Loader2, BookOpen, Clock, Award, CheckCircle2, XCircle, ArrowLeft,
  ArrowRight, Flag, AlertTriangle, Play, RotateCcw, Eye, ChevronRight,
  Target, TrendingUp, CheckSquare, HelpCircle, RefreshCw, Search,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

type View = 'lobby' | 'exam' | 'review' | 'result';

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtTimer(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

export default function OnlineExamPage() {
  // ── Quiz lobby ─────────────────────────────────────────────────────────────
  const [quizzes,  setQuizzes]  = useState<any[]>([]);
  const [search,   setSearch]   = useState('');
  const [classes,  setClasses]  = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading,  setLoading]  = useState(false);

  // ── Active exam ────────────────────────────────────────────────────────────
  const [view,      setView]      = useState<View>('lobby');
  const [quiz,      setQuiz]      = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers,   setAnswers]   = useState<Record<string, string>>({});   // questionId -> answer
  const [flagged,   setFlagged]   = useState<Set<string>>(new Set());
  const [currentQ,  setCurrentQ]  = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [started,   setStarted]   = useState(false);
  const [submitDlg, setSubmitDlg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results,   setResults]   = useState<any>(null);
  const [reviewQ,   setReviewQ]   = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { fetchQuizzes(); fetchClasses(); }, []);

  // Timer countdown
  useEffect(() => {
    if (!started || view !== 'exam' || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [started, view]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/quiz-builder?page=1&limit=50');
      const j = await r.json();
      if (j.success) setQuizzes(j.data.quizzes || []);
    } finally { setLoading(false); }
  };

  const fetchClasses = async () => {
    const r = await fetch('/api/classes?limit=50');
    const j = await r.json();
    if (j.success) setClasses(j.data?.classes || j.data || []);
  };

  const startQuiz = async (q: any) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/quiz-builder?quizId=${q.id}`);
      const j = await r.json();
      if (!j.success) { toast({ title: 'Failed to load quiz', variant: 'destructive' }); return; }
      const fullQuiz = j.data;
      const qs = fullQuiz.questions || [];
      if (qs.length === 0) { toast({ title: 'This quiz has no questions yet', variant: 'destructive' }); return; }
      setQuiz(fullQuiz);
      setQuestions(qs);
      setAnswers({});
      setFlagged(new Set());
      setCurrentQ(0);
      setTimeLeft((fullQuiz.duration || 30) * 60);
      setStarted(false);
      setResults(null);
      setView('exam');
    } finally { setLoading(false); }
  };

  const beginExam = () => {
    setStarted(true);
    toast({ title: `Exam started — ${fmtTimer(timeLeft)} remaining` });
  };

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers(a => ({ ...a, [questionId]: answer }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged(f => {
      const next = new Set(f);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  };

  const handleAutoSubmit = () => {
    setStarted(false);
    calculateResults();
    setView('result');
    toast({ title: 'Time up! Exam auto-submitted', variant: 'destructive' });
  };

  const handleSubmit = () => {
    const unanswered = questions.filter(q => !answers[q.id]).length;
    if (unanswered > 0 && !submitDlg) {
      setSubmitDlg(true);
      return;
    }
    setSubmitDlg(false);
    setSubmitting(true);
    clearInterval(timerRef.current!);
    setTimeout(() => {
      calculateResults();
      setSubmitting(false);
      setView('result');
    }, 800);
  };

  const calculateResults = useCallback(() => {
    let correct = 0, wrong = 0, unanswered = 0, totalMarks = 0;
    const questionResults: any[] = [];

    questions.forEach(q => {
      const given     = answers[q.id] || '';
      const isCorrect = given.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
      const isSkipped = !given;

      if (isSkipped) unanswered++;
      else if (isCorrect) { correct++; totalMarks += q.marks; }
      else wrong++;

      questionResults.push({ ...q, givenAnswer: given, isCorrect, isSkipped });
    });

    const total    = questions.reduce((s, q) => s + q.marks, 0);
    const pct      = total > 0 ? (totalMarks / total) * 100 : 0;
    const passed   = totalMarks >= (quiz?.passingMarks || 50);
    const timeTaken = (quiz?.duration || 30) * 60 - timeLeft;

    setResults({ correct, wrong, unanswered, totalMarks, maxMarks: total, pct, passed, timeTaken, questionResults });
  }, [questions, answers, quiz, timeLeft]);

  const retakeQuiz = () => {
    setAnswers({});
    setFlagged(new Set());
    setCurrentQ(0);
    setTimeLeft((quiz?.duration || 30) * 60);
    setStarted(false);
    setResults(null);
    setView('exam');
  };

  // ── Filtered quizzes ───────────────────────────────────────────────────────
  const filteredQuizzes = quizzes.filter(q =>
    q.isActive &&
    (!search || q.title.toLowerCase().includes(search.toLowerCase())) &&
    (!classFilter || q.classId === classFilter)
  );

  const q          = questions[currentQ];
  const answered   = Object.keys(answers).length;
  const progress   = questions.length > 0 ? (answered / questions.length) * 100 : 0;
  const timeColor  = timeLeft < 300 ? 'text-red-600' : timeLeft < 600 ? 'text-amber-600' : 'text-green-600';

  // ─────────────────────────────────────────────────────────────────────────
  //  LOBBY
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'lobby') return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-violet-50"><BookOpen className="h-6 w-6 text-violet-600" /></span>
              Online Exams
            </h1>
            <p className="text-muted-foreground mt-0.5">Select an exam to begin</p>
          </div>
          <Button variant="outline" onClick={fetchQuizzes} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search exams…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={classFilter || 'all'} onValueChange={v => setClassFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
            <BookOpen className="h-12 w-12 opacity-20" />
            <p className="font-semibold">No active exams available</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map(quiz => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow border-2 hover:border-violet-200 cursor-pointer group card-hover">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-violet-50 group-hover:bg-violet-100 transition-colors">
                      <BookOpen className="h-5 w-5 text-violet-600" />
                    </div>
                    <Badge variant={quiz.isActive ? 'default' : 'secondary'} className={quiz.isActive ? 'bg-green-100 text-green-700' : ''}>
                      {quiz.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-base leading-tight mb-1">{quiz.title}</h3>
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" />{quiz._count?.questions || 0} questions</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{quiz.duration} min</span>
                      <span className="flex items-center gap-1"><Award className="h-3 w-3" />{quiz.totalMarks} marks</span>
                    </div>
                    {quiz.instructions && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{quiz.instructions}</p>
                    )}
                  </div>
                  <Button
                    className="w-full mt-4 gap-2 bg-violet-600 hover:bg-violet-700"
                    onClick={() => startQuiz(quiz)}
                    disabled={loading}
                  >
                    <Play className="h-4 w-4" />Start Exam
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  EXAM
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'exam' && quiz && q) return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Exam header bar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{quiz.title}</p>
            <p className="text-xs text-muted-foreground">{quiz.totalMarks} marks · Pass: {quiz.passingMarks}</p>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timeColor} ${!started ? 'opacity-40' : ''}`}>
            <Clock className="h-5 w-5" />
            {fmtTimer(timeLeft)}
          </div>

          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span>{answered}/{questions.length} answered</span>
            <Progress value={progress} className="w-24 h-1.5" />
          </div>

          <Button
            variant="destructive" size="sm"
            onClick={() => handleSubmit()}
            disabled={submitting || !started}
          >
            {submitting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
            Submit
          </Button>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Start screen overlay */}
      {!started && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="p-4 rounded-full bg-violet-100"><BookOpen className="h-8 w-8 text-violet-600" /></div>
              </div>
              <CardTitle className="text-xl">{quiz.title}</CardTitle>
              <CardDescription>Read the instructions carefully before starting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Questions', val: questions.length, icon: HelpCircle },
                  { label: 'Duration',  val: `${quiz.duration} min`, icon: Clock },
                  { label: 'Marks',     val: quiz.totalMarks, icon: Award },
                ].map(({ label, val, icon: Icon }) => (
                  <div key={label} className="bg-violet-50 rounded-xl py-3">
                    <Icon className="h-4 w-4 text-violet-600 mx-auto mb-1" />
                    <div className="font-bold">{val}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
              {quiz.instructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                  <p className="font-semibold text-amber-800 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />Instructions
                  </p>
                  <p className="text-amber-700">{quiz.instructions}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setView('lobby')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />Back
                </Button>
                <Button className="flex-1 bg-violet-600 hover:bg-violet-700 gap-2" onClick={beginExam}>
                  <Play className="h-4 w-4" />Start Exam
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main exam layout */}
      <div className="max-w-5xl mx-auto w-full px-4 py-6 flex gap-6">

        {/* Question panel */}
        <div className="flex-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  Question {currentQ + 1} of {questions.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant={flagged.has(q.id) ? 'default' : 'outline'}
                    size="sm"
                    className={`h-8 gap-1.5 ${flagged.has(q.id) ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : ''}`}
                    onClick={() => toggleFlag(q.id)}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {flagged.has(q.id) ? 'Flagged' : 'Flag'}
                  </Button>
                  <Badge variant="outline" className="font-semibold">{q.marks} mark{q.marks > 1 ? 's' : ''}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-base font-medium leading-relaxed">{q.questionText}</p>

              {/* MCQ options */}
              {q.questionType === 'MCQ' && (
                <div className="space-y-2.5">
                  {(['A','B','C','D'] as const).map(opt => {
                    const text     = q[`option${opt}`];
                    if (!text) return null;
                    const selected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => selectAnswer(q.id, opt)}
                        disabled={!started}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          selected
                            ? 'border-violet-500 bg-violet-50 text-violet-800'
                            : 'border-border hover:border-violet-300 hover:bg-violet-50/50'
                        } ${!started ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          selected ? 'border-violet-500 bg-violet-500 text-white' : 'border-muted-foreground'
                        }`}>{opt}</span>
                        <span className="text-sm">{text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False */}
              {q.questionType === 'TrueFalse' && (
                <div className="flex gap-3">
                  {['True','False'].map(opt => {
                    const selected = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => selectAnswer(q.id, opt)}
                        disabled={!started}
                        className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${
                          selected
                            ? opt === 'True' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                            : 'border-border hover:border-violet-300'
                        } ${!started ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {opt === 'True' ? '✓ True' : '✗ False'}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Short Answer */}
              {q.questionType === 'Short' && (
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={e => selectAnswer(q.id, e.target.value)}
                  disabled={!started}
                  placeholder="Type your answer here…"
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-violet-500 focus:outline-none text-sm disabled:opacity-50"
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
              disabled={currentQ === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />Previous
            </Button>
            <Button
              className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
              onClick={() => {
                if (currentQ < questions.length - 1) setCurrentQ(q => q + 1);
                else setSubmitDlg(true);
              }}
              disabled={!started}
            >
              {currentQ === questions.length - 1 ? 'Review & Submit' : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Question palette (sidebar) */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <Card className="sticky top-20">
            <CardHeader className="py-3 px-3 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {questions.map((question, i) => {
                  const isAnswered = !!answers[question.id];
                  const isCurrent  = i === currentQ;
                  const isFlagged  = flagged.has(question.id);
                  return (
                    <button
                      key={question.id}
                      onClick={() => setCurrentQ(i)}
                      className={`h-8 w-full rounded text-xs font-bold border transition-all ${
                        isCurrent    ? 'bg-violet-600 text-white border-violet-600' :
                        isFlagged    ? 'bg-amber-100 text-amber-700 border-amber-300' :
                        isAnswered   ? 'bg-green-100 text-green-700 border-green-300' :
                                       'bg-muted text-muted-foreground border-border hover:border-violet-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { color: 'bg-violet-600', label: 'Current' },
                  { color: 'bg-green-100 border border-green-300', label: 'Answered' },
                  { color: 'bg-amber-100 border border-amber-300', label: 'Flagged' },
                  { color: 'bg-muted border border-border', label: 'Not answered' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${color}`} />
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between"><span>Answered:</span><span className="font-bold text-green-600">{answered}</span></div>
                <div className="flex justify-between"><span>Flagged:</span><span className="font-bold text-amber-600">{flagged.size}</span></div>
                <div className="flex justify-between"><span>Remaining:</span><span className="font-bold text-red-500">{questions.length - answered}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit dialog */}
      <Dialog open={submitDlg} onOpenChange={setSubmitDlg}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              {questions.length - answered > 0
                ? `You have ${questions.length - answered} unanswered question${questions.length - answered > 1 ? 's' : ''}. Are you sure you want to submit?`
                : 'All questions answered. Ready to submit?'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-2 text-center text-sm">
            <div className="bg-green-50 rounded-xl py-3">
              <p className="text-xl font-bold text-green-600">{answered}</p>
              <p className="text-xs text-muted-foreground">Answered</p>
            </div>
            <div className="bg-red-50 rounded-xl py-3">
              <p className="text-xl font-bold text-red-500">{questions.length - answered}</p>
              <p className="text-xs text-muted-foreground">Skipped</p>
            </div>
            <div className="bg-amber-50 rounded-xl py-3">
              <p className="text-xl font-bold text-amber-600">{flagged.size}</p>
              <p className="text-xs text-muted-foreground">Flagged</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitDlg(false)}>Review More</Button>
            <Button onClick={() => handleSubmit()} disabled={submitting} className="bg-red-600 hover:bg-red-700">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  RESULTS
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'result' && results) return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageHeader />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">

        {/* Result card */}
        <Card className={`border-2 ${results.passed ? 'border-green-300' : 'border-red-300'} overflow-hidden`}>
          <div className={`py-8 text-center ${results.passed ? 'bg-gradient-to-b from-green-50 to-white' : 'bg-gradient-to-b from-red-50 to-white'}`}>
            <div className={`inline-flex p-4 rounded-full mb-4 ${results.passed ? 'bg-green-100' : 'bg-red-100'}`}>
              {results.passed
                ? <CheckCircle2 className="h-12 w-12 text-green-600" />
                : <XCircle className="h-12 w-12 text-red-500" />}
            </div>
            <h2 className="text-3xl font-bold mb-1">{results.passed ? '🎉 Passed!' : 'Not Passed'}</h2>
            <p className="text-muted-foreground">{quiz?.title}</p>
            <div className={`text-6xl font-black mt-4 ${results.passed ? 'text-green-600' : 'text-red-500'}`}>
              {results.pct.toFixed(1)}%
            </div>
            <p className="text-lg text-muted-foreground mt-1">
              {results.totalMarks} / {results.maxMarks} marks
            </p>
          </div>

          <CardContent className="pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {[
                { label: 'Correct',    val: results.correct,    color: 'text-green-600',  bg: 'bg-green-50' },
                { label: 'Wrong',      val: results.wrong,      color: 'text-red-500',    bg: 'bg-red-50' },
                { label: 'Skipped',    val: results.unanswered, color: 'text-amber-600',  bg: 'bg-amber-50' },
                { label: 'Time Taken', val: fmtTimer(results.timeTaken), color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map(({ label, val, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl py-4 text-center`}>
                  <p className={`text-2xl font-bold ${color}`}>{val}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setView('lobby')}>
                <ArrowLeft className="h-4 w-4" />Exam Lobby
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                setResults(results);
                setReviewQ(0);
                setView('review');
              }}>
                <Eye className="h-4 w-4" />Review Answers
              </Button>
              <Button className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700" onClick={retakeQuiz}>
                <RotateCcw className="h-4 w-4" />Retake
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick answer overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Answer Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
              {results.questionResults.map((qr: any, i: number) => (
                <button
                  key={qr.id}
                  onClick={() => { setReviewQ(i); setView('review'); }}
                  className={`h-9 w-full rounded-lg text-xs font-bold border ${
                    qr.isSkipped ? 'bg-muted border-border text-muted-foreground' :
                    qr.isCorrect ? 'bg-green-100 border-green-300 text-green-700' :
                                   'bg-red-100 border-red-300 text-red-600'
                  }`}
                  title={`Q${i+1}: ${qr.isSkipped ? 'Skipped' : qr.isCorrect ? 'Correct' : 'Wrong'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  REVIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (view === 'review' && results) {
    const rq = results.questionResults[reviewQ];
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <PageHeader />
        <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setView('result')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />Back to Results
            </Button>
            <h1 className="font-bold text-lg">Review: {quiz?.title}</h1>
          </div>

          <Card className={`border-2 ${rq.isSkipped ? 'border-amber-300' : rq.isCorrect ? 'border-green-300' : 'border-red-300'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Question {reviewQ + 1} / {results.questionResults.length}</span>
                {rq.isSkipped
                  ? <Badge className="bg-amber-100 text-amber-700">Skipped</Badge>
                  : rq.isCorrect
                    ? <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="mr-1 h-3 w-3" />Correct</Badge>
                    : <Badge className="bg-red-100 text-red-700"><XCircle className="mr-1 h-3 w-3" />Wrong</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-medium">{rq.questionText}</p>

              {rq.questionType === 'MCQ' && (
                <div className="space-y-2">
                  {(['A','B','C','D'] as const).map(opt => {
                    const text      = rq[`option${opt}`];
                    if (!text) return null;
                    const isCorrect = opt === rq.correctAnswer;
                    const isGiven   = opt === rq.givenAnswer;
                    return (
                      <div key={opt} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
                        isCorrect ? 'bg-green-50 border-green-400' :
                        isGiven && !isCorrect ? 'bg-red-50 border-red-400' :
                        'border-border'
                      }`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCorrect ? 'bg-green-500 text-white' :
                          isGiven && !isCorrect ? 'bg-red-400 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>{opt}</span>
                        <span className="text-sm flex-1">{text}</span>
                        {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {isGiven && !isCorrect && <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {(rq.questionType === 'TrueFalse' || rq.questionType === 'Short') && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28">Your answer:</span>
                    <span className={`font-semibold ${rq.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                      {rq.givenAnswer || '(skipped)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28">Correct answer:</span>
                    <span className="font-semibold text-green-600">{rq.correctAnswer}</span>
                  </div>
                </div>
              )}

              {rq.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
                  <p className="font-semibold text-blue-700 mb-1">Explanation</p>
                  <p className="text-blue-600">{rq.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setReviewQ(q => Math.max(0, q - 1))} disabled={reviewQ === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />Previous
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              onClick={() => {
                if (reviewQ < results.questionResults.length - 1) setReviewQ(q => q + 1);
                else setView('result');
              }}
            >
              {reviewQ === results.questionResults.length - 1 ? 'Done' : 'Next'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
