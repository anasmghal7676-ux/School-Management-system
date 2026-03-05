'use client';

export const dynamic = "force-dynamic"
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Database, Users, CheckCircle2, AlertCircle, Activity, Shield, Clock, Server, Cpu, HardDrive } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const fmtDate = (d: string) => d ? new Date(d).toLocaleString('en-PK') : '—';
const fmtRelative = (d: string) => {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const TABLE_ICONS: Record<string, string> = {
  Students: '🎓', Staff: '👥', Users: '🔐', Classes: '🏫',
  'Fee Payments': '💰', Attendance: '📅', Marks: '📝', 'Audit Logs': '📋',
};

export default function SystemHealthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sys-health');
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData(d);
    } catch (e: any) {
      toast({ title: 'Error loading health data', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, load]);

  if (!data && loading) {
    return (
      <div className="p-6">
        <PageHeader title="System Health Monitor" description="Database statistics, activity logs, and system status" />
        <div className="flex items-center justify-center h-64"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>
      </div>
    );
  }

  const { dbStats, tableHealth, recentAudit, loginActivity, lastBackup, timestamp } = data || {};

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="System Health Monitor"
        description="Database statistics, activity logs, and system status"
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer card-hover">
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="w-3.5 h-3.5" />
              Auto-refresh (30s)
            </label>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        }
      />

      {/* Status Banner */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">System Operational</p>
              <p className="text-xs text-green-600">All services running · Database connected</p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>Last checked: {fmtRelative(timestamp)}</div>
            <div>Last backup: {lastBackup ? fmtRelative(lastBackup) : 'Never'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Core Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Students', value: dbStats?.activeStudents || 0, total: dbStats?.students || 0, icon: '🎓', color: 'border-l-blue-500' },
          { label: 'Active Staff', value: dbStats?.activeStaff || 0, total: dbStats?.staff || 0, icon: '👥', color: 'border-l-green-500' },
          { label: 'System Users', value: dbStats?.users || 0, total: dbStats?.users || 0, icon: '🔐', color: 'border-l-purple-500' },
          { label: 'Today Logins', value: loginActivity?.today || 0, total: loginActivity?.failed || 0, icon: '🔑', color: 'border-l-amber-500', subtitle: `${loginActivity?.failed || 0} failed` },
        ].map(c => (
          <Card key={c.label} className={`border-l-4 ${c.color}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-2xl font-bold">{c.value}</span>
              </div>
              <p className="text-xs font-medium mt-1">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.subtitle || `of ${c.total} total`}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Database Table Health */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />Database Table Health
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y">
            {(tableHealth || []).map((t: any) => (
              <div key={t.table} className="p-4 hover:bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{TABLE_ICONS[t.table]} {t.table}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                </div>
                <p className="text-xl font-bold">{t.count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">total records</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />This Month Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {[
              { label: 'Fee Payments Recorded', value: dbStats?.monthlyFees || 0, icon: '💰' },
              { label: 'Attendance Entries', value: dbStats?.monthlyAttendance || 0, icon: '📅' },
              { label: 'Today Successful Logins', value: loginActivity?.today || 0, icon: '✅' },
              { label: 'Failed Login Attempts', value: loginActivity?.failed || 0, icon: '⚠️', alert: (loginActivity?.failed || 0) > 5 },
            ].map(item => (
              <div key={item.label} className={`flex items-center justify-between p-2.5 rounded-lg ${item.alert ? 'bg-red-50 border border-red-200' : 'bg-muted/20'}`}>
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                  {item.alert && <Badge className="text-xs bg-red-100 text-red-700">Alert</Badge>}
                </div>
                <span className={`font-bold ${item.alert ? 'text-red-700' : ''}`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Login Activity */}
        <Card>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Recent Login Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!loginActivity?.recent?.length ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No login activity today</div>
            ) : (
              <div className="divide-y max-h-48 overflow-y-auto">
                {loginActivity.recent.map((l: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {l.success ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                      <span className="text-xs font-medium">{l.username}</span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{l.ipAddress}</div>
                      <div>{fmtRelative(l.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Log */}
      <Card>
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />Recent System Activity (Audit Log)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!recentAudit?.length ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No audit records found</div>
          ) : (
            <div className="divide-y max-h-64 overflow-y-auto">
              {recentAudit.map((log: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-xs shrink-0 ${log.action === 'DELETE' ? 'border-red-300 text-red-700' : log.action === 'CREATE' ? 'border-green-300 text-green-700' : 'border-blue-300 text-blue-700'}`}>{log.action}</Badge>
                    <div>
                      <span className="text-sm font-medium">{log.entity}</span>
                      {log.details && <span className="text-xs text-muted-foreground ml-2 truncate max-w-[300px] inline-block">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details).slice(0, 80)}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{fmtRelative(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
