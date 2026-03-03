'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Loader2, Shield, Search, ChevronLeft, ChevronRight,
  RefreshCw, Eye, User, Database, Clock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

interface AuditLog {
  id: string; action: string; tableName: string; recordId: string | null;
  oldValues: string | null; newValues: string | null; ipAddress: string | null;
  timestamp: string; user: { name: string; email: string; role: string };
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN:  'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionCounts, setActionCounts] = useState<{ action: string; count: number }[]>([]);
  const [tableCounts, setTableCounts] = useState<{ table: string; count: number }[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [searchIn, setSearchIn] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => { const t = setTimeout(() => setSearch(searchIn), 400); return () => clearTimeout(t); }, [searchIn]);
  useEffect(() => { fetchLogs(); }, [page, actionFilter, tableFilter, search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: '50' });
      if (actionFilter !== 'all') p.append('action', actionFilter);
      if (tableFilter !== 'all')  p.append('tableName', tableFilter);
      if (search)    p.append('search', search);
      if (fromDate)  p.append('fromDate', fromDate);
      if (toDate)    p.append('toDate', toDate);

      const r = await fetch(`/api/audit-logs?${p}`);
      const j = await r.json();
      if (j.success) {
        setLogs(j.data.logs);
        setActionCounts(j.data.actionCounts);
        setTableCounts(j.data.tableCounts);
        setTotalPages(j.data.pagination.totalPages);
        setTotal(j.data.pagination.total);
      }
    } catch { toast({ title: 'Error', description: 'Failed to load audit logs', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [page, actionFilter, tableFilter, search, fromDate, toDate]);

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  };

  const fmtJSON = (str: string | null) => {
    if (!str) return null;
    try { return JSON.stringify(JSON.parse(str), null, 2); }
    catch { return str; }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-7 w-7" />Audit Logs
            </h1>
            <p className="text-muted-foreground">Complete activity trail — who did what and when</p>
          </div>
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-3 pb-3 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground">Total Events</p><p className="text-2xl font-bold">{total.toLocaleString()}</p></div>
              <Database className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          {actionCounts.slice(0, 3).map(ac => (
            <Card key={ac.action} className="border-l-4 border-l-gray-300">
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{ac.action} Events</p>
                  <p className="text-2xl font-bold">{ac.count.toLocaleString()}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${ACTION_COLORS[ac.action] || 'bg-gray-100 text-gray-700'}`}>
                  {ac.action}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search action, table, record ID..." value={searchIn} onChange={e => setSearchIn(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Action</Label>
                <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(1); }}>
                  <SelectTrigger className="mt-1 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {['CREATE','UPDATE','DELETE','LOGIN','LOGOUT'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Table</Label>
                <Select value={tableFilter} onValueChange={v => { setTableFilter(v); setPage(1); }}>
                  <SelectTrigger className="mt-1 w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {tableCounts.map(t => <SelectItem key={t.table} value={t.table}>{t.table} ({t.count})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">From</Label>
                <Input className="mt-1 w-36" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input className="mt-1 w-36" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" onClick={() => { setSearchIn(''); setActionFilter('all'); setTableFilter('all'); setFromDate(''); setToDate(''); setPage(1); }}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Log Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground">
                <Shield className="h-12 w-12 mb-4" />
                <p className="font-medium">No audit logs found</p>
                <p className="text-sm">Logs are recorded automatically as users interact with the system</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => (
                      <TableRow key={log.id} className="hover:bg-muted/40">
                        <TableCell className="text-sm whitespace-nowrap">
                          <div>{timeAgo(log.timestamp)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{log.user?.name || 'System'}</div>
                              <div className="text-xs text-muted-foreground">{log.user?.role}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Database className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-mono">{log.tableName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {log.recordId ? log.recordId.slice(0, 12) + '...' : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.ipAddress || '—'}</TableCell>
                        <TableCell className="text-right">
                          {(log.oldValues || log.newValues) && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedLog(log)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages} · {total.toLocaleString()} events</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACTION_COLORS[selectedLog?.action || ''] || 'bg-gray-100'}`}>
                {selectedLog?.action}
              </span>
              {selectedLog?.tableName}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">User:</span> <span className="font-medium">{selectedLog.user?.name}</span></div>
                <div><span className="text-muted-foreground">Time:</span> <span className="font-medium">{new Date(selectedLog.timestamp).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Record ID:</span> <span className="font-mono text-xs">{selectedLog.recordId || '—'}</span></div>
                <div><span className="text-muted-foreground">IP:</span> <span>{selectedLog.ipAddress || '—'}</span></div>
              </div>
              {selectedLog.oldValues && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Before</p>
                  <pre className="bg-red-50 dark:bg-red-950 rounded-lg p-3 text-xs overflow-x-auto text-red-900 dark:text-red-200">
                    {fmtJSON(selectedLog.oldValues)}
                  </pre>
                </div>
              )}
              {selectedLog.newValues && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">After</p>
                  <pre className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-xs overflow-x-auto text-green-900 dark:text-green-200">
                    {fmtJSON(selectedLog.newValues)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
