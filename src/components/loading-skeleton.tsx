import { Center, Loader, Text, Stack, Skeleton, SimpleGrid, Box } from '@mantine/core';

interface LoadingSkeletonProps { rows?: number; type?: 'table' | 'cards' | 'spinner' | 'page'; message?: string; }

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <Center py="xl">
      <Stack align="center" gap="xs">
        <Loader size="md" />
        <Text size="sm" c="dimmed">{message}</Text>
      </Stack>
    </Center>
  );
}

export function LoadingSkeleton({ rows = 5, type = 'table', message }: LoadingSkeletonProps) {
  if (type === 'spinner') return <LoadingSpinner message={message} />;
  if (type === 'cards') return <SimpleGrid cols={3} spacing="md">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} height={120} radius="md" />)}</SimpleGrid>;
  return <Stack gap="xs">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} height={44} radius="sm" />)}</Stack>;
}
export default LoadingSkeleton;
