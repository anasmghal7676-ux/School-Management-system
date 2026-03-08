'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ScrollArea, Tooltip, Box, Text, UnstyledButton, Divider,
} from '@mantine/core';
import {
  IconLayoutDashboard, IconUsers, IconSchool, IconBuildingCommunity,
  IconList, IconCalendarCheck, IconTrendingUp, IconFileText,
  IconPencil, IconAward, IconBook, IconStar, IconCurrencyDollar,
  IconChartBar, IconUserCircle, IconCash, IconCalendarX,
  IconCalendarStats, IconBuilding, IconReceipt,
  IconPackage, IconAlertTriangle, IconBell,
  IconSpeakerphone, IconShield, IconSettings, IconDatabase,
  IconChartPie, IconCloudUpload, IconChevronLeft, IconChevronRight,
  IconBus, IconBooks, IconTool, IconChartLine,
  IconArrowsLeftRight, IconMessageCircle,
  IconFlask, IconCalendarEvent, IconIdBadge, IconClipboardCheck,
  IconShieldCheck, IconNews, IconBellRinging,
  IconToolsKitchen, IconSignature, IconMessageDots,
  IconUserCheck, IconClipboardList, IconHeartHandshake,
  IconSchoolBell, IconRobot, IconBuildingStore, IconDeviceTv,
  IconCertificate, IconMicrophone, IconMap, IconCategory,
  IconTimeline, IconReportAnalytics, IconUserPlus, IconCoin,
  IconTag, IconBrandStripe, IconListCheck, IconMessages,
  IconClock, IconHandOff, IconUserMinus, IconRoute,
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
  badge?: string;
}

interface NavGroup {
  title: string;
  emoji: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: 'Main',
    emoji: '🏠',
    items: [
      { title: 'Dashboard', url: '/', icon: IconLayoutDashboard },
    ],
  },
  {
    title: 'Academics',
    emoji: '📚',
    items: [
      { title: 'Students', url: '/students', icon: IconUsers },
      { title: 'Admissions', url: '/admission', icon: IconUserPlus },
      { title: 'Admission Form', url: '/adm-form', icon: IconSignature },
      { title: 'Classes', url: '/classes', icon: IconBuildingCommunity },
      { title: 'Sections', url: '/sections', icon: IconList },
      { title: 'Subjects', url: '/subjects', icon: IconBooks },
      { title: 'Timetable', url: '/timetable', icon: IconCalendarEvent },
      { title: 'Attendance', url: '/attendance', icon: IconCalendarCheck },
      { title: 'Att. Reports', url: '/att-reports', icon: IconTrendingUp },
      { title: 'Homework', url: '/homework', icon: IconBook },
      { title: 'Exams', url: '/exams', icon: IconFileText },
      { title: 'Mark Entry', url: '/marks', icon: IconPencil },
      { title: 'Grade Scales', url: '/grade-scales', icon: IconStar },
      { title: 'Grade Book', url: '/grade-book', icon: IconChartBar },
      { title: 'Report Cards', url: '/rpt-cards', icon: IconAward },
      { title: 'Academic Years', url: '/acad-years', icon: IconCalendarStats },
      { title: 'Acad. Sessions', url: '/acad-session', icon: IconTimeline },
      { title: 'Acad. Planner', url: '/acad-planner', icon: IconCalendarEvent },
      { title: 'Certificates', url: '/certificates', icon: IconCertificate },
      { title: 'Cert. Builder', url: '/cert-builder', icon: IconSignature },
      { title: 'Alumni', url: '/alumni', icon: IconSchool },
      { title: 'Behavior', url: '/behavior', icon: IconClipboardList },
      { title: 'Counseling', url: '/counseling', icon: IconHeartHandshake },
      { title: 'Achievements', url: '/achievements', icon: IconAward },
    ],
  },
  {
    title: 'Staff & HR',
    emoji: '👥',
    items: [
      { title: 'Staff', url: '/staff', icon: IconUserCircle },
      { title: 'Departments', url: '/departments', icon: IconBuilding },
      { title: 'Staff Attendance', url: '/staff-att', icon: IconCalendarCheck },
      { title: 'Leave Requests', url: '/leaves', icon: IconCalendarX },
      { title: 'Payroll', url: '/payroll', icon: IconCash },
      { title: 'Salary Slips', url: '/salary-slips', icon: IconReceipt },
      { title: 'Appraisals', url: '/appraisals', icon: IconAward },
      { title: 'PTM', url: '/ptm', icon: IconMessages },
    ],
  },
  {
    title: 'Finance',
    emoji: '💰',
    items: [
      { title: 'Fee Collection', url: '/fees/collection', icon: IconCurrencyDollar },
      { title: 'Fee Structure', url: '/fees/structure', icon: IconChartBar },
      { title: 'Fee Discounts', url: '/fee-discount', icon: IconHandOff },
      { title: 'Fee Defaulters', url: '/fee-default', icon: IconUserMinus },
      { title: 'Bulk Fees', url: '/bulk-fees', icon: IconListCheck },
      { title: 'Accounting', url: '/accounting', icon: IconBrandStripe },
      { title: 'Accounts', url: '/accounts', icon: IconCoin },
      { title: 'Expenses', url: '/expenses', icon: IconReceipt },
      { title: 'Budget', url: '/budget', icon: IconChartPie },
      { title: 'Finance Dashboard', url: '/fin-dash', icon: IconChartLine },
    ],
  },
  {
    title: 'Facilities',
    emoji: '🏫',
    items: [
      { title: 'Library', url: '/library', icon: IconBooks },
      { title: 'Transport', url: '/transport', icon: IconBus },
      { title: 'Routes', url: '/routes', icon: IconRoute },
      { title: 'Hostel', url: '/hostel', icon: IconBuildingCommunity },
      { title: 'Hostel Att.', url: '/hostel-att', icon: IconCalendarCheck },
      { title: 'Lab Mgmt', url: '/lab-mgmt', icon: IconFlask },
      { title: 'Inventory', url: '/inventory', icon: IconPackage },
      { title: 'Assets', url: '/assets', icon: IconDatabase },
      { title: 'Asset Tracking', url: '/assets-track', icon: IconMap },
      { title: 'Canteen', url: '/canteen', icon: IconToolsKitchen },
    ],
  },
  {
    title: 'Communication',
    emoji: '📣',
    items: [
      { title: 'Notices', url: '/notices', icon: IconSpeakerphone },
      { title: 'Notice Board', url: '/notice-board', icon: IconBell },
      { title: 'Events', url: '/events', icon: IconCalendarEvent },
      { title: 'Broadcast', url: '/broadcast', icon: IconMessageDots },
      { title: 'Meetings', url: '/meetings', icon: IconMicrophone },
      { title: 'Notifications', url: '/notifs', icon: IconBellRinging },
    ],
  },
  {
    title: 'Reports',
    emoji: '📊',
    items: [
      { title: 'Analytics', url: '/analytics', icon: IconChartBar },
      { title: 'Reports', url: '/reports', icon: IconReportAnalytics },
      { title: 'Bulk Import', url: '/bulk-import', icon: IconCloudUpload },
    ],
  },
  {
    title: 'Administration',
    emoji: '⚙️',
    items: [
      { title: 'Users', url: '/users', icon: IconUsers },
      { title: 'Roles', url: '/roles', icon: IconShield },
      { title: 'Settings', url: '/settings', icon: IconSettings },
      { title: 'School Profile', url: '/school-profile', icon: IconBuilding },
      { title: 'Audit Logs', url: '/audit-logs', icon: IconClipboardCheck },
      { title: 'System Health', url: '/sys-health', icon: IconShieldCheck },
      { title: 'Backup', url: '/backup', icon: IconCloudUpload },
      { title: 'CCTV Log', url: '/cctv-log', icon: IconDeviceTv },
    ],
  },
];

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Main: true, Academics: true, 'Staff & HR': false, Finance: false,
    Facilities: false, Communication: false, Reports: false, Administration: false,
  });

  const toggleGroup = (title: string) => {
    if (collapsed) return;
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <Box className={classes.sidebar} data-collapsed={collapsed}>
      {/* Logo */}
      <Box className={classes.logoWrap}>
        <Box className={classes.logoIcon}>
          <IconSchool size={22} color="white" />
        </Box>
        {!collapsed && (
          <Box>
            <Text className={classes.logoName}>EduMaster</Text>
            <Text className={classes.logoTagline}>School ERP</Text>
          </Box>
        )}
      </Box>

      <Divider color="rgba(255,255,255,0.08)" mx="sm" />

      {/* Nav */}
      <ScrollArea flex={1} scrollbarSize={4} type="hover">
        <Box py="xs" px={collapsed ? 4 : 8}>
          {NAV.map((group) => (
            <Box key={group.title} mb={4}>
              {collapsed ? (
                // Collapsed: just icons with tooltips
                <Box>
                  {group.title !== 'Main' && (
                    <Tooltip label={group.title} position="right" withArrow>
                      <Text className={classes.groupDividerCollapsed}>
                        {group.emoji}
                      </Text>
                    </Tooltip>
                  )}
                  {group.items.map((item) => {
                    const active = pathname === item.url;
                    const Icon = item.icon;
                    return (
                      <Tooltip key={item.url} label={item.title} position="right" withArrow>
                        <UnstyledButton
                          component={Link}
                          href={item.url}
                          className={classes.navItem}
                          data-active={active}
                        >
                          <Icon size={18} className={classes.navIcon} />
                        </UnstyledButton>
                      </Tooltip>
                    );
                  })}
                </Box>
              ) : (
                // Expanded: full nav with groups
                <Box>
                  <UnstyledButton
                    className={classes.groupHeader}
                    onClick={() => toggleGroup(group.title)}
                  >
                    <Text className={classes.groupTitle}>
                      <span>{group.emoji}</span>
                      <span>{group.title.toUpperCase()}</span>
                    </Text>
                    <Box
                      className={classes.groupChevron}
                      data-open={openGroups[group.title]}
                    >
                      <IconChevronRight size={12} />
                    </Box>
                  </UnstyledButton>

                  {openGroups[group.title] && (
                    <Box>
                      {group.items.map((item) => {
                        const active = pathname === item.url;
                        const Icon = item.icon;
                        return (
                          <UnstyledButton
                            key={item.url}
                            component={Link}
                            href={item.url}
                            className={classes.navItem}
                            data-active={active}
                          >
                            <Icon size={16} className={classes.navIcon} />
                            <Text className={classes.navLabel}>{item.title}</Text>
                            {item.badge && (
                              <Text className={classes.navBadge}>{item.badge}</Text>
                            )}
                          </UnstyledButton>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </ScrollArea>

      {/* Footer */}
      <Divider color="rgba(255,255,255,0.08)" mx="sm" />
      <Box className={classes.footer}>
        {!collapsed && (
          <Box className={classes.userInfo}>
            <Box className={classes.userAvatar}>AD</Box>
            <Box>
              <Text className={classes.userName}>Administrator</Text>
              <Text className={classes.userRole}>Super Admin</Text>
            </Box>
          </Box>
        )}
        <Tooltip label={collapsed ? 'Expand' : 'Collapse'} position="right">
          <UnstyledButton className={classes.collapseBtn} onClick={onToggleCollapse}>
            {collapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
          </UnstyledButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
