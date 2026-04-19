'use client';
export const dynamic = 'force-dynamic';

import { useState, useCallback, useRef } from 'react';
import {
  Container, Title, Group, Button, Text, Card, Badge,
  Select, Table, Alert, Stack, Divider,
  Center, ThemeIcon, SimpleGrid, Box,
} from '@mantine/core';
import {
  IconUpload, IconFileSpreadsheet, IconCheck,
  IconAlertTriangle, IconDownload, IconRefresh, IconUsers, IconUserCheck,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

type ImportType = 'students' | 'staff';
type Step = 'upload' | 'preview' | 'result';
interface ParsedRow { [key: string]: any; _rowIndex: number; _valid: boolean; _errors: string[]; }

const STUDENT_FIELDS = ['firstName','lastName','dateOfBirth','gender','phone','email','className','sectionName','admissionNumber','guardianName','guardianPhone','guardianEmail','address'];
const STAFF_FIELDS   = ['firstName','lastName','dateOfBirth','gender','phone','email','designation','departmentName','qualification','joiningDate','salary','employeeCode'];

const STUDENT_TEMPLATE = STUDENT_FIELDS.join(',') + '\nAli,Ahmed,2010-05-15,Male,03001234567,ali@example.com,Grade 5,A,ADM-001,Muhammad Ahmed,03001234568,ahmed@example.com,House 12 Street 4';
const STAFF_TEMPLATE   = STAFF_FIELDS.join(',') + '\nDr. Tariq,Mehmood,1985-08-10,Male,03001112233,tariq@school.edu,Math Teacher,Science,M.Phil Mathematics,2020-01-15,55000,EMP-001';

function validateStudent(row: ParsedRow): string[] {
  const errs: string[] = [];
  if (!row.firstName?.trim()) errs.push('firstName required');
  if (!row.lastName?.trim())  errs.push('lastName required');
  if (!row.dateOfBirth?.trim() || isNaN(Date.parse(row.dateOfBirth))) errs.push('valid dateOfBirth (YYYY-MM-DD)');
  if (!row.className?.trim()) errs.push('className required');
  return errs;
}

function validateStaff(row: ParsedRow): string[] {
  const errs: string[] = [];
  if (!row.firstName?.trim())  errs.push('firstName required');
  if (!row.lastName?.trim())   errs.push('lastName required');
  if (!row.dateOfBirth?.trim() || isNaN(Date.parse(row.dateOfBirth))) errs.push('valid dateOfBirth (YYYY-MM-DD)');
  if (!row.designation?.trim()) errs.push('designation required');
  if (!row.joiningDate?.trim() || isNaN(Date.parse(row.joiningDate))) errs.push('valid joiningDate (YYYY-MM-DD)');
  return errs;
}

function parseCSV(text: string, type: ImportType): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map((line, i) => {
    const vals = line.split(',').map(v => v.trim());
    const row: ParsedRow = { _rowIndex: i + 2, _valid: true, _errors: [] };
    headers.forEach((h, j) => { row[h] = vals[j] || ''; });
    const errs = type === 'students' ? validateStudent(row) : validateStaff(row);
    row._errors = errs;
    row._valid  = errs.length === 0;
    return row;
  });
}

function downloadTemplate(type: ImportType) {
  const csv  = type === 'students' ? STUDENT_TEMPLATE : STAFF_TEMPLATE;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${type}_template.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function BulkImportPage() {
  const [step, setStep]             = useState<Step>('upload');
  const [importType, setImportType] = useState<ImportType>('students');
  const [rows, setRows]             = useState<ParsedRow[]>([]);
  const [importing, setImporting]   = useState(false);
  const [result, setResult]         = useState<any>(null);
  const [dragOver, setDragOver]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) { notifications.show({ message: 'Upload a .csv file', color: 'red' }); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target?.result as string, importType);
      if (!parsed.length) { notifications.show({ message: 'CSV empty or missing headers', color: 'red' }); return; }
      setRows(parsed); setStep('preview');
    };
    reader.readAsText(file);
  }, [importType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  }, [handleFile]);

  const doImport = async () => {
    const validRows = rows.filter(r => r._valid).map(r => {
      const clean: any = {}; Object.keys(r).filter(k => !k.startsWith('_')).forEach(k => { clean[k] = r[k]; });
      clean._rowIndex = r._rowIndex; return clean;
    });
    if (!validRows.length) { notifications.show({ message: 'No valid rows', color: 'orange' }); return; }
    setImporting(true);
    try {
      const res  = await fetch('/api/bulk-import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: importType, rows: validRows }) });
      const data = await res.json();
      if (data.success) { setResult(data.data); setStep('result'); }
      else notifications.show({ message: data.message || 'Import failed', color: 'red' });
    } catch { notifications.show({ message: 'Network error', color: 'red' }); }
    finally { setImporting(false); }
  };

  const reset = () => { setStep('upload'); setRows([]); setResult(null); };
  const validCount = rows.filter(r => r._valid).length;
  const invalidCount = rows.filter(r => !r._valid).length;
  const displayFields = importType === 'students'
    ? ['firstName','lastName','className','sectionName','dateOfBirth','gender','phone']
    : ['firstName','lastName','designation','departmentName','joiningDate','salary'];

  if (step === 'upload') return (
    <Container size="md" py="xl">
      <Title order={2} mb={4}>Bulk Import</Title>
      <Text c="dimmed" size="sm" mb="xl">Import students or staff from a CSV file in three easy steps.</Text>

      <Card withBorder radius="md" p="lg" mb="lg">
        <Text fw={600} mb="sm">Step 1 — Choose import type</Text>
        <SimpleGrid cols={2}>
          {(['students','staff'] as ImportType[]).map(t => (
            <Box key={t} p="md" style={{ border: `2px solid ${importType===t?'#3b82f6':'#e5e7eb'}`, borderRadius:10, cursor:'pointer', background:importType===t?'#eff6ff':'#fff' }} onClick={() => setImportType(t)}>
              <Group>
                <ThemeIcon color={t==='students'?'blue':'green'} variant="light" size="lg">
                  {t==='students'?<IconUsers size={20}/>:<IconUserCheck size={20}/>}
                </ThemeIcon>
                <div><Text fw={600} tt="capitalize">{t}</Text><Text size="xs" c="dimmed">{t==='students'?STUDENT_FIELDS.length:STAFF_FIELDS.length} fields</Text></div>
              </Group>
            </Box>
          ))}
        </SimpleGrid>
      </Card>

      <Card withBorder radius="md" p="lg" mb="lg">
        <Text fw={600} mb="xs">Step 2 — Download template</Text>
        <Text size="sm" c="dimmed" mb="sm">Fill your data in the template. Do not rename columns.</Text>
        <Button leftSection={<IconDownload size={16}/>} variant="light" onClick={() => downloadTemplate(importType)}>
          Download {importType} template
        </Button>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Text fw={600} mb="sm">Step 3 — Upload filled CSV</Text>
        <Box p="xl" style={{ border:`2px dashed ${dragOver?'#3b82f6':'#d1d5db'}`, borderRadius:10, textAlign:'center', background:dragOver?'#eff6ff':'#f9fafb', cursor:'pointer', transition:'all .2s' }}
          onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop} onClick={()=>fileRef.current?.click()}>
          <ThemeIcon size={48} variant="light" color="blue" mx="auto" mb="sm"><IconFileSpreadsheet size={28}/></ThemeIcon>
          <Text fw={500}>Drop CSV here or click to browse</Text>
          <Text size="sm" c="dimmed">.csv files only</Text>
          <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);}}/>
        </Box>
      </Card>
    </Container>
  );

  if (step === 'preview') return (
    <Container size="xl" py="xl">
      <Group mb="xl" justify="space-between">
        <div>
          <Title order={2}>Preview — {rows.length} rows</Title>
          <Text c="dimmed" size="sm"><Text span c="green" fw={600}>{validCount} valid</Text> · <Text span c={invalidCount>0?'red':'dimmed'} fw={600}>{invalidCount} invalid</Text></Text>
        </div>
        <Group>
          <Button variant="default" leftSection={<IconRefresh size={16}/>} onClick={reset}>Start over</Button>
          <Button color="green" leftSection={<IconCheck size={16}/>} onClick={doImport} loading={importing} disabled={validCount===0}>
            Import {validCount} rows
          </Button>
        </Group>
      </Group>

      {invalidCount > 0 && (
        <Alert color="orange" icon={<IconAlertTriangle size={18}/>} mb="md">
          {invalidCount} invalid row(s) will be skipped. Fix and re-upload to include them.
        </Alert>
      )}

      <Card withBorder radius="md" p={0} style={{overflow:'auto'}}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Row</Table.Th><Table.Th>Status</Table.Th>
              {displayFields.map(f=><Table.Th key={f}>{f}</Table.Th>)}
              <Table.Th>Errors</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map(r=>(
              <Table.Tr key={r._rowIndex} style={{background:r._valid?undefined:'#fef2f2'}}>
                <Table.Td><Text size="sm" c="dimmed">{r._rowIndex}</Text></Table.Td>
                <Table.Td><Badge color={r._valid?'green':'red'} variant="light" size="sm">{r._valid?'Valid':'Error'}</Badge></Table.Td>
                {displayFields.map(f=><Table.Td key={f}><Text size="sm" truncate maw={140}>{r[f]||'—'}</Text></Table.Td>)}
                <Table.Td><Text size="xs" c="red">{r._errors.join('; ')}</Text></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Container>
  );

  return (
    <Container size="sm" py="xl">
      <Center>
        <Stack align="center" gap="lg">
          <ThemeIcon size={80} radius="50%" color={result?.failed===0?'green':'orange'} variant="light">
            {result?.failed===0?<IconCheck size={40}/>:<IconAlertTriangle size={40}/>}
          </ThemeIcon>
          <Title order={2}>Import Complete</Title>
          <SimpleGrid cols={2} w={300}>
            <Card withBorder radius="md" p="md" ta="center"><Text size="xs" c="dimmed" tt="uppercase">Imported</Text><Text size="xl" fw={700} c="green">{result?.created??0}</Text></Card>
            <Card withBorder radius="md" p="md" ta="center"><Text size="xs" c="dimmed" tt="uppercase">Failed</Text><Text size="xl" fw={700} c={result?.failed>0?'red':'dimmed'}>{result?.failed??0}</Text></Card>
          </SimpleGrid>
          {result?.errors?.length>0&&(
            <Card withBorder radius="md" p="md" w="100%">
              <Text fw={600} mb="xs" size="sm">Errors:</Text>
              <Stack gap={4}>{result.errors.map((e:string,i:number)=><Text key={i} size="xs" c="red">{e}</Text>)}</Stack>
            </Card>
          )}
          <Group>
            <Button variant="default" leftSection={<IconRefresh size={16}/>} onClick={reset}>Import more</Button>
            <Button component="a" href={importType==='students'?'/students':'/staff'} leftSection={<IconUsers size={16}/>}>View {importType}</Button>
          </Group>
        </Stack>
      </Center>
    </Container>
  );
}
