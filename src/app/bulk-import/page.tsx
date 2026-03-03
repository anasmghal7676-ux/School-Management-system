'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, ChevronLeft, Download, Loader2, RefreshCw,
  Users, User,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

// ── Column definitions ───────────────────────────────────────────────────────

const STUDENT_COLUMNS = [
  { key: 'firstName',      label: 'First Name',       required: true },
  { key: 'middleName',     label: 'Middle Name',       required: false },
  { key: 'lastName',       label: 'Last Name',         required: true },
  { key: 'gender',         label: 'Gender',            required: true,  hint: 'Male/Female' },
  { key: 'dateOfBirth',    label: 'Date of Birth',     required: true,  hint: 'YYYY-MM-DD' },
  { key: 'bloodGroup',     label: 'Blood Group',       required: false },
  { key: 'className',      label: 'Class Name',        required: true,  hint: 'Exact match e.g. Class 1' },
  { key: 'sectionName',    label: 'Section',           required: false, hint: 'e.g. A' },
  { key: 'rollNumber',     label: 'Roll Number',       required: false },
  { key: 'admissionNumber',label: 'Admission Number',  required: false, hint: 'Auto-generated if blank' },
  { key: 'fatherName',     label: 'Father Name',       required: true },
  { key: 'fatherPhone',    label: 'Father Phone',      required: true },
  { key: 'fatherCnic',     label: 'Father CNIC',       required: false },
  { key: 'fatherOccupation',label: 'Father Occupation',required: false },
  { key: 'motherName',     label: 'Mother Name',       required: false },
  { key: 'motherPhone',    label: 'Mother Phone',      required: false },
  { key: 'address',        label: 'Address',           required: true },
  { key: 'city',           label: 'City',              required: true },
  { key: 'province',       label: 'Province',          required: false },
  { key: 'phone',          label: 'Student Phone',     required: false },
  { key: 'medicalConditions',label:'Medical Conditions',required: false },
  { key: 'previousSchool', label: 'Previous School',   required: false },
];

const STAFF_COLUMNS = [
  { key: 'firstName',      label: 'First Name',    required: true },
  { key: 'lastName',       label: 'Last Name',     required: true },
  { key: 'gender',         label: 'Gender',        required: true,  hint: 'Male/Female' },
  { key: 'dateOfBirth',    label: 'Date of Birth', required: true,  hint: 'YYYY-MM-DD' },
  { key: 'phone',          label: 'Phone',         required: true },
  { key: 'email',          label: 'Email',         required: true },
  { key: 'designation',    label: 'Designation',   required: true },
  { key: 'department',     label: 'Department',    required: false, hint: 'Must match existing dept' },
  { key: 'joiningDate',    label: 'Joining Date',  required: true,  hint: 'YYYY-MM-DD' },
  { key: 'qualification',  label: 'Qualification', required: false },
  { key: 'experienceYears',label: 'Experience (yrs)',required: false },
  { key: 'salary',         label: 'Salary',        required: false },
  { key: 'employeeCode',   label: 'Employee Code', required: false, hint: 'Auto-generated if blank' },
  { key: 'bankAccount',    label: 'Bank Account',  required: false },
  { key: 'bankName',       label: 'Bank Name',     required: false },
  { key: 'alternatePhone', label: 'Alt Phone',     required: false },
];

// ── Sample CSV generator ─────────────────────────────────────────────────────

const generateSampleCSV = (type: 'students' | 'staff') => {
  const cols  = type === 'students' ? STUDENT_COLUMNS : STAFF_COLUMNS;
  const header = cols.map(c => c.key).join(',');
  const sample = type === 'students'
    ? 'Ahmed,Bilal,Khan,Male,2010-03-15,A+,Class 5,A,21,ADM-2024-001,Muhammad Khan,03001234567,35201-1234567-8,Business,Fatima Khan,03009876543,House 12 Street 5,Lahore,Punjab,03001234568,,City School'
    : 'Ali,Hassan,Male,1985-06-20,03001234567,ali.hassan@school.edu,Math Teacher,Science,2015-09-01,M.Sc Mathematics,10,85000,EMP-0001,1234567890,Allied Bank,03009876543';
  return `${header}\n${sample}`;
};

// ── CSV parser ───────────────────────────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split('\n').map(l => l.replace(/\r/g, ''));
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
  });
  return { headers, rows };
}

// ── Main Component ───────────────────────────────────────────────────────────

type Step = 'upload' | 'map' | 'validate' | 'import' | 'done';

export default function BulkImportPage() {
  const [importType, setImportType] = useState<'students' | 'staff'>('students');
  const [step, setStep]             = useState<Step>('upload');
  const [csvText, setCsvText]       = useState('');
  const [parsed, setParsed]         = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [mapping, setMapping]       = useState<Record<string, string>>({});
  const [preview, setPreview]       = useState<any>(null);
  const [importing, setImporting]   = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult]         = useState<any>(null);
  const [onlyValid, setOnlyValid]   = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const targetCols = importType === 'students' ? STUDENT_COLUMNS : STAFF_COLUMNS;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const p = parseCSV(text);
      setParsed(p);
      // Auto-map columns by matching names
      const autoMap: Record<string, string> = {};
      targetCols.forEach(col => {
        const match = p.headers.find(h =>
          h.toLowerCase().replace(/[\s_]/g, '') === col.key.toLowerCase().replace(/[\s_]/g, '') ||
          h.toLowerCase() === col.label.toLowerCase()
        );
        if (match) autoMap[col.key] = match;
      });
      setMapping(autoMap);
      setStep('map');
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    if (!parsed) return;
    setValidating(true);
    try {
      // Apply column mapping to rows
      const mapped = parsed.rows.map((row, i) => {
        const out: Record<string, string> = { _rowIndex: String(i + 1) };
        targetCols.forEach(col => {
          const srcCol = mapping[col.key];
          out[col.key] = srcCol ? row[srcCol] || '' : '';
        });
        return out;
      });

      const r = await fetch('/api/bulk-import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: importType, rows: mapped }),
      });
      const j = await r.json();
      if (j.success) { setPreview(j.data); setStep('validate'); }
      else toast({ title: 'Validation failed', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setValidating(false); }
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const rowsToImport = preview.results
        .filter((r: any) => r.valid || !onlyValid)
        .map((r: any) => ({ ...r.data, _rowIndex: r.rowIndex, _skip: !r.valid && onlyValid }));

      const res = await fetch('/api/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: importType, rows: rowsToImport }),
      });
      const j = await res.json();
      if (j.success) { setResult(j.data); setStep('done'); }
      else toast({ title: 'Import failed', description: j.message, variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setImporting(false); }
  };

  const reset = () => {
    setStep('upload'); setCsvText(''); setParsed(null); setMapping({});
    setPreview(null); setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Steps breadcrumb ──────────────────────────────────────────────────────

  const STEPS: { id: Step; label: string }[] = [
    { id: 'upload', label: 'Upload' },
    { id: 'map', label: 'Map Columns' },
    { id: 'validate', label: 'Validate' },
    { id: 'import', label: 'Import' },
    { id: 'done', label: 'Done' },
  ];
  const stepIdx = STEPS.findIndex(s => s.id === step);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Upload className="h-7 w-7" />Bulk Import
            </h1>
            <p className="text-muted-foreground">Import students or staff from CSV files with validation</p>
          </div>
          {step !== 'upload' && (
            <Button variant="outline" onClick={reset}><RefreshCw className="mr-2 h-4 w-4" />Start Over</Button>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i < stepIdx ? 'bg-green-100 text-green-700' :
                i === stepIdx ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < stepIdx && <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: UPLOAD ─────────────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>Select what you want to import and upload a CSV file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Import Type</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {(['students', 'staff'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setImportType(t)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${importType === t ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}
                      >
                        {t === 'students' ? <Users className="h-6 w-6" /> : <User className="h-6 w-6" />}
                        <span className="font-semibold capitalize">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors card-hover"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium">Click to upload CSV</p>
                  <p className="text-sm text-muted-foreground mt-1">Supports .csv files up to 500 rows</p>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const csv  = generateSampleCSV(importType);
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.href = url; a.download = `sample_${importType}.csv`; a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />Download Sample Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Required Fields</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {targetCols.map(col => (
                    <div key={col.key} className="flex items-center gap-2 text-sm">
                      {col.required ? (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">req</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">opt</span>
                      )}
                      <span className="font-medium">{col.label}</span>
                      {col.hint && <span className="text-muted-foreground text-xs">— {col.hint}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 2: MAP COLUMNS ─────────────────────────────────────────── */}
        {step === 'map' && parsed && (
          <Card>
            <CardHeader>
              <CardTitle>Map Columns</CardTitle>
              <CardDescription>
                Your CSV has {parsed.headers.length} columns and {parsed.rows.length} rows. Map each required field to your CSV column.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {targetCols.map(col => (
                  <div key={col.key}>
                    <Label className="text-xs flex items-center gap-1.5 mb-1">
                      {col.label}
                      {col.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={mapping[col.key] || ''}
                      onValueChange={v => setMapping(m => ({ ...m, [col.key]: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="— not mapped —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— not mapped —</SelectItem>
                        {parsed.headers.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Preview first 3 rows */}
              <div>
                <p className="text-sm font-semibold mb-2 text-muted-foreground">Preview (first 3 rows)</p>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="text-xs w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        {parsed.headers.map(h => (
                          <th key={h} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-t">
                          {parsed.headers.map(h => (
                            <td key={h} className="px-2 py-1 whitespace-nowrap text-muted-foreground max-w-32 truncate">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('upload')}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
                <Button onClick={handleValidate} disabled={validating}>
                  {validating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Validate {parsed.rows.length} Rows <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 3: VALIDATE ────────────────────────────────────────────── */}
        {step === 'validate' && preview && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-3xl font-black">{preview.total}</p>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-3xl font-black text-green-600">{preview.valid}</p>
                  <p className="text-sm text-muted-foreground">Valid</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-3xl font-black text-red-600">{preview.invalid}</p>
                  <p className="text-sm text-muted-foreground">With Errors</p>
                </CardContent>
              </Card>
            </div>

            {/* Validation table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Validation Results</CardTitle>
                <CardDescription>
                  Review errors below. {preview.invalid > 0 && 'Rows with errors will be skipped unless you fix them.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Row</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Errors / Warnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.results.map((r: any) => (
                        <TableRow key={r.rowIndex} className={!r.valid ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                          <TableCell className="font-mono text-xs">{r.rowIndex}</TableCell>
                          <TableCell>
                            {r.valid ? (
                              <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle2 className="mr-1 h-3 w-3" />Valid</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 border-0"><XCircle className="mr-1 h-3 w-3" />Error</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{r.data?.fullName || `${r.data?.firstName || ''} ${r.data?.lastName || ''}`}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.data?.className || r.data?.designation || '—'}</TableCell>
                          <TableCell>
                            {r.errors.map((e: string, i: number) => (
                              <div key={i} className="text-xs text-red-600 flex items-center gap-1">
                                <XCircle className="h-3 w-3 flex-shrink-0" />{e}
                              </div>
                            ))}
                            {r.warnings.map((w: string, i: number) => (
                              <div key={i} className="text-xs text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0" />{w}
                              </div>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setStep('map')}><ChevronLeft className="mr-2 h-4 w-4" />Back</Button>
              {preview.valid > 0 && (
                <Button onClick={() => setStep('import')}>
                  Import {preview.valid} Valid Rows <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {preview.invalid > 0 && (
                <p className="text-sm text-muted-foreground">{preview.invalid} row(s) will be skipped</p>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: CONFIRM IMPORT ──────────────────────────────────────── */}
        {step === 'import' && preview && (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Confirm Import</CardTitle>
              <CardDescription>
                You are about to import {preview.valid} {importType} records into the database.
                This action cannot be easily undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Import type:</span>
                  <span className="font-semibold capitalize">{importType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid rows:</span>
                  <span className="font-semibold text-green-600">{preview.valid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Skipped rows:</span>
                  <span className="font-semibold text-red-600">{preview.invalid}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('validate')} disabled={importing}>
                  <ChevronLeft className="mr-2 h-4 w-4" />Back
                </Button>
                <Button onClick={handleImport} disabled={importing} className="flex-1">
                  {importing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</>
                  ) : (
                    <>Confirm Import — {preview.valid} Records</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── STEP 5: DONE ────────────────────────────────────────────────── */}
        {step === 'done' && result && (
          <Card className="max-w-lg">
            <CardContent className="pt-10 pb-10 text-center">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Successfully imported <strong>{result.created}</strong> {importType} records.
                {result.failed > 0 && ` ${result.failed} rows failed.`}
              </p>
              {result.errors?.length > 0 && (
                <div className="text-left bg-red-50 dark:bg-red-950/20 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
                  {result.errors.map((e: string, i: number) => (
                    <p key={i} className="text-xs text-red-600">{e}</p>
                  ))}
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={reset}><RefreshCw className="mr-2 h-4 w-4" />Import More</Button>
                <Button variant="outline" onClick={() => window.location.href = `/${importType}`}>
                  View {importType === 'students' ? 'Students' : 'Staff'} →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}
