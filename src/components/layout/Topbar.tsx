'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Group, TextInput, ActionIcon, Menu, Text,
  Indicator, Tooltip, Box, UnstyledButton,
} from '@mantine/core';
import {
  IconSearch, IconBell, IconLogout, IconUser, IconSettings,
  IconMenu2, IconChevronDown,
} from '@tabler/icons-react';

interface TopbarProps { onMenuToggle: () => void; }

const BREADCRUMB_MAP: Record<string, string> = {
  '/': 'Dashboard', '/students': 'Students', '/admission': 'Admissions',
  '/classes': 'Classes', '/sections': 'Sections', '/subjects': 'Subjects',
  '/timetable': 'Timetable', '/attendance': 'Attendance', '/att-reports': 'Attendance Reports',
  '/homework': 'Homework', '/exams': 'Examinations', '/marks': 'Mark Entry',
  '/grade-scales': 'Grade Scales', '/rpt-cards': 'Report Cards', '/acad-years': 'Academic Years',
  '/certificates': 'Certificates', '/alumni': 'Alumni', '/behavior': 'Behavior',
  '/staff': 'Staff', '/departments': 'Departments', '/staff-att': 'Staff Attendance',
  '/leaves': 'Leave Requests', '/payroll': 'Payroll', '/appraisals': 'Appraisals',
  '/fees/collection': 'Fee Collection', '/fees/structure': 'Fee Structure',
  '/fee-discount': 'Fee Discounts', '/bulk-fees': 'Bulk Fees',
  '/accounting': 'Accounting', '/expenses': 'Expenses', '/budget': 'Budget',
  '/library': 'Library', '/transport': 'Transport', '/hostel': 'Hostel',
  '/inventory': 'Inventory', '/notices': 'Notices', '/events': 'Events',
  '/broadcast': 'Broadcast', '/analytics': 'Analytics', '/reports': 'Reports',
  '/users': 'Users', '/settings': 'Settings', '/audit-logs': 'Audit Logs',
  '/notifs': 'Notifications', '/dashboard': 'Dashboard',
};

interface Notification { id: string; title: string; message: string; isRead: boolean; createdAt: string; notificationType?: string; }

export function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  const userId = (session?.user as any)?.id;

  // Load initial notifications
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/notifications?userId=${userId}&limit=10`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setNotifs(d.data || []);
          setUnreadCount(d.unreadCount ?? 0);
        }
      })
      .catch(() => {});
  }, [userId]);

  // SSE stream for live updates
  useEffect(() => {
    if (!userId) return;
    const es = new EventSource(`/api/notifications/stream?userId=${userId}`);
    es.onmessage = (e) => {
      try {
        const { unreadCount: count } = JSON.parse(e.data);
        setUnreadCount(count);
      } catch {}
    };
    esRef.current = es;
    return () => es.close();
  }, [userId]);

  const markAllRead = async () => {
    if (!userId) return;
    await fetch('/api/notifications/all', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, markAllRead: true }) }).catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const pageTitle = BREADCRUMB_MAP[pathname] ||
    pathname.split('/').pop()?.replace(/-/g, ' ')?.replace(/\b\w/g, c => c.toUpperCase()) || 'Dashboard';

  const userName = session?.user?.name || 'Administrator';
  const userInitials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD';
  const userRole = (session?.user as any)?.role || 'Admin';

  return (
    <Box style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 20, background: 'white', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', gap: 16, flexShrink: 0 }}>
      <Group gap={12} style={{ flexShrink: 0 }}>
        <ActionIcon variant="subtle" color="gray" onClick={onMenuToggle} size="md" style={{ borderRadius: 8 }} hiddenFrom="md">
          <IconMenu2 size={18} />
        </ActionIcon>
        <Box>
          <Text style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, textTransform: 'capitalize' }}>{pageTitle}</Text>
          <Text size="11px" c="dimmed" style={{ lineHeight: 1 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
        </Box>
      </Group>

      <Box style={{ flex: 1, maxWidth: 380 }} visibleFrom="sm">
        <TextInput leftSection={<IconSearch size={14} color="#94a3b8" />} placeholder="Search anything..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} size="sm" radius="xl" styles={{ input: { border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: 13, height: 36 } }} />
      </Box>

      <Group gap={4} style={{ flexShrink: 0 }}>
        <Menu shadow="xl" width={300} radius="lg" offset={8} closeOnItemClick={false}>
          <Menu.Target>
            <Tooltip label="Notifications">
              <Indicator size={unreadCount > 0 ? 16 : 0} color="red" label={unreadCount > 0 ? String(Math.min(unreadCount, 99)) : ''} offset={4} styles={{ indicator: { fontSize: 9, fontWeight: 700, minWidth: 16, height: 16 } }}>
                <ActionIcon variant="subtle" color="gray" size="md" radius="lg"><IconBell size={17} /></ActionIcon>
              </Indicator>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown p={0}>
            <Box style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text size="sm" fw={700} c="#0f172a">Notifications</Text>
              {unreadCount > 0 && <UnstyledButton onClick={markAllRead} style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>Mark all read</UnstyledButton>}
            </Box>
            {notifs.length === 0 ? (
              <Box style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Text size="sm" c="dimmed">No notifications yet</Text>
              </Box>
            ) : notifs.slice(0, 8).map(n => (
              <Box key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc', background: n.isRead ? 'white' : '#f0f7ff', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Box style={{ width: 8, height: 8, borderRadius: '50%', background: n.isRead ? '#e2e8f0' : '#3b82f6', marginTop: 5, flexShrink: 0 }} />
                <Box style={{ flex: 1 }}>
                  <Text size="13px" fw={n.isRead ? 400 : 600} c="#0f172a" lh={1.3}>{n.title}</Text>
                  {n.message && <Text size="11px" c="dimmed" mt={1} lineClamp={1}>{n.message}</Text>}
                  <Text size="10px" c="dimmed" mt={2}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </Box>
              </Box>
            ))}
            <Box style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
              <Text size="12px" c="#3b82f6" fw={600} component={Link} href="/notifs" style={{ textDecoration: 'none' }}>View all notifications</Text>
            </Box>
          </Menu.Dropdown>
        </Menu>

        <Menu shadow="xl" width={220} radius="md" offset={8}>
          <Menu.Target>
            <UnstyledButton style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 8px', borderRadius: 24, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', marginLeft: 4 }}>
              <Box style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {userInitials}
              </Box>
              <Box visibleFrom="sm">
                <Text style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>{userName}</Text>
                <Text size="10px" c="dimmed" lh={1} tt="capitalize">{userRole}</Text>
              </Box>
              <IconChevronDown size={12} color="#94a3b8" />
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item leftSection={<IconUser size={14} />} component={Link} href="/profile">Profile</Menu.Item>
            <Menu.Item leftSection={<IconSettings size={14} />} component={Link} href="/settings">Settings</Menu.Item>
            <Menu.Divider />
            <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={() => signOut({ callbackUrl: '/login' })}>Sign Out</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Box>
  );
}
