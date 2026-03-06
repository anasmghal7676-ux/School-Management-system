'use client';

import { useState, useEffect } from 'react';
import { AppShell, Box, Transition } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardShellProps {
  children: React.ReactNode;
}

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed';

export function DashboardShell({ children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved !== null) setCollapsed(saved === 'true');
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
  };

  const sidebarWidth = collapsed ? 68 : 260;

  return (
    <AppShell
      navbar={{
        width: sidebarWidth,
        breakpoint: 'md',
        collapsed: { mobile: !mobileOpened },
      }}
      padding={0}
      styles={{
        navbar: {
          transition: 'width 200ms ease',
          overflow: 'hidden',
        },
        main: {
          transition: 'padding-left 200ms ease',
          background: 'var(--mantine-color-gray-0)',
          minHeight: '100vh',
        },
      }}
    >
      <AppShell.Navbar p={0}>
        <Sidebar collapsed={collapsed} onToggleCollapse={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            closeMobile();
          } else {
            toggleCollapsed();
          }
        }} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Topbar onMenuToggle={toggleMobile} />
          <Box p={{ base: 'sm', sm: 'md', lg: 'lg' }} style={{ flex: 1 }}>
            {children}
          </Box>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
