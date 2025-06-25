import { CandidateCard } from "./CandidateCard";
import { CandidateFilters } from "./CandidateFilters";
import { mockCandidates } from "@/lib/data";

export function ReferrerDashboard() {
  return (
    <div className="space-y-6">
      <CandidateFilters />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockCandidates.map(candidate => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
    </div>
  );
}
