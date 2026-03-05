'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Shield, Users, ChevronDown, ChevronUp, Plus, Edit2, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const LEVEL_COLORS: Record<number,string> = {
  10: 'bg-red-100 text-red-700',  9: 'bg-purple-100 text-purple-700',
  8:  'bg-indigo-100 text-indigo-700', 7: 'bg-blue-100 text-blue-700',
  6:  'bg-cyan-100 text-cyan-700',  5: 'bg-teal-100 text-teal-700',
  4:  'bg-green-100 text-green-700', 3: 'bg-lime-100 text-lime-700',
  2:  'bg-amber-100 text-amber-700', 1: 'bg-gray-100 text-gray-600',
};

const PERMISSION_GROUPS: { label:string; perms:string[] }[] = [
  { label: 'Students',   perms: ['students:view','students:create','students:edit','students:delete'] },
  { label: 'Staff',      perms: ['staff:view','staff:create','staff:edit','staff:delete'] },
  { label: 'Finance',    perms: ['fees:view','fees:collect','fees:manage','payroll:view','payroll:manage','expenses:view','expenses:approve'] },
  { label: 'Academic',   perms: ['marks:view','marks:enter','marks:approve','timetable:view','timetable:manage','attendance:view','attendance:mark','attendance:edit'] },
  { label: 'Reports',    perms: ['reports:view','reports:export'] },
  { label: 'Admin',      perms: ['settings:view','settings:manage','users:view','users:manage','roles:manage'] },
  { label: 'Library',    perms: ['library:view','library:manage'] },
  { label: 'Transport',  perms: ['transport:view','transport:manage'] },
  { label: 'Hostel',     perms: ['hostel:view','hostel:manage'] },
];

export default function RolesPage() {
  const [roles,    setRoles]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialog,   setDialog]   = useState(false);
  const [editing,  setEditing]  = useState<any>(null);
  const [form,     setForm]     = useState({ name:'', description:'', level:4, permissions:[] as string[] });
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/roles');
      const data = await res.json();
      if (data.success) setRoles((data.data || []).sort((a:any,b:any) => b.level - a.level));
    } catch { toast({ title:'Failed to load', variant:'destructive' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (r: any) => {
    setEditing(r);
    const perms = r.permissions ? JSON.parse(r.permissions) : [];
    setForm({ name: r.name, description: r.description || '', level: r.level, permissions: perms });
    setDialog(true);
  };

  const togglePerm = (perm: string) => {
    if (perm === '*:*') {
      setForm(p => ({ ...p, permissions: p.permissions.includes('*:*') ? [] : ['*:*'] }));
      return;
    }
    setForm(p => ({
      ...p,
      permissions: p.permissions.includes(perm)
        ? p.permissions.filter(x => x !== perm)
        : [...p.permissions.filter(x => x !== '*:*'), perm],
    }));
  };

  const save = async () => {
    if (!form.name) { toast({ title:'Name required', variant:'destructive' }); return; }
    setSaving(true);
    try {
      const url  = editing ? `/api/roles/${editing.id}` : '/api/roles';
      const res  = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, permissions: JSON.stringify(form.permissions) }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `✅ Role ${editing ? 'updated' : 'created'}` });
      setDialog(false); load();
    } catch (e:any) { toast({ title:e.message, variant:'destructive' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Role Management"
        description="Define roles, permission sets and access levels"
        actions={<Button onClick={() => { setEditing(null); setForm({name:'',description:'',level:4,permissions:[]}); setDialog(true); }}><Plus className="h-4 w-4 mr-2" />Add Role</Button>}
      />

      {/* Role cards */}
      <div className="space-y-3">
        {loading ? Array.from({length:6}).map((_,i) => (
          <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
        )) : roles.map(role => {
          const perms = role.permissions ? JSON.parse(role.permissions) : [];
          const isAll = perms.includes('*:*');
          const isExpanded = expanded === role.id;
          return (
            <Card key={role.id} className="overflow-hidden card-hover">
              <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isExpanded ? null : role.id)}>
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${LEVEL_COLORS[role.level] || 'bg-gray-100'}`}>
                    {role.level}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{role.name}</h3>
                      {role.isSystem && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                      {isAll && <Badge className="bg-red-100 text-red-700 text-xs">All Permissions</Badge>}
                    </div>
                    {role.description && <p className="text-xs text-muted-foreground">{role.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{role._count?.users || 0} users</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{perms.length} permissions</Badge>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); openEdit(role); }}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
              {isExpanded && (
                <div className="border-t bg-muted/20 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {PERMISSION_GROUPS.map(group => {
                      const groupPerms = group.perms.filter(p => isAll || perms.includes(p));
                      if (!groupPerms.length && !isAll) return null;
                      return (
                        <div key={group.label}>
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{group.label}</p>
                          <div className="flex flex-wrap gap-1">
                            {(isAll ? group.perms : groupPerms).map(p => (
                              <Badge key={p} variant="outline" className="text-[10px] py-0">{p.split(':')[1]}</Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit Role: ${editing.name}` : 'Create New Role'}</DialogTitle>
            <DialogDescription>Configure role name, access level, and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Role Name *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} placeholder="e.g. Department Head" />
              </div>
              <div className="space-y-1">
                <Label>Access Level (1–10)</Label>
                <Input type="number" min={1} max={10} value={form.level} onChange={e => setForm(p => ({...p, level:parseInt(e.target.value)||1}))} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => setForm(p => ({...p, description:e.target.value}))} placeholder="What this role is for..." />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <Button variant="outline" size="sm" onClick={() => togglePerm('*:*')} className={form.permissions.includes('*:*') ? 'bg-red-50 border-red-200 text-red-700' : ''}>
                  <Shield className="h-3.5 w-3.5 mr-1" />All Permissions
                </Button>
              </div>
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label} className="border rounded-xl p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.perms.map(perm => {
                      const has = form.permissions.includes('*:*') || form.permissions.includes(perm);
                      return (
                        <button
                          key={perm}
                          onClick={() => togglePerm(perm)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${has ? 'bg-blue-600 text-white border-blue-600' : 'bg-background border-border hover:border-blue-400'}`}
                        >
                          {perm}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
