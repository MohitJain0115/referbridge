"use client";

import { useState, useEffect } from "react";
import { CandidateGrid } from "./CandidateGrid";
import { generateCandidates } from "@/ai/flows/candidates-flow";
import type { Candidate } from "@/ai/flows/candidates-flow";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [requestedCandidates, setRequestedCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // For demonstration, we'll fetch a smaller number of candidates to represent "requests"
        const generatedCandidates = await generateCandidates({ count: 3 });
        setRequestedCandidates(generatedCandidates);
      } catch (error) {
        console.error("Failed to generate requested candidates:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

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
      {isLoading ? <CandidateGridSkeleton /> : <CandidateGrid candidates={requestedCandidates} />}
    </div>
  );
}
