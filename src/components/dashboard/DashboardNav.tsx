
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Users, Settings, Mail, ArrowRightLeft, MessageSquare, Flame, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase";

export function DashboardNav({ onNavigate, referralRequestCount = 0 }: { onNavigate?: () => void, referralRequestCount?: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'seeker';
  const currentPage = searchParams.get('page');

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const isRecruitmentAccess = isDeveloper;

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsDeveloper(user?.email?.toLowerCase() === 'mohitjain3579@gmail.com');
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { name: "Find Referrers", href: "/dashboard?view=seeker", icon: Users, page: null, view: 'seeker', show: true },
    { name: "My Requests", href: "/dashboard?view=seeker&page=requests", icon: Mail, page: "requests", view: 'seeker', show: true },
    { name: "Candidates", href: "/dashboard?view=referrer", icon: Users, page: null, view: 'referrer', show: true },
    { name: "Referral Requests", href: "/dashboard?view=referrer&page=requests", icon: ArrowRightLeft, page: "requests", view: 'referrer', count: referralRequestCount, show: true },
    { name: "Recruitment Specialist", href: "/dashboard?view=recruitment", icon: Users, page: null, view: 'recruitment', show: isRecruitmentAccess },
  ];

  const developerItem = { name: "Developer", href: `/dashboard?view=${view}&page=developer`, icon: Flame, page: "developer", view: 'any', show: isDeveloper };
  const settingsItem = { name: "Settings", href: `/dashboard?view=${view}&page=settings`, icon: Settings, page: "settings", view: 'any', show: true };
  const referAndEarnItem = { name: "Refer & Earn", href: `/dashboard?view=${view}&page=refer-and-earn`, icon: Gift, page: "refer-and-earn", view: 'any', show: true };
  const suggestionsItem = { name: "Suggestions", href: `/dashboard?view=${view}&page=suggestions`, icon: MessageSquare, page: "suggestions", view: 'any', show: true };


  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">Job Seeker</p>
      {navItems.filter(item => item.view === 'seeker' && item.show).map((item, index) => {
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
      {navItems.filter(item => (item.view === 'referrer' || item.view === 'recruitment') && item.show).map((item, index) => {
        return (
           <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
               view === 'referrer' && item.view === 'referrer' && item.page === currentPage && "bg-muted text-primary" ||
               view === 'recruitment' && item.view === 'recruitment' && item.page === currentPage && "bg-muted text-primary" ||
               view === 'referrer' && item.view === 'referrer' && !item.page && !currentPage && "bg-muted text-primary" ||
               view === 'recruitment' && item.view === 'recruitment' && !item.page && !currentPage && "bg-muted text-primary"
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
            key={suggestionsItem.name}
            href={suggestionsItem.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              suggestionsItem.page === currentPage && "bg-muted text-primary"
            )}
          >
            <suggestionsItem.icon className="h-4 w-4" />
            {suggestionsItem.name}
          </Link>
      {developerItem.show && (
        <Link
            key={developerItem.name}
            href={developerItem.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              developerItem.page === currentPage && "bg-muted text-primary"
            )}
          >
            <developerItem.icon className="h-4 w-4" />
            {developerItem.name}
          </Link>
      )}
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
       <Link
            key={referAndEarnItem.name}
            href={referAndEarnItem.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              referAndEarnItem.page === currentPage && "bg-muted text-primary"
            )}
          >
            <referAndEarnItem.icon className="h-4 w-4" />
            {referAndEarnItem.name}
          </Link>
    </nav>
  );
}
