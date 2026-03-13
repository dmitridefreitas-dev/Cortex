import {
  MessageCircle,
  LayoutDashboard,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 ring-1 ring-blue-500/20">
          <Stethoscope className="h-4 w-4" />
          AI-Powered Clinic Receptionist
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl">
          Cortex
        </h1>
        <p className="mx-auto max-w-xl text-lg text-slate-600">
          Your 24/7 AI receptionist that handles appointments, answers
          questions, and manages patient interactions.
        </p>
      </div>

      {/* Two CTA Cards */}
      <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
        {/* Patient Card */}
        <Link
          href="/chat"
          className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">
            I&apos;m a Patient
          </h2>
          <p className="mb-6 text-center text-sm text-slate-500">
            Chat with our AI receptionist to book appointments, ask questions,
            or get help.
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 group-hover:gap-2.5 transition-all">
            Start Chat <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        {/* Staff Card */}
        <Link
          href="/dashboard"
          className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-slate-400 hover:shadow-md"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-200">
            <LayoutDashboard className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-slate-900">
            Staff Dashboard
          </h2>
          <p className="mb-6 text-center text-sm text-slate-500">
            Manage appointments, patients, providers, services, and clinic
            settings.
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 group-hover:gap-2.5 transition-all">
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </main>
  );
}
