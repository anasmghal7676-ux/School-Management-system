'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Shield, Plus, Edit, Trash2, RefreshCw, CheckSquare,
  Square, Users, Lock, Unlock, ChevronDown, ChevronRight, Save,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const LEVEL_LABELS: Record<number, { label: string; color: string }> = {
  10: { label: 'Super Admin', color: 'bg-red-100 text-red-700 border-red-200' },
  9: { label: 'Admin', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  8: { label: 'Principal', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  7: { label: 'Vice Principal', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  6: { label: 'HOD', color: 'bg-lime-100 text-lime-700 border-lime-200' },
  5: { label: 'Senior Staff', color: 'bg-green-100 text-green-700 border-green-200' },
  4: { label: 'Staff', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  3: { label: 'Teacher', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  2: { label: 'Support', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  1: { label: 'Read Only', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const PERM_LABELS: Record<string, string> = {
  'view': 'View', 'create': 'Create', 'edit': 'Edit', 'delete': 'Delete',
  'mark': 'Mark', 'export': 'Export', 'reports': 'Reports', 'collect': 'Collect',
  'discounts': 'Discounts', 'marks': 'Marks', 'results': 'Results', 'publish': 'Publish',
  'payroll': 'Payroll', 'issue': 'Issue', 'manage': 'Manage', 'analytics': 'Analytics',
  'users': 'Users', 'roles': 'Roles', 'approve': 'Approve',
};

function permLabel(perm: string) {
  const [, action] = perm.split('.');
  return PERM_LABELS[action] || action;
}

const MODULE_ICONS: Record<string, string> = {
  Students: '🎓', Attendance: '📅', Fees: '💰', Exams: '📝',
  Staff: '👥', Library: '📚', Transport: '🚌', Hostel: '🏠',
  Reports: '📊', Settings: '⚙️', Announcements: '📢', Inventory: '📦', Accounts: '🏦',
};

const emptyForm = { name: '', description: '', level: '4' };

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [allPermissions, setAllPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [editingPerms, setEditingPerms] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(Object.keys(allPermissions)));
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/role-perms');
      const data = await res.json();
      setRoles(data.roles || []);
      setAllPermissions(data.allPermissions || {});
      setExpandedModules(new Set(Object.keys(data.allPermissions || {})));
    } catch {
      toast({ title: 'Error', description: 'Failed to load roles', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectRole = (role: any) => {
    setSelectedRole(role);
    setEditingPerms([...role.permissions]);
  };

  const togglePerm = (perm: string) => {
    setEditingPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const toggleModule = (module: string, perms: string[]) => {
    const allSelected = perms.every(p => editingPerms.includes(p));
    if (allSelected) {
      setEditingPerms(prev => prev.filter(p => !perms.includes(p)));
    } else {
      setEditingPerms(prev => [...new Set([...prev, ...perms])]);
    }
  };

  const selectAll = () => {
    const all = Object.values(allPermissions).flat();
    setEditingPerms(all);
  };

  const clearAll = () => setEditingPerms([]);

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSavingPerms(true);
    try {
      const res = await fetch('/api/role-perms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedRole.id, permissions: editingPerms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Permissions saved', description: `${editingPerms.length} permissions assigned to ${selectedRole.name}` });
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSavingPerms(false);
    }
  };

  const openAdd = () => { setEditingRole(null); setForm(emptyForm); setShowDialog(true); };
  const openEdit = (role: any) => {
    setEditingRole(role);
    setForm({ name: role.name, description: role.description || '', level: String(role.level) });
    setShowDialog(true);
  };

  const saveRole = async () => {
    if (!form.name) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const body = editingRole ? { id: editingRole.id, ...form } : form;
      const res = await fetch('/api/role-perms', {
        method: editingRole ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: editingRole ? 'Role updated' : 'Role created' });
      setShowDialog(false);
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role: any) => {
    if (role.isSystem) { toast({ title: 'Cannot delete system role', variant: 'destructive' }); return; }
    if (!confirm(`Delete role "${role.name}"?`)) return;
    const res = await fetch('/api/role-perms', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: role.id }),
    });
    const data = await res.json();
    if (!res.ok) { toast({ title: 'Error', description: data.error, variant: 'destructive' }); return; }
    if (selectedRole?.id === role.id) setSelectedRole(null);
    toast({ title: 'Role deleted' });
    load();
  };

  const toggleModuleExpand = (mod: string) => {
    setExpandedModules(prev => {
      const s = new Set(prev);
      s.has(mod) ? s.delete(mod) : s.add(mod);
      return s;
    });
  };

  const hasChanges = selectedRole && JSON.stringify(editingPerms.sort()) !== JSON.stringify([...selectedRole.permissions].sort());

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Role & Permission Editor"
        description="Manage user roles and configure module-level permissions"
        actions={
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Create Role</Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Role List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Roles ({roles.length})</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2">
              {roles.map(role => {
                const levelInfo = LEVEL_LABELS[role.level] || { label: `Level ${role.level}`, color: 'bg-slate-100 text-slate-600' };
                const isSelected = selectedRole?.id === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => selectRole(role)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:border-border hover:bg-muted/30'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {role.isSystem ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Shield className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="font-medium text-sm">{role.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); openEdit(role); }}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        {!role.isSystem && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); deleteRole(role); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${levelInfo.color}`}>{levelInfo.label}</Badge>
                      <span className="text-xs text-muted-foreground">{role.userCount} user{role.userCount !== 1 ? 's' : ''}</span>
                      <span className="text-xs text-muted-foreground">· {role.permissions.length} perms</span>
                    </div>
                    {role.description && <p className="text-xs text-muted-foreground mt-1 truncate">{role.description}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Permission Matrix */}
        <div className="lg:col-span-2">
          {!selectedRole ? (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Shield className="h-12 w-12 opacity-20 mb-3" />
                <p className="font-medium">Select a role to edit permissions</p>
                <p className="text-sm mt-1">Click any role on the left to manage its access</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      {selectedRole.name}
                      {selectedRole.isSystem && <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">System Role</Badge>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{editingPerms.length} of {Object.values(allPermissions).flat().length} permissions enabled</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearAll} className="text-xs h-8">Clear All</Button>
                    <Button variant="outline" size="sm" onClick={selectAll} className="text-xs h-8">Select All</Button>
                    <Button
                      size="sm" onClick={savePermissions} disabled={savingPerms || !hasChanges}
                      className={`h-8 ${hasChanges ? 'bg-primary' : ''}`}
                    >
                      {savingPerms ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                      {hasChanges ? 'Save Changes' : 'Saved'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
                {Object.entries(allPermissions).map(([module, perms]) => {
                  const allSelected = perms.every(p => editingPerms.includes(p));
                  const someSelected = perms.some(p => editingPerms.includes(p)) && !allSelected;
                  const expanded = expandedModules.has(module);

                  return (
                    <div key={module} className="border rounded-lg overflow-hidden">
                      {/* Module Header */}
                      <div
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${allSelected ? 'bg-primary/5' : someSelected ? 'bg-amber-50' : 'hover:bg-muted/30'}`}
                        onClick={() => toggleModuleExpand(module)}
                      >
                        <div onClick={e => { e.stopPropagation(); toggleModule(module, perms); }}>
                          {allSelected
                            ? <CheckSquare className="h-4.5 w-4.5 text-primary" />
                            : someSelected
                            ? <div className="h-4 w-4 rounded border-2 border-primary bg-primary/30" />
                            : <Square className="h-4.5 w-4.5 text-muted-foreground" />}
                        </div>
                        <span className="text-base">{MODULE_ICONS[module] || '📋'}</span>
                        <span className="font-medium text-sm flex-1">{module}</span>
                        <span className="text-xs text-muted-foreground">
                          {perms.filter(p => editingPerms.includes(p)).length}/{perms.length}
                        </span>
                        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>

                      {/* Permission Checkboxes */}
                      {expanded && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 bg-muted/20 border-t">
                          {perms.map(perm => {
                            const enabled = editingPerms.includes(perm);
                            return (
                              <label
                                key={perm}
                                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${enabled ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                              >
                                <Checkbox
                                  checked={enabled}
                                  onCheckedChange={() => togglePerm(perm)}
                                  className="h-3.5 w-3.5"
                                />
                                <span className="text-xs font-medium">{permLabel(perm)}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add/Edit Role Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Role Name *</Label>
              <Input placeholder="e.g. Class Teacher, Librarian" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Access Level *</Label>
              <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_LABELS).sort((a, b) => Number(b[0]) - Number(a[0])).map(([level, info]) => (
                    <SelectItem key={level} value={level}>
                      Level {level} — {info.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Higher level = more access. System uses this for hierarchy checks.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of this role..." rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={saveRole} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
