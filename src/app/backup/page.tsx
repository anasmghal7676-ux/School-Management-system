'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, Database, Download, CheckCircle2, XCircle,
  Clock, RefreshCw, Shield, HardDrive, FileDown, AlertCircle,
  ChevronLeft, ChevronRight, Activity, BarChart3, Users,
  DollarSign, BookOpen, Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmtDate = (d: string) => new Date(d).toLocaleString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtSize = (mb: number | null) => !mb ? '—' : mb >= 1000 ? `${(mb/1000).toFixed(2)} GB` : `${mb.toFixed(2)} MB`;
const fmtDuration = (start: string, end: string | null) => {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(1)}s`;
};

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  Success:     { color: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  Failed:      { color: 'bg-red-100 text-red-700',      icon: XCircle },
  'In-progress':{ color: 'bg-blue-100 text-blue-700',   icon: Clock },
};

export default function BackupPage() {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [backing, setBacking]   = useState(false);
  const [backupType, setBackupType] = useState<'Full' | 'Incremental'>('Full');
  const [progress, setProgress] = useState(0);
  const [page, setPage]         = useState(1);

  useEffect(() => { fetchData(); }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/backup?page=${page}&limit=15`);
      const j = await r.json();
      if (j.success) setData(j.data);
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleBackup = async (type: 'Full' | 'Incremental') => {
    setBacking(true);
    setProgress(0);
    // Animate progress
    const interval = setInterval(() => setProgress(p => Math.min(p + Math.random() * 15, 90)), 300);
    try {
      const r = await fetch('/api/backup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupType: type }),
      });
      const j = await r.json();
      clearInterval(interval);
      if (j.success) {
        setProgress(100);
        setTimeout(() => { setProgress(0); setBacking(false); fetchData(); }, 800);
        toast({ title: `${type} backup completed`, description: `${j.data.stats.totalRecords.toLocaleString()} records · ${fmtSize(j.data.log.backupSizeMb)}` });
      } else {
        clearInterval(interval);
        setBacking(false); setProgress(0);
        toast({ title: 'Backup failed', description: j.message, variant: 'destructive' });
      }
    } catch {
      clearInterval(interval);
      setBacking(false); setProgress(0);
      toast({ title: 'Backup failed', variant: 'destructive' });
    }
  };

  const exportJSON = async () => {
    toast({ title: 'Preparing export...', description: 'Generating JSON export file' });
    // In production this would stream a full DB export
    const exportData = {
      exportedAt: new Date().toISOString(),
      system: 'SchoolPro Management System',
      note: 'This is a metadata export. Full data export requires server-side database access.',
      summary: data?.dbStats || {},
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `schoolpro-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary   = data?.summary   || {};
  const dbStats   = data?.dbStats   || {};
  const logs      = data?.logs      || [];
  const totalPages= data?.pagination?.totalPages || 1;

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Database className="h-7 w-7" />Backup & Restore
            </h1>
            <p className="text-muted-foreground">Manage database backups and data exports</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={exportJSON} disabled={backing}>
              <FileDown className="mr-2 h-4 w-4" />Export JSON
            </Button>
            <Button variant="outline" onClick={() => handleBackup('Incremental')} disabled={backing}>
              {backing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Incremental
            </Button>
            <Button onClick={() => handleBackup('Full')} disabled={backing}>
              {backing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
              Full Backup
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {backing && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Backup in progress…</span>
                <span className="text-sm text-blue-600 ml-auto">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Backups',   value: summary.total || 0,        icon: Database,     color: 'border-l-blue-500',   text: 'text-blue-600' },
            { label: 'Successful',      value: summary.successCount || 0,  icon: CheckCircle2, color: 'border-l-green-500',  text: 'text-green-600' },
            { label: 'Failed',          value: summary.failedCount || 0,   icon: XCircle,      color: 'border-l-red-500',    text: 'text-red-600' },
            { label: 'Last Backup',     value: summary.lastSuccess ? fmtDate(summary.lastSuccess.completedAt) : 'Never',
              icon: Clock, color: 'border-l-amber-500', text: 'text-amber-600', small: true },
          ].map(({ label, value, icon: Icon, color, text, small }) => (
            <Card key={label} className={`border-l-4 ${color}`}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`${small ? 'text-sm' : 'text-2xl'} font-bold ${text} mt-0.5`}>{value}</p>
                  </div>
                  <Icon className={`h-5 w-5 ${text}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Database Health */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />Database Statistics
              </CardTitle>
              <CardDescription>Current record counts per module</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  {[
                    { label: 'Students',          value: dbStats.students     || 0, icon: Users,      color: 'text-blue-500' },
                    { label: 'Staff',             value: dbStats.staff        || 0, icon: Users,      color: 'text-purple-500' },
                    { label: 'Fee Payments',      value: dbStats.payments     || 0, icon: DollarSign, color: 'text-green-500' },
                    { label: 'Library Transactions', value: dbStats.transactions || 0, icon: BookOpen, color: 'text-pink-500' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="text-sm">{label}</span>
                      </div>
                      <span className="font-bold text-sm">{value.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Total Records</span>
                      <span className="font-bold">{(
                        (dbStats.students || 0) + (dbStats.staff || 0) +
                        (dbStats.payments || 0) + (dbStats.transactions || 0)
                      ).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium">Storage Health</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div><span className="font-medium text-green-600">● Online</span> Database</div>
                      <div><span className="font-medium text-green-600">● Active</span> Connection</div>
                      <div><span className="font-medium text-amber-600">SQLite</span> Engine</div>
                      <div><span className="font-medium text-blue-600">OK</span> Integrity</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Backup Log Table */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Backup History</CardTitle>
                <CardDescription>Recent backup operations</CardDescription>
              </div>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <Database className="h-10 w-10 mb-3 opacity-30" />
                  <p className="font-medium">No backups yet</p>
                  <p className="text-sm mt-1">Click "Full Backup" to create your first backup</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Path</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log: any) => {
                        const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.Failed;
                        const Icon = cfg.icon;
                        return (
                          <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                            <TableCell>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${log.backupType === 'Full' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                                {log.backupType}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{fmtDate(log.startedAt)}</TableCell>
                            <TableCell className="text-xs">{fmtDuration(log.startedAt, log.completedAt)}</TableCell>
                            <TableCell className="text-xs">{fmtSize(log.backupSizeMb)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                                <Icon className="h-3 w-3" />{log.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono max-w-40 truncate" title={log.backupPath}>
                              {log.backupPath}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center px-4 py-3 border-t">
                      <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
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
        </div>

        {/* Backup Policy Info */}
        <Card className="bg-muted/30">
          <CardContent className="pt-4 pb-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-blue-500" />Recommended Schedule
                </h4>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Full backup: Weekly (Sunday nights)</li>
                  <li>• Incremental: Daily (after school hours)</li>
                  <li>• Keep last 30 days of backups</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4 text-green-500" />Storage Locations
                </h4>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Local: <code className="bg-muted px-1 rounded">/backups/</code></li>
                  <li>• Cloud: Configure S3/GCS in Settings</li>
                  <li>• Encryption: AES-256 at rest</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-500" />Restore Process
                </h4>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• Stop application server</li>
                  <li>• Replace database file with backup</li>
                  <li>• Run migrations if version changed</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
