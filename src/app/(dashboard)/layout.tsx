import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(147,197,253,0.35),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(191,219,254,0.5),transparent_28%)]" />
      <div className="relative flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
