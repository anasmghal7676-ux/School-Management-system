'use client'

import { usePathname } from 'next/navigation'
import { SidebarProvider } from '@/components/ui/sidebar'
import dynamic from 'next/dynamic'

// Dynamically import AppSidebar to avoid SSR issues
const AppSidebar = dynamic(() => import('@/components/app-sidebar'), { 
  ssr: false,
  loading: () => null
})

const NO_SIDEBAR_PATHS = ['/auth', '/unauthorized']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = !NO_SIDEBAR_PATHS.some(p => pathname?.startsWith(p))

  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-auto page-enter">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
