'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  Container, Title, Text, Card, Grid, Button, Select, Group, Stack,
  Badge, Divider, Alert,
} from '@mantine/core';
import {
  IconDownload, IconFileText, IconUsers, IconId, IconReceipt,
  IconClipboardList, IconCertificate, IconCalendar, IconChartBar, IconTable,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  generateFeeChallan, generateReportCard, generateSalarySlip,
  generateIdCardsPDF, generateTC, generateAttendanceReport,
  generateFeeReport, generateTableReport,
} from '@/lib/pdf-generator';

export default function PdfDemoPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [staff, setStaff]       = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff]     = useState<string | null>(null);
  const [loading, setLoading]   = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/students?limit=100').then(r => r.json()).then(d =>
      setStudents((d.data || []).map((s: any) => ({
        value: s.id,
        label: `${s.fullName} (${s.admissionNumber || 'N/A'})`,
      })))
    );
    fetch('/api/staff?limit=100').then(r => r.json()).then(d =>
      setStaff((d.data || []).map((s: any) => ({
        value: s.id,
        label: s.fullName || s.name || 'Staff Member',
      })))
    );
  }, []);

  async function downloadPDF(type: string, label: string) {
    setLoading(type);
    try {
      let data: any;

      if (['fee-challan', 'report-card', 'tc'].includes(type)) {
        if (!selectedStudent) {
          notifications.show({ message: 'Please select a student first', color: 'orange' }); return;
        }
        const res = await fetch(`/api/pdf?type=${type}&studentId=${selectedStudent}`);
        data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');

        if (type === 'fee-challan')    generateFeeChallan(data.data);
        else if (type === 'report-card') generateReportCard(data.data);
        else if (type === 'tc')          generateTC(data.data);

      } else if (type === 'salary-slip') {
        if (!selectedStaff) {
          notifications.show({ message: 'Please select a staff member first', color: 'orange' }); return;
        }
        const res = await fetch(`/api/pdf?type=salary-slip&staffId=${selectedStaff}`);
        data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        generateSalarySlip(data.data);

      } else if (type === 'id-cards') {
        const res = await fetch('/api/students?limit=20');
        data = await res.json();
        generateIdCardsPDF(data.data || []);

      } else if (type === 'attendance') {
        const res = await fetch('/api/pdf?type=attendance');
        data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        generateAttendanceReport(data.data);

      } else if (type === 'fee-report') {
        const res = await fetch('/api/pdf?type=fee-report');
        data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        generateFeeReport(data.data);

      } else if (type === 'table') {
        generateTableReport({
          title: 'Sample Data Report',
          headers: ['Name', 'Class', 'Marks', 'Grade'],
          rows: [
            ['Ali Hassan', 'Grade 5', '450/500', 'A+'],
            ['Sara Ahmed', 'Grade 6', '380/500', 'B'],
            ['Usman Khan', 'Grade 7', '420/500', 'A'],
          ],
        });
      }

      notifications.show({ message: `${label} PDF generated successfully`, color: 'teal' });
    } catch (err: any) {
      notifications.show({ message: err.message || 'PDF generation failed', color: 'red' });
    } finally {
      setLoading(null);
    }
  }

  const studentPDFs = [
    { type: 'fee-challan',  label: 'Fee Challan',   icon: <IconReceipt size={20} />,       color: 'blue',   desc: '3-copy challan (School/Bank/Student)' },
    { type: 'report-card',  label: 'Report Card',   icon: <IconClipboardList size={20} />, color: 'violet', desc: 'Full academic performance report' },
    { type: 'tc',           label: 'Transfer Certificate', icon: <IconCertificate size={20} />, color: 'orange', desc: 'Official school leaving certificate' },
  ];
  const staffPDFs = [
    { type: 'salary-slip',  label: 'Salary Slip',   icon: <IconFileText size={20} />,  color: 'green', desc: 'Monthly salary breakdown' },
  ];
  const generalPDFs = [
    { type: 'id-cards',     label: 'ID Cards',       icon: <IconId size={20} />,       color: 'teal',  desc: '20 student ID cards per page' },
    { type: 'attendance',   label: 'Attendance Report', icon: <IconCalendar size={20} />, color: 'cyan', desc: 'Monthly attendance summary' },
    { type: 'fee-report',   label: 'Fee Report',     icon: <IconChartBar size={20} />, color: 'indigo', desc: 'Fee collection summary' },
    { type: 'table',        label: 'Table Report',   icon: <IconTable size={20} />,    color: 'grape',  desc: 'Generic tabular report demo' },
  ];

  return (
    <Container size="xl" py="md">
      <Group mb={4}>
        <Title order={2}>PDF Generator Hub</Title>
        <Badge color="teal" variant="light">8 Document Types</Badge>
      </Group>
      <Text c="dimmed" mb="lg" size="sm">
        Generate professional PDFs for fee challans, report cards, certificates, salary slips, and more.
      </Text>

      <Alert color="blue" mb="xl" icon={<IconFileText size={16} />}>
        All PDFs are generated client-side using jsPDF — no server round-trip required for the actual PDF creation.
      </Alert>

      {/* Student PDFs */}
      <Card withBorder radius="md" mb="xl" p="xl">
        <Group mb="md">
          <IconUsers size={20} />
          <Text fw={700} size="lg">Student Documents</Text>
        </Group>
        <Select
          label="Select Student"
          placeholder="Choose a student..."
          data={students}
          searchable
          value={selectedStudent}
          onChange={setSelectedStudent}
          mb="md"
          w={400}
        />
        <Grid>
          {studentPDFs.map(p => (
            <Grid.Col key={p.type} span={{ base: 12, sm: 4 }}>
              <Card withBorder radius="md" p="md">
                <Stack gap="xs">
                  <Group>
                    <Text c={p.color}>{p.icon}</Text>
                    <Text fw={600}>{p.label}</Text>
                  </Group>
                  <Text size="xs" c="dimmed">{p.desc}</Text>
                  <Button
                    variant="light" color={p.color} size="sm" fullWidth
                    leftSection={<IconDownload size={14} />}
                    loading={loading === p.type}
                    onClick={() => downloadPDF(p.type, p.label)}
                  >
                    Download PDF
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Card>

      {/* Staff PDFs */}
      <Card withBorder radius="md" mb="xl" p="xl">
        <Group mb="md">
          <IconFileText size={20} />
          <Text fw={700} size="lg">Staff Documents</Text>
        </Group>
        <Select
          label="Select Staff Member"
          placeholder="Choose a staff member..."
          data={staff}
          searchable
          value={selectedStaff}
          onChange={setSelectedStaff}
          mb="md"
          w={400}
        />
        <Grid>
          {staffPDFs.map(p => (
            <Grid.Col key={p.type} span={{ base: 12, sm: 4 }}>
              <Card withBorder radius="md" p="md">
                <Stack gap="xs">
                  <Group>
                    <Text c={p.color}>{p.icon}</Text>
                    <Text fw={600}>{p.label}</Text>
                  </Group>
                  <Text size="xs" c="dimmed">{p.desc}</Text>
                  <Button
                    variant="light" color={p.color} size="sm" fullWidth
                    leftSection={<IconDownload size={14} />}
                    loading={loading === p.type}
                    onClick={() => downloadPDF(p.type, p.label)}
                  >
                    Download PDF
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Card>

      {/* General Reports */}
      <Card withBorder radius="md" p="xl">
        <Group mb="md">
          <IconChartBar size={20} />
          <Text fw={700} size="lg">General Reports</Text>
          <Badge variant="outline" size="sm">No selection needed</Badge>
        </Group>
        <Grid>
          {generalPDFs.map(p => (
            <Grid.Col key={p.type} span={{ base: 12, sm: 3 }}>
              <Card withBorder radius="md" p="md">
                <Stack gap="xs">
                  <Group>
                    <Text c={p.color}>{p.icon}</Text>
                    <Text fw={600} size="sm">{p.label}</Text>
                  </Group>
                  <Text size="xs" c="dimmed">{p.desc}</Text>
                  <Button
                    variant="light" color={p.color} size="sm" fullWidth
                    leftSection={<IconDownload size={14} />}
                    loading={loading === p.type}
                    onClick={() => downloadPDF(p.type, p.label)}
                  >
                    Generate
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Card>
    </Container>
  );
}
