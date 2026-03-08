'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) setCollapsed(saved === 'true');
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
  };

  const sidebarWidth = collapsed ? 68 : 260;

  if (!mounted) return null;

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
          border: 'none',
        },
        main: {
          transition: 'padding-left 200ms ease',
          background: '#f8fafc',
          minHeight: '100vh',
        },
      }}
    >
      <AppShell.Navbar p={0} style={{ overflow: 'hidden' }}>
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              closeMobile();
            } else {
              toggleCollapsed();
            }
          }}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Topbar onMenuToggle={toggleMobile} />
          <div style={{ flex: 1 }}>
            {children}
          </div>
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
