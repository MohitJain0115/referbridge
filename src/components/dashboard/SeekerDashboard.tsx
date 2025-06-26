"use client";

import { useState } from "react";
import { ReferrerCard } from "./ReferrerCard";
import { ReferrerFilters } from "./ReferrerFilters";
import { mockReferrers } from "@/lib/data";
import type { Referrer } from "@/lib/types";

export function SeekerDashboard() {
  const [filteredReferrers, setFilteredReferrers] = useState<Referrer[]>(mockReferrers);
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("all");
  const [field, setField] = useState("all");

  const handleApplyFilters = () => {
    let referrers = [...mockReferrers];

    if (search) {
      const lowercasedSearch = search.toLowerCase();
      referrers = referrers.filter(r => 
        r.name.toLowerCase().includes(lowercasedSearch) ||
        r.role.toLowerCase().includes(lowercasedSearch)
      );
    }

    if (company !== "all") {
      referrers = referrers.filter(r => r.company === company);
    }

    if (field !== "all") {
       const fieldKeywords: Record<string, string[]> = {
          'engineering': ['engineer', 'developer'],
          'product': ['product'],
          'design': ['design'],
          'data': ['data', 'scientist'],
          'marketing': ['marketing'],
      };
      if (fieldKeywords[field]) {
        referrers = referrers.filter(r => 
            fieldKeywords[field].some(keyword => r.role.toLowerCase().includes(keyword))
        );
      }
    }
    
    setFilteredReferrers(referrers);
  };

  return (
    <div className="space-y-6">
      <ReferrerFilters 
        search={search}
        setSearch={setSearch}
        company={company}
        setCompany={setCompany}
        field={field}
        setField={setField}
        onApplyFilters={handleApplyFilters}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredReferrers.length > 0 ? (
            filteredReferrers.map(referrer => (
              <ReferrerCard key={referrer.id} referrer={referrer} />
            ))
        ) : (
            <div className="col-span-full text-center text-muted-foreground py-10">
                No referrers match your criteria.
            </div>
        )}
      </div>
    </div>
  );
}
