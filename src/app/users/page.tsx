'use client';

export const dynamic = "force-dynamic"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Plus, Search, Edit2, Trash2, RefreshCw, Shield, User, Key, Lock, Unlock, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const LEVEL_COLORS: Record<number,string> = {
  10: 'bg-red-100 text-red-700 border-red-200',
  9:  'bg-purple-100 text-purple-700 border-purple-200',
  8:  'bg-indigo-100 text-indigo-700 border-indigo-200',
  7:  'bg-blue-100 text-blue-700 border-blue-200',
  6:  'bg-cyan-100 text-cyan-700 border-cyan-200',
  5:  'bg-teal-100 text-teal-700 border-teal-200',
  4:  'bg-green-100 text-green-700 border-green-200',
  3:  'bg-lime-100 text-lime-700 border-lime-200',
  2:  'bg-amber-100 text-amber-700 border-amber-200',
  1:  'bg-gray-100 text-gray-600 border-gray-200',
};

interface User { id:string; username:string; email:string; firstName:string; lastName:string; isActive:boolean; lastLogin?:string; createdAt:string; role:{ id:string; name:string; level:number }; lockedUntil?:string; failedLoginAttempts:number; }
interface Role { id:string; name:string; level:number; description?:string; }

const blank = { username:'', email:'', firstName:'', lastName:'', roleId:'', password:'', isActive:true, isStaff:false };

export default function UsersPage() {
  const [users,    setUsers]    = useState<User[]>([]);
  const [roles,    setRoles]    = useState<Role[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [dialog,   setDialog]   = useState(false);
  const [editing,  setEditing]  = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState<any>(blank);
  const [pwDialog, setPwDialog] = useState<User | null>(null);
  const [newPw,    setNewPw]    = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        fetch('/api/users?' + new URLSearchParams({ search, roleId: roleFilter })),
        fetch('/api/roles'),
      ]);
      const [uData, rData] = await Promise.all([uRes.json(), rRes.json()]);
      if (uData.success) setUsers(uData.data?.items || uData.data || []);
      if (rData.success) setRoles(rData.data || []);
    } catch { toast({ title: 'Failed to load', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(blank); setDialog(true); };
  const openEdit   = (u: User) => { setEditing(u); setForm({ username:u.username, email:u.email, firstName:u.firstName, lastName:u.lastName, roleId:u.role?.id||'', password:'', isActive:u.isActive, isStaff:false }); setDialog(true); };

  const save = async () => {
    if (!form.username || !form.email || !form.roleId) { toast({ title:'Required fields missing', variant:'destructive' }); return; }
    if (!editing && !form.password) { toast({ title:'Password required for new users', variant:'destructive' }); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/users/${editing.id}` : '/api/users';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `✅ User ${editing ? 'updated' : 'created'}` });
      setDialog(false); load();
    } catch (e:any) { toast({ title: e.message, variant:'destructive' }); }
    finally { setSaving(false); }
  };

  const deleteUser = async () => {
    if (!deleting) return;
    try {
      const res  = await fetch(`/api/users/${deleting.id}`, { method:'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: '✅ User deleted' });
      setDeleting(null); load();
    } catch (e:any) { toast({ title: e.message, variant:'destructive' }); }
  };

  const resetPassword = async () => {
    if (!pwDialog || !newPw || newPw.length < 6) { toast({ title:'Password must be 6+ characters', variant:'destructive' }); return; }
    try {
      const res  = await fetch(`/api/users/${pwDialog.id}/reset-password`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: newPw }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: '✅ Password reset' });
      setPwDialog(null); setNewPw('');
    } catch (e:any) { toast({ title: e.message, variant:'destructive' }); }
  };

  const toggleActive = async (u: User) => {
    try {
      const res  = await fetch(`/api/users/${u.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ isActive: !u.isActive }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: `User ${u.isActive ? 'deactivated' : 'activated'}` });
      load();
    } catch (e:any) { toast({ title: e.message, variant:'destructive' }); }
  };

  const stats = {
    total:  users.length,
    active: users.filter(u => u.isActive).length,
    locked: users.filter(u => u.lockedUntil && new Date(u.lockedUntil) > new Date()).length,
    admins: users.filter(u => u.role?.level >= 7).length,
  };

  const filtered = users.filter(u =>
    !search || (`${u.firstName} ${u.lastName}`).toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        description="Manage system users, roles and access permissions"
        actions={
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add User</Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Users',  value:stats.total,  icon:User,       color:'text-blue-600',   bg:'bg-blue-50' },
          { label:'Active',       value:stats.active, icon:ShieldCheck,color:'text-green-600',  bg:'bg-green-50' },
          { label:'Locked',       value:stats.locked, icon:Lock,       color:'text-red-600',    bg:'bg-red-50' },
          { label:'Admins (7+)',  value:stats.admins, icon:Shield,     color:'text-purple-600', bg:'bg-purple-50' },
        ].map(s => (
          <Card key={s.label} className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({length:6}).map((_,i) => (
                  <TableRow key={i}><TableCell colSpan={6}><div className="h-8 bg-muted/40 rounded animate-pulse" /></TableCell></TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No users found</TableCell></TableRow>
              ) : filtered.map(u => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                        {(u.firstName?.[0] || u.username[0]).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{u.username}</TableCell>
                  <TableCell>
                    {u.role && (
                      <Badge variant="outline" className={`text-xs ${LEVEL_COLORS[u.role.level] || ''}`}>
                        L{u.role.level} · {u.role.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.lockedUntil && new Date(u.lockedUntil) > new Date() ? (
                      <Badge variant="destructive" className="text-xs"><Lock className="h-3 w-3 mr-1" />Locked</Badge>
                    ) : u.isActive ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-PK') : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleActive(u)} title={u.isActive ? 'Deactivate' : 'Activate'}>
                        {u.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setPwDialog(u); setNewPw(''); }} title="Reset password">
                        <Key className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(u)} title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => setDeleting(u)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>{editing ? 'Update user information and role' : 'Create a new system user account'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <Label>First Name *</Label>
              <Input value={form.firstName} onChange={e => setForm((p:any) => ({...p, firstName:e.target.value}))} placeholder="First name" />
            </div>
            <div className="space-y-1">
              <Label>Last Name *</Label>
              <Input value={form.lastName} onChange={e => setForm((p:any) => ({...p, lastName:e.target.value}))} placeholder="Last name" />
            </div>
            <div className="space-y-1">
              <Label>Username *</Label>
              <Input value={form.username} onChange={e => setForm((p:any) => ({...p, username:e.target.value}))} placeholder="username" />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => setForm((p:any) => ({...p, email:e.target.value}))} placeholder="email@school.edu" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Role *</Label>
              <Select value={form.roleId} onValueChange={v => setForm((p:any) => ({...p, roleId:v}))}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.sort((a,b) => b.level - a.level).map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">L{r.level}</span>
                        {r.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editing && (
              <div className="space-y-1 col-span-2">
                <Label>Password * <span className="text-xs text-muted-foreground">(min 6 chars)</span></Label>
                <Input type="password" value={form.password} onChange={e => setForm((p:any) => ({...p, password:e.target.value}))} placeholder="••••••••" />
              </div>
            )}
            <div className="flex items-center gap-2 col-span-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm((p:any) => ({...p, isActive:v}))} />
              <Label>Account Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      {pwDialog && (
        <Dialog open={true} onOpenChange={() => setPwDialog(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>Set a new password for {pwDialog.firstName} {pwDialog.lastName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label>New Password <span className="text-xs text-muted-foreground">(min 6 chars)</span></Label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPwDialog(null)}>Cancel</Button>
              <Button onClick={resetPassword}>Reset Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleting?.firstName} {deleting?.lastName}</strong> ({deleting?.username}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
