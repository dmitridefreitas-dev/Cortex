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
    <nav className="flex flex-col gap-1.5 p-4">
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
              "flex items-center min-h-[44px] gap-3 rounded-lg px-4 text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-slate-400")} />
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
        <SheetTrigger className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2.5 shadow-sm ring-1 ring-slate-200 lg:hidden hover:bg-slate-50 transition-colors">
          <Menu className="h-5 w-5 text-slate-700" />
          <span className="sr-only">Toggle menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 border-r-slate-200">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6 mt-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Cortex</span>
          </div>
          {nav}
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden w-[280px] flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-20 items-center gap-3 px-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">Cortex</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {nav}
        </div>
        <div className="border-t border-slate-200 p-4">
          <Link
            href="/chat"
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ExternalLink className="h-4 w-4" />
            View Patient Chat
          </Link>
        </div>
      </aside>
    </>
  );
}
