import type { Metadata } from "next";
import "@fontsource/inter";
import "@fontsource/outfit";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cortex - AI Clinic Receptionist",
  description: "Intelligent AI receptionist for medical clinics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased text-slate-800 selection:bg-blue-500/20 selection:text-blue-950">
        {children}
      </body>
    </html>
  );
}
