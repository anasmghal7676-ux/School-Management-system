'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  NavLink, ScrollArea, Stack, Group, Text, Avatar,
  Badge, Tooltip, ActionIcon, Box, Divider, UnstyledButton,
} from '@mantine/core';
import {
  IconLayoutDashboard, IconUsers, IconSchool, IconBuildingCommunity,
  IconList, IconCalendarCheck, IconTrendingUp, IconFileText,
  IconPencil, IconAward, IconBook, IconStar, IconCurrencyDollar,
  IconChartBar, IconUserCircle, IconCash, IconCalendarX,
  IconCalendarStats, IconPresentation, IconBuilding, IconBriefcase,
  IconReceipt, IconPackage, IconAlertTriangle, IconHeart,
  IconBell, IconSpeakerphone, IconShield, IconSettings, IconDatabase,
  IconChartPie, IconCloudUpload, IconChevronLeft, IconChevronRight,
  IconLogout, IconBus, IconBooks, IconRoute, IconTool, IconChartLine,
  IconMinus, IconSearch, IconArrowsLeftRight, IconMessageCircle,
  IconGlobe, IconPhone, IconCamera, IconFingerprint, IconFlask,
  IconUserMinus, IconFileCheck, IconDoorEnter, IconCalendarEvent,
  IconIdBadge, IconClipboardCheck, IconCheck, IconArrowUp,
  IconShieldCheck, IconClockHour3, IconNews, IconBellRinging,
  IconToolsKitchen, IconTruck, IconSignature, IconBox, IconMessageDots,
  IconHandOff,
} from '@tabler/icons-react';
import classes from './Sidebar.module.css';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { title: 'Dashboard', url: '/', icon: IconLayoutDashboard },
    ],
  },
  {
    title: 'Academics',
    items: [
      { title: 'Students', url: '/students', icon: IconUsers },
      { title: 'Admission', url: '/admission', icon: IconSchool },
      { title: 'Classes', url: '/classes', icon: IconBuildingCommunity },
      { title: 'Sections', url: '/sections', icon: IconList },
      { title: 'Attendance', url: '/attendance', icon: IconCalendarCheck },
      { title: 'Att. Reports', url: '/att-reports', icon: IconTrendingUp },
      { title: 'Exams', url: '/exams', icon: IconFileText },
      { title: 'Mark Entry', url: '/marks', icon: IconPencil },
      { title: 'Report Cards', url: '/rpt-cards', icon: IconAward },
      { title: 'Timetable', url: '/timetable', icon: IconCalendarEvent },
      { title: 'Homework', url: '/homework', icon: IconBook },
      { title: 'Subjects', url: '/subjects', icon: IconBooks },
      { title: 'Grade Scales', url: '/grade-scales', icon: IconStar },
      { title: 'Academic Years', url: '/acad-years', icon: IconCalendarStats },
      { title: 'Grade Book', url: '/grade-book', icon: IconChartBar },
    ],
  },
  {
    title: 'Staff & HR',
    items: [
      { title: 'Staff', url: '/staff', icon: IconUserCircle },
      { title: 'Payroll', url: '/payroll', icon: IconCash },
      { title: 'Salary Slips', url: '/salary-slips', icon: IconCash },
      { title: 'Leave Requests', url: '/leaves', icon: IconCalendarX },
      { title: 'Staff Attendance', url: '/staff-att', icon: IconCalendarCheck },
      { title: 'Appraisals', url: '/appraisals', icon: IconAward },
      { title: 'Departments', url: '/departments', icon: IconBuilding },
    ],
  },
  {
    title: 'Finance',
    items: [
      { title: 'Fee Collection', url: '/fees/collection', icon: IconCurrencyDollar },
      { title: 'Fee Structure', url: '/fees/structure', icon: IconChartBar },
      { title: 'Fee Discounts', url: '/fee-discount', icon: IconHandOff },
      { title: 'Fee Defaulters', url: '/fee-default', icon: IconUserMinus },
      { title: 'Accounting', url: '/accounting', icon: IconChartBar },
      { title: 'Expenses', url: '/expenses', icon: IconReceipt },
      { title: 'Budget', url: '/budget', icon: IconChartPie },
      { title: 'Financial Dashboard', url: '/fin-dash', icon: IconChartLine },
    ],
  },
  {
    title: 'Support',
    items: [
      { title: 'Library', url: '/library', icon: IconBooks },
      { title: 'Transport', url: '/transport', icon: IconBus },
      { title: 'Hostel', url: '/hostel', icon: IconBuildingCommunity },
      { title: 'Inventory', url: '/inventory', icon: IconPackage },
    ],
  },
  {
    title: 'Communication',
    items: [
      { title: 'Notices', url: '/notices', icon: IconSpeakerphone },
      { title: 'Notice Board', url: '/notice-board', icon: IconBell },
      { title: 'Events', url: '/events', icon: IconCalendarEvent },
      { title: 'PTM', url: '/ptm', icon: IconCalendarCheck },
      { title: 'Broadcast', url: '/broadcast', icon: IconSpeakerphone },
    ],
  },
  {
    title: 'Admin',
    items: [
      { title: 'Users', url: '/users', icon: IconUsers },
      { title: 'Roles', url: '/roles', icon: IconShield },
      { title: 'Settings', url: '/settings', icon: IconSettings },
      { title: 'Audit Logs', url: '/audit-logs', icon: IconFileText },
      { title: 'System Health', url: '/sys-health', icon: IconShieldCheck },
    ],
  },
];

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const isActive = (url: string) => {
    if (url === '/') return pathname === '/';
    return pathname.startsWith(url);
  };

  return (
    <Box h="100%" style={{ display: 'flex', flexDirection: 'column', background: 'var(--mantine-color-body)' }}>
      {/* Header */}
      <Group
        h={56}
        px={collapsed ? 'xs' : 'md'}
        justify={collapsed ? 'center' : 'space-between'}
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}
      >
        {!collapsed && (
          <Group gap="xs">
            <Box
              w={32} h={32}
              bg="blue"
              style={{ borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconSchool size={18} color="white" />
            </Box>
            <Text fw={700} size="sm">EduManage Pro</Text>
          </Group>
        )}
        <Tooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} position="right">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={onToggleCollapse}
          >
            {collapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* Nav */}
      <ScrollArea flex={1} scrollbarSize={4}>
        <Stack gap={0} p="xs">
          {NAV.map((group, gi) => (
            <Box key={group.title} mt={gi > 0 ? 4 : 0}>
              {!collapsed ? (
                <Text
                  size="xs"
                  fw={600}
                  c="dimmed"
                  tt="uppercase"
                  lts={0.5}
                  px={8}
                  py={6}
                  mt={gi > 0 ? 8 : 0}
                >
                  {group.title}
                </Text>
              ) : (
                gi > 0 && <Divider my={6} />
              )}
              <Stack gap={2}>
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  const Icon = item.icon;
                  if (collapsed) {
                    return (
                      <Tooltip key={item.url + item.title} label={item.title} position="right" withArrow>
                        <UnstyledButton
                          component={Link}
                          href={item.url}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            margin: '0 auto',
                            background: active ? 'var(--mantine-color-blue-filled)' : 'transparent',
                            color: active ? 'white' : 'var(--mantine-color-dimmed)',
                            transition: 'all 0.15s ease',
                          }}
                          className={classes.navIcon}
                        >
                          <Icon size={18} />
                        </UnstyledButton>
                      </Tooltip>
                    );
                  }
                  return (
                    <NavLink
                      key={item.url + item.title}
                      component={Link}
                      href={item.url}
                      label={item.title}
                      leftSection={<Icon size={16} />}
                      active={active}
                      variant={active ? 'filled' : 'subtle'}
                      style={{ borderRadius: 8 }}
                    />
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      </ScrollArea>

      {/* Footer */}
      <Box
        p={collapsed ? 'xs' : 'sm'}
        style={{ borderTop: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}
      >
        {collapsed ? (
          <Tooltip label="Sign Out" position="right">
            <ActionIcon
              variant="subtle"
              color="red"
              size="lg"
              mx="auto"
              display="block"
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
            >
              <IconLogout size={18} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
              <Avatar size="sm" color="blue" radius="xl">{initials}</Avatar>
              <Box style={{ minWidth: 0 }}>
                <Text size="xs" fw={600} truncate>{session?.user?.name || 'User'}</Text>
                {session?.user?.role && (
                  <Badge size="xs" variant="light" color="blue">{session.user.role}</Badge>
                )}
              </Box>
            </Group>
            <Tooltip label="Sign Out">
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
              >
                <IconLogout size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Box>
    </Box>
  );
}
