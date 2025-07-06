
"use client";

import { useState, useEffect } from "react";
import { CandidateGrid } from "./CandidateGrid";
import type { Candidate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { User } from "firebase/auth";

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
                .filter(doc => doc.id !== currentUser.uid) // Filter out the current user
                .map(doc => {
                    const data = doc.data();
                    const experienceYears = data.experienceYears || 0;

                    return {
                        id: doc.id,
                        name: data.name || "Unnamed Candidate",
                        avatar: data.profilePic || "https://placehold.co/100x100.png",
                        role: data.targetRole || data.currentRole || "N/A",
                        company: data.experiences?.[0]?.company || "", // From work experience
                        salary: data.expectedSalary || 0,
                        isSalaryVisible: data.isSalaryVisible !== false,
                        skills: data.referrerSpecialties?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
                        location: data.location || "Remote",
                        experience: experienceYears,
                        status: data.status || 'Pending',
                        jobPostUrl: data.companies?.[0]?.jobs?.[0]?.url || '',
                        targetCompanies: data.companies?.map((c: any) => c.name).filter(Boolean) || [],
                    } as Candidate
                });
            
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
