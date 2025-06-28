"use client";

import { useState, useMemo, useEffect } from "react";
import { ReferrerCard } from "./ReferrerCard";
import { ReferrerFilters } from "./ReferrerFilters";
import { generateReferrers } from "@/ai/flows/referrers-flow";
import type { Referrer } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

function ReferrerGridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-[350px] w-full" />
      ))}
    </div>
  );
}

export function SeekerDashboard() {
  const [allReferrers, setAllReferrers] = useState<Referrer[]>([]);
  const [filteredReferrers, setFilteredReferrers] = useState<Referrer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("all");
  const [field, setField] = useState("all");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const generatedReferrers = await generateReferrers({ count: 12 });
        setAllReferrers(generatedReferrers);
        setFilteredReferrers(generatedReferrers);
      } catch (error) {
        console.error("Failed to generate referrers:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const availableCompanies = useMemo(() => {
    const companies = new Set(allReferrers.map(r => r.company));
    return Array.from(companies).sort();
  }, [allReferrers]);

  const isFiltered = useMemo(() => {
    return search !== "" || company !== "all" || field !== "all";
  }, [search, company, field]);

  const handleApplyFilters = () => {
    let referrers = [...allReferrers];

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

  const handleClearFilters = () => {
    setSearch("");
    setCompany("all");
    setField("all");
    setFilteredReferrers(allReferrers);
  };

  return (
    <div className="space-y-6">
      <ReferrerFilters 
        search={search}
        setSearch={setSearch}
        company={company}
        setCompany={setCompany}
        availableCompanies={availableCompanies}
        field={field}
        setField={setField}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
      />
      {isLoading ? (
        <ReferrerGridSkeleton />
      ) : (
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
      )}
    </div>
  );
}
