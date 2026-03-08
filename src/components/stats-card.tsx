import { Card, Text, Group, Box, Badge } from '@mantine/core';

type Color = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'cyan' | 'rose' | 'slate' | 'emerald' | 'orange';
const MANTINE_COLOR: Record<Color, string> = { blue: 'blue', green: 'green', red: 'red', amber: 'yellow', purple: 'violet', cyan: 'cyan', rose: 'pink', slate: 'gray', emerald: 'teal', orange: 'orange' };

interface StatsCardProps {
  title: string; value: string | number; subtitle?: string;
  icon?: React.ComponentType<any>; trend?: { value: number; label?: string };
  color?: Color; className?: string; onClick?: () => void;
}

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'blue', onClick }: StatsCardProps) {
  const mc = MANTINE_COLOR[color] || 'blue';
  return (
    <Card shadow="xs" radius="md" p="md" style={{ border: '1px solid #f1f5f9', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">{title}</Text>
        {Icon && <Box style={{ width: 32, height: 32, borderRadius: 8, background: `var(--mantine-color-${mc}-1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color={`var(--mantine-color-${mc}-6)`} /></Box>}
      </Group>
      <Text size="xl" fw={700} c={`${mc}.7`}>{value}</Text>
      {subtitle && <Text size="xs" c="dimmed" mt={2}>{subtitle}</Text>}
      {trend && <Badge size="xs" color={trend.value >= 0 ? 'green' : 'red'} variant="light" mt="xs">{trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}</Badge>}
    </Card>
  );
}
