'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Settings2, Plus, Edit2, Trash2, Loader2, RefreshCw, GripVertical, Type, Hash, Calendar, CheckSquare, List } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { toast } from '@/hooks/use-toast';

const ENTITY_TYPES = ['Student','Staff','Parent','Class','Expense','Other'];
const FIELD_TYPES  = [
  { value:'text',     label:'Text',      icon:Type },
  { value:'number',   label:'Number',    icon:Hash },
  { value:'date',     label:'Date',      icon:Calendar },
  { value:'boolean',  label:'Yes/No',    icon:CheckSquare },
  { value:'select',   label:'Dropdown',  icon:List },
  { value:'textarea', label:'Long Text', icon:Type },
];
const EMPTY = { fieldName:'', label:'', entityType:'Student', fieldType:'text', options:'', required:false, isActive:true, helpText:'', sortOrder:0 };

export default function CustomFieldsPage() {
  const [fields,   setFields]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [entity,   setEntity]   = useState('Student');
  const [dialog,   setDialog]   = useState(false);
  const [editing,  setEditing]  = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [form,     setForm]     = useState<any>(EMPTY);
  const f = (k:string,v:any) => setForm((p:any) => ({...p,[k]:v}));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/cust-fields?limit=200');
      const data = await res.json();
      if (data.success) setFields(data.data?.items ?? data.data ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm({...EMPTY,entityType:entity}); setDialog(true); };
  const openEdit = (f2:any) => { setEditing(f2); setForm({...EMPTY,...f2,options:Array.isArray(f2.options)?f2.options.join(','):f2.options||''}); setDialog(true); };

  const save = async () => {
    if (!form.fieldName||!form.label) { toast({title:'Field name and label required',variant:'destructive'}); return; }
    setSaving(true);
    try {
      const url  = editing ? `/api/cust-fields/${editing.id}` : '/api/cust-fields';
      const payload = {...form,options:form.options?form.options.split(',').map((s:string)=>s.trim()).filter(Boolean):[]};
      const res  = await fetch(url,{method:editing?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:`✅ Field ${editing?'updated':'created'}`});
      setDialog(false); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
    finally { setSaving(false); }
  };

  const deleteField = async () => {
    if (!deleting) return;
    try {
      const res  = await fetch(`/api/cust-fields/${deleting.id}`,{method:'DELETE'});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({title:'✅ Field deleted'}); setDeleting(null); load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const toggleActive = async (field:any) => {
    try {
      const res  = await fetch(`/api/cust-fields/${field.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({isActive:!field.isActive})});
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      load();
    } catch(e:any){toast({title:e.message,variant:'destructive'});}
  };

  const filtered = fields.filter(f2=>f2.entityType===entity);
  const FieldTypeIcon = ({type}:{type:string}) => {
    const ft = FIELD_TYPES.find(t=>t.value===type);
    if (!ft) return <Type className="h-4 w-4"/>;
    return <ft.icon className="h-4 w-4"/>;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Custom Fields" description="Define additional data fields for school records"
        actions={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-2"/>Add Field</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2">
        {ENTITY_TYPES.map(e=>{
          const count = fields.filter(f2=>f2.entityType===e).length;
          return (
            <button key={e} onClick={()=>setEntity(e)}
              className={`p-3 rounded-xl border text-left transition-all ${entity===e?'bg-blue-600 text-white border-blue-600':'border-border hover:border-blue-400 bg-background'}`}>
              <p className="font-semibold text-sm">{e}</p>
              <p className={`text-xs mt-0.5 ${entity===e?'text-blue-100':'text-muted-foreground'}`}>{count} field{count!==1?'s':''}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{entity} Custom Fields</h3>
        <Button variant="outline" size="sm" className="h-8" onClick={load}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/></Button>
      </div>

      {loading?<div className="space-y-2">{Array.from({length:3}).map((_,i)=><div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse"/>)}</div>
      :filtered.length===0?<Card><CardContent className="py-10 text-center">
        <Settings2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30"/>
        <p className="font-medium text-muted-foreground">No custom fields for {entity}</p>
        <p className="text-sm text-muted-foreground mt-1">Add fields to capture additional data</p>
        <Button className="mt-4" onClick={openAdd}><Plus className="h-4 w-4 mr-2"/>Add First Field</Button>
      </CardContent></Card>
      :<div className="space-y-2">
        {filtered.sort((a,b)=>(a.sortOrder||0)-(b.sortOrder||0)).map((field:any)=>(
          <Card key={field.id} className={`card-hover ${!field.isActive?'opacity-60':''}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0"/>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${field.isActive?'bg-blue-50 text-blue-600':'bg-muted text-muted-foreground'}`}>
                <FieldTypeIcon type={field.fieldType}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm">{field.label}</p>
                  {field.required&&<Badge variant="destructive" className="text-xs py-0">Required</Badge>}
                  {!field.isActive&&<Badge variant="secondary" className="text-xs py-0">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Key: <code className="bg-muted px-1 rounded">{field.fieldName}</code></span>
                  <span>Type: {FIELD_TYPES.find(t=>t.value===field.fieldType)?.label||field.fieldType}</span>
                  {field.helpText&&<span className="truncate max-w-xs">{field.helpText}</span>}
                </div>
                {field.fieldType==='select'&&field.options?.length>0&&(
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(Array.isArray(field.options)?field.options:field.options.split(',')).slice(0,4).map((o:string)=>(
                      <Badge key={o} variant="outline" className="text-xs py-0">{o}</Badge>
                    ))}
                    {(Array.isArray(field.options)?field.options:field.options.split(',')).length>4&&<Badge variant="outline" className="text-xs py-0">+{(Array.isArray(field.options)?field.options:field.options.split(',')).length-4} more</Badge>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch checked={field.isActive} onCheckedChange={()=>toggleActive(field)}/>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={()=>openEdit(field)}><Edit2 className="h-3.5 w-3.5"/></Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={()=>setDeleting(field)}><Trash2 className="h-3.5 w-3.5"/></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing?'Edit Field':'Add Custom Field'}</DialogTitle><DialogDescription>Define a new data field for {form.entityType} records</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Field Key * <span className="text-xs text-muted-foreground">(no spaces)</span></Label><Input value={form.fieldName} onChange={e=>f('fieldName',e.target.value.replace(/\s+/g,'_').toLowerCase())} placeholder="e.g. blood_group"/></div>
              <div className="space-y-1"><Label>Display Label *</Label><Input value={form.label} onChange={e=>f('label',e.target.value)} placeholder="e.g. Blood Group"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Entity</Label><Select value={form.entityType} onValueChange={v=>f('entityType',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{ENTITY_TYPES.map(e=><SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Field Type</Label><Select value={form.fieldType} onValueChange={v=>f('fieldType',v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{FIELD_TYPES.map(t=><SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            {form.fieldType==='select'&&<div className="space-y-1"><Label>Options <span className="text-xs text-muted-foreground">(comma-separated)</span></Label><Input value={form.options} onChange={e=>f('options',e.target.value)} placeholder="Option A, Option B, Option C"/></div>}
            <div className="space-y-1"><Label>Help Text</Label><Input value={form.helpText} onChange={e=>f('helpText',e.target.value)} placeholder="Guidance shown under the field"/></div>
            <div className="space-y-1"><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={e=>f('sortOrder',parseInt(e.target.value)||0)}/></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.required} onCheckedChange={v=>f('required',v)}/><Label>Required field</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={v=>f('isActive',v)}/><Label>Active</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}{editing?'Save Changes':'Add Field'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={()=>setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Field?</AlertDialogTitle><AlertDialogDescription>Deleting <strong>{deleting?.label}</strong> will also remove all stored values. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteField} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
