
'use client';

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, UserCircle, LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signOut, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [referralRequestCount, setReferralRequestCount] = useState(0);
  const [isProfileCheckComplete, setIsProfileCheckComplete] = useState(false);

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // This is the ideal place to check for the profile, as it runs once on auth state change.
        await checkProfile(user);
      } else {
        setCurrentUser(null);
        setIsProfileCheckComplete(false); // Reset check on logout
        setShowProfileDialog(false); // Hide dialog on logout
      }
    });
    return () => unsubscribe();
  }, []);
  
  const checkProfile = async (user: FirebaseUser) => {
    if (!db) {
        setIsProfileCheckComplete(true);
        return;
    }
    // Don't show the dialog if the user is already on the profile page
    if (pathname === '/seeker-profile') {
        setIsProfileCheckComplete(true);
        return;
    }

    try {
        const profileDocRef = doc(db, 'profiles', user.uid);
        const profileDoc = await getDoc(profileDocRef);
        if (!profileDoc.exists()) {
            setShowProfileDialog(true);
        }
    } catch (error) {
        console.error("Error checking for profile:", error);
        toast({
            title: "Error",
            description: "Could not check for user profile. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsProfileCheckComplete(true);
    }
  };

  useEffect(() => {
    if (!currentUser || !db) {
      setReferralRequestCount(0);
      return;
    }

    const requestsQuery = query(
      collection(db, "referral_requests"), 
      where("referrerId", "==", currentUser.uid),
      where("status", "==", "Pending")
    );
    
    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      setReferralRequestCount(snapshot.size);
    }, (error) => {
      console.error("Error fetching referral request count:", error);
      setReferralRequestCount(0);
    });

    return () => unsubscribe();
  }, [currentUser]);


  const handleGoToProfile = () => {
    setShowProfileDialog(false);
    router.push('/seeker-profile');
  };

  const handleLogout = async () => {
    if (!auth) {
       toast({
        title: "Logout Failed",
        description: "Authentication service not available.",
        variant: "destructive"
      });
      return;
    }
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/login");
    } catch (error) {
       toast({
        title: "Logout Failed",
        description: "An error occurred while logging out.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>
                A list of links to navigate the application.
              </SheetDescription>
            </SheetHeader>
            <div className="flex h-16 items-center border-b px-6">
              <Logo />
            </div>
            <div className="flex-1">
                <DashboardNav referralRequestCount={referralRequestCount} onNavigate={() => setIsSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="ml-auto flex-1 sm:flex-initial" />
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
        </div>
      </header>
      <main className="flex-1 bg-muted/40 p-4 md:p-10">
        <div className="mx-auto w-full max-w-7xl">
          {isProfileCheckComplete && children}
        </div>
      </main>
      <AlertDialog open={showProfileDialog}>
        <AlertDialogContent onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Welcome to ReferBridge!</AlertDialogTitle>
            <AlertDialogDescription>
              To get started, you must set up your profile. This is how you'll get noticed by potential referrers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={handleLogout}>Log Out</Button>
            <AlertDialogAction onClick={handleGoToProfile}>Set Up Profile</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
