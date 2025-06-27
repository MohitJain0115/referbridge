"use client";

import { useState, useMemo } from "react";
import { CandidateCard } from "./CandidateCard";
import { CandidateFilters } from "./CandidateFilters";
import { mockCandidates } from "@/lib/data";
import type { Candidate } from "@/lib/types";

export function ReferrerDashboard() {
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(mockCandidates);
  const [search, setSearch] = useState("");
  const [experience, setExperience] = useState("all");
  const [role, setRole] = useState("all");

  const isFiltered = useMemo(() => {
    return search !== "" || experience !== "all" || role !== "all";
  }, [search, experience, role]);

  const handleApplyFilters = () => {
    let candidates = [...mockCandidates];

    if (search) {
      const lowercasedSearch = search.toLowerCase();
      candidates = candidates.filter(c => 
        c.name.toLowerCase().includes(lowercasedSearch) ||
        c.role.toLowerCase().includes(lowercasedSearch) ||
        c.skills.some(skill => skill.toLowerCase().includes(lowercasedSearch))
      );
    }

    if (experience !== "all") {
      switch (experience) {
        case '0-2':
          candidates = candidates.filter(c => c.experience >= 0 && c.experience <= 2);
          break;
        case '3-5':
          candidates = candidates.filter(c => c.experience >= 3 && c.experience <= 5);
          break;
        case '5+':
          candidates = candidates.filter(c => c.experience > 5);
          break;
      }
    }

    if (role !== "all") {
      const roleKeywords: Record<string, string[]> = {
          'frontend': ['frontend'],
          'product-manager': ['product manager'],
          'designer': ['designer']
      };
      if (roleKeywords[role]) {
        candidates = candidates.filter(c => 
            roleKeywords[role].some(keyword => c.role.toLowerCase().includes(keyword))
        );
      }
    }
    
    setFilteredCandidates(candidates);
  };

  const handleClearFilters = () => {
    setSearch("");
    setExperience("all");
    setRole("all");
    setFilteredCandidates(mockCandidates);
  };

  return (
    <div className="space-y-6">
      <CandidateFilters 
        search={search}
        setSearch={setSearch}
        experience={experience}
        setExperience={setExperience}
        role={role}
        setRole={setRole}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        isFiltered={isFiltered}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCandidates.length > 0 ? (
            filteredCandidates.map(candidate => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))
        ) : (
            <div className="col-span-full text-center text-muted-foreground py-10">
                No candidates match your criteria.
            </div>
        )}
      </div>
    </div>
  );
}
