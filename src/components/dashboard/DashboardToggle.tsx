"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { User, Lock, Briefcase, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth, firebaseReady } from "@/lib/firebase";

type DashboardToggleProps = {
  currentView: 'seeker' | 'referrer' | string;
};

export function DashboardToggle({ currentView }: DashboardToggleProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isRecruitmentAccess, setIsRecruitmentAccess] = useState(false);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsRecruitmentAccess(user?.email?.toLowerCase() === 'mohitjain3579@gmail.com');
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-sm text-muted-foreground hidden md:inline">FIND:</span>
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
        <Button asChild variant={currentView === 'seeker' ? 'default' : 'ghost'} size="sm" className={cn("transition-all", { 'shadow-md': currentView === 'seeker' })}>
          <Link href="/dashboard?view=seeker">Referrer</Link>
        </Button>
        <Button asChild variant={currentView === 'referrer' ? 'default' : 'ghost'} size="sm" className={cn("transition-all", { 'shadow-md': currentView === 'referrer' })}>
          <Link href="/dashboard?view=referrer">Job Seeker</Link>
        </Button>
        {isRecruitmentAccess && (
          <Button asChild variant={currentView === 'recruitment' ? 'default' : 'ghost'} size="sm" className={cn("transition-all", { 'shadow-md': currentView === 'recruitment' })}>
            <Link href="/dashboard?view=recruitment">Recruitment</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
