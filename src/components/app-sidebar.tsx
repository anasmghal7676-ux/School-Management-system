"use client"
import type React from "react"

import {
  LayoutDashboard,
  Users,
  Monitor as MonitorIcon,
  Calculator as CalculatorIcon,
  GraduationCap,
  DollarSign,
  Receipt,
  CalendarCheck,
  BookOpen,
  Bus,
  Building2,
  Package,
  CreditCard,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  School,
  FileText,
  Award,
  Library,
  ClipboardList,
  Calendar as CalendarIcon,
  FileBarChart,
  UserCircle,
  LogOut,
  Car,
  Route,
  DoorOpen,
  Megaphone,
  Shield,
  FileCheck,
  Package as PackageIcon,
  Award as AwardIcon,
  Users as UsersIcon,
  BarChart3,
  PieChart,
  Database,
  Download,
  Search,
  Filter,
  RefreshCw,
  DownloadCloud,
  FileDown,
  AlertTriangle as AlertTriangleIcon,
  Heart as HeartIcon,
  MessageSquareWarning as MessageSquareWarningIcon,
  MessageSquare as MessageSquareIcon,
  GraduationCap as GraduationCapIcon,
  CalendarOff,
  BookOpen as BookOpenCheckIcon,
  Upload as UploadIcon,
  Star as StarIcon,
  Building as BuildingIcon,
  Percent as PercentIcon,
  FileText as FileTextIcon,
  TrendingUp as TrendingUpIcon,
  ShieldCheck,
  Database as DatabaseIcon,
  Megaphone as MegaphoneIcon,
  BarChart3 as BarChart3Icon,
  CalendarDays as CalendarDaysIcon,
  IdCard as IdCardIcon,
  ArrowUpCircle as ArrowUpCircleIcon,
  UserCheck as UserCheckIcon,
  ClipboardCheck as ClipboardCheckIcon,
  Receipt as ReceiptIcon,
  HelpCircle as QuizIcon,
  ShieldCheck as ShieldCheckIcon,
  ClipboardList as DutyRosterIcon,
  UserX as DefaulterIcon,
  MonitorCheck as MonitorCheckIcon,
  FileCheck as FileCheckIcon,
  DoorOpen as DoorOpenIcon,
  CalendarCheck as CalendarCheckIcon,
  Globe as GlobeIcon,
  PenTool as MarkEntryIcon,
  Trophy as TrophyIcon,
  CalendarClock as MeetingsIcon,
  Banknote as BanknoteIcon,
  LogIn as LogInIcon,
  Wrench as WrenchIcon,
  CheckCircle2 as CheckCircleIcon,
  UserMinus as UserMinusIcon,
  Heart as HeartRecordIcon,
  ArrowRightLeft as TransferIcon,
  BarChart2 as FinancialReportsIcon,
  Gamepad2 as CoCurricularIcon,
  Microscope as ExamControlIcon,
  ClipboardList as AdmissionFormIcon,
  MapPin as VenueIcon,
  HelpCircle as QuestionBankIcon,
  BarChart as WorkloadIcon,
  PackagePlus as InvReqIcon,
  MessageCircle as FeedbackIcon,
  CalendarRange as PlannerIcon,
  Newspaper as NewsIcon,
  BellDot as RemindersIcon,
  Wrench as MaintenanceIcon,
  Receipt as ExpenseIcon,
  UtensilsCrossed as CanteenIcon,
  Truck as VendorIcon,
  TrendingUp as AnalyticsIcon,
  FileSignature as ContractIcon,
  MessageSquareWarning as GrievanceIcon,
  Search as LostFoundIcon,
  BarChart as MonthlySummaryIcon,
  PhoneCall as EmergencyIcon,
  GraduationCap as ScholarshipIcon,
  Camera as CCTVIcon,
  Fingerprint as BiometricIcon,
  FlaskConical as LabIcon,
  BookOpen as CurriculumIcon,
  Receipt as InstallmentsIcon,
  UserCheck as ProbationIcon,
  ClipboardList as ElectivesIcon,
  Award as TeacherPerfIcon,
  BarChart3 as CompareIcon,
  MessageSquare as SMSGatewayIcon,
  Calendar as AcadSessionIcon,
  Filter as CustomFieldsIcon,
  HandCoins,
  Trophy,
  CalendarDays,
  UserCheck as UserCheckOutIcon,
  HelpCircle as HelpCircleIcon,
} from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

const menuItems = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Academics",
    items: [
      {
        title: "Students",
        url: "/students",
        icon: Users,
      },
      {
        title: "Admission",
        url: "/admission",
        icon: GraduationCap,
      },
      {
        title: "Classes",
        url: "/classes",
        icon: School,
      },
      {
        title: "Classrooms",
        url: "/classrooms",
        icon: Building2,
      },
      {
        title: "Sections",
        url: "/sections",
        icon: ClipboardList,
      },
      {
        title: "Attendance",
        url: "/attendance",
        icon: CalendarCheck,
      },
      {
        title: "Attendance Reports",
        url: "/att-reports",
        icon: TrendingUpIcon,
      },
      {
        title: "Exams & Marks",
        url: "/exams",
        icon: FileText,
      },
      {
        title: "Exam Timetable",
        url: "/exam-tt",
        icon: CalendarIcon,
      },
      {
        title: "Mark Entry",
        url: "/marks",
        icon: MarkEntryIcon,
      },
      {
        title: "Exam Results",
        url: "/exam-results",
        icon: TrophyIcon,
      },
      {
        title: "Report Cards",
        url: "/rpt-cards",
        icon: Award,
      },
      {
        title: "Timetable",
        url: "/timetable",
        icon: CalendarIcon,
      },
      {
        title: "Homework",
        url: "/homework",
        icon: BookOpen,
      },
      {
        title: "Lesson Plans",
        url: "/lesson-plans",
        icon: BookOpen,
      },
      {
        title: "Class Teachers",
        url: "/cls-teachers",
        icon: GraduationCap,
      },
      {
        title: "Subjects",
        url: "/subjects",
        icon: BookOpenCheckIcon,
      },
      {
        title: "Class — Subjects",
        url: "/cls-subjects",
        icon: ClipboardList,
      },
      {
        title: "Grade Scales",
        url: "/grade-scales",
        icon: StarIcon,
      },
      {
        title: "Academic Years",
        url: "/acad-years",
        icon: CalendarIcon,
      },
      {
        title: "Student Progress",
        url: "/progress",
        icon: TrendingUpIcon,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Staff",
        url: "/staff",
        },
        {
          title: "Payroll",
          url: "/payroll",
        icon: UserCircle,
      },
      {
        title: "Salary Slips",
        url: "/salary-slips",
        icon: BanknoteIcon,
      },
      {
        title: "Leave Requests",
        url: "/leaves",
        icon: CalendarOff,
      },
      {
        title: "Staff Attendance",
        url: "/staff-att",
        icon: CalendarCheck,
      },
      {
        title: "Appraisals",
        url: "/appraisals",
        icon: AwardIcon,
      },
      {
        title: "Increment History",
        url: "/increments",
        icon: TrendingUpIcon,
      },
      {
        title: "Training & Development",
        url: "/training",
        icon: GraduationCapIcon,
      },
      {
        title: "HR Documents",
        url: "/hr-documents",
        icon: FileTextIcon,
      },
      {
        title: "Staff Transfer & Posting",
        url: "/staff-xfer",
        icon: TransferIcon,
      },
      {
        title: "Co-curricular Activities",
        url: "/co-curr",
        icon: CoCurricularIcon,
      },
      {
        title: "Departments",
        url: "/departments",
        icon: BuildingIcon,
      },
      {
        title: "Fee Collection",
        url: "/fees/collection",
        icon: DollarSign,
      },
      {
        title: "Fee Structure",
        url: "/fees/structure",
        icon: FileBarChart,
      },
      {
        title: "Fee Installments",
        url: "/fees/installments",
        icon: CalendarIcon,
      },
      {
        title: "Fee Discounts",
        url: "/fee-discount",
        icon: PercentIcon,
      },
      {
        title: "Library",
        url: "/library",
        icon: Library,
      },
      {
        title: "Transport",
        url: "/transport",
        icon: Bus,
      },
      {
        title: "Transport Manager",
        url: "/transport",
        icon: Bus,
      },
      {
        title: "Vehicle Maintenance",
        url: "/veh-maint",
        icon: WrenchIcon,
      },
      {
        title: "Hostel",
        url: "/hostel",
        icon: Building2,
      },
      {
        title: "Hostel Rooms",
        url: "/hostel-rooms",
        icon: Building2,
      },
      {
        title: "Hostel Attendance",
        url: "/hostel-att",
        icon: CheckCircleIcon,
      },
      {
        title: "Hostel Fees",
        url: "/hostel-fees",
        icon: BanknoteIcon,
      },
      {
        title: "Inventory",
        url: "/inventory",
        icon: PackageIcon,
      },
      {
        title: "Asset Management",
        url: "/assets",
        icon: PackageIcon,
      },
      {
        title: "Accounts",
        url: "/accounts",
        icon: CreditCard,
      },
      {
        title: "Expenses",
        url: "/expenses",
        icon: Receipt,
      },
      {
        title: "Petty Cash",
        url: "/petty-cash",
        icon: BanknoteIcon,
      },
      {
        title: "Behavior Log",
        url: "/behavior",
        icon: AlertTriangleIcon,
      },
      {
        title: "Student Counseling",
        url: "/counseling",
        icon: HeartIcon,
      },
      {
        title: "Medical Records",
        url: "/medical",
        icon: HeartIcon,
      },
      {
        title: "Student Health Records",
        url: "/stu-health",
        icon: HeartRecordIcon,
      },
      {
        title: "Documents",
        url: "/documents",
        icon: FileTextIcon,
      },
      {
        title: "Parents",
        url: "/parents",
        icon: UsersIcon,
      },
      {
        title: "Fee Fines",
        url: "/fee-fines",
        icon: AlertTriangleIcon,
      },
    ],
  },
  {
    title: "Communication",
    items: [
      {
        title: "Notifications",
        url: "/notifs",
        icon: Bell,
      },
      {
        title: "Announcements",
        url: "/notices",
        icon: Megaphone,
      },
      {
        title: "Notice Board",
        url: "/notice-board",
        icon: Bell,
      },
      {
        title: "Scholarships",
        url: "/scholarships",
        icon: Award,
      },
      {
        title: "Events",
        url: "/events",
        icon: CalendarIcon,
      },
      {
        title: "Visitor Management",
        url: "/visitors",
        icon: DoorOpenIcon,
      },
      {
        title: "Gate Log",
        url: "/gate-log",
        icon: LogInIcon,
      },
      {
        title: "Parent-Teacher Meetings",
        url: "/ptm",
        icon: CalendarCheckIcon,
      },
      {
        title: "Staff Meetings",
        url: "/meetings",
        icon: UsersIcon,
      },
      {
        title: "Result Publishing",
        url: "/results",
        icon: GlobeIcon,
      },
      {
        title: "Certificates",
        url: "/certificates",
        icon: AwardIcon,
      },
      {
        title: "Complaints",
        url: "/complaints",
        icon: MessageSquareWarningIcon,
      },
      {
        title: "Incidents",
        url: "/incidents",
        icon: ShieldCheckIcon,
      },
      {
        title: "Fee Defaulters",
        url: "/fee-default",
        icon: DefaulterIcon,
      },
      {
        title: "Fee Reminders",
        url: "/fee-remind",
        icon: RemindersIcon,
      },
      {
        title: "Inventory Requests",
        url: "/inv-req",
        icon: InvReqIcon,
      },
      {
        title: "Student Ledger",
        url: "/stu-ledger",
        icon: BookOpenCheckIcon,
      },
      {
        title: "Communication Log",
        url: "/comm-log",
        icon: MessageSquareIcon,
      },
      {
        title: "Alumni",
        url: "/alumni",
        icon: GraduationCapIcon,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Grade Book",
        url: "/grade-book",
        icon: BookOpenCheckIcon,
      },
      {
        title: "Reports",
        url: "/reports",
        icon: BarChart3,
      },
      {
        title: "Report Builder",
        url: "/rpt-builder",
        icon: BarChart3Icon,
      },
      {
        title: "Financial Dashboard",
        url: "/fin-dash",
        icon: BarChart3Icon,
      },
      {
        title: "Financial Reports",
        url: "/fin-reports",
        icon: FinancialReportsIcon,
      },
      {
        title: "Exam Control Panel",
        url: "/exam-control",
        icon: ExamControlIcon,
      },
      {
        title: "Question Bank",
        url: "/q-bank",
        icon: QuestionBankIcon,
      },
      {
        title: "Academic Planner",
        url: "/acad-planner",
        icon: PlannerIcon,
      },
      {
        title: "Staff Workload",
        url: "/staff-load",
        icon: WorkloadIcon,
      },
      {
        title: "Venue Booking",
        url: "/venue-book",
        icon: VenueIcon,
      },
      {
        title: "Maintenance Requests",
        url: "/maintenance",
        icon: MaintenanceIcon,
      },
      {
        title: "Expense Requests",
        url: "/expense-req",
        icon: ExpenseIcon,
      },
      {
        title: "Canteen Management",
        url: "/canteen",
        icon: CanteenIcon,
      },
      {
        title: "Vendor Management",
        url: "/vendors",
        icon: VendorIcon,
      },
      {
        title: "Contract Management",
        url: "/contracts",
        icon: ContractIcon,
      },
      {
        title: "Staff Biometric",
        url: "/staff-bio",
        icon: BiometricIcon,
      },
      {
        title: "Staff Grievances",
        url: "/grievances",
        icon: GrievanceIcon,
      },
      {
        title: "Scholarship Applications",
        url: "/scholarships",
        icon: ScholarshipIcon,
      },
      {
        title: "Emergency Contacts",
        url: "/emergency",
        icon: EmergencyIcon,
      },
      {
        title: "Lost & Found",
        url: "/lost-found",
        icon: LostFoundIcon,
      },
      {
        title: "CCTV & Security Log",
        url: "/cctv-log",
        icon: CCTVIcon,
      },
      {
        title: "Student Analytics",
        url: "/stu-stats",
        icon: AnalyticsIcon,
      },
      {
        title: "Monthly Summary",
        url: "/mon-summary",
        icon: MonthlySummaryIcon,
      },
      {
        title: "Parent Portal",
        url: "/parent-p",
        icon: Users,
      },
      {
        title: "Parent Communication",
        url: "/parent-comm",
        icon: MessageSquareIcon,
      },
      {
        title: "Student Feedback",
        url: "/stu-feedback",
        icon: FeedbackIcon,
      },
      {
        title: "School News",
        url: "/school-news",
        icon: NewsIcon,
      },
      {
        title: "Student Portal",
        url: "/stu-portal",
        icon: GraduationCap,
      },
      {
        title: "Teacher Portal",
        url: "/teach-portal",
        icon: UserCircle,
      },
      {
        title: "Calendar",
        url: "/calendar",
        icon: CalendarDaysIcon,
      },
      {
        title: "Substitutions",
        url: "/substitutes",
        icon: UserCheckIcon,
      },
      {
        title: "Duty Roster",
        url: "/duty-roster",
        icon: DutyRosterIcon,
      },
      {
        title: "Promotions",
        url: "/promotions",
        icon: ArrowUpCircleIcon,
      },
      {
        title: "Submissions",
        url: "/submissions",
        icon: ClipboardCheckIcon,
      },
      {
        title: "ID Cards",
        url: "/id-cards",
        icon: IdCardIcon,
      },
      {
        title: "Receipts",
        url: "/receipts",
        icon: ReceiptIcon,
      },
      {
        title: "Quiz Builder",
        url: "/quiz-builder",
        icon: QuizIcon,
      },
      {
        title: "Online Exam",
        url: "/online-exam",
        icon: MonitorCheckIcon,
      },
      {
        title: "Student Clearance",
        url: "/clearance",
        icon: FileCheckIcon,
      },
      {
        title: "TC Issuance",
        url: "/tc-issuance",
        icon: FileTextIcon,
      },
      {
        title: "Siblings Management",
        url: "/siblings",
        icon: UsersIcon,
      },
      {
        title: "Awards & Achievements",
        url: "/achievements",
        icon: AwardIcon,
      },
      {
        title: "Exit Management",
        url: "/exit-mgmt",
        icon: UserMinusIcon,
      },
      {
        title: "Fee Challan",
        url: "/fee-challan",
        icon: ReceiptIcon,
      },
      {
        title: "Broadcast",
        url: "/broadcast",
        icon: MegaphoneIcon,
      },
      {
        title: "Message Templates",
        url: "/msg-tmpl",
        icon: MessageSquareIcon,
      },
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3Icon,
      },
      {
        title: "Users & Roles",
        url: "/users",
        icon: ShieldCheck,
      },
      {
        title: "Role Management",
        url: "/roles",
        icon: ShieldCheck,
      },
      {
        title: "Role Permissions",
        url: "/role-perms",
        icon: ShieldCheck,
      },
      {
        title: "Student Progress",
        url: "/stu-progress",
        icon: TrendingUpIcon,
      },
      {
        title: "Bulk Import",
        url: "/bulk-import",
        icon: UploadIcon,
      },
      {
        title: "Accounting",
        url: "/accounting",
        icon: DollarSign,
      },
      {
        title: "Audit Logs",
        url: "/audit-logs",
        icon: Shield,
      },
      {
        title: "System Health",
        url: "/sys-health",
        icon: Shield,
      },
      {
        title: "Admission Form",
        url: "/adm-form",
        icon: ClipboardList,
      },
      {
        title: "Backup",
        url: "/backup",
        icon: DatabaseIcon,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
      {
        title: "Lab Management",
        url: "/lab-mgmt",
        icon: LabIcon,
      },
      {
        title: "Curriculum Builder",
        url: "/curriculum",
        icon: CurriculumIcon,
      },
      {
        title: "Fee Installments",
        url: "/fee-install",
        icon: InstallmentsIcon,
      },
      {
        title: "Probation Tracking",
        url: "/probation",
        icon: ProbationIcon,
      },
      {
        title: "Subject Electives",
        url: "/electives",
        icon: ElectivesIcon,
      },
      {
        title: "Teacher Performance",
        url: "/teacher-perf",
        icon: TeacherPerfIcon,
      },
      {
        title: "Comparative Report",
        url: "/cmp-report",
        icon: CompareIcon,
      },
      {
        title: "SMS Gateway",
        url: "/sms-gateway",
        icon: SMSGatewayIcon,
      },
      {
        title: "Academic Session",
        url: "/acad-session",
        icon: AcadSessionIcon,
      },
      {
        title: "Custom Fields",
        url: "/cust-fields",
        icon: CustomFieldsIcon,
      },
      {
        title: "Parent Meeting Scheduler",
        url: "/parent-mtg",
        icon: CalendarCheck,
      },
      {
        title: "Bulk Fee Collection",
        url: "/bulk-fees",
        icon: DollarSign,
      },
      {
        title: "Exam Seating",
        url: "/exam-seating",
        icon: GraduationCap,
      },
      {
        title: "Discipline Tracker",
        url: "/discipline",
        icon: ShieldCheck,
      },
      {
        title: "Communication Center",
        url: "/comm-center",
        icon: MessageSquareIcon,
      },
      {
        title: "Online Admission",
        url: "/online-adm",
        icon: ClipboardList,
      },
      {
        title: "Certificate Builder",
        url: "/cert-builder",
        icon: Award,
      },
      {
        title: "Report Card Builder",
        url: "/rpt-cards",
        icon: FileBarChart,
      },
      {
        title: "Class Photo Gallery",
        url: "/cls-gallery",
        icon: CCTVIcon,
      },
      {
        title: "Student ID Portal",
        url: "/student-ids",
        icon: IdCardIcon,
      },
      {
        title: "PDF Generator",
        url: "/pdf-demo",
        icon: FileText,
      },
      {
        title: "Staff Directory",
        url: "/staff-dir",
        icon: Users,
      },
      {
        title: "Class Timetable",
        url: "/cls-timetable",
        icon: CalendarDays,
      },
      {
        title: "Homework Tracker",
        url: "/hw-tracker",
        icon: BookOpen,
      },
      {
        title: "Visitor Log",
        url: "/visitor-log",
        icon: UserCheckOutIcon,
      },
      {
        title: "Asset Tracking",
        url: "/assets-track",
        icon: Package,
      },
      {
        title: "Lost & Found",
        url: "/lost-found-p",
        icon: HelpCircleIcon,
      },
      {
        title: "Alumni Management",
        url: "/alumni",
        icon: GraduationCapIcon,
      },
      {
        title: "Event Management",
        url: "/events-mgmt",
        icon: CalendarCheck,
      },
      {
        title: "Welfare Fund",
        url: "/welfare-fund",
        icon: HandCoins,
      },
      {
        title: "Student Achievement",
        url: "/achievements",
        icon: Trophy,
      },
      {
        title: "IT Helpdesk",
        url: "/it-helpdesk",
        icon: MonitorIcon,
      },
      {
        title: "Grade Calculator",
        url: "/grade-calc",
        icon: CalculatorIcon,
      },
    ],
  },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar, state } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
        <div className="flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
            <School className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white truncate">EduManage Pro</span>
            <span className="text-xs text-blue-200 truncate">School Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        {menuItems.map((group) => (
          <SidebarGroup key={group.title} className="py-1">
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon as React.ElementType
                  const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url))
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "rounded-lg mx-1 transition-all duration-150",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-sm font-medium" 
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Link href={item.url}>
                          <Icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary-foreground")} />
                          <span className="truncate">{item.title}</span>
                          {isActive && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/80 flex-shrink-0" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={toggleSidebar}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {state === "collapsed" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span>{state === "collapsed" ? "Expand" : "Collapse"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
