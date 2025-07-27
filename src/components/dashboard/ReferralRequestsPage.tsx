

"use client";

import { useState, useEffect } from "react";
import { CandidateGrid } from "./CandidateGrid";
import type { Candidate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth, db, firebaseReady } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { calculateTotalExperienceInYears } from "@/lib/utils";

function CandidateGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-[400px] w-full" />
      ))}
    </div>
  );
}

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
        const requestsQuery = query(
          collection(db, "referral_requests"), 
          where("referrerId", "==", currentUser.uid)
        );
        const requestSnapshots = await getDocs(requestsQuery);

        const candidatePromises = requestSnapshots.docs.map(async (requestDoc) => {
          const requestData = requestDoc.data();
          if (!requestData.seekerId) return null;
          
          const seekerDocRef = doc(db, "profiles", requestData.seekerId);
          const seekerDoc = await getDoc(seekerDocRef);

          if (!seekerDoc.exists()) {
            console.warn(`Seeker profile not found for ID: ${requestData.seekerId}`);
            return null;
          }
          
          const seekerData = seekerDoc.data();

          const experiencesWithDates = seekerData.experiences?.map((exp: any) => ({
              ...exp,
              from: exp.from?.toDate ? exp.from.toDate() : undefined,
              to: exp.to?.toDate ? exp.to.toDate() : undefined,
          })) || [];

          const totalExperience = calculateTotalExperienceInYears(experiencesWithDates);

          return {
              id: seekerDoc.id, 
              requestId: requestDoc.id, 
              name: seekerData.name || "Unnamed Candidate",
              avatar: seekerData.profilePic || "https://placehold.co/100x100.png",
              currentRole: seekerData.currentRole || "N/A",
              targetRole: seekerData.targetRole || "",
              company: seekerData.experiences?.[0]?.company || "",
              salary: seekerData.expectedSalary || 0,
              salaryCurrency: seekerData.expectedSalaryCurrency || 'USD',
              isSalaryVisible: seekerData.isSalaryVisible !== false,
              skills: seekerData.skills || [],
              location: seekerData.location || "Remote",
              experience: totalExperience,
              status: requestData.status || 'Pending',
              jobPostUrl: requestData.jobInfo || '',
              targetCompanies: seekerData.companies?.map((c: any) => c.name).filter(Boolean) || [],
          } as Candidate;
        });
        
        const candidates = (await Promise.all(candidatePromises)).filter(c => c !== null) as Candidate[];
        setRequestedCandidates(candidates);

      } catch (error: any) {
        console.error("Failed to fetch requested candidates:", error);
        toast({
            title: "Error fetching requests",
            description: "Could not load referral requests. Please try again later.",
            variant: "destructive",
        });
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
