import { type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
}

export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <div className="hidden lg:block fixed left-0 top-0 h-full">
        <Sidebar />
      </div>
      <div className="flex-1 lg:ml-64 min-w-0">
        <Navbar title={title} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
