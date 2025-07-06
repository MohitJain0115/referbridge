

"use client";

import { useState, useEffect } from "react";
import { CandidateGrid } from "./CandidateGrid";
import type { Candidate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

function CandidateGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-[400px] w-full" />
      ))}
    </div>
  );
}

const calculateTotalExperience = (experiences: any[] | undefined): number => {
    if (!experiences) return 0;

    let totalMonths = 0;
    const now = new Date();

    experiences.forEach((exp: any) => {
        const startDate = exp.from?.toDate ? exp.from.toDate() : null;
        if (!startDate) return;

        const endDate = exp.currentlyWorking ? now : (exp.to?.toDate ? exp.to.toDate() : null);
        if (!endDate) return;

        let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        months -= startDate.getMonth();
        months += endDate.getMonth();
        
        if (months > 0) {
            totalMonths += months;
        }
    });

    return Math.floor(totalMonths / 12);
};


export function ReferralRequestsPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [requestedCandidates, setRequestedCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!firebaseReady) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setCurrentUser(user);
        } else {
            setIsLoading(false);
        }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchData() {
       if (!currentUser || !db) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const requestsQuery = query(collection(db, "referral_requests"), where("referrerId", "==", currentUser.uid));
        const requestSnapshots = await getDocs(requestsQuery);

        if (requestSnapshots.empty) {
            setRequestedCandidates([]);
            setIsLoading(false);
            return;
        }

        const candidatePromises = requestSnapshots.docs.map(async (requestDoc) => {
          const requestData = requestDoc.data();
          const seekerDocRef = doc(db, "profiles", requestData.seekerId);
          const seekerDoc = await getDoc(seekerDocRef);

          if (!seekerDoc.exists()) {
            console.warn(`Seeker profile not found for ID: ${requestData.seekerId}`);
            return null;
          }
          
          const seekerData = seekerDoc.data();
          const totalExperience = calculateTotalExperience(seekerData.experiences);

          return {
              id: seekerDoc.id, 
              requestId: requestDoc.id, 
              name: seekerData.name || "Unnamed Candidate",
              avatar: seekerData.profilePic || "https://placehold.co/100x100.png",
              currentRole: seekerData.currentRole || "N/A",
              targetRole: seekerData.targetRole,
              company: seekerData.experiences?.[0]?.company || "",
              salary: seekerData.expectedSalary || 0,
              isSalaryVisible: seekerData.hasOwnProperty('isSalaryVisible') ? seekerData.isSalaryVisible : true,
              skills: seekerData.referrerSpecialties?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
              location: seekerData.location || "Remote",
              experience: totalExperience,
              status: requestData.status, 
              jobPostUrl: requestData.jobInfo || seekerData.companies?.[0]?.jobs?.[0]?.url || '',
              targetCompanies: seekerData.companies?.map((c: any) => c.name).filter(Boolean) || [],
          } as Candidate;
        });

        const results = (await Promise.all(candidatePromises)).filter(Boolean) as Candidate[];
        setRequestedCandidates(results);

      } catch (error) {
        console.error("Failed to generate requested candidates:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser, toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold md:text-2xl font-headline">
          Referral Requests
        </h1>
        <p className="text-muted-foreground">
          Candidates who have specifically requested a referral from you.
        </p>
      </div>
      {isLoading ? <CandidateGridSkeleton /> : <CandidateGrid candidates={requestedCandidates} showCancelAction={true} />}
    </div>
  );
}
