'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Search, Phone, Mail, MapPin, Briefcase,
  RefreshCw, Download, Grid3X3, List, Building2, User
} from 'lucide-react';
import PageHeader from '@/components/page-header';

export default function StaffDirectoryPage() {
  const [staff, setStaff]       = useState<any[]>([]);
  const [depts, setDepts]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [deptFilter, setDept]   = useState('');
  const [typeFilter, setType]   = useState('');
  const [view, setView]         = useState<'grid'|'list'>('grid');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        fetch('/api/staff?limit=500&status=active'),
        fetch('/api/departments'),
      ]);
      const [sData, dData] = await Promise.all([sRes.json(), dRes.json()]);
      if (sData.success) setStaff(sData.data?.staff || sData.data || []);
      if (dData.success) setDepts(dData.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = staff.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search || s.fullName?.toLowerCase().includes(q) || s.phone?.includes(q) || s.email?.toLowerCase().includes(q) || s.designation?.toLowerCase().includes(q);
    const matchDept = !deptFilter || s.departmentId === deptFilter;
    const matchType = !typeFilter || s.staffType === typeFilter;
    return matchSearch && matchDept && matchType;
  });

  const byDept = depts.map(d => ({
    ...d,
    members: filtered.filter(s => s.departmentId === d.id),
  })).filter(d => d.members.length > 0);

  const COLORS = ['bg-blue-100 text-blue-700','bg-green-100 text-green-700','bg-purple-100 text-purple-700','bg-amber-100 text-amber-700','bg-pink-100 text-pink-700','bg-teal-100 text-teal-700'];

  const exportCSV = () => {
    const rows = [['Name','Designation','Type','Phone','Email','Department'].join(','),
      ...filtered.map(s => [s.fullName,s.designation,s.staffType,s.phone,s.email,s.department?.name].join(','))];
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    a.download = 'staff-directory.csv'; a.click();
  };

  const StaffCard = ({ s }: { s: any }) => (
    <Card className="card-hover cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-5">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {s.fullName?.[0] || '?'}
          </div>
          <div>
            <p className="font-semibold text-sm">{s.fullName}</p>
            <p className="text-xs text-muted-foreground">{s.designation || s.staffType}</p>
          </div>
          {s.department?.name && (
            <Badge variant="outline" className="text-xs">{s.department.name}</Badge>
          )}
          <div className="w-full space-y-1.5 text-xs text-muted-foreground">
            {s.phone && (
              <a href={`tel:${s.phone}`} className="flex items-center gap-2 hover:text-foreground transition-colors justify-center">
                <Phone className="h-3 w-3 text-green-500" />{s.phone}
              </a>
            )}
            {s.email && (
              <a href={`mailto:${s.email}`} className="flex items-center gap-2 hover:text-foreground transition-colors justify-center truncate">
                <Mail className="h-3 w-3 text-blue-500" />{s.email}
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StaffRow = ({ s }: { s: any }) => (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/40 transition-colors group">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {s.fullName?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{s.fullName}</p>
        <p className="text-xs text-muted-foreground">{s.designation} · {s.department?.name}</p>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
        {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-1 hover:text-green-600"><Phone className="h-3 w-3" />{s.phone}</a>}
        {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-1 hover:text-blue-600 max-w-40 truncate"><Mail className="h-3 w-3" />{s.email}</a>}
      </div>
      <Badge variant="outline" className="text-xs flex-shrink-0">{s.staffType}</Badge>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Staff Directory"
        description={`${filtered.length} of ${staff.length} staff members`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2 hover:rotate-180 duration-500 transition-transform" />Refresh</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {[
          { label: 'Total Staff', value: staff.length, color: 'border-l-blue-500' },
          { label: 'Teachers', value: staff.filter(s => s.staffType === 'Teacher').length, color: 'border-l-green-500' },
          { label: 'Admin Staff', value: staff.filter(s => s.staffType === 'Admin').length, color: 'border-l-purple-500' },
          { label: 'Departments', value: depts.length, color: 'border-l-amber-500' },
        ].map(({ label, value, color }) => (
          <Card key={label} className={`border-l-4 ${color}`}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={deptFilter} onValueChange={v => setDept(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Departments" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {depts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={v => setType(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {['Teacher','Admin','Support','Management'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-1 border rounded-lg p-1">
            <Button variant={view === 'grid' ? 'default' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setView('grid')}><Grid3X3 className="h-3.5 w-3.5" /></Button>
            <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" className="h-7 w-7 p-0" onClick={() => setView('list')}><List className="h-3.5 w-3.5" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Staff ({filtered.length})</TabsTrigger>
          <TabsTrigger value="byDept">By Department</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-52 skeleton rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No staff members found</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 stagger-children">
              {filtered.map(s => <StaffCard key={s.id} s={s} />)}
            </div>
          ) : (
            <Card>
              <CardContent className="p-2 divide-y">
                {filtered.map(s => <StaffRow key={s.id} s={s} />)}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="byDept" className="mt-4 space-y-6">
          {byDept.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No departments found</p>
            </div>
          ) : (
            byDept.map((dept, di) => (
              <div key={dept.id}>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-3 ${COLORS[di % COLORS.length]}`}>
                  <Building2 className="h-3.5 w-3.5" />{dept.name}
                  <span className="bg-white/60 rounded-full px-2 py-0.5 text-xs">{dept.members.length}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {dept.members.map((s: any) => <StaffCard key={s.id} s={s} />)}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
