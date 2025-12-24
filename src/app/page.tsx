
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, firebaseReady } from '@/lib/firebase';
import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { ValueProps } from '@/components/home/ValueProps';
import { Footer } from '@/components/shared/Footer';
import { Navbar } from '@/components/shared/Navbar';
import { Skeleton } from '@/components/ui/skeleton';

function HomePageContent() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <ValueProps />
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container py-20 md:py-32">
      <div className="flex flex-col items-center gap-6 text-center">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex gap-4">
          <Skeleton className="h-11 w-40" />
          <Skeleton className="h-11 w-40" />
        </div>
      </div>
    </div>
  );
}


export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false); // Firebase isn't ready, so we assume no user.
      return;
    }

    // Safety timeout in case Firebase auth hangs
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeoutId);
      if (currentUser) {
        setLoading(false); // Unblock UI while redirecting
        router.push('/dashboard');
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-6">
        {loading ? <LoadingSkeleton /> : <HomePageContent />}
      </main>
      {!loading && <Footer />}
    </div>
  );
}
