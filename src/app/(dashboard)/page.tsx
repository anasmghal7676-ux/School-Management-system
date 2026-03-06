'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const MODULES = [
  { name: 'Students', href: '/students', icon: '🎓', color: '#3b82f6' },
  { name: 'Staff', href: '/staff', icon: '👨‍🏫', color: '#8b5cf6' },
  { name: 'Attendance', href: '/attendance', icon: '📋', color: '#10b981' },
  { name: 'Fee Collection', href: '/fee-builder', icon: '💰', color: '#f59e0b' },
  { name: 'Exams', href: '/exams', icon: '📝', color: '#ef4444' },
  { name: 'Timetable', href: '/timetable', icon: '📅', color: '#06b6d4' },
  { name: 'Library', href: '/library', icon: '📚', color: '#84cc16' },
  { name: 'Transport', href: '/transport', icon: '🚌', color: '#f97316' },
  { name: 'Hostel', href: '/hostel', icon: '🏠', color: '#ec4899' },
  { name: 'Payroll', href: '/payroll', icon: '💳', color: '#14b8a6' },
  { name: 'Admissions', href: '/admission', icon: '📄', color: '#a855f7' },
  { name: 'Reports', href: '/analytics', icon: '📊', color: '#64748b' },
];

const STATS = [
  { label: 'Total Students', value: '—', icon: '🎓', color: '#3b82f6' },
  { label: 'Staff Members', value: '—', icon: '👥', color: '#8b5cf6' },
  { label: 'Fee Collected', value: '—', icon: '💰', color: '#10b981' },
  { label: 'Attendance Today', value: '—', icon: '✅', color: '#f59e0b' },
];

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
  }, []);

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>
          {greeting} 👋
        </h1>
        <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '14px' }}>
          Welcome to EduManage Pro — School Management System
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: 'var(--card, #1c1c2e)', border: '1px solid var(--border, #2d2d3d)', borderRadius: '12px', padding: '18px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Modules Grid */}
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Quick Access
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
        {MODULES.map(m => (
          <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--card, #1c1c2e)',
              border: '1px solid var(--border, #2d2d3d)',
              borderRadius: '12px',
              padding: '20px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{m.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground, #e5e7eb)' }}>{m.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
