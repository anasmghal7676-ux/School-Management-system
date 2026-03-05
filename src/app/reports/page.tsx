'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Users, DollarSign, Calendar, BookOpen, GraduationCap, BarChart3, PieChart, Loader2, AlertCircle as Alert, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateTableReport } from '@/lib/pdf-generator';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('students');
  const [generating, setGenerating] = useState(false);
  const [reportParams, setReportParams] = useState({
    reportType: '',
    classId: '',
    sectionId: '',
    startDate: '',
    endDate: '',
    examId: '',
    monthYear: '',
  });
  const [result, setResult] = useState<{ title: string; columns: string[]; rows: any[]; summary?: any } | null>(null);
  const [classes, setClasses]   = useState<any[]>([]);
  const [exams, setExams]       = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/classes?limit=100').then(r => r.json()).then(j => { if (j.success) setClasses(j.data?.classes || j.data || []); });
    fetch('/api/exams?limit=50').then(r => r.json()).then(j => { if (j.success) setExams(j.data?.exams || j.data || []); });
  }, []);

  const sp = (k: string, v: string) => setReportParams(prev => ({ ...prev, [k]: v }));

  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    return { value: `${currentYear}-${String(i+1).padStart(2,'0')}`, label: d.toLocaleString('en', { month: 'long', year: 'numeric' }) };
  });

  const reportTypes = {
    students: [
      { id: 'student_list', name: 'Student List', icon: Users },
      { id: 'student_attendance', name: 'Attendance Report', icon: Calendar },
      { id: 'student_performance', name: 'Performance Report', icon: BarChart3 },
      { id: 'student_details', name: 'Student Details', icon: FileText },
    ],
    fees: [
      { id: 'fee_collection', name: 'Fee Collection', icon: DollarSign },
      { id: 'fee_defaulter', name: 'Fee Defaulters', icon: Alert },
      { id: 'fee_summary', name: 'Fee Summary', icon: PieChart },
      { id: 'daily_collection', name: 'Daily Collection', icon: Calendar },
    ],
    academics: [
      { id: 'exam_results', name: 'Exam Results', icon: GraduationCap },
      { id: 'class_performance', name: 'Class Performance', icon: BarChart3 },
      { id: 'subject_performance', name: 'Subject Performance', icon: BookOpen },
      { id: 'report_cards', name: 'Report Cards', icon: FileText },
    ],
    staff: [
      { id: 'staff_list', name: 'Staff List', icon: Users },
      { id: 'staff_attendance', name: 'Staff Attendance', icon: Calendar },
      { id: 'staff_payroll', name: 'Payroll Report', icon: DollarSign },
      { id: 'staff_performance', name: 'Staff Performance', icon: BarChart3 },
    ],
    inventory: [
      { id: 'inventory_stock', name: 'Stock Report', icon: Package },
      { id: 'inventory_transactions', name: 'Transactions', icon: FileText },
      { id: 'low_stock', name: 'Low Stock Items', icon: Alert },
      { id: 'purchase_history', name: 'Purchase History', icon: Calendar },
    ],
    library: [
      { id: 'library_books', name: 'Book Catalog', icon: BookOpen },
      { id: 'library_issued', name: 'Issued Books', icon: Users },
      { id: 'library_overdue', name: 'Overdue Books', icon: Alert },
      { id: 'library_fines', name: 'Fine Collection', icon: DollarSign },
    ],
  };

  const handleGenerateReport = async () => {
    if (!reportParams.reportType) {
      toast({
        title: 'Error',
        description: 'Please select a report type',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setResult(null);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: reportParams.reportType, ...reportParams }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        toast({ title: 'Report generated', description: `${data.data.rows.length} rows` });
      } else {
        throw new Error(data.message || 'Failed');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const exportCSV = () => {
    if (!result) return;
    const rows = [result.columns, ...result.rows.map(row => result.columns.map(c => String(row[c] ?? '')))];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `${(result.title || 'report').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const handleDownloadReport = (reportId: string, format: 'pdf' | 'excel') => {
    toast({ title: 'Tip', description: 'Use Generate Report above for live data exports' });
  };

  return (
    <div className="flex-1 space-y-6 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            Generate and download various reports
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Students
          </TabsTrigger>
          <TabsTrigger value="fees">
            <DollarSign className="h-4 w-4 mr-2" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="academics">
            <GraduationCap className="h-4 w-4 mr-2" />
            Academics
          </TabsTrigger>
          <TabsTrigger value="staff">
            <FileText className="h-4 w-4 mr-2" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="library">
            <BookOpen className="h-4 w-4 mr-2" />
            Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Reports</CardTitle>
              <CardDescription>
                Generate student-related reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select
                    value={reportParams.reportType}
                    onValueChange={(value) =>
                      setReportParams({ ...reportParams, reportType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.students.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classId">Class (Optional)</Label>
                    <Select
                      value={reportParams.classId}
                      onValueChange={(value) =>
                        setReportParams({ ...reportParams, classId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        <SelectItem value="9">9th Class</SelectItem>
                        <SelectItem value="10">10th Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sectionId">Section (Optional)</Label>
                    <Select
                      value={reportParams.sectionId}
                      onValueChange={(value) =>
                        setReportParams({ ...reportParams, sectionId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        <SelectItem value="A">Section A</SelectItem>
                        <SelectItem value="B">Section B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={reportParams.startDate}
                      onChange={(e) =>
                        setReportParams({ ...reportParams, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={reportParams.endDate}
                      onChange={(e) =>
                        setReportParams({ ...reportParams, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {generating ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Quick access to recently generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent reports</p>
                <p className="text-sm mt-2">
                  Generated reports will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Fee Reports</CardTitle>
              <CardDescription>
                Generate fee-related reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select
                    value={reportParams.reportType}
                    onValueChange={(value) =>
                      setReportParams({ ...reportParams, reportType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.fees.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthYear">Month/Year</Label>
                  <Input
                    id="monthYear"
                    type="month"
                    value={reportParams.monthYear}
                    onChange={(e) =>
                      setReportParams({ ...reportParams, monthYear: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={generating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                {generating ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academics">
          <Card>
            <CardHeader>
              <CardTitle>Academic Reports</CardTitle>
              <CardDescription>
                Generate academic performance reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select
                    value={reportParams.reportType}
                    onValueChange={(value) =>
                      setReportParams({ ...reportParams, reportType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.academics.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examId">Exam</Label>
                  <Select
                    value={reportParams.examId}
                    onValueChange={(value) =>
                      setReportParams({ ...reportParams, examId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mid-term">Mid-Term</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                      <SelectItem value="send-up">Send-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={generating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                {generating ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff Reports</CardTitle>
              <CardDescription>
                Generate staff-related reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  value={reportParams.reportType}
                  onValueChange={(value) =>
                    setReportParams({ ...reportParams, reportType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.staff.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={reportParams.startDate}
                    onChange={(e) =>
                      setReportParams({ ...reportParams, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={reportParams.endDate}
                    onChange={(e) =>
                      setReportParams({ ...reportParams, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={generating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                {generating ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Reports</CardTitle>
              <CardDescription>
                Generate inventory-related reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  value={reportParams.reportType}
                  onValueChange={(value) =>
                    setReportParams({ ...reportParams, reportType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.inventory.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={generating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                {generating ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library">
          <Card>
            <CardHeader>
              <CardTitle>Library Reports</CardTitle>
              <CardDescription>
                Generate library-related reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  value={reportParams.reportType}
                  onValueChange={(value) =>
                    setReportParams({ ...reportParams, reportType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.library.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {generating ? 'Generating...' : 'Generate Report'}
                </Button>
                {result && (
                  <Button variant="outline" onClick={exportCSV}>
                    <Download className="h-4 w-4 mr-2" />Export CSV
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Display */}
      {generating && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-3 text-muted-foreground" />
            <span className="text-muted-foreground">Generating report...</span>
          </CardContent>
        </Card>
      )}
      {result && !generating && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{result.title}</CardTitle>
                <CardDescription>
                  {result.rows.length} rows
                  {result.summary?.totalCollected && ` · Total Collected: PKR ${result.summary.totalCollected.toLocaleString()}`}
                  {result.summary?.totalNet && ` · Total Net Payroll: PKR ${result.summary.totalNet.toLocaleString()}`}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5 mr-2" />Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {result.rows.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mb-3" />
                <p>No data found for selected parameters</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {result.columns.map(col => (
                        <th key={col} className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap border-b">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.slice(0, 100).map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        {result.columns.map(col => (
                          <td key={col} className="px-3 py-2 whitespace-nowrap">{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.rows.length > 100 && (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center border-t">
                    Showing first 100 of {result.rows.length} rows — Export CSV to see all
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
