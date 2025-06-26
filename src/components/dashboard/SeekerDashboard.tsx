import { ReferrerCard } from "./ReferrerCard";
import { ReferrerFilters } from "./ReferrerFilters";
import { mockReferrers } from "@/lib/data";

export function SeekerDashboard() {
  return (
    <div className="space-y-6">
      <ReferrerFilters />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockReferrers.map(referrer => (
          <ReferrerCard key={referrer.id} referrer={referrer} />
        ))}
      </div>
    </div>
  );
}
