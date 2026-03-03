import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const deptFilter = searchParams.get('department') || '';

    // Get all active staff
    let staffList = await prisma.staff.findMany({
      where: { status: 'Active', ...(deptFilter ? { department: deptFilter } : {}) },
      select: { id: true, fullName: true, employeeCode: true, designation: true, department: true },
      orderBy: { fullName: 'asc' },
    });

    if (search) {
      const s = search.toLowerCase();
      staffList = staffList.filter(x => x.fullName.toLowerCase().includes(s) || x.employeeCode?.toLowerCase().includes(s));
    }

    // Get timetable slots per staff (as proxy for teaching load)
    const timetableSlots = await prisma.timetableSlot.groupBy({
      by: ['staffId'],
      _count: { id: true },
    });
    const slotMap: Record<string, number> = {};
    timetableSlots.forEach((t: any) => { if (t.staffId) slotMap[t.staffId] = t._count.id; });

    // Get lesson plans per staff
    const lessonSettings = await prisma.systemSetting.findMany({ where: { key: { startsWith: 'lesson_plan_' } } });
    const lessonMap: Record<string, number> = {};
    lessonSettings.forEach((s: any) => {
      try {
        const plan = JSON.parse(s.value);
        if (plan.staffId) lessonMap[plan.staffId] = (lessonMap[plan.staffId] || 0) + 1;
      } catch {}
    });

    // Get homework count per staff
    const homeworkData = await prisma.homework.groupBy({
      by: ['staffId'],
      _count: { id: true },
      where: { createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } },
    });
    const homeworkMap: Record<string, number> = {};
    homeworkData.forEach((h: any) => { if (h.staffId) homeworkMap[h.staffId] = h._count.id; });

    // Get leave days this year
    const leaves = await prisma.leave.findMany({
      where: {
        startDate: { gte: new Date(new Date().getFullYear(), 0, 1) },
        status: 'Approved',
      },
      select: { staffId: true, startDate: true, endDate: true },
    });
    const leaveMap: Record<string, number> = {};
    leaves.forEach((l: any) => {
      if (!l.staffId) return;
      const days = Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      leaveMap[l.staffId] = (leaveMap[l.staffId] || 0) + days;
    });

    // Unique departments
    const departments = [...new Set(staffList.map(s => s.department).filter(Boolean))].sort();

    const workloads = staffList.map(s => {
      const weeklyPeriods = slotMap[s.id] || 0;
      const dailyAvg = weeklyPeriods > 0 ? Math.round((weeklyPeriods / 5) * 10) / 10 : 0;
      const totalLoad = weeklyPeriods * 40; // approx 40 min per period per week
      const status = weeklyPeriods === 0 ? 'Unassigned' : weeklyPeriods < 10 ? 'Under-loaded' : weeklyPeriods > 30 ? 'Overloaded' : 'Normal';
      return {
        ...s,
        weeklyPeriods,
        dailyAvg,
        totalMinutesPerWeek: totalLoad,
        lessonPlans: lessonMap[s.id] || 0,
        homeworkAssigned: homeworkMap[s.id] || 0,
        leaveDays: leaveMap[s.id] || 0,
        workloadStatus: status,
      };
    });

    const summary = {
      total: workloads.length,
      overloaded: workloads.filter(w => w.workloadStatus === 'Overloaded').length,
      underloaded: workloads.filter(w => w.workloadStatus === 'Under-loaded').length,
      unassigned: workloads.filter(w => w.workloadStatus === 'Unassigned').length,
      avgPeriods: workloads.length ? Math.round(workloads.reduce((s, w) => s + w.weeklyPeriods, 0) / workloads.length) : 0,
    };

    return NextResponse.json({ workloads, summary, departments });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
