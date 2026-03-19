"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UserCheck,
  Users,
  FileText,
  MessageSquare,
  Radio,
  AlertTriangle,
  Stethoscope,
  Briefcase,
  CalendarClock,
  Settings,
  HelpCircle,
  Menu,
  ExternalLink,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";


const navSections = [
  {
    title: "OPERATIONS",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
      { href: "/dashboard/check-in", label: "Check-In", icon: UserCheck },
    ],
  },
  {
    title: "PATIENTS",
    items: [
      { href: "/dashboard/patients", label: "Patient Records", icon: Users },
      { href: "/dashboard/forms", label: "Intake Forms", icon: FileText },
      { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
      { href: "/dashboard/conversations/live", label: "Live Monitor", icon: Radio },
      { href: "/dashboard/conversations/handoffs", label: "Handoff Queue", icon: AlertTriangle },
    ],
  },
  {
    title: "CLINIC",
    items: [
      { href: "/dashboard/providers", label: "Providers", icon: Stethoscope },
      { href: "/dashboard/services", label: "Services", icon: Briefcase },
      { href: "/dashboard/schedules", label: "Schedules", icon: CalendarClock },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { href: "/dashboard/settings", label: "Clinic Settings", icon: Settings },
      { href: "/dashboard/settings/faq", label: "FAQ", icon: HelpCircle },
    ],
  },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      {navSections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-blue-50 font-medium text-blue-700"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
        <Bot className="h-5 w-5" />
      </div>
      <span className="text-lg font-semibold text-foreground">Cortex</span>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: Hamburger + Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="fixed left-4 top-4 z-50 lg:hidden inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent hover:text-accent-foreground" aria-label="Toggle menu">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="border-b px-6 py-5">
              <BrandLogo />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <NavContent onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t p-4">
              <Link
                href="/chat"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Bot className="h-4 w-4" />
                View Patient Chat
                <ExternalLink className="h-3.5 w-3 shrink-0 opacity-60" />
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: Fixed sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background lg:flex">
        <div className="flex h-full flex-col">
          <div className="border-b px-6 py-5">
            <BrandLogo />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <NavContent />
          </div>
          <div className="border-t p-4">
            <Link
              href="/chat"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Bot className="h-4 w-4" />
              View Patient Chat
              <ExternalLink className="h-3.5 w-3 shrink-0 opacity-60" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
