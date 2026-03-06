'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard, Users, GraduationCap, School, Building2, ClipboardList,
  CalendarCheck, TrendingUp, FileText, Calendar, PenLine, Trophy, Award,
  BookOpen, Star, DollarSign, FileBarChart, UserCircle, Banknote,
  CalendarOff, CreditCard, Receipt, Package, AlertTriangle, Heart,
  Bell, Megaphone, Shield, Settings, Database, BarChart3, Upload,
  ChevronLeft, ChevronRight, LogOut, Bus, Library, Route, Wrench,
  BarChart2, BarChart, Filter, PieChart, Search, ArrowRightLeft,
  MessageSquare, Globe, Phone, Camera, Fingerprint, FlaskConical,
  UserCheck, UserMinus, FileCheck, DoorOpen, CalendarDays, IdCard,
  ClipboardCheck, CheckCircle2, PenTool, ArrowUpCircle, ShieldCheck,
  CalendarClock, Newspaper, BellDot, UtensilsCrossed, Truck,
  FileSignature, PackagePlus, MessageCircle, CalendarRange, HandCoins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: 'Main',
    items: [
      { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Academics',
    items: [
      { title: 'Students', url: '/students', icon: Users },
      { title: 'Admission', url: '/admission', icon: GraduationCap },
      { title: 'Classes', url: '/classes', icon: School },
      { title: 'Sections', url: '/sections', icon: ClipboardList },
      { title: 'Attendance', url: '/attendance', icon: CalendarCheck },
      { title: 'Att. Reports', url: '/att-reports', icon: TrendingUp },
      { title: 'Exams', url: '/exams', icon: FileText },
      { title: 'Mark Entry', url: '/marks', icon: PenTool },
      { title: 'Report Cards', url: '/rpt-cards', icon: Award },
      { title: 'Timetable', url: '/timetable', icon: Calendar },
      { title: 'Homework', url: '/homework', icon: BookOpen },
      { title: 'Subjects', url: '/subjects', icon: BookOpen },
      { title: 'Grade Scales', url: '/grade-scales', icon: Star },
      { title: 'Academic Years', url: '/acad-years', icon: Calendar },
      { title: 'Grade Book', url: '/grade-book', icon: FileBarChart },
    ],
  },
  {
    title: 'Staff & HR',
    items: [
      { title: 'Staff', url: '/staff', icon: UserCircle },
      { title: 'Payroll', url: '/payroll', icon: Banknote },
      { title: 'Salary Slips', url: '/salary-slips', icon: Banknote },
      { title: 'Leave Requests', url: '/leaves', icon: CalendarOff },
      { title: 'Staff Attendance', url: '/staff-att', icon: CalendarCheck },
      { title: 'Appraisals', url: '/appraisals', icon: Award },
      { title: 'Departments', url: '/departments', icon: Building2 },
    ],
  },
  {
    title: 'Finance',
    items: [
      { title: 'Fee Collection', url: '/fees/collection', icon: DollarSign },
      { title: 'Fee Structure', url: '/fees/structure', icon: FileBarChart },
      { title: 'Fee Discounts', url: '/fee-discount', icon: HandCoins },
      { title: 'Fee Defaulters', url: '/fee-default', icon: UserMinus },
      { title: 'Accounting', url: '/accounting', icon: BarChart3 },
      { title: 'Expenses', url: '/expenses', icon: Receipt },
      { title: 'Budget', url: '/budget', icon: PieChart },
      { title: 'Financial Dashboard', url: '/fin-dash', icon: BarChart2 },
    ],
  },
  {
    title: 'Support',
    items: [
      { title: 'Library', url: '/library', icon: Library },
      { title: 'Transport', url: '/transport', icon: Bus },
      { title: 'Hostel', url: '/hostel', icon: Building2 },
      { title: 'Inventory', url: '/inventory', icon: Package },
    ],
  },
  {
    title: 'Communication',
    items: [
      { title: 'Notices', url: '/notices', icon: Megaphone },
      { title: 'Notice Board', url: '/notice-board', icon: Bell },
      { title: 'Events', url: '/events', icon: Calendar },
      { title: 'PTM', url: '/ptm', icon: CalendarCheck },
      { title: 'Broadcast', url: '/broadcast', icon: Megaphone },
    ],
  },
  {
    title: 'Admin',
    items: [
      { title: 'Users', url: '/users', icon: Users },
      { title: 'Roles', url: '/roles', icon: Shield },
      { title: 'Settings', url: '/settings', icon: Settings },
      { title: 'Audit Logs', url: '/audit-logs', icon: FileText },
      { title: 'System Health', url: '/sys-health', icon: ShieldCheck },
    ],
  },
];

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const isActive = (url: string) => {
    if (url === '/') return pathname === '/';
    return pathname.startsWith(url);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={cn('flex items-center border-b h-14 px-3 shrink-0', collapsed ? 'justify-center' : 'gap-2')}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shrink-0">
            <School className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm truncate flex-1">EduManage Pro</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7 shrink-0', collapsed && 'hidden md:flex')}
            onClick={onToggleCollapse}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Nav Items */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {NAV.map((group) => (
              <div key={group.title}>
                {!collapsed && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 mt-3 first:mt-0">
                    {group.title}
                  </p>
                )}
                {collapsed && <div className="my-2 border-t" />}
                {group.items.map((item) => {
                  const active = isActive(item.url);
                  const Icon = item.icon;

                  if (collapsed) {
                    return (
                      <Tooltip key={item.url}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.url}
                            className={cn(
                              'flex items-center justify-center h-8 w-8 mx-auto rounded-md transition-colors',
                              active
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <Link
                      key={item.url + item.title}
                      href={item.url}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer: User info + logout */}
        <div className={cn('border-t p-2 shrink-0', collapsed ? 'flex justify-center' : '')}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={session?.user?.profilePhoto || ''} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{session?.user?.name || 'User'}</p>
                {session?.user?.role && (
                  <Badge variant="secondary" className="text-[10px] py-0 h-4">{session.user.role}</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground"
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
