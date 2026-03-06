'use client';

export const dynamic = "force-dynamic"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, ChevronLeft, ChevronRight, Calendar, RefreshCw,
  Star, BookOpen, Trophy, Users, Megaphone, AlertCircle, Coffee,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_TYPE_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  Holiday:   { color: 'text-red-700',    bg: 'bg-red-100',    icon: Coffee },
  Exam:      { color: 'text-purple-700', bg: 'bg-purple-100', icon: BookOpen },
  Sports:    { color: 'text-green-700',  bg: 'bg-green-100',  icon: Trophy },
  Cultural:  { color: 'text-pink-700',   bg: 'bg-pink-100',   icon: Star },
  Meeting:   { color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Users },
  Ceremony:  { color: 'text-amber-700',  bg: 'bg-amber-100',  icon: Star },
  Other:     { color: 'text-gray-700',   bg: 'bg-gray-100',   icon: Calendar },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const now   = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { fetchEvents(); }, [year, month]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const endDate   = `${year}-${String(month + 1).padStart(2, '0')}-${String(getDaysInMonth(year, month)).padStart(2, '0')}`;
      const r = await fetch(`/api/events?startDate=${startDate}&endDate=${endDate}&limit=100`);
      const j = await r.json();
      if (j.success) setEvents(j.data?.events || j.data || []);
    } catch { toast({ title: 'Failed to load events', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };
  const goToday   = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDay(now.getDate()); };

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => {
      const eDate = new Date(e.eventDate).toISOString().slice(0, 10);
      return eDate === dateStr && (typeFilter === 'all' || e.eventType === typeFilter);
    });
  };

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfWeek(year, month);
  const isToday     = (day: number) => year === now.getFullYear() && month === now.getMonth() && day === now.getDate();

  // Build calendar grid cells
  const cells: Array<number | null> = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  // Aggregate events by type for the month
  const typeCounts: Record<string, number> = {};
  events.forEach(e => { typeCounts[e.eventType] = (typeCounts[e.eventType] || 0) + 1; });

  const EVENT_TYPES = Object.keys(EVENT_TYPE_CONFIG).filter(t => t !== 'Other');

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader />
      <main className="flex-1 space-y-6 p-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-7 w-7" />School Calendar
            </h1>
            <p className="text-muted-foreground">Events, exams, holidays and school activities</p>
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={goToday}>Today</Button>
            <Button variant="outline" size="icon" onClick={() => fetchEvents()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Month Summary Chips */}
        {events.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground font-medium self-center">{events.length} events:</span>
            {Object.entries(typeCounts).map(([type, count]) => {
              const cfg = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.Other;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${typeFilter === type ? 'ring-2 ring-offset-1 ring-primary' : ''} ${cfg.bg} ${cfg.color}`}
                >
                  {type} ({count})
                </button>
              );
            })}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Calendar Grid */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <h2 className="text-xl font-bold">{MONTH_NAMES[month]} {year}</h2>
                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {loading ? (
                <div className="flex justify-center items-center h-64"><div className="h-6 w-6 rounded-full border-3 border-primary/20 border-t-primary animate-spin" /></div>
              ) : (
                <div>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {DAY_NAMES.map(d => (
                      <div key={d} className={`text-center text-xs font-semibold py-2 ${d === 'Sun' ? 'text-red-500' : 'text-muted-foreground'}`}>{d}</div>
                    ))}
                  </div>
                  {/* Calendar cells */}
                  <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                    {cells.map((day, i) => {
                      const dayEvents = day ? getEventsForDay(day) : [];
                      const isSelected = selectedDay === day;
                      const isSun = (i % 7) === 0;
                      return (
                        <div
                          key={i}
                          onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                          className={`bg-background min-h-20 p-1.5 cursor-pointer transition-colors ${!day ? 'bg-muted/30 cursor-default' : 'hover:bg-muted/40'} ${isSelected ? '!bg-primary/10 ring-inset ring-2 ring-primary' : ''}`}
                        >
                          {day && (
                            <>
                              <div className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday(day) ? 'bg-primary text-primary-foreground' : isSun ? 'text-red-500' : ''}`}>
                                {day}
                              </div>
                              <div className="space-y-0.5">
                                {dayEvents.slice(0, 3).map((e: any) => {
                                  const cfg = EVENT_TYPE_CONFIG[e.eventType] || EVENT_TYPE_CONFIG.Other;
                                  return (
                                    <div key={e.id} className={`text-[10px] font-medium px-1 py-0.5 rounded truncate ${cfg.bg} ${cfg.color}`}>
                                      {e.isHoliday ? '🏖 ' : ''}{e.title}
                                    </div>
                                  );
                                })}
                                {dayEvents.length > 3 && (
                                  <div className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Legend */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Legend</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(EVENT_TYPE_CONFIG).filter(([t]) => t !== 'Other').map(([type, cfg]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cfg.bg} flex-shrink-0`} />
                    <span className={`text-xs font-medium ${cfg.color}`}>{type}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Selected Day Events */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {selectedDay
                    ? `${MONTH_NAMES[month]} ${selectedDay}, ${year}`
                    : 'Click a day to view events'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!selectedDay ? (
                  <p className="text-xs text-muted-foreground">Select a date from the calendar</p>
                ) : selectedDayEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No events scheduled</p>
                ) : selectedDayEvents.map((e: any) => {
                  const cfg = EVENT_TYPE_CONFIG[e.eventType] || EVENT_TYPE_CONFIG.Other;
                  const Icon = cfg.icon;
                  return (
                    <div key={e.id} className={`rounded-lg p-2.5 border ${cfg.bg}`}>
                      <div className={`flex items-center gap-1.5 font-semibold text-xs ${cfg.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {e.isHoliday && <span className="text-red-500">Holiday</span>}
                        <span>{e.title}</span>
                      </div>
                      {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
                      {(e.startTime || e.venue) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {e.startTime && `${e.startTime}${e.endTime ? `–${e.endTime}` : ''}`}
                          {e.venue && (e.startTime ? ` · ${e.venue}` : e.venue)}
                        </p>
                      )}
                      {e.targetAudience && e.targetAudience !== 'All' && (
                        <Badge variant="outline" className="text-[10px] mt-1">{e.targetAudience}</Badge>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Upcoming This Month</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {events
                  .filter(e => typeFilter === 'all' || e.eventType === typeFilter)
                  .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
                  .slice(0, 6)
                  .map(e => {
                    const cfg  = EVENT_TYPE_CONFIG[e.eventType] || EVENT_TYPE_CONFIG.Other;
                    const Icon = cfg.icon;
                    const d    = new Date(e.eventDate);
                    return (
                      <div key={e.id} className="flex items-start gap-2">
                        <div className={`text-center rounded-lg p-1.5 ${cfg.bg} flex-shrink-0 w-10`}>
                          <div className={`text-[11px] font-bold ${cfg.color}`}>{d.getDate()}</div>
                          <div className={`text-[9px] ${cfg.color} uppercase`}>{MONTH_NAMES[d.getMonth()].slice(0,3)}</div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{e.title}</p>
                          <p className={`text-[10px] ${cfg.color}`}>{e.eventType}</p>
                        </div>
                      </div>
                    );
                  })}
                {events.length === 0 && !loading && (
                  <p className="text-xs text-muted-foreground">No events this month</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
