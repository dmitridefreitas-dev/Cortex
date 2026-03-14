"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowRight,
  Calendar,
  CalendarCheck2,
  CircleHelp,
  Clock3,
  FileText,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardStats {
  appointmentsToday: number;
  totalPatients: number;
  newPatientsLast30: number;
  totalServices: number;
  totalProviders: number;
  appointmentsTotal: number;
}

const quickActions = [
  {
    href: "/dashboard/appointments",
    title: "Review today's schedule",
    description: "Confirm high-priority visits, reschedules, and no-show risks.",
    icon: CalendarCheck2,
  },
  {
    href: "/dashboard/forms",
    title: "Check intake forms",
    description: "Spot incomplete submissions before patients arrive onsite.",
    icon: FileText,
  },
  {
    href: "/dashboard/settings/faq",
    title: "Refine patient answers",
    description: "Update FAQ guidance so Cortex answers more consistently.",
    icon: CircleHelp,
  },
];

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: number | string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  loading: boolean;
}) {
  return (
    <Card className="rounded-[28px] border-blue-100 bg-white/90 py-5 shadow-[0_20px_60px_-45px_rgba(37,99,235,0.4)]">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardDescription className="text-sm font-medium text-slate-500">
            {label}
          </CardDescription>
          <CardTitle className="mt-3 text-3xl font-semibold text-slate-950">
            {loading ? "..." : value}
          </CardTitle>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-600">{helper}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const response = await fetch("/api/dashboard/stats");

        if (!response.ok) {
          throw new Error("Failed to load dashboard stats");
        }

        const data = (await response.json()) as DashboardStats;

        if (!cancelled) {
          setStats(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/70 bg-white/88 p-6 shadow-[0_30px_90px_-50px_rgba(37,99,235,0.45)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-blue-100">
              Operations overview
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
              A quieter dashboard with clearer next actions.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              This overview now uses stronger shadcn-style card groupings,
              cleaner blue accents, and more deliberate CTA placement so staff
              can read the clinic state faster.
            </p>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Total appointment records</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {loading ? "..." : stats?.appointmentsTotal ?? 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">New patients in 30 days</p>
              <p className="mt-2 text-3xl font-semibold text-blue-700">
                {loading ? "..." : stats?.newPatientsLast30 ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's appointments"
          value={stats?.appointmentsToday ?? 0}
          helper="Confirmed or ready to check in."
          icon={Calendar}
          accent="bg-blue-50 text-blue-700 ring-1 ring-blue-100"
          loading={loading}
        />
        <StatCard
          label="Total patients"
          value={stats?.totalPatients ?? 0}
          helper={
            loading
              ? "Tracking patient growth."
              : `${stats?.newPatientsLast30 ?? 0} new in the last 30 days.`
          }
          icon={Users}
          accent="bg-sky-50 text-sky-700 ring-1 ring-sky-100"
          loading={loading}
        />
        <StatCard
          label="Providers"
          value={stats?.totalProviders ?? 0}
          helper="Active clinicians available for scheduling."
          icon={Stethoscope}
          accent="bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
          loading={loading}
        />
        <StatCard
          label="Services"
          value={stats?.totalServices ?? 0}
          helper="Configured visit types patients can request."
          icon={Clock3}
          accent="bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
          loading={loading}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="rounded-[32px] border-blue-100 bg-white/90 py-6 shadow-[0_24px_70px_-50px_rgba(37,99,235,0.45)]">
          <CardHeader className="gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl text-slate-950">
                  Recommended next steps
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl leading-6 text-slate-600">
                  Keep the interface action-oriented by surfacing the three
                  flows staff typically need after opening the dashboard.
                </CardDescription>
              </div>
              <div className="hidden h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 sm:flex">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {quickActions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[24px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/60 p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/15">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-blue-700">
                  Open
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[32px] border-blue-100 bg-slate-950 py-6 text-white shadow-[0_24px_80px_-45px_rgba(15,23,42,0.8)]">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                Front desk rhythm
              </CardTitle>
              <CardDescription className="mt-2 leading-6 text-blue-100/70">
                Keep staff focused on the next operational checkpoint instead of
                scanning a flat list of links.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
                <p className="text-sm text-blue-100/70">Morning</p>
                <p className="mt-2 text-base font-medium text-white">
                  Review today&apos;s bookings and provider coverage.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
                <p className="text-sm text-blue-100/70">Midday</p>
                <p className="mt-2 text-base font-medium text-white">
                  Check incomplete intake forms and chat handoffs.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
                <p className="text-sm text-blue-100/70">End of day</p>
                <p className="mt-2 text-base font-medium text-white">
                  Update FAQs and open capacity for tomorrow.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-blue-100 bg-white/90 py-6 shadow-[0_20px_60px_-45px_rgba(37,99,235,0.4)]">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-950">
                Quick access
              </CardTitle>
              <CardDescription className="mt-2 leading-6 text-slate-600">
                These links stay visible because they are the most likely second
                click from the overview.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { href: "/dashboard/patients", label: "Patient records" },
                { href: "/dashboard/providers", label: "Provider directory" },
                { href: "/dashboard/services", label: "Service catalog" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full justify-between rounded-2xl border-blue-100 bg-white px-4 text-slate-700 hover:bg-blue-50"
                  )}
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
