'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, RefreshCw, Edit, Trash2, UtensilsCrossed, TrendingUp, ShoppingCart, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const CATEGORIES = ['Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Bakery', 'Sweets', 'Fast Food', 'Seasonal'];
const ALLERGENS = ['Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Seafood', 'None'];
const fmt = (n: number) => `PKR ${Math.round(n).toLocaleString()}`;
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit', month: 'short' }) : '';

export default function CanteenPage() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [days, setDays] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [menuDialog, setMenuDialog] = useState(false);
  const [saleDialog, setSaleDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const emptyMenu = () => ({ name: '', category: 'Lunch', price: '', calories: '', allergens: 'None', description: '', isAvailable: true });
  const emptySale = () => ({ menuItemId: '', itemName: '', quantity: '1', unitPrice: '', saleDate: selectedDate, paymentMode: 'Cash', notes: '' });
  const [menuForm, setMenuForm] = useState<any>(emptyMenu());
  const [saleForm, setSaleForm] = useState<any>(emptySale());

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/canteen?view=menu');
      const data = await res.json();
      setMenuItems(data.items || []);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, []);

  const loadSales = useCallback(async () => {
    setSalesLoading(true);
    try {
      const res = await fetch(`/api/canteen?view=sales&date=${selectedDate}`);
      const data = await res.json();
      setSales(data.sales || []); setTotalRevenue(data.totalRevenue || 0);
      setTotalItems(data.totalItems || 0); setDays(data.days || []);
      if (data.menuItems?.length) setMenuItems(data.menuItems);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSalesLoading(false); }
  }, [selectedDate]);

  useEffect(() => { loadMenu(); }, [loadMenu]);
  useEffect(() => { loadSales(); }, [loadSales]);

  const handleMenuSelect = (id: string) => {
    const item = menuItems.find(x => x.id === id);
    setSaleForm((f: any) => ({ ...f, menuItemId: id, itemName: item?.name || '', unitPrice: item?.price || '' }));
  };

  const saveMenu = async () => {
    if (!menuForm.name || !menuForm.price) { toast({ title: 'Name and price required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/canteen', { method: editingMenu ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingMenu ? { ...menuForm, entity: 'menu', id: editingMenu.id } : { ...menuForm, entity: 'menu' }) });
      toast({ title: editingMenu ? 'Updated' : 'Item added to menu' }); setMenuDialog(false); loadMenu();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveSale = async () => {
    if (!saleForm.itemName || !saleForm.unitPrice) { toast({ title: 'Item and price required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await fetch('/api/canteen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(saleForm) });
      toast({ title: 'Sale recorded' }); setSaleDialog(false); loadSales();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const toggleAvail = async (item: any) => {
    await fetch('/api/canteen', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, entity: 'menu', isAvailable: !item.isAvailable }) });
    loadMenu();
  };

  const del = async (id: string, entity: string) => {
    if (!confirm('Delete?')) return;
    await fetch('/api/canteen', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, entity }) });
    entity === 'menu' ? loadMenu() : loadSales();
    toast({ title: 'Deleted' });
  };

  const groupedMenu = CATEGORIES.reduce((acc: any, cat) => {
    const items = menuItems.filter(i => i.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  const maxRevenue = Math.max(...days.map(d => d.revenue), 1);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Canteen Management" description="Manage canteen menu, daily sales, revenue tracking and allergen information"
        actions={<div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingMenu(null); setMenuForm(emptyMenu()); setMenuDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Menu Item</Button>
          <Button size="sm" onClick={() => { setSaleForm(emptySale()); setSaleDialog(true); }}><ShoppingCart className="h-4 w-4 mr-2" />Record Sale</Button>
        </div>}
      />

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">📊 Sales & Revenue</TabsTrigger>
          <TabsTrigger value="menu">🍽️ Menu</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4 space-y-4">
          {/* 7-day chart */}
          <Card>
            <CardHeader className="py-3 px-4"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Last 7 Days Revenue</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-end gap-2 h-28">
                {days.map(d => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground font-medium">{d.revenue > 0 ? fmt(d.revenue).replace('PKR ', '') : ''}</span>
                    <div className="w-full rounded-t" style={{ height: `${(d.revenue / maxRevenue) * 80}px`, minHeight: d.revenue > 0 ? '4px' : '2px', background: d.date === selectedDate ? '#3b82f6' : '#93c5fd' }} />
                    <span className="text-xs text-muted-foreground">{fmtDate(d.date).slice(0, 6)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-40" />
            <Button variant="outline" size="icon" onClick={loadSales}><RefreshCw className="h-4 w-4 transition-transform hover:rotate-180 duration-500" /></Button>
            <div className="ml-auto flex gap-4 text-sm">
              <div><span className="text-muted-foreground">Revenue: </span><strong className="text-green-700">{fmt(totalRevenue)}</strong></div>
              <div><span className="text-muted-foreground">Items Sold: </span><strong>{totalItems}</strong></div>
            </div>
          </div>

          {salesLoading ? <div className="flex justify-center h-32 items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> :
            sales.length === 0 ? (
              <Card className="border-dashed"><CardContent className="text-center py-10 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No sales recorded for {fmtDate(selectedDate)}</p>
                <Button size="sm" className="mt-2" onClick={() => { setSaleForm({ ...emptySale(), saleDate: selectedDate }); setSaleDialog(true); }}><Plus className="h-4 w-4 mr-1" />Record Sale</Button>
              </CardContent></Card>
            ) : (
              <Card><CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/20"><th className="p-3 text-left">Item</th><th className="p-3 text-center">Qty</th><th className="p-3 text-right">Unit Price</th><th className="p-3 text-right">Total</th><th className="p-3 text-center">Payment</th><th className="p-3 text-right">Actions</th></tr></thead>
                  <tbody>
                    {sales.map(s => (
                      <tr key={s.id} className="border-b hover:bg-muted/10">
                        <td className="p-3 font-medium">{s.itemName}</td>
                        <td className="p-3 text-center">{s.quantity}</td>
                        <td className="p-3 text-right text-muted-foreground">{fmt(Number(s.unitPrice))}</td>
                        <td className="p-3 text-right font-semibold">{fmt(Number(s.totalAmount))}</td>
                        <td className="p-3 text-center"><Badge variant="outline" className="text-xs">{s.paymentMode}</Badge></td>
                        <td className="p-3 text-right"><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del(s.id, 'sale')}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20 font-semibold">
                      <td className="p-3">Total</td><td className="p-3 text-center">{totalItems}</td><td /><td className="p-3 text-right text-green-700">{fmt(totalRevenue)}</td><td /><td />
                    </tr>
                  </tbody>
                </table>
              </CardContent></Card>
            )
          }
        </TabsContent>

        <TabsContent value="menu" className="mt-4 space-y-6">
          {loading ? <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /><p className="text-sm">Loading...</p></div> :
            menuItems.length === 0 ? (
              <Card className="border-dashed"><CardContent className="text-center py-16 text-muted-foreground">
                <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No menu items yet</p>
                <Button size="sm" className="mt-3" onClick={() => { setEditingMenu(null); setMenuForm(emptyMenu()); setMenuDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add First Item</Button>
              </CardContent></Card>
            ) : (
              Object.entries(groupedMenu).map(([cat, catItems]: [string, any]) => (
                <div key={cat}>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">{cat}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catItems.map((item: any) => (
                      <Card key={item.id} className={`${!item.isAvailable ? 'opacity-50' : ''} hover:shadow-sm`}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{item.name}</span>
                                {!item.isAvailable && <Badge className="text-xs bg-slate-100 text-slate-500">Unavailable</Badge>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-primary font-bold">{fmt(Number(item.price))}</span>
                                {item.calories && <span className="text-xs text-muted-foreground">{item.calories} cal</span>}
                              </div>
                              {item.allergens && item.allergens !== 'None' && (
                                <Badge className="text-xs bg-red-50 text-red-700 mt-1">⚠️ {item.allergens}</Badge>
                              )}
                              {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>}
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingMenu(item); setMenuForm({ ...item }); setMenuDialog(true); }}><Edit className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => del(item.id, 'menu')}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="w-full h-6 mt-2 text-xs" onClick={() => toggleAvail(item)}>
                            {item.isAvailable ? '✓ Available — click to disable' : '✗ Unavailable — click to enable'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )
          }
        </TabsContent>
      </Tabs>

      {/* Menu Dialog */}
      <Dialog open={menuDialog} onOpenChange={setMenuDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingMenu ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Item Name *</Label><Input value={menuForm.name} onChange={e => setMenuForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Category</Label><Select value={menuForm.category} onValueChange={v => setMenuForm((f: any) => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Price (PKR) *</Label><Input type="number" value={menuForm.price} onChange={e => setMenuForm((f: any) => ({ ...f, price: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Calories</Label><Input type="number" value={menuForm.calories} onChange={e => setMenuForm((f: any) => ({ ...f, calories: e.target.value }))} placeholder="kcal" /></div>
            <div className="space-y-1.5"><Label>Allergens</Label><Select value={menuForm.allergens} onValueChange={v => setMenuForm((f: any) => ({ ...f, allergens: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ALLERGENS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Input value={menuForm.description} onChange={e => setMenuForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMenuDialog(false)}>Cancel</Button><Button onClick={saveMenu} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingMenu ? 'Update' : 'Add Item'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sale Dialog */}
      <Dialog open={saleDialog} onOpenChange={setSaleDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Sale</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>Menu Item</Label>
              <Select value={saleForm.menuItemId} onValueChange={handleMenuSelect}><SelectTrigger><SelectValue placeholder="Select from menu" /></SelectTrigger><SelectContent>{menuItems.filter(i => i.isAvailable).map(i => <SelectItem key={i.id} value={i.id}>{i.name} — {fmt(Number(i.price))}</SelectItem>)}</SelectContent></Select>
              {!saleForm.menuItemId && <Input className="mt-1" value={saleForm.itemName} onChange={e => setSaleForm((f: any) => ({ ...f, itemName: e.target.value }))} placeholder="Or type item name" />}
            </div>
            <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" min="1" value={saleForm.quantity} onChange={e => setSaleForm((f: any) => ({ ...f, quantity: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Unit Price (PKR)</Label><Input type="number" value={saleForm.unitPrice} onChange={e => setSaleForm((f: any) => ({ ...f, unitPrice: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={saleForm.saleDate} onChange={e => setSaleForm((f: any) => ({ ...f, saleDate: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Payment Mode</Label><Select value={saleForm.paymentMode} onValueChange={v => setSaleForm((f: any) => ({ ...f, paymentMode: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Card">Card</SelectItem><SelectItem value="App">App</SelectItem></SelectContent></Select></div>
            {saleForm.quantity && saleForm.unitPrice && <div className="col-span-2 bg-green-50 border border-green-200 rounded p-2 text-sm font-medium text-green-800">Total: {fmt(Number(saleForm.quantity) * Number(saleForm.unitPrice))}</div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSaleDialog(false)}>Cancel</Button><Button onClick={saveSale} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Record Sale</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
