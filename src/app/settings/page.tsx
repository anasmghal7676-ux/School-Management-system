'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save, School, Calendar, DollarSign, Bell, Settings as SettingsIcon, Shield, Database, Globe, Mail, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Gilgit-Baltistan',
  'Azad Kashmir',
  'Federal',
];

const BOARDS = ['BISE', 'Federal Board', 'Cambridge', 'Oxford', 'Other'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState({
    name: 'Main Campus',
    code: 'MAIN',
    address: '123 Education Street',
    city: 'Karachi',
    province: 'Sindh',
    postalCode: '75000',
    phone: '+92-21-1234567',
    email: 'info@school.edu.pk',
    website: 'https://school.edu.pk',
    principalName: '',
    motto: '',
    affiliation: 'BISE Karachi',
    board: 'Sindh',
    academicYearStart: 4,
    schoolType: 'Private',
    mediumOfInstruction: 'English',
  });

  const [academicSettings, setAcademicSettings] = useState({
    currentAcademicYear: '2024-25',
    yearStartDate: '',
    yearEndDate: '',
    attendancePercentage: 75,
    passingPercentage: 33,
    maxMarks: 100,
    graceMarks: 0,
  });

  const [feeSettings, setFeeSettings] = useState({
    lateFeePerDay: 50,
    gracePeriodDays: 5,
    fineAfterMonths: 3,
    monthlyDueDate: 10,
    admissionFee: 5000,
    annualCharges: 2000,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    attendanceAlerts: true,
    feeReminders: true,
    examResults: true,
    announcements: true,
  });

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolSettings),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'School settings saved successfully',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAcademic = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(academicSettings),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Academic settings saved successfully',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFee = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeSettings),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Fee settings saved successfully',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/notifs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationSettings),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Notification settings saved successfully',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure school settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <School className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="academic">
            <Calendar className="h-4 w-4 mr-2" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="fees">
            <DollarSign className="h-4 w-4 mr-2" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="notifs">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="gateway">
            <Globe className="h-4 w-4 mr-2" />
            Gateway
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>School Information</CardTitle>
              <CardDescription>
                Update your school's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name *</Label>
                  <Input
                    id="schoolName"
                    value={schoolSettings.name}
                    onChange={(e) =>
                      setSchoolSettings({ ...schoolSettings, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolCode">School Code *</Label>
                  <Input
                    id="schoolCode"
                    value={schoolSettings.code}
                    onChange={(e) =>
                      setSchoolSettings({ ...schoolSettings, code: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={schoolSettings.address}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, address: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={schoolSettings.city}
                    onChange={(e) =>
                      setSchoolSettings({ ...schoolSettings, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province *</Label>
                  <Select
                    value={schoolSettings.province}
                    onValueChange={(value) =>
                      setSchoolSettings({ ...schoolSettings, province: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={schoolSettings.postalCode}
                    onChange={(e) =>
                      setSchoolSettings({ ...schoolSettings, postalCode: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={schoolSettings.phone}
                    onChange={(e) =>
                      setSchoolSettings({ ...schoolSettings, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={schoolSettings.email}
                    onChange={(e) =>
                      setSchoolSettings({ ...schoolSettings, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={schoolSettings.website}
                    onChange={(e) =>
                      setSchoolSettings({ ...schoolSettings, website: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="principalName">Principal Name</Label>
                  <Input
                    id="principalName"
                    value={schoolSettings.principalName}
                    onChange={(e) =>
                      setSchoolSettings({ ...schoolSettings, principalName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motto">School Motto</Label>
                <Input
                  id="motto"
                  value={schoolSettings.motto}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, motto: e.target.value })
                }
                  placeholder="Enter school motto"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="affiliation">Affiliation</Label>
                  <Select
                    value={schoolSettings.affiliation}
                    onValueChange={(value) =>
                      setSchoolSettings({ ...schoolSettings, affiliation: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOARDS.map((board) => (
                        <SelectItem key={board} value={board}>
                          {board}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="board">Board</Label>
                  <Select
                    value={schoolSettings.board}
                    onValueChange={(value) =>
                      setSchoolSettings({ ...schoolSettings, board: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academicYearStart">Academic Year Starts</Label>
                  <Select
                    value={schoolSettings.academicYearStart.toString()}
                    onValueChange={(value) =>
                      setSchoolSettings({
                        ...schoolSettings,
                        academicYearStart: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolType">School Type</Label>
                  <Select
                    value={schoolSettings.schoolType}
                    onValueChange={(value) =>
                      setSchoolSettings({ ...schoolSettings, schoolType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Private">Private</SelectItem>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Semi-Government">
                        Semi-Government
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mediumOfInstruction">Medium of Instruction</Label>
                  <Select
                    value={schoolSettings.mediumOfInstruction}
                    onValueChange={(value) =>
                      setSchoolSettings({
                        ...schoolSettings,
                        mediumOfInstruction: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Urdu">Urdu</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveGeneral}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle>Academic Settings</CardTitle>
              <CardDescription>
                Configure academic year and grading policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Current Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={academicSettings.currentAcademicYear}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        currentAcademicYear: e.target.value,
                      })
                    }
                    placeholder="2024-25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearStartDate">Academic Year Start Date</Label>
                  <Input
                    id="yearStartDate"
                    type="date"
                    value={academicSettings.yearStartDate}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        yearStartDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearEndDate">Academic Year End Date</Label>
                <Input
                  id="yearEndDate"
                  type="date"
                  value={academicSettings.yearEndDate}
                  onChange={(e) =>
                    setAcademicSettings({
                      ...academicSettings,
                      yearEndDate: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="attendancePercentage">Required Attendance (%)</Label>
                  <Input
                    id="attendancePercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={academicSettings.attendancePercentage}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        attendancePercentage: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingPercentage">Passing Percentage (%)</Label>
                  <Input
                    id="passingPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={academicSettings.passingPercentage}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        passingPercentage: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxMarks">Maximum Marks</Label>
                  <Input
                    id="maxMarks"
                    type="number"
                    min="0"
                    value={academicSettings.maxMarks}
                    onChange={(e) =>
                      setAcademicSettings({
                        ...academicSettings,
                        maxMarks: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="graceMarks">Grace Marks</Label>
                <Input
                  id="graceMarks"
                  type="number"
                  min="0"
                  value={academicSettings.graceMarks}
                  onChange={(e) =>
                    setAcademicSettings({
                      ...academicSettings,
                      graceMarks: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAcademic}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Fee Configuration</CardTitle>
              <CardDescription>
                Set up fee structure and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lateFeePerDay">Late Fee Per Day (PKR)</Label>
                  <Input
                    id="lateFeePerDay"
                    type="number"
                    min="0"
                    value={feeSettings.lateFeePerDay}
                    onChange={(e) =>
                      setFeeSettings({
                        ...feeSettings,
                        lateFeePerDay: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gracePeriodDays">Grace Period (Days)</Label>
                  <Input
                    id="gracePeriodDays"
                    type="number"
                    min="0"
                    value={feeSettings.gracePeriodDays}
                    onChange={(e) =>
                      setFeeSettings({
                        ...feeSettings,
                        gracePeriodDays: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fineAfterMonths">Fine After Months</Label>
                  <Input
                    id="fineAfterMonths"
                    type="number"
                    min="0"
                    value={feeSettings.fineAfterMonths}
                    onChange={(e) =>
                      setFeeSettings({
                        ...feeSettings,
                        fineAfterMonths: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyDueDate">Monthly Due Date</Label>
                  <Input
                    id="monthlyDueDate"
                    type="number"
                    min="1"
                    max="31"
                    value={feeSettings.monthlyDueDate}
                    onChange={(e) =>
                      setFeeSettings({
                        ...feeSettings,
                        monthlyDueDate: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admissionFee">Admission Fee (PKR)</Label>
                  <Input
                    id="admissionFee"
                    type="number"
                    min="0"
                    value={feeSettings.admissionFee}
                    onChange={(e) =>
                      setFeeSettings({
                        ...feeSettings,
                        admissionFee: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualCharges">Annual Charges (PKR)</Label>
                <Input
                  id="annualCharges"
                  type="number"
                  min="0"
                  value={feeSettings.annualCharges}
                  onChange={(e) =>
                    setFeeSettings({
                      ...feeSettings,
                      annualCharges: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveFee}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifs">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailEnabled">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    id="emailEnabled"
                    checked={notificationSettings.emailEnabled}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailEnabled: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsEnabled">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    id="smsEnabled"
                    checked={notificationSettings.smsEnabled}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        smsEnabled: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushEnabled">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send in-app push notifications
                    </p>
                  </div>
                  <Switch
                    id="pushEnabled"
                    checked={notificationSettings.pushEnabled}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        pushEnabled: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Notification Types</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="attendanceAlerts">Attendance Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when student attendance is low
                    </p>
                  </div>
                  <Switch
                    id="attendanceAlerts"
                    checked={notificationSettings.attendanceAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        attendanceAlerts: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="feeReminders">Fee Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send fee payment reminders
                    </p>
                  </div>
                  <Switch
                    id="feeReminders"
                    checked={notificationSettings.feeReminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        feeReminders: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="examResults">Exam Results</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when exam results are published
                    </p>
                  </div>
                  <Switch
                    id="examResults"
                    checked={notificationSettings.examResults}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        examResults: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notices">Announcements</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify about new announcements
                    </p>
                  </div>
                  <Switch
                    id="notices"
                    checked={notificationSettings.announcements}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        announcements: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and access control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick links to security features */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer card-hover" onClick={() => window.location.href = '/audit-logs'}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Audit Logs</p>
                      <p className="text-xs text-muted-foreground">View all system activity</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Complete trail of who did what and when across all modules</p>
                  <p className="text-xs text-blue-600 mt-2 font-medium">Open Audit Logs →</p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Session Policy</p>
                      <p className="text-xs text-muted-foreground">Login session settings</p>
                    </div>
                  </div>
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Session Timeout (hours)</Label>
                      <Input className="w-20 h-7 text-sm" type="number" defaultValue="24" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Max Failed Logins</Label>
                      <Input className="w-20 h-7 text-sm" type="number" defaultValue="5" />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Password Policy</p>
                      <p className="text-xs text-muted-foreground">Password requirements</p>
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    {['Minimum 8 characters', 'Require uppercase letter', 'Require number', 'Require special character'].map(rule => (
                      <div key={rule} className="flex items-center gap-2 text-sm">
                        <div className="h-4 w-4 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0">
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Role Management</p>
                      <p className="text-xs text-muted-foreground">User roles and permissions</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {[['Admin', 'Full access to all modules'], ['Teacher', 'Academic modules only'], ['Accountant', 'Finance modules only'], ['Parent', 'Read-only parent portal']].map(([role, desc]) => (
                      <div key={role} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{role}</span>
                        <span className="text-xs text-muted-foreground">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── GATEWAY TAB ───────────────────────────────────────────────── */}
        <TabsContent value="gateway" className="space-y-6">
          {/* SMTP Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />SMTP Email Configuration
              </CardTitle>
              <CardDescription>Configure outgoing email for notifications, fee receipts and reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input id="smtpHost" className="mt-1" placeholder="smtp.gmail.com" defaultValue="" />
                </div>
                <div>
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input id="smtpPort" className="mt-1" type="number" placeholder="587" defaultValue="587" />
                </div>
                <div>
                  <Label htmlFor="smtpUser">Username / Email</Label>
                  <Input id="smtpUser" className="mt-1" type="email" placeholder="noreply@school.edu.pk" />
                </div>
                <div>
                  <Label htmlFor="smtpPass">Password / App Password</Label>
                  <Input id="smtpPass" className="mt-1" type="password" placeholder="••••••••••••" />
                </div>
                <div>
                  <Label htmlFor="smtpFrom">From Name</Label>
                  <Input id="smtpFrom" className="mt-1" placeholder="My School System" />
                </div>
                <div>
                  <Label htmlFor="smtpEnc">Encryption</Label>
                  <select id="smtpEnc" className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="TLS">STARTTLS (port 587)</option>
                    <option value="SSL">SSL/TLS (port 465)</option>
                    <option value="None">None (port 25)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm">
                  <Globe className="mr-2 h-4 w-4" />Test Connection
                </Button>
                <Button size="sm">Save SMTP Settings</Button>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">💡 Gmail Setup</p>
                <p>Use <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">smtp.gmail.com:587</code> with TLS. Generate an <strong>App Password</strong> from your Google Account → Security → 2-Step Verification → App Passwords.</p>
              </div>
            </CardContent>
          </Card>

          {/* SMS Gateway */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />SMS Gateway Configuration
              </CardTitle>
              <CardDescription>Configure SMS provider for attendance alerts, fee reminders and parent notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SMS Provider</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {['Twilio', 'Jazz SMS', 'Telenor', 'Custom API'].map(p => (
                    <label key={p} className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/40 card-hover">
                      <input type="radio" name="smsProvider" value={p} defaultChecked={p === 'Jazz SMS'} className="accent-primary" />
                      <span className="text-sm font-medium">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smsApiKey">API Key / Account SID</Label>
                  <Input id="smsApiKey" className="mt-1" placeholder="Enter API key..." />
                </div>
                <div>
                  <Label htmlFor="smsSecret">API Secret / Auth Token</Label>
                  <Input id="smsSecret" className="mt-1" type="password" placeholder="••••••••••••" />
                </div>
                <div>
                  <Label htmlFor="smsSender">Sender ID / From Number</Label>
                  <Input id="smsSender" className="mt-1" placeholder="SCHOOL or +923001234567" />
                </div>
                <div>
                  <Label htmlFor="smsApiUrl">API Endpoint <span className="text-xs text-muted-foreground">(for Custom API)</span></Label>
                  <Input id="smsApiUrl" className="mt-1" placeholder="https://api.sms.provider.com/send" />
                </div>
              </div>
              <div>
                <Label htmlFor="smsTest">Test SMS — Send to</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="smsTest" placeholder="+923001234567" className="max-w-xs" />
                  <Button variant="outline" size="sm">Send Test SMS</Button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button size="sm">Save SMS Settings</Button>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-xs text-green-700 dark:text-green-300">
                <p className="font-semibold mb-1">📱 Pakistan SMS Providers</p>
                <p>Jazz (Mobilink) Business SMS, Telenor Business, or Twilio work well for Pakistan. Ensure sender ID is registered with PTA for best deliverability.</p>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-green-500 text-xl">💬</span>WhatsApp Business API
              </CardTitle>
              <CardDescription>Send fee reminders and report cards via WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="waToken">Access Token</Label>
                  <Input id="waToken" className="mt-1" type="password" placeholder="Meta Business API token" />
                </div>
                <div>
                  <Label htmlFor="waPhone">Phone Number ID</Label>
                  <Input id="waPhone" className="mt-1" placeholder="Phone number ID from Meta" />
                </div>
                <div>
                  <Label htmlFor="waBusinessId">Business Account ID</Label>
                  <Input id="waBusinessId" className="mt-1" placeholder="WhatsApp Business Account ID" />
                </div>
              </div>
              <Button size="sm" variant="outline">Save WhatsApp Settings</Button>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-xs text-emerald-700 dark:text-emerald-300">
                <p className="font-semibold mb-1">✅ Setup Requirements</p>
                <p>Requires a verified Meta Business account. Create templates for fee reminders and report cards in the WhatsApp Business Manager before use.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
