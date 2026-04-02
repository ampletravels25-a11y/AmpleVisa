"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Globe,
  FileText,
  Users,
  Building2,
  CreditCard,
  Share2,
  UserCog,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Countries", href: "/admin/countries", icon: Globe },
  { label: "Applications", href: "/admin/applications", icon: FileText },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Share Analytics", href: "/admin/shares", icon: Share2 },
  { label: "Team", href: "/admin/team", icon: UserCog },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-slate-900 min-h-screen">
      <div className="p-6 border-b border-slate-700">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AV</span>
          </div>
          <span className="text-xl font-bold text-white">AmpleVisa</span>
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full ml-1">
            Admin
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
