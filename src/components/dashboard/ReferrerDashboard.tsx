
"use client";

import { useState, useEffect } from "react";
import { CandidateGrid } from "./CandidateGrid";
import type { Candidate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { User } from "firebase/auth";
import { calculateTotalExperienceInYears } from "@/lib/utils";

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
            const querySnapshot = await getDocs(collection(db, "profiles"));
            const fetchedCandidates = querySnapshot.docs
                .filter(doc => doc.id !== currentUser.uid) 
                .map(doc => {
                    const data = doc.data();
                    const totalExperience = calculateTotalExperienceInYears(data.experiences);

                    return {
                        id: doc.id,
                        name: data.name || "Unnamed Candidate",
                        avatar: data.profilePic || "https://placehold.co/100x100.png",
                        currentRole: data.currentRole || "N/A",
                        targetRole: data.targetRole,
                        company: data.experiences?.[0]?.company || "", 
                        salary: data.expectedSalary || 0,
                        salaryCurrency: data.expectedSalaryCurrency || 'USD',
                        isSalaryVisible: data.isSalaryVisible !== false,
                        skills: data.skills || [],
                        location: data.location || "Remote",
                        experience: totalExperience,
                        status: data.status || 'Pending',
                        jobPostUrl: "", // Do not show job post URL on the generic dashboard
                        targetCompanies: data.companies?.map((c: any) => c.name).filter(Boolean) || [],
                    } as Candidate
                });
            
            // Randomize the order of candidates
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
      {isLoading && candidates.length === 0 ? <CandidateGridSkeleton /> : <CandidateGrid candidates={candidates} showCancelAction={false} />}
    </div>
  );
}
