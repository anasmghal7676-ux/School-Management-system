'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useState } from "react";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';

const mantineTheme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
        withBorder: true,
      },
    },
    Input: {
      defaultProps: {
        radius: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    Table: {
      defaultProps: {
        striped: true,
        highlightOnHover: true,
        withTableBorder: true,
        withColumnBorders: false,
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={mantineTheme} defaultColorScheme="light">
          <Notifications position="top-right" zIndex={1000} />
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </ThemeProvider>
        </MantineProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
