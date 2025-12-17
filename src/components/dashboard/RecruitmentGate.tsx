"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase";
import { RecruitmentSpecialistDashboard } from "./RecruitmentSpecialistDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export function RecruitmentGate() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAllowed(user?.email?.toLowerCase() === 'mohitjain3579@gmail.com');
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (!isAllowed) {
    return (
      <div className="p-6 border rounded-md text-center text-muted-foreground">
        You are not authorized to access the Recruitment Specialist section.
      </div>
    );
  }

  return <RecruitmentSpecialistDashboard />;
}

