"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Users, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'seeker';
  const currentPage = searchParams.get('page');

  const seekerNav = [
    { name: "Find Referrers", href: "/dashboard?view=seeker", icon: Users, page: null },
    { name: "My Referrals", href: "/dashboard?view=seeker&page=referred", icon: FileText, page: "referred" },
    { name: "Settings", href: "/dashboard?view=seeker&page=settings", icon: Settings, page: "settings" },
  ];

  const referrerNav = [
    { name: "Candidates", href: "/dashboard?view=referrer", icon: Users, page: null },
    { name: "Referred", href: "/dashboard?view=referrer&page=referred", icon: FileText, page: "referred" },
    { name: "Settings", href: "/dashboard?view=referrer&page=settings", icon: Settings, page: "settings" },
  ];

  const navItems = view === 'seeker' ? seekerNav : referrerNav;

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => {
        const isActive = (pathname === '/dashboard' && item.page === currentPage);

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive && "bg-muted text-primary"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
