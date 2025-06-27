"use client";

import { CandidateGrid } from "./CandidateGrid";
import { mockCandidates } from "@/lib/data";

export function ReferrerDashboard() {
  return (
    <div className="space-y-6">
      <CandidateGrid candidates={mockCandidates} />
    </div>
  );
}
