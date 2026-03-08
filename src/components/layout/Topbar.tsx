'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Group, TextInput, ActionIcon, Avatar, Menu, Text,
  Indicator, Tooltip, Box, UnstyledButton, Kbd, Badge,
} from '@mantine/core';
import {
  IconSearch, IconBell, IconLogout,
  IconUser, IconSettings, IconMenu2, IconChevronDown,
  IconBellRinging, IconSun, IconMoon,
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
  '/behavior': 'Behavior Records',
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

export function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const pageTitle = BREADCRUMB_MAP[pathname]
    || pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase())
    || 'Dashboard';

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Box
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: '16px',
        background: 'white',
        borderBottom: '1px solid #f1f5f9',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
        gap: 12,
      }}
    >
      {/* Left: Menu toggle + Title */}
      <Group gap={12} style={{ flexShrink: 0 }}>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onMenuToggle}
          size="md"
          radius="md"
          hiddenFrom="md"
        >
          <IconMenu2 size={18} />
        </ActionIcon>
        <Box>
          <Text size="sm" fw={700} style={{ color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
            {pageTitle}
          </Text>
          <Text size="10px" c="dimmed" lh={1}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </Box>
      </Group>

      {/* Center: Search */}
      <Box style={{ flex: 1, maxWidth: 420 }} visibleFrom="sm">
        <TextInput
          leftSection={<IconSearch size={14} color="#94a3b8" />}
          rightSection={
            <Box style={{ display: 'flex', gap: 2 }}>
              <Kbd size="xs" style={{ fontSize: 9, padding: '1px 4px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4 }}>⌘</Kbd>
              <Kbd size="xs" style={{ fontSize: 9, padding: '1px 4px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4 }}>K</Kbd>
            </Box>
          }
          placeholder="Search students, staff, fees..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          size="sm"
          radius="xl"
          styles={{
            input: {
              border: '1.5px solid #e8edf3',
              background: '#f8fafc',
              fontSize: 13,
              transition: 'all 200ms ease',
              '&:focus': {
                border: '1.5px solid #3b82f6',
                background: 'white',
                boxShadow: '0 0 0 3px rgba(59,130,246,0.1)',
              },
            },
          }}
        />
      </Box>

      {/* Right: Action buttons */}
      <Group gap={4} style={{ flexShrink: 0 }}>
        {/* Notifications */}
        <Tooltip label="Notifications" withArrow>
          <Indicator size={7} color="red" offset={5} processing>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="md"
              radius="md"
              style={{ transition: 'all 150ms ease' }}
            >
              <IconBell size={17} />
            </ActionIcon>
          </Indicator>
        </Tooltip>

        {/* User Menu */}
        <Menu shadow="xl" width={200} radius="lg" offset={10} withArrow>
          <Menu.Target>
            <UnstyledButton
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 10px 5px 6px',
                borderRadius: 32,
                border: '1.5px solid #e8edf3',
                background: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <Avatar
                size={28}
                radius="xl"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                AD
              </Avatar>
              <Box visibleFrom="sm">
                <Text size="12px" fw={600} c="#0f172a" lh={1.2}>Admin</Text>
                <Text size="10px" c="dimmed" lh={1}>Super Admin</Text>
              </Box>
              <IconChevronDown size={12} color="#94a3b8" />
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Signed in as Admin</Menu.Label>
            <Menu.Item leftSection={<IconUser size={14} />}>
              Profile
            </Menu.Item>
            <Menu.Item leftSection={<IconSettings size={14} />} component="a" href="/settings">
              Settings
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<IconLogout size={14} />} color="red">
              Sign Out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Box>
  );
}
