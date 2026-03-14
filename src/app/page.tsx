import { ArrowRight, LayoutDashboard, MessageCircle, Stethoscope } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const options = [
  {
    href: "/chat",
    title: "Patient",
    description: "Chat with Cortex for appointments, answers, and help.",
    icon: MessageCircle,
    accent:
      "border-blue-500/20 bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_20px_50px_-30px_rgba(37,99,235,0.65)]",
  },
  {
    href: "/dashboard",
    title: "Staff Dashboard",
    description: "Manage clinic operations, patients, scheduling, and settings.",
    icon: LayoutDashboard,
    accent:
      "border-blue-100 bg-white text-slate-950 shadow-[0_20px_50px_-30px_rgba(37,99,235,0.3)]",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-5xl">
        <div className="mx-auto mb-10 flex w-fit items-center gap-3 rounded-full border border-blue-100 bg-white/85 px-5 py-3 shadow-sm backdrop-blur">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-950">Cortex</p>
            <p className="text-sm text-slate-500">Choose your portal</p>
          </div>
        </div>

        <section className="grid gap-5 md:grid-cols-2">
          {options.map((option) => (
            <Link key={option.href} href={option.href} className="group block">
              <Card
                className={`h-full rounded-[32px] border bg-white/90 py-8 transition-transform hover:-translate-y-1 ${option.accent}`}
              >
                <CardHeader className="space-y-6">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-3xl ${
                      option.href === "/chat"
                        ? "bg-white/15 text-white ring-1 ring-white/15"
                        : "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                    }`}
                  >
                    <option.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <CardTitle
                      className={
                        option.href === "/chat"
                          ? "text-3xl text-white"
                          : "text-3xl text-slate-950"
                      }
                    >
                      {option.title}
                    </CardTitle>
                    <p
                      className={`mt-3 text-base leading-7 ${
                        option.href === "/chat"
                          ? "text-blue-50/90"
                          : "text-slate-600"
                      }`}
                    >
                      {option.description}
                    </p>
                  </div>
                </CardHeader>
                <CardContent
                  className={`mt-8 flex items-center gap-2 text-sm font-medium ${
                    option.href === "/chat" ? "text-white" : "text-blue-700"
                  }`}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
