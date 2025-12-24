
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, firebaseReady } from '@/lib/firebase';
import { Navbar } from '@/components/shared/Navbar';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden md:block w-64 border-r bg-background p-4">
          <div className="space-y-4 py-4">
            <div className="px-3 py-2 space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </div>
        </aside>
        <main className="flex-1 bg-muted/40 p-4 md:p-10">
          <Skeleton className="h-[500px] w-full" />
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false); // Assume no user if Firebase isn't ready
      router.push('/login');
      return;
    }

    // Safety timeout
    const timeoutId = setTimeout(() => {
      setLoading(false);
      router.push('/login');
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeoutId);
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        router.push('/login');
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [router]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null; // or a redirect component, though the effect handles it
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <div className="flex flex-1">
        <aside className="hidden md:block w-64 border-r bg-background p-4">
          <DashboardNav />
        </aside>
        <main className="flex-1 bg-muted/40 p-4 md:p-10 px-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
