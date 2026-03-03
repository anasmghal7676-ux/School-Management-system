'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Book, Users, Repeat, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Book {
  id: string;
  accessionNumber: string;
  title: string;
  author: string;
  publisher: string | null;
  isbn: string | null;
  edition: string | null;
  category: string | null;
  rackNumber: string | null;
  quantity: number;
  availableQuantity: number;
  status: string;
  price: number | null;
}

interface Member {
  id: string;
  memberType: string;
  memberId: string;
  cardNumber: string;
  memberName: string;
  issueLimit: number;
  validityFrom: string;
  validityTo: string;
  status: string;
  issuedBooks: number;
}

const CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'Technology',
  'History',
  'Geography',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English Literature',
  'Urdu Literature',
  'General Knowledge',
  'Reference',
  'Other',
];

// ─── Library Members Sub-Component ─────────────────────────────────────────────

function LibraryMembers() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ memberType: 'Student', memberId: '', issueLimit: '3', validityFrom: new Date().toISOString().slice(0,10), validityTo: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => { fetchMembers(); fetchStudents(); }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/library/members?limit=50');
      const j = await r.json();
      if (j.success) setMembers(j.data?.members || j.data || []);
    } finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    const r = await fetch('/api/students?limit=500&status=active');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || j.data || []);
  };

  const handleAdd = async () => {
    if (!form.memberId || !form.validityTo) { toast({ title: 'Member and validity required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/library/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const j = await r.json();
      if (j.success) { toast({ title: 'Member added', description: `Card #${j.data.cardNumber}` }); setAddOpen(false); fetchMembers(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const filteredStudents = students.filter(s => s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) || s.admissionNumber.includes(studentSearch)).slice(0,8);
  const uf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Library Members</CardTitle><CardDescription>Registered students and staff with library cards</CardDescription></div>
        <Button onClick={() => { setForm({ memberType: 'Student', memberId: '', issueLimit: '3', validityFrom: new Date().toISOString().slice(0,10), validityTo: '' }); setSelectedStudent(null); setStudentSearch(''); setAddOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Member
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          : members.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground"><Users className="h-10 w-10 mb-3" /><p>No library members registered</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/30">{['Card #','Member','Type','Issue Limit','Valid Until','Status'].map(h => <th key={h} className="text-left px-4 py-2 font-medium text-muted-foreground text-xs">{h}</th>)}</tr></thead>
              <tbody>
                {members.map((m: any) => (
                  <tr key={m.id} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-2 font-mono font-semibold text-xs">{m.cardNumber}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium">{m.student?.fullName || m.memberId}</div>
                      <div className="text-xs text-muted-foreground">{m.student?.admissionNumber}</div>
                    </td>
                    <td className="px-4 py-2"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{m.memberType}</span></td>
                    <td className="px-4 py-2 text-center font-bold">{m.issueLimit}</td>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(m.validityTo).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Library Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Student *</Label>
              <Input className="mt-1" placeholder="Search student..." value={studentSearch} onChange={e => { setStudentSearch(e.target.value); if (!e.target.value) { setSelectedStudent(null); uf('memberId',''); } }} />
              {studentSearch && !selectedStudent && filteredStudents.length > 0 && (
                <div className="border rounded-md max-h-36 overflow-y-auto bg-background shadow-md mt-1">
                  {filteredStudents.map(s => <button key={s.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted" onClick={() => { setSelectedStudent(s); setStudentSearch(`${s.fullName} (${s.admissionNumber})`); uf('memberId', s.id); }}><span className="font-medium">{s.fullName}</span><span className="text-muted-foreground ml-2">{s.admissionNumber}</span></button>)}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Max Books</Label><Input className="mt-1" type="number" value={form.issueLimit} onChange={e => uf('issueLimit', e.target.value)} /></div>
              <div><Label>Valid From</Label><Input className="mt-1" type="date" value={form.validityFrom} onChange={e => uf('validityFrom', e.target.value)} /></div>
              <div className="col-span-2"><Label>Valid To *</Label><Input className="mt-1" type="date" value={form.validityTo} onChange={e => uf('validityTo', e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Library Transactions Sub-Component ───────────────────────────────────────

function LibraryTransactions({ books }: { books: any[] }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('Issued');
  const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '', dueDate: '', issuedBy: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTransactions(); fetchStudents(); }, [statusFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '50' });
      if (statusFilter) p.append('status', statusFilter);
      const r = await fetch(`/api/library/transactions?${p}`);
      const j = await r.json();
      if (j.success) setTransactions(j.data.transactions);
    } finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    const r = await fetch('/api/students?limit=200&status=active');
    const j = await r.json();
    if (j.success) setStudents(j.data?.students || []);
  };

  const handleIssue = async () => {
    if (!issueForm.bookId || !issueForm.studentId) {
      toast({ title: 'Required', description: 'Book and student are required', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/library/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(issueForm),
      });
      const j = await r.json();
      if (j.success) { toast({ title: 'Issued' }); setIssueOpen(false); fetchTransactions(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to issue', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleReturn = async () => {
    if (!selectedTx) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/library/transactions/${selectedTx.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnDate: new Date().toISOString() }),
      });
      const j = await r.json();
      if (j.success) { toast({ title: 'Returned', description: j.message }); setReturnOpen(false); setSelectedTx(null); fetchTransactions(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', description: 'Failed to return', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const isOverdue = (tx: any) => tx.status === 'Issued' && new Date() > new Date(tx.dueDate);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Book Transactions</CardTitle><CardDescription>Issue and return books</CardDescription></div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Issued">Issued</SelectItem>
              <SelectItem value="Returned">Returned</SelectItem>
              <SelectItem value="">All</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setIssueForm({ bookId: '', studentId: '', dueDate: '', issuedBy: '' }); setIssueOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Issue Book
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground"><Repeat className="h-10 w-10 mb-3" /><p>No transactions found</p></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead><TableHead>Student</TableHead>
                <TableHead>Issue Date</TableHead><TableHead>Due Date</TableHead>
                <TableHead>Return Date</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Fine</TableHead><TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx: any) => (
                <TableRow key={tx.id} className={isOverdue(tx) ? 'bg-red-50 dark:bg-red-950' : ''}>
                  <TableCell><div className="font-medium text-sm">{tx.book?.title}</div><div className="text-xs text-muted-foreground">{tx.book?.accessionNumber}</div></TableCell>
                  <TableCell className="text-sm">{tx.student?.fullName || '—'}</TableCell>
                  <TableCell className="text-sm">{new Date(tx.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell className={`text-sm ${isOverdue(tx) ? 'text-red-600 font-semibold' : ''}`}>{new Date(tx.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'Returned' ? 'secondary' : isOverdue(tx) ? 'destructive' : 'default'}>
                      {isOverdue(tx) ? 'Overdue' : tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">{tx.fineAmount > 0 ? <span className="text-red-600 font-medium">PKR {tx.fineAmount}</span> : '—'}</TableCell>
                  <TableCell>{tx.status === 'Issued' && <Button size="sm" variant="outline" onClick={() => { setSelectedTx(tx); setReturnOpen(true); }}>Return</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Issue Book</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Book *</Label>
              <Select value={issueForm.bookId} onValueChange={v => setIssueForm(f => ({...f, bookId: v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select book" /></SelectTrigger>
                <SelectContent>{books.filter((b: any) => b.availableQuantity > 0).map((b: any) => <SelectItem key={b.id} value={b.id}>{b.title} ({b.availableQuantity} avail.)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Student *</Label>
              <Select value={issueForm.studentId} onValueChange={v => setIssueForm(f => ({...f, studentId: v}))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.admissionNumber})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Due Date</Label><Input className="mt-1" type="date" value={issueForm.dueDate} onChange={e => setIssueForm(f => ({...f, dueDate: e.target.value}))} /></div>
            <div><Label>Issued By</Label><Input className="mt-1" value={issueForm.issuedBy} onChange={e => setIssueForm(f => ({...f, issuedBy: e.target.value}))} placeholder="Librarian name" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueOpen(false)}>Cancel</Button>
            <Button onClick={handleIssue} disabled={saving}>Issue Book</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={returnOpen} onOpenChange={() => { setReturnOpen(false); setSelectedTx(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Return Book</DialogTitle><DialogDescription>{selectedTx && `"${selectedTx.book?.title}" — ${selectedTx.student?.fullName}`}</DialogDescription></DialogHeader>
          {selectedTx && isOverdue(selectedTx) && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 rounded p-3 text-sm text-red-700 dark:text-red-400 font-medium">
              Overdue! Fine: PKR {Math.ceil((Date.now() - new Date(selectedTx.dueDate).getTime()) / (1000*60*60*24)) * 5}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReturnOpen(false); setSelectedTx(null); }}>Cancel</Button>
            <Button onClick={handleReturn} disabled={saving}>Confirm Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function OverdueBooks() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/library/transactions?overdue=true&status=Issued&limit=100');
        const j = await r.json();
        if (j.success) setItems(j.data.transactions);
      } finally { setLoading(false); }
    })();
  }, []);
  const calcFine = (d: string) => Math.max(0, Math.ceil((Date.now() - new Date(d).getTime()) / (1000*60*60*24)) * 5);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-500" />Overdue Books & Fines</CardTitle>
        <CardDescription>Books not returned by due date — PKR 5 per day</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <div className="flex justify-center py-12 text-muted-foreground">Loading...</div>
          : items.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mb-3 text-green-500" /><p>No overdue books!</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border-b flex justify-between text-sm">
                <span className="text-red-700 dark:text-red-400 font-medium">{items.length} overdue books</span>
                <span className="font-bold text-red-700 dark:text-red-400">Total Fines: PKR {items.reduce((s,tx) => s + calcFine(tx.dueDate), 0).toLocaleString()}</span>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Book</TableHead><TableHead>Student</TableHead><TableHead>Due Date</TableHead><TableHead>Days</TableHead><TableHead className="text-right">Fine</TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map((tx: any) => {
                    const days = Math.ceil((Date.now() - new Date(tx.dueDate).getTime()) / (1000*60*60*24));
                    return (
                      <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell><div className="font-medium text-sm">{tx.book?.title}</div><div className="text-xs text-muted-foreground">{tx.book?.accessionNumber}</div></TableCell>
                        <TableCell className="text-sm">{tx.student?.fullName || '—'}</TableCell>
                        <TableCell className="text-sm text-red-600">{new Date(tx.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant="destructive">{days}d</Badge></TableCell>
                        <TableCell className="text-right font-semibold text-red-600">{calcFine(tx.dueDate)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
      </CardContent>
    </Card>
  );
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState('books');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publisher: '',
    isbn: '',
    edition: '',
    category: '',
    rackNumber: '',
    quantity: 1,
    price: '',
  });

  useEffect(() => {
    fetchBooks();
    fetchMembers();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/library/books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/library/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingBook ? `/api/library/books/${editingBook.id}` : '/api/library/books';
      const method = editingBook ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingBook
            ? 'Book updated successfully'
            : 'Book added successfully',
        });
        setDialogOpen(false);
        resetForm();
        fetchBooks();
      } else {
        throw new Error('Failed to save book');
      }
    } catch (error) {
      console.error('Failed to save book:', error);
      toast({
        title: 'Error',
        description: 'Failed to save book',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      isbn: book.isbn || '',
      edition: book.edition || '',
      category: book.category || '',
      rackNumber: book.rackNumber || '',
      quantity: book.quantity,
      price: book.price?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      const response = await fetch(`/api/library/books/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Book deleted successfully',
        });
        fetchBooks();
      } else {
        throw new Error('Failed to delete book');
      }
    } catch (error) {
      console.error('Failed to delete book:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete book',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      publisher: '',
      isbn: '',
      edition: '',
      category: '',
      rackNumber: '',
      quantity: 1,
      price: '',
    });
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.accessionNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || book.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalBooks = books.reduce((sum, b) => sum + b.quantity, 0);
  const availableBooks = books.reduce((sum, b) => sum + b.availableQuantity, 0);
  const issuedBooks = totalBooks - availableBooks;

  return (
    <div className="flex-1 space-y-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Library Management</h2>
          <p className="text-muted-foreground">
            Manage books, members, and transactions
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-6">
          {/* Statistics */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                <Book className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBooks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {availableBooks}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issued</CardTitle>
                <Repeat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{issuedBooks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Books Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Book Catalog</CardTitle>
                  <CardDescription>
                    Manage library books and inventory
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Book
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingBook ? 'Edit Book' : 'Add New Book'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingBook
                          ? 'Update book information'
                          : 'Add a new book to the library'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({ ...formData, title: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="author">Author *</Label>
                          <Input
                            id="author"
                            value={formData.author}
                            onChange={(e) =>
                              setFormData({ ...formData, author: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="publisher">Publisher</Label>
                            <Input
                              id="publisher"
                              value={formData.publisher}
                              onChange={(e) =>
                                setFormData({ ...formData, publisher: e.target.value })
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="isbn">ISBN</Label>
                            <Input
                              id="isbn"
                              value={formData.isbn}
                              onChange={(e) =>
                                setFormData({ ...formData, isbn: e.target.value })
                            }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edition">Edition</Label>
                            <Input
                              id="edition"
                              value={formData.edition}
                              onChange={(e) =>
                                setFormData({ ...formData, edition: e.target.value })
                            }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                              value={formData.category}
                              onValueChange={(value) =>
                                setFormData({ ...formData, category: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="rackNumber">Rack Number</Label>
                            <Input
                              id="rackNumber"
                              value={formData.rackNumber}
                              onChange={(e) =>
                                setFormData({ ...formData, rackNumber: e.target.value })
                            }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min="1"
                              value={formData.quantity}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  quantity: parseInt(e.target.value),
                                })
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="price">Price (PKR)</Label>
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData({ ...formData, price: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                          {editingBook ? 'Update' : 'Create'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Issued">Issued</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading books...</div>
              ) : filteredBooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No books found
                </div>
              ) : (
                <div className="rounded-md border max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Accession No.</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Rack</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBooks.map((book) => (
                        <TableRow key={book.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-medium">
                            {book.accessionNumber}
                          </TableCell>
                          <TableCell>{book.title}</TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{book.category || '-'}</Badge>
                          </TableCell>
                          <TableCell>{book.rackNumber || '-'}</TableCell>
                          <TableCell>{book.availableQuantity}</TableCell>
                          <TableCell>{book.quantity}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                book.status === 'Available'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {book.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(book)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(book.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <LibraryMembers />
        </TabsContent>

        <TabsContent value="transactions">
          <LibraryTransactions books={books} />
        </TabsContent>

        <TabsContent value="fines">
          <OverdueBooks />
        </TabsContent>
      </Tabs>
    </div>
  );
}
