"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Home, User, Users, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardNav() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'seeker';

  const seekerNav = [
    { name: "Dashboard", href: "/dashboard?view=seeker", icon: Home },
    { name: "My Profile", href: "/seeker-profile", icon: User },
    { name: "Settings", href: "/dashboard?view=seeker&page=settings", icon: Settings },
  ];

  const referrerNav = [
    { name: "Candidates", href: "/dashboard?view=referrer", icon: Users },
    { name: "Referred", href: "/dashboard?view=referrer&page=referred", icon: FileText },
    { name: "Settings", href: "/dashboard?view=referrer&page=settings", icon: Settings },
  ];

  const navItems = view === 'seeker' ? seekerNav : referrerNav;
  
  // A simple way to determine active link for demo. A real app would use usePathname.
  const isActive = (href: string) => href.startsWith('/dashboard') && view === (href.includes('referrer') ? 'referrer' : 'seeker');

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            { "bg-muted text-primary": item.name === 'Dashboard' || item.name === 'Candidates' } // Mock active state
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
