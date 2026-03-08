'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Group, TextInput, ActionIcon, Avatar, Menu, Text, Badge,
  Indicator, Tooltip, Box, UnstyledButton,
} from '@mantine/core';
import {
  IconSearch, IconBell, IconLogout, IconUser, IconSettings,
  IconMenu2, IconChevronDown, IconBellRinging,
} from '@tabler/icons-react';

interface TopbarProps {
  onMenuToggle: () => void;
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/admission': 'Admissions',
  '/adm-form': 'Admission Form',
  '/classes': 'Classes',
  '/sections': 'Sections',
  '/subjects': 'Subjects',
  '/timetable': 'Timetable',
  '/attendance': 'Attendance',
  '/att-reports': 'Attendance Reports',
  '/homework': 'Homework',
  '/exams': 'Examinations',
  '/marks': 'Mark Entry',
  '/grade-scales': 'Grade Scales',
  '/grade-book': 'Grade Book',
  '/rpt-cards': 'Report Cards',
  '/acad-years': 'Academic Years',
  '/acad-session': 'Academic Sessions',
  '/acad-planner': 'Academic Planner',
  '/certificates': 'Certificates',
  '/cert-builder': 'Certificate Builder',
  '/alumni': 'Alumni',
  '/behavior': 'Behavior',
  '/achievements': 'Achievements',
  '/staff': 'Staff',
  '/departments': 'Departments',
  '/staff-att': 'Staff Attendance',
  '/leaves': 'Leave Requests',
  '/payroll': 'Payroll',
  '/salary-slips': 'Salary Slips',
  '/appraisals': 'Appraisals',
  '/ptm': 'Parent Teacher Meeting',
  '/fees/collection': 'Fee Collection',
  '/fees/structure': 'Fee Structure',
  '/fee-discount': 'Fee Discounts',
  '/fee-default': 'Fee Defaulters',
  '/bulk-fees': 'Bulk Fees',
  '/accounting': 'Accounting',
  '/accounts': 'Accounts',
  '/expenses': 'Expenses',
  '/budget': 'Budget',
  '/fin-dash': 'Finance Dashboard',
  '/library': 'Library',
  '/transport': 'Transport',
  '/hostel': 'Hostel',
  '/inventory': 'Inventory',
  '/assets': 'Assets',
  '/assets-track': 'Asset Tracking',
  '/canteen': 'Canteen',
  '/notices': 'Notices',
  '/notice-board': 'Notice Board',
  '/events': 'Events',
  '/broadcast': 'Broadcast',
  '/analytics': 'Analytics',
  '/reports': 'Reports',
  '/bulk-import': 'Bulk Import',
  '/users': 'Users',
  '/roles': 'Roles',
  '/settings': 'Settings',
  '/audit-logs': 'Audit Logs',
  '/sys-health': 'System Health',
  '/backup': 'Backup',
};

const NOTIFICATIONS = [
  { id: 1, title: 'New student admission', time: '5 min ago', color: 'blue', read: false },
  { id: 2, title: 'Fee payment received', time: '1 hr ago', color: 'green', read: false },
  { id: 3, title: 'Staff leave request', time: '2 hrs ago', color: 'orange', read: true },
  { id: 4, title: 'Exam schedule updated', time: '5 hrs ago', color: 'purple', read: true },
];

export function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const pageTitle = BREADCRUMB_MAP[pathname] || 
    pathname.split('/').pop()?.replace(/-/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'Dashboard';
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <Box
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: 20,
        background: 'white',
        borderBottom: '1px solid #f1f5f9',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        gap: 16,
        flexShrink: 0,
      }}
    >
      {/* Left: Menu toggle + Page title */}
      <Group gap={12} style={{ flexShrink: 0 }}>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onMenuToggle}
          size="md"
          style={{ borderRadius: 8 }}
          hiddenFrom="md"
        >
          <IconMenu2 size={18} />
        </ActionIcon>
        <Box>
          <Text
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.2,
              letterSpacing: '-0.2px',
              textTransform: 'capitalize',
            }}
          >
            {pageTitle}
          </Text>
          <Text size="11px" c="dimmed" style={{ lineHeight: 1 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </Box>
      </Group>

      {/* Center: Search */}
      <Box style={{ flex: 1, maxWidth: 380 }} visibleFrom="sm">
        <TextInput
          leftSection={<IconSearch size={14} color="#94a3b8" />}
          placeholder="Search anything..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          size="sm"
          radius="xl"
          style={{ width: '100%' }}
          styles={{
            input: {
              border: '1.5px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: 13,
              height: 36,
              transition: 'all 200ms ease',
              '&:focus': {
                border: '1.5px solid #3b82f6',
                background: 'white',
                boxShadow: '0 0 0 3px rgba(59,130,246,0.08)',
              },
            },
          }}
        />
      </Box>

      {/* Right: Actions */}
      <Group gap={4} style={{ flexShrink: 0 }}>
        {/* Notifications */}
        <Menu shadow="xl" width={300} radius="lg" offset={8} closeOnItemClick={false}>
          <Menu.Target>
            <Tooltip label="Notifications">
              <Indicator
                size={unreadCount > 0 ? 16 : 0}
                color="red"
                label={unreadCount > 0 ? String(unreadCount) : ''}
                offset={4}
                styles={{ indicator: { fontSize: 9, fontWeight: 700, minWidth: 16, height: 16 } }}
              >
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="md"
                  radius="lg"
                  style={{ transition: 'all 150ms ease' }}
                >
                  <IconBell size={17} />
                </ActionIcon>
              </Indicator>
            </Tooltip>
          </Menu.Target>

          <Menu.Dropdown p={0}>
            <Box style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text size="sm" fw={700} c="#0f172a">Notifications</Text>
              {unreadCount > 0 && (
                <UnstyledButton onClick={markAllRead} style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>
                  Mark all read
                </UnstyledButton>
              )}
            </Box>
            {notifications.map(n => (
              <Box
                key={n.id}
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid #f8fafc',
                  cursor: 'pointer',
                  background: n.read ? 'white' : '#f0f7ff',
                  transition: 'background 150ms ease',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <Box
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: n.read ? '#e2e8f0' : '#3b82f6',
                    marginTop: 5, flexShrink: 0,
                  }}
                />
                <Box style={{ flex: 1 }}>
                  <Text size="13px" fw={n.read ? 400 : 600} c="#0f172a" lh={1.3}>{n.title}</Text>
                  <Text size="11px" c="dimmed" mt={2}>{n.time}</Text>
                </Box>
              </Box>
            ))}
            <Box style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
              <Text size="12px" c="#3b82f6" fw={600} component={Link} href="/notifs" style={{ textDecoration: 'none' }}>
                View all notifications
              </Text>
            </Box>
          </Menu.Dropdown>
        </Menu>

        {/* User Menu */}
        <Menu shadow="xl" width={220} radius="md" offset={8}>
          <Menu.Target>
            <UnstyledButton
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 12px 5px 8px',
                borderRadius: 24, border: '1.5px solid #e2e8f0',
                background: '#f8fafc', cursor: 'pointer',
                transition: 'all 150ms ease', marginLeft: 4,
              }}
            >
              <Box
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
                }}
              >
                AD
              </Box>
              <Box visibleFrom="sm">
                <Text style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>Administrator</Text>
                <Text size="10px" c="dimmed" lh={1}>Super Admin</Text>
              </Box>
              <IconChevronDown size={12} color="#94a3b8" />
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item leftSection={<IconUser size={14} />} component={Link} href="/profile">Profile</Menu.Item>
            <Menu.Item leftSection={<IconSettings size={14} />} component={Link} href="/settings">Settings</Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<IconLogout size={14} />} color="red">Sign Out</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Box>
  );
}
