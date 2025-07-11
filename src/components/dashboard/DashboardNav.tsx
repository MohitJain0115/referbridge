
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Users, Settings, Mail, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'seeker';
  const currentPage = searchParams.get('page');

  const navItems = [
    { name: "Find Referrers", href: "/dashboard?view=seeker", icon: Users, page: null, view: 'seeker' },
    { name: "My Requests", href: "/dashboard?view=seeker&page=requests", icon: Mail, page: "requests", view: 'seeker' },
    { name: "---", href: "---", icon: null, page: null, view: null },
    { name: "Candidates", href: "/dashboard?view=referrer", icon: Users, page: null, view: 'referrer' },
    { name: "Referral Requests", href: "/dashboard?view=referrer&page=requests", icon: ArrowRightLeft, page: "requests", view: 'referrer' },
    { name: "---", href: "---", icon: null, page: null, view: null },
    { name: "Settings", href: `/dashboard?view=${view}&page=settings`, icon: Settings, page: "settings", view: 'any' },
  ];


  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navItems.map((item, index) => {
        if (item.name === "---") {
          return <Separator key={index} className="my-2" />;
        }
        
        const isPageActive = item.page === currentPage;
        const isViewActive = item.view === view;
        const isActive = (item.view === 'any' ? isPageActive : isPageActive && isViewActive);

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
