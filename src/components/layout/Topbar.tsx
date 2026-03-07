'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';

import { useRouter } from 'next/navigation';
import {
  Group, TextInput, ActionIcon, Avatar, Menu, Text, Badge,
  Indicator, Tooltip, Box, UnstyledButton,
} from '@mantine/core';
import {
  IconSearch, IconSun, IconMoon, IconBell, IconLogout,
  IconUser, IconSettings, IconMenu2, IconChevronDown,
} from '@tabler/icons-react';

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { theme, setTheme } = useTheme();

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const initials = 'AD';

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Box
      h={56}
      px="md"
      style={{
        borderBottom: '1px solid var(--mantine-color-default-border)',
        background: 'var(--mantine-color-body)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      <Group h="100%" justify="space-between">
        {/* Left: Menu + Search */}
        <Group gap="sm">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            visibleFrom="md"
            display="none"
            hiddenFrom="md"
            onClick={onMenuToggle}
          >
            <IconMenu2 size={20} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            hiddenFrom="md"
            onClick={onMenuToggle}
          >
            <IconMenu2 size={20} />
          </ActionIcon>

          <TextInput
            placeholder="Search students, staff, fees…"
            leftSection={<IconSearch size={15} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            size="sm"
            radius="xl"
            w={{ base: 160, sm: 260, md: 320 }}
            styles={{
              input: {
                background: 'var(--mantine-color-default)',
                border: '1px solid transparent',
                transition: 'border-color 0.2s',
                '&:focus': {
                  borderColor: 'var(--mantine-color-blue-filled)',
                },
              },
            }}
          />
        </Group>

        {/* Right: Actions */}
        <Group gap={4}>
          {/* Dark Mode */}
          <Tooltip label={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="md"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
          </Tooltip>

          {/* Notifications */}
          <Tooltip label="Notifications">
            <Indicator size={8} color="red" offset={4} processing>
              <ActionIcon variant="subtle" color="gray" size="md">
                <IconBell size={18} />
              </ActionIcon>
            </Indicator>
          </Tooltip>

          {/* User Menu */}
          <Menu shadow="md" width={200} position="bottom-end" withArrow>
            <Menu.Target>
              <UnstyledButton
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 8px',
                  borderRadius: 8,
                  transition: 'background 0.15s',
                  cursor: 'pointer',
                }}
                className="topbar-user-btn"
              >
                <Avatar size="sm" color="blue" radius="xl">{initials}</Avatar>
                <Box visibleFrom="sm">
                  <Text size="xs" fw={600} lh={1.2}>{'Administrator'}</Text>
                  <Badge size="xs" variant="light" color="blue" mt={2}>Super Admin</Badge>
                </Box>
                <IconChevronDown size={14} color="var(--mantine-color-dimmed)" />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>
                <Text size="xs" fw={600}>{'Administrator'}</Text>
                <Text size="xs" c="dimmed" truncate>{'admin@school.com'}</Text>
              </Menu.Label>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconUser size={14} />}
                onClick={() => router.push('/profile')}
              >
                My Profile
              </Menu.Item>
              <Menu.Item
                leftSection={<IconSettings size={14} />}
                onClick={() => router.push('/settings')}
              >
                Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={14} />}
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
              >
                Sign Out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Box>
  );
}
