'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  Plus, Edit, Trash2, Search, DollarSign, TrendingUp, TrendingDown,
  Wallet, Receipt, CreditCard, ArrowDownRight, ArrowUpRight, Loader2,
  WalletCards, PieChart, FileText, Download, Filter, Calendar, AlertCircle,
  CheckCircle2, Clock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Expense {
  id: string;
  title: string;
  description: string | null;
  expenseCategory: {
    id: string;
    name: string;
    code: string;
  };
  amount: number;
  expenseDate: string;
  paymentMode: string | null;
  vendorName: string | null;
  billNumber: string | null;
  approvedBy: string | null;
  createdAt: string;
  categoryName: string;
  categoryCode: string;
}

const EXPENSE_CATEGORIES = [
  { name: 'Salaries', code: 'SALARY' },
  { name: 'Utilities', code: 'UTILITIES' },
  { name: 'Maintenance', code: 'MAINTENANCE' },
  { name: 'Office Supplies', code: 'OFFICE' },
  { name: 'Transportation', code: 'TRANSPORT' },
  { name: 'Teaching Aids', code: 'TEACHING' },
  { name: 'Events & Functions', code: 'EVENTS' },
  { name: 'Repairs', code: 'REPAIRS' },
  { name: 'Furniture & Equipment', code: 'FURNITURE' },
  { name: 'Marketing', code: 'MARKETING' },
];

export default function AccountsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState('expenses');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expenseCategoryId: '',
    amount: '',
    expenseDate: '',
    paymentMode: '',
    vendorName: '',
    billNumber: '',
  });

  useEffect(() => {
    fetchExpenses();
    fetchExpenseCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (dateFilter !== 'all') params.set('dateFilter', dateFilter);

      const response = await fetch(`/api/expenses?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseCategories = async () => {
    // Categories are fetched with expenses
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
      const method = editingExpense ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Expense ${editingExpense ? 'updated' : 'added'} successfully`,
        });
        setDialogOpen(false);
        resetForm();
        fetchExpenses();
      } else {
        throw new Error('Failed to save expense');
      }
    } catch (error) {
      console.error('Failed to save expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to save expense',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || '',
      expenseCategoryId: expense.expenseCategory?.id || '',
      amount: expense.amount.toString(),
      expenseDate: expense.expenseDate.split('T')[0],
      paymentMode: expense.paymentMode || '',
      vendorName: expense.vendorName || '',
      billNumber: expense.billNumber || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Expense deleted successfully',
        });
        fetchExpenses();
      }
    } catch (error) {
      toast({
        title: 'Expense',
        description: 'Failed to delete expense',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      description: '',
      expenseCategoryId: '',
      amount: '',
      expenseDate: '',
      paymentMode: '',
      vendorName: '',
      billNumber: '',
    });
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.description &&
        expense.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (expense.vendorName &&
        expense.vendorName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || expense.categoryCode === categoryFilter;

    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'month' &&
        new Date(expense.expenseDate).getMonth() === new Date().getMonth()) ||
      (dateFilter === 'quarter' &&
        Math.ceil(new Date(expense.expenseDate).getMonth() / 3) ===
          Math.ceil(new Date().getMonth() / 3)) ||
      (dateFilter === 'year' &&
        new Date(expense.expenseDate).getFullYear() === new Date().getFullYear());

    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthExpenses = expenses
    .filter((e) => {
      const expenseDate = new Date(e.expenseDate);
      const now = new Date();
      return (
        expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const expenseByCategory = EXPENSE_CATEGORIES.map((cat) => ({
    category: cat.name,
    code: cat.code,
    amount: expenses
      .filter((e) => e.categoryCode === cat.code)
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  const sortedCategories = expenseByCategory.sort((a, b) => b.amount - a.amount);

  return (
    <div className="flex-1 space-y-6 p-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Accounting & Expenses
          </h2>
          <p className="text-muted-foreground">
            Manage school finances, expenses, and accounting
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </motion.div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expenses" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600">
            <Receipt className="h-4 w-4 mr-2" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="income" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600">
            <TrendingUp className="h-4 w-4 mr-2" />
            Income
          </TabsTrigger>
          <TabsTrigger value="budget" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600">
            <PieChart className="h-4 w-4 mr-2" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state-active]:from-green-600 data-[state=active]:to-emerald-600">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-6">
          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-6 md:grid-cols-4"
          >
            {[
              { title: 'Total Expenses', value: `PKR ${totalExpenses.toLocaleString()}`, icon: DollarSign, color: 'green' },
              { title: 'This Month', value: `PKR ${thisMonthExpenses.toLocaleString()}`, icon: Calendar, color: 'emerald' },
              { title: 'Pending Approval', value: expenses.filter(e => !e.approvedBy).length, icon: Clock, color: 'orange' },
              { title: 'Processed', value: expenses.filter(e => e.approvedBy).length, icon: CheckCircle2, color: 'blue' },
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className={`border-l-4 border-l-${stat.color}-500 shadow-sm hover:shadow-md transition-shadow`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Expense by Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Expense by Category</CardTitle>
                <CardDescription>
                  Overview of expenses by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedCategories.slice(0, 5).map((cat, index) => (
                    <div key={cat.code} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              sortedCategories.indexOf(cat) < 3
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'bg-gray-200'
                            }`}
                          />
                          <span className="font-medium">{cat.category}</span>
                        </div>
                        <div className="font-bold text-lg">
                          PKR {cat.amount.toLocaleString()}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(cat.amount / totalExpenses) * 100}%`,
                          }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Expenses Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Expenses</CardTitle>
                    <CardDescription>
                      View and manage school expenses
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.code} value={cat.code}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Time Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600 mr-2" />
                    <span className="text-muted-foreground">Loading expenses...</span>
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No expenses found</p>
                  </div>
                ) : (
                  <div className="rounded-md border max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredExpenses.map((expense, index) => (
                            <motion.tr
                              key={expense.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.03 }}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                <div>
                                  <div className="font-medium">{expense.title}</div>
                                  {expense.description && (
                                    <div className="text-sm text-muted-foreground">
                                      {expense.description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{expense.categoryName}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(expense.expenseDate).toLocaleDateString('en-PK', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </div>
                              </TableCell>
                              <TableCell>{expense.vendorName || '-'}</TableCell>
                              <TableCell className="font-bold">
                                PKR {expense.amount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={expense.approvedBy ? 'default' : 'secondary'}
                                >
                                  {expense.approvedBy ? 'Approved' : 'Pending'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(expense)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(expense.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Income Ledger</CardTitle>
                <CardDescription>Fee collections and income vs expense balance</CardDescription>
              </div>
              <Button onClick={() => window.location.href = '/accounting'}>
                Open Full Ledger →
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <p className="font-medium">Accounting Ledger is available</p>
                <p className="text-sm mt-1">View income vs expenses, monthly charts, and CSV export</p>
                <Button className="mt-4" onClick={() => window.location.href = '/accounting'}>
                  Go to Accounting Ledger
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Expense Budgets</CardTitle>
              <CardDescription>Category budgets vs actual spend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <PieChart className="h-10 w-10 mx-auto mb-3 text-blue-500" />
                <p className="font-medium">Manage budgets in Expenses</p>
                <p className="text-sm mt-1">Set monthly budgets per expense category and track spend</p>
                <Button className="mt-4" onClick={() => window.location.href = '/expenses'}>
                  Go to Expenses
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Income statements and cash flow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 text-purple-500" />
                <p className="font-medium">Reports available in Accounting Ledger</p>
                <p className="text-sm mt-1">Monthly breakdown, balance sheet, and CSV export</p>
                <Button className="mt-4" onClick={() => window.location.href = '/accounting'}>
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? 'Update expense information'
                : 'Add a new expense record'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Office Supplies - March 2025"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expenseCategoryId">Category *</Label>
                  <Select
                    value={formData.expenseCategoryId}
                    onValueChange={(value) => setFormData({ ...formData, expenseCategoryId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.code} value={cat.code}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (PKR) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expenseDate">Date *</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="paymentMode">Payment Mode</Label>
                  <Input
                    id="paymentMode"
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    placeholder="Cash, Bank Transfer"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vendorName">Vendor Name</Label>
                  <Input
                    id="vendorName"
                    value={formData.vendorName}
                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    placeholder="Vendor name"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="billNumber">Bill Number</Label>
                <Input
                  id="billNumber"
                  value={formData.billNumber}
                  onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                  placeholder="BILL-2025-001"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about the expense"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-gradient-to-r from-green-600 to-emerald-600">
                <DollarSign className="mr-2 h-4 w-4" />
                {editingExpense ? 'Update' : 'Add'} Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
