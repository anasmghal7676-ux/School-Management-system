'use client';

import { useState, useEffect } from 'react';
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
  Plus, Edit, Trash2, Search, Package, TrendingDown, 
  TrendingUp, AlertTriangle, PackagePlus, PackageMinus, ArrowUpDown, 
  Loader2, Box, Archive, ShoppingCart
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Item {
  id: string;
  itemName: string;
  itemCode: string;
  description: string | null;
  category: string;
  unit: string;
  quantityInStock: number;
  reorderLevel: number;
  unitPrice: number | null;
  location: string | null;
  status: string;
  categoryName: string;
  totalTransactions: number;
}

interface Transaction {
  id: string;
  itemName: string;
  itemCode: string;
  transactionType: string;
  quantity: number;
  transactionDate: string;
  issuedToType: string | null;
  issuedToId: string | null;
  performedBy: string | null;
}

const UNITS = [
  'Piece',
  'Box',
  'Kg',
  'Liter',
  'Set',
  'Pack',
  'Ream',
  'Bundle',
  'Carton',
  'Dozen',
  'Meter',
];

const TRANSACTION_TYPES = [
  'Purchase',
  'Issue',
  'Return',
  'Damage',
  'Transfer',
];

// ─── Inventory Transactions Sub-Component ────────────────────────────────────
function InventoryTransactionsTab({ items }: { items: any[] }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemFilter, setItemFilter] = useState('all');
  const [form, setForm] = useState({ itemId: '', transactionType: 'Issue', quantity: '', issuedToType: 'Department', issuedToId: '', remarks: '', performedBy: '' });

  useEffect(() => { fetchTx(); }, [itemFilter]);

  const fetchTx = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '50' });
      if (itemFilter !== 'all') p.append('itemId', itemFilter);
      const r = await fetch(`/api/inventory/transactions?${p}`);
      const j = await r.json();
      if (j.success) setTransactions(j.data.transactions);
    } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.itemId || !form.quantity) { toast({ title: 'Item and quantity required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/inventory/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (j.success) { toast({ title: `${form.transactionType} recorded` }); setAddOpen(false); setForm(f => ({ ...f, itemId: '', quantity: '', issuedToId: '', remarks: '' })); fetchTx(); }
      else toast({ title: 'Error', description: j.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const TX_COLORS: Record<string, string> = { Purchase: 'bg-green-100 text-green-800', Issue: 'bg-blue-100 text-blue-800', Return: 'bg-amber-100 text-amber-800', Damage: 'bg-red-100 text-red-800' };
  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div><CardTitle>Inventory Transactions</CardTitle><CardDescription>Issue, purchase, return and damage records</CardDescription></div>
        <div className="flex gap-2">
          <Select value={itemFilter} onValueChange={setItemFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Items" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              {items.map(i => <SelectItem key={i.id} value={i.id}>{i.itemName}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Record</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <div className="flex justify-center py-12 text-muted-foreground">Loading...</div>
          : transactions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <ArrowUpDown className="h-10 w-10 mb-3" /><p>No transactions recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead>Qty</TableHead><TableHead>Issued To</TableHead><TableHead>By</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
              <TableBody>
                {transactions.map((tx: any) => (
                  <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="text-sm whitespace-nowrap">{new Date(tx.transactionDate).toLocaleDateString()}</TableCell>
                    <TableCell><div className="font-medium text-sm">{tx.item?.itemName}</div><div className="text-xs text-muted-foreground">{tx.item?.category?.name}</div></TableCell>
                    <TableCell><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TX_COLORS[tx.transactionType] || 'bg-gray-100 text-gray-700'}`}>{tx.transactionType}</span></TableCell>
                    <TableCell className="font-mono font-semibold">{tx.quantity} {tx.item?.unit}</TableCell>
                    <TableCell className="text-sm">{tx.issuedToType ? `${tx.issuedToType}: ${tx.issuedToId || '—'}` : '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.performedBy || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.remarks || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Item *</Label><Select value={form.itemId} onValueChange={v => sf('itemId', v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select item" /></SelectTrigger><SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.itemName} (Stock: {i.currentStock})</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type *</Label><Select value={form.transactionType} onValueChange={v => sf('transactionType', v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{['Purchase','Issue','Return','Damage','Transfer'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Quantity *</Label><Input className="mt-1" type="number" value={form.quantity} onChange={e => sf('quantity', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Issued To</Label><Select value={form.issuedToType} onValueChange={v => sf('issuedToType', v)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{['Department','Staff','Student','Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Recipient</Label><Input className="mt-1" value={form.issuedToId} onChange={e => sf('issuedToId', e.target.value)} placeholder="Name or ID" /></div>
            </div>
            <div><Label>Performed By</Label><Input className="mt-1" value={form.performedBy} onChange={e => sf('performedBy', e.target.value)} /></div>
            <div><Label>Remarks</Label><Input className="mt-1" value={form.remarks} onChange={e => sf('remarks', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function StockReportTab({ items }: { items: any[] }) {
  const lowStock = items.filter(i => i.currentStock <= (i.reorderLevel || 5));
  const totalValue = items.reduce((s, i) => s + (i.currentStock * (i.unitPrice || 0)), 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-center"><p className="text-2xl font-bold">{items.length}</p><p className="text-sm text-muted-foreground">Total Items</p></div>
        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-red-600">{lowStock.length}</p><p className="text-sm text-muted-foreground">Low Stock</p></div>
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center"><p className="text-2xl font-bold text-green-600">PKR {totalValue.toLocaleString()}</p><p className="text-sm text-muted-foreground">Stock Value</p></div>
      </div>
      {lowStock.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-red-600">⚠️ Low Stock Items</h4>
          <Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Current Stock</TableHead><TableHead>Reorder Level</TableHead></TableRow></TableHeader>
            <TableBody>
              {lowStock.map((i: any) => (
                <TableRow key={i.id} className="bg-red-50/50 dark:bg-red-950/20">
                  <TableCell className="font-medium text-sm">{i.itemName}</TableCell>
                  <TableCell className="text-sm">{i.category?.name || '—'}</TableCell>
                  <TableCell className="text-red-600 font-bold">{i.currentStock} {i.unit}</TableCell>
                  <TableCell className="text-sm">{i.reorderLevel || 5} {i.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState('items');
  const [formData, setFormData] = useState({
    itemName: '',
    itemCode: '',
    category: '',
    description: '',
    unit: 'Piece',
    quantityInStock: 0,
    reorderLevel: 10,
    unitPrice: '',
    location: '',
  });

  useEffect(() => {
    fetchItems();
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/inventory/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/inventory/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const fetchCategories = async () => {
    // Categories are fetched with items
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingItem ? `/api/inventory/items/${editingItem.id}` : '/api/inventory/items';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Item ${editingItem ? 'updated' : 'added'} successfully`,
        });
        setDialogOpen(false);
        resetForm();
        fetchItems();
      } else {
        throw new Error('Failed to save item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save item',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName,
      itemCode: item.itemCode,
      category: item.category,
      description: item.description || '',
      unit: item.unit,
      quantityInStock: item.quantityInStock,
      reorderLevel: item.reorderLevel,
      unitPrice: item.unitPrice?.toString() || '',
      location: item.location || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/inventory/items/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Item deleted successfully',
        });
        fetchItems();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      itemName: '',
      itemCode: '',
      category: '',
      description: '',
      unit: 'Piece',
      quantityInStock: 0,
      reorderLevel: 10,
      unitPrice: '',
      location: '',
    });
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValue = items.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantityInStock, 0);
  const lowStockItems = items.filter((item) => item.quantityInStock <= item.reorderLevel).length;
  const totalStock = items.reduce((sum, item) => sum + item.quantityInStock, 0);

  const categories = Array.from(new Set(items.map((item) => item.category)));

  return (
    <div className="flex-1 space-y-6 p-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Inventory Management
          </h2>
          <p className="text-muted-foreground">
            Manage school inventory, stock, and assets
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </motion.div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600">
            <Package className="h-4 w-4 mr-2" />
            Items
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600">
            <Box className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-6 md:grid-cols-4"
          >
            {[
              { title: 'Total Items', value: items.length, icon: Package, color: 'orange' },
              { title: 'Total Stock', value: totalStock, icon: Archive, color: 'amber' },
              { title: 'Low Stock', value: lowStockItems, icon: AlertTriangle, color: 'red' },
              { title: 'Total Value', value: `PKR ${totalValue.toLocaleString()}`, icon: TrendingUp, color: 'yellow' },
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

          {/* Items Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>Manage school inventory and stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
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
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PackagePlus-stock">PackagePlus-stock</SelectItem>
                      <SelectItem value="Low-stock">Low-stock</SelectItem>
                      <SelectItem value="PackageMinus-of-stock">PackageMinus-of-stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600 mr-2" />
                    <span className="text-muted-foreground">Loading inventory...</span>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items found</p>
                  </div>
                ) : (
                  <div className="rounded-md border max-h-[600px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>PackagePlus Stock</TableHead>
                          <TableHead>Reorder Level</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredItems.map((item, index) => (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.03 }}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-orange-600" />
                                  <div>
                                    <div>{item.itemName}</div>
                                    {item.description && (
                                      <div className="text-xs text-muted-foreground">{item.description}</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">{item.itemCode}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{item.categoryName}</Badge>
                              </TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell>
                                <div className={item.quantityInStock <= item.reorderLevel ? 'text-red-600 font-bold' : ''}>
                                  {item.quantityInStock}
                                </div>
                              </TableCell>
                              <TableCell>{item.reorderLevel}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.status === 'PackageMinus-of-stock'
                                      ? 'destructive'
                                      : item.status === 'Low-stock'
                                      ? 'secondary'
                                      : 'default'
                                  }
                                >
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(item.id)}
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

        <TabsContent value="transactions">
          <InventoryTransactionsTab items={items} />
        </TabsContent>

        <TabsContent value="reports">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Stock Summary</CardTitle>
              <CardDescription>Items below reorder level and stock valuation</CardDescription>
            </CardHeader>
            <CardContent>
              <StockReportTab items={items} />
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
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update item information' : 'Add a new inventory item'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="itemCode">Item Code *</Label>
                  <Input
                    id="itemCode"
                    value={formData.itemCode}
                    onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                    placeholder="e.g., ITEM-001"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Stationery"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Item description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantityInStock">Quantity *</Label>
                  <Input
                    id="quantityInStock"
                    type="number"
                    min="0"
                    value={formData.quantityInStock}
                    onChange={(e) => setFormData({ ...formData, quantityInStock: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reorderLevel">Reorder Level</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unitPrice">Unit Price (PKR)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Store Room A"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-gradient-to-r from-orange-600 to-amber-600">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
