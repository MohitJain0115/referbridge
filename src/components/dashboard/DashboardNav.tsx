
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Users, Settings, Mail, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function DashboardNav({ onNavigate, referralRequestCount = 0 }: { onNavigate?: () => void, referralRequestCount?: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'seeker';
  const currentPage = searchParams.get('page');

  const navItems = [
    { name: "Find Referrers", href: "/dashboard?view=seeker", icon: Users, page: null, view: 'seeker', show: true },
    { name: "My Requests", href: "/dashboard?view=seeker&page=requests", icon: Mail, page: "requests", view: 'seeker', show: true },
    { name: "Candidates", href: "/dashboard?view=referrer", icon: Users, page: null, view: 'referrer', show: true },
    { name: "Referral Requests", href: "/dashboard?view=referrer&page=requests", icon: ArrowRightLeft, page: "requests", view: 'referrer', count: referralRequestCount, show: true },
  ];

  const settingsItem = { name: "Settings", href: `/dashboard?view=${view}&page=settings`, icon: Settings, page: "settings", view: 'any', show: true };

  const isSeeker = view === 'seeker';

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">Job Seeker</p>
      {navItems.filter(item => item.view === 'seeker').map((item, index) => {
        const isPageActive = item.page === currentPage;
        const isViewActive = item.view === view;
        const isActive = isPageActive && isViewActive && !item.page?.includes('requests');

        return (
           <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              view === 'seeker' && item.page === currentPage && "bg-muted text-primary"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
      
      <p className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground">Referrer</p>
      {navItems.filter(item => item.view === 'referrer').map((item, index) => {
        return (
           <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
               view === 'referrer' && item.page === currentPage && "bg-muted text-primary"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              {item.name}
            </div>
            {item.count !== undefined && item.count > 0 && (
                <Badge className="h-5 w-5 shrink-0 justify-center rounded-full p-0">
                  {item.count}
                </Badge>
            )}
          </Link>
        )
      })}

      <p className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground">Account</p>
       <Link
            key={settingsItem.name}
            href={settingsItem.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              settingsItem.page === currentPage && "bg-muted text-primary"
            )}
          >
            <settingsItem.icon className="h-4 w-4" />
            {settingsItem.name}
          </Link>
    </nav>
  );
}
