"use client";

import { CandidateGrid } from "./CandidateGrid";
import { mockCandidates } from "@/lib/data";

export function ReferralRequestsPage() {
    // For demonstration, we'll show the first 3 candidates as "requests"
    const requestedCandidates = mockCandidates.slice(0, 3);
  
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
            <CandidateGrid candidates={requestedCandidates} />
        </div>
    );
}
