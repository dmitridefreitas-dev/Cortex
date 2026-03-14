"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Users,
  Stethoscope,
  Clock,
  UserCircle,
  Settings,
  LayoutDashboard,
  Menu,
  MessageSquare,
  FileText,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "Appointments", icon: Calendar },
  { href: "/dashboard/patients", label: "Patients", icon: UserCircle },
  { href: "/dashboard/providers", label: "Providers", icon: Stethoscope },
  { href: "/dashboard/services", label: "Services", icon: Users },
  { href: "/dashboard/schedules", label: "Schedules", icon: Clock },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/forms", label: "Intake Forms", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/settings/faq", label: "FAQ", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1.5">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-[46px] items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-all",
              isActive
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/15"
                : "text-slate-600 hover:bg-blue-50/80 hover:text-slate-950"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5",
                isActive ? "text-white" : "text-slate-400"
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="fixed left-4 top-4 z-50 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-lg shadow-blue-500/10 backdrop-blur transition-colors hover:bg-blue-50 lg:hidden">
          <Menu className="h-5 w-5 text-slate-700" />
          <span className="sr-only">Toggle menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] border-r border-blue-100 bg-white/95 p-0 backdrop-blur">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="border-b border-blue-100 px-6 pb-5 pt-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">Cortex</p>
                  <p className="text-sm text-muted-foreground">
                    Clinic operations
                  </p>
                </div>
              </div>
            </div>
            <div className="flex-1 px-4 py-5">
              <div className="mb-4 flex items-center justify-between px-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Workspace
                </p>
                <Badge className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 ring-1 ring-blue-100">
                  Live
                </Badge>
              </div>
              {nav}
            </div>
            <div className="border-t border-blue-100 p-4">
              <Link
                href="/chat"
                target="_blank"
                className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                <ExternalLink className="h-4 w-4" />
                View Patient Chat
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden w-[300px] flex-col p-4 lg:flex">
        <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[30px] border border-white/70 bg-white/85 p-4 shadow-[0_30px_80px_-45px_rgba(37,99,235,0.35)] backdrop-blur">
          <div className="flex items-center gap-3 rounded-[24px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/80 px-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-slate-950">
                Cortex
              </p>
              <p className="text-sm text-muted-foreground">
                AI clinic operations
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Workspace
            </p>
            <Badge className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 ring-1 ring-blue-100">
              Live
            </Badge>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto rounded-[24px] border border-blue-100/70 bg-white/70 p-2">
            {nav}
          </div>

          <div className="mt-4 rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
            <p className="text-sm font-medium text-slate-950">
              Patient-facing flow
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Open the live chat view to see the white-and-blue patient
              experience from the other side.
            </p>
          </div>

          <Link
            href="/chat"
            target="_blank"
            className="mt-4 flex items-center gap-2 rounded-2xl border border-blue-100 bg-slate-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-900"
          >
            <ExternalLink className="h-4 w-4" />
            View Patient Chat
          </Link>
        </div>
      </aside>
    </>
  );
}
