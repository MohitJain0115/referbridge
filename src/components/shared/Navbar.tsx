
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db, firebaseReady } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Menu, UserCircle, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

export function Navbar() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [referralRequestCount, setReferralRequestCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!firebaseReady) {
      setIsLoading(false);
      return;
    };
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser || !db) {
      setReferralRequestCount(0);
      return;
    }

    const requestsQuery = query(
      collection(db, 'referral_requests'),
      where('referrerId', '==', currentUser.uid),
      where('status', '==', 'Pending')
    );
    
    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      setReferralRequestCount(snapshot.size);
    }, (error) => {
      console.error('Error fetching referral request count:', error);
      setReferralRequestCount(0);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: 'An error occurred while logging out.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Logo />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {currentUser && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
               <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>A list of links to navigate the application.</SheetDescription>
              </SheetHeader>
              <div className="flex h-16 items-center border-b px-6">
                <Logo />
              </div>
              <div className="flex-1">
                <DashboardNav referralRequestCount={referralRequestCount} onNavigate={() => setIsSheetOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        )}
        
        <div className="flex w-full items-center gap-4">
            <div className="hidden md:flex">
             <Logo />
            </div>
            <div className="ml-auto flex items-center gap-4">
                {!currentUser ? (
                    <nav className="flex items-center space-x-2">
                        <Button variant="ghost" asChild>
                        <Link href="/login">Login</Link>
                        </Button>
                        <Button asChild>
                        <Link href="/signup">Sign Up</Link>
                        </Button>
                    </nav>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <UserCircle className="h-5 w-5" />
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                            <Link href="/seeker-profile">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
      </div>
    </header>
  );
}
