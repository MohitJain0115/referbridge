"use client";

import { useState, useEffect } from "react";
import { CandidateGrid } from "./CandidateGrid";
import { generateCandidates } from "@/ai/flows/candidates-flow";
import type { Candidate } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const generatedCandidates = await generateCandidates({ count: 12 });
        setCandidates(generatedCandidates);
      } catch (error) {
        console.error("Failed to generate candidates:", error);
        // Optionally, set an error state and show a message to the user
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {isLoading ? <CandidateGridSkeleton /> : <CandidateGrid candidates={candidates} />}
    </div>
  );
}
