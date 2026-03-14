import {
  ArrowRight,
  CalendarClock,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const quickStats = [
  { value: "24/7", label: "Patient coverage" },
  { value: "< 1 min", label: "First response target" },
  { value: "1 hub", label: "Appointments, FAQs, intake" },
];

const highlights = [
  {
    icon: Sparkles,
    title: "A calmer first impression",
    description:
      "Use a cleaner entry point with clearer hierarchy, softer surfaces, and a more premium white-and-blue brand feel.",
  },
  {
    icon: CalendarClock,
    title: "Faster operational scanning",
    description:
      "Surface the next actions, key counts, and scheduling context so staff can understand the clinic state at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "More trustworthy product signals",
    description:
      "Consistent badges, cards, and support states make the interface feel deliberate instead of pieced together.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_20px_70px_-40px_rgba(37,99,235,0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-950">Cortex</p>
              <p className="text-sm text-muted-foreground">
                AI front desk for modern clinics
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-blue-200/80 bg-white/90 px-5 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              Staff Dashboard
            </Link>
            <Link
              href="/chat"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              Talk to Cortex
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_25px_80px_-40px_rgba(37,99,235,0.45)] backdrop-blur sm:p-8 lg:p-10">
            <Badge className="mb-5 rounded-full bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-blue-200">
              White + blue shadcn refresh
            </Badge>
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  A cleaner, more trustworthy clinic front desk experience.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Cortex now leans into a clearer shadcn-style product language:
                  calmer spacing, more structured cards, stronger CTA hierarchy,
                  and a polished white-and-blue brand system.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/chat"
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
                >
                  Start Patient Chat
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50/70 px-6 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  Open Operations View
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {quickStats.map((item) => (
                  <Card
                    key={item.label}
                    className="gap-2 rounded-2xl border-blue-100 bg-gradient-to-br from-white to-blue-50/50 py-5 shadow-none"
                  >
                    <CardContent className="space-y-1">
                      <div className="text-2xl font-semibold text-slate-950">
                        {item.value}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <Card className="relative overflow-hidden rounded-[32px] border-blue-100 bg-slate-950 py-0 text-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.8)]">
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.35),transparent_60%)]" />
            <CardHeader className="relative space-y-4 px-6 pt-6 sm:px-8 sm:pt-8">
              <div className="flex items-center justify-between">
                <Badge className="rounded-full bg-white/10 px-3 py-1 text-blue-100 ring-1 ring-white/15">
                  Live preview
                </Badge>
                <span className="text-sm text-blue-100/70">Today</span>
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  Front desk snapshot
                </CardTitle>
                <CardDescription className="mt-2 max-w-sm text-blue-100/70">
                  A more productized landing page gives patients and staff a
                  clearer split between conversation flow and operations flow.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-4 px-6 pb-6 sm:px-8 sm:pb-8">
              <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-100">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Patient chat</p>
                      <p className="text-sm text-blue-100/70">
                        Bookings, FAQs, intake guidance
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-200">
                    Online
                  </span>
                </div>
                <div className="grid gap-3 rounded-2xl bg-white p-3 text-slate-900">
                  <div className="rounded-2xl bg-blue-50 p-3">
                    <p className="text-sm font-medium text-slate-950">
                      Patient
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      I need the earliest pediatric appointment this week.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-950">Cortex</p>
                    <p className="mt-1 text-sm text-slate-600">
                      I found two openings on Wednesday. Would you prefer the
                      morning or afternoon slot?
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                  <p className="text-sm text-blue-100/70">Confirmed today</p>
                  <p className="mt-2 text-3xl font-semibold text-white">18</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                  <p className="text-sm text-blue-100/70">Avg. reply quality</p>
                  <p className="mt-2 text-3xl font-semibold text-white">High</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {highlights.map((item) => (
            <Card
              key={item.title}
              className="rounded-[28px] border-blue-100/80 bg-white/85 py-6 shadow-[0_20px_60px_-45px_rgba(37,99,235,0.4)] backdrop-blur"
            >
              <CardHeader className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-slate-950">{item.title}</CardTitle>
                  <CardDescription className="mt-2 leading-6 text-slate-600">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 pb-6 md:grid-cols-2">
          <Link href="/chat">
            <Card className="group rounded-[28px] border-blue-100 bg-gradient-to-br from-white to-blue-50/70 py-6 shadow-[0_20px_60px_-45px_rgba(37,99,235,0.45)] transition-transform hover:-translate-y-0.5">
              <CardHeader className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-950">
                    I&apos;m a patient
                  </CardTitle>
                  <CardDescription className="mt-2 text-base leading-7 text-slate-600">
                    Chat with Cortex to book appointments, ask policy questions,
                    and get routed without waiting for the front desk.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-sm font-medium text-blue-700">
                Start chat
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard">
            <Card className="group rounded-[28px] border-blue-100 bg-white/90 py-6 shadow-[0_20px_60px_-45px_rgba(37,99,235,0.35)] transition-transform hover:-translate-y-0.5">
              <CardHeader className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-lg shadow-slate-900/20">
                  <LayoutDashboard className="h-7 w-7" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-950">
                    Staff dashboard
                  </CardTitle>
                  <CardDescription className="mt-2 text-base leading-7 text-slate-600">
                    Review scheduling, providers, forms, and patient records in
                    a cleaner operations workspace with better visual hierarchy.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-sm font-medium text-slate-700">
                Open dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>
        </section>
      </div>
    </main>
  );
}
