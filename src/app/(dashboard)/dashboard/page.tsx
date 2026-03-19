"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import {
  CalendarDays,
  Users,
  UserPlus,
  Stethoscope,
  MessageSquare,
  FileText,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardStats {
  appointmentsToday: number;
  totalPatients: number;
  newPatientsLast30: number;
  totalServices: number;
  totalProviders: number;
  appointmentsTotal: number;
}

interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
  id: string;
}

interface WeeklyAppointment {
  startTime: string;
  bookedVia: string;
}

const weekChartConfig = {
  value: { label: "Appointments", color: "var(--chart-1)" },
} satisfies ChartConfig;

const CHANNEL_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

const channelChartConfig = {
  value: { label: "Bookings" },
} satisfies ChartConfig;

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  loading: boolean;
}) {
  return (
    <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-semibold text-slate-950 mt-0.5">
            {loading ? "..." : value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const ACTIVITY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  appointment: CalendarDays,
  conversation: MessageSquare,
  intake: FileText,
};

const ACTIVITY_COLORS: Record<string, string> = {
  appointment: "text-blue-600 bg-blue-50",
  conversation: "text-violet-600 bg-violet-50",
  intake: "text-emerald-600 bg-emerald-50",
};

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ name: string; value: number }[]>([]);
  const [channelData, setChannelData] = useState<{ name: string; value: number }[]>([]);
  const [aiConvosToday, setAiConvosToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsRes, activityRes, apptsRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/activity"),
          fetch("/api/appointments"),
        ]);

        const statsData = statsRes.ok ? ((await statsRes.json()) as DashboardStats) : null;
        const activityData = activityRes.ok
          ? ((await activityRes.json()) as { activities: ActivityItem[] })
          : { activities: [] };
        const apptsJson = apptsRes.ok ? await apptsRes.json() : { appointments: [] };
        const apptsData = (apptsJson.appointments ?? []) as WeeklyAppointment[];

        if (cancelled) return;

        setStats(statsData);
        setActivities(activityData.activities);

        const todayConvos = activityData.activities.filter(
          (a) => a.type === "conversation"
        ).length;
        setAiConvosToday(todayConvos);

        const { start, end } = getWeekRange();
        const weekAppts = apptsData.filter((a) => {
          const d = new Date(a.startTime);
          return d >= start && d <= end;
        });

        const byDay = DAY_NAMES.map((name, i) => ({
          name,
          value: weekAppts.filter((a) => new Date(a.startTime).getDay() === i).length,
        }));
        setWeeklyData(byDay);

        const channels: Record<string, number> = {};
        for (const a of weekAppts) {
          const ch = a.bookedVia || "unknown";
          channels[ch] = (channels[ch] || 0) + 1;
        }
        setChannelData(
          Object.entries(channels).map(([name, value]) => ({
            name: name === "chat" ? "AI Chat" : name === "manual" ? "Staff" : name === "online" ? "Online" : name,
            value,
          }))
        );
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Badge className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-blue-100">
          Operations overview
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Dashboard</h1>
        <p className="mt-1 text-base text-slate-600">
          Today&apos;s clinic snapshot and recent activity.
        </p>
      </div>

      {/* Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Today's Appointments"
          value={stats?.appointmentsToday ?? 0}
          icon={CalendarDays}
          accent="bg-blue-50 text-blue-700"
          loading={loading}
        />
        <StatCard
          label="Total Patients"
          value={stats?.totalPatients ?? 0}
          icon={Users}
          accent="bg-sky-50 text-sky-700"
          loading={loading}
        />
        <StatCard
          label="New Patients (30d)"
          value={stats?.newPatientsLast30 ?? 0}
          icon={UserPlus}
          accent="bg-emerald-50 text-emerald-700"
          loading={loading}
        />
        <StatCard
          label="Active Providers"
          value={stats?.totalProviders ?? 0}
          icon={Stethoscope}
          accent="bg-indigo-50 text-indigo-700"
          loading={loading}
        />
        <StatCard
          label="AI Convos Today"
          value={aiConvosToday}
          icon={MessageSquare}
          accent="bg-violet-50 text-violet-700"
          loading={loading}
        />
      </section>

      {/* Charts + Activity */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1fr_minmax(300px,1fr)]">
        {/* Appointments This Week */}
        <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <Activity className="h-4 w-4 text-blue-600" />
              Appointments This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <ChartContainer config={weekChartConfig} className="h-48 w-full">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={30} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Bookings by Channel */}
        <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <Activity className="h-4 w-4 text-blue-600" />
              Bookings by Channel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : channelData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings this week.</p>
            ) : (
              <ChartContainer config={channelChartConfig} className="h-48 w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {channelData.map((_, i) => (
                      <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <Activity className="h-4 w-4 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {activities.slice(0, 15).map((item) => {
                  const Icon = ACTIVITY_ICONS[item.type] ?? Activity;
                  const color = ACTIVITY_COLORS[item.type] ?? "text-slate-600 bg-slate-50";
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-800 truncate">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{relativeTime(item.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-slate-950 mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/dashboard/appointments", label: "View Today's Schedule", icon: CalendarDays },
            { href: "/dashboard/check-in", label: "Check-In Queue", icon: Users },
            { href: "/dashboard/forms", label: "Manage Forms", icon: FileText },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <Button
                variant="outline"
                className="w-full justify-between rounded-xl border-blue-100 bg-white px-4 py-6 text-slate-700 hover:bg-blue-50"
              >
                <span className="flex items-center gap-2">
                  <action.icon className="h-4 w-4 text-blue-600" />
                  {action.label}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
