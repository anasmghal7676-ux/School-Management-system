import { ErrorBoundary } from "@/components/error-boundary";
'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@mantine/core';
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
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved !== null) setCollapsed(saved === 'true');
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next)); } catch {}
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
          transition: 'width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          border: 'none',
        },
        main: {
          transition: 'padding-left 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#f8fafc',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <AppShell.Navbar p={0}>
        <Sidebar
          collapsed={collapsed && mounted}
          onToggleCollapse={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              closeMobile();
            } else {
              toggleCollapsed();
            }
          }}
        />
      </AppShell.Navbar>

      <AppShell.Main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar onMenuToggle={toggleMobile} />
        <div style={{ flex: 1 }}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
