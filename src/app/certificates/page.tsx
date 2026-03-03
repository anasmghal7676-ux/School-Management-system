'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@//components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText, Download, Search, File, Award, GraduationCap,
  Loader2, CheckCircle2, Shield, FileCheck
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Certificate {
  id: string;
  certificateType: string;
  certificateNumber: string;
  issueDate: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  purpose: string | null;
  issuedBy: string | null;
  verifiedBy: string | null;
  filePath: string | null;
}

const CERTIFICATE_TYPES = [
  { id: 'bonafide', name: 'Bonafide Certificate', icon: FileText, description: 'Certificate of school enrollment and good conduct' },
  { id: 'tc', name: 'School Leaving Certificate', icon: GraduationCap, description: 'Transfer certificate for school change' },
  { id: 'character', name: 'Character Certificate', icon: Shield, description: 'Certificate of good character and conduct' },
  { id: 'migration', name: 'Migration Certificate', icon: FileCheck, description: 'Certificate for educational migration' },
];

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [certificateType, setCertificateType] = useState('bonafide');
  const [formData, setFormData] = useState({
    purpose: '',
  });

  useEffect(() => {
    fetchCertificates();
    fetchStudents();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/certificates');
      if (response.ok) {
        const data = await response.json();
        setCertificates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students?limit=300&status=active');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.data?.students || data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast({
        title: 'Error',
        description: 'Please select a student',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          certificateType,
          purpose: formData.purpose,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: 'Certificate generated successfully',
        });
        setDialogOpen(false);
        fetchCertificates();
        setFormData({ purpose: '' });
      } else {
        throw new Error('Failed to generate certificate');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate certificate',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: string) => {
    toast({
      title: 'Downloading...',
      description: 'Certificate will be downloaded as PDF',
    });
    // In real implementation, this would download the PDF
  };

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || cert.certificateType === typeFilter;

    return matchesSearch && matchesType;
  });

  const certificateCounts = {
    total: certificates.length,
    bonafide: certificates.filter((c) => c.certificateType === 'bonafide').length,
    tc: certificates.filter((c) => c.certificateType === 'tc').length,
    character: certificates.filter((c) => c.certificateType === 'character').length,
    migration: certificates.filter((c) => c.certificateType === 'migration').length,
  };

  return (
    <div className="flex-1 space-y-6 p-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Certificate Generation
          </h2>
          <p className="text-muted-foreground">
            Generate and manage student certificates
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            onClick={() => setDialogOpen(true)}
          >
            <Award className="mr-2 h-4 w-4" />
            Generate Certificate
          </Button>
        </motion.div>
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-6 md:grid-cols-5"
      >
        {[
          { title: 'Total Certificates', value: certificateCounts.total, icon: FileText, color: 'blue' },
          { title: 'Bonafide', value: certificateCounts.bonafide, icon: FileText, color: 'indigo' },
          { title: 'School Leaving', value: certificateCounts.tc, icon: GraduationCap, color: 'violet' },
          { title: 'Character', value: certificateCounts.character, icon: Shield, color: 'fuchsia' },
          { title: 'Migration', value: certificateCounts.migration, icon: FileCheck, color: 'pink' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className={`border-l-4 border-l-${stat.color}-500 shadow-sm hover:shadow-md transition-shadow`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Certificate Type Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-6 md:grid-cols-4"
      >
        <AnimatePresence>
          {CERTIFICATE_TYPES.map((cert, index) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="shadow-lg hover:shadow-xl transition-all cursor-pointer group card-hover">
                <CardHeader className="pb-4">
                  <div className={`p-4 rounded-lg bg-gradient-to-br ${cert.id === 'bonafide' ? 'from-blue-500 to-indigo-500' : cert.id === 'tc' ? 'from-purple-500 to-pink-500' : cert.id === 'character' ? 'from-fuchsia-500 to-rose-500' : 'from-orange-500 to-amber-500'} mb-4`}>
                    <cert.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                    {cert.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {cert.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {certificates.filter(c => c.certificateType === cert.id).length} generated
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Certificates Table */}
      <motion.div
        initial={{ opacity: 0, y:20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Issued Certificates</CardTitle>
            <CardDescription>
              View and download all generated certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bonafide">Bonafide</SelectItem>
                  <SelectItem value="tc">School Leaving (TC)</SelectItem>
                  <SelectItem value="character">Character</SelectItem>
                  <SelectItem value="migration">Migration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
                <span className="text-muted-foreground">Loading certificates...</span>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No certificates found</p>
              </div>
            ) : (
              <div className="rounded-md border max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate No.</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredCertificates.map((cert, index) => (
                        <motion.tr
                          key={cert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="font-mono text-sm">
                            {cert.certificateNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {CERTIFICATE_TYPES.find((c) => c.id === cert.certificateType)?.name || cert.certificateType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{cert.studentName}</div>
                              <div className="text-xs text-muted-foreground">{cert.admissionNumber}</div>
                            </div>
                          </TableCell>
                          <TableCell>{cert.className || '-'}</TableCell>
                          <TableCell>
                            {new Date(cert.issueDate).toLocaleDateString('en-PK', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="text-sm text-muted-foreground truncate">
                              {cert.purpose || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(cert.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Generate Certificate Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setSelectedStudent(null);
          setFormData({ purpose: '' });
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate Certificate</DialogTitle>
            <DialogDescription>
              Create and download student certificates
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="certificateType">Certificate Type *</Label>
                <Select
                  value={certificateType}
                  onValueChange={setCertificateType}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select certificate type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CERTIFICATE_TYPES.map((cert) => (
                      <SelectItem key={cert.id} value={cert.id}>
                        {cert.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="student">Select Student *</Label>
                <Input
                  placeholder="Search student by name..."
                  value={studentSearch}
                  onChange={e => {
                    setStudentSearch(e.target.value);
                    if (!e.target.value) setSelectedStudent(null);
                  }}
                />
                {studentSearch && !selectedStudent && (
                  <div className="border rounded-md max-h-40 overflow-y-auto bg-background shadow-md">
                    {students
                      .filter(s =>
                        s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.admissionNumber.includes(studentSearch)
                      )
                      .slice(0, 8)
                      .map(s => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            setSelectedStudent(s);
                            setStudentSearch(`${s.fullName} (${s.admissionNumber})`);
                          }}
                        >
                          <span className="font-medium">{s.fullName}</span>
                          <span className="text-muted-foreground ml-2">{s.admissionNumber}</span>
                          {s.class && <span className="text-muted-foreground ml-2">· {s.class.name}</span>}
                        </button>
                      ))}
                    {students.filter(s =>
                      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.admissionNumber.includes(studentSearch)
                    ).length === 0 && (
                      <p className="px-3 py-2 text-sm text-muted-foreground">No students found</p>
                    )}
                  </div>
                )}
                {selectedStudent && (
                  <div className="flex items-center gap-2 bg-muted/50 rounded px-2 py-1.5 text-sm">
                    <span className="font-medium">{selectedStudent.fullName}</span>
                    <span className="text-muted-foreground">{selectedStudent.admissionNumber}</span>
                    <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}>✕</button>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="purpose">Purpose (Optional)</Label>
                <Textarea
                  id="purpose"
                  placeholder="Enter purpose for certificate..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Preview Certificate</div>
                    <div className="text-muted-foreground text-xs">
                      Certificate will be generated in PDF format
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={generating || !selectedStudent}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Certificate
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
