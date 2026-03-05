'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Plus, Search, RefreshCw, Upload, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

export default function BulkFeeCollectionPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch]     = useState('');
  const [classFilter, setClass] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [paymentDate, setDate]  = useState(new Date().toISOString().slice(0,10));
  const [method, setMethod]     = useState('Cash');
  const [results, setResults]   = useState<{id:string;name:string;amount:number;status:string;error?:string}[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'active', limit: '500' });
      if (classFilter) params.set('classId', classFilter);
      const [sRes, cRes] = await Promise.all([
        fetch(`/api/students?${params}`),
        fetch('/api/classes'),
      ]);
      const [sData, cData] = await Promise.all([sRes.json(), cRes.json()]);
      if (sData.success) setStudents(sData.data || []);
      if (cData.success) setClasses(cData.data || []);
    } catch {} finally { setLoading(false); }
  }, [classFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !search || s.fullName?.toLowerCase().includes(q) || s.admissionNumber?.includes(q);
  });

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const process = async () => {
    if (selected.size === 0) { toast({ title: 'Select at least one student', variant: 'destructive' }); return; }
    setProcessing(true);
    setResults([]);
    const results: any[] = [];

    for (const id of Array.from(selected)) {
      const student = students.find(s => s.id === id);
      try {
        // Get pending fees for this student
        const feesRes = await fetch(`/api/fee-payments?studentId=${id}&status=Pending`);
        const feesData = await feesRes.json();
        const pendingFees = feesData.data || [];
        const totalPending = pendingFees.reduce((s: number, f: any) => s + (f.amount - (f.paidAmount || 0)), 0);

        if (totalPending <= 0) {
          results.push({ id, name: student?.fullName, amount: 0, status: 'skip', error: 'No pending fees' });
          setResults([...results]);
          continue;
        }

        const res = await fetch('/api/fees-collect', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: id, amount: totalPending, paymentDate, paymentMethod: method, remarks: 'Bulk collection' }),
        });
        const data = await res.json();
        if (data.success) {
          results.push({ id, name: student?.fullName, amount: totalPending, status: 'success' });
        } else {
          results.push({ id, name: student?.fullName, amount: totalPending, status: 'error', error: data.error });
        }
      } catch (e: any) {
        results.push({ id, name: student?.fullName, amount: 0, status: 'error', error: e.message });
      }
      setResults([...results]);
      await new Promise(r => setTimeout(r, 100));
    }

    setProcessing(false);
    const succeeded = results.filter(r => r.status === 'success').length;
    toast({ title: `✅ Processed ${succeeded}/${selected.size} payments successfully` });
  };

  const totalSelected = filtered.filter(s => selected.has(s.id)).length;
  const successCount  = results.filter(r => r.status === 'success').length;
  const errorCount    = results.filter(r => r.status === 'error').length;
  const totalCollected = results.filter(r => r.status === 'success').reduce((s, r) => s + r.amount, 0);

  const exportTemplate = () => {
    const rows = ['Admission Number,Student Name,Class,Amount,Payment Method,Date'].join(',');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows);
    a.download = 'fee-import-template.csv'; a.click();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Bulk Fee Collection"
        description="Collect fees from multiple students at once — batch processing"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportTemplate}><Download className="h-4 w-4 mr-2" />CSV Template</Button>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          </div>
        }
      />

      <Tabs defaultValue="select">
        <TabsList>
          <TabsTrigger value="select">Select Students</TabsTrigger>
          <TabsTrigger value="process">Process Payment</TabsTrigger>
          {results.length > 0 && <TabsTrigger value="results">Results ({results.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="select" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4 flex gap-3 flex-wrap items-center">
              <Select value={classFilter} onValueChange={v => setClass(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-44"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-52">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <span className="text-sm text-muted-foreground">{totalSelected} selected</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y">{[...Array(8)].map((_,i) => <div key={i} className="h-12 animate-pulse bg-muted/20 m-2 rounded" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-12">
                        <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded" />
                      </TableHead>
                      <TableHead>Student</TableHead><TableHead>Admission #</TableHead><TableHead>Class</TableHead><TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 100).map(s => (
                      <TableRow key={s.id} className={`hover:bg-muted/20 transition-colors cursor-pointer ${selected.has(s.id) ? 'bg-blue-50/50' : ''}`} onClick={() => toggle(s.id)}>
                        <TableCell><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} onClick={e => e.stopPropagation()} className="rounded" /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">{s.fullName?.[0]}</div>
                            <span className="font-medium text-sm">{s.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">{s.admissionNumber}</TableCell>
                        <TableCell className="text-sm">{s.class?.name}</TableCell>
                        <TableCell>
                          {results.find(r => r.id === s.id) ? (
                            <Badge className={`text-xs ${results.find(r => r.id === s.id)?.status === 'success' ? 'bg-green-100 text-green-700' : results.find(r => r.id === s.id)?.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                              {results.find(r => r.id === s.id)?.status === 'success' ? '✓ Paid' : results.find(r => r.id === s.id)?.status === 'error' ? '✗ Error' : 'Skipped'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Active</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process" className="mt-4 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Payment Settings</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Payment Date</Label><Input type="date" value={paymentDate} onChange={e => setDate(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Cash','Online','Cheque','Bank Transfer','JazzCash','EasyPaisa'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="h-20 w-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalSelected}</p>
                <p className="text-muted-foreground">students selected for payment</p>
              </div>
              <p className="text-sm text-muted-foreground">This will collect all pending fees for each selected student using {method} payment on {paymentDate}</p>
              <Button size="lg" onClick={process} disabled={processing || totalSelected === 0} className="w-full max-w-sm">
                {processing ? (
                  <><div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />Processing {results.length}/{totalSelected}...</>
                ) : (
                  <><Upload className="h-5 w-5 mr-2" />Process {totalSelected} Payments</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {results.length > 0 && (
          <TabsContent value="results" className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Successful', value: successCount, icon: CheckCircle, cls: 'border-l-green-500 text-green-700' },
                { label: 'Failed', value: errorCount, icon: XCircle, cls: 'border-l-red-500 text-red-700' },
                { label: 'Total Collected', value: `PKR ${totalCollected.toLocaleString()}`, icon: DollarSign, cls: 'border-l-blue-500 text-blue-700', isText: true },
              ].map(({ label, value, icon: Icon, cls, isText }) => (
                <Card key={label} className={`border-l-4 ${cls.split(' ')[0]}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div><p className={`${isText ? 'text-base' : 'text-2xl'} font-bold`}>{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
                    <Icon className={`h-6 w-6 ${cls.split(' ')[1]}/40`} />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow className="bg-muted/40"><TableHead>Student</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={i} className={r.status === 'success' ? 'bg-green-50/30' : r.status === 'error' ? 'bg-red-50/30' : ''}>
                        <TableCell className="font-medium text-sm">{r.name}</TableCell>
                        <TableCell>PKR {r.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {r.status === 'success' ? <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge> :
                           r.status === 'error'   ? <Badge className="bg-red-100 text-red-700 text-xs"><XCircle className="h-3 w-3 mr-1" />Failed</Badge> :
                                                    <Badge variant="outline" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />Skipped</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.error || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
