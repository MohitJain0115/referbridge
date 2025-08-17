
"use client";

import { useState, useEffect } from "react";
import { CandidateGrid } from "./CandidateGrid";
import type { Candidate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { User } from "firebase/auth";
import { calculateTotalExperienceInYears } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

function CandidateGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-[400px] w-full" />
      ))}
    </div>
  );
}

export function ReferrerDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = auth.onAuthStateChanged((user) => {
        setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    async function fetchData() {
        if (!firebaseReady || !currentUser) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            // Fetch current user's profile to check for premium status
            const userProfileRef = doc(db, "profiles", currentUser.uid);
            const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists() && userProfileSnap.data().isPremiumReferrer === true) {
              setIsPremium(true);
            }

            const profilesRef = collection(db, "profiles");
            const q = query(profilesRef);
            const querySnapshot = await getDocs(q);

            const fetchedCandidates = querySnapshot.docs
                .filter(doc => doc.id !== currentUser.uid)
                .map(doc => {
                    const data = doc.data();
                    const experiences = data.experiences || [];
                    const totalExperience = calculateTotalExperienceInYears(experiences);

                    return {
                        id: doc.id,
                        name: data.name || "Unnamed Candidate",
                        avatar: data.profilePic || "https://placehold.co/100x100.png",
                        currentRole: data.currentRole || "N/A",
                        targetRole: data.targetRole || "",
                        company: experiences.length > 0 ? experiences[0].company : "", 
                        salary: data.expectedSalary || 0,
                        salaryCurrency: data.expectedSalaryCurrency || 'USD',
                        isSalaryVisible: data.isSalaryVisible !== false,
                        skills: data.skills || [],
                        location: data.location || "Remote",
                        experience: totalExperience,
                        status: data.status || 'Pending',
                        jobPostUrl: "",
                        targetCompanies: data.companies?.map((c: any) => c.name).filter(Boolean) || [],
                    } as Candidate
                });
            
            for (let i = fetchedCandidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [fetchedCandidates[i], fetchedCandidates[j]] = [fetchedCandidates[j], fetchedCandidates[i]];
            }
            
            setCandidates(fetchedCandidates);
        } catch (error) {
            console.error("Failed to fetch candidates:", error);
            toast({
                title: "Error",
                description: "Could not fetch candidate data. Please check your Firestore connection and rules.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [currentUser, toast]);

  return (
    <div className="space-y-6">
      {isPremium && (
          <div className="p-4 bg-accent/10 rounded-lg border border-dashed border-accent flex items-center justify-center">
              <Crown className="h-6 w-6 text-accent mr-3" />
              <p className="text-lg font-semibold text-accent-foreground">You are a Premium Referrer!</p>
          </div>
      )}
      {isLoading && candidates.length === 0 ? <CandidateGridSkeleton /> : <CandidateGrid candidates={candidates} showCancelAction={false} />}
    </div>
  );
}
